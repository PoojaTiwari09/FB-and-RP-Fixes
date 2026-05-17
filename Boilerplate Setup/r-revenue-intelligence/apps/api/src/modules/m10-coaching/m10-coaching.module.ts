import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M10CoachingController } from './controllers/m10.controller';
import { M10CoachingService } from './services/m10.service';
import { M10CoachingWorker } from './workers/m10.worker';
import { M10CoachingRepository } from './repositories/m10.repository';
import { PrismaModule } from '../../../platform-core/database/prisma.module';
import { EventPublisherModule } from '../../../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm10-queue' }),
  ],
  controllers: [M10CoachingController],
  providers: [M10CoachingService, M10CoachingWorker, M10CoachingRepository],
  exports: [M10CoachingService],
})
export class M10CoachingModule {}
