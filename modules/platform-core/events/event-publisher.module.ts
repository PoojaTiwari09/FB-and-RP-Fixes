import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EventPublisherService } from './event-publisher.service';
import { PlatformEventsWorker } from './platform-events.worker';

/**
 * EventPublisherModule
 *
 * Marked @Global so any module can inject EventPublisherService without
 * needing to import this module explicitly.
 */
@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: 'platform-events' }),
  ],
  providers: [EventPublisherService, PlatformEventsWorker],
  exports: [EventPublisherService],
})
export class EventPublisherModule {}
