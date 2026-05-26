// M10 Data & Compliance — Root NestJS Module
// Owned by: modules/m10-data-compliance/ (TDD Doc #11a v3.0)
// Imports the three capability sub-modules:
//   1. RevenueGraphModule — entity linking pipeline
//   2. (Future) ComplianceSettingsModule
//   3. DataCloudModule — scheduled data export pipeline

import { Module } from '@nestjs/common';
import { RevenueGraphModule } from './revenue-graph/revenue-graph.module';
import { DataCloudModule } from './data-cloud/data-cloud.module';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';
import { M10DataComplianceController } from './controllers/m10.controller';
import { M10DataComplianceService } from './services/m10.service';
import { M10DataComplianceRepository } from './repositories/m10.repository';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    RevenueGraphModule,
    DataCloudModule,
  ],
  controllers: [M10DataComplianceController],
  providers: [M10DataComplianceService, M10DataComplianceRepository],
  exports: [RevenueGraphModule, DataCloudModule, M10DataComplianceService],
})
export class M10DataComplianceModule {}
