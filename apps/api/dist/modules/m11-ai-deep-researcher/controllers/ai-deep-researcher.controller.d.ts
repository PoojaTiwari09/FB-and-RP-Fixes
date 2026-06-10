import { AiDeepResearcherService } from '../services/ai-deep-researcher.service';
export declare class AiDeepResearcherController {
    private readonly service;
    constructor(service: AiDeepResearcherService);
    getFiltersDefaults(): {
        dateRange: {
            default: string;
            options: string[];
        };
        segment: {
            default: string;
            options: string[];
        };
        callStage: {
            default: string;
            options: string[];
        };
        region: {
            default: string;
            options: string[];
        };
        repCohort: {
            label: string;
            value: string;
            repCount: number;
            isAutoSet: boolean;
        };
    };
    getExampleQuestions(): {
        questions: string[];
    };
    runAnalysis(params: {
        query: string;
        filters: any;
    }): Promise<any>;
    getProgress(jobId: string): Promise<any>;
    getDashboard(jobId: string): {
        reportTitle: any;
        filterTags: any;
        tabs: any;
        totalCalls: any;
        totalReps: any;
    };
    getExecutiveSummary(jobId: string): {
        execSummary: any;
    };
    getKeyFindings(jobId: string): any;
    getObjections(jobId: string): {
        objections: any;
    };
    getTrends(jobId: string): {
        trends: any;
    };
    getRisksOpportunities(jobId: string): {
        risksAndOpportunities: any;
    };
    getRecommendations(jobId: string): {
        recommendations: any;
    };
    getEvidence(jobId: string, finding?: string, page?: string, size?: string): {
        total: any;
        page: number;
        totalPages: number;
        evidence: any;
    };
    submitEscalation(body: {
        jobId: string;
        question: string;
    }): {
        question: string;
        answer: string;
        suggestDeepAnalysis: boolean;
    };
    shareRecommendation(body: {
        jobId: string;
        recommendationId: string;
        channel: string;
    }): {
        message: string;
        status: string;
    };
    getReps(): Promise<any>;
    getRepCalls(repId: string): Promise<any>;
    getObjectionRepBreakdown(objectionId: string): Promise<any>;
    getObjectionEvidence(objectionId: string): Promise<any>;
    getAccountDetails(accountId: string): Promise<any>;
    getRecommendationDetails(recId: string): Promise<any>;
}
