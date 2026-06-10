import { AiService, SummaryRequest, ChatRequest } from '../services/ai.service';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    health(): {
        status: string;
        service: string;
    };
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
