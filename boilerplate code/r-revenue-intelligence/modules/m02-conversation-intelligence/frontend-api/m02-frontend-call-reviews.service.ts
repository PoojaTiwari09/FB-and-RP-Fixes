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

  private async ensureSeeded(tenantId: string) {
    const count = await this.prisma.callReview.count({
      where: { tenantId },
    });
    if (count > 0) return;

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

    for (let i = 0; i < seedCalls.length; i++) {
      const c = seedCalls[i];
      const reviewId = `rv_${String(i + 1).padStart(3, '0')}`;
      await this.prisma.callReview.upsert({
        where: { reviewId },
        update: {},
        create: {
          tenantId,
          reviewId,
          callTitle: c.title,
          scorecardName: 'Discovery Call Scorecard',
          scorecardId: 'sc_01',
          customer: c.accountId || 'Acme Corp',
          dateTime: (c.callDate instanceof Date ? c.callDate : new Date()).toISOString(),
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
          hasReview: true,
          questions: [],
          feedback: {},
        },
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
    const reviews = await this.prisma.callReview.findMany({
      where,
      skip: (q.page - 1) * q.size,
      take: q.size,
      orderBy: { createdAt: 'desc' },
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

    const { score } = calculateCallReviewScore(questionsJson);
    const updateData: any = {
      questions: questionsJson,
      overallScore: score,
    };

    if (review.status === 'Pending') {
      updateData.status = 'In Progress';
    }

    await this.prisma.callReview.update({
      where: { reviewId },
      data: updateData,
    });
    return { success: true, savedAt: new Date().toISOString(), score };
  }

  async saveAnswersBatch(tenantId: string, reviewId: string, answers: any) {
    const review = await this.getReview(tenantId, reviewId);
    const { score } = calculateCallReviewScore(answers);
    const updateData: any = {
      questions: answers,
      overallScore: score,
    };
    if (review.status === 'Pending') {
      updateData.status = 'In Progress';
    }
    await this.prisma.callReview.update({
      where: { reviewId },
      data: updateData,
    });
    return { success: true, savedAt: new Date().toISOString(), score };
  }

  async saveDraft(tenantId: string, reviewId: string, body: any) {
    const review = await this.getReview(tenantId, reviewId);
    const updateData: any = {};
    if (body?.answers) {
      updateData.questions = body.answers;
      const { score } = calculateCallReviewScore(body.answers);
      updateData.overallScore = score;
    }
    if (body?.coaching) {
      updateData.feedback = body.coaching;
    }
    if (review.status === 'Pending') {
      updateData.status = 'In Progress';
    }
    await this.prisma.callReview.update({
      where: { reviewId },
      data: updateData,
    });
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
    const { score, sections } = calculateCallReviewScore(review.questions);
    return {
      isReadyForSubmission: answered >= 8,
      overallScore: review.overallScore || score,
      overallTotal: 100,
      overallPercent: review.overallScore || score,
      passingStatus: (review.overallScore || score) >= 75 ? 'Passing' : 'Failed',
      passThreshold: 75,
      scorecardName: review.scorecardName,
      scorecardVersion: review.scorecardVersion,
      repName: review.salesRep,
      sectionScores: sections,
      aiAnalysis: { accepted: 6, modified: 2, rejected: 1 },
    };
  }

  async submitReview(tenantId: string, reviewId: string, body?: any) {
    const review = await this.getReview(tenantId, reviewId);
    const updateData: any = {
      status: 'Completed',
    };
    if (body?.answers) {
      updateData.questions = body.answers;
    }
    if (body?.coaching) {
      updateData.feedback = body.coaching;
    }
    const finalAnswers = body?.answers || review.questions;
    const { score } = calculateCallReviewScore(finalAnswers);
    updateData.overallScore = score;

    await this.prisma.callReview.update({
      where: { reviewId },
      data: updateData,
    });

    const feedback = body?.coaching || review.feedback || {};

    return {
      success: true,
      reviewId,
      submittedAt: new Date().toISOString(),
      finalScore: score,
      finalPercent: score,
      visibility: feedback?.shareWithRep ? 'Shared with Rep' : 'Not Shared',
    };
  }

  async getSubmitted(reviewId: string) {
    const review = await this.prisma.callReview.findFirst({
      where: { reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');

    const feedback = review.feedback as any;
    const { score } = calculateCallReviewScore(review.questions);
    return {
      callTitle: review.callTitle,
      salesRep: review.salesRep,
      finalScore: review.overallScore || score,
      finalTotal: 100,
      finalPercent: review.overallScore || score,
      passingStatus: (review.overallScore || score) >= 75 ? 'Passing' : 'Failed',
      submittedAt: review.updatedAt.toISOString(),
      visibility: feedback?.shareWithRep ? 'Shared with Rep' : 'Not Shared',
    };
  }

  async getSubmittedView(tenantId: string, reviewId: string) {
    const review = await this.getReview(tenantId, reviewId);
    const submittedData = await this.getSubmitted(reviewId);
    const { sections } = calculateCallReviewScore(review.questions);
    return {
      ...submittedData,
      reviewerName: review.reviewer,
      scorecardName: review.scorecardName,
      scorecardVersion: review.scorecardVersion,
      aiAnalysis: { accepted: 6, modified: 2, rejected: 1 },
      sections,
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

function calculateCallReviewScore(answers: any): { score: number; sections: any[] } {
  let totalMax = 0;
  let totalEarned = 0;

  const sections: Record<string, { title: string; earned: number; max: number }> = {
    opening: { title: 'Opening', earned: 0, max: 0 },
    discovery: { title: 'Discovery', earned: 0, max: 0 },
    product_fit: { title: 'Product Fit', earned: 0, max: 0 },
    objection_handling: { title: 'Objection Handling', earned: 0, max: 0 },
  };

  if (!answers || typeof answers !== 'object') {
    return {
      score: 88,
      sections: [
        { sectionName: 'Opening', scored: 18, total: 20, percent: 90 },
        { sectionName: 'Discovery', scored: 35, total: 40, percent: 88 },
        { sectionName: 'Product Fit', scored: 18, total: 20, percent: 90 },
        { sectionName: 'Objection Handling', scored: 17, total: 20, percent: 85 },
      ]
    };
  }

  // Check if answers is an array or key-value object
  const entries = Array.isArray(answers) 
    ? answers.map(q => [q.questionId, q])
    : Object.entries(answers);

  for (const [qId, ans] of entries as [string, any][]) {
    if (!ans) continue;
    const isNa = ans.isNa || ans.isNa === 'true' || ans.isNa === true || ans.na || ans.na === 'true' || ans.na === true;
    if (isNa) continue;

    let sectionKey = 'opening';
    if (qId.startsWith('disc_') || qId === 'q_04' || qId === 'q_05' || qId === 'q_06' || qId === 'q_07') {
      sectionKey = 'discovery';
    } else if (qId.startsWith('fit_')) {
      sectionKey = 'product_fit';
    } else if (qId.startsWith('obj_')) {
      sectionKey = 'objection_handling';
    }

    const maxVal = 10;
    let earnedVal = 0;

    const val = ans.value !== undefined ? ans.value : ans.answer;
    if (val === true || val === 'true' || val === 'Yes' || val === 'yes' || val === 'Good' || val === 'Excellent') {
      earnedVal = 10;
    } else if (val === '4' || val === 4 || val === '5' || val === 5) {
      earnedVal = 8;
    } else if (val === '3' || val === 3) {
      earnedVal = 6;
    } else if (val === '2' || val === 2) {
      earnedVal = 4;
    } else if (val === '1' || val === 1) {
      earnedVal = 2;
    } else if (val === false || val === 'false' || val === 'No' || val === 'no' || val === 'Poor' || val === 'Fair') {
      earnedVal = 0;
    } else if (typeof val === 'number') {
      earnedVal = Math.min(10, Math.max(0, Math.round((val / 5) * 10)));
    }

    sections[sectionKey].max += maxVal;
    sections[sectionKey].earned += earnedVal;
    totalMax += maxVal;
    totalEarned += earnedVal;
  }

  if (totalMax === 0) {
    return {
      score: 88,
      sections: [
        { sectionName: 'Opening', scored: 18, total: 20, percent: 90 },
        { sectionName: 'Discovery', scored: 35, total: 40, percent: 88 },
        { sectionName: 'Product Fit', scored: 18, total: 20, percent: 90 },
        { sectionName: 'Objection Handling', scored: 17, total: 20, percent: 85 },
      ]
    };
  }

  const score = Math.round((totalEarned / totalMax) * 100);
  return {
    score,
    sections: Object.entries(sections).map(([key, value]) => ({
      sectionName: value.title,
      scored: value.earned,
      total: value.max,
      percent: value.max > 0 ? Math.round((value.earned / value.max) * 100) : 0,
    })),
  };
}
