import { PrismaService } from '../database/prisma.service';
import { HubSpotClientService } from '../../platform-core/integrations/hubspot-client.service';
export declare class HubSpotService {
    private readonly prisma;
    private readonly hubspotClient;
    constructor(prisma: PrismaService, hubspotClient: HubSpotClientService);
    getAuthUrl(tenantId: string): string;
    handleCallback(code: string, state: string): Promise<{
        tenantId: string;
        connected: boolean;
    }>;
    isConnected(tenantId: string): boolean;
    private ensureFreshToken;
    syncDeals(tenantId: string): Promise<{
        imported: number;
        deals: any[];
        message: string;
    }>;
    disconnect(tenantId: string): {
        disconnected: boolean;
    };
}
