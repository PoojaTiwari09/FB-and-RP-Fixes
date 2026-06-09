import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { M02ConversationIntelligenceRepository } from '../repositories/m02.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';

export interface TranscriptionIngestPayload {
  tenantId: string;
  callId: string;
  transcriptId?: string;
  sourcePlatform?: string;
  occurredAt?: string;
}

@Injectable()
export class ConversationIngestService {
  private readonly logger = new Logger(ConversationIngestService.name);

  constructor(
    private readonly repo: M02ConversationIntelligenceRepository,
    private readonly events: EventPublisherService,
  ) {}

  /**
   * Called by M01 (HTTP) when a transcript is ready. M02 reads the shared
   * Postgres call row — no duplicate transcript storage.
   */
  async ingestFromTranscription(payload: TranscriptionIngestPayload) {
    const { tenantId, callId, transcriptId } = payload;
    const conversation = await this.repo.findConversationById(callId, tenantId);

    if (!conversation) {
      throw new NotFoundException(
        `Call ${callId} not found for tenant ${tenantId}. Ensure M01 persisted the transcript before ingest.`,
      );
    }

    const syncLog = await this.repo.createSyncLog(
      {
        entityType: 'transcript',
        entityId: transcriptId || callId,
        idempotencyKey: `m01:${callId}:${transcriptId || 'latest'}`,
        recordsSynced: 1,
      },
      tenantId,
    );

    await this.events.publish('call.scored', {
      tenantId,
      callId,
      transcriptId: transcriptId || callId,
      conversationId: callId,
      sourcePlatform: payload.sourcePlatform || 'm01-capture-transcription',
      occurredAt: payload.occurredAt || new Date().toISOString(),
      syncLogId: syncLog.id,
    });

    this.logger.log(
      `Ingested call ${callId} for tenant ${tenantId} (syncLog=${syncLog.id})`,
    );

    return {
      accepted: true,
      callId,
      tenantId,
      conversation,
      syncLog,
    };
  }
}
