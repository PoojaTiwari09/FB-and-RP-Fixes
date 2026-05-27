import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@/database/inject-repository';
import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { DealSummary, Deal, AuditAction, AuditEntityType } from '@/entities';
import { AIClientService } from './ai-client.service';
import { DealService } from './deal.service';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class DealSummaryService {
  private readonly logger = new Logger(DealSummaryService.name);

  constructor(
    @InjectRepository(DealSummary)
    private readonly summaryRepository: Repository<DealSummary>,
    private readonly aiClientService: AIClientService,
    private readonly dealService: DealService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async generateSummary(dealId: string, userId: string): Promise<DealSummary> {
    this.logger.log(`Generating AI summary for deal ${dealId}`);

    const deal = await this.dealService.findById(dealId, userId);
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }

    // Mark previous summaries as not current
    await this.summaryRepository.update(
      { dealId, isCurrent: true },
      { isCurrent: false },
    );

    // Prepare AI request
    const aiRequest = {
      dealId: deal.id,
      dealName: deal.name,
      stage: deal.stage,
      amount: Number(deal.amount),
      ownerName: deal.ownerName,
      accountName: deal.accountName,
      transcript: undefined,
      recentActivities: [],
      context: deal.crmData || {},
    };

    // Call AI service
    const aiResponse = await this.aiClientService.generateDealSummary(aiRequest);

    // Create new summary
    const summary = this.summaryRepository.create({
      dealId: deal.id,
      summary: aiResponse.summary,
      keyPoints: aiResponse.keyPoints,
      nextSteps: aiResponse.nextSteps,
      competitorMentions: aiResponse.competitorMentions,
      confidenceScore: aiResponse.confidenceScore,
      flaggedForReview: aiResponse.flaggedForReview,
      isCurrent: true,
    });

    const savedSummary = await this.summaryRepository.save(summary);

    await this.auditLogService.log({
      userId,
      action: AuditAction.GENERATE_SUMMARY,
      entityType: AuditEntityType.DEAL,
      entityId: dealId,
      metadata: {
        summaryId: savedSummary.id,
        confidenceScore: aiResponse.confidenceScore,
      },
    });

    return savedSummary;
  }

  async getCurrentSummary(dealId: string): Promise<DealSummary | null> {
    return this.summaryRepository.findOne({
      where: { dealId, isCurrent: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getSummaryHistory(
    dealId: string,
    limit: number = 10,
  ): Promise<DealSummary[]> {
    return this.summaryRepository.find({
      where: { dealId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async detectWeeklyChanges(dealId: string): Promise<Record<string, any>> {
    this.logger.log(`Detecting weekly changes for deal ${dealId}`);

    const summaries = await this.getSummaryHistory(dealId, 2);

    if (summaries.length < 2) {
      return {
        hasChanges: false,
        message: 'Not enough history to detect changes',
      };
    }

    const [current, previous] = summaries;

    const changes = {
      hasChanges: true,
      summaryChanged: current.summary !== previous.summary,
      keyPointsAdded: current.keyPoints.filter(
        (kp) => !previous.keyPoints.includes(kp),
      ),
      keyPointsRemoved: previous.keyPoints.filter(
        (kp) => !current.keyPoints.includes(kp),
      ),
      nextStepsAdded: current.nextSteps.filter(
        (ns) => !previous.nextSteps.includes(ns),
      ),
      nextStepsRemoved: previous.nextSteps.filter(
        (ns) => !current.nextSteps.includes(ns),
      ),
      competitorChanges: {
        added: current.competitorMentions?.filter(
          (c) => !previous.competitorMentions?.includes(c),
        ) || [],
        removed: previous.competitorMentions?.filter(
          (c) => !current.competitorMentions?.includes(c),
        ) || [],
      },
      confidenceScoreChange:
        Number(current.confidenceScore) - Number(previous.confidenceScore),
    };

    // Update current summary with weekly changes
    await this.summaryRepository.update(current.id, {
      weeklyChanges: changes as any,
    });

    return changes;
  }

  async flagForReview(summaryId: string, userId: string): Promise<void> {
    await this.summaryRepository.update(summaryId, {
      flaggedForReview: true,
    });

    await this.auditLogService.log({
      userId,
      action: AuditAction.FLAG_SUMMARY_FOR_REVIEW,
      entityType: AuditEntityType.DEAL_SUMMARY,
      entityId: summaryId,
    });
  }

  async unflagForReview(summaryId: string, userId: string): Promise<void> {
    await this.summaryRepository.update(summaryId, {
      flaggedForReview: false,
    });

    await this.auditLogService.log({
      userId,
      action: AuditAction.UNFLAG_SUMMARY_FOR_REVIEW,
      entityType: AuditEntityType.DEAL_SUMMARY,
      entityId: summaryId,
    });
  }

  async getFlaggedSummaries(limit: number = 50): Promise<DealSummary[]> {
    return this.summaryRepository.find({
      where: { flaggedForReview: true, isCurrent: true },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['deal'],
    });
  }
}
