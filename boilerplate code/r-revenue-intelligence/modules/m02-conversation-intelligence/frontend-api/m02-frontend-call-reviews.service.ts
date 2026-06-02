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
  constructor(
    private readonly prisma: PrismaService,
    private readonly m02: M02ConversationIntelligenceService,
  ) {}

  private buildReviewSeed(tenantId: string, c: any, index: number) {
    const callTypes = ['Discovery', 'Demo', 'Negotiation', 'Training'];
    const statuses = ['Pending', 'In Progress', 'Completed', 'Completed'];
    const priorities = ['High', 'Medium', 'High', 'Medium'];
    return {
      tenantId,
      reviewId: `rv_${String(index + 1).padStart(3, '0')}`,
      callTitle: c.title,
      scorecardName:
        index === 2 ? 'Negotiation Scorecard' : index === 3 ? 'Demo Call Scorecard' : 'Discovery Call Scorecard',
      scorecardId: index === 2 ? 'sc_03' : index === 1 ? 'sc_02' : 'sc_01',
      customer: c.accountId || 'Unknown Account',
      dateTime: (c.callDate instanceof Date ? c.callDate : new Date(c.callDate ?? Date.now())).toISOString(),
      callType: callTypes[index] ?? c.callType ?? 'Discovery',
      duration: formatMmSs(c.durationSeconds ?? 1800),
      priority: priorities[index] ?? 'Medium',
      status: statuses[index] ?? 'Pending',
      aiFlags: index === 0 ? ['High Risk Deal', 'No Next Steps'] : ['Good Rapport'],
      dueDate: new Date(Date.now() + (7 - index) * 86400000).toISOString(),
      salesRep: c.callOwner || 'Rep',
      reviewer: 'Alex Martinez',
      reviewMode: 'AI-Assisted',
      scorecardVersion: 'v2.3',
      talkRatio: { rep: 45, customer: 55 },
      sentimentSummary: 'Positive with budget caution',
      sentimentScore: 65 + index * 3,
      risksDetected: index === 2 ? ['Contract timeline', 'Budget negotiation'] : ['Budget timeline unclear'],
      keyHighlights: ['Customer asked about integration', 'Competitor mentioned'],
      aiSummary: c.transcript?.summary || 'AI summary pending.',
      quickStats: { topics: 4, actionItems: 3 },
      dealLinked: `${c.accountId || 'Account'} — Q2 Initiative`,
      hasReview: true,
      questions: [],
      feedback: {},
    };
  }

  private async ensureSeeded(tenantId: string) {
    const DEMO_CALL_IDS = [
      '11111111-1111-1111-1111-000000000001',
      '11111111-1111-1111-1111-000000000002',
      '11111111-1111-1111-1111-000000000003',
      '11111111-1111-1111-1111-000000000004',
    ];

    const calls = await this.prisma.callRecord.findMany({
      where: { tenantId, id: { in: DEMO_CALL_IDS }, transcriptStatus: 'completed' },
      orderBy: { id: 'asc' },
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

    for (let i = 0; i < seedCalls.length; i++) {
      const c = seedCalls[i];
      const payload = this.buildReviewSeed(tenantId, c, i);
      await this.prisma.callReview.upsert({
        where: { reviewId: payload.reviewId },
        update: {
          callTitle: payload.callTitle,
          customer: payload.customer,
          dateTime: payload.dateTime,
          salesRep: payload.salesRep,
          duration: payload.duration,
          aiSummary: payload.aiSummary,
          callType: payload.callType,
          priority: payload.priority,
        },
        create: payload,
      });
    }
  }

  private async getReview(tenantId: string, reviewId: string) {
    await this.ensureSeeded(tenantId);
    const review = await this.prisma.callReview.findFirst({
      where: { tenantId, reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  private async getCallForReview(tenantId: string, callId: string) {
    if (!callId) return null;
    return this.prisma.callRecord.findFirst({
      where: { id: callId, tenantId },
      include: { transcript: { include: { utterances: { orderBy: { sequenceIndex: 'asc' } } } } },
    });
  }

  async listReviews(tenantId: string, raw: Record<string, string>) {
    const q = CallReviewsListQuerySchema.parse(raw);
    await this.ensureSeeded(tenantId);

    const where: any = { tenantId };
    if (q.search) {
      const needle = q.search;
      where.OR = [
        { callTitle: { contains: needle, mode: 'insensitive' } },
        { customer: { contains: needle, mode: 'insensitive' } },
        { salesRep: { contains: needle, mode: 'insensitive' } },
      ];
    }
    if (q.status && !/^all\b/i.test(q.status)) {
      where.status = q.status;
    }
    if (q.priority && !/^all\b/i.test(q.priority)) {
      where.priority = q.priority;
    }
    if (q.callType && !/^all\b/i.test(q.callType)) {
      where.callType = q.callType;
    }

    const totalCount = await this.prisma.callReview.count({ where });
    const orderBy =
      q.sort === 'oldest'
        ? { createdAt: 'asc' as const }
        : q.sort === 'dueDate'
          ? { dueDate: 'asc' as const }
          : { createdAt: 'desc' as const };
    const reviews = await this.prisma.callReview.findMany({
      where,
      skip: (q.page - 1) * q.size,
      take: q.size,
      orderBy,
    });

    return {
      totalCount,
      data: reviews.map(mapReviewListItem),
    };
  }

  async getReviewDetail(tenantId: string, reviewId: string) {
    const review = await this.getReview(tenantId, reviewId);
    // Try to find a call record linked to this review
    const call = await this.prisma.callRecord.findFirst({
      where: { title: review.callTitle, tenantId },
      include: { transcript: { include: { utterances: { orderBy: { sequenceIndex: 'asc' } } } } },
    });
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
    const data: any = {};
    const updated: string[] = [];

    if (dto.scorecardId) {
      data.scorecardId = dto.scorecardId;
      const sc = SCORECARDS.find((s) => s.scorecardId === dto.scorecardId);
      if (sc) data.scorecardName = sc.scorecardName;
      updated.push('scorecardId');
    }
    if (dto.reviewerId) {
      const u = USERS.find((x) => x.userId === dto.reviewerId);
      data.reviewer = u?.userName || dto.reviewerId;
      updated.push('reviewerId');
    }

    if (Object.keys(data).length > 0) {
      await this.prisma.callReview.update({
        where: { reviewId },
        data,
      });
    }
    return { success: true, reviewId, updatedFields: updated };
  }

  async markNa(tenantId: string, reviewId: string) {
    await this.getReview(tenantId, reviewId);
    await this.prisma.callReview.update({
      where: { reviewId },
      data: { status: 'Not Applicable' },
    });
    return { success: true, status: 'Not Applicable', reviewId };
  }

  async getScorecardForm(tenantId: string, reviewId: string) {
    const review = await this.getReview(tenantId, reviewId);
    const questionsJson = review.questions as any;
    const answeredCount = Array.isArray(questionsJson) ? questionsJson.length : 0;
    const sections = scorecardSectionsTemplate();
    return {
      totalQuestions: 11,
      answeredCount,
      sections,
    };
  }

  async getTranscript(tenantId: string, reviewId: string) {
    const review = await this.getReview(tenantId, reviewId);
    const call = await this.prisma.callRecord.findFirst({
      where: { title: review.callTitle, tenantId },
      include: { transcript: { include: { utterances: { orderBy: { sequenceIndex: 'asc' } } } } },
    });
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
    const dto = SaveAnswerSchema.parse(body);
    const review = await this.getReview(tenantId, reviewId);
    const questionsJson = Array.isArray(review.questions) ? (review.questions as any[]) : [];

    const existingIndex = questionsJson.findIndex((q) => q.questionId === dto.questionId);
    if (existingIndex > -1) {
      questionsJson[existingIndex] = dto;
    } else {
      questionsJson.push(dto);
    }

    const updateData: any = {
      questions: questionsJson,
    };

    if (review.status === 'Pending') {
      updateData.status = 'In Progress';
    }

    await this.prisma.callReview.update({
      where: { reviewId },
      data: updateData,
    });
    return { success: true, savedAt: new Date().toISOString() };
  }

  saveDraft(reviewId: string) {
    return { success: true, savedAt: new Date().toISOString() };
  }

  async getCoaching(tenantId: string, reviewId: string) {
    const review = await this.getReview(tenantId, reviewId);
    const feedback = review.feedback as any;
    if (feedback && typeof feedback === 'object' && !Array.isArray(feedback) && Object.keys(feedback).length > 0) {
      return feedback;
    }
    return {
      strengths: [],
      improvements: [],
      coachingNotes: '',
      recommendedActions: [],
      internalNotes: '',
      tags: [],
      shareWithRep: true,
    };
  }

  async saveCoaching(tenantId: string, reviewId: string, body: unknown) {
    const dto = CoachingBodySchema.parse(body);
    await this.getReview(tenantId, reviewId);
    await this.prisma.callReview.update({
      where: { reviewId },
      data: {
        feedback: dto as any,
      },
    });
    return { success: true, savedAt: new Date().toISOString() };
  }

  async getSummary(tenantId: string, reviewId: string) {
    const review = await this.getReview(tenantId, reviewId);
    const questionsJson = review.questions as any;
    const answered = Array.isArray(questionsJson) ? questionsJson.length : 0;
    return {
      isReadyForSubmission: answered >= 8,
      overallScore: review.overallScore || 88,
      overallTotal: 100,
      overallPercent: review.overallScore || 88,
      passingStatus: (review.overallScore || 88) >= 75 ? 'Passing' : 'Failed',
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
    const feedback = review.feedback as any;

    await this.prisma.callReview.update({
      where: { reviewId },
      data: {
        status: 'Completed',
        overallScore: 88,
      },
    });

    return {
      success: true,
      reviewId,
      submittedAt: new Date().toISOString(),
      finalScore: 88,
      finalPercent: 88,
      visibility: feedback?.shareWithRep ? 'Shared with Rep' : 'Not Shared',
    };
  }

  async getSubmitted(reviewId: string) {
    const review = await this.prisma.callReview.findFirst({
      where: { reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');

    const feedback = review.feedback as any;
    return {
      callTitle: review.callTitle,
      salesRep: review.salesRep,
      finalScore: review.overallScore || 88,
      finalTotal: 100,
      finalPercent: review.overallScore || 88,
      passingStatus: (review.overallScore || 88) >= 75 ? 'Passing' : 'Failed',
      submittedAt: review.updatedAt.toISOString(),
      visibility: feedback?.shareWithRep ? 'Shared with Rep' : 'Not Shared',
    };
  }

  async getSubmittedView(tenantId: string, reviewId: string) {
    const review = await this.getReview(tenantId, reviewId);
    const submittedData = await this.getSubmitted(reviewId);
    return {
      ...submittedData,
      reviewerName: review.reviewer,
      scorecardName: review.scorecardName,
      scorecardVersion: review.scorecardVersion,
      aiAnalysis: { accepted: 6, modified: 2, rejected: 1 },
      sections: [
        { sectionName: 'Opening', scored: 18, total: 20, percent: 90 },
        { sectionName: 'Discovery', scored: 35, total: 40, percent: 88 },
      ],
      coaching: review.feedback || {},
      auditTrail: [
        { event: 'Review Created', user: 'System', at: review.createdAt.toISOString() },
        { event: 'Review Submitted', user: review.reviewer || 'Alex Martinez', at: review.updatedAt.toISOString() },
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
