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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealDriversApiService = void 0;
const common_1 = require("@nestjs/common");
const deal_drivers_api_repository_1 = require("../repositories/deal-drivers-api.repository");
const deal_catalog_service_1 = require("./deal-catalog.service");
const deal_driver_entity_1 = require("../entities/deal-driver.entity");
let DealDriversApiService = class DealDriversApiService {
    repo;
    catalog;
    constructor(repo, catalog) {
        this.repo = repo;
        this.catalog = catalog;
    }
    async attachDealContext(record) {
        try {
            const deal = await this.catalog.findDealById(record.dealId);
            const board = await this.catalog.resolveBoardForDeal(record.dealId);
            return {
                ...record,
                dealName: String(deal.dealName || deal.name || ''),
                boardName: board?.boardName,
                boardId: record.boardId ?? board?.boardId ?? null,
            };
        }
        catch {
            return record;
        }
    }
    async list(filters) {
        const rows = await this.repo.findMany(filters);
        return Promise.all(rows.map(async (r) => this.attachDealContext(deal_driver_entity_1.DealDriverEntity.fromPrisma(r))));
    }
    async getById(id) {
        const row = await this.repo.findById(id);
        if (!row)
            throw new common_1.NotFoundException(`Deal driver ${id} not found`);
        return this.attachDealContext(deal_driver_entity_1.DealDriverEntity.fromPrisma(row));
    }
    async create(dto) {
        await this.catalog.assertDealExists(dto.dealId);
        if (!dto.boardId) {
            const board = await this.catalog.resolveBoardForDeal(dto.dealId);
            if (board)
                dto.boardId = board.boardId;
        }
        const row = await this.repo.create('default', dto);
        return this.attachDealContext(deal_driver_entity_1.DealDriverEntity.fromPrisma(row));
    }
    async update(id, dto) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new common_1.NotFoundException(`Deal driver ${id} not found`);
        const row = await this.repo.update(id, dto);
        return this.attachDealContext(deal_driver_entity_1.DealDriverEntity.fromPrisma(row));
    }
    async remove(id) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new common_1.NotFoundException(`Deal driver ${id} not found`);
        await this.repo.delete(id);
        return { deleted: true, id };
    }
    async listByDealId(dealId) {
        await this.catalog.assertDealExists(dealId);
        return this.list({ dealId });
    }
};
exports.DealDriversApiService = DealDriversApiService;
exports.DealDriversApiService = DealDriversApiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [deal_drivers_api_repository_1.DealDriversApiRepository,
        deal_catalog_service_1.DealCatalogService])
], DealDriversApiService);
//# sourceMappingURL=deal-drivers-api.service.js.map