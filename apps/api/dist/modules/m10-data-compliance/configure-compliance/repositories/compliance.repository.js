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
var ComplianceRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let ComplianceRepository = ComplianceRepository_1 = class ComplianceRepository {
    prisma;
    logger = new common_1.Logger(ComplianceRepository_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPolicy(tenantId, dto) {
        return this.prisma.m10CompliancePolicy.create({
            data: {
                tenantid: tenantId,
                name: dto.name,
                description: dto.description,
                channel: dto.channel,
                regionFamily: dto.regionFamily,
                ruleDefinition: dto.ruleDefinition,
                isActive: true,
                version: 1,
            },
        });
    }
    async findAllPolicies(tenantId, activeOnly = false) {
        return this.prisma.m10CompliancePolicy.findMany({
            where: {
                tenantid: tenantId,
                ...(activeOnly ? { isActive: true } : {}),
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async findPolicyById(tenantId, id) {
        return this.prisma.m10CompliancePolicy.findFirst({
            where: { id, tenantid: tenantId },
        });
    }
    async findActivePoliciesForChannel(tenantId, channel) {
        return this.prisma.m10CompliancePolicy.findMany({
            where: { tenantid: tenantId, channel, isActive: true },
        });
    }
    async updatePolicy(tenantId, id, dto) {
        const existing = await this.prisma.m10CompliancePolicy.findFirst({ where: { id, tenantid: tenantId } });
        return this.prisma.m10CompliancePolicy.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.channel !== undefined && { channel: dto.channel }),
                ...(dto.regionFamily !== undefined && { regionFamily: dto.regionFamily }),
                ...(dto.ruleDefinition !== undefined && { ruleDefinition: dto.ruleDefinition }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                version: (existing?.version ?? 1) + 1,
            },
        });
    }
    async deactivatePolicy(tenantId, id) {
        const existing = await this.prisma.m10CompliancePolicy.findFirst({ where: { id, tenantid: tenantId } });
        return this.prisma.m10CompliancePolicy.update({
            where: { id },
            data: { isActive: false, version: (existing?.version ?? 1) + 1 },
        });
    }
    async upsertOptOut(tenantId, dto) {
        return this.prisma.m10CrmOptOut.upsert({
            where: {
                tenantid_contactEmail_channel: {
                    tenantid: tenantId,
                    contactEmail: dto.contactEmail,
                    channel: dto.channel,
                },
            },
            update: {
                isOptedOut: dto.isOptedOut,
                lastSyncedAt: new Date(),
            },
            create: {
                tenantid: tenantId,
                contactEmail: dto.contactEmail,
                channel: dto.channel,
                isOptedOut: dto.isOptedOut,
                lastSyncedAt: new Date(),
            },
        });
    }
    async findOptOut(tenantId, contactEmail, channel) {
        return this.prisma.m10CrmOptOut.findUnique({
            where: {
                tenantid_contactEmail_channel: { tenantid: tenantId, contactEmail, channel },
            },
        });
    }
    async findAllOptOuts(tenantId, contactEmail) {
        return this.prisma.m10CrmOptOut.findMany({
            where: {
                tenantid: tenantId,
                ...(contactEmail ? { contactEmail } : {}),
            },
        });
    }
    async createConsentLog(tenantId, dto) {
        return this.prisma.m10ConsentLog.create({
            data: {
                tenantid: tenantId,
                contactEmail: dto.contactEmail,
                consentType: dto.consentType,
                status: dto.status,
                source: dto.source,
            },
        });
    }
    async findLatestConsentForContact(tenantId, contactEmail, consentType) {
        return this.prisma.m10ConsentLog.findFirst({
            where: { tenantid: tenantId, contactEmail, consentType },
            orderBy: { loggedAt: 'desc' },
        });
    }
    async findAllConsentLogs(tenantId, contactEmail) {
        return this.prisma.m10ConsentLog.findMany({
            where: {
                tenantid: tenantId,
                ...(contactEmail ? { contactEmail } : {}),
            },
            orderBy: { loggedAt: 'desc' },
        });
    }
    async createAuditEntry(data) {
        return this.prisma.m10ComplianceAuditEntry.create({
            data: {
                tenantid: data.tenantId,
                correlationId: data.correlationId,
                recipientEmail: data.recipientEmail,
                channel: data.channel,
                decision: data.decision,
                reasonCode: data.reasonCode,
                explanation: data.explanation,
                triggeredPolicyId: data.triggeredPolicyId,
                evaluationMetadata: (data.evaluationMetadata ?? {}),
            },
        });
    }
    async findAuditEntries(tenantId, opts) {
        const { recipientEmail, decision, limit = 50, offset = 0 } = opts ?? {};
        return this.prisma.m10ComplianceAuditEntry.findMany({
            where: {
                tenantid: tenantId,
                ...(recipientEmail ? { recipientEmail } : {}),
                ...(decision ? { decision } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }
};
exports.ComplianceRepository = ComplianceRepository;
exports.ComplianceRepository = ComplianceRepository = ComplianceRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComplianceRepository);
//# sourceMappingURL=compliance.repository.js.map