import { BriefService } from '../services/brief.service';
export declare class BriefController {
    private readonly briefService;
    constructor(briefService: BriefService);
    getBrief(briefType: string, entityId: string, req: any): Promise<{
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
    generateBrief(briefType: string, entityId: string, req: any): Promise<{
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
}
export declare class BriefCompatController {
    private readonly briefService;
    constructor(briefService: BriefService);
    generateLegacy(typeBrief: string, entityId: string, req: any): Promise<{
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
}
