import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { M08TaskRepository } from '../repositories/task.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import { CreateTaskDto } from '../schemas/task.schema';

@Injectable()
export class M08TaskService {
  constructor(
    @Inject(M08TaskRepository) private readonly repo: M08TaskRepository,
    @Inject(EventPublisherService) private readonly events: EventPublisherService
  ) {}

  async createTask(dto: CreateTaskDto, tenantId: string, userId: string) {
    const task = await this.repo.createTask(tenantId, userId, dto);

    await this.events.publish('task.created', {
      taskId: task.id,
      tenantId,
      userId,
      type: task.type,
      priority: task.priority,
    });

    return task;
  }

  async getTasks(tenantId: string, filters: any) {
    return this.repo.findTasks(tenantId, filters);
  }

  async getMyTasks(tenantId: string, userId: string, status?: string) {
    return this.repo.findTasks(tenantId, {
      userId,
      ...(status ? { status } : {}),
    });
  }

  async getOverdueTasks(tenantId: string, userId: string) {
    return this.repo.findTasks(tenantId, {
      userId,
      dueDateRange: 'overdue',
    });
  }

  async getTaskById(tenantId: string, taskId: string) {
    return this.repo.findTaskById(tenantId, taskId);
  }

  async updateTaskStatus(taskId: string, status: string, tenantId: string) {
    const updated = await this.repo.updateTaskStatus(tenantId, taskId, status);

    await this.events.publish(`task.${status}`, {
      taskId: updated.id,
      tenantId,
      userId: updated.userId,
      status: updated.status,
    });

    return updated;
  }

  async reassignTask(taskId: string, targetUserId: string, tenantId: string, managerUserId: string) {
    const updated = await this.repo.reassignTask(tenantId, taskId, targetUserId);

    await this.events.publish('task.reassigned', {
      taskId: updated.id,
      tenantId,
      fromUserId: updated.userId, // previous owner
      toUserId: targetUserId,
      reassignedBy: managerUserId,
    });

    return updated;
  }

  // --- EVENT CONSUMER FOR AUTOMATING TASKS ---

  async handleCallTranscriptionCompleted(payload: {
    tenantId: string;
    eventId: string;
    callId: string;
    summary: string;
    userId: string;
  }) {
    console.log(`[Transcription Task Auto-Consumer] Received call.transcription.completed event: ${payload.eventId}`);

    const source = 'AI';
    const sourceId = payload.eventId;

    // Idempotency safety check
    const existing = await this.repo.checkIdempotency(payload.tenantId, source, sourceId);
    if (existing) {
      console.warn(`[Duplicate Event Ignored] Follow-up task already exists for Event ID ${payload.eventId}`);
      return existing;
    }

    const nextBizDay = this.calculateNextBusinessDay(new Date());

    const dto: CreateTaskDto = {
      type: 'followup',
      description: `AI Auto-Generated Follow-up: ${payload.summary || 'Follow up on competitive signal and proposal updates.'}`,
      dueDate: nextBizDay.toISOString(),
      priority: 1,
      source,
      sourceId,
    };

    console.log(`[Auto-Task Generation] Instantiating follow-up task for User ${payload.userId}`);
    return this.createTask(dto, payload.tenantId, payload.userId);
  }

  // Next Business Day Calculator (skipping Saturday / Sunday)
  private calculateNextBusinessDay(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();

    if (day === 5) {
      // Friday -> Monday (add 3 days)
      result.setDate(result.getDate() + 3);
    } else if (day === 6) {
      // Saturday -> Monday (add 2 days)
      result.setDate(result.getDate() + 2);
    } else {
      // All other days -> tomorrow (add 1 day)
      result.setDate(result.getDate() + 1);
    }

    // Set business hours (e.g., 9:00 AM)
    result.setHours(9, 0, 0, 0);
    return result;
  }
}
