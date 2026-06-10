// M10 Data & Compliance — Root NestJS Module
// Owned by: modules/m10-data-compliance/ (TDD Doc #11a v3.0)
// Imports the three capability sub-modules:
//   1. RevenueGraphModule — entity linking pipeline
//   2. (Future) ComplianceSettingsModule
//   3. DataCloudModule — scheduled data export pipeline

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RevenueGraphModule } from './revenue-graph/revenue-graph.module';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';
import { M10DataComplianceController } from './controllers/m10.controller';
import { M10TestController } from './controllers/m10-test.controller';
import { DataCloudController } from './controllers/data-cloud.controller';
import { M10DataComplianceService } from './services/m10.service';
import { DataCloudService } from './services/data-cloud.service';
import { ExportStorageService } from './services/export-storage.service';
import { WarehouseRegistry } from './services/warehouse-registry';
import { M10DataComplianceRepository } from './repositories/m10.repository';
import { DataCloudRepository } from './repositories/data-cloud.repository';
import { DataCloudWorker } from './workers/data-cloud.worker';
import { M10_DATA_CLOUD_QUEUES } from './events/data-cloud.events';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    RevenueGraphModule,
    BullModule.registerQueue({
      name: M10_DATA_CLOUD_QUEUES.EXPORT,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    }),
    BullModule.registerQueue({ name: 'platform-events' }),
  ],
  controllers: [
    M10DataComplianceController,
    M10TestController,
    DataCloudController,
  ],
  providers: [
    M10DataComplianceService,
    DataCloudService,
    ExportStorageService,
    WarehouseRegistry,
    M10DataComplianceRepository,
    DataCloudRepository,
    DataCloudWorker,
  ],
  exports: [
    RevenueGraphModule,
    M10DataComplianceService,
    DataCloudService,
  ],
})
export class M10DataComplianceModule {}
