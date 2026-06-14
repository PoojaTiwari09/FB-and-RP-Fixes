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
var GdprRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GdprRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
let GdprRepository = GdprRepository_1 = class GdprRepository {
    prisma;
    logger = new common_1.Logger(GdprRepository_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createDsar(tenantId, dto) {
        return this.prisma.m10GdprDataSubjectRequest.create({
            data: {
                tenantid: tenantId,
                contactEmail: dto.contactEmail,
                requestType: dto.requestType,
                details: (dto.details ?? {}),
            },
        });
    }
    async updateDsarStatus(tenantId, id, dto) {
        return this.prisma.m10GdprDataSubjectRequest.update({
            where: { id },
            data: {
                status: dto.status,
                completionDate: dto.status === "completed" || dto.status === "rejected"
                    ? new Date()
                    : null,
            },
        });
    }
    async getDsars(tenantId, contactEmail) {
        return this.prisma.m10GdprDataSubjectRequest.findMany({
            where: {
                tenantid: tenantId,
                ...(contactEmail ? { contactEmail } : {}),
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async getActiveErasureRequest(tenantId, contactEmail) {
        return this.prisma.m10GdprDataSubjectRequest.findFirst({
            where: {
                tenantid: tenantId,
                contactEmail,
                requestType: "erasure",
                status: { in: ["pending", "in_progress"] },
            },
        });
    }
    async logDeletion(tenantId, dsarId, contactEmail, tablesAffected, deletedRows) {
        return this.prisma.m10GdprDeletion.create({
            data: {
                tenantid: tenantId,
                dsarId,
                contactEmail,
                tablesAffected,
                deletedRows,
            },
        });
    }
    async createRopa(tenantId, dto) {
        return this.prisma.m10GdprProcessingRecord.create({
            data: {
                tenantid: tenantId,
                purpose: dto.purpose,
                dataCategories: dto.dataCategories,
                lawfulBasis: dto.lawfulBasis,
                retentionPeriod: dto.retentionPeriod,
            },
        });
    }
    async getRopas(tenantId) {
        return this.prisma.m10GdprProcessingRecord.findMany({
            where: { tenantid: tenantId },
            orderBy: { createdAt: "desc" },
        });
    }
    async createDataBreach(tenantId, dto) {
        return this.prisma.m10GdprDataBreachRecord.create({
            data: {
                tenantid: tenantId,
                incidentDate: new Date(dto.incidentDate),
                detectionDate: new Date(dto.detectionDate),
                description: dto.description,
                affectedData: dto.affectedData,
            },
        });
    }
    async updateDataBreachStatus(tenantId, id, dto) {
        return this.prisma.m10GdprDataBreachRecord.update({
            where: { id },
            data: { status: dto.status },
        });
    }
    async getDataBreaches(tenantId) {
        return this.prisma.m10GdprDataBreachRecord.findMany({
            where: { tenantid: tenantId },
            orderBy: { createdAt: "desc" },
        });
    }
};
exports.GdprRepository = GdprRepository;
exports.GdprRepository = GdprRepository = GdprRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GdprRepository);
//# sourceMappingURL=gdpr.repository.js.map