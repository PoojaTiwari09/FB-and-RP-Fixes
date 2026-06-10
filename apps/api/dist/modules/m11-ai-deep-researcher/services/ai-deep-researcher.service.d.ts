import { PrismaService } from '../database/prisma.service';
export declare class AiDeepResearcherService {
    private readonly prisma;
    private readonly logger;
    private jobs;
    private groq;
    constructor(prisma: PrismaService);
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
        dateRange?: string;
        segment?: string;
        callStage?: string;
        region?: string;
        filters?: {
            dateRange?: string;
            segment?: string;
            callStage?: string;
            region?: string;
        };
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
    getEvidence(jobId: string, finding?: string, page?: number, size?: number): {
        total: any;
        page: number;
        totalPages: number;
        evidence: any;
    };
    submitEscalation(jobId: string, question: string): {
        question: string;
        answer: string;
        suggestDeepAnalysis: boolean;
    };
    shareRecommendation(jobId: string, recommendationId: string, channel: string): {
        message: string;
        status: string;
    };
    getReps(): Promise<any>;
    getRepCalls(repId: string): Promise<any>;
    getObjectionRepBreakdown(objectionId: string): Promise<any>;
    getObjectionEvidence(objectionId: string): Promise<any>;
    getCallDetails(callId: string): Promise<any>;
    getAccountDetails(accountId: string): Promise<any>;
    getRecommendationDetails(recId: string): Promise<any>;
    private getInitials;
    private processJob;
    private buildReportFromDB;
    private buildEvidenceFromDB;
}
