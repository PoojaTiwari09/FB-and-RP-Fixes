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
            where: { tenantid: tenantId },
            orderBy: { startDate: 'desc' },
        });
        return periods.map((period) => ({
            periodId: period.id,
            tenantId: period.tenantid,
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
        const data = await this.service.getAiPrediction(tenantId, id, mappedBaseline, region, repUserId);
        const { tenantid, createdAt, updatedAt, submissionDeadline, ...periodClean } = data.period;
        const formattedDeals = (data.aiPrediction?.explainability?.deals || []).map((d) => {
            const { timeDecay, contributionFactor, closeDate, region, ...cleanDeal } = d;
            return cleanDeal;
        });
        const formattedClosedWonDeals = (data.aiPrediction?.explainability?.closedWonDetails?.deals || []).map((d) => {
            const { region, ...cleanCWDeal } = d;
            return cleanCWDeal;
        });
        const { freshnessAgeSeconds, stale, ...aiPredictionClean } = data.aiPrediction;
        return {
            success: true,
            data: {
                period: periodClean,
                aiPrediction: {
                    ...aiPredictionClean,
                    explainability: {
                        ...aiPredictionClean.explainability,
                        deals: formattedDeals,
                        closedWonDetails: {
                            ...aiPredictionClean.explainability.closedWonDetails,
                            deals: formattedClosedWonDeals
                        }
                    }
                }
            }
        };
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
        const data = await this.service.getBoard(tenantId, id, repUserId, lob);
        const commit = data.submissions.reduce((sum, s) => sum + (s.commitForecast || 0), 0);
        const bestCase = data.submissions.reduce((sum, s) => sum + (s.bestCaseForecast || 0), 0);
        const aiPrediction = data.aiPrediction?.predictedAmount || 0;
        const attainment = data.quota ? (commit / data.quota) : 0;
        const users = await this.service['prisma'].forecastUser.findMany({ where: { tenantid: tenantId } });
        return {
            success: true,
            data: {
                period: {
                    id: data.period.id,
                    name: data.period.name,
                    revenueTarget: data.period.revenueTarget,
                    isLocked: data.period.isLocked,
                    status: data.period.status
                },
                summary: {
                    pipeline: aiPrediction * 1.5,
                    commit,
                    bestCase,
                    aiPrediction,
                    attainment
                },
                reps: data.submissions.map((s) => {
                    const repName = users.find(u => u.id === s.repUserId)?.name || "Representative";
                    return {
                        repId: s.repUserId,
                        repName,
                        quota: data.quota || 5000000,
                        pipeline: (s.bestCaseForecast || 0) * 1.5,
                        commit: s.commitForecast,
                        bestCase: s.bestCaseForecast,
                        aiScore: 85,
                        submissionStatus: s.status
                    };
                })
            }
        };
    }
    async getMath(id, tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = await this.service.getMath(tenantId, id);
        return {
            success: true,
            data: {
                aiPrediction: data.aiPrediction,
                math: {
                    closedWon: {
                        total: data.math.closedWonDetails?.total || 0,
                        deals: (data.math.closedWonDetails?.deals || []).map((d) => ({ name: d.name, amount: d.amount }))
                    },
                    weightedPipeline: {
                        total: data.math.pipelineByStage?.reduce((sum, s) => sum + s.contribution, 0) || 0,
                        stages: (data.math.pipelineByStage || []).map((s) => ({
                            name: s.stage,
                            pipeline: s.pipeline,
                            conv: Math.round(s.convRate * 100),
                            contribution: s.contribution
                        }))
                    },
                    expectedDeals: {
                        total: data.math.expectedDeals?.contribution || 0,
                        historicalRate: data.math.expectedDeals?.rate ? Math.round(data.math.expectedDeals.rate * 1000) / 10 : 12.4,
                        addressablePipeline: data.math.expectedDeals?.addressablePipeline || 0
                    },
                    formula: "Expected Revenue = Closed-won + Σ(Pipeline_s × C_s) + (Rate × Addressable Pipeline)"
                }
            }
        };
    }
    async register(body) {
        return this.service.registerUser(body);
    }
    async login(body) {
        return this.service.loginUser(body.email, body.password);
    }
    async getTeamBoard(tenantId, baseline, region, periodId) {
        try {
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
            const data = await this.service.getTeamBoard(tenantId, mappedBaseline, region, periodId);
            const explainability = data.aiSnapshot?.explainability || {};
            const teamAiProjection = data.teamAiProjection || 0;
            const uiData = {
                teamName: region && region !== 'Company' ? `${region} Team` : 'Company Team',
                quarter: data.period?.name || 'Q2 FY26',
                aiProjection: teamAiProjection,
                lastUpdated: data.aiSnapshot?.computedAt
                    ? `Updated today · ${new Date(data.aiSnapshot.computedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                    : 'Up to date',
                manualForecast: data.team.reduce((sum, rep) => sum + (rep.commit || 0), 0),
                rangeMin: data.aiSnapshot?.confidenceRangeLow ?? Math.round(teamAiProjection * 0.9),
                rangeMax: data.aiSnapshot?.confidenceRangeHigh ?? Math.round(teamAiProjection * 1.1),
                closesOn: data.period?.endDate || new Date().toISOString(),
                closedWon: data.breakdown.closedWon,
                weightedPipeline: data.breakdown.weightedPipeline,
                expectedDeals: data.breakdown.expectedDeals,
                activeDeals: (explainability.deals || []).map((deal) => ({
                    id: deal.id,
                    name: deal.dealName || deal.name,
                    stage: deal.stage,
                    amount: deal.amount,
                    aiConfidence: deal.probability > 0.6 ? 'High' : (deal.probability > 0.3 ? 'Medium' : 'Low'),
                    expectedClose: deal.closeDate ? new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
                    factor: Math.round((deal.probability || 0.4) * 100),
                    contribution: Math.round(deal.amount * (deal.probability || 0.4)),
                    lob: deal.region || 'Enterprise Software'
                })),
                mathData: {
                    closedWon: explainability.closedWonDetails || { total: data.breakdown.closedWon, deals: [] },
                    weightedPipeline: {
                        total: data.breakdown.weightedPipeline,
                        stages: (explainability.pipelineByStage || []).map((s) => ({
                            name: s.stage,
                            pipeline: s.pipeline,
                            conv: Math.round(s.convRate * 100),
                            contribution: s.contribution
                        }))
                    },
                    expectedDeals: explainability.expectedDeals || {
                        total: data.breakdown.expectedDeals,
                        historicalRate: 12.4,
                        addressablePipeline: 126600000
                    },
                    formula: "Expected Revenue = Closed-won + Σ(Pipeline_s × C_s) + (Rate × Addressable Pipeline)"
                },
                reps: data.team.map((rep) => ({
                    id: rep.userId,
                    repName: rep.name,
                    aiPrediction: rep.aiProjection,
                    managerOverride: rep.submission?.managerOverride ?? null,
                    confidenceLevel: rep.riskLevel === 'On Track' ? 'High' : (rep.riskLevel === 'At Risk' ? 'Medium' : 'Low'),
                    lastUpdated: rep.submission?.updatedAt ? new Date(rep.submission.updatedAt).toISOString() : null
                }))
            };
            return { success: true, data: uiData };
        }
        catch (e) {
            console.error("TEAM BOARD ERROR:", e);
            throw e;
        }
    }
    getTeamForecast(tenantId, baseline, region, periodId) {
        return this.getTeamBoard(tenantId, baseline, region, periodId);
    }
    async getRepDrillDown(repId, tenantId, periodId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        if (!periodId)
            throw new common_1.BadRequestException('periodId is required');
        const data = await this.service.getTeamBoard(tenantId, undefined, undefined, periodId);
        const repData = data.team.find((r) => r.userId === repId || r.repId === repId);
        if (!repData)
            throw new common_1.NotFoundException('Rep not found in team board');
        const explainability = data.aiSnapshot?.explainability || {};
        const uiData = {
            repId: repData.userId,
            repName: repData.name,
            quarter: data.period?.name || 'Q2 FY26',
            aiProjection: repData.aiProjection,
            lastUpdated: data.aiSnapshot?.computedAt
                ? `Updated today · ${new Date(data.aiSnapshot.computedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                : 'Up to date',
            rangeMin: Math.round(repData.aiProjection * 0.9),
            rangeMax: Math.round(repData.aiProjection * 1.1),
            closesOn: data.period?.endDate || new Date().toISOString(),
            closedWon: data.breakdown.closedWon,
            weightedPipeline: data.breakdown.weightedPipeline,
            expectedDeals: data.breakdown.expectedDeals,
            activeDeals: (explainability.deals || [])
                .filter((d) => d.repUserId === repId || d.repUserId === repData.repId)
                .map((deal) => ({
                id: deal.id,
                name: deal.dealName || deal.name,
                stage: deal.stage,
                amount: deal.amount,
                aiConfidence: deal.probability > 0.6 ? 'High' : (deal.probability > 0.3 ? 'Medium' : 'Low'),
                expectedClose: deal.closeDate ? new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
                factor: Math.round((deal.probability || 0.4) * 100),
                contribution: Math.round(deal.amount * (deal.probability || 0.4)),
                lob: deal.region || 'Enterprise Software'
            })),
            mathData: {
                closedWon: explainability.closedWonDetails || { total: data.breakdown.closedWon, deals: [] },
                weightedPipeline: {
                    total: data.breakdown.weightedPipeline,
                    stages: (explainability.pipelineByStage || []).map((s) => ({
                        name: s.stage,
                        pipeline: s.pipeline,
                        conv: Math.round(s.convRate * 100),
                        contribution: s.contribution
                    }))
                },
                expectedDeals: explainability.expectedDeals || {
                    total: data.breakdown.expectedDeals,
                    historicalRate: 12.4,
                    addressablePipeline: 126600000
                },
                formula: "Expected Revenue = Closed-won + Σ(Pipeline_s × C_s) + (Rate × Addressable Pipeline)"
            }
        };
        return { success: true, data: uiData };
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