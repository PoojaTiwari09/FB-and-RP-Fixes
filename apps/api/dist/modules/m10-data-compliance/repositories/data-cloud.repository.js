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
var DataCloudRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCloudRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let DataCloudRepository = DataCloudRepository_1 = class DataCloudRepository {
    prisma;
    logger = new common_1.Logger(DataCloudRepository_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createConnection(tenantId, data) {
        return this.prisma.m10DataCloudConnection.create({
            data: { tenantId, destination: data.destination, config: data.config },
        });
    }
    async findConnections(tenantId) {
        return this.prisma.m10DataCloudConnection.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findConnectionById(tenantId, connectionId) {
        return this.prisma.m10DataCloudConnection.findFirst({
            where: { id: connectionId, tenantId },
        });
    }
    async setConnectionActive(tenantId, connectionId, isActive) {
        return this.prisma.m10DataCloudConnection.updateMany({
            where: { id: connectionId, tenantId },
            data: { isActive, updatedAt: new Date() },
        });
    }
    async createExportRun(data) {
        return this.prisma.m10DataCloudExportRun.create({ data });
    }
    async updateExportRun(runId, data) {
        return this.prisma.m10DataCloudExportRun.update({
            where: { id: runId },
            data,
        });
    }
    async findExportRunById(tenantId, runId) {
        return this.prisma.m10DataCloudExportRun.findFirst({
            where: { id: runId, tenantId },
            include: { connection: true },
        });
    }
    async findExportRuns(tenantId, connectionId) {
        return this.prisma.m10DataCloudExportRun.findMany({
            where: {
                tenantId,
                ...(connectionId ? { connectionId } : {}),
            },
            orderBy: { startedAt: 'desc' },
            take: 50,
            include: { connection: { select: { destination: true, id: true } } },
        });
    }
    async getCheckpoint(tenantId, domain) {
        return this.prisma.m10DataCloudCheckpoint.findUnique({
            where: { tenantId_domain: { tenantId, domain } },
        });
    }
    async upsertCheckpoint(tenantId, domain, lastCursor) {
        return this.prisma.m10DataCloudCheckpoint.upsert({
            where: { tenantId_domain: { tenantId, domain } },
            update: { lastCursor, updatedAt: new Date() },
            create: { tenantId, domain, lastCursor },
        });
    }
    async extractAccounts(tenantId, since) {
        return this.prisma.m10Account.findMany({
            where: {
                tenantId,
                ...(since ? { updatedAt: { gt: since } } : {}),
            },
            orderBy: { updatedAt: 'asc' },
        });
    }
    async extractContacts(tenantId, since) {
        return this.prisma.m10Contact.findMany({
            where: {
                tenantId,
                ...(since ? { updatedAt: { gt: since } } : {}),
            },
            orderBy: { updatedAt: 'asc' },
        });
    }
    async extractDeals(tenantId, since) {
        return this.prisma.m10Deal.findMany({
            where: {
                tenantId,
                ...(since ? { updatedAt: { gt: since } } : {}),
            },
            orderBy: { updatedAt: 'asc' },
        });
    }
    async extractActivities(tenantId, since) {
        return this.prisma.m10Activity.findMany({
            where: {
                tenantId,
                ...(since ? { updatedAt: { gt: since } } : {}),
            },
            orderBy: { updatedAt: 'asc' },
        });
    }
};
exports.DataCloudRepository = DataCloudRepository;
exports.DataCloudRepository = DataCloudRepository = DataCloudRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DataCloudRepository);
//# sourceMappingURL=data-cloud.repository.js.map