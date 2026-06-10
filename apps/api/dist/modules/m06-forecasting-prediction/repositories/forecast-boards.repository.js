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
exports.ForecastBoardsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let ForecastBoardsRepository = class ForecastBoardsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findPeriodsByTenant(tenantId) {
        return this.prisma.forecastPeriod.findMany({
            where: { tenantId },
            orderBy: { startDate: 'desc' },
        });
    }
    resolvePeriod(tenantId, periodId) {
        const where = periodId === 'current'
            ? { tenantId, status: 'open' }
            : { id: periodId, tenantId };
        return this.prisma.forecastPeriod.findFirst({ where });
    }
    findLatestAiSnapshot(tenantId, periodId) {
        return this.prisma.aiForecastSnapshot.findFirst({
            where: { tenantId, periodId },
            orderBy: { computedAt: 'desc' },
        });
    }
    findLatestCoverageMetrics(tenantId, periodId) {
        return this.prisma.pipelineCoverageMetrics.findFirst({
            where: { tenantId, periodId },
            orderBy: { computedAt: 'desc' },
        });
    }
    findOpenPipelineDeals(tenantId, startDate, endDate) {
        return this.prisma.crmDeal.findMany({
            where: {
                tenantId,
                isClosedWon: false,
                isClosedLost: false,
                closeDate: { gte: startDate, lte: endDate },
            },
        });
    }
    findSubmissionsForPeriod(tenantId, periodId) {
        return this.prisma.forecastSubmission.findMany({
            where: { tenantId, periodId },
            orderBy: [{ repUserId: 'asc' }, { version: 'desc' }],
        });
    }
    findSubmissionByIdempotencyKey(idempotencyKey) {
        return this.prisma.forecastSubmission.findUnique({
            where: { idempotencyKey },
        });
    }
    findMaxVersionForUser(tenantId, periodId, userId) {
        return this.prisma.forecastSubmission.findFirst({
            where: { tenantId, periodId, repUserId: userId },
            orderBy: { version: 'desc' },
        });
    }
    appendSubmission(data) {
        return this.prisma.forecastSubmission.create({ data });
    }
    appendAuditLog(data) {
        return this.prisma.forecastAuditLog.create({ data });
    }
};
exports.ForecastBoardsRepository = ForecastBoardsRepository;
exports.ForecastBoardsRepository = ForecastBoardsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ForecastBoardsRepository);
//# sourceMappingURL=forecast-boards.repository.js.map