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
Object.defineProperty(exports, "__esModule", { value: true });
exports.M06ExecutiveController = void 0;
const common_1 = require("@nestjs/common");
const m06_service_1 = require("../services/m06.service");
const TenantHeader = 'X-Tenant-ID';
let M06ExecutiveController = class M06ExecutiveController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getExecutiveDashboard(tenantId, region, baseline, periodId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const validBaselines = ['avg_last_2', 'last_period', 'same_period_last_year', 'current'];
        if (baseline && baseline !== 'current' && !validBaselines.includes(baseline)) {
            throw new common_1.BadRequestException(`Invalid baseline. Must be one of: ${validBaselines.join(', ')}`);
        }
        const validRegions = ['Americas', 'EMEA', 'APAC', 'Company'];
        if (region && !validRegions.includes(region)) {
            throw new common_1.BadRequestException(`Invalid region. Must be one of: ${validRegions.join(', ')}`);
        }
        const mappedBaseline = baseline === 'current' ? undefined : baseline;
        return this.service.getExecutiveDashboard(tenantId, mappedBaseline, region, periodId);
    }
    async getExecutiveTrends(tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.service.getExecutiveTrends(tenantId);
    }
};
exports.M06ExecutiveController = M06ExecutiveController;
__decorate([
    (0, common_1.Get)('executive/dashboard'),
    (0, common_1.Get)('executive/board'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Query)('region')),
    __param(2, (0, common_1.Query)('baseline')),
    __param(3, (0, common_1.Query)('periodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], M06ExecutiveController.prototype, "getExecutiveDashboard", null);
__decorate([
    (0, common_1.Get)('executive/trends'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M06ExecutiveController.prototype, "getExecutiveTrends", null);
exports.M06ExecutiveController = M06ExecutiveController = __decorate([
    (0, common_1.Controller)('api/v1/forecasting'),
    __metadata("design:paramtypes", [m06_service_1.M06ForecastingPredictionService])
], M06ExecutiveController);
//# sourceMappingURL=executive.controller.js.map