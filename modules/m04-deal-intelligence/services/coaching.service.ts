import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@m04/database/inject-repository';
import { M04EntityRepository as Repository } from '@m04/database/m04-prisma.repository';
import { Deal } from '@m04/entities/deal.entity';
import { DealPlaybook } from '@m04/entities/deal-playbook.entity';
import { DealWarning } from '@m04/entities/deal-warning.entity';
import { DealActivity } from '@m04/entities/deal-activity.entity';
import { AIClientService } from './ai-client.service';
import {
  GenerateCoachingPromptsDto,
  CoachingPromptsResponseDto,
} from '@m04/schemas/coaching.dto';

@Injectable()
export class CoachingService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(DealPlaybook)
    private readonly playbookRepository: Repository<DealPlaybook>,
    @InjectRepository(DealWarning)
    private readonly warningRepository: Repository<DealWarning>,
    @InjectRepository(DealActivity)
    private readonly activityRepository: Repository<DealActivity>,
    private readonly aiClientService: AIClientService,
  ) {}

  /**
   * Generate AI-powered coaching prompts for a deal
   */
  async generateCoachingPrompts(
    dto: GenerateCoachingPromptsDto,
  ): Promise<CoachingPromptsResponseDto> {
    const deal = await this.dealRepository.findOne({
      where: { id: dto.dealId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    // Get playbook gaps
    const playbookItems = await this.playbookRepository.find({
      where: { dealId: dto.dealId },
    });

    const playbookGaps = playbookItems
      .filter((item) => item.status !== 'COMPLETED')
      .map((item) => `${item.type}: ${item.criterion}`);

    // Get active warnings
    const warnings = await this.warningRepository.find({
      where: { dealId: dto.dealId, isActive: true },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const warningMessages = warnings.map((w) => w.message);

    // Get recent activities
    const activities = await this.activityRepository.find({
      where: { dealId: dto.dealId },
      order: { activityDate: 'DESC' },
      take: 10,
    });

    const recentActivities = activities.map(
      (a) => `${a.type}: ${a.subject || 'No subject'} (${a.activityDate.toISOString()})`,
    );

    // Generate coaching prompts using AI
    try {
      const aiResponse = await this.aiClientService.generateCoachingPrompts({
        dealId: deal.id,
        dealName: deal.name,
        repName: deal.ownerName,
        stage: deal.stage,
        warnings: warningMessages,
        playbookGaps,
        recentActivities,
      });

      return {
        dealId: deal.id,
        dealName: deal.name,
        repName: deal.ownerName,
        stage: deal.stage,
        prompts: aiResponse.prompts,
        focusAreas: aiResponse.focusAreas,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to generate coaching prompts:', error);

      // Fallback to rule-based prompts
      return this.generateFallbackPrompts(deal, playbookGaps, warningMessages);
    }
  }

  /**
   * Generate fallback coaching prompts when AI is unavailable
   */
  private generateFallbackPrompts(
    deal: Deal,
    playbookGaps: string[],
    warnings: string[],
  ): CoachingPromptsResponseDto {
    const prompts = [];
    const focusAreas = [];

    // Playbook-based prompts
    if (playbookGaps.length > 0) {
      focusAreas.push('Qualification');
      prompts.push({
        question: `What progress have you made on: ${playbookGaps[0]}?`,
        context: `The playbook shows ${playbookGaps.length} incomplete criteria`,
        category: 'Qualification',
      });
    }

    // Warning-based prompts
    if (warnings.length > 0) {
      focusAreas.push('Risk Management');
      prompts.push({
        question: 'What actions are you taking to address the current warnings?',
        context: `There are ${warnings.length} active warnings on this deal`,
        category: 'Risk Management',
      });
    }

    // Stage-based prompts
    if (deal.stage.includes('Proposal') || deal.stage.includes('Negotiation')) {
      focusAreas.push('Closing Strategy');
      prompts.push({
        question: 'Have you confirmed the decision timeline with the economic buyer?',
        context: `Deal is in ${deal.stage} stage`,
        category: 'Closing Strategy',
      });
    }

    // Amount-based prompts
    if (Number(deal.amount) > 100000) {
      focusAreas.push('Stakeholder Engagement');
      prompts.push({
        question: 'Have you mapped all stakeholders and their influence on this decision?',
        context: `High-value deal (${deal.amount})`,
        category: 'Stakeholder Engagement',
      });
    }

    // Close date prompts
    const daysToClose = Math.ceil(
      (new Date(deal.closeDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysToClose < 30 && daysToClose > 0) {
      focusAreas.push('Timeline Management');
      prompts.push({
        question: 'What are the remaining steps to close this deal?',
        context: `Deal closes in ${daysToClose} days`,
        category: 'Timeline Management',
      });
    }

    return {
      dealId: deal.id,
      dealName: deal.name,
      repName: deal.ownerName,
      stage: deal.stage,
      prompts,
      focusAreas: [...new Set(focusAreas)],
      generatedAt: new Date(),
    };
  }

  /**
   * Get coaching prompts for multiple deals (manager view)
   */
  async getTeamCoachingOpportunities(managerId: string): Promise<CoachingPromptsResponseDto[]> {
    // Get deals owned by team members reporting to this manager
    // For now, get all deals (would need user hierarchy in production)
    const deals = await this.dealRepository.find({
      take: 10,
      order: { updatedAt: 'DESC' },
    });

    const results = await Promise.all(
      deals.map(async (deal) => {
        try {
          const prompts = await this.generateCoachingPrompts({ dealId: deal.id });
          return prompts.prompts.length > 0 ? prompts : null;
        } catch (error) {
          console.error(`Failed to generate prompts for deal ${deal.id}:`, error);
          return null;
        }
      })
    );

    return results.filter((opt): opt is CoachingPromptsResponseDto => opt !== null);
  }
}
