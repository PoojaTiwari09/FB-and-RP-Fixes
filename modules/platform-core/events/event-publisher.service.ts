import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import * as schemas from '@rri/shared-types';

/**
 * EventPublisherService
 *
 * Domain event bus shared across all modules (M01–M10).
 *
 * Envelops the payload in a canonical envelope structure, validates
 * it against the corresponding versioned Zod schema, and publishes it
 * asynchronously to the 'platform-events' BullMQ queue.
 */
@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(@InjectQueue('platform-events') private readonly eventQueue: Queue) {}

  async publish(eventName: string, payload: Record<string, any>): Promise<void> {
    const tenantId = payload.tenantId || payload.payload?.tenantId || '00000000-0000-0000-0000-000000000000';
    const correlationId = payload.correlationId || payload.payload?.correlationId;
    const traceId = payload.traceId || payload.payload?.traceId;
    const producer = payload.producer || eventName.split('.')[0] || 'platform';

    const businessPayload = payload.payload !== undefined && typeof payload.payload === 'object' && payload.payload !== null
      ? { ...payload.payload }
      : { ...payload };

    // Remove envelope/metadata keys from root payload if we are wrapping them
    const envelopeKeys = ['eventId', 'eventName', 'eventVersion', 'schemaId', 'tenantId', 'producer', 'occurredAt', 'publishedAt', 'correlationId', 'traceId'];
    if (payload.payload === undefined) {
      for (const key of envelopeKeys) {
        delete businessPayload[key];
      }
    }

    const envelope = {
      eventId: randomUUID(),
      eventName,
      eventVersion: 'v1',
      schemaId: `${eventName}@v1`,
      tenantId,
      producer,
      occurredAt: payload.occurredAt || new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      correlationId,
      traceId,
      payload: businessPayload,
    };

    const schemaMap: Record<string, any> = {
      'call.transcription.completed': schemas.CallTranscriptionCompleted_v1,
      'call.transcription.failed': schemas.CallTranscriptionFailed_v1,
      'notification.alert.requested': schemas.NotificationAlertRequested_v1,
      'forecast.submitted': schemas.ForecastSubmitted_v1,
      'crm.ingested': schemas.CrmIngestedEvent_v1,
    };

    const schema = schemaMap[eventName];
    if (schema) {
      const result = schema.safeParse(envelope);
      if (!result.success) {
        this.logger.warn(`Event validation failed for "${eventName}": ${JSON.stringify(result.error.format())}`);
      } else {
        this.logger.log(`Event validation succeeded for "${eventName}"`);
      }
    }

    try {
      this.logger.debug(`[Event Publisher] Queueing async job "${eventName}" id=${envelope.eventId}`);
      await this.eventQueue.add(eventName, envelope);
    } catch (error: any) {
      this.logger.warn(`[Event Publisher] Failed to queue job "${eventName}": ${error.message}`);
    }
  }
}
