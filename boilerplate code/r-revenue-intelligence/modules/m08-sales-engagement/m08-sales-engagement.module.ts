import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M08SalesEngagementController } from './controllers/m08.controller';
import { M08TaskController } from './controllers/task.controller';
import { M08WorkflowController } from './controllers/workflow.controller';
import { M08SalesEngagementService } from './services/m08.service';
import { M08TaskService } from './services/task.service';
import { M08WorkflowService } from './services/workflow.service';
import { M08SalesEngagementWorker } from './workers/m08.worker';
import { M08SalesEngagementRepository } from './repositories/m08.repository';
import { M08TaskRepository } from './repositories/task.repository';
import { M08WorkflowRepository } from './repositories/workflow.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm08-queue' }),
  ],
  controllers: [
    M08SalesEngagementController,
    M08TaskController,
    M08WorkflowController,
  ],
  providers: [
    M08SalesEngagementService,
    M08SalesEngagementWorker,
    M08SalesEngagementRepository,
    M08TaskService,
    M08TaskRepository,
    M08WorkflowService,
    M08WorkflowRepository,
  ],
  exports: [M08SalesEngagementService, M08TaskService, M08WorkflowService],
})
export class M08SalesEngagementModule {}


