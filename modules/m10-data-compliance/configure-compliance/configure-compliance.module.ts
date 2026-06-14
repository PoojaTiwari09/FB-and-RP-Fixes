// M10 Configure Compliance — NestJS Sub-Module
// Owned by: modules/m10-data-compliance/ (TDD Doc #11b v3.0)
// Wires all compliance DI providers:
//   - ComplianceController (policy CRUD, opt-outs, consent logs, audit log)
//   - ComplianceEvaluateController (runtime gate POST /evaluate)
//   - ComplianceService (policy management logic)
//   - ComplianceEvaluateService (evaluation engine)
//   - ComplianceRepository (Prisma layer)

import { Module } from "@nestjs/common";
import { ComplianceController } from "./controllers/compliance.controller";
import { ComplianceEvaluateController } from "./controllers/compliance-evaluate.controller";
import { ComplianceService } from "./services/compliance.service";
import { ComplianceEvaluateService } from "./services/compliance-evaluate.service";
import { ComplianceRepository } from "./repositories/compliance.repository";
import { PrismaModule } from "../database/prisma.module";
import { GdprModule } from "./gdpr/gdpr.module";
import { EPrivacyModule } from "./eprivacy/eprivacy.module";

@Module({
  imports: [PrismaModule, GdprModule, EPrivacyModule],
  controllers: [ComplianceController, ComplianceEvaluateController],
  providers: [
    ComplianceService,
    ComplianceEvaluateService,
    ComplianceRepository,
  ],
  exports: [ComplianceService, ComplianceEvaluateService],
})
export class ComplianceSettingsModule {}
