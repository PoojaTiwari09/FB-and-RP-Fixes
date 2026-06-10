export declare class HubSpotWebhookDto {
    objectId: string;
    propertyName: string;
    propertyValue: string;
    changeSource: string;
    eventId: number;
    subscriptionId: number;
    portalId: number;
    occurredAt: number;
}
export declare class WebhookBatchDto {
    events: HubSpotWebhookDto[];
}
export declare class WebhookResponseDto {
    success: boolean;
    message: string;
    processedCount: number;
}
export declare class WebhookSubscriptionDto {
    id: string;
    eventType: string;
    propertyName?: string;
    active: boolean;
    createdAt: Date;
}
