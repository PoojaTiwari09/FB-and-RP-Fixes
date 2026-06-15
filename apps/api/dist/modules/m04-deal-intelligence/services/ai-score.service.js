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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIScoreService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@m04/database/inject-repository");
const m04_prisma_repository_1 = require("@m04/database/m04-prisma.repository");
const deal_entity_1 = require("@m04/entities/deal.entity");
const ai_client_service_1 = require("./ai-client.service");
const deal_service_1 = require("./deal.service");
let AIScoreService = class AIScoreService {
    dealRepository;
    aiClientService;
    dealService;
    scoreHistory = new Map();
    constructor(dealRepository, aiClientService, dealService) {
        this.dealRepository = dealRepository;
        this.aiClientService = aiClientService;
        this.dealService = dealService;
    }
    async generateScore(dealId) {
        const deal = await this.dealRepository.findOne({
            where: { id: dealId },
            relations: ['warnings', 'playbooks', 'activities'],
        });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        try {
            const scoreData = await this.aiClientService.generateDealScore({
                dealName: deal.name,
                dealStage: deal.stage,
                dealAmount: Number(deal.amount),
                closeDate: deal.closeDate,
                warningCount: deal.warningCount,
                contactCount: deal.contactCount,
                activityStrength: deal.activityStrength,
                lastActivityAt: deal.lastActivityAt,
            });
            await this.dealService.updateAIScore(dealId, scoreData.score);
            this.addToHistory(dealId, scoreData.score);
            return {
                dealId,
                score: scoreData.score,
                explanation: scoreData.explanation,
                factors: scoreData.factors,
                recommendations: scoreData.recommendations,
                generatedAt: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to generate AI score:', error);
            throw error;
        }
    }
    async getCurrentScore(dealId) {
        const deal = await this.dealRepository.findOne({
            where: { id: dealId },
        });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        if (deal.aiScore === 0) {
            return this.generateScore(dealId);
        }
        return {
            dealId,
            score: deal.aiScore,
            explanation: this.getScoreExplanation(deal.aiScore),
            factors: this.estimateFactors(deal),
            recommendations: [],
            generatedAt: deal.updatedAt,
        };
    }
    async getScoreHistory(dealId) {
        const deal = await this.dealRepository.findOne({
            where: { id: dealId },
        });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const history = this.scoreHistory.get(dealId) || [];
        if (deal.aiScore > 0 && !history.some(h => h.score === deal.aiScore)) {
            history.push({
                score: deal.aiScore,
                recordedAt: deal.updatedAt,
            });
        }
        const historyWithChanges = history.map((record, index) => {
            const change = index > 0 ? record.score - history[index - 1].score : undefined;
            return {
                score: record.score,
                recordedAt: record.recordedAt,
                change,
            };
        });
        const averageScore = history.length > 0
            ? history.reduce((sum, r) => sum + r.score, 0) / history.length
            : deal.aiScore;
        let trend = 'stable';
        if (history.length >= 2) {
            const recent = history.slice(-3);
            const avgRecent = recent.reduce((sum, r) => sum + r.score, 0) / recent.length;
            if (avgRecent > averageScore + 5)
                trend = 'up';
            else if (avgRecent < averageScore - 5)
                trend = 'down';
        }
        return {
            dealId,
            currentScore: deal.aiScore,
            history: historyWithChanges,
            averageScore: Math.round(averageScore * 100) / 100,
            trend,
        };
    }
    addToHistory(dealId, score) {
        const history = this.scoreHistory.get(dealId) || [];
        history.push({
            score,
            recordedAt: new Date(),
        });
        if (history.length > 30) {
            history.shift();
        }
        this.scoreHistory.set(dealId, history);
    }
    getScoreExplanation(score) {
        if (score >= 80) {
            return 'Excellent deal health with strong indicators across all factors';
        }
        else if (score >= 60) {
            return 'Good deal health with some areas for improvement';
        }
        else if (score >= 40) {
            return 'Moderate deal health with several risk factors';
        }
        else {
            return 'Poor deal health requiring immediate attention';
        }
    }
    estimateFactors(deal) {
        return {
            engagement: Math.min(100, deal.activityStrength * 10),
            qualification: Math.min(100, (100 - deal.warningCount * 10)),
            momentum: deal.lastActivityAt
                ? Math.max(0, 100 - this.daysSince(deal.lastActivityAt) * 5)
                : 50,
            risk: Math.max(0, 100 - deal.warningCount * 15),
        };
    }
    daysSince(date) {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
};
exports.AIScoreService = AIScoreService;
exports.AIScoreService = AIScoreService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(deal_entity_1.Deal)),
    __metadata("design:paramtypes", [typeof (_a = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _a : Object, ai_client_service_1.AIClientService,
        deal_service_1.DealService])
], AIScoreService);
//# sourceMappingURL=ai-score.service.js.map