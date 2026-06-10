import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { M08SalesEngagementRepository } from '../repositories/m08.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { 
  CreatePlayDto, 
  UpdatePlayDto, 
  EnrollPlayDto, 
  CompleteStepDto, 
  SkipStepDto, 
  CreateNoteDto 
} from '../schemas/m08.schema';

@Injectable()
export class M08SalesEngagementService {
  constructor(
    @Inject(M08SalesEngagementRepository) private readonly repo: M08SalesEngagementRepository,
    @Inject(EventPublisherService) private readonly events: EventPublisherService,
    @InjectQueue('m08-queue') private readonly queue: Queue,
  ) {}

  // --- PLAY lifecycle & MANAGEMENT ---

  async getPlays(tenantId: string): Promise<any> {
    return this.repo.findPlays(tenantId);
  }

  async getPlayById(tenantId: string, playId: string): Promise<any> {
    return this.repo.findPlayById(tenantId, playId);
  }

  async createPlay(dto: CreatePlayDto, tenantId: string, userId: string): Promise<any> {
    const play = await this.repo.createPlay(tenantId, userId, dto);
    await this.events.publish('play.created', {
      playId: play.id,
      tenantId,
      name: play.name,
      createdBy: userId,
    });
    return play;
  }

  async updatePlay(playId: string, dto: UpdatePlayDto, tenantId: string): Promise<any> {
    return this.repo.updatePlay(tenantId, playId, dto);
  }

  async clonePlay(playId: string, tenantId: string, userId: string): Promise<any> {
    const cloned = await this.repo.clonePlay(tenantId, playId, userId);
    await this.events.publish('play.created', {
      playId: cloned.id,
      tenantId,
      name: cloned.name,
      createdBy: userId,
      clonedFrom: playId,
    });
    return cloned;
  }

  async deactivatePlay(playId: string, tenantId: string): Promise<any> {
    return this.repo.deactivatePlay(tenantId, playId);
  }

  // --- PLAY ENROLLMENT ENGINE ---

  async enrollOpportunity(dto: EnrollPlayDto, tenantId: string): Promise<any> {
    // Unique check to guarantee idempotency
    if (dto.triggerEventId) {
      const existing = await this.repo.checkIdempotency(tenantId, dto.playId, dto.dealId, dto.triggerEventId);
      if (existing) {
        console.warn(`[Duplicate Enrollment Skipped] Play ${dto.playId} is already active for deal ${dto.dealId} under event ${dto.triggerEventId}`);
        return existing;
      }
    }

    const enrollment = await this.repo.createEnrollment(
      tenantId,
      dto.playId,
      dto.dealId,
      dto.userId,
      dto.triggerEventId
    );

    // Calculate initial adherence score (0%)
    await this.repo.logAdherence(tenantId, enrollment.id, dto.userId, dto.playId, 0.0);

    // Emit event separating enrollment from immediate action
    await this.events.publish('play.activated', {
      enrollmentId: enrollment.id,
      tenantId,
      playId: dto.playId,
      dealId: dto.dealId,
      userId: dto.userId,
      status: enrollment.status,
    });

    // Decoupled integrations: simulated notifications (Slack/Email)
    await this.triggerOutreachAlerts(tenantId, enrollment.id, 'enrolled');

    return enrollment;
  }

  async getEnrollments(tenantId: string, filters: any): Promise<any> {
    return this.repo.findEnrollments(tenantId, filters);
  }

  async getEnrollmentById(tenantId: string, enrollmentId: string): Promise<any> {
    return this.repo.findEnrollmentById(tenantId, enrollmentId);
  }

  // --- PLAY STEP ACTIONS ---

  async completeStep(enrollmentId: string, dto: CompleteStepDto, tenantId: string, userId: string): Promise<any> {
    const updated = await this.repo.completeStep(
      tenantId,
      enrollmentId,
      dto.stepId,
      userId,
      dto.notes
    );

    // Calculate updated adherence score
    const totalSteps = (updated.play.steps as any[]).length;
    const completedSteps = updated.completions.length;
    const score = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 100;

    await this.repo.logAdherence(tenantId, enrollmentId, updated.userId, updated.playId, score);

    // Emit events
    await this.events.publish('play.step.completed', {
      enrollmentId,
      tenantId,
      stepId: dto.stepId,
      completedBy: userId,
      adherenceScore: score,
    });

    await this.events.publish('adherence.updated', {
      enrollmentId,
      tenantId,
      userId: updated.userId,
      adherenceScore: score,
    });

    if (updated.status === 'completed') {
      await this.events.publish('play.completed', {
        enrollmentId,
        tenantId,
        playId: updated.playId,
        dealId: updated.dealId,
        completedAt: new Date(),
      });
    }

    return updated;
  }

