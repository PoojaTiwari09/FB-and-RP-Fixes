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
var VocabularyCorrectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocabularyCorrectionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let VocabularyCorrectionService = class VocabularyCorrectionService {
    static { VocabularyCorrectionService_1 = this; }
    prisma;
    logger = new common_1.Logger(VocabularyCorrectionService_1.name);
    static mockRules = [];
    static mockCorrections = [];
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRule(tenantId, incorrectTerm, correctTerm, language = 'en', category = 'Custom', mispronunciations = [], variations = []) {
        const newRule = {
            id: Date.now().toString(),
            tenantId,
            incorrectTerm,
            correctTerm,
            language,
            category,
            mispronunciations,
            variations,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        VocabularyCorrectionService_1.mockRules.push(newRule);
        try {
            const createdRule = await this.prisma.m02VocabularyCorrection.create({
                data: {
                    tenantId,
                    incorrectTerm,
                    correctTerm,
                    language,
                    category,
                    mispronunciations,
                    variations,
                    isActive: true,
                },
            });
            return createdRule;
        }
        catch (e) {
            this.logger.warn(`DB create failed, using in-memory mock: ${e.message}`);
            return newRule;
        }
    }
    async getRules(tenantId) {
        try {
            const dbRules = await this.prisma.m02VocabularyCorrection.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
            });
            if (dbRules.length > 0) {
                return dbRules;
            }
        }
        catch (e) {
            this.logger.warn('DB get failed, using in-memory mock');
        }
        const mockRules = VocabularyCorrectionService_1.mockRules.filter((r) => r.tenantId === tenantId);
        return mockRules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async deleteRule(id, tenantId) {
        try {
            return await this.prisma.m02VocabularyCorrection.delete({
                where: { id },
            });
        }
        catch (e) {
            this.logger.warn('DB delete failed, using in-memory mock');
            VocabularyCorrectionService_1.mockRules = VocabularyCorrectionService_1.mockRules.filter((r) => r.id !== id || r.tenantId !== tenantId);
            return { success: true };
        }
    }
    async getStats(tenantId) {
        try {
            const termsCount = await this.prisma.m02VocabularyCorrection.count({
                where: { tenantId }
            });
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const correctionsThisMonth = await this.prisma.m02TranscriptCorrection.count({
                where: {
                    tenantId,
                    appliedAt: { gte: firstDayOfMonth }
                }
            });
            const totalCalls = await this.prisma.m01Call.count({ where: { tenantId } });
            const totalEnhanced = await this.prisma.m01Call.count({
                where: { tenantId, correctionVersion: { gt: 0 } }
            });
            const enhancedPercent = totalCalls > 0 ? Math.round((totalEnhanced / totalCalls) * 100) : 0;
            return {
                termsCount,
                correctionsThisMonth,
                enhancedPercent
            };
        }
        catch (e) {
            this.logger.warn('DB stats failed, using in-memory mock');
            return {
                termsCount: VocabularyCorrectionService_1.mockRules.filter((r) => r.tenantId === tenantId).length,
                correctionsThisMonth: VocabularyCorrectionService_1.mockCorrections.length,
                enhancedPercent: VocabularyCorrectionService_1.mockCorrections.length > 0 ? 100 : 0
            };
        }
    }
    applyVocabularyCorrections(rawText, rules) {
        if (!rawText)
            return { correctedText: rawText, appliedRules: [] };
        let correctedText = rawText;
        const appliedRules = [];
        const sortedRules = [...rules]
            .filter((r) => r.isActive)
            .sort((a, b) => b.incorrectTerm.length - a.incorrectTerm.length);
        for (const rule of sortedRules) {
            const regex = new RegExp(`\\b${rule.incorrectTerm}\\b`, 'gi');
            const matches = correctedText.match(regex);
            if (matches) {
                matches.forEach(() => {
                    appliedRules.push({
                        originalTerm: rule.incorrectTerm,
                        correctedTerm: rule.correctTerm
                    });
                });
                correctedText = correctedText.replace(regex, rule.correctTerm);
            }
        }
        return { correctedText, appliedRules };
    }
    async correctTranscript(transcriptId, type, tenantId) {
        this.logger.log(`Starting vocabulary correction for ${type} ${transcriptId}`);
        let rawText = '';
        let currentVersion = 0;
        if (type === 'call') {
            const call = await this.prisma.m01Call.findUnique({ where: { id: transcriptId, tenantId } });
            if (!call)
                throw new Error('Call not found');
            rawText = call.transcript || '';
            currentVersion = call.correctionVersion;
        }
        else {
            const email = await this.prisma.m02Email.findUnique({ where: { id: transcriptId, tenantId } });
            if (!email)
                throw new Error('Email not found');
            rawText = email.body || '';
            currentVersion = email.correctionVersion;
        }
        if (!rawText) {
            this.logger.warn(`No raw text found for ${type} ${transcriptId}`);
            return;
        }
        const rawRules = await this.getRules(tenantId);
        const rules = rawRules.map((r) => ({
            vocabId: r.id,
            incorrectTerm: r.incorrectTerm,
            correctTerm: r.correctTerm,
            language: r.language,
            isActive: r.isActive
        }));
        const { correctedText, appliedRules } = this.applyVocabularyCorrections(rawText, rules);
        if (appliedRules.length > 0) {
            this.logger.log(`Applied ${appliedRules.length} corrections to ${transcriptId}. Saving version ${currentVersion + 1}`);
            for (const applied of appliedRules) {
                await this.prisma.m02TranscriptCorrection.create({
                    data: {
                        tenantId,
                        transcriptId,
                        originalTerm: applied.originalTerm,
                        correctedTerm: applied.correctedTerm,
                    }
                });
            }
            if (type === 'call') {
                await this.prisma.m01Call.update({
                    where: { id: transcriptId },
                    data: {
                        correctedTranscript: correctedText,
                        correctionVersion: currentVersion + 1
                    }
                });
            }
            else {
                await this.prisma.m02Email.update({
                    where: { id: transcriptId },
                    data: {
                        correctedTranscript: correctedText,
                        correctionVersion: currentVersion + 1
                    }
                });
            }
        }
        else {
            this.logger.log(`No vocabulary corrections needed for ${transcriptId}`);
            if (currentVersion === 0) {
                if (type === 'call') {
                    await this.prisma.m01Call.update({
                        where: { id: transcriptId },
                        data: { correctedTranscript: rawText }
                    });
                }
                else {
                    await this.prisma.m02Email.update({
                        where: { id: transcriptId },
                        data: { correctedTranscript: rawText }
                    });
                }
            }
        }
        return correctedText || rawText;
    }
};
exports.VocabularyCorrectionService = VocabularyCorrectionService;
exports.VocabularyCorrectionService = VocabularyCorrectionService = VocabularyCorrectionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VocabularyCorrectionService);
//# sourceMappingURL=vocabulary-correction.service.js.map