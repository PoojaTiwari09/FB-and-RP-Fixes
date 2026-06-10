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
exports.M01FrontendTranscriptService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const call_service_1 = require("../services/call.service");
const m01_frontend_transcript_schema_1 = require("./m01-frontend-transcript.schema");
const m01_frontend_transcript_mapper_1 = require("./m01-frontend-transcript.mapper");
const m01_frontend_next_steps_util_1 = require("./m01-frontend-next-steps.util");
const brief_field_analysis_1 = require("./brief-field-analysis");
const crypto_1 = require("crypto");
let M01FrontendTranscriptService = class M01FrontendTranscriptService {
    calls;
    prisma;
    briefs = new Map();
    constructor(calls, prisma) {
        this.calls = calls;
        this.prisma = prisma;
    }
    async loadCall(callId, tenantId) {
        const record = await this.calls.getCallDetail(callId, tenantId);
        if (!record)
            throw new common_1.NotFoundException('Call not found');
        return record;
    }
    async getTranscript(callId, tenantId, rawQuery) {
        const q = m01_frontend_transcript_schema_1.TranscriptListQuerySchema.parse(rawQuery);
        const record = await this.loadCall(callId, tenantId);
        let utterances = record.transcript?.utterances ?? [];
        if (q.search?.trim()) {
            const needle = q.search.trim().toLowerCase();
            utterances = utterances.filter((u) => u.text?.toLowerCase().includes(needle));
        }
        if (q.showLowConfidenceOnly) {
            utterances = utterances.filter((u) => u.isLowConfidence || (u.confidence ?? 1) < 0.8);
        }
        const totalCount = utterances.length;
        const offset = (q.page - 1) * q.size;
        const pageRows = utterances.slice(offset, offset + q.size);
        return {
            totalCount,
            transcript: pageRows.map(m01_frontend_transcript_mapper_1.mapUtterance),
        };
    }
    async getSummary(callId, tenantId) {
        const record = await this.loadCall(callId, tenantId);
        const t = record.transcript;
        return {
            summary: t?.summary || '—',
            generatedAt: (t?.updatedAt || t?.createdAt || new Date()).toISOString?.()
                ? new Date(t.updatedAt || t.createdAt).toISOString()
                : new Date().toISOString(),
        };
    }
    async getTalkRatio(callId, tenantId) {
        const record = await this.loadCall(callId, tenantId);
        return (0, m01_frontend_transcript_mapper_1.mapTalkRatio)(record.transcript?.talkRatio);
    }
    async getAudio(callId, tenantId) {
        const record = await this.loadCall(callId, tenantId);
        return (0, m01_frontend_transcript_mapper_1.mapAudio)(record);
    }
    async getTopics(callId, tenantId) {
        const record = await this.loadCall(callId, tenantId);
        return {
            topics: (0, m01_frontend_transcript_mapper_1.mapTopicsFromHighlights)(record.transcript?.keyHighlights),
        };
    }
    async getNextSteps(callId, tenantId) {
        const record = await this.loadCall(callId, tenantId);
        const steps = (0, m01_frontend_next_steps_util_1.parseNextSteps)(record.transcript?.nextSteps);
        return { nextSteps: steps };
    }
    async patchNextStep(callId, stepId, tenantId, body) {
        const dto = m01_frontend_transcript_schema_1.PatchNextStepSchema.parse(body);
        const record = await this.loadCall(callId, tenantId);
        const steps = (0, m01_frontend_next_steps_util_1.parseNextSteps)(record.transcript?.nextSteps);
        const idx = steps.findIndex((s) => s.stepId === stepId);
        if (idx < 0)
            throw new common_1.NotFoundException('Next step not found');
        steps[idx].completed = dto.completed;
        await this.prisma.transcript.updateMany({
            where: { callId, tenantId },
            data: { nextSteps: (0, m01_frontend_next_steps_util_1.serializeNextSteps)(steps) },
        });
        return {
            stepId,
            completed: dto.completed,
            updatedAt: new Date().toISOString(),
        };
    }
    buildBriefBody(record) {
        const t = record.transcript;
        const highlights = Array.isArray(t?.keyHighlights) ? t.keyHighlights : [];
        const utterances = Array.isArray(t?.utterances) ? t.utterances : [];
        const summary = t?.summary?.trim() ||
            (utterances.length > 0
                ? utterances
                    .slice(0, 3)
                    .map((u) => u.text)
                    .join(' ')
                    .slice(0, 500)
                : 'No summary available yet.');
        const account = record.accountId || record.accountName || '';
        return {
            overview: { text: summary },
            keyDiscussionPoints: (0, brief_field_analysis_1.deriveKeyDiscussionPointsFromUtterances)(utterances, highlights),
            customerNeeds: (0, brief_field_analysis_1.deriveCustomerNeeds)(highlights, summary),
            risks: (0, brief_field_analysis_1.deriveRisks)(highlights, summary),
            commitments: (0, m01_frontend_next_steps_util_1.parseNextSteps)(t?.nextSteps).map((s) => ({
                description: s.description,
                assigneeType: 'rep',
                dueDate: null,
            })),
            stakeholders: (0, brief_field_analysis_1.deriveStakeholdersFromCall)(record.participants, utterances, account),
            activityContext: [],
        };
    }
    analyzedBriefId(callId) {
        return `analyzed-${callId}`;
    }
    autoBriefId(callId) {
        return `auto-${callId}`;
    }
    async upsertAnalyzedBrief(callId, tenantId) {
        const record = await this.loadCall(callId, tenantId);
        const briefId = this.analyzedBriefId(callId);
        const body = this.buildBriefBody(record);
        const stored = {
            briefId,
            callId,
            briefTemplate: 'AI Call Analysis',
            period: 'Full Call',
            generatedAt: new Date().toISOString(),
            generatedFrom: 'ai-analysis',
            status: 'completed',
            body,
        };
        this.briefs.set(briefId, stored);
        return { briefId };
    }
    autoBriefGeneratedAt(record) {
        const t = record.transcript;
        const raw = t?.updatedAt || t?.createdAt || new Date();
        return raw instanceof Date ? raw.toISOString() : new Date(raw).toISOString();
    }
    async listBriefs(callId, tenantId, rawQuery) {
        const record = await this.loadCall(callId, tenantId);
        const page = Math.max(1, parseInt(rawQuery.page || '1', 10));
        const size = Math.min(100, Math.max(1, parseInt(rawQuery.size || '20', 10)));
        const stored = [...this.briefs.values()].filter((b) => b.callId === callId);
        let items = stored.map((b) => ({
            briefId: b.briefId,
            briefTemplate: b.briefTemplate,
            period: b.period,
            generatedAt: b.generatedAt,
            generatedFrom: b.generatedFrom,
        }));
        if (items.length === 0 && record.transcript) {
            const analyzedId = this.analyzedBriefId(callId);
            const analyzed = this.briefs.get(analyzedId);
            if (analyzed) {
                items = [
                    {
                        briefId: analyzed.briefId,
                        briefTemplate: analyzed.briefTemplate,
                        period: analyzed.period,
                        generatedAt: analyzed.generatedAt,
                        generatedFrom: analyzed.generatedFrom,
                    },
                ];
            }
            else {
                items = [
                    {
                        briefId: this.autoBriefId(callId),
                        briefTemplate: 'Transcript Analysis',
                        period: 'Full Call',
                        generatedAt: this.autoBriefGeneratedAt(record),
                        generatedFrom: 'transcript',
                    },
                ];
            }
        }
        const slice = items.slice((page - 1) * size, page * size);
        return { briefs: slice };
    }
    async getBrief(callId, briefId, tenantId) {
        const record = await this.loadCall(callId, tenantId);
        const analyzed = this.briefs.get(this.analyzedBriefId(callId));
        if (analyzed && (briefId === analyzed.briefId || briefId === this.analyzedBriefId(callId))) {
            return {
                briefId: analyzed.briefId,
                briefTemplate: analyzed.briefTemplate,
                period: analyzed.period,
                generatedAt: analyzed.generatedAt,
                generatedFrom: analyzed.generatedFrom,
                ...(analyzed.body || this.buildBriefBody(record)),
            };
        }
        if (briefId === this.autoBriefId(callId)) {
            return {
                briefId,
                briefTemplate: 'Transcript Analysis',
                period: 'Full Call',
                generatedAt: this.autoBriefGeneratedAt(record),
                generatedFrom: 'transcript',
                ...this.buildBriefBody(record),
            };
        }
        const b = this.briefs.get(briefId);
        if (!b || b.callId !== callId)
            throw new common_1.NotFoundException('Brief not found');
        return {
            briefId: b.briefId,
            briefTemplate: b.briefTemplate,
            period: b.period,
            generatedAt: b.generatedAt,
            generatedFrom: b.generatedFrom,
            ...(b.body || this.buildBriefBody(record)),
        };
    }
    async generateBrief(callId, tenantId, body) {
        const dto = m01_frontend_transcript_schema_1.GenerateBriefSchema.parse(body);
        const record = await this.loadCall(callId, tenantId);
        const briefId = (0, crypto_1.randomUUID)();
        const bodyContent = this.buildBriefBody(record);
        const stored = {
            briefId,
            callId,
            briefTemplate: dto.briefTemplate,
            period: dto.period,
            generatedAt: new Date().toISOString(),
            generatedFrom: 'ai',
            status: 'completed',
            body: bodyContent,
        };
        this.briefs.set(briefId, stored);
        return {
            briefId,
            briefTemplate: dto.briefTemplate,
            period: dto.period,
            generatedAt: stored.generatedAt,
            status: 'completed',
        };
    }
    getBriefTemplates() {
        return {
            templates: [
                { templateId: 'standard', templateName: 'Standard Call Brief' },
                { templateId: 'executive', templateName: 'Executive Summary' },
                { templateId: 'follow_up', templateName: 'Follow-up Brief' },
            ],
        };
    }
    getBriefPeriods() {
        return {
            periods: [
                { periodId: 'this_call', periodLabel: 'This call only' },
                { periodId: 'last_7_days', periodLabel: 'Last 7 days' },
                { periodId: 'last_30_days', periodLabel: 'Last 30 days' },
            ],
        };
    }
    shareLink(_callId, briefId) {
        if (!this.briefs.has(briefId))
            throw new common_1.NotFoundException('Brief not found');
        return {
            shareableLink: `https://app.example.com/shared/briefs/${briefId}`,
            expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        };
    }
    shareInternal(_callId, briefId, body) {
        m01_frontend_transcript_schema_1.ShareInternalSchema.parse(body);
        if (!this.briefs.has(briefId))
            throw new common_1.NotFoundException('Brief not found');
        const dto = m01_frontend_transcript_schema_1.ShareInternalSchema.parse(body);
        return {
            message: 'Brief shared successfully',
            sentTo: dto.recipientEmails,
        };
    }
    exportPdf(_callId, briefId) {
        if (!this.briefs.has(briefId))
            throw new common_1.NotFoundException('Brief not found');
        return {
            downloadUrl: `https://app.example.com/exports/briefs/${briefId}.pdf`,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
        };
    }
    formattedSummary(callId, briefId, tenantId) {
        return this.getBrief(callId, briefId, tenantId);
    }
};
exports.M01FrontendTranscriptService = M01FrontendTranscriptService;
exports.M01FrontendTranscriptService = M01FrontendTranscriptService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [call_service_1.CallService,
        prisma_service_1.PrismaService])
], M01FrontendTranscriptService);
//# sourceMappingURL=m01-frontend-transcript.service.js.map