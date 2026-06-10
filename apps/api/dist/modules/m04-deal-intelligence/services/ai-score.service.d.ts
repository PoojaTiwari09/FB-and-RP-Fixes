import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { Deal } from '@/entities/deal.entity';
import { AIClientService } from './ai-client.service';
import { DealService } from './deal.service';
import { AIScoreResponseDto, ScoreHistoryResponseDto } from '@/schemas/ai-score.dto';
export declare class AIScoreService {
    private readonly dealRepository;
    private readonly aiClientService;
    private readonly dealService;
    private scoreHistory;
    constructor(dealRepository: Repository<Deal>, aiClientService: AIClientService, dealService: DealService);
    generateScore(dealId: string): Promise<AIScoreResponseDto>;
    getCurrentScore(dealId: string): Promise<AIScoreResponseDto>;
    getScoreHistory(dealId: string): Promise<ScoreHistoryResponseDto>;
    private addToHistory;
    private getScoreExplanation;
    private estimateFactors;
    private daysSince;
}
