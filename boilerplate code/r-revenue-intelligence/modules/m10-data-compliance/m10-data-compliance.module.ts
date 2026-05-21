// M10 Data & Compliance — Root NestJS Module
// Owned by: modules/m10-data-compliance/ (TDD Doc #11a v3.0)
// Imports the three capability sub-modules:
//   1. RevenueGraphModule — entity linking pipeline
//   2. (Future) ComplianceSettingsModule
//   3. (Future) DataCloudModule

import { Module } from '@nestjs/common';
import { RevenueGraphModule } from './revenue-graph/revenue-graph.module';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    RevenueGraphModule,
  ],
  exports: [RevenueGraphModule],
})
export class M10DataComplianceModule {}
