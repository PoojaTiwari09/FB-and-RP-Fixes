export declare class AIScoreResponseDto {
    dealId: string;
    score: number;
    explanation: string;
    factors: Record<string, number>;
    recommendations: string[];
    generatedAt: Date;
}
export declare class ScoreHistoryDto {
    score: number;
    recordedAt: Date;
    change?: number;
}
export declare class ScoreHistoryResponseDto {
    dealId: string;
    currentScore: number;
    history: ScoreHistoryDto[];
    averageScore: number;
    trend: string;
}
