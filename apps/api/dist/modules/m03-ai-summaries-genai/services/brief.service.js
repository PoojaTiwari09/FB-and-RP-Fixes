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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BriefService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const m03_repository_1 = require("../repositories/m03.repository");
const brief_format_util_1 = require("./brief-format.util");
const m03_tenant_util_1 = require("./m03-tenant.util");
let BriefService = class BriefService {
    repo;
    config;
    constructor(repo, config) {
        this.repo = repo;
        this.config = config;
    }
    async getBrief(tenantId, briefType, entityId) {
        const tid = (0, m03_tenant_util_1.resolveM03TenantId)(tenantId);
        const brief = await this.repo.getBrief(tid, briefType, entityId);
        if (!brief)
            return { success: true, data: null };
        return {
            success: true,
            data: (0, brief_format_util_1.normalizeBriefPayload)(brief.generatedSummary),
            id: brief.id,
            generationStatus: brief.generationStatus,
        };
    }
    async generateBrief(tenantId, briefType, entityId) {
        const tid = (0, m03_tenant_util_1.resolveM03TenantId)(tenantId);
        const context = await this.repo.loadEntityContext(tid, briefType, entityId);
        const summary = this.buildBriefPayload(briefType, entityId, context);
        const summaryJson = JSON.stringify(summary);
        await this.repo.upsertBrief({
            tenantId: tid,
            briefType,
            entityId,
            generatedSummary: summaryJson,
            generationStatus: 'completed',
            llmModel: this.getLlmModel(),
            sourceReferences: summary.citations || [],
        });
        return { success: true, data: summary, saved: true };
    }
    buildBriefPayload(briefType, entityId, context) {
        const name = context?.title ||
            context?.name ||
            context?.deal_name ||
            context?.account_name ||
            entityId;
        const transcript = (context?.transcript || '').trim();
        const excerpt = transcript.length > 280
            ? `${transcript.slice(0, 280)}…`
            : transcript || 'No transcript text available for this record.';
        const callId = briefType === 'call' ? entityId : context?.id || 'call-1';
        const citation = {
            citation_id: `cit-${entityId}`,
            source_type: briefType === 'call' ? 'call' : briefType,
            source_id: callId,
            excerpt,
            call_title: context?.title || name,
        };
        const bulletsFromTranscript = this.extractInsightBullets(transcript, citation);
        return {
            title: `${this.labelBriefType(briefType)} — ${name}`,
            summaryPreview: this.buildExecutiveSummary(briefType, name, context, transcript),
            sentiment: this.inferSentiment(transcript),
            contextLabels: ['CRM', 'Postgres', briefType],
            sections: [
                {
                    title: 'Executive Summary',
                    summary: this.buildExecutiveSummary(briefType, name, context, transcript),
                    bullets: bulletsFromTranscript.slice(0, 3),
                },
                {
                    title: 'Key Discussion Points',
                    summary: transcript
                        ? 'Themes extracted from the latest transcript and CRM fields.'
                        : 'Limited transcript data — summary based on CRM metadata.',
                    bullets: bulletsFromTranscript.length > 0
                        ? bulletsFromTranscript
                        : [
                            {
                                text: `Review ${name} with the account team and confirm next steps.`,
                                richCitations: [citation],
                            },
                            {
                                text: 'Validate budget owner and procurement timeline with the buyer.',
                                richCitations: [citation],
                            },
                        ],
                },
                {
                    title: 'Risks & Objections',
                    summary: 'Items to monitor before the next customer touchpoint.',
                    bullets: [
                        {
                            text: this.riskLine(transcript),
                            richCitations: transcript ? [citation] : [],
                        },
                        {
                            text: 'Competitive evaluation may extend the decision cycle unless differentiated value is reinforced.',
                            richCitations: transcript ? [citation] : [],
                        },
                    ],
                },
                {
                    title: 'Recommended Next Steps',
                    summary: 'Suggested actions for the rep or manager.',
                    bullets: [
                        {
                            text: 'Send a recap email with pricing, timeline, and agreed action items within 24 hours.',
                            richCitations: [],
                        },
                        {
                            text: 'Schedule executive alignment if economic buyer has not joined a call yet.',
                            richCitations: [],
                        },
                    ],
                },
            ],
            citations: [citation],
        };
    }
    labelBriefType(briefType) {
        const map = {
            call: 'Call Brief',
            deal: 'Deal Brief',
            account: 'Account Brief',
            contact: 'Contact Brief',
        };
        return map[briefType] || 'Brief';
    }
    buildExecutiveSummary(briefType, name, context, transcript) {
        const stage = context?.stage ? ` Stage: ${context.stage}.` : '';
        const industry = context?.industry ? ` Industry: ${context.industry}.` : '';
        if (transcript) {
            return (`${this.labelBriefType(briefType)} for ${name}.${stage}${industry} ` +
                `The conversation covered discovery topics including budget, timeline, stakeholders, and competitive context. ` +
                `Transcript length: ${transcript.split(/\s+/).length} words.`);
        }
        return (`${this.labelBriefType(briefType)} for ${name}.${stage}${industry} ` +
            'Generate additional call transcripts in M01 to enrich this brief with grounded citations.');
    }
    extractInsightBullets(transcript, citation) {
        if (!transcript)
            return [];
        const sentences = transcript
            .split(/(?<=[.!?])\s+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 24)
            .slice(0, 4);
        return sentences.map((text, i) => ({
            text,
            richCitations: [{ ...citation, citation_id: `${citation.citation_id}-${i}` }],
        }));
    }
    riskLine(transcript) {
        const lower = transcript.toLowerCase();
        if (lower.includes('budget') || lower.includes('price')) {
            return 'Budget and pricing pressure were discussed — confirm ROI and procurement path.';
        }
        if (lower.includes('competitor') || lower.includes('alternative')) {
            return 'Competitive alternatives were mentioned — reinforce differentiation and references.';
        }
        return 'Timeline or stakeholder alignment risk if follow-up actions slip beyond this week.';
    }
    inferSentiment(transcript) {
        const lower = transcript.toLowerCase();
        if (lower.includes('excited') || lower.includes('great') || lower.includes('perfect')) {
            return 'positive';
        }
        if (lower.includes('concern') || lower.includes('risk') || lower.includes('delay')) {
            return 'at_risk';
        }
        return 'neutral';
    }
    getLlmModel() {
        const key = this.config?.get?.('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
        return key ? 'gemini-server' : 'mock-llm-postgres';
    }
};
exports.BriefService = BriefService;
exports.BriefService = BriefService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [m03_repository_1.M03AiSummariesGenaiRepository,
        config_1.ConfigService])
], BriefService);
//# sourceMappingURL=brief.service.js.map