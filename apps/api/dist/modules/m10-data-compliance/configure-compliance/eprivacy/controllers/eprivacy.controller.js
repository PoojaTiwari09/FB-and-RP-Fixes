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
var EPrivacyController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EPrivacyController = void 0;
const common_1 = require("@nestjs/common");
const eprivacy_service_1 = require("../services/eprivacy.service");
const jwt_guard_1 = require("../../../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../../../platform-core/guards/tenant.guard");
const m10_dev_auth_guard_1 = require("../../../guards/m10-dev-auth.guard");
const eprivacy_schema_1 = require("../schemas/eprivacy.schema");
const M10AuthGuard = process.env.M10_STANDALONE_AUTH === 'true' ? m10_dev_auth_guard_1.M10DevAuthGuard : jwt_guard_1.JwtAuthGuard;
let EPrivacyController = EPrivacyController_1 = class EPrivacyController {
    service;
    logger = new common_1.Logger(EPrivacyController_1.name);
    constructor(service) {
        this.service = service;
    }
    async updateConsent(req, body) {
        const parsed = eprivacy_schema_1.UpdateEPrivacyConsentSchema.parse(body);
        return this.service.updateConsent(req.tenantId, parsed);
    }
    async getConsentStatus(req, email, channel, purpose) {
        return this.service.checkConsent(req.tenantId, email, channel, purpose);
    }
    async addSuppression(req, body) {
        const parsed = eprivacy_schema_1.AddSuppressionSchema.parse(body);
        return this.service.addSuppression(req.tenantId, parsed);
    }
    async checkSuppression(req, email) {
        return this.service.checkSuppression(req.tenantId, email);
    }
};
exports.EPrivacyController = EPrivacyController;
__decorate([
    (0, common_1.Post)('consent'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EPrivacyController.prototype, "updateConsent", null);
__decorate([
    (0, common_1.Get)('consent'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('email')),
    __param(2, (0, common_1.Query)('channel')),
    __param(3, (0, common_1.Query)('purpose')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], EPrivacyController.prototype, "getConsentStatus", null);
__decorate([
    (0, common_1.Post)('suppression'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EPrivacyController.prototype, "addSuppression", null);
__decorate([
    (0, common_1.Get)('suppression'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EPrivacyController.prototype, "checkSuppression", null);
exports.EPrivacyController = EPrivacyController = EPrivacyController_1 = __decorate([
    (0, common_1.Controller)('api/v1/m10-data-compliance/eprivacy'),
    (0, common_1.UseGuards)(M10AuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [eprivacy_service_1.EPrivacyService])
], EPrivacyController);
//# sourceMappingURL=eprivacy.controller.js.map