import { NotificationAlertPayload, PlatformNotificationService } from './platform-notification.service';
export declare class NotificationEventConsumer {
    private readonly notifications;
    private readonly logger;
    constructor(notifications: PlatformNotificationService);
    handleNotificationRequested(envelope: NotificationAlertPayload & Record<string, unknown>): Promise<{
        ok: boolean;
        channel: string;
        detail?: string;
    } | {
        ok: boolean;
        reason: string;
    }>;
}
