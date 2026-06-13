"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M02FrontendCallReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const m02_service_1 = require("../services/m02.service");
const m02_frontend_call_reviews_schema_1 = require("../schemas/m02-frontend-call-reviews.schema");
const m02_frontend_call_reviews_mapper_1 = require("../schemas/m02-frontend-call-reviews.mapper");
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
let M02FrontendCallReviewsService = class M02FrontendCallReviewsService {
    prisma;
    m02;
    constructor(prisma, m02) {
        this.prisma = prisma;
        this.m02 = m02;
    }
    async ensureSeeded(tenantId, userId) {
        const count = await this.prisma.callReview.count({
            where: { tenantid: tenantId },
        });
        if (count > 0)
            return;
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
                    duration: (0, m02_frontend_call_reviews_mapper_1.formatMmSs)(c.durationSeconds ?? 1800),
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
    async getReview(tenantId, reviewId, userId, userRole) {
        await this.ensureSeeded(tenantId, userId);
        const where = { tenantId, reviewId };
        if (userRole === 'sales_rep' && userId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                where.OR = [
                    { salesRep: userId },
                    { salesRep: user.name },
                ];
            }
            else {
                where.salesRep = userId;
            }
        }
        const review = await this.prisma.callReview.findFirst({
            where,
        });
        if (!review)
            throw new common_1.NotFoundException('Review not found or access denied');
        return review;
    }
    async getCallForReview(tenantId, callId) {
        if (!callId)
            return null;
        return this.prisma.callRecord.findFirst({
            where: { id: callId, tenantid: tenantId },
            include: { transcript: { include: { utterances: { orderBy: { sequenceIndex: 'asc' } } } } },
        });
    }
    async listReviews(tenantId, raw, userId, userRole) {
        const q = m02_frontend_call_reviews_schema_1.CallReviewsListQuerySchema.parse(raw);
        await this.ensureSeeded(tenantId, userId);
        const where = { tenantId };
        if (userRole === 'sales_rep' && userId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                where.OR = [
                    { salesRep: userId },
                    { salesRep: user.name },
                ];
            }
            else {
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
            data: reviews.map(m02_frontend_call_reviews_mapper_1.mapReviewListItem),
        };
    }
    async getReviewDetail(tenantId, reviewId, userId, userRole) {
        const review = await this.getReview(tenantId, reviewId, userId, userRole);
        const call = await this.prisma.callRecord.findFirst({
            where: { title: review.callTitle, tenantid: tenantId },
            include: { transcript: { include: { utterances: { orderBy: { sequenceIndex: 'asc' } } } } },
        });
        return (0, m02_frontend_call_reviews_mapper_1.mapReviewDetail)(review, call);
    }
    getScorecards() {
        return { scorecards: SCORECARDS };
    }
    async getUsers(tenantId) {
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
    async patchReview(tenantId, reviewId, body, userId, userRole) {
        const dto = m02_frontend_call_reviews_schema_1.PatchReviewSchema.parse(body);
        const review = await this.getReview(tenantId, reviewId, userId, userRole);
        const data = {};
        const updated = [];
        if (dto.scorecardId) {
            data.scorecardId = dto.scorecardId;
            const sc = SCORECARDS.find((s) => s.scorecardId === dto.scorecardId);
            if (sc)
                data.scorecardName = sc.scorecardName;
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
    async markNa(tenantId, reviewId, userId, userRole) {
        await this.getReview(tenantId, reviewId, userId, userRole);
        await this.prisma.callReview.update({
            where: { reviewId },
            data: { status: 'Not Applicable' },
        });
        return { success: true, status: 'Not Applicable', reviewId };
    }
    async getScorecardForm(tenantId, reviewId, userId, userRole) {
        const review = await this.getReview(tenantId, reviewId, userId, userRole);
        const questionsJson = review.questions;
        const answeredCount = Array.isArray(questionsJson) ? questionsJson.length : 0;
        const sections = (0, m02_frontend_call_reviews_mapper_1.scorecardSectionsTemplate)();
        return {
            totalQuestions: 11,
            answeredCount,
            sections,
        };
    }
    async getTranscript(tenantId, reviewId, userId, userRole) {
        const review = await this.getReview(tenantId, reviewId, userId, userRole);
        const call = await this.prisma.callRecord.findFirst({
            where: { title: review.callTitle, tenantid: tenantId },
            include: { transcript: { include: { utterances: { orderBy: { sequenceIndex: 'asc' } } } } },
        });
        const entries = (call?.transcript?.utterances ?? []).map((u) => ({
            timestamp: (0, m02_frontend_call_reviews_mapper_1.formatMmSs)(Math.floor((u.startMs ?? 0) / 1000)),
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
    getAiInsights(userId, userRole) {
        return {
            insights: [
                { type: 'positive', title: 'Strong Discovery', description: 'Rep asked multiple open-ended questions.' },
                { type: 'warning', title: 'Missing: Next Steps', description: 'No explicit next meeting scheduled.' },
                { type: 'positive', title: 'Good Rapport', description: 'Positive tone throughout the call.' },
            ],
        };
    }
    async saveAnswer(tenantId, reviewId, body, userId, userRole) {
        const dto = m02_frontend_call_reviews_schema_1.SaveAnswerSchema.parse(body);
        const review = await this.getReview(tenantId, reviewId, userId, userRole);
        const questionsJson = Array.isArray(review.questions) ? review.questions : [];
        const existingIndex = questionsJson.findIndex((q) => q.questionId === dto.questionId);
        if (existingIndex > -1) {
            questionsJson[existingIndex] = dto;
        }
        else {
            questionsJson.push(dto);
        }
        const { score } = calculateCallReviewScore(questionsJson);
        const updateData = {
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
    async saveAnswersBatch(tenantId, reviewId, answers, userId, userRole) {
        const review = await this.getReview(tenantId, reviewId, userId, userRole);
        const { score } = calculateCallReviewScore(answers);
        const updateData = {
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
    async saveDraft(tenantId, reviewId, body, userId, userRole) {
        const review = await this.getReview(tenantId, reviewId, userId, userRole);
        const updateData = {};
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
    async getCoaching(tenantId, reviewId, userId, userRole) {
        const review = await this.getReview(tenantId, reviewId, userId, userRole);
        const feedback = review.feedback;
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
    async saveCoaching(tenantId, reviewId, body, userId, userRole) {
        const dto = m02_frontend_call_reviews_schema_1.CoachingBodySchema.parse(body);
        await this.getReview(tenantId, reviewId, userId, userRole);
        await this.prisma.callReview.update({
            where: { reviewId },
            data: {
                feedback: dto,
            },
        });
        return { success: true, savedAt: new Date().toISOString() };
    }
    async getSummary(tenantId, reviewId, userId, userRole) {
        const review = await this.getReview(tenantId, reviewId, userId, userRole);
        const questionsJson = review.questions;
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
    async submitReview(tenantId, reviewId, body, userId, userRole) {
        const review = await this.getReview(tenantId, reviewId, userId, userRole);
        const updateData = {
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
    async getSubmitted(reviewId, userId, userRole) {
        const where = { reviewId };
        if (userRole === 'sales_rep' && userId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                where.OR = [
                    { salesRep: userId },
                    { salesRep: user.name },
                ];
            }
            else {
                where.salesRep = userId;
            }
        }
        const review = await this.prisma.callReview.findFirst({
            where,
        });
        if (!review)
            throw new common_1.NotFoundException('Review not found or access denied');
        const feedback = review.feedback;
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
    async getSubmittedView(tenantId, reviewId, userId, userRole) {
        const review = await this.getReview(tenantId, reviewId, userId, userRole);
        const submittedData = await this.getSubmitted(reviewId, userId, userRole);
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
                { event: 'Review Submitted', user: review.reviewer || 'usr_manager_001', at: review.updatedAt.toISOString() },
            ],
        };
    }
    exportReview(reviewId) {
        return {
            downloadUrl: `/api/call-reviews/${reviewId}/export/download`,
            fileName: `${reviewId}-review.pdf`,
        };
    }
    cloneReview(reviewId) {
        return { newReviewId: `rv_clone_${reviewId}`, redirectUrl: `/calls/reviews/rv_clone_${reviewId}` };
    }
    async getAnalyticsSummary(userId, userRole) {
        const where = {};
        if (userRole === 'sales_rep' && userId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                where.OR = [
                    { salesRep: userId },
                    { salesRep: user.name },
                ];
            }
            else {
                where.salesRep = userId;
            }
        }
        const reviews = await this.prisma.callReview.findMany({ where });
        const totalReviews = reviews.length;
        const completedReviews = reviews.filter(r => r.status === 'Completed');
        let avgScore = 0;
        if (completedReviews.length > 0) {
            avgScore = Math.round(completedReviews.reduce((sum, r) => sum + (r.overallScore || 0), 0) / completedReviews.length);
        }
        return {
            repAverageScore: avgScore,
            repAverageTrend: '+2%',
            teamAverageScore: 78,
            completionRate: totalReviews > 0 ? Math.round((completedReviews.length / totalReviews) * 100) : 0,
            totalReviews: totalReviews,
        };
    }
    async getScoreTrend(userId, userRole) {
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
    async focusAreas(userId, userRole) {
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
    getReviewHistory(raw) {
        m02_frontend_call_reviews_schema_1.AnalyticsHistoryQuerySchema.parse(raw);
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
};
exports.M02FrontendCallReviewsService = M02FrontendCallReviewsService;
exports.M02FrontendCallReviewsService = M02FrontendCallReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        m02_service_1.M02ConversationIntelligenceService])
], M02FrontendCallReviewsService);
function calculateCallReviewScore(answers) {
    let totalMax = 0;
    let totalEarned = 0;
    const sections = {
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
    const entries = Array.isArray(answers)
        ? answers.map(q => [q.questionId, q])
        : Object.entries(answers);
    for (const [qId, ans] of entries) {
        if (!ans)
            continue;
        const isNa = ans.isNa || ans.isNa === 'true' || ans.isNa === true || ans.na || ans.na === 'true' || ans.na === true;
        if (isNa)
            continue;
        let sectionKey = 'opening';
        if (qId.startsWith('disc_') || qId === 'q_04' || qId === 'q_05' || qId === 'q_06' || qId === 'q_07') {
            sectionKey = 'discovery';
        }
        else if (qId.startsWith('fit_')) {
            sectionKey = 'product_fit';
        }
        else if (qId.startsWith('obj_')) {
            sectionKey = 'objection_handling';
        }
        const maxVal = 10;
        let earnedVal = 0;
        const val = ans.value !== undefined ? ans.value : ans.answer;
        if (val === true || val === 'true' || val === 'Yes' || val === 'yes' || val === 'Good' || val === 'Excellent') {
            earnedVal = 10;
        }
        else if (val === '4' || val === 4 || val === '5' || val === 5) {
            earnedVal = 8;
        }
        else if (val === '3' || val === 3) {
            earnedVal = 6;
        }
        else if (val === '2' || val === 2) {
            earnedVal = 4;
        }
        else if (val === '1' || val === 1) {
            earnedVal = 2;
        }
        else if (val === false || val === 'false' || val === 'No' || val === 'no' || val === 'Poor' || val === 'Fair') {
            earnedVal = 0;
        }
        else if (typeof val === 'number') {
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
//# sourceMappingURL=m02-frontend-call-reviews.service.js.map