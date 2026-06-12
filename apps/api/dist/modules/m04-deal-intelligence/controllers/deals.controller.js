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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DealsController_1, DealBoardsRepController_1, NotificationsApiController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsApiController = exports.DealBoardsRepController = exports.DealsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const deal_summary_service_1 = require("../services/deal-summary.service");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const TENANT_ID = '00000000-0000-0000-0000-000000000001';
let DealsController = DealsController_1 = class DealsController {
    prisma;
    summaryService;
    logger = new common_1.Logger(DealsController_1.name);
    constructor(prisma, summaryService) {
        this.prisma = prisma;
        this.summaryService = summaryService;
    }
    async getBoardsFromDb(tenantId) {
        const boards = [
            {
                boardId: 'board-1',
                name: 'My Deals',
                description: 'Personal deal tracking and management',
                owner: 'John Smith',
                canEdit: true,
            },
            {
                boardId: 'board-2',
                name: 'Enterprise Deals Q2',
                description: 'All enterprise opportunities for Q2 2026',
                owner: 'Sarah Chen',
                canEdit: false,
            },
            {
                boardId: 'board-3',
                name: 'Team Pipeline - West',
                description: 'Western region team pipeline overview',
                owner: 'Michael Rodriguez',
                canEdit: false,
            },
            {
                boardId: 'board-4',
                name: 'Strategic Accounts',
                description: 'High-value strategic account opportunities',
                owner: 'Jennifer Kim',
                canEdit: true,
            },
        ];
        return Promise.all(boards.map(async (b) => {
            const latestDeal = await this.prisma.deal.findFirst({
                where: { tenantid: tenantId, pipeline: b.boardId },
                orderBy: { updatedAt: 'desc' },
            });
            return {
                ...b,
                lastModified: latestDeal?.updatedAt?.toISOString() || new Date().toISOString(),
            };
        }));
    }
    async getDealBoards(req) {
        try {
            const boards = await this.getBoardsFromDb(req.tenantId);
            return { success: true, data: boards, isMock: false };
        }
        catch (error) {
            this.logger.error('Failed to get deal boards:', error);
            return { success: false, data: [], isMock: false, error: error.message };
        }
    }
    async getBoardDetail(boardId, req, owner) {
        try {
            const boards = await this.getBoardsFromDb(req.tenantId);
            const board = boards.find((b) => b.boardId === boardId);
            if (!board)
                throw new Error('Board not found');
            const userRole = req.userRole || 'SALES_REP';
            const userId = req.userId;
            const whereClause = { tenantid: req.tenantid, pipeline: boardId };
            if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
                whereClause.ownerId = userId;
            }
            else if (owner) {
                whereClause.ownerName = { contains: owner, mode: 'insensitive' };
            }
            const deals = await this.prisma.deal.findMany({
                where: whereClause,
            });
            const categories = ['Open', 'Commit', 'Most Likely', 'Best Case', 'Closed Won', 'Closed Lost'];
            const summaryCards = categories.map((category) => {
                const catDeals = deals.filter((d) => d.forecastCategory === category);
                const count = catDeals.length;
                const total = catDeals.reduce((sum, d) => sum + Number(d.amount), 0);
                return {
                    label: category,
                    amount: total,
                    count,
                    changePercent: 12,
                };
            });
            return {
                success: true,
                data: {
                    boardId: board.boardId,
                    name: board.name,
                    ownerTag: `Owner = ${board.owner}`,
                    summaryCards,
                },
                isMock: false,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get board detail for ${boardId}:`, error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async getDealsByBoard(boardId, req, owner) {
        try {
            const userRole = req.userRole || 'SALES_REP';
            const userId = req.userId;
            const whereClause = { tenantid: req.tenantid, pipeline: boardId };
            if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
                whereClause.ownerId = userId;
            }
            else if (owner) {
                whereClause.ownerName = { contains: owner, mode: 'insensitive' };
            }
            const dbDeals = await this.prisma.deal.findMany({
                where: whereClause,
                orderBy: { name: 'asc' },
            });
            const enrichedDeals = await Promise.all(dbDeals.map(async (d) => {
                const warnings = await this.prisma.dealWarning.findMany({
                    where: { dealId: d.id, status: 'active' },
                });
                const criteria = await this.prisma.dealPlaybook.findMany({
                    where: { dealId: d.id },
                });
                const completedCount = criteria.filter((c) => c.status === 'Completed').length;
                const playbookScore = criteria.length > 0 ? Math.round((completedCount / criteria.length) * 100) : d.meddpiccScore || 0;
                const activities = await this.prisma.dealActivityEvent.findMany({
                    where: { dealId: d.id },
                    orderBy: { date: 'asc' },
                });
                const activityOverTime = activities.map((a, idx) => ({
                    dateLabel: a.date.substring(5).toUpperCase().replace('-', ' '),
                    count: 1,
                    interactions: [
                        {
                            id: a.id,
                            type: a.direction === 'inbound' ? 'customer' : 'rep',
                            size: 12,
                            positionPercent: idx * 20,
                        },
                    ],
                }));
                return {
                    dealId: d.id,
                    dealName: d.name,
                    company: d.name.split(' - ')[0],
                    stage: d.stage,
                    amount: Number(d.amount),
                    forecastCategory: d.forecastCategory || 'Open',
                    closeDate: d.closeDate ? d.closeDate.toISOString().split('T')[0] : '',
                    assignedRep: d.ownerName || 'Lakshmi Prasanna Dara',
                    contacts: d.warningsCount || 2,
                    notificationCount: 0,
                    aiWarningCount: warnings.length,
                    flagCount: d.escalated ? 1 : 0,
                    flagReason: d.escalated ? 'Manager has escalated this deal.' : undefined,
                    activityOverTime,
                    playbookScore,
                    playbookColor: playbookScore >= 75 ? 'green' : playbookScore >= 50 ? 'orange' : 'red',
                    aiSuggestedNextStep: d.nextStep || 'Schedule next stakeholder meeting',
                };
            }));
            return { success: true, data: enrichedDeals, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to get deals for board ${boardId}:`, error);
            return { success: false, data: [], isMock: false, error: error.message };
        }
    }
    async getAllDeals(req) {
        try {
            const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
            const userId = req.userId || req.headers['x-user-id'];
            const whereClause = {};
            if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
                whereClause.ownerId = userId;
            }
            const dbDeals = await this.prisma.deal.findMany({
                where: whereClause,
                orderBy: { updatedAt: 'desc' },
            });
            const mapped = dbDeals.map((d) => {
                const amt = Number(d.amount);
                const amountStr = amt >= 1000 ? `$${(amt / 1000).toFixed(0)}K` : `$${amt}`;
                return {
                    id: d.id,
                    name: d.name,
                    stage: d.stage,
                    category: d.forecastCategory || 'Open',
                    amount: amountStr,
                    aiScore: d.aiScore || 50,
                    warnings: d.warningsCount || 0,
                    meddpiccPercent: d.meddpiccScore || 0,
                    contacts: 2,
                    ownerName: d.ownerName,
                    ownerEmail: d.ownerEmail,
                    owner: {
                        name: d.ownerName || 'Lakshmi Prasanna Dara',
                        email: d.ownerEmail || 'lakshmi@company.com',
                        initials: (d.ownerName || 'UN').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
                        color: '#4f46e5',
                    },
                };
            });
            return { success: true, data: mapped, count: mapped.length, isMock: false };
        }
        catch (error) {
            this.logger.error('Failed to get all deals:', error);
            return { success: false, data: [], count: 0, isMock: false, error: error.message };
        }
    }
    async getPipelineSummary(req) {
        try {
            const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
            const userId = req.userId || req.headers['x-user-id'];
            const whereClause = {};
            if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
                whereClause.ownerId = userId;
            }
            const deals = await this.prisma.deal.findMany({ where: whereClause });
            const categories = ['Open', 'Commit', 'Most Likely', 'Best Case', 'Closed Won', 'Closed Lost'];
            const summary = categories.map((category) => {
                const catDeals = deals.filter((d) => d.forecastCategory === category);
                const count = catDeals.length;
                const total = catDeals.reduce((sum, d) => sum + Number(d.amount), 0);
                let amountStr = '$0';
                if (total >= 1000000) {
                    amountStr = `$${(total / 1000000).toFixed(1)}M`;
                }
                else if (total >= 1000) {
                    amountStr = `$${(total / 1000).toFixed(0)}K`;
                }
                else {
                    amountStr = `$${total}`;
                }
                return {
                    label: category,
                    amount: amountStr,
                    count,
                    change: '$0 [0]',
                };
            });
            return { success: true, data: summary, isMock: false };
        }
        catch (error) {
            this.logger.error('Failed to calculate pipeline summary:', error);
            return { success: false, data: [], isMock: false, error: error.message };
        }
    }
    async getDealById(dealId, req) {
        try {
            const userRole = req.userRole || 'SALES_REP';
            const userId = req.userId;
            const where = { id: dealId, tenantid: req.tenantid };
            if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
                where.ownerId = userId;
            }
            const deal = await this.prisma.deal.findFirst({
                where,
            });
            if (!deal)
                throw new Error('Deal not found or access denied');
            return { success: true, data: deal, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to get deal by id ${dealId}:`, error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async updateDeal(dealId, updates) {
        try {
            const data = {};
            if (updates.stage !== undefined)
                data.stage = updates.stage;
            if (updates.forecastCategory !== undefined)
                data.forecastCategory = updates.forecastCategory;
            if (updates.nextStep !== undefined)
                data.nextStep = updates.nextStep;
            if (updates.closeDate !== undefined)
                data.closeDate = updates.closeDate ? new Date(updates.closeDate) : null;
            if (updates.amount !== undefined) {
                let amt = updates.amount;
                if (typeof amt === 'string') {
                    amt = amt.replace(/[$,\s]/g, '');
                    if (amt.toUpperCase().endsWith('K')) {
                        amt = parseFloat(amt.slice(0, -1)) * 1000;
                    }
                    else if (amt.toUpperCase().endsWith('M')) {
                        amt = parseFloat(amt.slice(0, -1)) * 1000000;
                    }
                    else {
                        amt = parseFloat(amt);
                    }
                }
                data.amount = isNaN(amt) ? 0 : amt;
            }
            const updated = await this.prisma.deal.update({
                where: { id: dealId },
                data,
            });
            return { success: true, data: updated, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to update deal ${dealId}:`, error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async getDealBrief(dealId, req) {
        try {
            const deal = await this.prisma.deal.findUnique({
                where: { id: dealId },
            });
            if (!deal)
                throw new Error('Deal not found');
            const userId = req.user?.id || 'system-user';
            let summaryEntity = await this.summaryService.getCurrentSummary(dealId);
            if (!summaryEntity) {
                summaryEntity = await this.summaryService.generateSummary(dealId, userId);
            }
            let parsedSummary;
            try {
                parsedSummary = JSON.parse(summaryEntity.summary);
            }
            catch (e) {
                parsedSummary = {};
            }
            return {
                success: true,
                data: parsedSummary,
                isMock: false,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get brief for deal ${dealId}:`, error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async getDealWarnings(dealId) {
        try {
            const warnings = await this.prisma.dealWarning.findMany({
                where: { dealId },
            });
            return {
                success: true,
                data: warnings.map((w) => ({
                    warningId: w.id,
                    severity: w.severity,
                    title: w.title,
                    description: w.description,
                    suggestedAction: w.suggestedAction,
                    status: w.status,
                })),
                isMock: false,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get warnings for deal ${dealId}:`, error);
            return { success: false, data: [], isMock: false, error: error.message };
        }
    }
    async resolveWarning(dealId, warningId, body) {
        try {
            const updated = await this.prisma.dealWarning.update({
                where: { id: warningId },
                data: { status: body.status || 'resolved' },
            });
            return {
                message: 'Warning status updated',
                warningId: updated.id,
                status: updated.status,
            };
        }
        catch (error) {
            this.logger.error(`Failed to update warning ${warningId}:`, error);
            return { message: 'Failed to update warning', error: error.message };
        }
    }
    async triggerWarningAction(dealId, warningId) {
        return {
            message: 'Action triggered successfully',
            actionTriggered: true,
            status: 'ok',
        };
    }
    async getDealPlaybook(dealId) {
        try {
            const criteria = await this.prisma.dealPlaybook.findMany({
                where: { dealId },
            });
            const completedCount = criteria.filter((c) => c.status === 'Completed').length;
            const scorePercentage = criteria.length > 0 ? Math.round((completedCount / criteria.length) * 100) : 0;
            return {
                success: true,
                data: {
                    framework: 'MEDDIC',
                    scorePercentage,
                    completedCount,
                    totalCount: criteria.length,
                    criteria: criteria.map((c) => ({
                        criterionId: c.id,
                        criterionName: c.criterionName,
                        question: c.question,
                        status: c.status,
                        notes: c.notes,
                        aiSuggestedNote: c.aiSuggestedNote,
                    })),
                },
                isMock: false,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get playbook for deal ${dealId}:`, error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async updatePlaybookCriterion(dealId, criterionId, body) {
        try {
            const updated = await this.prisma.dealPlaybook.update({
                where: { id: criterionId },
                data: {
                    status: body.status,
                    ...(body.notes !== undefined ? { notes: body.notes } : {}),
                },
            });
            const criteria = await this.prisma.dealPlaybook.findMany({
                where: { dealId },
            });
            const completed = criteria.filter((c) => c.status === 'Completed').length;
            const pct = criteria.length > 0 ? Math.round((completed / criteria.length) * 100) : 0;
            await this.prisma.deal.update({
                where: { id: dealId },
                data: { meddpiccScore: pct },
            });
            return {
                message: 'Playbook criterion updated',
                criterionId: updated.id,
                updatedStatus: updated.status,
            };
        }
        catch (error) {
            this.logger.error(`Failed to update criterion ${criterionId}:`, error);
            return { message: 'Failed to update criterion', error: error.message };
        }
    }
    async getDealActivity(dealId) {
        try {
            const events = await this.prisma.dealActivityEvent.findMany({
                where: { dealId },
                orderBy: { date: 'asc' },
            });
            const outbound = events.filter((e) => e.direction === 'outbound');
            const inbound = events.filter((e) => e.direction === 'inbound');
            const totalMinutes = events.reduce((sum, e) => sum + e.duration, 0);
            return {
                success: true,
                data: {
                    ourInteractions: outbound.length,
                    customerInteractions: inbound.length,
                    totalMinutes,
                    events: events.map((e) => ({
                        activityId: e.id,
                        date: e.date,
                        type: e.type,
                        duration: e.duration,
                        direction: e.direction,
                        participants: e.participants,
                        notes: e.notes,
                    })),
                },
                isMock: false,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get activity for deal ${dealId}:`, error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async getDealCrmFields(dealId) {
        try {
            const deal = await this.prisma.deal.findUnique({
                where: { id: dealId },
            });
            if (!deal)
                throw new Error('Deal not found');
            return {
                success: true,
                data: {
                    stage: deal.stage || '',
                    amount: Number(deal.amount) || 0,
                    forecastCategory: deal.forecastCategory || '',
                    nextStep: deal.nextStep || '',
                    closeDate: deal.closeDate ? deal.closeDate.toISOString().split('T')[0] : '',
                },
                isMock: false,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get CRM fields for ${dealId}:`, error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    getStageOptions() {
        return {
            success: true,
            data: {
                stages: ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
                forecastCategories: ['Pipeline', 'Best Case', 'Most Likely', 'Commit', 'Closed', 'Omitted'],
            },
            isMock: false,
        };
    }
    async getNotifications(repName) {
        try {
            const notifications = await this.prisma.dealNotification.findMany({
                where: repName ? { repName: { contains: repName, mode: 'insensitive' } } : {},
                orderBy: { timestamp: 'desc' },
            });
            const unreadCount = notifications.filter((n) => !n.read).length;
            return {
                success: true,
                data: {
                    notifications: notifications.map((n) => ({
                        id: n.id,
                        message: n.message,
                        timestamp: n.timestamp.toISOString(),
                        read: n.read,
                        type: n.type,
                    })),
                    unreadCount,
                },
                isMock: false,
            };
        }
        catch (error) {
            this.logger.error('Failed to get notifications:', error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async createNotification(body) {
        try {
            const notif = await this.prisma.dealNotification.create({
                data: {
                    tenantid: TENANT_ID,
                    repName: body.repName,
                    message: body.message,
                    type: body.type || 'info',
                },
            });
            return { success: true, data: notif, isMock: false };
        }
        catch (error) {
            this.logger.error('Failed to create notification:', error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async markAllNotificationsRead(repName) {
        try {
            await this.prisma.dealNotification.updateMany({
                where: {
                    read: false,
                    ...(repName ? { repName: { contains: repName, mode: 'insensitive' } } : {}),
                },
                data: { read: true },
            });
            return {
                success: true,
                data: { message: 'All notifications marked as read' },
                isMock: false,
            };
        }
        catch (error) {
            this.logger.error('Failed to mark notifications as read:', error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async postDealComment(dealId, body) {
        try {
            const commentText = body?.comment?.trim();
            if (!commentText)
                throw new Error('Comment text is required');
            const comment = await this.prisma.dealComment.create({
                data: {
                    tenantid: TENANT_ID,
                    dealId,
                    comment: commentText,
                },
            });
            return { success: true, data: comment, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to post comment for deal ${dealId}:`, error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async getDealComments(dealId) {
        try {
            const comments = await this.prisma.dealComment.findMany({
                where: { dealId },
                orderBy: { createdAt: 'desc' },
            });
            return { success: true, data: comments, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to get comments for deal ${dealId}:`, error);
            return { success: false, data: [], isMock: false, error: error.message };
        }
    }
    async escalateDeal(dealId) {
        try {
            const updated = await this.prisma.deal.update({
                where: { id: dealId },
                data: { escalated: true },
            });
            return { success: true, data: { dealId, escalated: true }, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to escalate deal ${dealId}:`, error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async removeEscalation(dealId) {
        try {
            const updated = await this.prisma.deal.update({
                where: { id: dealId },
                data: { escalated: false },
            });
            return { success: true, data: { dealId, escalated: false }, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to de-escalate deal ${dealId}:`, error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async getEscalationStatus(dealId) {
        try {
            const deal = await this.prisma.deal.findUnique({
                where: { id: dealId },
            });
            return { success: true, data: { dealId, escalated: deal?.escalated || false }, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to get escalation status for ${dealId}:`, error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async createDealTask(body) {
        try {
            const task = await this.prisma.dealTask.create({
                data: {
                    tenantid: TENANT_ID,
                    dealId: body.dealId,
                    title: body.title,
                    description: body.description,
                    dueDate: body.dueDate ? new Date(body.dueDate) : null,
                },
            });
            return { success: true, data: task, isMock: false };
        }
        catch (error) {
            this.logger.error('Failed to create task:', error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
};
exports.DealsController = DealsController;
__decorate([
    (0, common_1.Get)('boards'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealBoards", null);
__decorate([
    (0, common_1.Get)('boards/:boardId'),
    __param(0, (0, common_1.Param)('boardId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('owner')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getBoardDetail", null);
__decorate([
    (0, common_1.Get)('boards/:boardId/deals'),
    __param(0, (0, common_1.Param)('boardId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('owner')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealsByBoard", null);
__decorate([
    (0, common_1.Get)('all'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getAllDeals", null);
__decorate([
    (0, common_1.Get)('pipeline-summary'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getPipelineSummary", null);
__decorate([
    (0, common_1.Get)(':dealId'),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealById", null);
__decorate([
    (0, common_1.Patch)(':dealId'),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "updateDeal", null);
__decorate([
    (0, common_1.Get)(':dealId/brief'),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealBrief", null);
__decorate([
    (0, common_1.Get)(':dealId/warnings'),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealWarnings", null);
__decorate([
    (0, common_1.Patch)(':dealId/warnings/:warningId'),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('warningId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "resolveWarning", null);
__decorate([
    (0, common_1.Post)(':dealId/warnings/:warningId/action'),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('warningId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "triggerWarningAction", null);
__decorate([
    (0, common_1.Get)(':dealId/playbook'),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealPlaybook", null);
__decorate([
    (0, common_1.Patch)(':dealId/playbook/criteria/:criterionId'),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('criterionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "updatePlaybookCriterion", null);
__decorate([
    (0, common_1.Get)(':dealId/activity'),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealActivity", null);
__decorate([
    (0, common_1.Get)(':dealId/crm-fields'),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealCrmFields", null);
__decorate([
    (0, common_1.Get)('stage-options'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], DealsController.prototype, "getStageOptions", null);
__decorate([
    (0, common_1.Get)('notifications'),
    __param(0, (0, common_1.Query)('repName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Post)('notifications'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "createNotification", null);
__decorate([
    (0, common_1.Patch)('notifications/read-all'),
    __param(0, (0, common_1.Query)('repName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "markAllNotificationsRead", null);
__decorate([
    (0, common_1.Post)(':dealId/comments'),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "postDealComment", null);
__decorate([
    (0, common_1.Get)(':dealId/comments'),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealComments", null);
__decorate([
    (0, common_1.Post)(':dealId/escalation'),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "escalateDeal", null);
__decorate([
    (0, common_1.Delete)(':dealId/escalation'),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "removeEscalation", null);
__decorate([
    (0, common_1.Get)(':dealId/escalation'),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getEscalationStatus", null);
__decorate([
    (0, common_1.Post)('tasks'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "createDealTask", null);
exports.DealsController = DealsController = DealsController_1 = __decorate([
    (0, common_1.Controller)('api/v1/deal-management'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        deal_summary_service_1.DealSummaryService])
], DealsController);
let DealBoardsRepController = DealBoardsRepController_1 = class DealBoardsRepController {
    prisma;
    logger = new common_1.Logger(DealBoardsRepController_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBoardsFromDb() {
        const boards = [
            {
                boardId: 'board-1',
                name: 'My Deals',
                description: 'Personal deal tracking and management',
                owner: 'John Smith',
                canEdit: true,
            },
            {
                boardId: 'board-2',
                name: 'Enterprise Deals Q2',
                description: 'All enterprise opportunities for Q2 2026',
                owner: 'Sarah Chen',
                canEdit: false,
            },
            {
                boardId: 'board-3',
                name: 'Team Pipeline - West',
                description: 'Western region team pipeline overview',
                owner: 'Michael Rodriguez',
                canEdit: false,
            },
            {
                boardId: 'board-4',
                name: 'Strategic Accounts',
                description: 'High-value strategic account opportunities',
                owner: 'Jennifer Kim',
                canEdit: true,
            },
        ];
        return Promise.all(boards.map(async (b) => {
            const latestDeal = await this.prisma.deal.findFirst({
                where: { pipeline: b.boardId },
                orderBy: { updatedAt: 'desc' },
            });
            return {
                ...b,
                lastModified: latestDeal?.updatedAt?.toISOString() || new Date().toISOString(),
            };
        }));
    }
    async getDealBoards() {
        try {
            const boards = await this.getBoardsFromDb();
            return { success: true, data: boards, isMock: false };
        }
        catch (error) {
            this.logger.error('Failed to get deal boards:', error);
            return { success: false, data: [], isMock: false, error: error.message };
        }
    }
    async getBoardDetail(boardId, owner) {
        try {
            const boards = await this.getBoardsFromDb();
            const board = boards.find((b) => b.boardId === boardId);
            if (!board)
                throw new Error('Board not found');
            const deals = await this.prisma.deal.findMany({
                where: {
                    pipeline: boardId,
                    ...(owner ? { ownerName: { contains: owner, mode: 'insensitive' } } : {}),
                },
            });
            const categories = ['Open', 'Commit', 'Most Likely', 'Best Case', 'Closed Won', 'Closed Lost'];
            const summaryCards = categories.map((category) => {
                const catDeals = deals.filter((d) => d.forecastCategory === category);
                const count = catDeals.length;
                const total = catDeals.reduce((sum, d) => sum + Number(d.amount), 0);
                return {
                    label: category,
                    amount: total,
                    count,
                    changePercent: 12,
                };
            });
            return {
                success: true,
                data: {
                    boardId: board.boardId,
                    name: board.name,
                    ownerTag: `Owner = ${board.owner}`,
                    summaryCards,
                },
                isMock: false,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get board detail for ${boardId}:`, error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async getDealsByBoard(boardId, owner) {
        try {
            const dbDeals = await this.prisma.deal.findMany({
                where: {
                    pipeline: boardId,
                    ...(owner ? { ownerName: { contains: owner, mode: 'insensitive' } } : {}),
                },
                orderBy: { name: 'asc' },
            });
            const enrichedDeals = await Promise.all(dbDeals.map(async (d) => {
                const warnings = await this.prisma.dealWarning.findMany({
                    where: { dealId: d.id, status: 'active' },
                });
                const criteria = await this.prisma.dealPlaybook.findMany({
                    where: { dealId: d.id },
                });
                const completedCount = criteria.filter((c) => c.status === 'Completed').length;
                const playbookScore = criteria.length > 0 ? Math.round((completedCount / criteria.length) * 100) : d.meddpiccScore || 0;
                const activities = await this.prisma.dealActivityEvent.findMany({
                    where: { dealId: d.id },
                    orderBy: { date: 'asc' },
                });
                const activityOverTime = activities.map((a, idx) => ({
                    dateLabel: a.date.substring(5).toUpperCase().replace('-', ' '),
                    count: 1,
                    interactions: [
                        {
                            id: a.id,
                            type: a.direction === 'inbound' ? 'customer' : 'rep',
                            size: 12,
                            positionPercent: idx * 20,
                        },
                    ],
                }));
                return {
                    dealId: d.id,
                    dealName: d.name,
                    company: d.name.split(' - ')[0],
                    stage: d.stage,
                    amount: Number(d.amount),
                    forecastCategory: d.forecastCategory || 'Open',
                    closeDate: d.closeDate ? d.closeDate.toISOString().split('T')[0] : '',
                    assignedRep: d.ownerName || 'Lakshmi Prasanna Dara',
                    contacts: d.warningsCount || 2,
                    notificationCount: 0,
                    aiWarningCount: warnings.length,
                    flagCount: d.escalated ? 1 : 0,
                    flagReason: d.escalated ? 'Manager has escalated this deal.' : undefined,
                    activityOverTime,
                    playbookScore,
                    playbookColor: playbookScore >= 75 ? 'green' : playbookScore >= 50 ? 'orange' : 'red',
                    aiSuggestedNextStep: d.nextStep || 'Schedule next stakeholder meeting',
                };
            }));
            return { success: true, data: enrichedDeals, isMock: false };
        }
        catch (error) {
            this.logger.error(`Failed to get deals for board ${boardId}:`, error);
            return { success: false, data: [], isMock: false, error: error.message };
        }
    }
};
exports.DealBoardsRepController = DealBoardsRepController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DealBoardsRepController.prototype, "getDealBoards", null);
__decorate([
    (0, common_1.Get)(':boardId'),
    __param(0, (0, common_1.Param)('boardId')),
    __param(1, (0, common_1.Query)('owner')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DealBoardsRepController.prototype, "getBoardDetail", null);
__decorate([
    (0, common_1.Get)(':boardId/deals'),
    __param(0, (0, common_1.Param)('boardId')),
    __param(1, (0, common_1.Query)('owner')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DealBoardsRepController.prototype, "getDealsByBoard", null);
exports.DealBoardsRepController = DealBoardsRepController = DealBoardsRepController_1 = __decorate([
    (0, common_1.Controller)('api/v1/deal-management/deal-boards'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DealBoardsRepController);
let NotificationsApiController = NotificationsApiController_1 = class NotificationsApiController {
    prisma;
    logger = new common_1.Logger(NotificationsApiController_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getNotifications(repName) {
        try {
            const notifications = await this.prisma.dealNotification.findMany({
                where: repName ? { repName: { contains: repName, mode: 'insensitive' } } : {},
                orderBy: { timestamp: 'desc' },
            });
            const unreadCount = notifications.filter((n) => !n.read).length;
            return {
                success: true,
                data: {
                    notifications: notifications.map((n) => ({
                        id: n.id,
                        message: n.message,
                        timestamp: n.timestamp.toISOString(),
                        read: n.read,
                        type: n.type,
                    })),
                    unreadCount,
                },
                isMock: false,
            };
        }
        catch (error) {
            this.logger.error('Failed to get notifications:', error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
    async markAllNotificationsRead(repName) {
        try {
            await this.prisma.dealNotification.updateMany({
                where: {
                    read: false,
                    ...(repName ? { repName: { contains: repName, mode: 'insensitive' } } : {}),
                },
                data: { read: true },
            });
            return {
                success: true,
                data: { message: 'All notifications marked as read' },
                isMock: false,
            };
        }
        catch (error) {
            this.logger.error('Failed to mark notifications as read:', error);
            return { success: false, data: null, isMock: false, error: error.message };
        }
    }
};
exports.NotificationsApiController = NotificationsApiController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('repName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsApiController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    __param(0, (0, common_1.Query)('repName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsApiController.prototype, "markAllNotificationsRead", null);
exports.NotificationsApiController = NotificationsApiController = NotificationsApiController_1 = __decorate([
    (0, common_1.Controller)('api/v1/deal-management/notifications'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsApiController);
//# sourceMappingURL=deals.controller.js.map