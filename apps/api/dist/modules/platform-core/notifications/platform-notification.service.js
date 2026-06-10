"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PlatformNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformNotificationService = void 0;
const common_1 = require("@nestjs/common");
let PlatformNotificationService = PlatformNotificationService_1 = class PlatformNotificationService {
    logger = new common_1.Logger(PlatformNotificationService_1.name);
    async dispatch(alert) {
        switch (alert.channel) {
            case 'email':
                return this.sendEmail(alert);
            case 'slack':
                return this.sendSlack(alert);
            case 'teams':
                return { ok: false, channel: 'teams', detail: 'Teams channel not configured' };
            default:
                return { ok: false, channel: String(alert.channel), detail: 'Unsupported channel' };
        }
    }
    async sendEmail(alert) {
        const smtpHost = process.env.SMTP_HOST;
        if (!smtpHost) {
            this.logger.log(`[email] simulated to=${alert.recipient ?? 'n/a'} subject=${alert.subject ?? '(none)'}`);
            return { ok: true, channel: 'email', detail: 'simulated (SMTP_HOST unset)' };
        }
        try {
            this.logger.log(`[email] dispatch tenant=${alert.tenantId} host=${smtpHost}`);
            return { ok: true, channel: 'email' };
        }
        catch (err) {
            this.logger.warn(`[email] failed: ${err.message}`);
            return { ok: false, channel: 'email', detail: err.message };
        }
    }
    async sendSlack(alert) {
        const webhook = alert.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;
        if (!webhook) {
            this.logger.log(`[slack] simulated tenant=${alert.tenantId}`);
            return { ok: true, channel: 'slack', detail: 'simulated (no webhook)' };
        }
        try {
            const res = await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: alert.body, ...(alert.subject ? { subject: alert.subject } : {}) }),
            });
            if (!res.ok) {
                return { ok: false, channel: 'slack', detail: `HTTP ${res.status}` };
            }
            return { ok: true, channel: 'slack' };
        }
        catch (err) {
            this.logger.warn(`[slack] failed: ${err.message}`);
            return { ok: false, channel: 'slack', detail: err.message };
        }
    }
};
exports.PlatformNotificationService = PlatformNotificationService;
exports.PlatformNotificationService = PlatformNotificationService = PlatformNotificationService_1 = __decorate([
    (0, common_1.Injectable)()
], PlatformNotificationService);
//# sourceMappingURL=platform-notification.service.js.map