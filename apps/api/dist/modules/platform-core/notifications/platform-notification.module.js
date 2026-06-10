"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformNotificationModule = void 0;
const common_1 = require("@nestjs/common");
const platform_notification_service_1 = require("./platform-notification.service");
const notification_event_consumer_1 = require("./notification-event.consumer");
let PlatformNotificationModule = class PlatformNotificationModule {
};
exports.PlatformNotificationModule = PlatformNotificationModule;
exports.PlatformNotificationModule = PlatformNotificationModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [platform_notification_service_1.PlatformNotificationService, notification_event_consumer_1.NotificationEventConsumer],
        exports: [platform_notification_service_1.PlatformNotificationService],
    })
], PlatformNotificationModule);
//# sourceMappingURL=platform-notification.module.js.map