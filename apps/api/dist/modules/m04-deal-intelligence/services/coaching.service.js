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
exports.CoachingService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@/database/inject-repository");
const m04_entity_repository_1 = require("@/database/m04-entity.repository");
const deal_entity_1 = require("@/entities/deal.entity");
const deal_playbook_entity_1 = require("@/entities/deal-playbook.entity");
const deal_warning_entity_1 = require("@/entities/deal-warning.entity");
const deal_activity_entity_1 = require("@/entities/deal-activity.entity");
const ai_client_service_1 = require("./ai-client.service");
let CoachingService = class CoachingService {
    dealRepository;
    playbookRepository;
    warningRepository;
    activityRepository;
    aiClientService;
    constructor(dealRepository, playbookRepository, warningRepository, activityRepository, aiClientService) {
        this.dealRepository = dealRepository;
        this.playbookRepository = playbookRepository;
        this.warningRepository = warningRepository;
        this.activityRepository = activityRepository;
        this.aiClientService = aiClientService;
    }
    async generateCoachingPrompts(dto) {
        const deal = await this.dealRepository.findOne({
            where: { id: dto.dealId },
        });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const playbookItems = await this.playbookRepository.find({
            where: { dealId: dto.dealId },
        });
        const playbookGaps = playbookItems
            .filter((item) => item.status !== 'COMPLETED')
            .map((item) => `${item.type}: ${item.criterion}`);
        const warnings = await this.warningRepository.find({
            where: { dealId: dto.dealId, isActive: true },
            order: { createdAt: 'DESC' },
            take: 5,
        });
        const warningMessages = warnings.map((w) => w.message);
        const activities = await this.activityRepository.find({
            where: { dealId: dto.dealId },
            order: { activityDate: 'DESC' },
            take: 10,
        });
        const recentActivities = activities.map((a) => `${a.type}: ${a.subject || 'No subject'} (${a.activityDate.toISOString()})`);
        try {
            const aiResponse = await this.aiClientService.generateCoachingPrompts({
                dealId: deal.id,
                dealName: deal.name,
                repName: deal.ownerName,
                stage: deal.stage,
                warnings: warningMessages,
                playbookGaps,
                recentActivities,
            });
            return {
                dealId: deal.id,
                dealName: deal.name,
                repName: deal.ownerName,
                stage: deal.stage,
                prompts: aiResponse.prompts,
                focusAreas: aiResponse.focusAreas,
                generatedAt: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to generate coaching prompts:', error);
            return this.generateFallbackPrompts(deal, playbookGaps, warningMessages);
        }
    }
    generateFallbackPrompts(deal, playbookGaps, warnings) {
        const prompts = [];
        const focusAreas = [];
        if (playbookGaps.length > 0) {
            focusAreas.push('Qualification');
            prompts.push({
                question: `What progress have you made on: ${playbookGaps[0]}?`,
                context: `The playbook shows ${playbookGaps.length} incomplete criteria`,
                category: 'Qualification',
            });
        }
        if (warnings.length > 0) {
            focusAreas.push('Risk Management');
            prompts.push({
                question: 'What actions are you taking to address the current warnings?',
                context: `There are ${warnings.length} active warnings on this deal`,
                category: 'Risk Management',
            });
        }
        if (deal.stage.includes('Proposal') || deal.stage.includes('Negotiation')) {
            focusAreas.push('Closing Strategy');
            prompts.push({
                question: 'Have you confirmed the decision timeline with the economic buyer?',
                context: `Deal is in ${deal.stage} stage`,
                category: 'Closing Strategy',
            });
        }
        if (Number(deal.amount) > 100000) {
            focusAreas.push('Stakeholder Engagement');
            prompts.push({
                question: 'Have you mapped all stakeholders and their influence on this decision?',
                context: `High-value deal (${deal.amount})`,
                category: 'Stakeholder Engagement',
            });
        }
        const daysToClose = Math.ceil((new Date(deal.closeDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysToClose < 30 && daysToClose > 0) {
            focusAreas.push('Timeline Management');
            prompts.push({
                question: 'What are the remaining steps to close this deal?',
                context: `Deal closes in ${daysToClose} days`,
                category: 'Timeline Management',
            });
        }
        return {
            dealId: deal.id,
            dealName: deal.name,
            repName: deal.ownerName,
            stage: deal.stage,
            prompts,
            focusAreas: [...new Set(focusAreas)],
            generatedAt: new Date(),
        };
    }
    async getTeamCoachingOpportunities(managerId) {
        const deals = await this.dealRepository.find({
            take: 10,
            order: { updatedAt: 'DESC' },
        });
        const results = await Promise.all(deals.map(async (deal) => {
            try {
                const prompts = await this.generateCoachingPrompts({ dealId: deal.id });
                return prompts.prompts.length > 0 ? prompts : null;
            }
            catch (error) {
                console.error(`Failed to generate prompts for deal ${deal.id}:`, error);
                return null;
            }
        }));
        return results.filter((opt) => opt !== null);
    }
};
exports.CoachingService = CoachingService;
exports.CoachingService = CoachingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(deal_entity_1.Deal)),
    __param(1, (0, inject_repository_1.InjectRepository)(deal_playbook_entity_1.DealPlaybook)),
    __param(2, (0, inject_repository_1.InjectRepository)(deal_warning_entity_1.DealWarning)),
    __param(3, (0, inject_repository_1.InjectRepository)(deal_activity_entity_1.DealActivity)),
    __metadata("design:paramtypes", [m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        ai_client_service_1.AIClientService])
], CoachingService);
//# sourceMappingURL=coaching.service.js.map