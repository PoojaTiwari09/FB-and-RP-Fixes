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
var AiExtractionSubscriber_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiExtractionSubscriber = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const call_ai_pipeline_service_1 = require("./call-ai-pipeline.service");
let AiExtractionSubscriber = AiExtractionSubscriber_1 = class AiExtractionSubscriber {
    pipeline;
    logger = new common_1.Logger(AiExtractionSubscriber_1.name);
    constructor(pipeline) {
        this.pipeline = pipeline;
    }
    async handleTranscriptionCompleted(payload) {
        const { tenantId, callId } = payload;
        this.logger.log(`[AiExtraction] call.transcription.completed — callId=${callId}`);
        await this.pipeline.runForCall(tenantId, callId);
        this.logger.log(`[AiExtraction] ✅ Pipeline complete for callId=${callId}`);
    }
    async handleLegacy(payload) {
        await this.handleTranscriptionCompleted(payload);
    }
};
exports.AiExtractionSubscriber = AiExtractionSubscriber;
__decorate([
    (0, event_emitter_1.OnEvent)('call.transcription.completed', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiExtractionSubscriber.prototype, "handleTranscriptionCompleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('transcription.completed', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiExtractionSubscriber.prototype, "handleLegacy", null);
exports.AiExtractionSubscriber = AiExtractionSubscriber = AiExtractionSubscriber_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [call_ai_pipeline_service_1.CallAiPipelineService])
], AiExtractionSubscriber);
//# sourceMappingURL=ai-extraction.subscriber.js.map