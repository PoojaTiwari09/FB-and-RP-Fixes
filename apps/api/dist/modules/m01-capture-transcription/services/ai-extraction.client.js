"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AiExtractionClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiExtractionClient = void 0;
const common_1 = require("@nestjs/common");
const ai_extraction_local_1 = require("./ai-extraction-local");
const AI_SERVICES_URL = process.env.AI_SERVICES_URL ?? 'http://localhost:8000';
const FORCE_LOCAL = process.env.AI_SERVICES_USE_LOCAL_FALLBACK === 'true' ||
    process.env.DISABLE_AI_SERVICES === 'true';
function isServiceUnreachable(err) {
    if (!(err instanceof Error))
        return false;
    const msg = err.message.toLowerCase();
    if (msg.includes('fetch failed') || msg.includes('econnrefused'))
        return true;
    const cause = err.cause;
    return cause?.code === 'ECONNREFUSED' || cause?.code === 'ENOTFOUND';
}
let AiExtractionClient = AiExtractionClient_1 = class AiExtractionClient {
    logger = new common_1.Logger(AiExtractionClient_1.name);
    async summarize(tenantId, callId, fullText, utterances) {
        if (FORCE_LOCAL)
            return (0, ai_extraction_local_1.summarizeLocal)(fullText);
        return this.post('/v1/extract/summarize', { tenant_id: tenantId, call_id: callId, full_text: fullText, utterances }, () => (0, ai_extraction_local_1.summarizeLocal)(fullText));
    }
    async extractHighlights(tenantId, callId, fullText, utterances) {
        if (FORCE_LOCAL)
            return (0, ai_extraction_local_1.extractHighlightsLocal)(utterances);
        return this.post('/v1/extract/highlights', { tenant_id: tenantId, call_id: callId, full_text: fullText, utterances }, () => (0, ai_extraction_local_1.extractHighlightsLocal)(utterances));
    }
    async computeTalkRatio(tenantId, callId, utterances) {
        if (FORCE_LOCAL)
            return (0, ai_extraction_local_1.computeTalkRatioLocal)(utterances);
        return this.post('/v1/extract/talk-ratio', { tenant_id: tenantId, call_id: callId, utterances }, () => (0, ai_extraction_local_1.computeTalkRatioLocal)(utterances));
    }
    async post(path, body, localFallback) {
        const url = `${AI_SERVICES_URL}${path}`;
        this.logger.debug(`[AiExtractionClient] POST ${url}`);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(30_000),
            });
            if (!response.ok) {
                const text = await response.text();
                this.logger.error(`[AiExtractionClient] ${path} responded ${response.status}: ${text}`);
                throw new Error(`ai-services ${path} failed: ${response.status}`);
            }
            return response.json();
        }
        catch (err) {
            if (isServiceUnreachable(err)) {
                this.logger.warn(`[AiExtractionClient] ai-services unreachable at ${AI_SERVICES_URL} — using local fallback for ${path}`);
                return localFallback();
            }
            throw err;
        }
    }
};
exports.AiExtractionClient = AiExtractionClient;
exports.AiExtractionClient = AiExtractionClient = AiExtractionClient_1 = __decorate([
    (0, common_1.Injectable)()
], AiExtractionClient);
//# sourceMappingURL=ai-extraction.client.js.map