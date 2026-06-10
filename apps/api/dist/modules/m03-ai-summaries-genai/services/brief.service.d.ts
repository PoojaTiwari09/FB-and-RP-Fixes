import { ConfigService } from '@nestjs/config';
import { M03AiSummariesGenaiRepository } from '../repositories/m03.repository';
export declare class BriefService {
    private readonly repo;
    private config?;
    constructor(repo: M03AiSummariesGenaiRepository, config?: ConfigService);
    getBrief(tenantId: string, briefType: string, entityId: string): Promise<{
        success: boolean;
        data: any;
        id?: undefined;
        generationStatus?: undefined;
    } | {
        success: boolean;
        data: Record<string, unknown>;
        id: any;
        generationStatus: any;
    }>;
    generateBrief(tenantId: string, briefType: string, entityId: string): Promise<{
        success: boolean;
        data: {
            title: string;
            summaryPreview: string;
            sentiment: string;
            contextLabels: string[];
            sections: {
                title: string;
                summary: string;
                bullets: {
                    text: string;
                    richCitations: any[];
                }[];
            }[];
            citations: {
                citation_id: string;
                source_type: string;
                source_id: any;
                excerpt: any;
                call_title: any;
            }[];
        };
        saved: boolean;
    }>;
    private buildBriefPayload;
    private labelBriefType;
    private buildExecutiveSummary;
    private extractInsightBullets;
    private riskLine;
    private inferSentiment;
    private getLlmModel;
}
