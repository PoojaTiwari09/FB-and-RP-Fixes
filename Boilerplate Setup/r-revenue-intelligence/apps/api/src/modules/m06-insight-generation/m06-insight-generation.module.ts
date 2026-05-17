import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M06InsightGenerationController } from './controllers/m06.controller';
import { M06InsightGenerationService } from './services/m06.service';
import { M06InsightGenerationWorker } from './workers/m06.worker';
import { M06InsightGenerationRepository } from './repositories/m06.repository';
import { PrismaModule } from '../../../platform-core/database/prisma.module';
import { EventPublisherModule } from '../../../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm06-queue' }),
  ],
  controllers: [M06InsightGenerationController],
  providers: [M06InsightGenerationService, M06InsightGenerationWorker, M06InsightGenerationRepository],
  exports: [M06InsightGenerationService],
})
export class M06InsightGenerationModule {}
