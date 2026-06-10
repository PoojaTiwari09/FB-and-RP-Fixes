import { M02FrontendCallReviewsService } from './m02-frontend-call-reviews.service';
export declare class M02FrontendCallReviewsController {
    private readonly svc;
    constructor(svc: M02FrontendCallReviewsService);
    list(query: Record<string, string>, req: any): Promise<{
        totalCount: any;
        data: any;
    }>;
    view(reviewId: string, req: any): Promise<{
        reviewerName: any;
        scorecardName: any;
        scorecardVersion: any;
        aiAnalysis: {
            accepted: number;
            modified: number;
            rejected: number;
        };
        sections: any[];
        coaching: any;
        auditTrail: {
            event: string;
            user: any;
            at: any;
        }[];
        callTitle: any;
        salesRep: any;
        finalScore: any;
        finalTotal: number;
        finalPercent: any;
        passingStatus: string;
        submittedAt: any;
        visibility: string;
    }>;
    submitted(reviewId: string, req: any): Promise<{
        callTitle: any;
        salesRep: any;
        finalScore: any;
        finalTotal: number;
        finalPercent: any;
        passingStatus: string;
        submittedAt: any;
        visibility: string;
    }>;
    summary(reviewId: string, req: any): Promise<{
        isReadyForSubmission: boolean;
        overallScore: any;
        overallTotal: number;
        overallPercent: any;
        passingStatus: string;
        passThreshold: number;
        scorecardName: any;
        scorecardVersion: any;
        repName: any;
        sectionScores: any[];
        aiAnalysis: {
            accepted: number;
            modified: number;
            rejected: number;
        };
    }>;
    getCoaching(reviewId: string, req: any): Promise<any>;
    saveCoaching(reviewId: string, body: unknown, req: any): Promise<{
        success: boolean;
        savedAt: string;
    }>;
    scorecard(reviewId: string, req: any): Promise<{
        totalQuestions: number;
        answeredCount: number;
        sections: {
            sectionId: string;
            sectionTitle: string;
            totalQuestions: number;
            questions: ({
                questionId: string;
                questionText: string;
                required: boolean;
                answerType: string;
                aiSuggestion: boolean;
                aiConfidence: number;
                aiSuggestedAnswer: boolean;
                transcriptRef: string;
                transcriptSnippet: string;
            } | {
                questionId: string;
                questionText: string;
                required: boolean;
                answerType: string;
                aiSuggestion: boolean;
                aiConfidence: number;
                aiSuggestedAnswer: number;
                transcriptRef: string;
                transcriptSnippet: string;
            })[];
        }[];
    }>;
    transcript(reviewId: string, req: any): Promise<{
        entries: any;
    }>;
    aiInsights(req: any): {
        insights: {
            type: string;
            title: string;
            description: string;
        }[];
    };
    detail(reviewId: string, req: any): Promise<{
        reviewId: any;
        callTitle: any;
        salesRep: any;
        customer: any;
        dateTime: any;
        duration: any;
        callType: any;
        dealLinked: any;
        callSource: any;
        participants: any;
        aiSummary: any;
        keyHighlights: any;
        talkRatio: any;
        sentimentSummary: any;
        sentimentScore: any;
        risksDetected: any;
        scorecardName: any;
        scorecardVersion: any;
        reviewMode: any;
        dueDate: any;
        status: any;
        reviewer: any;
        quickStats: any;
        questions: any;
        feedback: any;
    }>;
    patch(reviewId: string, body: unknown, req: any): Promise<{
        success: boolean;
        reviewId: string;
        updatedFields: string[];
    }>;
    markNa(reviewId: string, req: any): Promise<{
        success: boolean;
        status: string;
        reviewId: string;
    }>;
    saveAnswer(reviewId: string, body: unknown, req: any): Promise<{
        success: boolean;
        savedAt: string;
        score: number;
    }>;
    saveDraft(reviewId: string, body: any, req: any): Promise<{
        success: boolean;
        savedAt: string;
    }>;
    submit(reviewId: string, body: any, req: any): Promise<{
        success: boolean;
        reviewId: string;
        submittedAt: string;
        finalScore: number;
        finalPercent: number;
        visibility: string;
    }>;
    export(reviewId: string): {
        downloadUrl: string;
        fileName: string;
    };
    clone(reviewId: string): {
        newReviewId: string;
        redirectUrl: string;
    };
    share(): {
        success: boolean;
    };
    reopen(reviewId: string, req: Record<string, string>): Promise<{
        success: boolean;
        reviewId: string;
        updatedFields: string[];
    }>;
}
export declare class M02FrontendScorecardsController {
    private readonly svc;
    constructor(svc: M02FrontendCallReviewsService);
    list(): {
        scorecards: {
            scorecardId: string;
            scorecardName: string;
        }[];
    };
}
export declare class M02FrontendUsersController {
    private readonly svc;
    constructor(svc: M02FrontendCallReviewsService);
    list(): Promise<{
        users: any;
    }>;
}
export declare class M02FrontendMetaController {
    private readonly svc;
    constructor(svc: M02FrontendCallReviewsService);
    coachingTags(): {
        tags: {
            id: string;
            label: string;
        }[];
    };
}
export declare class M02FrontendManagerCallsController {
    private readonly svc;
    constructor(svc: M02FrontendCallReviewsService);
    listCalls(query: Record<string, string>, req: any): Promise<{
        totalCount: any;
        data: any;
    }>;
}
export declare class M02FrontendAnalyticsController {
    private readonly svc;
    constructor(svc: M02FrontendCallReviewsService);
    summary(req: any): Promise<{
        repAverageScore: number;
        repAverageTrend: string;
        teamAverageScore: number;
        completionRate: number;
        totalReviews: any;
    }>;
    scoreTrend(req: any): Promise<{
        data: {
            week: string;
            score: number;
        }[];
    }>;
    focusAreas(req: any): any;
}
