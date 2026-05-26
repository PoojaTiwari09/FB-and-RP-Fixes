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

  async getPlays(tenantId: string) {
    return this.repo.findPlays(tenantId);
  }

  async getPlayById(tenantId: string, playId: string) {
    return this.repo.findPlayById(tenantId, playId);
  }

  async createPlay(dto: CreatePlayDto, tenantId: string, userId: string) {
    const play = await this.repo.createPlay(tenantId, userId, dto);
    await this.events.publish('play.created', {
      playId: play.id,
      tenantId,
      name: play.name,
      createdBy: userId,
    });
    return play;
  }

  async updatePlay(playId: string, dto: UpdatePlayDto, tenantId: string) {
    return this.repo.updatePlay(tenantId, playId, dto);
  }

  async clonePlay(playId: string, tenantId: string, userId: string) {
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

  async deactivatePlay(playId: string, tenantId: string) {
    return this.repo.deactivatePlay(tenantId, playId);
  }

  // --- PLAY ENROLLMENT ENGINE ---

  async enrollOpportunity(dto: EnrollPlayDto, tenantId: string) {
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

  async getEnrollments(tenantId: string, filters: any) {
    return this.repo.findEnrollments(tenantId, filters);
  }

  async getEnrollmentById(tenantId: string, enrollmentId: string) {
    return this.repo.findEnrollmentById(tenantId, enrollmentId);
  }

  // --- PLAY STEP ACTIONS ---

  async completeStep(enrollmentId: string, dto: CompleteStepDto, tenantId: string, userId: string) {
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

  async skipStep(enrollmentId: string, dto: SkipStepDto, tenantId: string, userId: string) {
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

  async addNote(enrollmentId: string, dto: CreateNoteDto, tenantId: string, userId: string) {
    return this.repo.createNote(tenantId, enrollmentId, userId, dto.noteText);
  }

  // --- ANALYTICS DASHBOARDS ---

  async getAdoptionDashboard(tenantId: string) {
    return this.repo.getAdoptionAnalytics(tenantId);
  }

  async getRepDashboard(tenantId: string) {
    return this.repo.getRepLeaderboard(tenantId);
  }

  async getPlayDashboard(tenantId: string) {
    return this.repo.getPlayAnalytics(tenantId);
  }

  // --- EVENT-DRIVEN AUTOMATIC TRIGGER RULES EVALUATOR ---

  async evaluateTriggers(eventType: string, payload: any, tenantId: string) {
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

  // --- PRIVATE DECOUPLED NOTIFICATION ALERTS INTERNALS ---

  private async triggerOutreachAlerts(tenantId: string, enrollmentId: string, actionType: string) {
    try {
      // Simulate calling third-party integration Slack Webhook and Email sender
      console.log(`[Slack Integration] New opportunity enrolled in GTM Sales Playbook. Slack notice dispatched.`);
      console.log(`[Email Integration] Outbound Rep Guidance Email alert successfully sent.`);
    } catch (e) {
      console.error('[Integration Alerts Suppressed] Non-blocking notification issue.', e);
    }
  }
}
