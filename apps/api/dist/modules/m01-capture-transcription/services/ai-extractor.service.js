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
exports.AiExtractorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const transcript_repository_1 = require("../repositories/transcript.repository");
const custom_field_extraction_1 = require("./custom-field-extraction");
let AiExtractorService = class AiExtractorService {
    prisma;
    transcripts;
    constructor(prisma, transcripts) {
        this.prisma = prisma;
        this.transcripts = transcripts;
    }
    fieldDelegate() {
        return this.prisma.aiExtractionField;
    }
    resultDelegate() {
        return this.prisma.aiExtractionResult;
    }
    async listFields(tenantId) {
        const d = this.fieldDelegate();
        if (!d?.findMany)
            return [];
        return d.findMany({
            where: { tenantId },
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        });
    }
    async createField(tenantId, body) {
        const d = this.fieldDelegate();
        if (!d?.create)
            throw new common_1.NotFoundException('AiExtractionField model unavailable');
        return d.create({
            data: {
                tenantId,
                question: String(body.question ?? ''),
                fieldLabel: String(body.fieldLabel ?? ''),
                fieldName: String(body.fieldName ?? 'field'),
                dataType: String(body.dataType ?? 'text'),
                enumOptions: Array.isArray(body.enumOptions) ? body.enumOptions : [],
                extractionHint: body.extractionHint ? String(body.extractionHint) : null,
                crmObject: body.crmObject ? String(body.crmObject) : null,
                crmField: body.crmField ? String(body.crmField) : null,
                isActive: false,
            },
        });
    }
    async updateField(tenantId, id, body) {
        await this.getField(tenantId, id);
        const d = this.fieldDelegate();
        return d.update({
            where: { id },
            data: {
                ...(body.question !== undefined && { question: String(body.question) }),
                ...(body.fieldLabel !== undefined && { fieldLabel: String(body.fieldLabel) }),
                ...(body.fieldName !== undefined && { fieldName: String(body.fieldName) }),
                ...(body.dataType !== undefined && { dataType: String(body.dataType) }),
                ...(body.enumOptions !== undefined && {
                    enumOptions: Array.isArray(body.enumOptions) ? body.enumOptions : [],
                }),
                ...(body.extractionHint !== undefined && {
                    extractionHint: body.extractionHint ? String(body.extractionHint) : null,
                }),
                ...(body.crmObject !== undefined && {
                    crmObject: body.crmObject ? String(body.crmObject) : null,
                }),
                ...(body.crmField !== undefined && {
                    crmField: body.crmField ? String(body.crmField) : null,
                }),
            },
        });
    }
    async deleteField(tenantId, id) {
        await this.getField(tenantId, id);
        const d = this.fieldDelegate();
        await d.delete({ where: { id } });
        return { success: true };
    }
    async toggleField(tenantId, id, isActive) {
        await this.getField(tenantId, id);
        const d = this.fieldDelegate();
        return d.update({ where: { id }, data: { isActive: !!isActive } });
    }
    async getField(tenantId, id) {
        const d = this.fieldDelegate();
        const row = await d.findFirst({ where: { id, tenantId } });
        if (!row)
            throw new common_1.NotFoundException(`Field ${id} not found`);
        return row;
    }
    async getCallResults(tenantId, callId) {
        const d = this.resultDelegate();
        if (!d?.findMany)
            return [];
        return d.findMany({
            where: { tenantId, callId },
            include: { field: true },
        });
    }
    async runExtraction(tenantId, callId) {
        const { fullText, utterances } = await this.loadTranscript(callId, tenantId);
        const d = this.fieldDelegate();
        const fields = await d.findMany({
            where: { tenantId, isActive: true },
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        });
        for (const field of fields) {
            await this.extractAndSave(tenantId, callId, field, fullText, utterances);
        }
        return this.getCallResults(tenantId, callId);
    }
    async testField(tenantId, fieldId, callId) {
        const field = await this.getField(tenantId, fieldId);
        const { fullText, utterances } = await this.loadTranscript(callId, tenantId);
        const saved = await this.extractAndSave(tenantId, callId, field, fullText, utterances);
        return {
            fieldId,
            fieldName: field.fieldName,
            extractedValue: saved.extractedValue,
            rawEvidence: saved.rawEvidence,
            evidenceTimestampMs: saved.evidenceTimestampMs,
            confidenceScore: saved.confidenceScore,
        };
    }
    async loadTranscript(callId, tenantId) {
        const transcript = await this.transcripts.findByCallId(callId, tenantId);
        if (!transcript) {
            throw new common_1.BadRequestException(`Call ${callId} has no transcript yet — wait for transcription to complete`);
        }
        const utterances = (transcript.utterances ?? []).map((u) => ({
            text: u.text,
            startMs: u.startMs,
            speaker: u.speaker,
        }));
        return { fullText: transcript.fullText ?? '', utterances };
    }
    async extractAndSave(tenantId, callId, field, fullText, utterances) {
        const out = (0, custom_field_extraction_1.extractCustomField)({
            question: field.question,
            fieldLabel: field.fieldLabel,
            fieldName: field.fieldName,
            dataType: field.dataType,
            extractionHint: field.extractionHint,
            enumOptions: field.enumOptions,
        }, fullText, utterances);
        const d = this.resultDelegate();
        if (!d?.upsert) {
            throw new common_1.NotFoundException('AiExtractionResult model unavailable');
        }
        return d.upsert({
            where: {
                fieldId_callId: { fieldId: field.id, callId },
            },
            create: {
                tenantId,
                fieldId: field.id,
                callId,
                extractedValue: out.extractedValue,
                rawEvidence: out.rawEvidence,
                evidenceTimestampMs: out.evidenceTimestampMs,
                confidenceScore: out.confidenceScore,
                isManualOverride: false,
            },
            update: {
                extractedValue: out.extractedValue,
                rawEvidence: out.rawEvidence,
                evidenceTimestampMs: out.evidenceTimestampMs,
                confidenceScore: out.confidenceScore,
                extractedAt: new Date(),
                isManualOverride: false,
            },
            include: { field: true },
        });
    }
};
exports.AiExtractorService = AiExtractorService;
exports.AiExtractorService = AiExtractorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        transcript_repository_1.TranscriptRepository])
], AiExtractorService);
//# sourceMappingURL=ai-extractor.service.js.map