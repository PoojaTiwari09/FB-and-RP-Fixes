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
exports.DealDriversApiRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let DealDriversApiRepository = class DealDriversApiRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findMany(filters) {
        return this.prisma.m04DealDriver.findMany({
            where: {
                tenantid: filters.tenantId ?? '00000000-0000-0000-0000-000000000001',
                ...(filters.dealId ? { dealId: filters.dealId } : {}),
                ...(filters.boardId ? { boardId: filters.boardId } : {}),
            },
            orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        });
    }
    findById(id) {
        return this.prisma.m04DealDriver.findUnique({ where: { id } });
    }
    create(tenantId, dto) {
        return this.prisma.m04DealDriver.create({
            data: {
                tenantid: tenantId,
                dealId: dto.dealId,
                boardId: dto.boardId ?? null,
                name: dto.name,
                type: dto.type ?? 'action',
                status: dto.status ?? 'active',
                priority: dto.priority ?? 'medium',
                owner: dto.owner ?? null,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                description: dto.description ?? null,
                warningType: dto.warningType ?? null,
            },
        });
    }
    update(id, dto) {
        return this.prisma.m04DealDriver.update({
            where: { id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.type !== undefined ? { type: dto.type } : {}),
                ...(dto.status !== undefined ? { status: dto.status } : {}),
                ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
                ...(dto.owner !== undefined ? { owner: dto.owner } : {}),
                ...(dto.description !== undefined ? { description: dto.description } : {}),
                ...(dto.warningType !== undefined ? { warningType: dto.warningType } : {}),
                ...(dto.boardId !== undefined ? { boardId: dto.boardId } : {}),
                ...(dto.dueDate !== undefined
                    ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
                    : {}),
            },
        });
    }
    delete(id) {
        return this.prisma.m04DealDriver.delete({ where: { id } });
    }
};
exports.DealDriversApiRepository = DealDriversApiRepository;
exports.DealDriversApiRepository = DealDriversApiRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DealDriversApiRepository);
//# sourceMappingURL=deal-drivers-api.repository.js.map