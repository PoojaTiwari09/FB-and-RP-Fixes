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
var ConversationIngestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationIngestService = void 0;
const common_1 = require("@nestjs/common");
const m02_repository_1 = require("../repositories/m02.repository");
const event_publisher_service_1 = require("../../platform-core/events/event-publisher.service");
let ConversationIngestService = ConversationIngestService_1 = class ConversationIngestService {
    repo;
    events;
    logger = new common_1.Logger(ConversationIngestService_1.name);
    constructor(repo, events) {
        this.repo = repo;
        this.events = events;
    }
    async ingestFromTranscription(payload) {
        const { tenantId, callId, transcriptId } = payload;
        const conversation = await this.repo.findConversationById(callId, tenantId);
        if (!conversation) {
            throw new common_1.NotFoundException(`Call ${callId} not found for tenant ${tenantId}. Ensure M01 persisted the transcript before ingest.`);
        }
        const syncLog = await this.repo.createSyncLog({
            entityType: 'transcript',
            entityId: transcriptId || callId,
            idempotencyKey: `m01:${callId}:${transcriptId || 'latest'}`,
            recordsSynced: 1,
        }, tenantId);
        await this.events.publish('call.scored', {
            tenantId,
            callId,
            transcriptId: transcriptId || callId,
            conversationId: callId,
            sourcePlatform: payload.sourcePlatform || 'm01-capture-transcription',
            occurredAt: payload.occurredAt || new Date().toISOString(),
            syncLogId: syncLog.id,
        });
        this.logger.log(`Ingested call ${callId} for tenant ${tenantId} (syncLog=${syncLog.id})`);
        return {
            accepted: true,
            callId,
            tenantId,
            conversation,
            syncLog,
        };
    }
};
exports.ConversationIngestService = ConversationIngestService;
exports.ConversationIngestService = ConversationIngestService = ConversationIngestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [m02_repository_1.M02ConversationIntelligenceRepository,
        event_publisher_service_1.EventPublisherService])
], ConversationIngestService);
//# sourceMappingURL=ingest.service.js.map