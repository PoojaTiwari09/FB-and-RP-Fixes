import { AIScoreService } from '@/services/ai-score.service';
import { AIScoreResponseDto, ScoreHistoryResponseDto } from '@/schemas/ai-score.dto';
export declare class AIScoreController {
    private readonly scoreService;
    constructor(scoreService: AIScoreService);
    generateScore(dealId: string): Promise<AIScoreResponseDto>;
    getCurrentScore(dealId: string): Promise<AIScoreResponseDto>;
    getScoreHistory(dealId: string): Promise<ScoreHistoryResponseDto>;
}
