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

    let generatedData: any = null;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const contextString = `
Deal Name: ${deal.name}
Stage: ${deal.stage}
Amount: ${deal.amount}
Owner: ${deal.ownerName}
Account Name: ${deal.accountName}
Close Date: ${deal.closeDate}
Probability: ${deal.probability}
AI Score: ${deal.aiScore}
CRM Data: ${JSON.stringify(deal.crmData || {})}
Recent Activities: ${JSON.stringify((deal.activities || []).map(a => ({ type: a.type, title: a.title, description: a.description, date: a.activityDate })))}
Playbooks: ${JSON.stringify((deal.playbooks || []).map(p => ({ criterion: p.criterion, status: p.status, notes: p.notes, aiSuggestion: p.aiSuggestion })))}
Tasks: ${JSON.stringify((deal.tasks || []).map(t => ({ title: t.title, description: t.description, status: t.status })))}
Comments: ${JSON.stringify((deal.comments || []).map(c => ({ content: c.content, author: c.authorName })))}
`;

        const systemPrompt = `You are a sales intelligence assistant. Your task is to analyze the deal context and generate a 7-section deal brief.
The 7 sections are:
1. Overview: A sharp and precise 2-3 sentence business summary of the deal.
2. Key Discussion Points: A list of 3-5 tactical bullet points summarizing recent discussions/themes.
3. Customer Needs & Goals: A list of customer pain points, needs, or goals. Each item should have a short "title" and a detailed "description".
4. Risks & Objections: A list of key risks or objections identified. Each item should have a "title", "description", and "severity" (one of: 'high', 'medium', 'low').
5. Decisions & Commitments: A list of decisions made or action items/commitments. Each item should have a "description", "assigneeType" (one of: 'rep', 'customer'), and "dueDate" (YYYY-MM-DD or timeframe).
6. Key Stakeholders: A list of key customer/internal stakeholders. Each item should have "name", "title", "company", and "avatarInitials" (1-2 uppercase letters).
7. Recent Activity Context: A list of the most recent interactions. Each item should have "type" (one of: 'email', 'call', 'meeting'), "description" (what happened), and "date" (date string or relative).

Return ONLY a valid JSON object matching this structure:
{
  "overview": "Overview text here",
  "keyDiscussionPoints": [
    "Discussion point 1",
    "Discussion point 2"
  ],
  "customerNeeds": [
    { "title": "Need Title 1", "description": "Need Description 1" }
  ],
  "risks": [
    { "title": "Risk Title 1", "description": "Risk Description 1", "severity": "high" }
  ],
  "commitments": [
    { "description": "Commitment description 1", "assigneeType": "rep", "dueDate": "2026-06-15" }
  ],
  "stakeholders": [
    { "name": "Name 1", "title": "Title 1", "company": "Company 1", "avatarInitials": "NI" }
  ],
  "activityContext": [
    { "type": "call", "description": "Activity description 1", "date": "Yesterday" }
  ]
}
Do not wrap it in markdown code blocks or add any comments or text. Return strictly the JSON object.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                { parts: [{ text: systemPrompt + '\n\nDeal Context:\n' + contextString }] }
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
            generatedData = JSON.parse(cleanContent);
          }
        } else {
          this.logger.error(`Gemini API error status: ${response.status}`);
        }
      } catch (err) {
        this.logger.error('Failed to generate deal brief with Gemini API', err);
      }
    }

    if (!generatedData) {
      this.logger.log('Gemini API key is not configured or failed. Generating simulated structured brief.');
      generatedData = this.generateSimulatedBrief(deal);
    }

    // Create new summary
    const summary = this.summaryRepository.create({
      dealId: deal.id,
      summary: JSON.stringify(generatedData),
      keyPoints: generatedData.keyDiscussionPoints,
      nextSteps: generatedData.commitments.map((c: any) => c.description),
      competitorMentions: [],
      confidenceScore: deal.aiScore ? Number(deal.aiScore) : 85,
      flaggedForReview: false,
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
        confidenceScore: savedSummary.confidenceScore,
      },
    });

    return savedSummary;
  }

  private generateSimulatedBrief(deal: Deal) {
    const isHighRisk = deal.isHighRisk;
    
    // Overview
    const overview = `${deal.name} is currently in the ${String(deal.stage || '').toLowerCase()} stage with a close probability of ${deal.probability || 0}%. The opportunity amount is $${Number(deal.amount || 0).toLocaleString()}. ${
      deal.nextStep ? `The next scheduled step is: "${deal.nextStep}".` : 'No next steps are currently scheduled in the system.'
    } ${isHighRisk ? 'This opportunity shows some high-risk signals that require immediate review.' : 'The deal is showing healthy activity strength.'}`;

    // Key Discussion Points
    const keyDiscussionPoints = [
      `Initial alignment on product capabilities and integration requirements for ${deal.accountName || 'the client'}.`,
      `Discussion around platform licensing tiers, implementation timelines, and resource requirements.`,
      `Verification of technical feasibility and deployment considerations with their engineering lead.`,
    ];
    if (deal.nextStep) {
      keyDiscussionPoints.push(`Agreed next action: ${deal.nextStep}.`);
    }

    // Customer Needs
    const customerNeeds = [
      {
        title: 'Scalable Platform Integration',
        description: 'Requires a platform that integrates directly with their existing business tools and handles high volumes.',
      },
      {
        title: 'Efficiency and Visibility',
        description: 'Needs to streamline reporting processes and eliminate manual updates to improve executive visibility.',
      },
    ];

    // Risks & Objections
    const risks: any[] = [];
    if (isHighRisk) {
      risks.push({
        title: 'High Risk Signals Detected',
        description: deal.riskReason || 'Deal is flagged as high risk due to slow stage velocity.',
        severity: 'high',
      });
    }
    if (deal.amount > 200000) {
      risks.push({
        title: 'Budget Approval Hurdles',
        description: 'Enterprise tier pricing requires secondary executive sign-off from the CFO.',
        severity: 'medium',
      });
    }
    risks.push({
      title: 'Timeline Slippage',
      description: 'Potential for target close date to shift if legal review takes longer than expected.',
      severity: 'low',
    });

    // Decisions & Commitments
    const commitments = [
      {
        description: 'Provide updated product pricing sheet and pilot evaluation proposal.',
        assigneeType: 'rep',
        dueDate: 'Within 3 days',
      },
      {
        description: 'Share technical integration specification document.',
        assigneeType: 'customer',
        dueDate: 'End of week',
      },
    ];

    // Key Stakeholders
    const stakeholders = [
      {
        name: deal.ownerName || 'Sarah Chen',
        title: 'Deal Owner (Account Executive)',
        company: 'Our Organization',
        avatarInitials: (deal.ownerName || 'SC')
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase(),
      },
      {
        name: 'Alex Johnson',
        title: 'Primary Evaluation Champion',
        company: deal.accountName || 'Acme Corp',
        avatarInitials: 'AJ',
      },
      {
        name: 'Robert Davis',
        title: 'VP Finance (Budget Owner)',
        company: deal.accountName || 'Acme Corp',
        avatarInitials: 'RD',
      },
    ];

    // Recent Activity Context
    const activityContext: any[] = [];
    if (deal.activities && deal.activities.length > 0) {
      deal.activities.slice(0, 3).forEach(act => {
        activityContext.push({
          type: String(act.type || 'email').toLowerCase(),
          description: act.title || act.description || 'Interaction logged',
          date: new Date(act.activityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        });
      });
    } else {
      activityContext.push({
        type: 'email',
        description: 'Sent follow-up recap email with presentation deck',
        date: '2 days ago',
      });
      activityContext.push({
        type: 'call',
        description: 'Discovery call discussing pain points and scoping requirements',
        date: 'Last week',
      });
    }

    return {
      overview,
      keyDiscussionPoints,
      customerNeeds,
      risks,
      commitments,
      stakeholders,
      activityContext,
    };
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
