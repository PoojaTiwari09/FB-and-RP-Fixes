import { HubSpotService } from '../services/hubspot.service';
export declare class HubSpotController {
    private readonly hubspotService;
    constructor(hubspotService: HubSpotService);
    getAuthUrl(tenantId: string): {
        url: string;
    };
    handleCallback(code: string, state: string): Promise<{
        url: string;
    }>;
    getStatus(tenantId: string): {
        connected: boolean;
    };
    syncDeals(tenantId: string): Promise<{
        imported: number;
        deals: any[];
        message: string;
    }>;
    disconnect(tenantId: string): {
        disconnected: boolean;
    };
}