  async skipStep(enrollmentId: string, dto: SkipStepDto, tenantId: string, userId: string): Promise<any> {
    const updated = await this.repo.skipStep(
      tenantId,
      enrollmentId,
      dto.stepId,
      userId,
      dto.reason
    );

    // Calculate updated adherence score (skips count as completed/adhered but logged separately)
    const totalSteps = (updated.play.steps as any[]).length;
    const completedSteps = updated.completions.length;
    const score = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 100;

    await this.repo.logAdherence(tenantId, enrollmentId, updated.userId, updated.playId, score);

    // Emit events
    await this.events.publish('play.step.skipped', {
      enrollmentId,
      tenantId,
      stepId: dto.stepId,
      skippedBy: userId,
      reason: dto.reason,
      adherenceScore: score,
    });

    await this.events.publish('adherence.updated', {
      enrollmentId,
      tenantId,
      userId: updated.userId,
      adherenceScore: score,
    });

    if (updated.status === 'completed') {
      await this.events.publish('play.completed', {
        enrollmentId,
        tenantId,
        playId: updated.playId,
        dealId: updated.dealId,
        completedAt: new Date(),
      });
    }

    return updated;
  }

  async addNote(enrollmentId: string, dto: CreateNoteDto, tenantId: string, userId: string): Promise<any> {
    return this.repo.createNote(tenantId, enrollmentId, userId, dto.noteText);
  }

  // --- ANALYTICS DASHBOARDS ---

  async getAdoptionDashboard(tenantId: string): Promise<any> {
    return this.repo.getAdoptionAnalytics(tenantId);
  }

  async getRepDashboard(tenantId: string): Promise<any> {
    return this.repo.getRepLeaderboard(tenantId);
  }

  async getPlayDashboard(tenantId: string): Promise<any> {
    return this.repo.getPlayAnalytics(tenantId);
  }

  // --- EVENT-DRIVEN AUTOMATIC TRIGGER RULES EVALUATOR ---

  async evaluateTriggers(eventType: string, payload: any, tenantId: string): Promise<any> {
    console.log(`[Trigger Engine] Evaluating rules for consumed event: ${eventType} in tenant ${tenantId}`);
    
    // Find active plays for this event type
    const matchingPlays = await this.repo.findActivePlaysForTrigger(tenantId, eventType);
    
    for (const play of matchingPlays) {
      const conditions = (play.triggerConditions as any[]) || [];
      let isMatch = true;

      for (const cond of conditions) {
        if (cond.eventType !== eventType) continue;

        const val = payload[cond.field];
        if (cond.operator === 'equals' && String(val) !== String(cond.value)) {
          isMatch = false;
          break;
        }
        if (cond.operator === 'contains' && (!val || !String(val).includes(cond.value))) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        console.log(`[Trigger Match Success] Auto-enrolling Deal ${payload.dealId} into Playbook "${play.name}"`);
        
        // Asynchronous non-blocking auto-enrollment queue request
        await this.queue.add('process-auto-enrollment', {
          tenantId,
          playId: play.id,
          dealId: payload.dealId,
          userId: payload.ownerId || payload.userId || '00000000-0000-0000-0000-000000000000',
          triggerEventId: payload.eventId || '00000000-0000-0000-0000-000000000000',
        }, {
          attempts: 3,
          backoff: 5000,
          removeOnComplete: true,
        });
      }
    }
  }

  
  // --- BFF MIGRATION: TASK MAPPING & AGGREGATIONS ---

  async fetchManagerTasks(tenantId: string, query: any, userId: string, userRole: string) {
    let targetAssigneeId = query.assigneeId;
    if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
      targetAssigneeId = userId;
    } else if (targetAssigneeId === 'me') {
      targetAssigneeId = userId;
    }

    const whereClause: any = { tenantId };
    if (targetAssigneeId && targetAssigneeId !== 'all') {
      whereClause.userId = targetAssigneeId;
    }

    // @ts-ignore
    const rawTasks = await this.repo.prisma.task.findMany({ where: whereClause });
    const todayStr = query.date || new Date().toISOString().split('T')[0];

    const mappedTasks = rawTasks.map((t: any) => ({
      id: t.id,
      title: t.description || 'Task',
      contactName: 'Unknown Contact', // Real schema gap
      companyName: 'Unknown Company',
      channel: t.type || 'custom',
      scheduledTime: '',
      dueDateTime: t.dueDate ? t.dueDate.toISOString() : '',
      isOverdue: t.dueDate ? t.dueDate < new Date() && t.status !== 'completed' : false,
      isAtRisk: false,
      interactionCount: 0,
      priority: t.priority === 1 ? 'high' : t.priority === 2 ? 'normal' : 'low',
      status: t.status || 'pending',
      dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : '',
      dueTime: '',
      assigneeId: t.userId || 'me',
      assigneeName: 'Assignee',
      assigneeRole: 'Rep',
      arr: '',
      todoType: 'manual',
      entityType: 'lead',
      workflowName: '',
      aiSignal: '',
      aiSignalType: '',
    }));

    const getCounts = (taskList: any[]) => ({
      today: taskList.filter((t) => ((t.dueDate && t.dueDate <= todayStr) || t.priority === 'high') && t.status !== 'completed').length,
      inProgress: taskList.filter((t) => t.status === 'in_progress').length,
      upcoming: taskList.filter((t) => t.dueDate && t.dueDate > todayStr && t.priority !== 'high' && t.status !== 'completed').length,
      completed: taskList.filter((t) => t.status === 'completed').length,
      snooze: 0,
    });

