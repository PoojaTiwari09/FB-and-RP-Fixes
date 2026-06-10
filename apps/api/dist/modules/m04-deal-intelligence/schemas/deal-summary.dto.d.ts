export declare class GenerateSummaryDto {
    dealId: string;
}
export declare class DealSummaryResponseDto {
    id: string;
    dealId: string;
    summary: string;
    keyPoints: string[];
    nextSteps: string[];
    competitorMentions?: string[];
    confidenceScore: number;
    flaggedForReview: boolean;
    weeklyChanges?: Record<string, any>;
    isCurrent: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class SummaryHistoryResponseDto {
    summaries: DealSummaryResponseDto[];
    total: number;
}
export declare class WeeklyChangesResponseDto {
    hasChanges: boolean;
    summaryChanged?: boolean;
    keyPointsAdded?: string[];
    keyPointsRemoved?: string[];
    nextStepsAdded?: string[];
    nextStepsRemoved?: string[];
    competitorChanges?: {
        added: string[];
        removed: string[];
    };
    confidenceScoreChange?: number;
    message?: string;
}
export declare class QuerySummaryDto {
    limit?: number;
}
