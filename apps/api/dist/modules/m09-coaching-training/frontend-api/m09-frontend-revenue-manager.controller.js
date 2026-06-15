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
exports.M09FrontendRevenueManagerController = void 0;
const common_1 = require("@nestjs/common");
const m09_frontend_auth_guard_1 = require("./m09-frontend-auth.guard");
const prisma_service_1 = require("../database/prisma.service");
let M09FrontendRevenueManagerController = class M09FrontendRevenueManagerController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCoachingFilters() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: '00000000-0000-0000-0000-000000000000' },
        });
        return config?.filters || { periods: [], teams: [] };
    }
    async getCoachingActivity() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: '00000000-0000-0000-0000-000000000000' },
        });
        return config?.activity || [];
    }
    async getCoachingInteraction() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: '00000000-0000-0000-0000-000000000000' },
        });
        return config?.interaction || { reps: [], benchmarks: {} };
    }
    async getCoachingResponsiveness() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: '00000000-0000-0000-0000-000000000000' },
        });
        return config?.responsiveness || [];
    }
    async getCoachingScorecards() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: '00000000-0000-0000-0000-000000000000' },
        });
        return config?.scorecards || [];
    }
    async getCoachingAiInsights() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: '00000000-0000-0000-0000-000000000000' },
        });
        return config?.aiInsights || [];
    }
    async getCoachingTeamVsBenchmark() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: '00000000-0000-0000-0000-000000000000' },
        });
        return config?.teamVsBenchmark || [];
    }
    async getCoachingRepDetails(repId) {
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(repId);
        let rep = null;
        if (isUuid) {
            rep = await this.prisma.managerCoachingRep.findUnique({
                where: { id: repId },
            });
        }
        if (!rep) {
            return {
                header: { repId, name: 'Sales Representative', initials: 'SR', avatarColor: '#ccc', title: 'Interaction Coaching', callsAnalyzed: 0 },
                kpis: {
                    talkRatio: { value: '50%', optimalText: 'Optimal <43%', status: 'warning' },
                    questionRate: { value: '12/hr', optimalText: 'Optimal 18+/hr', status: 'warning' },
                    monologue: { value: '2m 15s', optimalText: 'Optimal <2 min', status: 'warning' },
                },
                trend: { title: 'Talk ratio — Trend', benchmark: 43, insightText: 'No data', weeks: [] },
                recentCalls: [],
                observedPatterns: [],
                recommendedActions: [],
                coachingHistory: []
            };
        }
        return rep;
    }
};
exports.M09FrontendRevenueManagerController = M09FrontendRevenueManagerController;
__decorate([
    (0, common_1.Get)('coaching/filters'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingFilters", null);
__decorate([
    (0, common_1.Get)('coaching/activity'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingActivity", null);
__decorate([
    (0, common_1.Get)('coaching/interaction'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingInteraction", null);
__decorate([
    (0, common_1.Get)('coaching/responsiveness'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingResponsiveness", null);
__decorate([
    (0, common_1.Get)('coaching/scorecards'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingScorecards", null);
__decorate([
    (0, common_1.Get)('coaching/ai-insights'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingAiInsights", null);
__decorate([
    (0, common_1.Get)('coaching/team-vs-benchmark'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingTeamVsBenchmark", null);
__decorate([
    (0, common_1.Get)('coaching/rep/:repId'),
    __param(0, (0, common_1.Param)('repId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingRepDetails", null);
exports.M09FrontendRevenueManagerController = M09FrontendRevenueManagerController = __decorate([
    (0, common_1.Controller)('api/manager'),
    (0, common_1.UseGuards)(m09_frontend_auth_guard_1.M09FrontendAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], M09FrontendRevenueManagerController);
//# sourceMappingURL=m09-frontend-revenue-manager.controller.js.map