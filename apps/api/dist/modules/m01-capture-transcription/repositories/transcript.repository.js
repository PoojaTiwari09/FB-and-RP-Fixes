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
exports.TranscriptRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const pii_redaction_service_1 = require("../services/pii-redaction.service");
const LOW_CONFIDENCE_THRESHOLD = 0.80;
let TranscriptRepository = class TranscriptRepository {
    prisma;
    pii;
    constructor(prisma, pii) {
        this.prisma = prisma;
        this.pii = pii;
    }
    async create(data) {
        const { redactedText: redactedFullText } = this.pii.redact(data.fullText);
        const redactedUtterances = this.pii.redactUtterances(data.utterances);
        const utteranceRows = redactedUtterances.map((u) => ({
            tenantId: data.tenantId,
            speaker: u.speaker,
            text: u.text,
            originalText: u.originalText,
            startMs: u.startMs,
            endMs: u.endMs,
            confidence: u.confidence,
            isLowConfidence: u.confidence < LOW_CONFIDENCE_THRESHOLD,
            sequenceIndex: u.sequenceIndex,
        }));
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.transcript.findUnique({
                where: { callId: data.callId },
                select: { id: true },
            });
            if (existing) {
                await tx.utterance.deleteMany({ where: { transcriptId: existing.id } });
                return tx.transcript.update({
                    where: { id: existing.id },
                    data: {
                        fullText: redactedFullText,
                        assemblyAiJobId: data.assemblyAiJobId,
                        utterances: { create: utteranceRows },
                    },
                    include: { utterances: { orderBy: { sequenceIndex: 'asc' } } },
                });
            }
            return tx.transcript.create({
                data: {
                    tenantId: data.tenantId,
                    callId: data.callId,
                    fullText: redactedFullText,
                    assemblyAiJobId: data.assemblyAiJobId,
                    utterances: { create: utteranceRows },
                },
                include: { utterances: { orderBy: { sequenceIndex: 'asc' } } },
            });
        });
    }
    async patchAiFields(callId, tenantId, fields) {
        return this.prisma.transcript.updateMany({
            where: { callId, tenantId: tenantId },
            data: fields,
        });
    }
    async findByCallId(callId, tenantId) {
        return this.prisma.transcript.findFirst({
            where: { callId, tenantId: tenantId },
            include: { utterances: { orderBy: { sequenceIndex: 'asc' } } },
        });
    }
    async updateUtterance(utteranceId, tenantId, text) {
        const utterance = await this.prisma.utterance.findFirst({
            where: { id: utteranceId, transcript: { tenantId: tenantId } },
        });
        if (!utterance)
            throw new Error(`Utterance ${utteranceId} not found`);
        return this.prisma.utterance.update({
            where: { id: utteranceId },
            data: { text: text.trim() },
        });
    }
};
exports.TranscriptRepository = TranscriptRepository;
exports.TranscriptRepository = TranscriptRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pii_redaction_service_1.PiiRedactionService])
], TranscriptRepository);
//# sourceMappingURL=transcript.repository.js.map