    let list = mappedTasks;
    if (query.channel && query.channel !== 'all') {
      list = list.filter((t) => t.channel === query.channel.toLowerCase());
    }

    const tabCounts = getCounts(list);
    const currentTab = query.tab || 'today';

    switch (currentTab) {
      case 'today':
        list = list.filter((t) => ((t.dueDate && t.dueDate <= todayStr) || t.priority === 'high') && t.status !== 'completed');
        break;
      case 'inProgress':
        list = list.filter((t) => t.status === 'in_progress');
        break;
      case 'upcoming':
        list = list.filter((t) => t.dueDate && t.dueDate > todayStr && t.priority !== 'high' && t.status !== 'completed');
        break;
      case 'completed':
        list = list.filter((t) => t.status === 'completed');
        break;
    }

    if (query.search?.trim()) {
      const q = query.search.toLowerCase();
      list = list.filter((t) => String(t.title).toLowerCase().includes(q));
    }

    const page = query.page ? parseInt(query.page) : 1;
    const size = query.size ? parseInt(query.size) : 50;
    const total = list.length;
    const totalPages = Math.ceil(total / size) || 1;
    const pagedTasks = list.slice((page - 1) * size, page * size);

    const highPriority = pagedTasks.filter((t) => t.priority === 'high');
    const normalPriority = pagedTasks.filter((t) => t.priority !== 'high');

    const groups = [];
    if (highPriority.length) groups.push({ groupLabel: 'High Priority', count: highPriority.length, tasks: highPriority });
    if (normalPriority.length || !highPriority.length) groups.push({ groupLabel: 'All Tasks', count: normalPriority.length, tasks: normalPriority });

    return {
      status: 'success',
      data: {
        groups,
        tabCounts,
        statusPills: { atRisk: 0, dueToday: tabCounts.today },
        pagination: { page, size, total, totalPages },
      },
    };
  }

  async fetchSummary(tenantId: string, assigneeId: string, date: string, userId: string, userRole: string) {
    let targetAssigneeId = assigneeId;
    if (userRole === 'SALES_REP' || userRole === 'sales_rep') targetAssigneeId = userId;
    else if (targetAssigneeId === 'me') targetAssigneeId = userId;

    const whereClause: any = { tenantId };
    if (targetAssigneeId && targetAssigneeId !== 'all') whereClause.userId = targetAssigneeId;

    // @ts-ignore
    const rawTasks = await this.repo.prisma.task.findMany({ where: whereClause });
    const todayTasks = rawTasks.filter((t: any) => t.dueDate && t.dueDate.toISOString().split('T')[0] === date);

    const completedToday = todayTasks.filter((t: any) => t.status === 'completed').length;
    const totalToday = todayTasks.length;
    const highPriorityRemaining = todayTasks.filter((t: any) => t.priority === 1 && t.status !== 'completed').length;
    const atRisk = 0;
    const completionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    return {
      status: 'success',
      data: {
        totalToday,
        completedToday,
        atRisk,
        dueToday: totalToday,
        highPriorityRemaining,
        completionPercentage,
        headerAlert: `${highPriorityRemaining} high-priority deals need attention today`,
      },
    };
  }

  async fetchFiltersConfig(tenantId: string) {
    return {
      status: 'success',
      data: {
        flows: ['Enterprise Outbound', 'Mid-Market Follow-up'],
        entityTypes: ['account', 'deal', 'lead'],
        localTimes: ['morning', 'business_hours'],
      },
    };
  }

  async fetchTeamMembers(tenantId: string) {
    // @ts-ignore
    const users = await this.repo.prisma.user.findMany({ where: { tenantId } });
    return {
      status: 'success',
      data: users.map((u: any) => ({ id: u.id, name: u.name, role: u.role })),
    };
  }

  async searchLinkedEntities(tenantId: string, search: string) {
    return { status: 'success', data: { results: [] } };
  }

  async emailTemplates(tenantId: string) {
    return { status: 'success', data: { templates: [] } };
  }

  // --- PRIVATE DECOUPLED NOTIFICATION ALERTS INTERNALS ---

  private async triggerOutreachAlerts(tenantId: string, enrollmentId: string, actionType: string): Promise<any> {
    try {
      await this.events.publish('notification.alert.requested', {
        tenantId,
        channel: 'slack',
        body: `Sales play enrollment ${actionType}: ${enrollmentId}`,
        metadata: { enrollmentId, actionType, module: 'm08-sales-engagement' },
      });
      await this.events.publish('notification.alert.requested', {
        tenantId,
        channel: 'email',
        subject: 'Sales play enrollment',
        body: `Enrollment ${enrollmentId} — action: ${actionType}`,
        metadata: { enrollmentId, actionType, module: 'm08-sales-engagement' },
      });
    } catch (e) {
      console.error('[Integration Alerts Suppressed] Non-blocking notification issue.', e);
    }
  }
}
