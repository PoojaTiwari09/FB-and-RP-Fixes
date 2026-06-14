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
exports.EPrivacyRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
let EPrivacyRepository = class EPrivacyRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateConsent(tenantId, dto) {
        return this.prisma.m10EPrivacyConsent.create({
            data: {
                tenantid: tenantId,
                contactEmail: dto.contactEmail,
                channel: dto.channel,
                purpose: dto.purpose,
                status: dto.status,
                source: dto.source,
            },
        });
    }
    async getConsentStatus(tenantId, contactEmail, channel, purpose) {
        return this.prisma.m10EPrivacyConsent.findFirst({
            where: { tenantid: tenantId, contactEmail, channel, purpose },
            orderBy: { loggedAt: "desc" },
        });
    }
    async addSuppression(tenantId, dto) {
        return this.prisma.m10SuppressionEntry.upsert({
            where: {
                tenantid_contactEmail: {
                    tenantid: tenantId,
                    contactEmail: dto.contactEmail,
                },
            },
            update: { reason: dto.reason, addedAt: new Date() },
            create: {
                tenantid: tenantId,
                contactEmail: dto.contactEmail,
                reason: dto.reason,
            },
        });
    }
    async checkSuppression(tenantId, contactEmail) {
        return this.prisma.m10SuppressionEntry.findUnique({
            where: { tenantid_contactEmail: { tenantid: tenantId, contactEmail } },
        });
    }
};
exports.EPrivacyRepository = EPrivacyRepository;
exports.EPrivacyRepository = EPrivacyRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EPrivacyRepository);
//# sourceMappingURL=eprivacy.repository.js.map