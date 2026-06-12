// M10 Data & Compliance — Root NestJS Module
// Owned by: modules/m10-data-compliance/ (TDD Doc #11a-11b-11c v3.0)
// Imports the three capability sub-modules:
//   1. RevenueGraphModule        — entity linking pipeline (Doc #11a)
//   2. ComplianceSettingsModule  — runtime policy engine & evaluate gate (Doc #11b)
//   3. DataCloudModule           — scheduled data export pipeline (Doc #11c)

import { Module } from "@nestjs/common";
import { RevenueGraphModule } from "./revenue-graph/revenue-graph.module";
import { ComplianceSettingsModule } from "./configure-compliance/configure-compliance.module";
import { DataCloudModule } from "./data-cloud/data-cloud.module";
import { PrismaModule } from "./database/prisma.module";
import { EventPublisherModule } from "../platform-core/events/event-publisher.module";
import { M10DataComplianceController } from "./controllers/m10.controller";
import { M10TestController } from "./controllers/m10-test.controller";
import { M10DataComplianceService } from "./services/m10.service";
import { M10DataComplianceRepository } from "./repositories/m10.repository";
import { M10DataComplianceWorker } from "./workers/m10.worker";

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    RevenueGraphModule,
    ComplianceSettingsModule,
    DataCloudModule,
  ],
  controllers: [M10DataComplianceController, M10TestController],
  providers: [
    M10DataComplianceService,
    M10DataComplianceRepository,
    M10DataComplianceWorker,
  ],
  exports: [
    RevenueGraphModule,
    ComplianceSettingsModule,
    DataCloudModule,
    M10DataComplianceService,
  ],
})
export class M10DataComplianceModule {}
