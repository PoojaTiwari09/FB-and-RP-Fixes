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
exports.DealRepository = void 0;
const common_1 = require("@nestjs/common");
const entities_1 = require("@/entities");
const inject_repository_1 = require("../database/inject-repository");
const m04_entity_repository_1 = require("../database/m04-entity.repository");
let DealRepository = class DealRepository {
    dealRepository;
    constructor(dealRepository) {
        this.dealRepository = dealRepository;
    }
    async create(deal) {
        const newDeal = this.dealRepository.create(deal);
        return this.dealRepository.save(newDeal);
    }
    async findById(id, relations = []) {
        return this.dealRepository.findOne({
            where: { id },
            relations,
        });
    }
    async findByCrmId(crmDealId) {
        return this.dealRepository.findOne({
            where: { crmDealId },
        });
    }
    async findAll(filters, page = 1, limit = 25) {
        const skip = (page - 1) * limit;
        const queryBuilder = this.dealRepository.createQueryBuilder('deal');
        if (filters.ownerId) {
            queryBuilder.andWhere('deal.ownerId = :ownerId', { ownerId: filters.ownerId });
        }
        if (filters.stage) {
            queryBuilder.andWhere('deal.stage = :stage', { stage: filters.stage });
        }
        if (filters.forecastCategory) {
            queryBuilder.andWhere('deal.forecastCategory = :forecastCategory', {
                forecastCategory: filters.forecastCategory,
            });
        }
        if (filters.minAmount !== undefined) {
            queryBuilder.andWhere('deal.amount >= :minAmount', { minAmount: filters.minAmount });
        }
        if (filters.maxAmount !== undefined) {
            queryBuilder.andWhere('deal.amount <= :maxAmount', { maxAmount: filters.maxAmount });
        }
        if (filters.closeDateFrom) {
            queryBuilder.andWhere('deal.closeDate >= :closeDateFrom', {
                closeDateFrom: filters.closeDateFrom,
            });
        }
        if (filters.closeDateTo) {
            queryBuilder.andWhere('deal.closeDate <= :closeDateTo', {
                closeDateTo: filters.closeDateTo,
            });
        }
        if (filters.isHighRisk !== undefined) {
            queryBuilder.andWhere('deal.isHighRisk = :isHighRisk', { isHighRisk: filters.isHighRisk });
        }
        if (filters.search) {
            queryBuilder.andWhere('(deal.name ILIKE :search OR deal.accountName ILIKE :search)', { search: `%${filters.search}%` });
        }
        queryBuilder.orderBy('deal.updatedAt', 'DESC').skip(skip).take(limit);
        return queryBuilder.getManyAndCount();
    }
    async findByBoardFilters(boardFilters, page = 1, limit = 25) {
        const skip = (page - 1) * limit;
        const queryBuilder = this.dealRepository.createQueryBuilder('deal');
        boardFilters.forEach((filter, index) => {
            const paramName = `filter_${index}`;
            switch (filter.operator) {
                case 'EQUALS':
                    queryBuilder.andWhere(`deal.${filter.fieldName} = :${paramName}`, {
                        [paramName]: filter.value,
                    });
                    break;
                case 'NOT_EQUALS':
                    queryBuilder.andWhere(`deal.${filter.fieldName} != :${paramName}`, {
                        [paramName]: filter.value,
                    });
                    break;
                case 'GREATER_THAN':
                    queryBuilder.andWhere(`deal.${filter.fieldName} > :${paramName}`, {
                        [paramName]: filter.value,
                    });
                    break;
                case 'LESS_THAN':
                    queryBuilder.andWhere(`deal.${filter.fieldName} < :${paramName}`, {
                        [paramName]: filter.value,
                    });
                    break;
                case 'IN':
                    queryBuilder.andWhere(`deal.${filter.fieldName} IN (:...${paramName})`, {
                        [paramName]: filter.value,
                    });
                    break;
                case 'CONTAINS':
                    queryBuilder.andWhere(`deal.${filter.fieldName} ILIKE :${paramName}`, {
                        [paramName]: `%${filter.value}%`,
                    });
                    break;
            }
        });
        queryBuilder.orderBy('deal.updatedAt', 'DESC').skip(skip).take(limit);
        return queryBuilder.getManyAndCount();
    }
    async update(id, updates) {
        await this.dealRepository.update(id, updates);
        return this.findById(id);
    }
    async delete(id) {
        await this.dealRepository.delete(id);
    }
    async getDealsForOwner(ownerId, limit = 100) {
        return this.dealRepository.find({
            where: { ownerId },
            order: { updatedAt: 'DESC' },
            take: limit,
        });
    }
    async getHighRiskDeals(limit = 10) {
        return this.dealRepository.find({
            where: { isHighRisk: true },
            order: { amount: 'DESC' },
            take: limit,
        });
    }
    async getDealsClosingSoon(days = 30) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        return this.dealRepository.find({
            where: {
                closeDate: (0, m04_entity_repository_1.Between)(today, futureDate),
                stage: (0, m04_entity_repository_1.In)([entities_1.DealStage.PROPOSAL, entities_1.DealStage.NEGOTIATION]),
            },
            order: { closeDate: 'ASC' },
        });
    }
    async getDealsByForecastCategory(category) {
        return this.dealRepository.find({
            where: { forecastCategory: category },
            order: { amount: 'DESC' },
        });
    }
    async calculateTotalValue(filters) {
        const queryBuilder = this.dealRepository.createQueryBuilder('deal');
        if (filters.ownerId) {
            queryBuilder.andWhere('deal.ownerId = :ownerId', { ownerId: filters.ownerId });
        }
        if (filters.forecastCategory) {
            queryBuilder.andWhere('deal.forecastCategory = :forecastCategory', {
                forecastCategory: filters.forecastCategory,
            });
        }
        const result = await queryBuilder.select('SUM(deal.amount)', 'total').getRawOne();
        return parseFloat(String(result?.total || '0'));
    }
    async countByStage() {
        const results = await this.dealRepository
            .createQueryBuilder('deal')
            .select('deal.stage', 'stage')
            .addSelect('COUNT(*)', 'count')
            .groupBy('deal.stage')
            .getRawMany();
        return results.reduce((acc, row) => {
            acc[String(row.stage)] = parseInt(String(row.count), 10);
            return acc;
        }, {});
    }
};
exports.DealRepository = DealRepository;
exports.DealRepository = DealRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(entities_1.Deal)),
    __metadata("design:paramtypes", [m04_entity_repository_1.M04EntityRepository])
], DealRepository);
//# sourceMappingURL=deal.repository.js.map