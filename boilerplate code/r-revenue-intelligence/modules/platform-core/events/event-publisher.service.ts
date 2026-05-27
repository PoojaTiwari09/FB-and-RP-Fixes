import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';

/**
 * EventPublisherService
 *
 * Domain event bus shared across all modules (M01–M10). The previous
 * implementation only console.log'd payloads which meant @OnEvent
 * subscribers (e.g. AiExtractionSubscriber in M01) never received anything.
 *
 * This implementation forwards every domain event to the NestJS
 * EventEmitter2 so subscribers using @OnEvent('<event-name>') react in
 * real time. A console.log breadcrumb is still emitted so the boot log
 * remains useful for local debugging.
 *
 * The publish() contract is preserved: callers continue to use
 * publish('event.name', payload) with no other changes required.
 */
@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(private readonly emitter: EventEmitter2) {}

  async publish(eventName: string, payload: Record<string, any>): Promise<void> {
    const envelope = {
      eventId: randomUUID(),
      version: '1.0',
      occurredAt: new Date().toISOString(),
      ...payload,
    };

    this.logger.debug(`[Event] "${eventName}" id=${envelope.eventId}`);
    this.emitter.emit(eventName, envelope);
  }
}
