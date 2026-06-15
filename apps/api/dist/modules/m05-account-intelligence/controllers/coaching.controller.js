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
exports.CoachingController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let CoachingController = class CoachingController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCoachingFilters() {
        return { periods: [], teams: [] };
    }
    async getCoachingActivity() {
        return [];
    }
    async getCoachingInteraction() {
        return { reps: [], benchmarks: {} };
    }
    async getCoachingResponsiveness() {
        return [];
    }
    async getCoachingScorecards() {
        return [];
    }
    async getCoachingAiInsights() {
        const recommendations = await this.prisma.coachingrecommendations.findMany({
            orderBy: { generatedat: 'desc' },
            take: 5
        });
        return recommendations.map(r => ({
            id: r.recid,
            text: r.recommendationtext,
            category: r.category,
            confidence: r.confidencescore,
            date: r.generatedat
        }));
    }
    async getCoachingTeamVsBenchmark() {
        return [];
    }
    async getCoachingRepDetails(repId) {
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(repId);
        if (isUuid) {
            const snapshot = await this.prisma.coachingsnapshots.findFirst({
                where: { userid: repId },
                orderBy: { computedat: 'desc' }
            });
            const recommendations = await this.prisma.coachingrecommendations.findMany({
                where: { userid: repId },
                orderBy: { generatedat: 'desc' },
                take: 3
            });
            if (snapshot) {
                const talkRatioVal = snapshot.talkratio ? Number(snapshot.talkratio) : 50;
                const qRateVal = snapshot.questionrate ? Number(snapshot.questionrate) : 12;
                const monoVal = snapshot.longestmonologue ? Number(snapshot.longestmonologue) : 135;
                return {
                    header: {
                        repId,
                        name: 'Sales Representative',
                        initials: 'SR',
                        avatarColor: '#3b82f6',
                        title: 'Interaction Coaching',
                        callsAnalyzed: snapshot.callcount || 0
                    },
                    kpis: {
                        talkRatio: {
                            value: `${talkRatioVal}%`,
                            optimalText: 'Optimal <43%',
                            status: talkRatioVal > 43 ? 'warning' : 'good'
                        },
                        questionRate: {
                            value: `${qRateVal}/hr`,
                            optimalText: 'Optimal 18+/hr',
                            status: qRateVal < 18 ? 'warning' : 'good'
                        },
                        monologue: {
                            value: `${Math.floor(monoVal / 60)}m ${monoVal % 60}s`,
                            optimalText: 'Optimal <2 min',
                            status: monoVal > 120 ? 'warning' : 'good'
                        },
                    },
                    trend: {
                        title: 'Talk ratio — Trend',
                        benchmark: 43,
                        insightText: recommendations.length > 0 ? recommendations[0].recommendationtext : 'Trend data tracked over time.',
                        weeks: []
                    },
                    recentCalls: [],
                    observedPatterns: recommendations.map(r => r.recommendationtext),
                    recommendedActions: recommendations.map(r => r.recommendationtext),
                    coachingHistory: []
                };
            }
        }
        return {
            header: { repId, name: 'Sales Representative', initials: 'SR', avatarColor: '#ccc', title: 'Interaction Coaching', callsAnalyzed: 0 },
            kpis: {
                talkRatio: { value: '0%', optimalText: 'Optimal <43%', status: 'good' },
                questionRate: { value: '0/hr', optimalText: 'Optimal 18+/hr', status: 'good' },
                monologue: { value: '0s', optimalText: 'Optimal <2 min', status: 'good' },
            },
            trend: { title: 'Talk ratio — Trend', benchmark: 43, insightText: 'No actual data available yet.', weeks: [] },
            recentCalls: [],
            observedPatterns: [],
            recommendedActions: [],
            coachingHistory: []
        };
    }
};
exports.CoachingController = CoachingController;
__decorate([
    (0, common_1.Get)('filters'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoachingFilters", null);
__decorate([
    (0, common_1.Get)('activity'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoachingActivity", null);
__decorate([
    (0, common_1.Get)('interaction'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoachingInteraction", null);
__decorate([
    (0, common_1.Get)('responsiveness'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoachingResponsiveness", null);
__decorate([
    (0, common_1.Get)('scorecards'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoachingScorecards", null);
__decorate([
    (0, common_1.Get)('ai-insights'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoachingAiInsights", null);
__decorate([
    (0, common_1.Get)('team-vs-benchmark'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoachingTeamVsBenchmark", null);
__decorate([
    (0, common_1.Get)('rep/:repId'),
    __param(0, (0, common_1.Param)('repId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoachingRepDetails", null);
exports.CoachingController = CoachingController = __decorate([
    (0, common_1.Controller)('api/v1/account-intelligence/coaching'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CoachingController);
//# sourceMappingURL=coaching.controller.js.map