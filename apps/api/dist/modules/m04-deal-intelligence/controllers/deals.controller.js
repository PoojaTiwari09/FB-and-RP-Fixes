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
var DealsController_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../platform-core/decorators/roles.decorator");
const zod_validation_pipe_1 = require("../../platform-core/pipes/zod-validation.pipe");
const m04_dto_1 = require("../dto/m04.dto");
const prisma_service_1 = require("../database/prisma.service");
const deal_summary_service_1 = require("../services/deal-summary.service");
const jwt_guard_1 = require("../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const FALLBACK_TENANT_ID = '00000000-0000-0000-0000-000000000001';
let DealsController = DealsController_1 = class DealsController {
    prisma;
    summaryService;
    logger = new common_1.Logger(DealsController_1.name);
    constructor(prisma, summaryService) {
        this.prisma = prisma;
        this.summaryService = summaryService;
    }
    async getAllDeals(req, query) {
        try {
            const { page, pageSize, sortBy, sortOrder } = query;
            const skip = (page - 1) * pageSize;
            const take = pageSize;
            const userRole = req.userRole || 'SALES_REP';
            const userId = req.userId;
            const whereClause = { tenantid: req.tenantId };
            if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
                whereClause.ownerId = userId;
            }
            const [dbDeals, totalRecords] = await Promise.all([
                this.prisma.deal.findMany({
                    where: whereClause,
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take,
                }),
                this.prisma.deal.count({ where: whereClause })
            ]);
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
            return {
                success: true,
                data: mapped,
                meta: {
                    pagination: {
                        page,
                        pageSize,
                        totalRecords,
                        totalPages: Math.ceil(totalRecords / pageSize),
                        hasNextPage: page * pageSize < totalRecords,
                        hasPreviousPage: page > 1
                    }
                }
            };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error('Failed to get all deals:', error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getPipelineSummary(req) {
        try {
            const userRole = req.userRole || 'SALES_REP';
            const userId = req.userId;
            const whereClause = { tenantid: req.tenantId };
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
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error('Failed to calculate pipeline summary:', error);
            throw new common_1.BadRequestException(error.message);
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
    getForecastCategoryOptions() {
        return {
            success: true,
            data: {
                forecastCategories: ['Pipeline', 'Best Case', 'Most Likely', 'Commit', 'Closed', 'Omitted'],
            },
            isMock: false,
        };
    }
    async getNotifications(repName, req) {
        try {
            const notifications = await this.prisma.dealNotification.findMany({
                where: {
                    tenantid: req.tenantId,
                    ...(repName ? { repName: { contains: repName, mode: 'insensitive' } } : {}),
                },
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
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error('Failed to get notifications:', error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async createNotification(body, req) {
        try {
            const notif = await this.prisma.dealNotification.create({
                data: {
                    tenantid: req.tenantId || FALLBACK_TENANT_ID,
                    repName: body.repName,
                    message: body.message,
                    type: body.type || 'info',
                },
            });
            return { success: true, data: notif, isMock: false };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error('Failed to create notification:', error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async markAllNotificationsRead(repName, req) {
        try {
            await this.prisma.dealNotification.updateMany({
                where: {
                    tenantid: req.tenantId,
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
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error('Failed to mark notifications as read:', error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async createDealTask(body, req) {
        try {
            const task = await this.prisma.dealTask.create({
                data: {
                    tenantid: req.tenantId || FALLBACK_TENANT_ID,
                    dealId: body.dealId,
                    title: body.title,
                    description: body.description,
                    dueDate: body.dueDate ? new Date(body.dueDate) : null,
                    status: 'Pending',
                },
            });
            return { success: true, data: task, isMock: false };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error('Failed to create task:', error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getDealBrief(dealId, req) {
        try {
            const deal = await this.prisma.deal.findFirst({
                where: { id: dealId, tenantid: req.tenantId },
            });
            if (!deal)
                throw new Error('Deal not found');
            const userId = req.userId || 'system-user';
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
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get brief for deal ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getDealWarnings(dealId, req) {
        try {
            const warnings = await this.prisma.dealWarning.findMany({
                where: { dealId, tenantid: req.tenantId },
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
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get warnings for deal ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async resolveWarning(dealId, warningId, body, req) {
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
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to update warning ${warningId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async triggerWarningAction(dealId, warningId) {
        return {
            message: 'Action triggered successfully',
            actionTriggered: true,
            status: 'ok',
        };
    }
    async getDealPlaybook(dealId, req) {
        try {
            const criteria = await this.prisma.dealPlaybook.findMany({
                where: { dealId, tenantid: req.tenantId },
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
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get playbook for deal ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async updatePlaybookCriterion(dealId, criterionId, body, req) {
        try {
            const updated = await this.prisma.dealPlaybook.update({
                where: { id: criterionId },
                data: {
                    status: body.status,
                    ...(body.notes !== undefined ? { notes: body.notes } : {}),
                },
            });
            const criteria = await this.prisma.dealPlaybook.findMany({
                where: { dealId, tenantid: req.tenantId },
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
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to update criterion ${criterionId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getDealActivity(dealId, req) {
        try {
            const events = await this.prisma.dealActivityEvent.findMany({
                where: { dealId, tenantid: req.tenantId },
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
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get activity for deal ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getDealActivityItem(dealId, activityId, req) {
        try {
            const event = await this.prisma.dealActivityEvent.findFirst({
                where: { id: activityId, dealId, tenantid: req.tenantId },
            });
            if (!event)
                throw new Error('Activity event not found');
            return {
                success: true,
                data: {
                    activityId: event.id,
                    date: event.date,
                    type: event.type,
                    duration: event.duration,
                    direction: event.direction,
                    participants: event.participants,
                    notes: event.notes,
                },
                isMock: false,
            };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get activity item ${activityId} for deal ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getDealCrmFields(dealId, req) {
        try {
            const deal = await this.prisma.deal.findFirst({
                where: { id: dealId, tenantid: req.tenantId },
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
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get CRM fields for ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async postDealComment(dealId, body, req) {
        try {
            const commentText = body?.comment?.trim();
            const comment = await this.prisma.dealComment.create({
                data: {
                    tenantid: req.tenantId || FALLBACK_TENANT_ID,
                    dealId,
                    comment: commentText,
                },
            });
            return { success: true, data: comment, isMock: false };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to post comment for deal ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getDealComments(dealId, req) {
        try {
            const comments = await this.prisma.dealComment.findMany({
                where: { dealId, tenantid: req.tenantId },
                orderBy: { createdAt: 'desc' },
            });
            return { success: true, data: comments, isMock: false };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get comments for deal ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async escalateDeal(dealId, req) {
        try {
            const updated = await this.prisma.deal.update({
                where: { id: dealId },
                data: { escalated: true },
            });
            return { success: true, data: { dealId, escalated: true }, isMock: false };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to escalate deal ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async removeEscalation(dealId, req) {
        try {
            const updated = await this.prisma.deal.update({
                where: { id: dealId },
                data: { escalated: false },
            });
            return { success: true, data: { dealId, escalated: false }, isMock: false };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to de-escalate deal ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getEscalationStatus(dealId, req) {
        try {
            const deal = await this.prisma.deal.findFirst({
                where: { id: dealId, tenantid: req.tenantId },
            });
            return { success: true, data: { dealId, escalated: deal?.escalated || false }, isMock: false };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get escalation status for ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getDealTasks(dealId, req) {
        try {
            const tasks = await this.prisma.dealTask.findMany({
                where: { dealId, tenantid: req.tenantId },
                orderBy: { dueDate: 'asc' },
            });
            return { success: true, data: tasks, isMock: false };
        }
        catch (error) {
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get tasks for deal ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getDealById(dealId, req) {
        try {
            const userRole = req.userRole || 'SALES_REP';
            const userId = req.userId;
            const where = { id: dealId, tenantid: req.tenantId };
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
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to get deal by id ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
    async updateDeal(dealId, updates, req) {
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
            if (error && (error instanceof common_1.BadRequestException || error.name === 'BadRequestException'))
                throw error;
            this.logger.error(`Failed to update deal ${dealId}:`, error);
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.DealsController = DealsController;
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({ summary: 'List all deals with pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, type: String }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(m04_dto_1.PaginationQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
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
    (0, common_1.Get)('stage-options'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_a = typeof swagger_1.ApiResponse !== "undefined" && swagger_1.ApiResponse) === "function" ? _a : Object)
], DealsController.prototype, "getStageOptions", null);
__decorate([
    (0, common_1.Get)('forecast-category-options'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_b = typeof swagger_1.ApiResponse !== "undefined" && swagger_1.ApiResponse) === "function" ? _b : Object)
], DealsController.prototype, "getForecastCategoryOptions", null);
__decorate([
    (0, common_1.Get)('notifications'),
    __param(0, (0, common_1.Query)('repName')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Post)('notifications'),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(m04_dto_1.NotificationCreateSchema))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "createNotification", null);
__decorate([
    (0, common_1.Patch)('notifications/read-all'),
    __param(0, (0, common_1.Query)('repName')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "markAllNotificationsRead", null);
__decorate([
    (0, common_1.Post)('tasks'),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(m04_dto_1.DealTaskCreateSchema))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "createDealTask", null);
__decorate([
    (0, common_1.Get)(':dealId/brief'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealBrief", null);
__decorate([
    (0, common_1.Get)(':dealId/warnings'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealWarnings", null);
__decorate([
    (0, common_1.Patch)(':dealId/warnings/:warningId'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('warningId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(m04_dto_1.WarningResolveSchema))),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "resolveWarning", null);
__decorate([
    (0, common_1.Post)(':dealId/warnings/:warningId/action'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('warningId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "triggerWarningAction", null);
__decorate([
    (0, common_1.Get)(':dealId/playbook'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealPlaybook", null);
__decorate([
    (0, common_1.Patch)(':dealId/playbook/criteria/:criterionId'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('criterionId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(m04_dto_1.PlaybookCriterionUpdateSchema))),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "updatePlaybookCriterion", null);
__decorate([
    (0, common_1.Get)(':dealId/activity'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealActivity", null);
__decorate([
    (0, common_1.Get)(':dealId/activity/:activityId'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('activityId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealActivityItem", null);
__decorate([
    (0, common_1.Get)(':dealId/crm-fields'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealCrmFields", null);
__decorate([
    (0, common_1.Post)(':dealId/comments'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(m04_dto_1.DealCommentCreateSchema))),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "postDealComment", null);
__decorate([
    (0, common_1.Get)(':dealId/comments'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealComments", null);
__decorate([
    (0, common_1.Post)(':dealId/escalation'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "escalateDeal", null);
__decorate([
    (0, common_1.Delete)(':dealId/escalation'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "removeEscalation", null);
__decorate([
    (0, common_1.Get)(':dealId/escalation'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getEscalationStatus", null);
__decorate([
    (0, common_1.Get)(':dealId/tasks'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealTasks", null);
__decorate([
    (0, common_1.Get)(':dealId'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "getDealById", null);
__decorate([
    (0, common_1.Patch)(':dealId'),
    __param(0, (0, common_1.Param)('dealId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(m04_dto_1.DealUpdateSchema))),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DealsController.prototype, "updateDeal", null);
exports.DealsController = DealsController = DealsController_1 = __decorate([
    (0, swagger_1.ApiTags)('Deal Management'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/v1/deal-management'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, roles_decorator_1.Roles)('SALES_REP', 'MANAGER', 'ADMIN', 'ANALYST', 'EXECUTIVE'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        deal_summary_service_1.DealSummaryService])
], DealsController);
//# sourceMappingURL=deals.controller.js.map