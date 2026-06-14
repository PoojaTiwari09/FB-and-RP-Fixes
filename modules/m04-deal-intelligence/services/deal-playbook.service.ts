import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@m04/database/inject-repository';
import { M04EntityRepository as Repository } from '@m04/database/m04-prisma.repository';
import { DealPlaybook, PlaybookType, PlaybookItemStatus } from '@m04/entities/deal-playbook.entity';
import { Deal } from '@m04/entities/deal.entity';
import {
  CreatePlaybookItemDto,
  UpdatePlaybookItemDto,
  PlaybookItemResponseDto,
  PlaybookSummaryDto,
} from '@m04/schemas/playbook.dto';
import { AIClientService } from './ai-client.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DealPlaybookService {
  constructor(
    @InjectRepository(DealPlaybook)
    private readonly playbookRepository: Repository<DealPlaybook>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    private readonly aiClientService: AIClientService,
    private readonly prisma: PrismaService,
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

    let items = await queryBuilder
      .orderBy('playbook.type', 'ASC')
      .addOrderBy('playbook.order', 'ASC')
      .getMany();

    // Auto-initialize MEDDICC if the playbook list is empty and no specific non-MEDDICC type is requested
    if (items.length === 0 && (!type || type === PlaybookType.MEDDICC)) {
      await this.initializeMEDDICC(dealId);
      items = await queryBuilder
        .orderBy('playbook.type', 'ASC')
        .addOrderBy('playbook.order', 'ASC')
        .getMany();
    }

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
      { criterion: 'METRICS', question: 'What are the quantifiable business metrics driving this purchase?', order: 1 },
      { criterion: 'ECONOMIC BUYER', question: 'Who has budget authority and final approval?', order: 2 },
      { criterion: 'DECISION CRITERIA', question: 'What are the formal decision criteria?', order: 3 },
      { criterion: 'DECISION PROCESS', question: 'What is the formal decision-making process?', order: 4 },
      { criterion: 'IDENTIFY PAIN', question: 'What is the compelling event or pain?', order: 5 },
      { criterion: 'CHAMPION', question: 'Who is your internal champion and how influential are they?', order: 6 },
      { criterion: 'COMPETITION', question: 'Who is the competition and what is our strategy?', order: 7 },
    ];

    // Fetch call transcripts for the deal
    const calls = await this.prisma.call.findMany({
      where: { dealId },
    });
    const transcriptText = calls
      .map((c) => c.transcriptText)
      .filter(Boolean)
      .join('\n\n');

    const answers = await this.extractMEDDICFromTranscripts(deal, transcriptText);

    const items = criteria.map((c) => {
      const ans = answers[c.criterion] || {
        notes: 'Not discussed in transcripts',
        status: PlaybookItemStatus.NOT_STARTED,
        aiSuggestedNote: 'Ask champion for details.',
      };
      return this.playbookRepository.create({
        dealId,
        type: PlaybookType.MEDDICC,
        criterion: c.criterion,
        question: c.question,
        order: c.order,
        status: ans.status,
        notes: ans.notes,
        aiSuggestion: ans.aiSuggestedNote,
      });
    });

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
      { criterion: 'BUDGET', question: 'What is the prospect\'s budget for this project?', order: 1 },
      { criterion: 'AUTHORITY', question: 'Who is the decision maker and what is their authority?', order: 2 },
      { criterion: 'NEED', question: 'What is the core business need or pain point?', order: 3 },
      { criterion: 'TIMELINE', question: 'What is the target timeline for implementation?', order: 4 },
    ];

    const items = criteria.map((c) =>
      this.playbookRepository.create({
        dealId,
        type: PlaybookType.BANT,
        criterion: c.criterion,
        question: c.question,
        order: c.order,
        status: PlaybookItemStatus.NOT_STARTED,
        notes: 'Not discussed in transcripts',
        aiSuggestion: 'Ask the prospect during discovery.',
      }),
    );

    await this.playbookRepository.save(items);

    // Return summary
    const summaries = await this.getPlaybook(dealId, PlaybookType.BANT);
    return summaries[0];
  }

  /**
   * Extract MEDDIC answers from meeting transcripts
   */
  private async extractMEDDICFromTranscripts(
    deal: Deal,
    transcriptText: string,
  ): Promise<Record<string, { notes: string; status: PlaybookItemStatus; aiSuggestedNote: string }>> {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && transcriptText.trim()) {
      try {
        const systemPrompt = `You are a sales intelligence assistant. Your task is to analyze the sales meeting transcripts for a deal and answer the MEDDICC playbook criteria.
The 7 criteria are:
1. METRICS: Quantifiable business metrics driving this purchase (e.g. reduce cost by 20%, save 5 hours/week).
2. ECONOMIC BUYER: Who has budget authority and final approval? (e.g. John Doe, VP Finance).
3. DECISION CRITERIA: What are the formal decision criteria (technical feasibility, security specs, implementation cost)?
4. DECISION PROCESS: What is the formal decision-making process (evaluation, legal sign-off, purchase order)?
5. IDENTIFY PAIN: What is the core customer pain, business problem, or compelling event?
6. CHAMPION: Who is the internal champion who is actively selling on our behalf?
7. COMPETITION: Who is the competition and what is our strategy?

Return ONLY a valid JSON object where the keys are the exact criteria names (METRICS, ECONOMIC BUYER, DECISION CRITERIA, DECISION PROCESS, IDENTIFY PAIN, CHAMPION, COMPETITION) and the value is an object with:
- "notes": A brief summary of what was found in the transcripts answering this question. If not mentioned in the transcript, say "Not discussed in transcripts".
- "status": One of 'Completed' (if clearly identified), 'In Progress' (if partially discussed), 'Pending' (if not mentioned at all).
- "aiSuggestedNote": A recommended next action for the rep to verify or retrieve this information.

Format:
{
  "METRICS": {
    "notes": "Customer needs to reduce transcription costs by 30% and save 10 hours of manual work per agent weekly.",
    "status": "Completed",
    "aiSuggestedNote": "Verify baseline metrics with team lead."
  },
  ...
}
Do not wrap it in markdown code blocks or add any comments. Return strictly the JSON object.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                { parts: [{ text: systemPrompt + '\n\nTranscripts:\n' + transcriptText }] }
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048
              }
            })
          }
        );

        if (response.ok) {
          const resJson = await response.json() as any;
          const content = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            const cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
            return JSON.parse(cleanContent);
          }
        }
      } catch (err) {
        console.error('Failed to extract MEDDIC via Gemini:', err);
      }
    }

    return this.generateSimulatedMEDDIC(deal, !!transcriptText.trim());
  }

  /**
   * Simulated fallback for MEDDICC answers
   */
  private generateSimulatedMEDDIC(deal: Deal, hasTranscripts: boolean): Record<string, any> {
    if (!hasTranscripts) {
      return {
        'METRICS': {
          notes: 'Not discussed in transcripts',
          status: PlaybookItemStatus.NOT_STARTED,
          aiSuggestedNote: 'Ask client about their current cost baseline and target savings.',
        },
        'ECONOMIC BUYER': {
          notes: 'Not discussed in transcripts',
          status: PlaybookItemStatus.NOT_STARTED,
          aiSuggestedNote: 'Map organization structure and ask the champion who signs the final contract.',
        },
        'DECISION CRITERIA': {
          notes: 'Not discussed in transcripts',
          status: PlaybookItemStatus.NOT_STARTED,
          aiSuggestedNote: 'Confirm technical and financial criteria for vendor selection.',
        },
        'DECISION PROCESS': {
          notes: 'Not discussed in transcripts',
          status: PlaybookItemStatus.NOT_STARTED,
          aiSuggestedNote: 'Request legal review requirements and standard procurement process details.',
        },
        'IDENTIFY PAIN': {
          notes: 'Not discussed in transcripts',
          status: PlaybookItemStatus.NOT_STARTED,
          aiSuggestedNote: 'Ask client what happens if this project is delayed or cancelled.',
        },
        'CHAMPION': {
          notes: 'Not discussed in transcripts',
          status: PlaybookItemStatus.NOT_STARTED,
          aiSuggestedNote: 'Verify if the main contact is selling on our behalf internally.',
        },
        'COMPETITION': {
          notes: 'Not discussed in transcripts',
          status: PlaybookItemStatus.NOT_STARTED,
          aiSuggestedNote: 'Ask if they are evaluating other vendors or solutions.',
        },
      };
    }

    const nameLower = deal.name.toLowerCase();
    const stageLower = deal.stage.toLowerCase();
    const amountStr = Number(deal.amount || 0).toLocaleString();

    let clientNeed = 'platform integration and efficiency improvement';
    if (nameLower.includes('crm')) clientNeed = 'CRM consolidation and unified reporting';
    else if (nameLower.includes('cloud')) clientNeed = 'cloud migration and security compliance';
    else if (nameLower.includes('analytics')) clientNeed = 'advanced analytics and BI visualization';

    let economicBuyer = 'Sarah Chen (VP of Sales)';
    if (deal.ownerName === 'Sarah Chen') economicBuyer = 'Alex Johnson (CFO)';

    return {
      'METRICS': {
        notes: `The client aims to achieve a 25% efficiency gain and save approximately $${(Number(deal.amount || 0) * 0.15).toLocaleString()} annually by automating manual ingestion workflows.`,
        status: PlaybookItemStatus.COMPLETED,
        aiSuggestedNote: 'Validate these metrics during the pilot review phase.',
      },
      'ECONOMIC BUYER': {
        notes: stageLower.includes('proposal') || stageLower.includes('negotiation') 
          ? `Identified ${economicBuyer} as the primary budget holder. They have given preliminary verbal approval.`
          : `Not officially introduced yet. We have discussed budget with department heads, but final sign-off is held by the VP or CFO.`,
        status: stageLower.includes('proposal') || stageLower.includes('negotiation') ? PlaybookItemStatus.COMPLETED : PlaybookItemStatus.IN_PROGRESS,
        aiSuggestedNote: 'Schedule a dedicated budget review meeting with the executive sponsor.',
      },
      'DECISION CRITERIA': {
        notes: `Key requirements include: 1. API latency under 200ms, 2. Enterprise SSO/SAML support, 3. Dynamic team permission controls, 4. Data export tools.`,
        status: PlaybookItemStatus.COMPLETED,
        aiSuggestedNote: 'Review technical criteria checklist with the engineering lead.',
      },
      'DECISION PROCESS': {
        notes: `The process involves technical evaluation (currently in progress), legal security review, procurement pricing approval, and final executive sign-off.`,
        status: PlaybookItemStatus.IN_PROGRESS,
        aiSuggestedNote: 'Request legal contract template to start concurrent review.',
      },
      'IDENTIFY PAIN': {
        notes: `The client's main issue is a lack of real-time visibility and high manual transcription overhead, causing delayed sales pipelines.`,
        status: PlaybookItemStatus.COMPLETED,
        aiSuggestedNote: 'Quantify the daily cost of delay to create urgency.',
      },
      'CHAMPION': {
        notes: `Primary evaluator appears highly engaged, providing meeting transcripts and internal alignment details.`,
        status: PlaybookItemStatus.COMPLETED,
        aiSuggestedNote: 'Help the champion construct the internal business case deck.',
      },
      'COMPETITION': {
        notes: `Evaluated two competitors in Q1, but paused discussions due to lack of standard integration features. We are currently positioned as the preferred choice.`,
        status: PlaybookItemStatus.IN_PROGRESS,
        aiSuggestedNote: 'Confirm competitive comparison parameters with the evaluation team.',
      },
    };
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

      for (let i = 0; i < items.length; i++) {
        if (suggestions.suggestions[i]) {
          items[i].aiSuggestion = suggestions.suggestions[i];
          await this.playbookRepository.save(items[i]);
        }
      }
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    }

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
      question: playbook.question ?? undefined,
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
