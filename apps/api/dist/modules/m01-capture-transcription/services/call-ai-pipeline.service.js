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
var CallAiPipelineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallAiPipelineService = void 0;
const common_1 = require("@nestjs/common");
const transcript_repository_1 = require("../repositories/transcript.repository");
const ai_extractor_service_1 = require("./ai-extractor.service");
const ai_extraction_client_1 = require("./ai-extraction.client");
let CallAiPipelineService = CallAiPipelineService_1 = class CallAiPipelineService {
    transcripts;
    aiClient;
    aiExtractor;
    logger = new common_1.Logger(CallAiPipelineService_1.name);
    constructor(transcripts, aiClient, aiExtractor) {
        this.transcripts = transcripts;
        this.aiClient = aiClient;
        this.aiExtractor = aiExtractor;
    }
    async runForCall(tenantId, callId) {
        const transcript = await this.transcripts.findByCallId(callId, tenantId);
        if (!transcript) {
            this.logger.warn(`[CallAiPipeline] No transcript for callId=${callId}`);
            return;
        }
        const utterances = transcript.utterances.map((u) => ({
            speaker: u.speaker,
            text: u.text,
            start_ms: u.startMs,
            end_ms: u.endMs,
            sequence_index: u.sequenceIndex,
        }));
        const fullText = transcript.fullText || utterances.map((u) => u.text).join(' ');
        await this.runSummarize(tenantId, callId, fullText, utterances);
        await this.runHighlights(tenantId, callId, fullText, utterances);
        await this.runTalkRatio(tenantId, callId, utterances);
        try {
            await this.aiExtractor.runExtraction(tenantId, callId);
        }
        catch (err) {
            this.logger.error(`[CallAiPipeline][CustomFields] callId=${callId}`, err);
        }
    }
    normalizeTalkRatio(result) {
        const speakers = result.speakers ?? [];
        if (speakers.length === 0) {
            return { Rep: { durationMs: 0, percentage: 0.5 }, Customer: { durationMs: 0, percentage: 0.5 } };
        }
        const sorted = [...speakers].sort((a, b) => b.duration_ms - a.duration_ms);
        const rep = sorted[0];
        const customer = sorted[1] ?? sorted[0];
        return {
            Rep: { durationMs: rep.duration_ms, percentage: rep.percentage },
            Customer: {
                durationMs: customer.duration_ms,
                percentage: customer.percentage ?? 1 - (rep.percentage ?? 0.5),
            },
        };
    }
    async runSummarize(tenantId, callId, fullText, utterances) {
        try {
            const result = await this.aiClient.summarize(tenantId, callId, fullText, utterances);
            if (result.flagged_for_review)
                return;
            await this.transcripts.patchAiFields(callId, tenantId, {
                summary: result.summary,
                nextSteps: result.next_steps,
            });
        }
        catch (err) {
            this.logger.error(`[CallAiPipeline][Summarize] callId=${callId}`, err);
        }
    }
    async runHighlights(tenantId, callId, fullText, utterances) {
        try {
            const result = await this.aiClient.extractHighlights(tenantId, callId, fullText, utterances);
            if (result.flagged_for_review)
                return;
            await this.transcripts.patchAiFields(callId, tenantId, {
                keyHighlights: result.highlights,
            });
        }
        catch (err) {
            this.logger.error(`[CallAiPipeline][Highlights] callId=${callId}`, err);
        }
    }
    async runTalkRatio(tenantId, callId, utterances) {
        try {
            const result = await this.aiClient.computeTalkRatio(tenantId, callId, utterances);
            await this.transcripts.patchAiFields(callId, tenantId, {
                talkRatio: this.normalizeTalkRatio(result),
            });
        }
        catch (err) {
            this.logger.error(`[CallAiPipeline][TalkRatio] callId=${callId}`, err);
        }
    }
};
exports.CallAiPipelineService = CallAiPipelineService;
exports.CallAiPipelineService = CallAiPipelineService = CallAiPipelineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [transcript_repository_1.TranscriptRepository,
        ai_extraction_client_1.AiExtractionClient,
        ai_extractor_service_1.AiExtractorService])
], CallAiPipelineService);
//# sourceMappingURL=call-ai-pipeline.service.js.map