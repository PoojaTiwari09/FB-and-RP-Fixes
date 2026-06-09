import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';

@Injectable()
export class EventPublisherService {
  constructor(@InjectQueue('platform-events') private queue: Queue) {}

  async publish(eventName: string, payload: Record<string, any>) {
    await this.queue.add(eventName, {
      eventId: randomUUID(),
      version: '1.0',
      occurredAt: new Date().toISOString(),
      ...payload,
    });
  }
}
