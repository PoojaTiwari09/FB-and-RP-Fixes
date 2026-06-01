import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { M02ConversationIntelligenceService } from '../services/m02.service';
import {
  AnalyticsHistoryQuerySchema,
  CallReviewsListQuerySchema,
  CoachingBodySchema,
  PatchReviewSchema,
  SaveAnswerSchema,
} from './m02-frontend-call-reviews.schema';
import {
  formatMmSs,
  mapReviewDetail,
  mapReviewListItem,
  scorecardSectionsTemplate,
} from './m02-frontend-call-reviews.mapper';

const SCORECARDS = [
  { scorecardId: 'sc_01', scorecardName: 'Discovery Call Scorecard' },
  { scorecardId: 'sc_02', scorecardName: 'Demo Call Scorecard' },
  { scorecardId: 'sc_03', scorecardName: 'Negotiation Scorecard' },
  { scorecardId: 'sc_04', scorecardName: 'Closing Call Scorecard' },
];

const USERS = [
  { userId: 'u_001', userName: 'You (Default)' },
  { userId: 'u_002', userName: 'Alex Martinez' },
  { userId: 'u_003', userName: 'Priya Nair' },
];

const COACHING_TAGS = [
  { id: 'tag_01', label: 'Needs Coaching' },
  { id: 'tag_02', label: 'Best Practice' },
  { id: 'tag_03', label: 'Escalation Risk' },
  { id: 'tag_04', label: 'Compliance Concern' },
  { id: 'tag_05', label: 'Follow-up Needed' },
  { id: 'tag_06', label: 'Great Discovery' },
  { id: 'tag_07', label: 'Poor Closing' },
  { id: 'tag_08', label: 'Strong Closer' },
  { id: 'tag_09', label: 'Good Rapport' },
];

