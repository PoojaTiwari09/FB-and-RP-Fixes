import { ConfigService } from '@nestjs/config';
export interface SummaryRequest {
    company_hubspot_id: string;
    scope?: string;
    period_days?: number;
    force_refresh?: boolean;
    brief_type?: string;
}
export interface ChatRequest {
    company_hubspot_id: string;
    message: string;
    conversation_history?: {
        role: string;
        content: string;
    }[];
}
export declare class AiService {
    private configService?;
    private db;
    private groqApiKey;
    private groqModel;
    private groqBaseUrl;
    constructor(configService?: ConfigService);
    buildContext(companyHubspotId: string, scope: string, periodDays: number): Promise<{
        company: any;
        contacts: any;
        open_deals: any;
        closed_deals: any;
        activities: any;
        supplementary: any;
        scope: string;
        period_days: number;
    }>;
    formatContextForPrompt(ctx: any): string;
    extractCitations(reply: string, activities: any[]): any[];
    callGroq(messages: any[], responseFormat?: any): Promise<string>;
    getCachedBrief(companyHubspotId: string, scope: string, periodDays: number): Promise<any | null>;
    saveBriefCache(companyHubspotId: string, scope: string, periodDays: number, brief: any): Promise<void>;
    generateSummary(req: SummaryRequest): Promise<{
        brief: any;
        generated_at: string;
        cached: boolean;
        insufficient_data: any;
    }>;
    chat(req: ChatRequest): Promise<{
        reply: string;
        citations: any[];
        insufficient_data: boolean;
    }>;
}
