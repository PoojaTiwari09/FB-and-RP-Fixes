// M10 Revenue Graph — NestJS Sub-Feature Module
// Owned by: modules/m10-data-compliance/ (TDD Doc #11a v3.0)
// This module is imported by M10DataComplianceModule (the parent).

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';

import { RevenueGraphController } from './controllers/revenue-graph.controller';
import { RevenueGraphService } from './services/revenue-graph.service';
import { RevenueGraphWorker } from './workers/revenue-graph.worker';
import { RevenueGraphRepository } from './repositories/revenue-graph.repository';
import { M10_REVENUE_GRAPH_QUEUES } from './events/revenue-graph.events';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [
    HttpModule,
    // Register the BullMQ intake queue — name resolved from env M10_LINKING_QUEUE_NAME
    BullModule.registerQueue({
      name: M10_REVENUE_GRAPH_QUEUES.INTAKE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    }),
    BullModule.registerQueue({ name: M10_REVENUE_GRAPH_QUEUES.DEAL_STAGE }),
    BullModule.registerQueue({ name: 'platform-events' }),
  ],
  controllers: [RevenueGraphController],
  providers: [RevenueGraphService, RevenueGraphWorker, RevenueGraphRepository, EventPublisherService, PrismaService],
  exports: [RevenueGraphService],
})
export class RevenueGraphModule {}
