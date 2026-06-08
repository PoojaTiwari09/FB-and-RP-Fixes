import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@/database/inject-repository';
import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { DealPlaybook, PlaybookType, PlaybookItemStatus } from '@/entities/deal-playbook.entity';
import { Deal } from '@/entities/deal.entity';
import {
  CreatePlaybookItemDto,
  UpdatePlaybookItemDto,
  PlaybookItemResponseDto,
  PlaybookSummaryDto,
} from '@/schemas/playbook.dto';
import { AIClientService } from './ai-client.service';

@Injectable()
export class DealPlaybookService {
  constructor(
    @InjectRepository(DealPlaybook)
    private readonly playbookRepository: Repository<DealPlaybook>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    private readonly aiClientService: AIClientService,
  ) {}

  /**
   * Get playbook for a deal
   */
  async getPlaybook(dealId: string, type?: PlaybookType): Promise<PlaybookSummaryDto[]> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const queryBuilder = this.playbookRepository
      .createQueryBuilder('playbook')
      .where('playbook.dealId = :dealId', { dealId });

    if (type) {
      queryBuilder.andWhere('playbook.type = :type', { type });
    }

    const items = await queryBuilder
      .orderBy('playbook.type', 'ASC')
      .addOrderBy('playbook.order', 'ASC')
      .getMany();

