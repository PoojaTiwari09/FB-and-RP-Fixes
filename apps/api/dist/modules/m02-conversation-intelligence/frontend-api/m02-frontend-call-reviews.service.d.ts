import { PrismaService } from '../database/prisma.service';
import { M02ConversationIntelligenceService } from '../services/m02.service';
export declare class M02FrontendCallReviewsService {
    private readonly prisma;
    private readonly m02;
    constructor(prisma: PrismaService, m02: M02ConversationIntelligenceService);
    private ensureSeeded;
    private getReview;
    private getCallForReview;
    listReviews(tenantId: string, raw: Record<string, string>, userId?: string, userRole?: string): Promise<{
        totalCount: any;
        data: any;
    }>;
    getReviewDetail(tenantId: string, reviewId: string, userId?: string, userRole?: string): Promise<{
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
    getScorecards(): {
        scorecards: {
            scorecardId: string;
            scorecardName: string;
        }[];
    };
    getUsers(tenantId: string): Promise<{
        users: any;
    }>;
    getCoachingTags(): {
        tags: {
            id: string;
            label: string;
        }[];
    };
    patchReview(tenantId: string, reviewId: string, body: unknown, userId?: string, userRole?: string): Promise<{
        success: boolean;
        reviewId: string;
        updatedFields: string[];
    }>;
    markNa(tenantId: string, reviewId: string, userId?: string, userRole?: string): Promise<{
        success: boolean;
        status: string;
        reviewId: string;
    }>;
    getScorecardForm(tenantId: string, reviewId: string, userId?: string, userRole?: string): Promise<{
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
    getTranscript(tenantId: string, reviewId: string, userId?: string, userRole?: string): Promise<{
        entries: any;
    }>;
    getAiInsights(userId?: string, userRole?: string): {
        insights: {
            type: string;
            title: string;
            description: string;
        }[];
    };
    saveAnswer(tenantId: string, reviewId: string, body: unknown, userId?: string, userRole?: string): Promise<{
        success: boolean;
        savedAt: string;
        score: number;
    }>;
    saveAnswersBatch(tenantId: string, reviewId: string, answers: any, userId?: string, userRole?: string): Promise<{
        success: boolean;
        savedAt: string;
        score: number;
    }>;
    saveDraft(tenantId: string, reviewId: string, body: any, userId?: string, userRole?: string): Promise<{
        success: boolean;
        savedAt: string;
    }>;
    getCoaching(tenantId: string, reviewId: string, userId?: string, userRole?: string): Promise<any>;
    saveCoaching(tenantId: string, reviewId: string, body: unknown, userId?: string, userRole?: string): Promise<{
        success: boolean;
        savedAt: string;
    }>;
    getSummary(tenantId: string, reviewId: string, userId?: string, userRole?: string): Promise<{
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
    submitReview(tenantId: string, reviewId: string, body?: any, userId?: string, userRole?: string): Promise<{
        success: boolean;
        reviewId: string;
        submittedAt: string;
        finalScore: number;
        finalPercent: number;
        visibility: string;
    }>;
    getSubmitted(reviewId: string, userId?: string, userRole?: string): Promise<{
        callTitle: any;
        salesRep: any;
        finalScore: any;
        finalTotal: number;
        finalPercent: any;
        passingStatus: string;
        submittedAt: any;
        visibility: string;
    }>;
    getSubmittedView(tenantId: string, reviewId: string, userId?: string, userRole?: string): Promise<{
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
    exportReview(reviewId: string): {
        downloadUrl: string;
        fileName: string;
    };
    cloneReview(reviewId: string): {
        newReviewId: string;
        redirectUrl: string;
    };
    getAnalyticsSummary(userId?: string, userRole?: string): Promise<{
        repAverageScore: number;
        repAverageTrend: string;
        teamAverageScore: number;
        completionRate: number;
        totalReviews: any;
    }>;
    getScoreTrend(userId?: string, userRole?: string): Promise<{
        data: {
            week: string;
            score: number;
        }[];
    }>;
    focusAreas(userId?: string, userRole?: string): Promise<{
        areas: {
            sectionName: string;
            percent: number;
        }[];
    }>;
    getCommonTags(): {
        tags: {
            label: string;
            count: number;
        }[];
    };
    getReviewHistory(raw: Record<string, string>): {
        totalCount: number;
        reviews: {
            reviewId: string;
            callTitle: string;
            reviewerName: string;
            reviewedAt: string;
            tags: string[];
            score: number;
        }[];
    };
}
