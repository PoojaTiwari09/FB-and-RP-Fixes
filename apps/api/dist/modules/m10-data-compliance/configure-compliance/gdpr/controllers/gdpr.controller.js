"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GdprController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GdprController = void 0;
const common_1 = require("@nestjs/common");
const gdpr_dsar_service_1 = require("../services/gdpr-dsar.service");
const gdpr_erasure_service_1 = require("../services/gdpr-erasure.service");
const gdpr_portability_service_1 = require("../services/gdpr-portability.service");
const gdpr_ropa_service_1 = require("../services/gdpr-ropa.service");
const jwt_guard_1 = require("../../../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../../../platform-core/guards/tenant.guard");
const m10_dev_auth_guard_1 = require("../../../guards/m10-dev-auth.guard");
const gdpr_schema_1 = require("../schemas/gdpr.schema");
const M10AuthGuard = process.env.M10_STANDALONE_AUTH === "true" ? m10_dev_auth_guard_1.M10DevAuthGuard : jwt_guard_1.JwtAuthGuard;
let GdprController = GdprController_1 = class GdprController {
    dsarService;
    erasureService;
    portabilityService;
    ropaService;
    logger = new common_1.Logger(GdprController_1.name);
    constructor(dsarService, erasureService, portabilityService, ropaService) {
        this.dsarService = dsarService;
        this.erasureService = erasureService;
        this.portabilityService = portabilityService;
        this.ropaService = ropaService;
    }
    async createDsar(req, body) {
        const parsed = gdpr_schema_1.CreateDsarSchema.parse(body);
        return this.dsarService.createDsar(req.tenantId, parsed);
    }
    async updateDsarStatus(req, id, body) {
        const parsed = gdpr_schema_1.UpdateDsarStatusSchema.parse(body);
        return this.dsarService.updateDsarStatus(req.tenantId, id, parsed);
    }
    async executeErasure(req, id, contactEmail) {
        return this.erasureService.executeErasure(req.tenantId, id, contactEmail);
    }
    async getPortabilityExport(req, contactEmail) {
        return this.portabilityService.generatePortabilityExport(req.tenantId, contactEmail);
    }
    async createRopa(req, body) {
        const parsed = gdpr_schema_1.CreateRopaSchema.parse(body);
        return this.ropaService.createRopa(req.tenantId, parsed);
    }
    async createDataBreach(req, body) {
        const parsed = gdpr_schema_1.CreateDataBreachSchema.parse(body);
        return this.ropaService.createDataBreach(req.tenantId, parsed);
    }
};
exports.GdprController = GdprController;
__decorate([
    (0, common_1.Post)("dsar"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "createDsar", null);
__decorate([
    (0, common_1.Patch)("dsar/:id/status"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "updateDsarStatus", null);
__decorate([
    (0, common_1.Post)("dsar/:id/execute-erasure"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("contactEmail")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "executeErasure", null);
__decorate([
    (0, common_1.Get)("dsar/portability"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)("contactEmail")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "getPortabilityExport", null);
__decorate([
    (0, common_1.Post)("ropa"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "createRopa", null);
__decorate([
    (0, common_1.Post)("data-breach"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "createDataBreach", null);
exports.GdprController = GdprController = GdprController_1 = __decorate([
    (0, common_1.Controller)("api/v1/m10-data-compliance/gdpr"),
    (0, common_1.UseGuards)(M10AuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [gdpr_dsar_service_1.GdprDsarService,
        gdpr_erasure_service_1.GdprErasureService,
        gdpr_portability_service_1.GdprPortabilityService,
        gdpr_ropa_service_1.GdprRopaService])
], GdprController);
//# sourceMappingURL=gdpr.controller.js.map