@Injectable()
export class M02FrontendCallReviewsService {
  private readonly reviews = new Map<string, Map<string, any>>();
  private readonly drafts = new Map<string, any>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly m02: M02ConversationIntelligenceService,
  ) {}

  private store(tenantId: string) {
    if (!this.reviews.has(tenantId)) this.reviews.set(tenantId, new Map());
    return this.reviews.get(tenantId)!;
  }

  private async ensureSeeded(tenantId: string) {
    const store = this.store(tenantId);
    if (store.size > 0) return;

    const calls = await this.prisma.callRecord.findMany({
      where: { tenantId },
      take: 8,
      orderBy: { callDate: 'desc' },
      include: { transcript: true },
    });

    const seedCalls = calls.length
      ? calls
      : [
          {
            id: 'call_demo_001',
            title: 'Discovery Call - Acme Corp Q2 Initiative',
            callOwner: 'Sarah Chen',
            accountId: 'Acme Corp',
            callDate: new Date(),
            durationSeconds: 2723,
            callSource: 'Zoom',
            participants: ['Sarah Chen (Rep)', 'John Smith (VP Sales)'],
            transcript: { summary: 'Strong discovery with pricing interest; confirm decision timeline.' },
          },
        ];

    seedCalls.forEach((c, i) => {
      const reviewId = `rv_${String(i + 1).padStart(3, '0')}`;
      store.set(reviewId, {
        reviewId,
        callId: c.id,
        callTitle: c.title,
        scorecardName: 'Discovery Call Scorecard',
        scorecardId: 'sc_01',
        account: c.accountId || 'Acme Corp',
        callDate: (c.callDate instanceof Date ? c.callDate : new Date()).toISOString(),
        callType: i % 2 === 0 ? 'Discovery' : 'Demo',
        duration: formatMmSs(c.durationSeconds ?? 1800),
        priority: i === 0 ? 'High' : 'Medium',
        status: i === 0 ? 'Pending' : i === 1 ? 'In Progress' : 'Completed',
        aiFlags: i === 0 ? ['High Risk Deal', 'No Next Steps'] : ['Good Rapport'],
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        salesRep: c.callOwner || 'Sarah Chen',
        reviewer: 'Alex Martinez',
        reviewMode: 'AI-Assisted',
        scorecardVersion: 'v2.3',
        talkRatio: { rep: 45, customer: 55 },
        sentimentSummary: 'Positive with budget caution',
        sentimentScore: 65,
        risksDetected: ['Budget timeline unclear'],
        keyHighlights: ['Customer asked about integration', 'Competitor mentioned'],
        aiSummary: c.transcript?.summary || 'AI summary pending.',
        quickStats: { topics: 4, actionItems: 3 },
        dealLinked: 'Acme Corp — Q2 Initiative',
      });
    });
  }

  private async getReview(tenantId: string, reviewId: string) {
    await this.ensureSeeded(tenantId);
    const review = this.store(tenantId).get(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  private async getCallForReview(tenantId: string, callId: string) {
    return this.prisma.callRecord.findFirst({
      where: { id: callId, tenantId },
      include: { transcript: { include: { utterances: { orderBy: { sequenceIndex: 'asc' } } } } },
    });
  }

  async listReviews(tenantId: string, raw: Record<string, string>) {
    const q = CallReviewsListQuerySchema.parse(raw);
    await this.ensureSeeded(tenantId);
    let rows = [...this.store(tenantId).values()];

    if (q.search) {
      const needle = q.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.callTitle?.toLowerCase().includes(needle) ||
          r.account?.toLowerCase().includes(needle) ||
          r.salesRep?.toLowerCase().includes(needle),
      );
    }
    if (q.status && !/^all\b/i.test(q.status)) {
      rows = rows.filter((r) => r.status === q.status);
    }
    if (q.priority && !/^all\b/i.test(q.priority)) {
      rows = rows.filter((r) => r.priority === q.priority);
    }
    if (q.callType && !/^all\b/i.test(q.callType)) {
      rows = rows.filter((r) => r.callType === q.callType);
    }

    const start = (q.page - 1) * q.size;
    const slice = rows.slice(start, start + q.size);

    return {
      totalCount: rows.length,
      data: slice.map(mapReviewListItem),
    };
  }

  async getReviewDetail(tenantId: string, reviewId: string) {
    const review = await this.getReview(tenantId, reviewId);
    const call = await this.getCallForReview(tenantId, review.callId);
    return mapReviewDetail(review, call);
  }

  getScorecards() {
    return { scorecards: SCORECARDS };
  }

  getUsers() {
    return { users: USERS };
  }

  getCoachingTags() {
    return { tags: COACHING_TAGS };
  }

  async patchReview(tenantId: string, reviewId: string, body: unknown) {
    const dto = PatchReviewSchema.parse(body);
    const review = await this.getReview(tenantId, reviewId);
    const updated: string[] = [];
    if (dto.scorecardId) {
      review.scorecardId = dto.scorecardId;
      const sc = SCORECARDS.find((s) => s.scorecardId === dto.scorecardId);
      if (sc) review.scorecardName = sc.scorecardName;
      updated.push('scorecardId');
    }
    if (dto.reviewerId) {
      const u = USERS.find((x) => x.userId === dto.reviewerId);
      review.reviewer = u?.userName || dto.reviewerId;
      updated.push('reviewerId');
    }
    return { success: true, reviewId, updatedFields: updated };
  }

  async markNa(tenantId: string, reviewId: string) {
    const review = await this.getReview(tenantId, reviewId);
    review.status = 'Not Applicable';
    return { success: true, status: 'Not Applicable', reviewId };
  }

  async getScorecardForm(tenantId: string, reviewId: string) {
    await this.getReview(tenantId, reviewId);
    const draft = this.drafts.get(reviewId);
    const sections = scorecardSectionsTemplate();
    const answeredCount = draft?.answeredCount ?? 0;
    return {
      totalQuestions: 11,
      answeredCount,
      sections,
    };
  }

  async getTranscript(tenantId: string, reviewId: string) {
    const review = await this.getReview(tenantId, reviewId);
    const call = await this.getCallForReview(tenantId, review.callId);
    const entries = (call?.transcript?.utterances ?? []).map((u) => ({
      timestamp: formatMmSs(Math.floor((u.startMs ?? 0) / 1000)),
      speaker: u.speaker,
      text: u.text,
    }));
    if (!entries.length) {
      return {
        entries: [
          { timestamp: '00:00', speaker: 'Rep', text: 'Thanks for joining today.' },
          { timestamp: '00:45', speaker: 'Customer', text: 'Happy to discuss our evaluation.' },
        ],
      };
    }
    return { entries };
  }

  getAiInsights() {
    return {
      insights: [
        { type: 'positive', title: 'Strong Discovery', description: 'Rep asked multiple open-ended questions.' },
        { type: 'warning', title: 'Missing: Next Steps', description: 'No explicit next meeting scheduled.' },
        { type: 'positive', title: 'Good Rapport', description: 'Positive tone throughout the call.' },
      ],
    };
  }

  async saveAnswer(tenantId: string, reviewId: string, body: unknown) {
    SaveAnswerSchema.parse(body);
    const draft = this.drafts.get(reviewId) || { answeredCount: 0 };
    draft.answeredCount = Math.min(11, (draft.answeredCount || 0) + 1);
    this.drafts.set(reviewId, draft);
    const review = await this.getReview(tenantId, reviewId);
    if (review.status === 'Pending') review.status = 'In Progress';
    return { success: true, savedAt: new Date().toISOString() };
  }

  saveDraft(reviewId: string) {
    return { success: true, savedAt: new Date().toISOString() };
  }

  async getCoaching(tenantId: string, reviewId: string) {
    await this.getReview(tenantId, reviewId);
    const draft = this.drafts.get(`${reviewId}_coaching`);
    return (
      draft || {
        strengths: [],
        improvements: [],
        coachingNotes: '',
        recommendedActions: [],
        internalNotes: '',
        tags: [],
        shareWithRep: true,
      }
    );
  }

  async saveCoaching(tenantId: string, reviewId: string, body: unknown) {
    const dto = CoachingBodySchema.parse(body);
    this.drafts.set(`${reviewId}_coaching`, dto);
    return { success: true, savedAt: new Date().toISOString() };
  }

  async getSummary(tenantId: string, reviewId: string) {
    const review = await this.getReview(tenantId, reviewId);
    const draft = this.drafts.get(reviewId);
    const answered = draft?.answeredCount ?? 8;
    return {
      isReadyForSubmission: answered >= 8,
      overallScore: 88,
      overallTotal: 100,
      overallPercent: 88,
      passingStatus: 'Passing',
      passThreshold: 75,
      scorecardName: review.scorecardName,
      scorecardVersion: review.scorecardVersion,
      repName: review.salesRep,
      sectionScores: [
        { sectionName: 'Opening', scored: 18, total: 20, percent: 90 },
        { sectionName: 'Discovery', scored: 35, total: 40, percent: 88 },
        { sectionName: 'Product Fit', scored: 18, total: 20, percent: 90 },
        { sectionName: 'Objection Handling', scored: 17, total: 20, percent: 85 },
      ],
      aiAnalysis: { accepted: 6, modified: 2, rejected: 1 },
    };
  }

  async submitReview(tenantId: string, reviewId: string) {
    const review = await this.getReview(tenantId, reviewId);
    const coaching = this.drafts.get(`${reviewId}_coaching`);
    review.status = 'Completed';
    return {
      success: true,
      reviewId,
      submittedAt: new Date().toISOString(),
      finalScore: 88,
      finalPercent: 88,
      visibility: coaching?.shareWithRep ? 'Shared with Rep' : 'Not Shared',
    };
  }

  getSubmitted(reviewId: string) {
    return {
      callTitle: 'Discovery Call - Acme Corp Q2 Initiative',
      salesRep: 'Sarah Chen',
      finalScore: 88,
      finalTotal: 100,
      finalPercent: 88,
      passingStatus: 'Passing',
      submittedAt: new Date().toISOString(),
      visibility: 'Shared with Rep',
    };
  }

  getSubmittedView(tenantId: string, reviewId: string) {
    return {
      ...this.getSubmitted(reviewId),
      reviewerName: 'Alex Martinez',
      scorecardName: 'Discovery Call Scorecard',
      scorecardVersion: 'v2.3',
      aiAnalysis: { accepted: 6, modified: 2, rejected: 1 },
      sections: [
        { sectionName: 'Opening', scored: 18, total: 20, percent: 90 },
        { sectionName: 'Discovery', scored: 35, total: 40, percent: 88 },
      ],
      coaching: this.drafts.get(`${reviewId}_coaching`) || {},
      auditTrail: [
        { event: 'Review Created', user: 'System', at: new Date().toISOString() },
        { event: 'Review Submitted', user: 'Alex Martinez', at: new Date().toISOString() },
      ],
    };
  }

  exportReview(reviewId: string) {
    return {
      downloadUrl: `/api/call-reviews/${reviewId}/export/download`,
      fileName: `${reviewId}-review.pdf`,
    };
  }

  cloneReview(reviewId: string) {
    return { newReviewId: `rv_clone_${reviewId}`, redirectUrl: `/calls/reviews/rv_clone_${reviewId}` };
  }

  getAnalyticsSummary() {
    return {
      repAverageScore: 82,
      repAverageTrend: '+4%',
      teamAverageScore: 78,
      completionRate: 91,
      totalReviews: 24,
    };
  }

  getScoreTrend() {
    return {
      data: [
        { week: 'Apr 1', score: 74 },
        { week: 'Apr 8', score: 78 },
        { week: 'Apr 15', score: 80 },
        { week: 'Apr 22', score: 79 },
        { week: 'Apr 29', score: 82 },
        { week: 'May 6', score: 85 },
        { week: 'May 13', score: 88 },
      ],
    };
  }

  getFocusAreas() {
    return {
      areas: [
        { sectionName: 'Objection Handling', percent: 68 },
        { sectionName: 'Discovery — Decision Process', percent: 72 },
        { sectionName: 'Next Steps Clarity', percent: 75 },
      ],
    };
  }

  getCommonTags() {
    return {
      tags: [
        { label: 'Needs Coaching', count: 12 },
        { label: 'Best Practice', count: 8 },
        { label: 'Good Rapport', count: 6 },
      ],
    };
  }

  getReviewHistory(raw: Record<string, string>) {
    AnalyticsHistoryQuerySchema.parse(raw);
    return {
      totalCount: 3,
      reviews: [
        {
          reviewId: 'rv_001',
          callTitle: 'Discovery Call - Acme Corp Q2',
          reviewerName: 'Alex Martinez',
          reviewedAt: new Date().toISOString(),
          tags: ['Best Practice', 'Strong Discovery'],
          score: 88,
        },
      ],
    };
  }
}
