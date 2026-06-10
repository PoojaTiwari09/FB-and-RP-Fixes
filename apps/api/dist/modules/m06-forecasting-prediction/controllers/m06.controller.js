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
exports.M06ForecastingPredictionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const m06_service_1 = require("../services/m06.service");
const zod_1 = require("zod");
const TenantHeader = 'X-Tenant-ID';
const submitDtoSchema = zod_1.z.object({
    lob: zod_1.z.string(),
    commitForecast: zod_1.z.number(),
    bestCaseForecast: zod_1.z.number().optional(),
    notes: zod_1.z.string().optional(),
    repUserId: zod_1.z.string().optional(),
    status: zod_1.z.string().optional()
});
const createDealSchema = zod_1.z.object({
    dealName: zod_1.z.string().min(1),
    stage: zod_1.z.string().min(1),
    amount: zod_1.z.number().nonnegative(),
    closeDate: zod_1.z.string().min(1),
    probability: zod_1.z.number().optional(),
    region: zod_1.z.string().optional(),
    lob: zod_1.z.string().optional(),
    repUserId: zod_1.z.string().optional(),
});
let M06ForecastingPredictionController = class M06ForecastingPredictionController {
    service;
    constructor(service) {
        this.service = service;
    }
    async listPeriods(tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const periods = await this.service['prisma'].forecastPeriod.findMany({
            where: { tenantId },
            orderBy: { startDate: 'desc' },
        });
        return periods.map((period) => ({
            periodId: period.id,
            tenantId: period.tenantId,
            name: period.name,
            startDate: period.startDate.toISOString().slice(0, 10),
            endDate: period.endDate.toISOString().slice(0, 10),
            revenueTarget: period.revenueTarget,
            isLocked: period.isLocked,
        }));
    }
    async getAiPrediction(id, tenantId, baseline, region, repUserId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const validBaselines = ['avg_last_2', 'last_period', 'same_period_last_year', 'current', 'null'];
        if (baseline && !validBaselines.includes(baseline)) {
            throw new common_1.BadRequestException(`Invalid baseline. Must be one of: ${validBaselines.join(', ')}`);
        }
        const validRegions = ['Americas', 'EMEA', 'APAC', 'Company'];
        if (region && !validRegions.includes(region)) {
            throw new common_1.BadRequestException(`Invalid region. Must be one of: ${validRegions.join(', ')}`);
        }
        const mappedBaseline = baseline === 'current' || baseline === 'null' ? undefined : baseline;
        return this.service.getAiPrediction(tenantId, id, mappedBaseline, region, repUserId);
    }
    async runAiPrediction(id, tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.service.requestAiPrediction(tenantId, id);
    }
    async getAiPredictionStatus(id, tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.service.getAiPredictionJobStatus(tenantId, id);
    }
    async lockPeriod(id, tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const period = await this.service['prisma'].forecastPeriod.update({
            where: { id },
            data: { isLocked: true, status: 'locked' }
        });
        return { isLocked: true, period };
    }
    async getPeriodBoard(id, tenantId, repUserId, lob) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.service.getBoard(tenantId, id, repUserId, lob);
    }
    async getMath(id, tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.service.getMath(tenantId, id);
    }
    async createDeal(body, tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = createDealSchema.parse(body);
        return this.service.createDeal(tenantId, data);
    }
    async createSubmission(body, tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = submitDtoSchema.parse(body);
        return this.service.createDraft(tenantId, data);
    }
    async submitSubmission(id, tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.service.submitForecast(tenantId, id);
    }
    async getSubmission(id, tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.service.getSubmission(tenantId, id);
    }
    async getSubmissionAuditLog(id, tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.service.getAuditLog(tenantId, id);
    }
    async getSubmissionLifecycle(id, tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.service.getLifecycle(tenantId, id);
    }
    async approveSubmission(id, tenantId, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        if (!body.managerId)
            throw new common_1.BadRequestException('managerId is required');
        return this.service.approveSubmission(tenantId, id, body.managerId, body.managerName || 'Manager');
    }
    async reopenSubmission(id, tenantId, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        if (!body.managerId || !body.comment)
            throw new common_1.BadRequestException('managerId and comment are required');
        return this.service.reopenSubmission(tenantId, id, body.managerId, body.managerName || 'Manager', body.comment);
    }
    async overrideSubmission(id, tenantId, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        if (!body.managerId || body.overrideValue == null || !body.justification) {
            throw new common_1.BadRequestException('managerId, overrideValue, and justification are required');
        }
        return this.service.overrideSubmission(tenantId, id, body.managerId, body.managerName || 'Manager', body.overrideValue, body.justification, Boolean(body.approveNow));
    }
    async register(body) {
        return this.service.registerUser(body);
    }
    async login(body) {
        return this.service.loginUser(body.email, body.password);
    }
    async getTeamBoard(tenantId, baseline, region, periodId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const validBaselines = ['avg_last_2', 'last_period', 'same_period_last_year', 'current'];
        if (baseline && baseline !== 'current' && !validBaselines.includes(baseline)) {
            throw new common_1.BadRequestException(`Invalid baseline. Must be one of: ${validBaselines.join(', ')}`);
        }
        const mappedBaseline = baseline === 'current' ? undefined : baseline;
        const validRegions = ['Americas', 'EMEA', 'APAC', 'Company'];
        if (region && !validRegions.includes(region)) {
            throw new common_1.BadRequestException(`Invalid region. Must be one of: ${validRegions.join(', ')}`);
        }
        return this.service.getTeamBoard(tenantId, mappedBaseline, region, periodId);
    }
    getTeamForecast(tenantId, baseline, region, periodId) {
        return this.getTeamBoard(tenantId, baseline, region, periodId);
    }
    async getRepDrillDown(repId, tenantId, periodId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        if (!periodId)
            throw new common_1.BadRequestException('periodId is required');
        return this.service.getRepDrillDown(tenantId, repId, periodId);
    }
    async upsertQuota(body, tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        if (!body.periodId || !body.repUserId || body.amount == null) {
            throw new common_1.BadRequestException('periodId, repUserId, and amount are required');
        }
        return this.service.upsertQuota(tenantId, body.periodId, body.repUserId, body.amount);
    }
    async getQuotas(periodId, tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        if (!periodId)
            throw new common_1.BadRequestException('periodId query param is required');
        return this.service.getQuotas(tenantId, periodId);
    }
    async getAtRiskDeals(tenantId, region) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.service.getAtRiskDeals(tenantId, region);
    }
};
exports.M06ForecastingPredictionController = M06ForecastingPredictionController;
__decorate([
    (0, common_1.Get)('periods'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "listPeriods", null);
__decorate([
    (0, common_1.Get)('periods/:id/ai-prediction'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(2, (0, common_1.Query)('baseline')),
    __param(3, (0, common_1.Query)('region')),
    __param(4, (0, common_1.Query)('repUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "getAiPrediction", null);
__decorate([
    (0, common_1.Post)('periods/:id/ai-prediction/run'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "runAiPrediction", null);
__decorate([
    (0, common_1.Get)('periods/:id/ai-prediction/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "getAiPredictionStatus", null);
__decorate([
    (0, common_1.Post)('periods/:id/lock'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "lockPeriod", null);
__decorate([
    (0, common_1.Get)('periods/:id/board'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(2, (0, common_1.Query)('repUserId')),
    __param(3, (0, common_1.Query)('lob')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "getPeriodBoard", null);
__decorate([
    (0, common_1.Get)('periods/:id/math'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "getMath", null);
__decorate([
    (0, common_1.Post)('deals'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "createDeal", null);
__decorate([
    (0, common_1.Post)('submissions'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "createSubmission", null);
__decorate([
    (0, common_1.Post)('submissions/:id/submit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "submitSubmission", null);
__decorate([
    (0, common_1.Get)('submissions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "getSubmission", null);
__decorate([
    (0, common_1.Get)('submissions/:id/audit-log'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "getSubmissionAuditLog", null);
__decorate([
    (0, common_1.Get)('submissions/:id/lifecycle'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "getSubmissionLifecycle", null);
__decorate([
    (0, common_1.Post)('submissions/:id/approve'),
    (0, common_1.Patch)('submissions/:id/approve'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "approveSubmission", null);
__decorate([
    (0, common_1.Post)('submissions/:id/reopen'),
    (0, common_1.Patch)('submissions/:id/reopen'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "reopenSubmission", null);
__decorate([
    (0, common_1.Post)('submissions/:id/override'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "overrideSubmission", null);
__decorate([
    (0, common_1.Post)('auth/register'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('auth/login'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('team/board'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Query)('baseline')),
    __param(2, (0, common_1.Query)('region')),
    __param(3, (0, common_1.Query)('periodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "getTeamBoard", null);
__decorate([
    (0, common_1.Get)('team-forecast'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Query)('baseline')),
    __param(2, (0, common_1.Query)('region')),
    __param(3, (0, common_1.Query)('periodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], M06ForecastingPredictionController.prototype, "getTeamForecast", null);
__decorate([
    (0, common_1.Get)('team/reps/:repId'),
    __param(0, (0, common_1.Param)('repId')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(2, (0, common_1.Query)('periodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "getRepDrillDown", null);
__decorate([
    (0, common_1.Post)('quotas'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "upsertQuota", null);
__decorate([
    (0, common_1.Get)('quotas'),
    __param(0, (0, common_1.Query)('periodId')),
    __param(1, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "getQuotas", null);
__decorate([
    (0, common_1.Get)('team/at-risk-deals'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Query)('region')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M06ForecastingPredictionController.prototype, "getAtRiskDeals", null);
exports.M06ForecastingPredictionController = M06ForecastingPredictionController = __decorate([
    (0, swagger_1.ApiTags)('M6 — AI Revenue Predictor'),
    (0, common_1.Controller)('api/v1/forecasting'),
    __metadata("design:paramtypes", [m06_service_1.M06ForecastingPredictionService])
], M06ForecastingPredictionController);
//# sourceMappingURL=m06.controller.js.map