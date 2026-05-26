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
let CallService = class CallService {
    constructor(calls, transcripts, notes, search, shares, events, queue) {
        this.calls = calls;
        this.transcripts = transcripts;
        this.notes = notes;
        this.search = search;
        this.shares = shares;
        this.events = events;
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
    async listCalls(tenantId, query) {
        return this.calls.findAll(tenantId, query);
    }
    async getCallDetail(callId, tenantId) {
        const call = await this.calls.findById(callId, tenantId);
        if (!call)
            throw new common_1.NotFoundException(`Call ${callId} not found`);
        return call;
    }
    async searchTranscripts(tenantId, query) {
        return this.search.searchAcrossOrg(tenantId, query.q, query.limit, query.offset);
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
    async onTranscriptionCompleted(callId, tenantId, transcriptData) {
        await this.transcripts.create({ tenantId, callId, ...transcriptData });
        await this.calls.updateStatus(callId, tenantId, 'completed');
        await this.events.publish('transcription.completed', { tenantId, callId });
    }
    async onTranscriptionFailed(callId, tenantId, reason) {
        await this.calls.updateStatus(callId, tenantId, 'failed', reason);
    }
};
exports.CallService = CallService;
exports.CallService = CallService = __decorate([
    (0, common_1.Injectable)(),
    __param(6, (0, bullmq_1.InjectQueue)('m01-queue')),
    __metadata("design:paramtypes", [call_repository_1.CallRepository,
        transcript_repository_1.TranscriptRepository,
        notes_repository_1.NotesRepository,
        search_repository_1.SearchRepository,
        search_repository_1.ShareRepository,
        event_publisher_service_1.EventPublisherService,
        bullmq_2.Queue])
], CallService);
