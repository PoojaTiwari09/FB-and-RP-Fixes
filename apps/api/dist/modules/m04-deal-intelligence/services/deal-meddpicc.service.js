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
var DealMeddpiccService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealMeddpiccService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let DealMeddpiccService = DealMeddpiccService_1 = class DealMeddpiccService {
    prisma;
    logger = new common_1.Logger(DealMeddpiccService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findTranscriptsForDeal(dealExternalId) {
        const records = await this.prisma.call.findMany({
            where: { dealId: dealExternalId },
        });
        const texts = records
            .map((r) => r.transcriptText)
            .filter((t) => !!t && t.length > 0);
        this.logger.log(`Found ${texts.length} transcript(s) for deal ${dealExternalId}`);
        return texts;
    }
    async findStoredMeddpicc(dealExternalId) {
        return this.prisma.dealMeddpicc.findFirst({
            where: { dealExternalId },
        });
    }
    async upsertMeddpicc(dealExternalId, tenantId, result) {
        const existing = await this.prisma.dealMeddpicc.findFirst({
            where: { dealExternalId },
        });
        const payload = {
            tenantId: tenantId,
            dealExternalId,
            score: result.score,
            metrics: result.categoryAnswers.metrics || null,
            economicBuyer: result.categoryAnswers.economicBuyer || null,
            decisionCriteria: result.categoryAnswers.decisionCriteria || null,
            decisionProcess: result.categoryAnswers.decisionProcess || null,
            identifyPain: result.categoryAnswers.identifyPain || null,
            champion: result.categoryAnswers.champion || null,
            matchedCategories: result.matchedCategories,
            contactCount: result.contacts,
            aiNextStep: result.aiNextStep,
        };
        if (existing) {
            this.logger.log(`Updating DealMeddpicc for ${dealExternalId}`);
            return this.prisma.dealMeddpicc.update({
                where: { id: existing.id },
                data: payload,
            });
        }
        this.logger.log(`Creating DealMeddpicc for ${dealExternalId}`);
        return this.prisma.dealMeddpicc.create({ data: payload });
    }
};
exports.DealMeddpiccService = DealMeddpiccService;
exports.DealMeddpiccService = DealMeddpiccService = DealMeddpiccService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DealMeddpiccService);
//# sourceMappingURL=deal-meddpicc.service.js.map