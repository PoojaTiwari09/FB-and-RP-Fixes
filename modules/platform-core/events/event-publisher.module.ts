import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EventPublisherService } from './event-publisher.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'platform-events' }),
  ],
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventPublisherModule {}