    // Group by type
    const groupedByType = items.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    }, {} as Record<PlaybookType, DealPlaybook[]>);

    // Create summaries
    const summaries: PlaybookSummaryDto[] = [];
    for (const [playbookType, playbookItems] of Object.entries(groupedByType)) {
      const totalItems = playbookItems.length;
      const completedItems = playbookItems.filter(
        (item) => item.status === PlaybookItemStatus.COMPLETED,
      ).length;
      const inProgressItems = playbookItems.filter(
        (item) => item.status === PlaybookItemStatus.IN_PROGRESS,
      ).length;
      const notStartedItems = playbookItems.filter(
        (item) => item.status === PlaybookItemStatus.NOT_STARTED,
      ).length;

      summaries.push({
        type: playbookType as PlaybookType,
        totalItems,
        completedItems,
        inProgressItems,
        notStartedItems,
        completionPercentage: totalItems > 0 ? (completedItems / totalItems) * 100 : 0,
        items: playbookItems.map((item) => this.toResponseDto(item)),
      });
    }

    return summaries;
  }

  /**
   * Create playbook item
   */
  async createPlaybookItem(
    dealId: string,
    dto: CreatePlaybookItemDto,
  ): Promise<PlaybookItemResponseDto> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const playbook = this.playbookRepository.create({
      dealId,
      type: dto.type,
      criterion: dto.criterion,
      notes: dto.notes,
      order: dto.order ?? 0,
      status: PlaybookItemStatus.NOT_STARTED,
    });

    const saved = await this.playbookRepository.save(playbook);
    return this.toResponseDto(saved);
  }

  /**
   * Update playbook item
   */
  async updatePlaybookItem(
    dealId: string,
    itemId: string,
    dto: UpdatePlaybookItemDto,
    userId?: string,
  ): Promise<PlaybookItemResponseDto> {
    const playbook = await this.playbookRepository.findOne({
      where: { id: itemId, dealId },
    });

    if (!playbook) {
      throw new NotFoundException('Playbook item not found');
    }

    if (dto.status !== undefined) {
      playbook.status = dto.status;

      // Track completion
      if (dto.status === PlaybookItemStatus.COMPLETED && !playbook.completedAt) {
        playbook.completedAt = new Date();
        playbook.completedBy = userId || null;
      } else if (dto.status !== PlaybookItemStatus.COMPLETED) {
        playbook.completedAt = null;
        playbook.completedBy = null;
      }
    }

    if (dto.notes !== undefined) {
      playbook.notes = dto.notes;
    }

    if (dto.aiSuggestion !== undefined) {
      playbook.aiSuggestion = dto.aiSuggestion;
    }

    const updated = await this.playbookRepository.save(playbook);
    return this.toResponseDto(updated);
  }

  /**
   * Delete playbook item
   */
  async deletePlaybookItem(dealId: string, itemId: string): Promise<void> {
    const playbook = await this.playbookRepository.findOne({
      where: { id: itemId, dealId },
    });

    if (!playbook) {
      throw new NotFoundException('Playbook item not found');
    }

    await this.playbookRepository.remove(playbook);
  }

  /**
   * Initialize MEDDICC playbook for a deal
   */
  async initializeMEDDICC(dealId: string): Promise<PlaybookSummaryDto> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    // Check if MEDDICC already exists
    const existing = await this.playbookRepository.findOne({
      where: { dealId, type: PlaybookType.MEDDICC },
    });

    if (existing) {
      throw new BadRequestException('MEDDICC playbook already exists for this deal');
    }

    // MEDDICC criteria
    const criteria = [
      { criterion: 'Metrics', order: 1 },
      { criterion: 'Economic Buyer', order: 2 },
      { criterion: 'Decision Criteria', order: 3 },
      { criterion: 'Decision Process', order: 4 },
      { criterion: 'Identify Pain', order: 5 },
      { criterion: 'Champion', order: 6 },
      { criterion: 'Competition', order: 7 },
    ];

    const items = criteria.map((c) =>
      this.playbookRepository.create({
        dealId,
        type: PlaybookType.MEDDICC,
        criterion: c.criterion,
        order: c.order,
        status: PlaybookItemStatus.NOT_STARTED,
      }),
    );

    await this.playbookRepository.save(items);

    // Return summary
    const summaries = await this.getPlaybook(dealId, PlaybookType.MEDDICC);
    return summaries[0];
  }

  /**
   * Initialize BANT playbook for a deal
   */
  async initializeBANT(dealId: string): Promise<PlaybookSummaryDto> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    // Check if BANT already exists
    const existing = await this.playbookRepository.findOne({
      where: { dealId, type: PlaybookType.BANT },
    });

    if (existing) {
      throw new BadRequestException('BANT playbook already exists for this deal');
    }

    // BANT criteria
    const criteria = [
      { criterion: 'Budget', order: 1 },
      { criterion: 'Authority', order: 2 },
      { criterion: 'Need', order: 3 },
      { criterion: 'Timeline', order: 4 },
    ];

    const items = criteria.map((c) =>
      this.playbookRepository.create({
        dealId,
        type: PlaybookType.BANT,
        criterion: c.criterion,
        order: c.order,
        status: PlaybookItemStatus.NOT_STARTED,
      }),
    );

    await this.playbookRepository.save(items);

    // Return summary
    const summaries = await this.getPlaybook(dealId, PlaybookType.BANT);
    return summaries[0];
  }

  /**
   * Generate AI suggestions for playbook items
   */
  async generateAISuggestions(dealId: string, type: PlaybookType): Promise<PlaybookSummaryDto> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const items = await this.playbookRepository.find({
      where: { dealId, type },
      order: { order: 'ASC' },
    });

    if (items.length === 0) {
      throw new NotFoundException(`No ${type} playbook found for this deal`);
    }

    // Generate AI suggestions for each item
    try {
      const suggestions = await this.aiClientService.generatePlaybookSuggestions({
        dealName: deal.name,
        dealStage: deal.stage,
        dealAmount: Number(deal.amount),
        playbookType: type,
        criteria: items.map((item) => ({
          criterion: item.criterion,
          status: item.status,
          notes: item.notes,
        })),
      });

      // Update items with AI suggestions
      for (let i = 0; i < items.length; i++) {
        if (suggestions.suggestions[i]) {
          items[i].aiSuggestion = suggestions.suggestions[i];
          await this.playbookRepository.save(items[i]);
        }
      }
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      // Continue without AI suggestions
    }

    // Return updated summary
    const summaries = await this.getPlaybook(dealId, type);
    return summaries[0];
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(playbook: DealPlaybook): PlaybookItemResponseDto {
    return {
      id: playbook.id,
      dealId: playbook.dealId,
      type: playbook.type as PlaybookType,
      criterion: playbook.criterion,
      status: playbook.status as PlaybookItemStatus,
      notes: playbook.notes ?? undefined,
      aiSuggestion: playbook.aiSuggestion ?? undefined,
      order: playbook.order,
      completedBy: playbook.completedBy ?? undefined,
      completedAt: playbook.completedAt ?? undefined,
      createdAt: playbook.createdAt,
      updatedAt: playbook.updatedAt,
    };
  }
}
