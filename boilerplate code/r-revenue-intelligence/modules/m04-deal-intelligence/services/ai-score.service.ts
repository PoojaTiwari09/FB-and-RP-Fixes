import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from '@/entities/deal.entity';
import { AIClientService } from './ai-client.service';
import { DealService } from './deal.service';
import {
  AIScoreResponseDto,
  ScoreHistoryResponseDto,
  ScoreHistoryDto,
} from '@/schemas/ai-score.dto';

interface ScoreRecord {
  score: number;
  recordedAt: Date;
}

@Injectable()
export class AIScoreService {
  private scoreHistory: Map<string, ScoreRecord[]> = new Map();

  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    private readonly aiClientService: AIClientService,
    private readonly dealService: DealService,
  ) {}

  /**
   * Generate AI score for a deal
   */
  async generateScore(dealId: string): Promise<AIScoreResponseDto> {
    const deal = await this.dealRepository.findOne({
      where: { id: dealId },
      relations: ['warnings', 'playbooks', 'activities'],
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    try {
      // Call AI service to generate score
      const scoreData = await this.aiClientService.generateDealScore({
        dealName: deal.name,
        dealStage: deal.stage,
        dealAmount: Number(deal.amount),
        closeDate: deal.closeDate,
        warningCount: deal.warningCount,
        contactCount: deal.contactCount,
        activityStrength: deal.activityStrength,
        lastActivityAt: deal.lastActivityAt,
      });

      // Update deal with new score
      await this.dealService.updateAIScore(dealId, scoreData.score);

      // Store in history
      this.addToHistory(dealId, scoreData.score);

      return {
        dealId,
        score: scoreData.score,
        explanation: scoreData.explanation,
        factors: scoreData.factors,
        recommendations: scoreData.recommendations,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to generate AI score:', error);
      throw error;
    }
  }

  /**
   * Get current score for a deal
   */
  async getCurrentScore(dealId: string): Promise<AIScoreResponseDto> {
    const deal = await this.dealRepository.findOne({
      where: { id: dealId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    // If no score exists, generate one
    if (deal.aiScore === 0) {
      return this.generateScore(dealId);
    }

    // Return cached score with basic explanation
    return {
      dealId,
      score: deal.aiScore,
      explanation: this.getScoreExplanation(deal.aiScore),
      factors: this.estimateFactors(deal),
      recommendations: [],
      generatedAt: deal.updatedAt,
    };
  }

  /**
   * Get score history for a deal
   */
  async getScoreHistory(dealId: string): Promise<ScoreHistoryResponseDto> {
    const deal = await this.dealRepository.findOne({
      where: { id: dealId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const history = this.scoreHistory.get(dealId) || [];
    
    // Add current score if not in history
    if (deal.aiScore > 0 && !history.some(h => h.score === deal.aiScore)) {
      history.push({
        score: deal.aiScore,
        recordedAt: deal.updatedAt,
      });
    }

    // Calculate changes
    const historyWithChanges: ScoreHistoryDto[] = history.map((record, index) => {
      const change = index > 0 ? record.score - history[index - 1].score : undefined;
      return {
        score: record.score,
        recordedAt: record.recordedAt,
        change,
      };
    });

    // Calculate average
    const averageScore = history.length > 0
      ? history.reduce((sum, r) => sum + r.score, 0) / history.length
      : deal.aiScore;

    // Determine trend
    let trend = 'stable';
    if (history.length >= 2) {
      const recent = history.slice(-3);
      const avgRecent = recent.reduce((sum, r) => sum + r.score, 0) / recent.length;
      if (avgRecent > averageScore + 5) trend = 'up';
      else if (avgRecent < averageScore - 5) trend = 'down';
    }

    return {
      dealId,
      currentScore: deal.aiScore,
      history: historyWithChanges,
      averageScore: Math.round(averageScore * 100) / 100,
      trend,
    };
  }

  /**
   * Add score to history
   */
  private addToHistory(dealId: string, score: number): void {
    const history = this.scoreHistory.get(dealId) || [];
    history.push({
      score,
      recordedAt: new Date(),
    });
    
    // Keep only last 30 records
    if (history.length > 30) {
      history.shift();
    }
    
    this.scoreHistory.set(dealId, history);
  }

  /**
   * Get score explanation based on score value
   */
  private getScoreExplanation(score: number): string {
    if (score >= 80) {
      return 'Excellent deal health with strong indicators across all factors';
    } else if (score >= 60) {
      return 'Good deal health with some areas for improvement';
    } else if (score >= 40) {
      return 'Moderate deal health with several risk factors';
    } else {
      return 'Poor deal health requiring immediate attention';
    }
  }

  /**
   * Estimate score factors based on deal data
   */
  private estimateFactors(deal: Deal): Record<string, number> {
    return {
      engagement: Math.min(100, deal.activityStrength * 10),
      qualification: Math.min(100, (100 - deal.warningCount * 10)),
      momentum: deal.lastActivityAt
        ? Math.max(0, 100 - this.daysSince(deal.lastActivityAt) * 5)
        : 50,
      risk: Math.max(0, 100 - deal.warningCount * 15),
    };
  }

  /**
   * Calculate days since a date
   */
  private daysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
