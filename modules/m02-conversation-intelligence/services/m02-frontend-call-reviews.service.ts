import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { M02ConversationIntelligenceService } from '../services/m02.service';
import {
  AnalyticsHistoryQuerySchema,
  CallReviewsListQuerySchema,
  CoachingBodySchema,
  PatchReviewSchema,
  SaveAnswerSchema,
} from '../schemas/m02-frontend-call-reviews.schema';
import {
  formatMmSs,
  mapReviewDetail,
  mapReviewListItem,
  scorecardSectionsTemplate,
} from '../schemas/m02-frontend-call-reviews.mapper';

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

  private async ensureSeeded(tenantId: string, userId?: string) {
    const count = await this.prisma.callReview.count({
      where: { tenantid: tenantId },
    });
    if (count > 0) return;

    // Fetch actual user names for seeding if possible
    const dbUsers = await this.prisma.user.findMany({
      where: { tenantid: tenantId },
      take: 5
    });

    const calls = await this.prisma.callRecord.findMany({
      where: { tenantid: tenantId },
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
            callOwner: userId || 'usr_sarah_123',
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
      const repId = c.callOwner || (dbUsers[i % dbUsers.length]?.id) || 'usr_sarah_123';
      const repName = (dbUsers.find(u => u.id === repId)?.name) || 'Sarah Chen';

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
          salesRep: repId,
          reviewer: 'usr_manager_001',
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

  private async getReview(tenantId: string, reviewId: string, userId?: string, userRole?: string) {
    await this.ensureSeeded(tenantId, userId);
    const where: any = { tenantid: tenantId, reviewId };
    
    // Data Isolation: Sales Reps can only see their own reviews
    if (userRole === 'sales_rep' && userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        where.OR = [
          { salesRep: userId },
          { salesRep: user.name },
        ];
      } else {
        where.salesRep = userId;
      }
    }

    const review = await this.prisma.callReview.findFirst({
      where,
    });
    if (!review) throw new NotFoundException('Review not found or access denied');
    return review;
  }

  private async getCallForReview(tenantId: string, callId: string) {
    if (!callId) return null;
    return this.prisma.callRecord.findFirst({
      where: { id: callId, tenantid: tenantId },
      include: { transcript: { include: { utterances: { orderBy: { sequenceIndex: 'asc' } } } } },
    });
  }

  async listReviews(tenantId: string, raw: Record<string, string>, userId?: string, userRole?: string) {
    const q = CallReviewsListQuerySchema.parse(raw);
    await this.ensureSeeded(tenantId, userId);

    const where: any = { tenantid: tenantId };
    
    // Data Isolation: Filter by Sales Rep if applicable
    if (userRole === 'sales_rep' && userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        where.OR = [
          { salesRep: userId },
          { salesRep: user.name },
        ];
      } else {
        where.salesRep = userId;
      }
    }

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

  async getReviewDetail(tenantId: string, reviewId: string, userId?: string, userRole?: string) {
    const review = await this.getReview(tenantId, reviewId, userId, userRole);
    // Try to find a call record linked to this review
    const call = await this.prisma.callRecord.findFirst({
      where: { title: review.callTitle, tenantid: tenantId },
      include: { transcript: { include: { utterances: { orderBy: { sequenceIndex: 'asc' } } } } },
    });
    return mapReviewDetail(review, call);
  }

  getScorecards() {
    return { scorecards: SCORECARDS };
  }

  async getUsers(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantid: tenantId },
      select: { id: true, name: true }
    });
    return { 
      users: users.map(u => ({ userId: u.id, userName: u.name }))
    };
  }

  getCoachingTags() {
    return { tags: COACHING_TAGS };
  }

  async patchReview(tenantId: string, reviewId: string, body: unknown, userId?: string, userRole?: string) {
    const dto = PatchReviewSchema.parse(body);
    const review = await this.getReview(tenantId, reviewId, userId, userRole);
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

  async markNa(tenantId: string, reviewId: string, userId?: string, userRole?: string) {
    await this.getReview(tenantId, reviewId, userId, userRole);
    await this.prisma.callReview.update({
      where: { reviewId },
      data: { status: 'Not Applicable' },
    });
    return { success: true, status: 'Not Applicable', reviewId };
  }

  async getScorecardForm(tenantId: string, reviewId: string, userId?: string, userRole?: string) {
    const review = await this.getReview(tenantId, reviewId, userId, userRole);
    const questionsJson = review.questions as any;
    const answeredCount = Array.isArray(questionsJson) ? questionsJson.length : 0;
    const sections = scorecardSectionsTemplate();
    if (Array.isArray(questionsJson)) {
      sections.forEach(sec => {
        sec.questions.forEach(q => {
          const ans = questionsJson.find(a => a.questionId === q.questionId);
          if (ans) {
            (q as any).existingAnswer = ans.value !== undefined ? ans.value : ans.answer;
            (q as any).existingComment = ans.comment || '';
          }
        });
      });
    }
    const totalQuestions = sections.reduce((sum, sec) => sum + sec.questions.length, 0);
    return {
      totalQuestions,
      answeredCount,
      sections,
    };
  }

  async getTranscript(tenantId: string, reviewId: string, userId?: string, userRole?: string) {
    const review = await this.getReview(tenantId, reviewId, userId, userRole);
    const call = await this.prisma.callRecord.findFirst({
      where: { title: review.callTitle, tenantid: tenantId },
      include: { transcript: { include: { utterances: { orderBy: { sequenceIndex: 'asc' } } } } },
    });
    const entries = (call?.transcript?.utterances ?? []).map((u) => ({
      timestamp: formatMmSs(Math.floor((u.startMs ?? 0) / 1000)),
      speaker: u.speaker,
      text: u.text,
    }));
    
    return { entries };
  }

  async getAiInsights(tenantId: string, reviewId: string, userId?: string, userRole?: string) {
    const review = await this.getReview(tenantId, reviewId, userId, userRole);
    const call = await this.prisma.callRecord.findFirst({
      where: { title: review.callTitle, tenantid: tenantId },
      include: { transcript: true },
    });

    const insights = [];

    // 1. Summary
    const summary = call?.transcript?.summary || review.aiSummary;
    if (summary) {
      insights.push({ type: 'info', title: 'Call Summary', description: summary });
    }

    // 2. Highlights
    const highlights = call?.transcript?.keyHighlights || review.keyHighlights || [];
    if (Array.isArray(highlights)) {
      highlights.forEach((h: any) => {
        insights.push({ type: 'positive', title: 'Key Highlight', description: h.text || h.description || String(h) });
      });
    }

    // 3. Talk Ratio
    const ratio = call?.transcript?.talkRatio || review.talkRatio;
    if (ratio && typeof ratio === 'object') {
      const rep = (ratio as any).rep || (ratio as any).salesRep || 0;
      const cust = (ratio as any).customer || 0;
      insights.push({ type: 'info', title: 'Talk Ratio', description: `Rep: ${rep}%, Customer: ${cust}%` });
    }

    // Fallback if empty
    if (insights.length === 0) {
      insights.push({ type: 'warning', title: 'Processing', description: 'AI insights are currently being generated or no data is available.' });
    }

    return { insights };
  }

  async saveAnswer(tenantId: string, reviewId: string, body: unknown, userId?: string, userRole?: string) {
    const dto = SaveAnswerSchema.parse(body);
    const review = await this.getReview(tenantId, reviewId, userId, userRole);
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

    const sections = scorecardSectionsTemplate();
    const totalRequired = sections.reduce((sum, sec) => sum + sec.questions.filter(q => q.required).length, 0);
    const answeredCount = questionsJson.length;

    return { success: true, savedAt: new Date().toISOString(), score, answeredCount, totalRequired };
  }

  async saveAnswersBatch(tenantId: string, reviewId: string, answers: any, userId?: string, userRole?: string) {
    const review = await this.getReview(tenantId, reviewId, userId, userRole);
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

  async saveDraft(tenantId: string, reviewId: string, body: any, userId?: string, userRole?: string) {
    const review = await this.getReview(tenantId, reviewId, userId, userRole);
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

    const answeredCount = Array.isArray(updateData.questions) ? updateData.questions.length : (Array.isArray(review.questions) ? review.questions.length : 0);

    const sections = scorecardSectionsTemplate();
    const totalQuestions = sections.reduce((sum, sec) => sum + sec.questions.length, 0);
    return { success: true, savedAt: new Date().toISOString(), answeredCount, totalQuestions };
  }

  async getCoaching(tenantId: string, reviewId: string, userId?: string, userRole?: string) {
    const review = await this.getReview(tenantId, reviewId, userId, userRole);
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

  async saveCoaching(tenantId: string, reviewId: string, body: unknown, userId?: string, userRole?: string) {
    const dto = CoachingBodySchema.parse(body);
    await this.getReview(tenantId, reviewId, userId, userRole);
    await this.prisma.callReview.update({
      where: { reviewId },
      data: {
        feedback: dto as any,
      },
    });
    return { success: true, savedAt: new Date().toISOString() };
  }

  async getSummary(tenantId: string, reviewId: string, userId?: string, userRole?: string) {
    const review = await this.getReview(tenantId, reviewId, userId, userRole);
    const questionsJson = review.questions as any;
    const answered = Array.isArray(questionsJson) ? questionsJson.length : 0;
    const { score, sections } = calculateCallReviewScore(review.questions);
    const feedback = review.feedback as any;
    const templateSections = scorecardSectionsTemplate();
    const totalRequired = templateSections.reduce((sum, sec) => sum + sec.questions.filter(q => q.required).length, 0);
    return {
      isReadyForSubmission: answered >= totalRequired,
      overallScore: review.overallScore || score,
      overallTotal: 100,
      overallPercent: review.overallScore || score,
      passingStatus: (review.overallScore || score) >= 75 ? 'Passing' : 'Failed',
      passThreshold: 75,
      scorecardName: review.scorecardName,
      scorecardVersion: review.scorecardVersion,
      repName: review.salesRep,
      sectionScores: sections,
      aiAnalysis: (review.quickStats as any)?.aiAnalysis || { accepted: 0, modified: 0, rejected: 0 },
      coachingPreview: {
        strengths: feedback?.strengths || [],
        improvements: feedback?.improvements || [],
        coachingNotes: feedback?.coachingNotes || '',
        recommendedActions: feedback?.recommendedActions || [],
      },
    };
  }

  async submitReview(tenantId: string, reviewId: string, body?: any, userId?: string, userRole?: string) {
    const review = await this.getReview(tenantId, reviewId, userId, userRole);
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

  async getSubmitted(reviewId: string, userId?: string, userRole?: string) {
    const where: any = { reviewId };
    if (userRole === 'sales_rep' && userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        where.OR = [
          { salesRep: userId },
          { salesRep: user.name },
        ];
      } else {
        where.salesRep = userId;
      }
    }
    const review = await this.prisma.callReview.findFirst({
      where,
    });
    if (!review) throw new NotFoundException('Review not found or access denied');

    const feedback = review.feedback as any;
    const { score } = calculateCallReviewScore(review.questions);
    return {
      callTitle: review.callTitle,
      salesRep: review.salesRep,
      submittedBy: review.reviewer,
      finalScore: review.overallScore || score,
      finalTotal: 100,
      finalPercent: review.overallScore || score,
      passingStatus: (review.overallScore || score) >= 75 ? 'Passing' : 'Failed',
      submittedAt: review.updatedAt.toISOString(),
      visibility: feedback?.shareWithRep ? 'Shared with Rep' : 'Not Shared',
    };
  }

  async getSubmittedView(tenantId: string, reviewId: string, userId?: string, userRole?: string) {
    const review = await this.getReview(tenantId, reviewId, userId, userRole);
    const submittedData = await this.getSubmitted(reviewId, userId, userRole);
    const { sections } = calculateCallReviewScore(review.questions);
    return {
      callDetails: {
        callTitle: review.callTitle,
        salesRep: review.salesRep,
        customer: review.customer,
        duration: review.duration,
        dateTime: review.dateTime || review.callDate,
      },
      reviewInfo: {
        reviewerName: review.reviewer,
        scorecardName: review.scorecardName,
        scorecardVersion: review.scorecardVersion,
        submittedAt: review.updatedAt.toISOString(),
        finalScore: submittedData.finalScore,
        passingStatus: submittedData.passingStatus,
      },
      aiAnalysis: (review.quickStats as any)?.aiAnalysis || { accepted: 0, modified: 0, rejected: 0 },
      sections,
      coaching: review.feedback || {},
      auditTrail: [
        { event: 'Review Created', user: 'System', at: review.createdAt.toISOString() },
        { event: 'Review Submitted', user: review.reviewer || 'System', at: review.updatedAt.toISOString() },
      ],
    };
  }

  exportReview(reviewId: string) {
    return {
      downloadUrl: `/api/v1/conversation-intelligence/call-reviews/${reviewId}/export/download`,
      fileName: `${reviewId}-review.pdf`,
    };
  }

  async cloneReview(tenantId: string, reviewId: string, targetCallId?: string) {
    const existing = await this.prisma.callReview.findFirst({ where: { reviewId, tenantid: tenantId } });
    if (!existing) throw new Error('Review not found');
    const newId = `rv_${Math.random().toString(36).substr(2, 9)}`;
    await this.prisma.callReview.create({
      data: {
        ...existing,
        id: undefined,
        reviewId: newId,
        status: 'Pending',
        overallScore: null,
        updatedAt: undefined,
        createdAt: undefined,
      } as any
    });
    return { newReviewId: newId, redirectUrl: `/calls/reviews/${newId}`, targetCallId };
  }

  async shareReview(tenantId: string, reviewId: string, body: any, userId?: string, userRole?: string) {
    await this.getReview(tenantId, reviewId, userId, userRole);
    return { success: true, sharedWith: body.recipientEmails || [] };
  }

  async reopenReview(tenantId: string, reviewId: string, userId?: string, userRole?: string) {
    await this.getReview(tenantId, reviewId, userId, userRole);
    await this.prisma.callReview.update({
      where: { reviewId },
      data: { status: 'In Progress' },
    });
    return { success: true, newStatus: 'In Progress', redirectUrl: `/calls/reviews/${reviewId}/edit` };
  }

  async getAnalyticsSummary(tenantId: string, userId?: string, userRole?: string) {
    const tenantWhere = { tenantid: tenantId };
    const where: any = {};
    if (userRole === 'sales_rep' && userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        where.OR = [
          { salesRep: userId },
          { salesRep: user.name },
        ];
      } else {
        where.salesRep = userId;
      }
    }

    where.tenantid = tenantId;
    const reviews = await this.prisma.callReview.findMany({ where });
    const totalReviews = reviews.length;
    const completedReviews = reviews.filter(r => r.status === 'Completed');
    
    let avgScore = 0;
    if (completedReviews.length > 0) {
      avgScore = Math.round(completedReviews.reduce((sum, r) => sum + (r.overallScore || 0), 0) / completedReviews.length);
    }

    return {
      repAverageScore: avgScore,
      repAverageTrend: '+2%', // Mock trend for now
      teamAverageScore: 78,
      teamComparison: 'above_average',
      completionRate: totalReviews > 0 ? Math.round((completedReviews.length / totalReviews) * 100) : 0,
      totalReviews: totalReviews,
    };
  }

  async getScoreTrend(tenantId: string, userId?: string, userRole?: string) {
    const where: any = { tenantid: tenantId, status: 'Completed' };
    if (userRole === 'sales_rep' && userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      where.OR = user ? [{ salesRep: userId }, { salesRep: user.name }] : [{ salesRep: userId }];
    }
    const reviews = await this.prisma.callReview.findMany({ where, orderBy: { updatedAt: 'asc' } });
    const grouped: Record<string, { total: number; count: number }> = {};
    reviews.forEach(r => {
      const dateKey = r.updatedAt.toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = { total: 0, count: 0 };
      grouped[dateKey].total += (r.overallScore || 0);
      grouped[dateKey].count += 1;
    });
    const data = Object.keys(grouped).slice(-7).map(date => ({
      week: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: Math.round(grouped[date].total / grouped[date].count),
    }));
    if (data.length === 0) {
      data.push({ week: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 0 });
    }
    return { data };
  }

  async focusAreas(tenantId: string, userId?: string, userRole?: string) {
    const where: any = { tenantid: tenantId, status: 'Completed' };
    if (userRole === 'sales_rep' && userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      where.OR = user ? [{ salesRep: userId }, { salesRep: user.name }] : [{ salesRep: userId }];
    }
    const reviews = await this.prisma.callReview.findMany({ where });
    const sectionTotals: Record<string, { earned: number; max: number }> = {};
    reviews.forEach(r => {
      const { sections } = calculateCallReviewScore(r.questions);
      sections.forEach(sec => {
        if (!sectionTotals[sec.sectionName]) sectionTotals[sec.sectionName] = { earned: 0, max: 0 };
        sectionTotals[sec.sectionName].earned += sec.scored;
        sectionTotals[sec.sectionName].max += sec.total;
      });
    });
    const areas = Object.keys(sectionTotals)
      .map(name => ({
        sectionName: name,
        percent: sectionTotals[name].max > 0 ? Math.round((sectionTotals[name].earned / sectionTotals[name].max) * 100) : 0
      }))
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 3);
    return { areas };
  }

  async getCommonTags(tenantId: string) {
    const reviews = await this.prisma.callReview.findMany({ where: { tenantid: tenantId } });
    const tagCounts: Record<string, number> = {};
    reviews.forEach(r => {
      if (r.aiFlags && Array.isArray(r.aiFlags)) {
        r.aiFlags.forEach(tag => {
          tagCounts[tag as string] = (tagCounts[tag as string] || 0) + 1;
        });
      }
    });
    const tags = Object.entries(tagCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { tags };
  }

  async getReviewHistory(tenantId: string, raw: Record<string, string>, userId?: string, userRole?: string) {
    const q = AnalyticsHistoryQuerySchema.parse(raw);
    
    const where: any = { tenantid: tenantId, status: 'Submitted' };
    
    // Search
    if (q.search) {
      where.callTitle = { contains: q.search, mode: 'insensitive' };
    }

    const reviews = await this.prisma.callReview.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    const totalCount = await this.prisma.callReview.count({ where });

    return {
      totalCount,
      reviews: reviews.map((r) => ({
        reviewId: r.reviewId,
        callTitle: r.callTitle,
        reviewerName: r.reviewer || 'System',
        reviewedAt: r.updatedAt ? r.updatedAt.toISOString() : r.createdAt.toISOString(),
        tags: r.aiFlags || [],
        score: r.overallScore || 0,
      })),
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

  if (!answers || typeof answers !== 'object' || (Array.isArray(answers) && answers.length === 0)) {
    return { score: 0, sections: [] };
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
    return { score: 0, sections: [] };
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
