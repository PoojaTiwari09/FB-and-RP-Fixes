"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceSettingsModule = void 0;
const common_1 = require("@nestjs/common");
const compliance_controller_1 = require("./controllers/compliance.controller");
const compliance_evaluate_controller_1 = require("./controllers/compliance-evaluate.controller");
const compliance_service_1 = require("./services/compliance.service");
const compliance_evaluate_service_1 = require("./services/compliance-evaluate.service");
const compliance_repository_1 = require("./repositories/compliance.repository");
const prisma_module_1 = require("../database/prisma.module");
const gdpr_module_1 = require("./gdpr/gdpr.module");
const eprivacy_module_1 = require("./eprivacy/eprivacy.module");
let ComplianceSettingsModule = class ComplianceSettingsModule {
};
exports.ComplianceSettingsModule = ComplianceSettingsModule;
exports.ComplianceSettingsModule = ComplianceSettingsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, gdpr_module_1.GdprModule, eprivacy_module_1.EPrivacyModule],
        controllers: [compliance_controller_1.ComplianceController, compliance_evaluate_controller_1.ComplianceEvaluateController],
        providers: [compliance_service_1.ComplianceService, compliance_evaluate_service_1.ComplianceEvaluateService, compliance_repository_1.ComplianceRepository],
        exports: [compliance_service_1.ComplianceService, compliance_evaluate_service_1.ComplianceEvaluateService],
    })
], ComplianceSettingsModule);
//# sourceMappingURL=configure-compliance.module.js.map