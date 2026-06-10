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
var NotificationEventConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationEventConsumer = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const platform_notification_service_1 = require("./platform-notification.service");
let NotificationEventConsumer = NotificationEventConsumer_1 = class NotificationEventConsumer {
    notifications;
    logger = new common_1.Logger(NotificationEventConsumer_1.name);
    constructor(notifications) {
        this.notifications = notifications;
    }
    async handleNotificationRequested(envelope) {
        const { tenantId, channel, body } = envelope;
        if (!tenantId || !channel || !body) {
            this.logger.warn('notification.alert.requested missing tenantId, channel, or body');
            return { ok: false, reason: 'invalid_payload' };
        }
        return this.notifications.dispatch(envelope);
    }
};
exports.NotificationEventConsumer = NotificationEventConsumer;
__decorate([
    (0, event_emitter_1.OnEvent)('notification.alert.requested'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationEventConsumer.prototype, "handleNotificationRequested", null);
exports.NotificationEventConsumer = NotificationEventConsumer = NotificationEventConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [platform_notification_service_1.PlatformNotificationService])
], NotificationEventConsumer);
//# sourceMappingURL=notification-event.consumer.js.map