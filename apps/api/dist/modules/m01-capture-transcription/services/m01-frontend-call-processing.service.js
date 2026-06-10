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
exports.M01FrontendCallProcessingService = void 0;
const common_1 = require("@nestjs/common");
const call_service_1 = require("./call.service");
const call_ai_pipeline_service_1 = require("./call-ai-pipeline.service");
const m01_frontend_transcript_service_1 = require("./m01-frontend-transcript.service");
let M01FrontendCallProcessingService = class M01FrontendCallProcessingService {
    calls;
    pipeline;
    transcriptUi;
    constructor(calls, pipeline, transcriptUi) {
        this.calls = calls;
        this.pipeline = pipeline;
        this.transcriptUi = transcriptUi;
    }
    async getStatus(callId, tenantId) {
        const record = await this.calls.getCallDetail(callId, tenantId);
        if (!record)
            throw new common_1.NotFoundException('Call not found');
        const utteranceCount = record.transcript?.utterances?.length ?? 0;
        const status = record.transcriptStatus ?? 'pending';
        const hasSummary = Boolean(record.transcript?.summary?.trim());
        let phase = 'ready';
        if (status === 'processing' || status === 'pending') {
            phase = utteranceCount > 0 ? 'analyzing' : 'transcribing';
        }
        else if (status === 'failed') {
            phase = 'error';
        }
        else if (status === 'completed' && utteranceCount === 0) {
            phase = 'error';
        }
        else if (status === 'completed' && utteranceCount > 0 && !hasSummary) {
            phase = 'analyzing';
        }
        return {
            callId,
            transcriptStatus: status,
            phase,
            utteranceCount,
            hasSummary,
            hasAudio: Boolean(record.audioUrl),
            message: this.statusMessage(phase, status),
        };
    }
    statusMessage(phase, transcriptStatus) {
        if (phase === 'transcribing')
            return 'Transcribing recording…';
        if (phase === 'analyzing')
            return 'Analyzing transcript fields…';
        if (phase === 'error')
            return `Transcription ${transcriptStatus}. Retry processing.`;
        return 'Call is ready.';
    }
    async processCall(callId, tenantId) {
        const record = await this.calls.getCallDetail(callId, tenantId);
        if (!record)
            throw new common_1.NotFoundException('Call not found');
        const utteranceCount = record.transcript?.utterances?.length ?? 0;
        const status = record.transcriptStatus ?? 'pending';
        if (utteranceCount === 0) {
            if (!record.audioUrl) {
                return {
                    phase: 'error',
                    transcriptStatus: status,
                    message: 'No recording available to transcribe.',
                };
            }
            if (status !== 'processing') {
                await this.calls.enqueueTranscription(callId, tenantId);
            }
            return {
                phase: 'transcribing',
                transcriptStatus: 'processing',
                message: 'Generating transcript from recording…',
            };
        }
        if (status === 'processing') {
            return {
                phase: 'transcribing',
                transcriptStatus: 'processing',
                message: 'Transcription in progress…',
            };
        }
        if (status === 'failed') {
            if (record.audioUrl) {
                await this.calls.enqueueTranscription(callId, tenantId);
                return {
                    phase: 'transcribing',
                    transcriptStatus: 'processing',
                    message: 'Retrying transcription…',
                };
            }
            return {
                phase: 'error',
                transcriptStatus: status,
                message: record.failureReason || 'Transcription failed.',
            };
        }
        await this.pipeline.runForCall(tenantId, callId);
        await this.calls.syncCallMetadataFromTranscript(callId, tenantId);
        await this.transcriptUi.upsertAnalyzedBrief(callId, tenantId);
        return {
            phase: 'ready',
            transcriptStatus: 'completed',
            message: 'Transcript and analysis fields are ready.',
        };
    }
};
exports.M01FrontendCallProcessingService = M01FrontendCallProcessingService;
exports.M01FrontendCallProcessingService = M01FrontendCallProcessingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [call_service_1.CallService,
        call_ai_pipeline_service_1.CallAiPipelineService,
        m01_frontend_transcript_service_1.M01FrontendTranscriptService])
], M01FrontendCallProcessingService);
//# sourceMappingURL=m01-frontend-call-processing.service.js.map