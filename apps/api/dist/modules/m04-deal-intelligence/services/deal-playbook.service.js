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
exports.DealPlaybookService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@/database/inject-repository");
const m04_entity_repository_1 = require("@/database/m04-entity.repository");
const deal_playbook_entity_1 = require("@/entities/deal-playbook.entity");
const deal_entity_1 = require("@/entities/deal.entity");
const ai_client_service_1 = require("./ai-client.service");
let DealPlaybookService = class DealPlaybookService {
    playbookRepository;
    dealRepository;
    aiClientService;
    constructor(playbookRepository, dealRepository, aiClientService) {
        this.playbookRepository = playbookRepository;
        this.dealRepository = dealRepository;
        this.aiClientService = aiClientService;
    }
    async getPlaybook(dealId, type) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const queryBuilder = this.playbookRepository
            .createQueryBuilder('playbook')
            .where('playbook.dealId = :dealId', { dealId });
        if (type) {
            queryBuilder.andWhere('playbook.type = :type', { type });
        }
        const items = await queryBuilder
            .orderBy('playbook.type', 'ASC')
            .addOrderBy('playbook.order', 'ASC')
            .getMany();
        const groupedByType = items.reduce((acc, item) => {
            if (!acc[item.type]) {
                acc[item.type] = [];
            }
            acc[item.type].push(item);
            return acc;
        }, {});
        const summaries = [];
        for (const [playbookType, playbookItems] of Object.entries(groupedByType)) {
            const totalItems = playbookItems.length;
            const completedItems = playbookItems.filter((item) => item.status === deal_playbook_entity_1.PlaybookItemStatus.COMPLETED).length;
            const inProgressItems = playbookItems.filter((item) => item.status === deal_playbook_entity_1.PlaybookItemStatus.IN_PROGRESS).length;
            const notStartedItems = playbookItems.filter((item) => item.status === deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED).length;
            summaries.push({
                type: playbookType,
                totalItems,
                completedItems,
                inProgressItems,
                notStartedItems,
                completionPercentage: totalItems > 0 ? (completedItems / totalItems) * 100 : 0,
                items: playbookItems.map((item) => this.toResponseDto(item)),
            });
        }
        return summaries;
    }
    async createPlaybookItem(dealId, dto) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const playbook = this.playbookRepository.create({
            dealId,
            type: dto.type,
            criterion: dto.criterion,
            notes: dto.notes,
            order: dto.order ?? 0,
            status: deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED,
        });
        const saved = await this.playbookRepository.save(playbook);
        return this.toResponseDto(saved);
    }
    async updatePlaybookItem(dealId, itemId, dto, userId) {
        const playbook = await this.playbookRepository.findOne({
            where: { id: itemId, dealId },
        });
        if (!playbook) {
            throw new common_1.NotFoundException('Playbook item not found');
        }
        if (dto.status !== undefined) {
            playbook.status = dto.status;
            if (dto.status === deal_playbook_entity_1.PlaybookItemStatus.COMPLETED && !playbook.completedAt) {
                playbook.completedAt = new Date();
                playbook.completedBy = userId || null;
            }
            else if (dto.status !== deal_playbook_entity_1.PlaybookItemStatus.COMPLETED) {
                playbook.completedAt = null;
                playbook.completedBy = null;
            }
        }
        if (dto.notes !== undefined) {
            playbook.notes = dto.notes;
        }
        if (dto.aiSuggestion !== undefined) {
            playbook.aiSuggestion = dto.aiSuggestion;
        }
        const updated = await this.playbookRepository.save(playbook);
        return this.toResponseDto(updated);
    }
    async deletePlaybookItem(dealId, itemId) {
        const playbook = await this.playbookRepository.findOne({
            where: { id: itemId, dealId },
        });
        if (!playbook) {
            throw new common_1.NotFoundException('Playbook item not found');
        }
        await this.playbookRepository.remove(playbook);
    }
    async initializeMEDDICC(dealId) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const existing = await this.playbookRepository.findOne({
            where: { dealId, type: deal_playbook_entity_1.PlaybookType.MEDDICC },
        });
        if (existing) {
            throw new common_1.BadRequestException('MEDDICC playbook already exists for this deal');
        }
        const criteria = [
            { criterion: 'Metrics', order: 1 },
            { criterion: 'Economic Buyer', order: 2 },
            { criterion: 'Decision Criteria', order: 3 },
            { criterion: 'Decision Process', order: 4 },
            { criterion: 'Identify Pain', order: 5 },
            { criterion: 'Champion', order: 6 },
            { criterion: 'Competition', order: 7 },
        ];
        const items = criteria.map((c) => this.playbookRepository.create({
            dealId,
            type: deal_playbook_entity_1.PlaybookType.MEDDICC,
            criterion: c.criterion,
            order: c.order,
            status: deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED,
        }));
        await this.playbookRepository.save(items);
        const summaries = await this.getPlaybook(dealId, deal_playbook_entity_1.PlaybookType.MEDDICC);
        return summaries[0];
    }
    async initializeBANT(dealId) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const existing = await this.playbookRepository.findOne({
            where: { dealId, type: deal_playbook_entity_1.PlaybookType.BANT },
        });
        if (existing) {
            throw new common_1.BadRequestException('BANT playbook already exists for this deal');
        }
        const criteria = [
            { criterion: 'Budget', order: 1 },
            { criterion: 'Authority', order: 2 },
            { criterion: 'Need', order: 3 },
            { criterion: 'Timeline', order: 4 },
        ];
        const items = criteria.map((c) => this.playbookRepository.create({
            dealId,
            type: deal_playbook_entity_1.PlaybookType.BANT,
            criterion: c.criterion,
            order: c.order,
            status: deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED,
        }));
        await this.playbookRepository.save(items);
        const summaries = await this.getPlaybook(dealId, deal_playbook_entity_1.PlaybookType.BANT);
        return summaries[0];
    }
    async generateAISuggestions(dealId, type) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const items = await this.playbookRepository.find({
            where: { dealId, type },
            order: { order: 'ASC' },
        });
        if (items.length === 0) {
            throw new common_1.NotFoundException(`No ${type} playbook found for this deal`);
        }
        try {
            const suggestions = await this.aiClientService.generatePlaybookSuggestions({
                dealName: deal.name,
                dealStage: deal.stage,
                dealAmount: Number(deal.amount),
                playbookType: type,
                criteria: items.map((item) => ({
                    criterion: item.criterion,
                    status: item.status,
                    notes: item.notes,
                })),
            });
            for (let i = 0; i < items.length; i++) {
                if (suggestions.suggestions[i]) {
                    items[i].aiSuggestion = suggestions.suggestions[i];
                    await this.playbookRepository.save(items[i]);
                }
            }
        }
        catch (error) {
            console.error('Failed to generate AI suggestions:', error);
        }
        const summaries = await this.getPlaybook(dealId, type);
        return summaries[0];
    }
    toResponseDto(playbook) {
        return {
            id: playbook.id,
            dealId: playbook.dealId,
            type: playbook.type,
            criterion: playbook.criterion,
            status: playbook.status,
            notes: playbook.notes ?? undefined,
            aiSuggestion: playbook.aiSuggestion ?? undefined,
            order: playbook.order,
            completedBy: playbook.completedBy ?? undefined,
            completedAt: playbook.completedAt ?? undefined,
            createdAt: playbook.createdAt,
            updatedAt: playbook.updatedAt,
        };
    }
};
exports.DealPlaybookService = DealPlaybookService;
exports.DealPlaybookService = DealPlaybookService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(deal_playbook_entity_1.DealPlaybook)),
    __param(1, (0, inject_repository_1.InjectRepository)(deal_entity_1.Deal)),
    __metadata("design:paramtypes", [m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        ai_client_service_1.AIClientService])
], DealPlaybookService);
//# sourceMappingURL=deal-playbook.service.js.map