import { Prisma } from '@rri/database';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type AuditAction =
  // Transcription lifecycle
  | 'transcription.completed'
  | 'transcription.failed'
  | 'transcription.skipped'
  | 'transcription.retry'
  // Call events
  | 'call.created'
  | 'call.shared'
  | 'call.uploaded'
  // Transcript mutations
  | 'transcript.utterance.edited'
  | 'transcript.next_step.added'
  | 'transcript.next_step.updated'
  | 'transcript.next_step.deleted'
  // Notes
  | 'call.note.created'
  | 'call.note.updated'
  | 'call.note.deleted'
  // Webhook ingestion
  | 'webhook.zoom.received'
  | 'webhook.teams.received';

export type AuditEntityType =
  | 'CallRecord'
  | 'Transcript'
  | 'Utterance'
  | 'CallNote'
  | 'CallShare';

export interface AuditLogEntry {
  tenantId:   string;
  actorId?:   string;
  actorType?: 'user' | 'system' | 'worker';
  action:     AuditAction;
  entityType: AuditEntityType;
  entityId:   string;
  meta?:      any;
}

/**
 * AuditLogService — writes immutable audit entries for all significant events.
 *
 * US-30: Captures configuration changes, job activity, and user actions.
 *        Logs are accessible to admins in the Audit Logs screen (last 30 days default).
 *
 * Design decisions:
 *  - Fire-and-forget pattern: failures log a warning but never throw — audit
 *    failures must never break the main operation pipeline.
 *  - All writes are tenantId-scoped (Golden Rule #9).
 *  - actorType defaults to 'system' for worker/event-driven operations.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Write a single audit log entry.
   * Never throws — failures are logged and swallowed to protect the main pipeline.
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId:   entry.tenantId,
          actorId:    entry.actorId,                  // optional; let Prisma omit when undefined
          actorType:  entry.actorType ?? 'system',
          action:     entry.action,
          entityType: entry.entityType,
          entityId:   entry.entityId,
          meta:       entry.meta ?? {},
        },
      });
    } catch (err) {
      // Never let audit failures break the main operation
      this.logger.warn(
        `[AuditLog] Failed to write audit entry (action=${entry.action}, ` +
        `entityId=${entry.entityId}): ${(err as Error).message}`,
      );
    }
  }

  /**
   * Query audit logs for the admin panel.
   * US-30: Default view = last 30 days. Supports 7-day and custom date ranges.
   */
  async findByTenant(
    tenantId: string,
    filters: {
      dateFrom?: Date;
      dateTo?:   Date;
      action?:   string;
      entityId?: string;
      limit?:    number;
      offset?:   number;
    } = {},
  ) {
    const {
      dateFrom,
      dateTo,
      action,
      entityId,
      limit  = 50,
      offset = 0,
    } = filters;

    // Default date range: last 30 days if no filter provided
    const effectiveDateFrom = dateFrom
      ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where = {
      tenantId,
      createdAt: {
        gte: effectiveDateFrom,
        ...(dateTo ? { lte: dateTo } : {}),
      },
      ...(action   ? { action }   : {}),
      ...(entityId ? { entityId } : {}),
    };

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take:    limit,
        skip:    offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}
