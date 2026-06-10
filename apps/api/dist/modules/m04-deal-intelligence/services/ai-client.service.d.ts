import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AIDealSummaryRequest, AIDealSummaryResponse, AIWarningsRequest, AIWarningsResponse, AIScoreRequest, AIScoreResponse, AINextStepsRequest, AINextStepsResponse, AICoachingPromptsRequest, AICoachingPromptsResponse } from '@/interfaces/ai-service-types.interface';
export declare class AIClientService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly aiServiceUrl;
    private readonly aiServiceApiKey;
    private readonly timeout;
    private readonly retryAttempts;
    private readonly retryDelay;
    constructor(httpService: HttpService, configService: ConfigService);
    private request;
    private handleError;
    generateDealSummary(request: AIDealSummaryRequest): Promise<AIDealSummaryResponse>;
    generateWarnings(request: AIWarningsRequest): Promise<AIWarningsResponse>;
    private generateSimulatedWarnings;
    calculateScore(request: AIScoreRequest): Promise<AIScoreResponse>;
    generateNextSteps(request: AINextStepsRequest): Promise<AINextStepsResponse>;
    generateCoachingPrompts(request: AICoachingPromptsRequest): Promise<AICoachingPromptsResponse>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
    generatePlaybookSuggestions(request: any): Promise<any>;
    generateDealScore(request: any): Promise<any>;
}
