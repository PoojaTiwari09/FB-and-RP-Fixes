import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M08ExecutionController } from './controllers/m08.controller';
import { M08ExecutionService } from './services/m08.service';
import { M08ExecutionWorker } from './workers/m08.worker';
import { M08ExecutionRepository } from './repositories/m08.repository';
import { PrismaModule } from '../../../platform-core/database/prisma.module';
import { EventPublisherModule } from '../../../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm08-queue' }),
  ],
  controllers: [M08ExecutionController],
  providers: [M08ExecutionService, M08ExecutionWorker, M08ExecutionRepository],
  exports: [M08ExecutionService],
})
export class M08ExecutionModule {}
