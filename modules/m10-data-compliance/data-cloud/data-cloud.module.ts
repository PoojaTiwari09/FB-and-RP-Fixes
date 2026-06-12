// M10 Data Cloud — NestJS Sub-Feature Module
// Owned by: modules/m10-data-compliance/ (TDD Doc #11c v3.0)
// Imported by M10DataComplianceModule (the parent).

import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ScheduleModule } from "@nestjs/schedule";

import { DataCloudController } from "./controllers/data-cloud.controller";
import { DataCloudService } from "./services/data-cloud.service";
import { DataCloudSchedulerService } from "./services/data-cloud-scheduler.service";
import { DataCloudWorker } from "./workers/data-cloud.worker";
import { DataCloudRepository } from "./repositories/data-cloud.repository";
import { M10_DATA_CLOUD_QUEUES } from "./events/data-cloud.events";
import { PrismaService } from "../database/prisma.service";
import { ExportStorageService } from "./export/export-storage.service";
import { WarehouseRegistry } from "./warehouse/warehouse-registry";

@Module({
  imports: [
    // ScheduleModule enables @Cron decorators (02:00 UTC daily export, TDD FR-3)
    ScheduleModule.forRoot(),
    // BullMQ queues — lazyConnect in app.module.ts means Redis is not required at startup
    BullModule.registerQueue({
      name: M10_DATA_CLOUD_QUEUES.EXPORT,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    }),
    BullModule.registerQueue({ name: "platform-events" }),
  ],
  controllers: [DataCloudController],
  providers: [
    DataCloudService,
    DataCloudSchedulerService,
    DataCloudWorker,
    DataCloudRepository,
    PrismaService,
    ExportStorageService,
    WarehouseRegistry,
  ],
  exports: [DataCloudService],
})
export class DataCloudModule {}
