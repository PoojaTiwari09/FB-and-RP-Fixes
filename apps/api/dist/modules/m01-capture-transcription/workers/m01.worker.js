"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var M01CaptureTranscriptionWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.M01CaptureTranscriptionWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const call_service_1 = require("../services/call.service");
const upload_paths_1 = require("../services/upload-paths");
const assemblyai_upload_1 = require("../services/assemblyai-upload");
let M01CaptureTranscriptionWorker = M01CaptureTranscriptionWorker_1 = class M01CaptureTranscriptionWorker extends bullmq_1.WorkerHost {
    callService;
    logger = new common_1.Logger(M01CaptureTranscriptionWorker_1.name);
    constructor(callService) {
        super();
        this.callService = callService;
    }
    async process(job) {
        const { callId, audioUrl, tenantId } = job.data;
        this.logger.log(`[M01 Worker] Starting job ${job.id} for call ${callId}`);
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        this.logger.log(`[M01 Worker] ASSEMBLYAI_API_KEY present: ${!!apiKey} (length: ${apiKey?.length ?? 0})`);
        if (!apiKey) {
            const reason = 'ASSEMBLYAI_API_KEY is not set in environment';
            await this.callService.onTranscriptionFailed(callId, tenantId, reason);
            throw new Error(reason);
        }
        try {
            this.logger.log(`[M01 Worker] Loading AssemblyAI SDK...`);
            const assemblyaiModule = require('assemblyai');
            const AssemblyAI = assemblyaiModule.AssemblyAI ?? assemblyaiModule.default?.AssemblyAI ?? assemblyaiModule.default;
            if (!AssemblyAI || typeof AssemblyAI !== 'function') {
                throw new Error(`AssemblyAI SDK failed to load. Got: ${typeof AssemblyAI} — keys: ${Object.keys(assemblyaiModule).join(', ')}`);
            }
            this.logger.log(`[M01 Worker] AssemblyAI SDK loaded OK.`);
            const client = new AssemblyAI({ apiKey });
            this.logger.log(`[M01 Worker] Client created OK.`);
            let audioSource;
            if (audioUrl.includes('localhost') || audioUrl.includes('127.0.0.1')) {
                const filename = audioUrl.split('/').pop().split('?')[0];
                const localPath = (0, upload_paths_1.getLocalAudioPath)(filename);
                const stat = fs.existsSync(localPath) ? fs.statSync(localPath) : null;
                this.logger.log(`[M01 Worker] Local file path: ${localPath}`);
                this.logger.log(`[M01 Worker] File exists: ${!!stat}, size: ${stat?.size ?? 0} bytes`);
                if (!stat || stat.size === 0) {
                    throw new Error(stat ? `Audio file is empty: ${localPath}` : `Audio file not found on disk: ${localPath}`);
                }
                this.logger.log(`[M01 Worker] Uploading ${filename} (${stat.size} bytes) to AssemblyAI...`);
                audioSource = await (0, assemblyai_upload_1.uploadAudioToAssemblyAI)(apiKey, filename);
                this.logger.log(`[M01 Worker] File uploaded. CDN URL: ${audioSource}`);
            }
            else {
                audioSource = audioUrl;
                this.logger.log(`[M01 Worker] Using public URL: ${audioSource}`);
            }
            this.logger.log(`[M01 Worker] Submitting transcription request...`);
            const transcript = await client.transcripts.transcribe({
                audio: audioSource,
                speaker_labels: true,
                speech_models: ['universal-2'],
            });
            this.logger.log(`[M01 Worker] Transcription status: ${transcript.status}`);
            if (transcript.status === 'error') {
                throw new Error(`AssemblyAI returned error: ${transcript.error ?? 'no error message'}`);
            }
            const speakerLabelMap = new Map();
            let speakerCounter = 1;
            const normalizeSpeaker = (rawLabel) => {
                const label = rawLabel ?? 'Unknown';
                if (!speakerLabelMap.has(label)) {
                    speakerLabelMap.set(label, `Speaker ${speakerCounter++}`);
                }
                return speakerLabelMap.get(label);
            };
            const utterances = (transcript.utterances ?? []).map((u, index) => ({
                speaker: normalizeSpeaker(u.speaker ?? 'Unknown'),
                text: u.text ?? '',
                startMs: u.start ?? 0,
                endMs: u.end ?? 0,
                confidence: u.confidence ?? 1,
                sequenceIndex: index,
            }));
            this.logger.log(`[M01 Worker] Speaker map: ${JSON.stringify(Object.fromEntries(speakerLabelMap))}`);
            const fullText = transcript.text ?? '';
            const audioDurationSec = typeof transcript.audio_duration === 'number' && transcript.audio_duration > 0
                ? Math.ceil(transcript.audio_duration)
                : 0;
            this.logger.log(`[M01 Worker] ✅ Done! ${utterances.length} utterances, ${fullText.length} chars, audio ${audioDurationSec}s`);
            await this.callService.onTranscriptionCompleted(callId, tenantId, {
                fullText,
                utterances,
                assemblyAiJobId: transcript.id,
                audioDurationSec,
            });
        }
        catch (err) {
            console.error('[M01 Worker] ===== RAW ERROR DUMP =====');
            console.error('[M01 Worker] Error object:', err);
            console.error('[M01 Worker] Type:', Object.prototype.toString.call(err));
            if (err instanceof Error) {
                console.error('[M01 Worker] name:', err.name);
                console.error('[M01 Worker] message:', err.message);
                console.error('[M01 Worker] stack:', err.stack);
            }
            else {
                console.error('[M01 Worker] stringified:', JSON.stringify(err));
            }
            console.error('[M01 Worker] ===========================');
            const reason = err instanceof Error
                ? (err.message || err.name || err.stack || 'Error with no message')
                : (String(err) || JSON.stringify(err) || 'Unknown failure');
            this.logger.error(`[M01 Worker] Transcription failed for call ${callId}: ${reason}`);
            await this.callService.onTranscriptionFailed(callId, tenantId, reason || 'Transcription failed');
            throw err;
        }
    }
};
exports.M01CaptureTranscriptionWorker = M01CaptureTranscriptionWorker;
exports.M01CaptureTranscriptionWorker = M01CaptureTranscriptionWorker = M01CaptureTranscriptionWorker_1 = __decorate([
    (0, bullmq_1.Processor)('m01-queue', {
        concurrency: 2,
    }),
    __metadata("design:paramtypes", [call_service_1.CallService])
], M01CaptureTranscriptionWorker);
//# sourceMappingURL=m01.worker.js.map