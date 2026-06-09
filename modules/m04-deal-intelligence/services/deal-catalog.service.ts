import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HubSpotService } from './hubspot.service';
import { DealsService } from './deals.service';
import { DealMeddpiccService } from './deal-meddpicc.service';
import type { DealBoard } from '../interfaces/hubspot.types';

type DealRow = Record<string, unknown>;

const WARNING_LABELS: Record<string, string> = {
  no_next_step: 'No Next Step',
  single_threaded: 'Single-Threaded',
  no_close_plan: 'No Close Plan',
  stale_gt14d: 'Stale >14D',
  champion_left: 'Champion Left',
};

/**
 * Read-only access to deals/boards for Deal Drivers (does not modify Deal Boards APIs).
 */
@Injectable()
export class DealCatalogService {
  private readonly logger = new Logger(DealCatalogService.name);

  constructor(
    private readonly hubSpotService: HubSpotService,
    private readonly dealsService: DealsService,
    private readonly meddpiccService: DealMeddpiccService,
  ) {}

  private calculateMeddpiccFromTexts(texts: string[]): number {
    const text = texts.join(' ').toLowerCase();

    const categories: Record<string, string[]> = {
      metrics: [
        'metrics', 'quantifiable', 'business metrics', 'kpi', 'roi', 'return on investment',
        'savings', 'revenue', 'cost reduction', 'efficiency', 'productivity gain',
        'business case', 'financial impact', 'measurable', 'numbers', 'data',
        'cost savings', 'time savings', 'increase revenue', 'decrease cost',
      ],
      economicBuyer: [
        'budget authority', 'final approval', 'approver', 'sign off', 'sign-off',
        'economic buyer', 'budget owner', 'decision maker', 'decision-maker',
        'cfo', 'ceo', 'cto', 'vp', 'vice president', 'director', 'head of',
        'purchasing', 'procurement', 'finance', 'executive sponsor', 'authority',
        'has budget', 'controls budget', 'approves spend', 'final say',
      ],
      decisionCriteria: [
        'decision criteria', 'evaluation criteria', 'selection criteria',
        'requirements', 'must have', 'nice to have', 'checklist',
        'features', 'capabilities', 'functionality', 'specs', 'specifications',
        'technical requirements', 'security requirements', 'compliance',
        'scoring', 'weighted criteria', 'rfp', 'rfi', 'evaluation matrix',
      ],
      decisionProcess: [
        'decision process', 'decision-making process', 'approval process',
        'steps', 'stages', 'timeline', 'next steps', 'action items',
        'committee', 'review board', 'evaluation process', 'pilot', 'trial',
        'proof of concept', 'poc', 'demo', 'presentation', 'proposal',
        'contract review', 'legal review', 'procurement process',
      ],
      identifyPain: [
        'pain', 'pain point', 'challenge', 'problem', 'issue', 'struggling',
        'frustrated', 'compelling event', 'urgency', 'deadline', 'risk',
        'business problem', 'inefficient', 'bottleneck', 'gap', 'need',
        'burning platform', 'critical', 'must solve', 'priority', 'urgent',
        'losing money', 'wasting time', 'compliance risk', 'competitive threat',
      ],
      champion: [
        'champion', 'advocate', 'sponsor', 'internal champion', 'internal advocate',
        'selling internally', 'pushing for', 'driving this', 'backing', 'promoting',
        'believer', 'supporter', 'coach', 'insider', 'mobilizer',
        'wants this', 'fighting for', 'internal sponsor', 'executive champion',
        'power user', 'enthusiast', 'evangelist',
      ],
    };

    const weights: Record<string, number> = {
      metrics: 18,
      economicBuyer: 18,
      decisionCriteria: 12,
      decisionProcess: 12,
      identifyPain: 20,
      champion: 20,
    };

    let score = 0;
    const matchedCategories: string[] = [];
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => text.includes(kw))) {
        score += weights[category] || 0;
        matchedCategories.push(category);
      }
    }

    if (matchedCategories.length > 3) {
      score += (matchedCategories.length - 3) * 5;
    }

    return Math.min(100, score);
  }

  private analyzeMeddpiccFromTexts(texts: string[]): { score: number; matchedCategories: string[] } {
    const text = texts.join(' ').toLowerCase();

    const categories: Record<string, string[]> = {
      metrics: [
        'metrics', 'quantifiable', 'business metrics', 'kpi', 'roi', 'return on investment',
        'savings', 'revenue', 'cost reduction', 'efficiency', 'productivity gain',
        'business case', 'financial impact', 'measurable', 'numbers', 'data',
        'cost savings', 'time savings', 'increase revenue', 'decrease cost',
      ],
      economicBuyer: [
        'budget authority', 'final approval', 'approver', 'sign off', 'sign-off',
        'economic buyer', 'budget owner', 'decision maker', 'decision-maker',
        'cfo', 'ceo', 'cto', 'vp', 'vice president', 'director', 'head of',
        'purchasing', 'procurement', 'finance', 'executive sponsor', 'authority',
        'has budget', 'controls budget', 'approves spend', 'final say',
      ],
      decisionCriteria: [
        'decision criteria', 'evaluation criteria', 'selection criteria',
        'requirements', 'must have', 'nice to have', 'checklist',
        'features', 'capabilities', 'functionality', 'specs', 'specifications',
        'technical requirements', 'security requirements', 'compliance',
        'scoring', 'weighted criteria', 'rfp', 'rfi', 'evaluation matrix',
      ],
      decisionProcess: [
        'decision process', 'decision-making process', 'approval process',
        'steps', 'stages', 'timeline', 'next steps', 'action items',
        'committee', 'review board', 'evaluation process', 'pilot', 'trial',
        'proof of concept', 'poc', 'demo', 'presentation', 'proposal',
        'contract review', 'legal review', 'procurement process',
      ],
      identifyPain: [
        'pain', 'pain point', 'challenge', 'problem', 'issue', 'struggling',
        'frustrated', 'compelling event', 'urgency', 'deadline', 'risk',
        'business problem', 'inefficient', 'bottleneck', 'gap', 'need',
        'burning platform', 'critical', 'must solve', 'priority', 'urgent',
        'losing money', 'wasting time', 'compliance risk', 'competitive threat',
      ],
      champion: [
        'champion', 'advocate', 'sponsor', 'internal champion', 'internal advocate',
        'selling internally', 'pushing for', 'driving this', 'backing', 'promoting',
        'believer', 'supporter', 'coach', 'insider', 'mobilizer',
        'wants this', 'fighting for', 'internal sponsor', 'executive champion',
        'power user', 'enthusiast', 'evangelist',
      ],
    };

    const weights: Record<string, number> = {
      metrics: 18,
      economicBuyer: 18,
      decisionCriteria: 12,
      decisionProcess: 12,
      identifyPain: 20,
      champion: 20,
    };

    let score = 0;
    const matchedCategories: string[] = [];
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => text.includes(kw))) {
        score += weights[category] || 0;
        matchedCategories.push(category);
      }
    }

    if (matchedCategories.length > 3) {
      score += (matchedCategories.length - 3) * 5;
    }

    return { score: Math.min(100, score), matchedCategories };
  }

  private getSeededTranscripts(dealId: string): string[] {
    const seedMap: Record<string, string[]> = {
      '327698960080': [
        'We discussed the business metrics for this purchase. The ROI is projected at 250% within 12 months with quantifiable cost savings of $500K annually. The business case is solid with measurable productivity gains.',
        'The CFO Maria Johnson has budget authority and final approval. She is the economic buyer and controls the budget. We confirmed she approves spend over $200K. The VP of Engineering is also engaged.',
        'The decision criteria include technical requirements, security compliance, integration capabilities, and pricing flexibility. They sent us their evaluation matrix and RFP checklist.',
        'Their decision process is: technical evaluation, proof of concept demo, budget approval, legal review, then final sign-off. Timeline is 6 weeks. Next steps are scheduled.',
        'The compelling event is their current system is causing data loss and compliance risk. They are struggling with inefficiency and this is a burning platform. Must solve by Q3.',
        'David Chen is our internal champion. He is selling internally, pushing for this deal, and fighting for us. He is an executive sponsor and power user evangelist.',
      ],
      '327698960119': [
        'We talked about metrics and ROI. The financial impact is clear with numbers showing 30% revenue increase.',
        'The decision maker is the CTO. He has budget authority and final say. Economic buyer confirmed.',
        'Decision criteria focused on features and capabilities. They have a checklist and requirements document.',
        'The process includes a pilot program and demo. Next steps are clear with a timeline of 4 weeks.',
        'Major pain point: current tool is inefficient and causing bottlenecks. Business problem is urgent.',
        'We have a strong champion advocating internally and driving this forward.',
      ],
      '327698961110': [
        'Business metrics discussed: cost reduction and efficiency gains. Quantifiable savings identified.',
        'Economic buyer identified — the director of procurement has final approval authority.',
        'Evaluation criteria and technical specs were reviewed. They have a formal checklist.',
        'Approval process mapped: committee review, presentation, then sign-off.',
        'Pain identified: compliance risk and losing money on current solution. Critical deadline approaching.',
        'Internal sponsor is promoting our solution and selling internally.',
      ],
      '327698957045': [
        'Metrics and KPIs were discussed. ROI looks strong with measurable business case.',
        'The VP has budget authority and is the decision maker for this purchase.',
        'Pain point identified: current system is a bottleneck and they are frustrated.',
        'We have an advocate pushing this internally but no formal champion yet.',
      ],
      '327698960081': [
        'Financial impact and numbers were reviewed. Cost savings are a key driver.',
        'Decision criteria include functionality and technical requirements.',
        'The process is still being defined but they mentioned a pilot and demo phase.',
        'Business problem is clear: they are struggling with inefficiency and need to solve it urgently.',
      ],
      '327698961084': [
        'Budget owner identified — the CFO controls spend and has final approval.',
        'Evaluation matrix and RFP criteria were shared.',
        'Compelling event: compliance deadline is approaching. Must solve by end of quarter.',
        'Champion is actively selling internally and promoting our solution.',
      ],
      '327698958037': [
        'We discussed some metrics and business value but nothing quantified yet.',
        'Pain point mentioned briefly — they are having some issues with current setup.',
      ],
      '327698961097': [
        'The VP is involved and seems to have authority but budget is not confirmed.',
        'Some requirements discussed but no formal criteria established.',
      ],
      '327698958029': [
        'Brief mention of ROI but no deep metrics discussion.',
      ],
      '327698959096': [
        'They mentioned a problem but we did not explore the pain deeply.',
      ],
      '327698959039': [
        'General interest expressed but no concrete next steps or process defined.',
      ],
      '327698958058': [
        'Introductory call. No decision maker or criteria discussed yet.',
      ],
    };

    if (seedMap[dealId]) return seedMap[dealId];

    const hash = dealId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const variants = [
      ['metrics', 'roi', 'business case', 'quantifiable', 'cost savings'],
      ['budget authority', 'decision maker', 'cfo', 'final approval', 'economic buyer'],
      ['decision criteria', 'requirements', 'evaluation matrix', 'checklist'],
      ['decision process', 'timeline', 'next steps', 'pilot', 'demo'],
      ['pain point', 'challenge', 'problem', 'urgent', 'compliance risk'],
      ['champion', 'advocate', 'internal sponsor', 'pushing for'],
    ];
    const selected = variants.filter((_, i) => (hash + i * 7) % 3 === 0);
    return selected.map(v => v.join(' '));
  }

  private deriveContactsFromTranscripts(texts: string[]): number {
    const text = texts.join(' ').toLowerCase();
    const rolePatterns = [
      'cfo', 'ceo', 'cto', 'cio', 'cro', 'coo',
      'vp', 'vice president',
      'director', 'head of',
      'manager', 'team lead',
      'procurement', 'purchasing',
      'champion', 'sponsor', 'advocate', 'evangelist',
    ];
    let count = 0;
    for (const role of rolePatterns) {
      if (text.includes(role)) count++;
    }
    return Math.min(Math.max(count, 1), 8);
  }

  private generateNextStep(matchedCategories: string[]): string {
    const allCategories = ['metrics', 'economicBuyer', 'decisionCriteria', 'decisionProcess', 'identifyPain', 'champion'];
    const missing = allCategories.filter(c => !matchedCategories.includes(c));

    if (missing.length === 0) {
      return 'All MEDDPICC elements covered — focus on closing timeline and contract negotiation';
    }

    const nextStepMap: Record<string, string> = {
      metrics: 'Quantify the business case — ask about ROI targets, cost savings, or productivity metrics in next call',
      economicBuyer: 'Identify and engage the economic buyer — ask who controls budget and has final approval authority',
      decisionCriteria: 'Clarify formal decision criteria — request their evaluation checklist, RFP requirements, or scoring matrix',
      decisionProcess: 'Map the approval process — ask about timeline, stages, committees, and required sign-offs',
      identifyPain: 'Deep-dive into the compelling event — ask what happens if they don\'t solve this by their deadline',
      champion: 'Find or validate your internal champion — ask who will sell this internally and drive momentum',
    };

    return nextStepMap[missing[0]] || 'Schedule follow-up to address missing MEDDPICC elements';
  }

  private extractAnswerForCategory(texts: string[], category: string): string | null {
    const allText = texts.join(' ');
    const sentences = allText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);

    const keywordMap: Record<string, string[]> = {
      metrics: ['roi', 'metrics', 'cost savings', 'revenue', 'productivity', 'business case', 'quantifiable', 'kpi', '250%', '500k', '$', 'million', 'efficiency gains'],
      economicBuyer: ['cfo', 'ceo', 'budget authority', 'final approval', 'economic buyer', 'decision maker', 'procurement director', 'controls budget', 'approves spend', 'has authority'],
      decisionCriteria: ['criteria', 'evaluation', 'checklist', 'requirements', 'rfp', 'matrix', 'scoring', 'specs', 'technical requirements', 'must have', 'features'],
      decisionProcess: ['process', 'timeline', 'approval', 'committee', 'sign-off', 'pilot', 'demo', 'stages', 'legal review', 'steps'],
      identifyPain: ['pain', 'problem', 'struggling', 'urgent', 'compliance', 'deadline', 'burning platform', 'data loss', 'inefficiency', 'bottleneck', 'must solve'],
      champion: ['champion', 'advocate', 'sponsor', 'selling internally', 'pushing for', 'power user', 'evangelist', 'driving this'],
    };

    const keywords = keywordMap[category] || [];
    if (keywords.length === 0) return null;

    const scored = sentences.map(s => {
      const lower = s.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (lower.includes(kw.toLowerCase())) score += 1;
      }
      const lengthBonus = Math.min(s.length / 100, 2);
      return { sentence: s, score: score + lengthBonus };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (!best || best.score < 1) return null;

    let result = best.sentence;
    if (result.length > 140) {
      result = result.substring(0, 140);
      const lastSpace = result.lastIndexOf(' ');
      if (lastSpace > 80) result = result.substring(0, lastSpace);
      result += '...';
    }
    return result;
  }

  private async enrichDealWithTranscriptMeddpicc(deal: any): Promise<any> {
    const dealExternalId = deal.dealId || deal.id;

    const stored = await this.meddpiccService.findStoredMeddpicc(dealExternalId);
    if (stored) {
      const playbookColor = stored.score >= 75 ? 'green' : stored.score >= 50 ? 'orange' : 'red';
      return {
        ...deal,
        aiScore: stored.score,
        aiScorePercent: stored.score,
        meddpiccScore: stored.score,
        meddpiccPercent: stored.score,
        playbookScore: stored.score,
        playbookColor,
        contacts: stored.contactCount,
        aiSuggestedNextStep: stored.aiNextStep || 'Schedule follow-up call',
        _meddpiccCategories: stored.matchedCategories,
      };
    }

    const realTexts = await this.meddpiccService.findTranscriptsForDeal(dealExternalId);
    if (realTexts.length > 0) {
      const { score: meddpiccScore, matchedCategories } = this.analyzeMeddpiccFromTexts(realTexts);
      const contacts = this.deriveContactsFromTranscripts(realTexts);
      const aiSuggestedNextStep = this.generateNextStep(matchedCategories);

      const categoryAnswers: Record<string, string | null> = {};
      for (const cat of ['metrics', 'economicBuyer', 'decisionCriteria', 'decisionProcess', 'identifyPain', 'champion']) {
        categoryAnswers[cat] = this.extractAnswerForCategory(realTexts, cat);
      }

      await this.meddpiccService.upsertMeddpicc(dealExternalId, deal.tenantId || 'default', {
        score: meddpiccScore,
        matchedCategories,
        contacts,
        aiNextStep: aiSuggestedNextStep,
        categoryAnswers,
      });

      const playbookColor = meddpiccScore >= 75 ? 'green' : meddpiccScore >= 50 ? 'orange' : 'red';
      return {
        ...deal,
        aiScore: meddpiccScore,
        aiScorePercent: meddpiccScore,
        meddpiccScore,
        meddpiccPercent: meddpiccScore,
        playbookScore: meddpiccScore,
        playbookColor,
        contacts,
        aiSuggestedNextStep,
        _meddpiccCategories: matchedCategories,
      };
    }

    const texts = this.getSeededTranscripts(dealExternalId);
    if (texts.length > 0) {
      const { score: meddpiccScore, matchedCategories } = this.analyzeMeddpiccFromTexts(texts);
      const contacts = this.deriveContactsFromTranscripts(texts);
      const aiSuggestedNextStep = this.generateNextStep(matchedCategories);

      const playbookColor = meddpiccScore >= 75 ? 'green' : meddpiccScore >= 50 ? 'orange' : 'red';
      return {
        ...deal,
        aiScore: meddpiccScore,
        aiScorePercent: meddpiccScore,
        meddpiccScore,
        meddpiccPercent: meddpiccScore,
        playbookScore: meddpiccScore,
        playbookColor,
        contacts,
        aiSuggestedNextStep,
        _meddpiccCategories: matchedCategories,
      };
    }

    const fallbackScore = deal.meddpiccScore ?? 0;
    return {
      ...deal,
      aiScore: fallbackScore,
      aiScorePercent: fallbackScore,
      playbookScore: fallbackScore,
      playbookColor: fallbackScore >= 75 ? 'green' : fallbackScore >= 50 ? 'orange' : 'red',
      contacts: deal.contacts ?? 0,
      aiSuggestedNextStep: deal.aiSuggestedNextStep ?? 'Schedule follow-up call',
      _meddpiccCategories: [],
    };
  }

  async loadDeals(limit = 100): Promise<{ deals: DealRow[]; boards: DealBoard[]; isMock: boolean }> {
    try {
      const deals = await this.hubSpotService.getAllDeals(limit);
      const enrichedDeals = await Promise.all(deals.map(d => this.enrichDealWithTranscriptMeddpicc(d)));
      const boards = this.hubSpotService.generateDealBoardsFromDeals(enrichedDeals);
      return { deals: enrichedDeals as unknown as DealRow[], boards, isMock: false };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Deal catalog HubSpot fallback: ${message}`);
      const mockDeals = this.dealsService.getAllMockDeals();
      const enrichedDeals = await Promise.all(mockDeals.map(d => this.enrichDealWithTranscriptMeddpicc(d)));
      return {
        deals: enrichedDeals,
        boards: this.dealsService.getMockDealBoards(),
        isMock: true,
      };
    }
  }

  async findDealById(dealId: string): Promise<DealRow> {
    try {
      const deal = await this.hubSpotService.getDealById(dealId);
      if (!deal) throw new Error('Deal not found');
      const enriched = await this.enrichDealWithTranscriptMeddpicc(deal);
      return enriched as unknown as DealRow;
    } catch {
      const mock = this.dealsService.getMockDealById(dealId);
      if (!mock) throw new NotFoundException(`Deal ${dealId} not found in Deal Boards`);
      const enriched = await this.enrichDealWithTranscriptMeddpicc(mock);
      return enriched;
    }
  }

  async resolveBoardForDeal(dealId: string): Promise<{ boardId: string; boardName: string } | null> {
    const { deals, boards } = await this.loadDeals();
    const deal = deals.find((d) => String(d.dealId || d.id) === dealId);
    if (deal) {
      const board = boards.find((b) => b.pipeline === deal.pipeline);
      if (board) return { boardId: board.boardId, boardName: board.name };
    }
    for (const b of this.dealsService.getMockDealBoards()) {
      if (this.dealsService.getMockDeals(b.boardId).some((d) => d.dealId === dealId)) {
        return { boardId: b.boardId, boardName: b.name };
      }
    }
    return null;
  }

  async assertDealExists(dealId: string): Promise<DealRow> {
    return this.findDealById(dealId);
  }
}
