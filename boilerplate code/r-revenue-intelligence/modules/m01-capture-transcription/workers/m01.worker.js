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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var M01CaptureTranscriptionWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.M01CaptureTranscriptionWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const call_service_1 = require("../services/call.service");
let M01CaptureTranscriptionWorker = M01CaptureTranscriptionWorker_1 = class M01CaptureTranscriptionWorker extends bullmq_1.WorkerHost {
    constructor(callService) {
        super();
        this.callService = callService;
        this.logger = new common_1.Logger(M01CaptureTranscriptionWorker_1.name);
        this.aiServiceUrl = process.env.TRANSCRIPTION_SERVICE_URL ?? 'http://localhost:8000';
    }
    async process(job) {
        const { callId, audioUrl, tenantId } = job.data;
        this.logger.log(`[M01 Worker] Processing transcription job ${job.id} for call ${callId}`);
        try {
            const response = await axios_1.default.post(`${this.aiServiceUrl}/v1/transcribe`, { audioUrl, callId, tenantId }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.TRANSCRIPTION_SERVICE_AUTH_TOKEN ?? 'local-dev-token'}`,
                },
                timeout: Number(process.env.TRANSCRIPTION_SERVICE_TIMEOUT_MS ?? 300_000),
            });
            const { jobId, fullText, utterances } = response.data;
            await this.callService.onTranscriptionCompleted(callId, tenantId, {
                fullText,
                utterances,
                assemblyAiJobId: jobId,
            });
            this.logger.log(`[M01 Worker] Transcription completed for call ${callId}`);
        }
        catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            this.logger.error(`[M01 Worker] Transcription failed for call ${callId}: ${reason}`);
            await this.callService.onTranscriptionFailed(callId, tenantId, reason);
            throw err;
        }
    }
};
exports.M01CaptureTranscriptionWorker = M01CaptureTranscriptionWorker;
exports.M01CaptureTranscriptionWorker = M01CaptureTranscriptionWorker = M01CaptureTranscriptionWorker_1 = __decorate([
    (0, bullmq_1.Processor)('m01-queue'),
    __metadata("design:paramtypes", [call_service_1.CallService])
], M01CaptureTranscriptionWorker);
