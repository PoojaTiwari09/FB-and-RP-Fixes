import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { M08SalesEngagementRepository } from '../repositories/m08.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { randomUUID } from 'crypto';
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

  async triggerOutreachAlerts(tenantId: string, enrollmentId: string, status: string) {
    console.log(`[Outreach Alert] Triggered outreach alert for enrollment ${enrollmentId} with status ${status}`);
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

  async validateTaskAccess(tenantId: string, taskId: string, userId: string, userRole: string) {
    // @ts-ignore
    const task = await this.repo.prisma.engageTask.findFirst({
      where: { tenantid: tenantId, taskId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    const isRep = userRole === 'SALES_REP' || userRole === 'sales_rep';
    if (isRep && task.assigneeId !== userId && task.assigneeId !== 'me') {
      throw new ForbiddenException('Forbidden resource');
    }
    return task;
  }

  async fetchManagerTasks(tenantId: string, query: any, userId: string, userRole: string) {
    let targetAssigneeId = query.assigneeId;
    if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
      targetAssigneeId = userId;
    } else if (targetAssigneeId === 'me') {
      targetAssigneeId = userId;
    }

    const whereClause: any = { tenantid: tenantId };
    if (targetAssigneeId && targetAssigneeId !== 'all') {
      whereClause.assigneeId = targetAssigneeId === userId ? { in: [userId, 'me'] } : targetAssigneeId;
    }

    // @ts-ignore
    const rawTasks = await this.repo.prisma.engageTask.findMany({ where: whereClause });
    const todayStr = query.date || new Date().toISOString().split('T')[0];

    const now = new Date();
    const isCurrentlySnoozed = (t: any) => {
      if (!t.snoozedUntil) return false;
      return new Date(t.snoozedUntil) > now;
    };

    const mappedTasks = rawTasks.map((t: any) => ({
      id: t.taskId,
      title: t.title || '',
      contactName: t.contactName || '',
      companyName: t.companyName || '',
      channel: t.channel ? t.channel.toLowerCase() : 'custom',
      scheduledTime: t.scheduledTime || '',
      dueDateTime: t.dueDateTime || '',
      isOverdue: t.isOverdue || false,
      isAtRisk: t.isAtRisk || false,
      interactionCount: t.interactionCount || 0,
      priority: t.priority ? t.priority.toLowerCase() : 'normal',
      status: t.status ? t.status.toLowerCase() : 'pending',
      dueDate: t.dueDate || '',
      dueTime: t.dueTime || '',
      assigneeId: t.assigneeId || 'me',
      assigneeName: t.assigneeName || 'Alex Morgan',
      assigneeRole: t.assigneeRole || 'Account Executive',
      arr: t.arr || '',
      todoType: t.todoType || 'manual',
      entityType: t.entityType || 'lead',
      workflowName: t.workflowName || '',
      workflowStep: t.workflowStep ? parseInt(t.workflowStep, 10) : undefined,
      totalWorkflowSteps: t.totalWorkflowSteps || undefined,
      aiSignal: t.aiSignal || '',
      aiSignalType: t.aiSignalType || '',
      snoozedUntil: t.snoozedUntil,
    }));

    const getCounts = (taskList: any[]) => ({
      today: taskList.filter((t) => ((t.dueDate && t.dueDate <= todayStr) || t.priority === 'high') && t.status !== 'completed' && !isCurrentlySnoozed(t)).length,
      inProgress: taskList.filter((t) => t.status === 'in_progress' && !isCurrentlySnoozed(t)).length,
      upcoming: taskList.filter((t) => t.dueDate && t.dueDate > todayStr && t.priority !== 'high' && t.status !== 'completed' && !isCurrentlySnoozed(t)).length,
      completed: taskList.filter((t) => t.status === 'completed').length,
      snooze: taskList.filter((t) => isCurrentlySnoozed(t)).length,
    });

    let list = mappedTasks;
    if (query.channel && query.channel !== 'all') {
      list = list.filter((t) => t.channel === query.channel.toLowerCase());
    }

    const tabCounts = getCounts(list);
    const currentTab = query.tab || 'today';

    switch (currentTab) {
      case 'today':
        list = list.filter((t) => ((t.dueDate && t.dueDate <= todayStr) || t.priority === 'high') && t.status !== 'completed' && !isCurrentlySnoozed(t));
        break;
      case 'inProgress':
        list = list.filter((t) => t.status === 'in_progress' && !isCurrentlySnoozed(t));
        break;
      case 'upcoming':
        list = list.filter((t) => t.dueDate && t.dueDate > todayStr && t.priority !== 'high' && t.status !== 'completed' && !isCurrentlySnoozed(t));
        break;
      case 'completed':
        list = list.filter((t) => t.status === 'completed');
        break;
      case 'snoozed':
        list = list.filter((t) => isCurrentlySnoozed(t));
        break;
    }

    if (query.search?.trim()) {
      const q = query.search.toLowerCase();
      list = list.filter((t) => 
        String(t.title).toLowerCase().includes(q) ||
        String(t.contactName).toLowerCase().includes(q) ||
        String(t.companyName).toLowerCase().includes(q)
      );
    }

    // --- Server-side filter support for FilterDrawer ---
    if (query.filterDueDate) {
      const today = new Date();
      const todayFilterStr = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      if (query.filterDueDate === 'today') {
        list = list.filter((t) => t.dueDate === todayFilterStr);
      } else if (query.filterDueDate === 'tomorrow') {
        list = list.filter((t) => t.dueDate === tomorrowStr);
      } else if (query.filterDueDate === 'this-week') {
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 7);
        const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
        list = list.filter((t) => t.dueDate && t.dueDate >= todayFilterStr && t.dueDate <= endOfWeekStr);
      } else if (query.filterDueDate === 'overdue') {
        list = list.filter((t) => t.isOverdue || (t.dueDate && t.dueDate < todayFilterStr));
      }
    }

    if (query.filterEntityTypes) {
      const allowedTypes = query.filterEntityTypes.split(',').map((s: string) => s.trim().toLowerCase());
      list = list.filter((t) => allowedTypes.includes((t.entityType || 'lead').toLowerCase()));
    }

    if (query.filterLocalTime) {
      const parseTime24h = (timeStr?: string | null): number => {
        if (!timeStr) return 12;
        const clean = timeStr.trim().toUpperCase();
        const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/);
        if (!match) return 12;
        let hour = parseInt(match[1], 10);
        const meridiem = match[3];
        if (meridiem === 'PM' && hour < 12) hour += 12;
        if (meridiem === 'AM' && hour === 12) hour = 0;
        return hour;
      };
      if (query.filterLocalTime === 'morning') {
        list = list.filter((t) => {
          const h = parseTime24h(t.dueTime || t.scheduledTime);
          return h >= 6 && h < 12;
        });
      } else if (query.filterLocalTime === 'business_hours') {
        list = list.filter((t) => {
          const h = parseTime24h(t.dueTime || t.scheduledTime);
          return h >= 9 && h < 18;
        });
      }
    }

    const sorted = [...list];
    const sortBy = query.sortBy || 'due_date';
    if (sortBy === 'priority') {
      const order: Record<string, number> = { high: 0, normal: 1, low: 2 };
      sorted.sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
    } else if (sortBy === 'recent_activity') {
      sorted.sort((a, b) => String(b.dueDate).localeCompare(String(a.dueDate)));
    } else {
      sorted.sort((a, b) => {
        const d = String(a.dueDate).localeCompare(String(b.dueDate));
        return d !== 0 ? d : String(a.dueTime || '').localeCompare(String(b.dueTime || ''));
      });
    }

    const page = query.page ? parseInt(query.page) : 1;
    const size = query.size ? parseInt(query.size) : 50;
    const total = sorted.length;
    const totalPages = Math.ceil(total / size) || 1;
    const pagedTasks = sorted.slice((page - 1) * size, page * size);

    const atRisk = pagedTasks.filter((t) => t.aiSignalType === 'risk').length;
    const dueToday = pagedTasks.filter((t) => t.dueDate === todayStr).length;

    // Group tasks: 'High Priority' includes tasks with priority=high OR dueDate <= today (urgent)
    const highPriority = pagedTasks.filter((t) => t.priority === 'high' || (t.dueDate && t.dueDate <= todayStr && t.status !== 'completed'));
    const highPriorityIds = new Set(highPriority.map(t => t.id));
    const normalPriority = pagedTasks.filter((t) => !highPriorityIds.has(t.id));

    const groups = [];
    if (highPriority.length) groups.push({ groupLabel: 'High Priority', count: highPriority.length, tasks: highPriority });
    if (normalPriority.length || !highPriority.length) groups.push({ groupLabel: 'All Tasks', count: normalPriority.length, tasks: normalPriority });

    return {
      groups,
      tabCounts,
      statusPills: { atRisk, dueToday },
      pagination: { page, size, total, totalPages },
    };
  }

  async fetchSummary(tenantId: string, assigneeId: string, date: string, userId: string, userRole: string) {
    let targetAssigneeId = assigneeId;
    if (userRole === 'SALES_REP' || userRole === 'sales_rep') targetAssigneeId = userId;
    else if (targetAssigneeId === 'me') targetAssigneeId = userId;

    const whereClause: any = { tenantid: tenantId };
    if (targetAssigneeId && targetAssigneeId !== 'all') {
      whereClause.assigneeId = targetAssigneeId === userId ? { in: [userId, 'me'] } : targetAssigneeId;
    }

    // @ts-ignore
    const rawTasks = await this.repo.prisma.engageTask.findMany({ where: whereClause });
    const now = new Date();
    const isCurrentlySnoozed = (t: any) => {
      if (!t.snoozedUntil) return false;
      return new Date(t.snoozedUntil) > now;
    };
    const activeList = rawTasks.filter((t: any) => !isCurrentlySnoozed(t));

    const todayTasks = activeList.filter((t: any) => t.dueDate === date);

    const completedToday = todayTasks.filter((t: any) => t.status.toLowerCase() === 'completed').length;
    const totalToday = todayTasks.length;
    const highPriorityRemaining = todayTasks.filter((t: any) => t.priority.toLowerCase() === 'high' && t.status.toLowerCase() !== 'completed').length;
    const atRisk = activeList.filter((t: any) => t.isAtRisk && t.status.toLowerCase() !== 'completed').length;
    const completionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    return {
      totalToday,
      completedToday,
      atRisk,
      dueToday: totalToday,
      highPriorityRemaining,
      completionPercentage,
      headerAlert: `${highPriorityRemaining} high-priority deals need attention today — ${atRisk} at risk of slipping`,
    };
  }

  async fetchRepSummary(tenantId: string, userId: string, userRole: string) {
    const assigneeId = (userRole === 'SALES_REP' || userRole === 'sales_rep') ? userId : 'all';
    const whereClause: any = { tenantid: tenantId };
    if (assigneeId !== 'all') {
      whereClause.assigneeId = { in: [assigneeId, 'me'] };
    }
    
    // @ts-ignore
    const rawTasks = await this.repo.prisma.engageTask.findMany({ where: whereClause });
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const isCurrentlySnoozed = (t: any) => {
      if (!t.snoozedUntil) return false;
      return new Date(t.snoozedUntil) > now;
    };

    const activeList = rawTasks.filter((t: any) => !isCurrentlySnoozed(t));
    
    const totalTasksToday = activeList.filter((t: any) => ((t.dueDate && t.dueDate <= todayStr) || t.priority.toUpperCase() === 'HIGH') && t.status.toLowerCase() !== 'completed' && !isCurrentlySnoozed(t)).length;
    const completedCount = rawTasks.filter((t: any) => t.status.toLowerCase() === 'completed').length;
    const inProgressCount = activeList.filter((t: any) => t.status.toLowerCase() === 'in_progress').length;
    const upcomingCount = activeList.filter((t: any) => t.dueDate && t.dueDate > todayStr && t.priority.toUpperCase() !== 'HIGH' && t.status.toLowerCase() !== 'completed' && !isCurrentlySnoozed(t)).length;
    const atRiskCount = activeList.filter((t: any) => t.isAtRisk && t.status.toLowerCase() !== 'completed').length;
    const dueTodayCount = activeList.filter((t: any) => t.dueDate === todayStr).length;
    const highPriorityCount = activeList.filter((t: any) => t.priority.toUpperCase() === 'HIGH' && t.status.toLowerCase() !== 'completed').length;
    const snoozedCount = rawTasks.filter((t: any) => isCurrentlySnoozed(t)).length;
    
    const totalCount = totalTasksToday + completedCount;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    return {
      totalTasksToday,
      completedCount,
      inProgressCount,
      upcomingCount,
      atRiskCount,
      dueTodayCount,
      highPriorityCount,
      progressPercent,
      snoozedCount,
    };
  }

  async fetchFiltersConfig(tenantId: string) {
    return {
      flows: ['Enterprise Outbound Q2 2026', 'Mid-Market Follow-up', 'Social Selling Campaign'],
      entityTypes: ['account', 'deal', 'lead'],
      localTimes: ['morning', 'business_hours', 'custom'],
    };
  }

  async fetchTeamMembers(tenantId: string) {
    // @ts-ignore
    const users = await this.repo.prisma.user.findMany({ 
      where: { tenantid: tenantId },
      orderBy: { name: 'asc' }
    });
    return users.map((u: any) => ({
      id: u.id,
      name: u.name ?? u.email,
      role: u.role === 'MANAGER' ? 'Team Lead' : 'Account Executive',
    }));
  }

  async searchLinkedEntities(tenantId: string, search: string) {
    // @ts-ignore
    const contacts = await this.repo.prisma.engageContact.findMany({
      where: { tenantid: tenantId },
    });
    const list = contacts.map((c: any) => ({
      id: c.contactId,
      name: c.contactName,
      type: 'contact',
      subLabel: `${c.jobTitle || 'Executive'} · ${c.company || 'Company'}`,
    }));
    const q = search.toLowerCase();
    const filtered = list.filter((i) => i.name.toLowerCase().includes(q) || i.subLabel.toLowerCase().includes(q));
    return {
      results: filtered,
    };
  }

  async emailTemplates(tenantId: string) {
    // @ts-ignore
    const templates = await this.repo.prisma.emailTemplate.findMany({
      where: { tenantid: tenantId },
    });
    return {
      templates: templates.map((t: any) => ({
        id: t.templateId,
        name: t.templateName,
        subject: t.subject,
        body: t.bodyHtml,
      }))
    };
  }

  async fetchRecentActivities(tenantId: string) {
    // @ts-ignore
    const activities = await this.repo.prisma.engageActivity.findMany({
      where: { tenantid: tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return activities.map((a: any) => ({
      id: a.activityId,
      activityId: a.activityId,
      contactId: a.contactId || '',
      contactName: a.contactName,
      companyName: a.company || '',
      company: a.company || '',
      activityType: a.channelType.toLowerCase(),
      channelType: a.channelType ? a.channelType.toUpperCase() : 'CUSTOM',
      description: a.summary,
      summary: a.summary,
      timeAgo: a.timeAgoLabel || '1h ago',
      timeAgoLabel: a.timeAgoLabel || '1h ago',
      occurredAt: a.occurredAt || a.createdAt.toISOString(),
    }));
  }

  async fetchTaskDetail(tenantId: string, taskId: string, userId: string, userRole: string) {
    const t = await this.validateTaskAccess(tenantId, taskId, userId, userRole);
    return {
      id: t.taskId,
      taskId: t.taskId,
      title: t.title,
      taskTitle: t.title || '',
      contactId: t.contactId || '',
      contactName: t.contactName,
      company: t.companyName,
      companyName: t.companyName,
      channel: t.channel.toLowerCase(),
      scheduledTime: t.scheduledTime || '',
      scheduledDateTime: t.dueDateTime || '',
      dueDateTime: t.dueDateTime || '',
      isOverdue: t.isOverdue,
      isAtRisk: t.isAtRisk,
      interactionCount: t.interactionCount,
      priority: t.priority.toUpperCase(),
      status: t.status.toUpperCase(),
      dueDate: t.dueDate,
      dueTime: t.dueTime || '',
      assigneeId: t.assigneeId || 'me',
      assigneeName: t.assigneeName || 'Alex Morgan',
      assigneeRole: t.assigneeRole || 'Account Executive',
      arr: t.arr || '',
      arrValue: t.arr || '',
      todoType: t.todoType || 'manual',
      entityType: t.entityType || 'lead',
      workflowName: t.workflowName || '',
      workflowStep: t.workflowStep ? parseInt(t.workflowStep, 10) : undefined,
      totalWorkflowSteps: t.totalWorkflowSteps || undefined,
      aiSignal: t.aiSignal || '',
      aiSignalType: t.aiSignalType || '',
      aiInsight: t.aiInsight || '',
      recommendedNextSteps: t.recommendedNextSteps || [],
      recentActivity: t.recentActivity || [],
      existingNotes: t.notes || '',
      notes: t.notes || '',
      snoozedUntil: t.snoozedUntil || null,
    };
  }

  async fetchEmailDraft(tenantId: string, taskId: string, userId: string, userRole: string) {
    await this.validateTaskAccess(tenantId, taskId, userId, userRole);
    // @ts-ignore
    const d = await this.repo.prisma.emailDraft.findFirst({
      where: { tenantid: tenantId, taskId },
    });
    // @ts-ignore
    const t = await this.repo.prisma.engageTask.findFirst({
      where: { tenantid: tenantId, taskId },
    });
    if (!d) {
      // 1. Retrieve the contact's email by looking up EngageContact using t.contactId or t.contactName
      let contactEmail = 'client@company.com';
      let contactName = t?.contactName || 'Client';

      if (t) {
        if (t.contactId) {
          // @ts-ignore
          const contact = await this.repo.prisma.engageContact.findFirst({
            where: { tenantid: tenantId, contactId: t.contactId },
          });
          if (contact) {
            contactEmail = contact.email || contactEmail;
            contactName = contact.contactName || contactName;
          }
        } else if (t.contactName) {
          // @ts-ignore
          const contact = await this.repo.prisma.engageContact.findFirst({
            where: { tenantid: tenantId, contactName: t.contactName },
          });
          if (contact) {
            contactEmail = contact.email || contactEmail;
            contactName = contact.contactName || contactName;
          }
        }
      }

      // 2. Query CallRecord (and include transcript) filtering by participant name t.contactName and status completed.
      let callRecord = null;
      if (t?.contactName) {
        // @ts-ignore
        callRecord = await this.repo.prisma.callRecord.findFirst({
          where: {
            tenantid: tenantId,
            transcriptStatus: 'completed',
            participants: {
              has: t.contactName,
            },
          },
          include: {
            transcript: true,
          },
          orderBy: {
            callDate: 'desc',
          },
        });
      }

      // 3. Fall back to the latest completed CallRecord and Transcript in the database if no participant call record matches.
      if (!callRecord) {
        // @ts-ignore
        callRecord = await this.repo.prisma.callRecord.findFirst({
          where: {
            tenantid: tenantId,
            transcriptStatus: 'completed',
          },
          include: {
            transcript: true,
          },
          orderBy: {
            callDate: 'desc',
          },
        });
      }

      // 4. Build a dynamic, contextual email subject and HTML body using the retrieved transcript summary and task action items/notes.
      let subject = 'Outreach Follow-up';
      let body = 'Hi, following up on our connection.';
      let bodyHtml = '<p>Hi, following up on our connection.</p>';

      if (callRecord) {
        subject = `Follow-up: ${callRecord.title}`;
        const summary = callRecord.transcript?.summary || 'We had a great discussion regarding our solutions.';
        
        let nextStepsSection = '';
        if (t?.recommendedNextSteps && t.recommendedNextSteps.length > 0) {
          nextStepsSection = `\n\nHere are the next steps we outlined:\n` + t.recommendedNextSteps.map(step => `• ${step}`).join('\n');
        } else if (t?.notes) {
          nextStepsSection = `\n\nHere are some key notes from our discussion:\n${t.notes}`;
        }

        body = `Hi ${contactName.split(' ')[0]},\n\nFollowing up on our call: "${callRecord.title}".\n\nHere is a quick summary of what we discussed:\n${summary}${nextStepsSection}\n\nLooking forward to working together.\n\nBest,\nAlex`;

        // Formulate HTML body
        const escapedSummary = summary.replace(/\n/g, '<br/>');
        let htmlNextSteps = '';
        if (t?.recommendedNextSteps && t.recommendedNextSteps.length > 0) {
          htmlNextSteps = `<p><strong>Here are the next steps we outlined:</strong></p><ul>` + t.recommendedNextSteps.map(step => `<li>${step}</li>`).join('') + `</ul>`;
        } else if (t?.notes) {
          htmlNextSteps = `<p><strong>Notes from our discussion:</strong><br/>${t.notes.replace(/\n/g, '<br/>')}</p>`;
        }

        bodyHtml = `<p>Hi ${contactName.split(' ')[0]},</p><p>Following up on our call: "<strong>${callRecord.title}</strong>".</p><p>Here is a quick summary of what we discussed:<br/>${escapedSummary}</p>${htmlNextSteps}<p>Looking forward to working together.</p><p>Best,<br/>Alex</p>`;
      }

      return {
        taskId,
        contactName,
        contactEmail,
        to: contactEmail,
        fromEmail: 'alex.morgan@relanto.ai',
        fromLabel: 'alex.morgan@relanto.ai (Gmail)',
        fromOptions: ['alex.morgan@relanto.ai (Gmail)'],
        subject,
        body,
        bodyHtml,
        sequenceName: t?.sequenceName || '',
        sequenceStep: t?.sequenceStep || '',
        dueDateTime: t?.dueDateTime || '',
        taskIndex: 1,
        totalTasks: 5,
      };
    }
    return {
      taskId: d.taskId,
      contactName: d.contactName || t?.contactName || '',
      contactEmail: d.contactEmail || '',
      to: d.contactEmail || '',
      fromEmail: d.fromEmail || '',
      fromLabel: d.fromLabel || 'alex.morgan@relanto.ai (Gmail)',
      fromOptions: d.fromLabel ? [d.fromLabel] : ['alex.morgan@relanto.ai (Gmail)'],
      subject: d.subject,
      body: d.bodyHtml,
      bodyHtml: d.bodyHtml,
      sequenceName: t?.sequenceName || '',
      sequenceStep: t?.sequenceStep || '',
      dueDateTime: t?.dueDateTime || '',
      taskIndex: 1,
      totalTasks: 5,
    };
  }

  async fetchLinkedInScript(tenantId: string, taskId: string, userId: string, userRole: string) {
    const t = await this.validateTaskAccess(tenantId, taskId, userId, userRole);
    // @ts-ignore
    const contact = await this.repo.prisma.engageContact.findFirst({
      where: { tenantid: tenantId, contactId: t.contactId || '' },
    });
    let messageScript = `Hi ${t.contactName || 'there'},\n\nI noticed you're at ${t.companyName || 'your company'}.\n\nWould love to connect and share some insights.\n\nBest,\nAlex`;
    let mutualConnections = 5;
    if (t.contactId === 'contact-006') {
      messageScript = `Hi Tom,\n\nI came across your profile and noticed you're leading sales at SalesTech Pro — great work scaling that team.\n\nWe help SaaS sales orgs like yours get real-time visibility into deal risk and pipeline health, without adding more admin work for reps.\n\nWould you be open to a quick 15-minute call this week to see if there's a fit?\n\nBest,\nAlex`;
      mutualConnections = 5;
    } else if (t.contactId === 'contact-002') {
      messageScript = `Hi Michael,\n\nI noticed you've been looking into our security compliance documentation — happy to help expedite that.\n\nWe recently completed SOC 2 Type II certification and our team has done similar security reviews with fintech companies like yours. I can have our solutions engineer share a tailored security overview if that would help speed up your evaluation.\n\nWould 20 minutes this week work to connect?\n\nBest,\nAlex`;
      mutualConnections = 12;
    }
    return {
      taskId: t.taskId,
      contactId: t.contactId || '',
      contactName: t.contactName || '',
      contactTitle: contact?.jobTitle || 'VP',
      contactCompany: t.companyName || '',
      linkedInProfileUrl: contact?.linkedInUrl || 'https://linkedin.com',
      mutualConnections,
      messageScript,
      sequenceName: t.sequenceName || '',
      sequenceStep: t.sequenceStep || '',
      dueDateTime: t.dueDateTime || '',
      taskIndex: 1,
      totalTasks: 5,
    };
  }

  async fetchContactDetail(tenantId: string, contactId: string) {
    // @ts-ignore
    const c = await this.repo.prisma.engageContact.findFirst({
      where: { tenantid: tenantId, contactId },
    });
    if (!c) throw new NotFoundException('Contact not found');
    return {
      contactId: c.contactId,
      id: c.contactId,
      contactName: c.contactName,
      name: c.contactName,
      jobTitle: c.jobTitle || '',
      role: c.jobTitle || '',
      company: c.company || '',
      companyName: c.company || '',
      phone: c.phone || '',
      email: c.email || '',
      linkedInUrl: c.linkedInUrl || '',
      engagementTimeline: c.engagementTimeline || [],
      accountInfo: c.accountInfo || {},
      dealInfo: c.dealInfo || {},
    };
  }

  async createEngageTask(tenantId: string, body: any, userId: string, userRole: string) {
    const taskId = `task_${Date.now()}`;
    let assigneeId = body.assigneeId;
    if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
      assigneeId = userId;
    } else if (!assigneeId || assigneeId === 'me') {
      assigneeId = userId;
    }
    let assigneeName = body.assigneeName || 'Unknown';
    let assigneeRole = body.assigneeRole || 'Account Executive';
    if (assigneeId) {
      try {
        // @ts-ignore
        const user = await this.repo.prisma.user.findUnique({
          where: { id: assigneeId },
        });
        if (user) {
          assigneeName = user.name;
          assigneeRole = user.role === 'MANAGER' ? 'Team Lead' : 'Account Executive';
        }
      } catch {}
    }
    // @ts-ignore
    const newTask = await this.repo.prisma.engageTask.create({
      data: {
        tenantid: tenantId,
        taskId,
        title: body.title || body.taskTitle || '',
        contactId: body.contactId || '',
        contactName: body.contactName || 'New Contact',
        companyName: body.companyName || body.company || 'New Company',
        channel: ((body.channel || body.channelType || body.taskType || 'CUSTOM') as string).toUpperCase(),
        status: 'PENDING',
        dueDate: body.dueDate || new Date().toISOString().split('T')[0],
        dueTime: body.dueTime || null,
        scheduledTime: body.dueTime || null,
        dueDateTime: body.dueDate ? `${body.dueDate}T${body.dueTime || '00:00:00'}` : new Date().toISOString(),
        priority: (body.priority || 'NORMAL').toUpperCase(),
        assigneeId,
        assigneeName,
        assigneeRole,
        todoType: body.todoType || 'manual',
        entityType: body.entityType || 'lead',
        interactionCount: 0,
        isOverdue: false,
        isAtRisk: false,
        recommendedNextSteps: body.recommendedNextSteps || [],
      },
    });
    return {
      taskId: newTask.taskId,
      id: newTask.taskId,
      contactId: newTask.contactId || '',
      contactName: newTask.contactName,
      company: newTask.companyName,
      companyName: newTask.companyName,
      channelType: newTask.channel.toUpperCase(),
      channel: newTask.channel.toLowerCase(),
      sequenceName: newTask.sequenceName || '',
      sequenceStep: newTask.sequenceStep || '',
      scheduledTime: newTask.scheduledTime || '',
      dueDateTime: newTask.dueDateTime || '',
      interactionCount: newTask.interactionCount,
      priority: newTask.priority.toUpperCase(),
      status: newTask.status.toUpperCase(),
      isOverdue: newTask.isOverdue,
      isAtRisk: newTask.isAtRisk,
      createdAt: newTask.createdAt.toISOString(),
    };
  }

  async reassignEngageTask(tenantId: string, taskId: string, newAssigneeId: string, userId: string, userRole: string) {
    await this.validateTaskAccess(tenantId, taskId, userId, userRole);
    // @ts-ignore
    const user = await this.repo.prisma.user.findUnique({
      where: { id: newAssigneeId },
    });
    // @ts-ignore
    const updated = await this.repo.prisma.engageTask.update({
      where: { taskId },
      data: {
        assigneeId: newAssigneeId,
        assigneeName: user?.name || 'Unknown User',
        assigneeRole: user?.role === 'MANAGER' ? 'Team Lead' : 'Account Executive',
        status: 'PENDING',
      },
    });
    return {
      taskId: updated.taskId,
      assigneeId: updated.assigneeId,
      assigneeName: updated.assigneeName,
      assigneeRole: updated.assigneeRole,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async markComplete(tenantId: string, taskId: string, userId: string, userRole: string) {
    await this.validateTaskAccess(tenantId, taskId, userId, userRole);
    // @ts-ignore
    await this.repo.prisma.engageTask.update({
      where: { taskId },
      data: { status: 'COMPLETED' },
    });
    return { ok: true };
  }

  async skipTask(tenantId: string, taskId: string, userId: string, userRole: string) {
    await this.validateTaskAccess(tenantId, taskId, userId, userRole);
    // @ts-ignore
    await this.repo.prisma.engageTask.update({
      where: { taskId },
      data: { status: 'COMPLETED' },
    });
    return {
      taskId,
      status: 'completed',
      action: 'skipped',
      updatedAt: new Date().toISOString(),
    };
  }

  async dismissTask(tenantId: string, taskId: string, userId: string, userRole: string) {
    await this.validateTaskAccess(tenantId, taskId, userId, userRole);
    // @ts-ignore
    await this.repo.prisma.engageTask.update({
      where: { taskId },
      data: { status: 'COMPLETED' },
    });
    return {
      taskId,
      status: 'completed',
      action: 'dismissed',
      updatedAt: new Date().toISOString(),
    };
  }

  async logAction(tenantId: string, taskId: string, action: string, userId: string, userRole: string) {
    await this.validateTaskAccess(tenantId, taskId, userId, userRole);
    return {
      taskId,
      action,
      loggedAt: new Date().toISOString(),
    };
  }

  async saveNotes(tenantId: string, taskId: string, notes: string, userId: string, userRole: string) {
    await this.validateTaskAccess(tenantId, taskId, userId, userRole);
    // @ts-ignore
    await this.repo.prisma.engageTask.update({
      where: { taskId },
      data: { notes },
    });
    return { ok: true };
  }

  async saveDraft(tenantId: string, taskId: string, body: any, userId: string, userRole: string) {
    await this.validateTaskAccess(tenantId, taskId, userId, userRole);
    // @ts-ignore
    const draft = await this.repo.prisma.emailDraft.upsert({
      where: { taskId },
      update: {
        subject: body.subject,
        bodyHtml: body.body || body.bodyHtml || '',
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        fromEmail: body.fromEmail,
        fromLabel: body.fromLabel,
      },
      create: {
        tenantid: tenantId,
        taskId,
        subject: body.subject,
        bodyHtml: body.body || body.bodyHtml || '',
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        fromEmail: body.fromEmail,
        fromLabel: body.fromLabel,
      },
    });
    return draft;
  }

  async sendEmail(tenantId: string, taskId: string, body: any, userId: string, userRole: string) {
    await this.validateTaskAccess(tenantId, taskId, userId, userRole);
    // @ts-ignore
    const t = await this.repo.prisma.engageTask.update({
      where: { taskId },
      data: { status: 'COMPLETED' },
    });
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || user;
    if (!host || !user || !pass) {
      console.warn('SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS) is missing in .env. Simulating email sending.');
    } else {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
        });
        await transporter.sendMail({
          from: `"${from.split('@')[0]}" <${from}>`,
          to: body.to || body.contactEmail || t.contactName,
          subject: body.subject || 'Outreach',
          text: body.body || body.text || '',
          html: body.bodyHtml || body.body || body.html || '',
        });
      } catch (err: any) {
        console.error('SMTP sending failed:', err);
        throw new InternalServerErrorException(`SMTP sending failed: ${err.message || err}`);
      }
    }
    // @ts-ignore
    await this.repo.prisma.engageActivity.create({
      data: {
        tenantid: tenantId,
        activityId: randomUUID(),
        contactId: t.contactId || null,
        contactName: t.contactName,
        company: t.companyName,
        channelType: 'EMAIL',
        summary: `Sent email: ${body.subject || 'Outreach'}`,
        occurredAt: new Date().toISOString(),
        timeAgoLabel: 'Just now',
      },
    });
    return { ok: true, success: true };
  }

  async rephraseEmail(tenantId: string, taskId: string, body: any, userId: string, userRole: string) {
    await this.validateTaskAccess(tenantId, taskId, userId, userRole);
    const text = body.body || body.bodyHtml || '';
    const rephrasedBody = text
      ? `${text}\n\n[AI Rephrased: Clearer, more concise call-to-action added.]`
      : 'Hi Sarah,\n\nFollowing up on our Q2 renewal. Let me know if you would like to run through the ROI projections.\n\nBest,\nAlex';
    return { rephrasedBody };
  }

  async updateEngageTask(tenantId: string, taskId: string, body: any, userId: string, userRole: string) {
    await this.validateTaskAccess(tenantId, taskId, userId, userRole);
    // @ts-ignore
    const updated = await this.repo.prisma.engageTask.update({
      where: { taskId },
      data: body,
    });
    return updated;
  }

  async fetchRepTasks(tenantId: string, userId: string, userRole: string) {
    const assigneeId = (userRole === 'SALES_REP' || userRole === 'sales_rep') ? userId : 'all';
    const whereClause: any = { tenantid: tenantId };
    if (assigneeId !== 'all') {
      whereClause.assigneeId = { in: [assigneeId, 'me'] };
    }
    // @ts-ignore
    const rawTasks = await this.repo.prisma.engageTask.findMany({
      where: whereClause,
      orderBy: [
        { dueDate: 'asc' },
        { dueTime: 'asc' }
      ]
    });
    
    const parseTimeTo24h = (timeStr?: string | null): string => {
      if (!timeStr) return '12:00';
      const clean = timeStr.trim().toUpperCase();
      const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/);
      if (!match) return '12:00';
      let hour = parseInt(match[1], 10);
      const minute = match[2];
      const meridiem = match[3];
      if (meridiem === 'PM' && hour < 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;
      return `${String(hour).padStart(2, '0')}:${minute}`;
    };

    return rawTasks.map((t: any) => ({
      taskId: t.taskId,
      contactId: t.contactId || '',
      contactName: t.contactName || '',
      company: t.companyName || '',
      channelType: t.channel ? t.channel.toUpperCase() : 'CUSTOM',
      sequenceName: t.sequenceName || '',
      sequenceStep: t.sequenceStep || '',
      scheduledTime: t.scheduledTime || '',
      dueDateTime: t.dueDateTime || '',
      interactionCount: t.interactionCount || 0,
      priority: t.priority ? t.priority.toUpperCase() : 'NORMAL',
      status: t.status ? t.status.toUpperCase() : 'PENDING',
      isOverdue: t.isOverdue || false,
      isAtRisk: t.isAtRisk || false,
      snoozedUntil: t.snoozedUntil || null,
      entityType: t.entityType || 'lead',
      dueDate: t.dueDate || '',
      localTime: parseTimeTo24h(t.dueTime || t.scheduledTime),
      title: t.title || '',
    }));
  }

  async fetchFilterOptions(tenantId: string) {
    return {
      flowNames: [
        { flowId: 'flow-001', flowName: 'Enterprise Outbound Q2 2026' },
        { flowId: 'flow-002', flowName: 'Mid-Market Follow-up' },
        { flowId: 'flow-003', flowName: 'Social Selling Campaign' },
      ],
      crmFields: {
        account: [
          { fieldId: 'a-001', fieldLabel: 'Industry', fieldType: 'DROPDOWN', options: ['Technology', 'FinTech', 'SaaS'] },
        ],
        contact: [
          { fieldId: 'c-001', fieldLabel: 'Job Title', fieldType: 'TEXT' },
        ],
        lead: [],
        opportunity: [],
      },
    };
  }

  async fetchAssignableUsers(tenantId: string, currentUserId: string) {
    const members = await this.fetchTeamMembers(tenantId);
    return members.map((m: any) => ({
      userId: m.id,
      displayName: m.name,
      role: m.role === 'Team Lead' ? 'sales_manager' : 'sales_rep',
      isCurrentUser: m.id === currentUserId || (currentUserId === 'me' && m.name === 'Alex Morgan'),
    }));
  }
}
