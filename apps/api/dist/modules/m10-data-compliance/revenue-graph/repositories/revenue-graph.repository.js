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
var RevenueGraphRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueGraphRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let RevenueGraphRepository = RevenueGraphRepository_1 = class RevenueGraphRepository {
    prisma;
    logger = new common_1.Logger(RevenueGraphRepository_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAccounts(tenantId, opts = {}) {
        const page = opts.page ?? 1;
        const limit = Math.min(opts.limit ?? 20, 100);
        const skip = (page - 1) * limit;
        const where = {
            tenantId: tenantId,
            ...(opts.search
                ? {
                    OR: [
                        { name: { contains: opts.search, mode: 'insensitive' } },
                        { domain: { contains: opts.search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [data, total] = await this.prisma.$transaction([
            this.prisma.m10Account.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.m10Account.count({ where }),
        ]);
        return { data, total };
    }
    async findAccountById(tenantId, accountId) {
        return this.prisma.m10Account.findFirst({
            where: { id: accountId, tenantId: tenantId },
        });
    }
    async listAccountsForMatching(tenantId, limit = 500) {
        if (!this.prisma.m10Account?.findMany)
            return [];
        return this.prisma.m10Account.findMany({
            where: { tenantId: tenantId },
            select: { id: true, name: true, domain: true, crmAccountId: true },
            take: limit,
            orderBy: { updatedAt: 'desc' },
        });
    }
    async listContactsForMatching(tenantId, limit = 500) {
        if (!this.prisma.m10Contact?.findMany)
            return [];
        return this.prisma.m10Contact.findMany({
            where: { tenantId: tenantId },
            select: { id: true, email: true, name: true, accountId: true },
            take: limit,
            orderBy: { updatedAt: 'desc' },
        });
    }
    async upsertAccount(tenantId, data) {
        if (data.crmAccountId) {
            const existing = await this.prisma.m10Account.findFirst({
                where: { tenantId: tenantId, crmAccountId: data.crmAccountId },
                select: { id: true },
            });
            if (existing) {
                return this.prisma.m10Account.update({
                    where: { id: existing.id },
                    data: { ...data, updatedAt: new Date() },
                });
            }
        }
        return this.prisma.m10Account.create({ data: { tenantId: tenantId, ...data } });
    }
    async findContactByEmail(tenantId, email) {
        return this.prisma.m10Contact.findFirst({
            where: { tenantId: tenantId, email: email.toLowerCase() },
        });
    }
    async findContactById(tenantId, contactId) {
        return this.prisma.m10Contact.findFirst({
            where: { id: contactId, tenantId: tenantId },
        });
    }
    async upsertContact(tenantId, data) {
        const existing = await this.findContactByEmail(tenantId, data.email);
        if (existing) {
            return this.prisma.m10Contact.update({
                where: { id: existing.id },
                data: { ...data, email: data.email.toLowerCase(), updatedAt: new Date() },
            });
        }
        return this.prisma.m10Contact.create({
            data: { tenantId: tenantId, ...data, email: data.email.toLowerCase() },
        });
    }
    async findDeals(tenantId, opts = {}) {
        const page = opts.page ?? 1;
        const limit = Math.min(opts.limit ?? 20, 100);
        const skip = (page - 1) * limit;
        const where = {
            tenantId: tenantId,
            ...(opts.accountId ? { accountId: opts.accountId } : {}),
            ...(opts.isActive !== undefined ? { isActive: opts.isActive } : {}),
            ...(opts.stage ? { stage: opts.stage } : {}),
        };
        const [data, total] = await this.prisma.$transaction([
            this.prisma.m10Deal.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    account: true,
                    dealContacts: { include: { contact: true } },
                },
            }),
            this.prisma.m10Deal.count({ where }),
        ]);
        return { data, total };
    }
    async findDealById(tenantId, dealId) {
        return this.prisma.m10Deal.findFirst({
            where: { id: dealId, tenantId: tenantId },
            include: {
                account: true,
                dealContacts: { include: { contact: true } },
                activities: { orderBy: { occurredAt: 'desc' }, take: 10 },
            },
        });
    }
    async findOpenDealsByAccount(tenantId, accountId) {
        return this.prisma.m10Deal.findMany({
            where: { tenantId: tenantId, accountId, isActive: true },
            orderBy: { updatedAt: 'desc' },
            take: 10,
        });
    }
    async updateDealStage(tenantId, dealId, stage) {
        return this.prisma.m10Deal.update({
            where: { id: dealId },
            data: { stage, updatedAt: new Date() },
        });
    }
    async upsertActivity(tenantId, data) {
        const existing = await this.prisma.m10Activity.findUnique({
            where: { idempotencyKey: data.idempotencyKey },
        });
        if (existing) {
            this.logger.debug(`Activity already exists for key ${data.idempotencyKey}, skipping create`);
            return existing;
        }
        return this.prisma.m10Activity.create({
            data: {
                tenantId: tenantId,
                ...data,
                occurredAt: data.occurredAt,
                status: data.status ?? 'received',
            },
        });
    }
    async updateActivityStatus(activityId, status, linkedFields) {
        return this.prisma.m10Activity.update({
            where: { id: activityId },
            data: { status, ...(linkedFields ?? {}), updatedAt: new Date() },
        });
    }
    async upsertInteractionLinks(tenantId, activityId, links) {
        const results = [];
        for (const link of links) {
            const result = await this.prisma.m10InteractionLink.upsert({
                where: {
                    tenantId_activityId_entityType_entityId: {
                        tenantId: tenantId,
                        activityId,
                        entityType: link.entityType,
                        entityId: link.entityId,
                    },
                },
                update: {
                    confidence: link.confidence,
                    signals: link.signals,
                    aiAssisted: link.aiAssisted,
                    explanation: link.explanation ?? {},
                    updatedAt: new Date(),
                },
                create: {
                    tenantId: tenantId,
                    activityId,
                    entityType: link.entityType,
                    entityId: link.entityId,
                    confidence: link.confidence,
                    signals: link.signals,
                    aiAssisted: link.aiAssisted,
                    explanation: link.explanation ?? {},
                },
            });
            results.push(result);
        }
        return results;
    }
    async findLinksByActivity(tenantId, activityId) {
        return this.prisma.m10InteractionLink.findMany({
            where: { tenantId: tenantId, activityId },
        });
    }
    async createLinkDecisionLog(tenantId, data) {
        return this.prisma.m10LinkDecisionLog.create({ data: { tenantId: tenantId, ...data } });
    }
    async getActiveMappingRules(tenantId) {
        return this.prisma.m10MappingRuleSet.findFirst({
            where: { tenantId: tenantId, isActive: true },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async getCrmSyncStates(tenantId) {
        return this.prisma.m10CrmSyncState.findMany({ where: { tenantId: tenantId } });
    }
    async upsertCrmSyncState(tenantId, crmSource, entityType, data) {
        return this.prisma.m10CrmSyncState.upsert({
            where: {
                tenantId_crmSource_entityType: { tenantId: tenantId, crmSource, entityType },
            },
            update: { ...data, updatedAt: new Date() },
            create: { tenantId: tenantId, crmSource, entityType, ...data },
        });
    }
};
exports.RevenueGraphRepository = RevenueGraphRepository;
exports.RevenueGraphRepository = RevenueGraphRepository = RevenueGraphRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RevenueGraphRepository);
//# sourceMappingURL=revenue-graph.repository.js.map