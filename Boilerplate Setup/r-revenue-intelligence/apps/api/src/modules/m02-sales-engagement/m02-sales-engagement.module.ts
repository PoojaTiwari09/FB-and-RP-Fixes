import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M02SalesEngagementController } from './controllers/m02.controller';
import { M02SalesEngagementService } from './services/m02.service';
import { M02SalesEngagementWorker } from './workers/m02.worker';
import { M02SalesEngagementRepository } from './repositories/m02.repository';
import { PrismaModule } from '../../../platform-core/database/prisma.module';
import { EventPublisherModule } from '../../../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm02-queue' }),
  ],
  controllers: [M02SalesEngagementController],
  providers: [M02SalesEngagementService, M02SalesEngagementWorker, M02SalesEngagementRepository],
  exports: [M02SalesEngagementService],
})
export class M02SalesEngagementModule {}
