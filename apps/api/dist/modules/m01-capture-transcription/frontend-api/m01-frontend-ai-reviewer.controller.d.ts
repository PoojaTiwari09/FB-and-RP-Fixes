import { M01FrontendAiReviewerService } from './m01-frontend-ai-reviewer.service';
export declare class M01FrontendAiReviewerDetailController {
    private readonly svc;
    constructor(svc: M01FrontendAiReviewerService);
    aiInsights(callId: string, req: Record<string, string>): Promise<{
        data: {
            summary: any;
            keyHighlights: any;
            talkRatio: {
                rep: number;
                customer: number;
            };
            sentiment: string;
            topicsDiscussed: string[];
            objectionsDetected: string[];
            competitorMentions: any[];
            pricingDiscussion: string[];
            nextSteps: string[];
            actionItems: string[];
        };
    }>;
    audioUrl(callId: string, req: Record<string, string>): Promise<{
        data: {
            audioUrl: string;
            expiresAt: string;
        };
    }>;
    review(callId: string, req: Record<string, string>): Promise<{
        data: any;
    }>;
    feedback(callId: string, req: Record<string, string>): Promise<{
        data: any;
    }>;
    acknowledge(_body: unknown): {
        data: {
            success: boolean;
            acknowledgedAt: string;
        };
    };
    updateActionItem(_body: unknown): {
        data: {
            success: boolean;
            updatedAt: string;
        };
    };
    transcriptEntries(callId: string, req: Record<string, string>): Promise<{
        data: {
            entries: any;
        };
    }>;
}
export declare class M01FrontendCoachingInsightsController {
    private readonly svc;
    constructor(svc: M01FrontendAiReviewerService);
    insights(): {
        data: {
            overallScore: number;
            trend: string;
            focusAreas: string[];
            recentCallsReviewed: number;
        };
    };
}
