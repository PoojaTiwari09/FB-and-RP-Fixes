interface HubSpotWebhookEvent {
    appId: number;
    eventId: number;
    subscriptionId: number;
    portalId: number;
    occurredAt: number;
    subscriptionType: string;
    objectId: number;
    propertyName: string;
    propertyValue: string;
    changeSource: string;
}
export declare class WebhookController {
    private readonly logger;
    private supabase;
    receiveWebhook(events: HubSpotWebhookEvent[], signatureV3: string): Promise<{
        processed: number;
    }>;
    private handleEvent;
    private readonly COMPANY_PROP_MAP;
    private readonly CONTACT_PROP_MAP;
    private readonly DEAL_PROP_MAP;
    private upsertCompanyProperty;
    private upsertContactProperty;
    private upsertDealProperty;
}
export {};
