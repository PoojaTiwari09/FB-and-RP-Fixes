export type NotificationChannel = 'email' | 'slack' | 'teams';
export interface NotificationAlertPayload {
    tenantId: string;
    channel: NotificationChannel;
    subject?: string;
    body: string;
    recipient?: string;
    slackWebhookUrl?: string;
    metadata?: Record<string, unknown>;
}
export declare class PlatformNotificationService {
    private readonly logger;
    dispatch(alert: NotificationAlertPayload): Promise<{
        ok: boolean;
        channel: string;
        detail?: string;
    }>;
    private sendEmail;
    private sendSlack;
}
