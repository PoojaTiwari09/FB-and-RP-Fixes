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
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const hmac_webhook_guard_1 = require("../../platform-core/guards/hmac-webhook.guard");
const call_service_1 = require("../services/call.service");
const audit_log_service_1 = require("../services/audit-log.service");
let WebhookController = WebhookController_1 = class WebhookController {
    callService;
    audit;
    logger = new common_1.Logger(WebhookController_1.name);
    constructor(callService, audit) {
        this.callService = callService;
        this.audit = audit;
    }
    async handleZoomWebhook(body, tenantId) {
        this.logger.log(`[Webhook/Zoom] Received event: ${body.event}`);
        if (body.event !== 'recording.completed') {
            return { received: true, processed: false, reason: 'event_ignored' };
        }
        const meeting = body.payload.object;
        const audioFile = meeting.recording_files.find((f) => f.recording_type === 'audio_only' ||
            ['M4A', 'MP3'].includes(f.file_type.toUpperCase())) ?? meeting.recording_files.find((f) => f.file_type.toUpperCase() === 'MP4');
        if (!audioFile) {
            this.logger.warn(`[Webhook/Zoom] No audio file found for meeting ${meeting.uuid}`);
            return { received: true, processed: false, reason: 'no_audio_file' };
        }
        const call = await this.callService.createCall({
            title: meeting.topic || `Zoom Call ${meeting.id}`,
            callDate: new Date(meeting.start_time),
            durationSeconds: meeting.duration * 60,
            callType: 'meeting',
            callSource: 'zoom',
            participants: [meeting.host_email],
            callOwner: meeting.host_email,
            audioUrl: audioFile.download_url,
        }, tenantId);
        await this.audit.log({
            tenantId,
            actorType: 'system',
            action: 'webhook.zoom.received',
            entityType: 'CallRecord',
            entityId: call.id,
            meta: {
                meetingId: meeting.id,
                meetingUuid: meeting.uuid,
                topic: meeting.topic,
                audioUrl: audioFile.download_url,
            },
        });
        this.logger.log(`[Webhook/Zoom] ✅ Call created id=${call.id}, queued for transcription`);
        return { received: true, processed: true, callId: call.id };
    }
    async handleTeamsWebhook(body, tenantId) {
        this.logger.log(`[Webhook/Teams] Received ${body.value?.length ?? 0} notification(s)`);
        const results = [];
        for (const notification of body.value ?? []) {
            if (notification.changeType !== 'created')
                continue;
            const resourceId = notification.resourceData.id;
            const call = await this.callService.createCall({
                title: `Teams Call ${resourceId}`,
                callDate: new Date(),
                durationSeconds: 0,
                callType: 'meeting',
                callSource: 'teams',
                participants: [],
                callOwner: 'teams-bot',
                audioUrl: undefined,
            }, tenantId);
            await this.audit.log({
                tenantId,
                actorType: 'system',
                action: 'webhook.teams.received',
                entityType: 'CallRecord',
                entityId: call.id,
                meta: { resourceId, notification },
            });
            results.push({ callId: call.id, resourceId });
            this.logger.log(`[Webhook/Teams] ✅ Call placeholder created id=${call.id}`);
        }
        return { received: true, processed: results.length, calls: results };
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)('zoom'),
    (0, common_1.UseGuards)(hmac_webhook_guard_1.HmacWebhookGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-tenant-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleZoomWebhook", null);
__decorate([
    (0, common_1.Post)('teams'),
    (0, common_1.UseGuards)(hmac_webhook_guard_1.HmacWebhookGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-tenant-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleTeamsWebhook", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, common_1.Controller)('api/v1/webhooks'),
    __metadata("design:paramtypes", [call_service_1.CallService,
        audit_log_service_1.AuditLogService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map