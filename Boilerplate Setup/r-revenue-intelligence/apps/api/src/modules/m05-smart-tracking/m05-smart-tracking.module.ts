import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M05SmartTrackingController } from './controllers/m05.controller';
import { M05SmartTrackingService } from './services/m05.service';
import { M05SmartTrackingWorker } from './workers/m05.worker';
import { M05SmartTrackingRepository } from './repositories/m05.repository';
import { PrismaModule } from '../../../platform-core/database/prisma.module';
import { EventPublisherModule } from '../../../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm05-queue' }),
  ],
  controllers: [M05SmartTrackingController],
  providers: [M05SmartTrackingService, M05SmartTrackingWorker, M05SmartTrackingRepository],
  exports: [M05SmartTrackingService],
})
export class M05SmartTrackingModule {}
