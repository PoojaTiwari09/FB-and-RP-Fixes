import { ConfigService } from '@nestjs/config';
export type HubSpotHttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
export declare class HubSpotClientService {
    private readonly configService?;
    private readonly logger;
    private readonly defaultToken;
    private readonly apiUrl;
    private readonly rateLimit;
    constructor(configService?: ConfigService);
    isConfigured(): boolean;
    private throttle;
    request<T>(method: HubSpotHttpMethod, path: string, options?: {
        accessToken?: string;
        params?: Record<string, string>;
        body?: unknown;
    }): Promise<T>;
    getCrmDealsPage(accessToken: string, properties: string[], limit?: string): Promise<{
        results: Array<{
            id: string;
            properties: Record<string, string>;
        }>;
    }>;
}
