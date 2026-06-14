"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GdprModule = void 0;
const common_1 = require("@nestjs/common");
const gdpr_controller_1 = require("./controllers/gdpr.controller");
const gdpr_dsar_service_1 = require("./services/gdpr-dsar.service");
const gdpr_erasure_service_1 = require("./services/gdpr-erasure.service");
const gdpr_portability_service_1 = require("./services/gdpr-portability.service");
const gdpr_ropa_service_1 = require("./services/gdpr-ropa.service");
const gdpr_repository_1 = require("./repositories/gdpr.repository");
const prisma_module_1 = require("../../database/prisma.module");
let GdprModule = class GdprModule {
};
exports.GdprModule = GdprModule;
exports.GdprModule = GdprModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [gdpr_controller_1.GdprController],
        providers: [
            gdpr_dsar_service_1.GdprDsarService,
            gdpr_erasure_service_1.GdprErasureService,
            gdpr_portability_service_1.GdprPortabilityService,
            gdpr_ropa_service_1.GdprRopaService,
            gdpr_repository_1.GdprRepository,
        ],
        exports: [gdpr_dsar_service_1.GdprDsarService, gdpr_repository_1.GdprRepository],
    })
], GdprModule);
//# sourceMappingURL=gdpr.module.js.map