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
exports.CallService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const call_repository_1 = require("../repositories/call.repository");
const transcript_repository_1 = require("../repositories/transcript.repository");
const notes_repository_1 = require("../repositories/notes.repository");
const search_repository_1 = require("../repositories/search.repository");
const event_publisher_service_1 = require("../../platform-core/events/event-publisher.service");
const m02_ingest_client_1 = require("./m02-ingest.client");
const s3_recordings_catalog_1 = require("./s3-recordings-catalog");
const fetch_remote_audio_1 = require("./fetch-remote-audio");
const upload_paths_1 = require("./upload-paths");
const public_audio_url_1 = require("./public-audio-url");
const call_duration_util_1 = require("./call-duration.util");
let CallService = class CallService {
    calls;
    transcripts;
    notes;
    search;
    shares;
    events;
    m02Ingest;
    queue;
    constructor(calls, transcripts, notes, search, shares, events, m02Ingest, queue) {
        this.calls = calls;
        this.transcripts = transcripts;
        this.notes = notes;
        this.search = search;
        this.shares = shares;
        this.events = events;
        this.m02Ingest = m02Ingest;
        this.queue = queue;
    }
    async createCall(dto, tenantId) {
        const call = await this.calls.create({ ...dto, tenantId });
        if (call.audioUrl) {
            await this.queue.add('transcribe', {
                callId: call.id,
                audioUrl: call.audioUrl,
                tenantId,
            });
            await this.calls.updateStatus(call.id, tenantId, 'processing');
        }
        return call;
    }
    async createCallFromUpload(data, tenantId) {
        const call = await this.calls.create({
            tenantId,
            title: data.title,
            callDate: new Date(),
            durationSeconds: 0,
            callType: 'meeting',
            callSource: 'manual',
            participants: [],
            callOwner: 'Uploader',
            audioUrl: data.audioUrl,
        });
        await this.queue.add('transcribe', {
            callId: call.id,
            audioUrl: data.audioUrl,
            tenantId,
        });
        await this.calls.updateStatus(call.id, tenantId, 'processing');
        return call;
    }
    async createCallFromS3Recording(dto, tenantId) {
        const entry = (0, s3_recordings_catalog_1.getS3RecordingById)(dto.recordingId);
        if (!entry) {
            throw new common_1.BadRequestException(`Unknown S3 recording: ${dto.recordingId}`);
        }
        const { filename, fileSizeBytes, mimeType } = await (0, fetch_remote_audio_1.downloadRemoteAudioToLocal)(entry.sourceUrl, entry.displayName);
        const rawName = entry.displayName.replace(/\.[^.]+$/, '');
        const title = rawName
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .trim() || 'S3 Recording';
        return this.createCallFromUpload({
            title,
            audioUrl: (0, upload_paths_1.getPublicAudioUrl)(filename),
            originalFilename: entry.displayName,
            fileSizeBytes,
            mimeType,
        }, tenantId);
    }
    async listCalls(tenantId, query) {
        return this.calls.findAll(tenantId, query);
    }
    async getCallDetail(callId, tenantId) {
        const call = await this.calls.findById(callId, tenantId);
        if (!call)
            throw new common_1.NotFoundException(`Call ${callId} not found`);
        return call;
    }
    async enqueueTranscription(callId, tenantId) {
        const call = await this.calls.findById(callId, tenantId);
        if (!call)
            throw new common_1.NotFoundException(`Call ${callId} not found`);
        if (!call.audioUrl) {
            throw new common_1.BadRequestException('Call has no recording to transcribe');
        }
        const audioUrl = (0, public_audio_url_1.resolvePublicTranscriptionUrl)(call.audioUrl, callId);
        await this.queue.add('transcribe', { callId, audioUrl, tenantId });
        await this.calls.updateStatus(callId, tenantId, 'processing');
        return { callId, transcriptStatus: 'processing' };
    }
    async searchTranscripts(tenantId, query) {
        return this.search.searchAcrossOrg(tenantId, query);
    }
    async searchWithinCall(callId, tenantId, query) {
        return this.search.searchWithinCall(callId, tenantId, query.q);
    }
    async createNote(callId, tenantId, authorId, dto) {
        return this.notes.create(callId, tenantId, authorId, dto);
    }
    async updateNote(noteId, tenantId, dto) {
        return this.notes.update(noteId, tenantId, dto);
    }
    async deleteNote(noteId, tenantId) {
        return this.notes.delete(noteId, tenantId);
    }
    async shareCall(callId, tenantId, userId, dto) {
        return this.shares.share(callId, tenantId, userId, dto);
    }
    async updateUtterance(utteranceId, tenantId, text) {
        return this.transcripts.updateUtterance(utteranceId, tenantId, text);
    }
    async syncCallMetadataFromTranscript(callId, tenantId) {
        const record = await this.getCallDetail(callId, tenantId);
        if (!record)
            return;
        const utterances = record.transcript?.utterances ?? [];
        const durationSeconds = (0, call_duration_util_1.durationSecondsFromUtterances)(utterances);
        if (durationSeconds > 0) {
            await this.calls.updateDurationSeconds(callId, tenantId, durationSeconds);
        }
        const speakers = (0, call_duration_util_1.uniqueSpeakersFromUtterances)(utterances);
        if (speakers.length > 0) {
            await this.calls.updateParticipants(callId, tenantId, speakers);
        }
    }
    async onTranscriptionCompleted(callId, tenantId, transcriptData) {
        const tx = await this.transcripts.create({ tenantId, callId, ...transcriptData });
        const durationSeconds = transcriptData.audioDurationSec && transcriptData.audioDurationSec > 0
            ? transcriptData.audioDurationSec
            : (0, call_duration_util_1.durationSecondsFromUtterances)(transcriptData.utterances);
        if (durationSeconds > 0) {
            await this.calls.updateDurationSeconds(callId, tenantId, durationSeconds);
        }
        const speakers = (0, call_duration_util_1.uniqueSpeakersFromUtterances)(transcriptData.utterances);
        if (speakers.length > 0) {
            await this.calls.updateParticipants(callId, tenantId, speakers);
        }
        await this.calls.updateStatus(callId, tenantId, 'completed');
        const envelope = {
            tenantId,
            callId,
            transcriptId: tx?.id,
            sourceType: 'call',
            sourcePlatform: 'm01-capture-transcription',
            sourceRecordId: callId,
            occurredAt: new Date().toISOString(),
            participants: [],
            crmHints: {},
            artifacts: { transcriptId: tx?.id, assemblyAiJobId: transcriptData.assemblyAiJobId },
        };
        await this.events.publish('call.transcription.completed', envelope);
        await this.events.publish('transcription.completed', envelope);
        await this.m02Ingest.notifyTranscriptionCompleted({
            tenantId,
            callId,
            transcriptId: tx?.id,
            sourcePlatform: 'm01-capture-transcription',
            occurredAt: envelope.occurredAt,
        });
    }
    async onTranscriptionFailed(callId, tenantId, reason) {
        await this.calls.updateStatus(callId, tenantId, 'failed', reason);
    }
    async markSkipped(callId, tenantId, skipReason) {
        await this.calls.updateSkipped(callId, tenantId, skipReason);
    }
    async deleteCall(callId, tenantId) {
        const exists = await this.calls.findById(callId, tenantId);
        if (!exists)
            throw new common_1.NotFoundException(`Call ${callId} not found`);
        const res = await this.calls.deleteById(callId, tenantId);
        return { success: res.count > 0 };
    }
    async triggerAiExtraction(callId, tenantId) {
        const call = await this.calls.findById(callId, tenantId);
        if (!call)
            throw new common_1.NotFoundException(`Call ${callId} not found`);
        const transcript = await this.transcripts.findByCallId(callId, tenantId);
        if (!transcript) {
            throw new common_1.BadRequestException(`Call ${callId} has no transcript yet — wait for transcription to complete`);
        }
        const envelope = {
            tenantId,
            callId,
            transcriptId: transcript.id,
            sourceType: 'call',
            sourcePlatform: 'm01-capture-transcription',
            sourceRecordId: callId,
            occurredAt: new Date().toISOString(),
            participants: [],
            crmHints: {},
            artifacts: { transcriptId: transcript.id, manualReplay: true },
        };
        await this.events.publish('call.transcription.completed', envelope);
        await this.events.publish('transcription.completed', envelope);
        await this.m02Ingest.notifyTranscriptionCompleted({
            tenantId,
            callId,
            transcriptId: transcript.id,
            sourcePlatform: 'm01-capture-transcription',
            occurredAt: envelope.occurredAt,
        });
        return {
            accepted: true,
            callId,
            transcriptId: transcript.id,
            message: 'AI extraction pipeline triggered',
        };
    }
    async publishTranscriptionFailed(callId, tenantId, reason) {
        await this.events.publish('call.transcription.failed', {
            tenantId, callId, reason, occurredAt: new Date().toISOString(),
        });
    }
};
exports.CallService = CallService;
exports.CallService = CallService = __decorate([
    (0, common_1.Injectable)(),
    __param(7, (0, bullmq_1.InjectQueue)('m01-queue')),
    __metadata("design:paramtypes", [call_repository_1.CallRepository,
        transcript_repository_1.TranscriptRepository,
        notes_repository_1.NotesRepository,
        search_repository_1.SearchRepository,
        search_repository_1.ShareRepository,
        event_publisher_service_1.EventPublisherService,
        m02_ingest_client_1.M02IngestClient,
        bullmq_2.Queue])
], CallService);
//# sourceMappingURL=call.service.js.map