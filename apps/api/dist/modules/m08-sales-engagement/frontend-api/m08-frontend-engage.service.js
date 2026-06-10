"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M08FrontendEngageService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const nodemailer = __importStar(require("nodemailer"));
let M08FrontendEngageService = class M08FrontendEngageService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validateTaskAccess(tenantId, taskId, userId, userRole) {
        const task = await this.prisma.engageTask.findFirst({
            where: { tenantId, taskId },
        });
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        const isRep = userRole === 'SALES_REP' || userRole === 'sales_rep';
        if (isRep && task.assigneeId !== userId) {
            throw new common_1.ForbiddenException('Forbidden resource');
        }
        return task;
    }
    async getTasks(tenantId, userId, userRole) {
        const whereClause = { tenantId };
        whereClause.taskId = {
            notIn: [
                'task-001', 'task-002', 'task-003', 'task-004', 'task-005',
                'task_001', 'task_002', 'task_003', 'task_004', 'task_005',
                'task_006', 'task_007', 'task_008', 'task_014', 'task_015'
            ]
        };
        if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
            whereClause.assigneeId = userId;
        }
        const dbTasks = await this.prisma.engageTask.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });
        return dbTasks.map((t) => ({
            taskId: t.taskId,
            contactId: t.contactId || '',
            contactName: t.contactName,
            company: t.companyName,
            channelType: t.channel.toUpperCase(),
            sequenceName: t.sequenceName || '',
            sequenceStep: t.sequenceStep || '',
            scheduledTime: t.scheduledTime || '',
            dueDateTime: t.dueDateTime || '',
            interactionCount: t.interactionCount,
            priority: t.priority.toUpperCase(),
            status: t.status.toUpperCase(),
            isOverdue: t.isOverdue,
            isAtRisk: t.isAtRisk,
            snoozedUntil: t.snoozedUntil,
        }));
    }
    async getTaskSummary(tenantId, userId, userRole) {
        const whereClause = { tenantId };
        whereClause.taskId = {
            notIn: [
                'task-001', 'task-002', 'task-003', 'task-004', 'task-005',
                'task_001', 'task_002', 'task_003', 'task_004', 'task_005',
                'task_006', 'task_007', 'task_008', 'task_014', 'task_015'
            ]
        };
        if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
            whereClause.assigneeId = userId;
        }
        const tasks = await this.prisma.engageTask.findMany({
            where: whereClause,
        });
        const now = new Date();
        const isCurrentlySnoozed = (t) => {
            if (!t.snoozedUntil)
                return false;
            return new Date(t.snoozedUntil) > now;
        };
        const activeTasks = tasks.filter((t) => !isCurrentlySnoozed(t));
        const snoozedCount = tasks.filter((t) => isCurrentlySnoozed(t)).length;
        const totalTasksToday = activeTasks.filter((t) => t.status !== 'COMPLETED').length;
        const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
        const inProgressCount = activeTasks.filter((t) => t.status === 'IN_PROGRESS').length;
        const upcomingCount = activeTasks.filter((t) => t.status === 'PENDING').length;
        const atRiskCount = activeTasks.filter((t) => t.isAtRisk && t.status !== 'COMPLETED').length;
        const dueTodayCount = activeTasks.filter((t) => t.status !== 'COMPLETED').length;
        const highPriorityCount = activeTasks.filter((t) => t.priority === 'HIGH' && t.status !== 'COMPLETED').length;
        const total = completedCount + upcomingCount + inProgressCount;
        const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        return {
            totalTasksToday,
            completedCount,
            inProgressCount,
            upcomingCount,
            atRiskCount,
            dueTodayCount,
            highPriorityCount,
            progressPercent,
            snoozedCount,
        };
    }
    async getRecentActivity(tenantId, limit, userId, userRole) {
        const where = { tenantId };
        if (userRole === 'sales_rep' && userId) {
            where.userId = userId;
        }
        const activities = await this.prisma.engageActivity.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
        return activities.map((a) => ({
            activityId: a.activityId,
            contactId: a.contactId || '',
            contactName: a.contactName,
            company: a.company || '',
            channelType: a.channelType,
            summary: a.summary,
            occurredAt: a.occurredAt,
            timeAgoLabel: a.timeAgoLabel || '',
        }));
    }
    async getTaskDetail(tenantId, taskId, userId, userRole) {
        const where = { tenantId, taskId };
        if (userRole === 'sales_rep' && userId) {
            where.assigneeId = userId;
        }
        const t = await this.prisma.engageTask.findFirst({
            where,
        });
        if (!t)
            return null;
        return {
            taskId: t.taskId,
            taskTitle: t.title,
            contactId: t.contactId || '',
            contactName: t.contactName,
            company: t.companyName,
            arrValue: t.arr || '',
            scheduledDateTime: t.dueDateTime || '',
            aiInsight: t.aiInsight || '',
            recommendedNextSteps: t.recommendedNextSteps || [],
            recentActivity: t.recentActivity || [],
            existingNotes: t.notes || '',
            snoozedUntil: t.snoozedUntil,
        };
    }
    async getContactDetails(tenantId, contactId, userId, userRole) {
        const c = await this.prisma.engageContact.findFirst({
            where: { tenantId, contactId },
        });
        if (!c)
            return null;
        return {
            contactId: c.contactId,
            contactName: c.contactName,
            jobTitle: c.jobTitle || '',
            company: c.company || '',
            phone: c.phone || '',
            email: c.email || '',
            linkedInUrl: c.linkedInUrl || '',
            engagementTimeline: c.engagementTimeline || [],
            accountInfo: c.accountInfo || {},
            dealInfo: c.dealInfo || {},
        };
    }
    async getEmailDraft(tenantId, taskId, userId, userRole) {
        const where = { tenantId, taskId };
        if (userRole === 'sales_rep' && userId) {
            where.assigneeId = userId;
        }
        const d = await this.prisma.emailDraft.findFirst({
            where,
        });
        if (!d)
            return null;
        return {
            taskId: d.taskId,
            contactName: d.contactName || '',
            contactEmail: d.contactEmail || '',
            fromEmail: d.fromEmail || '',
            fromLabel: d.fromLabel || '',
            subject: d.subject,
            bodyHtml: d.bodyHtml,
        };
    }
    async getLinkedInDraft(tenantId, taskId, userId, userRole) {
        const where = { tenantId, taskId };
        if (userRole === 'sales_rep' && userId) {
            where.assigneeId = userId;
        }
        const t = await this.prisma.engageTask.findFirst({
            where,
        });
        if (!t)
            return null;
        const contact = await this.prisma.engageContact.findFirst({
            where: { tenantId, contactId: t.contactId || '' },
        });
        const recentAct = t.recentActivity;
        const mutualConnections = t.mutualConnections || 5;
        return {
            taskId: t.taskId,
            contactId: t.contactId || '',
            contactName: t.contactName,
            contactTitle: contact?.jobTitle || '',
            contactCompany: t.companyName,
            linkedInProfileUrl: contact?.linkedInUrl || 'https://linkedin.com',
            mutualConnections,
            messageScript: t.messageScript || `Hi ${t.contactName},\n\nI noticed we share several mutual connections and wanted to connect.\n\nBest,\nAlex`,
            sequenceName: t.sequenceName || '',
            sequenceStep: t.sequenceStep || '',
            dueDateTime: t.dueDateTime || '',
        };
    }
    async getFilterOptions(tenantId) {
        const templates = await this.prisma.emailTemplate.findMany({
            where: { tenantId },
        });
        const flowNames = Array.from(new Set(templates.map((t) => t.category).filter(Boolean))).map((cat) => ({
            flowId: `flow_${cat}`,
            flowName: cat,
        }));
        return {
            flowNames: flowNames.length ? flowNames : [{ flowId: 'flow-001', flowName: 'General Outreach' }],
            crmFields: {
                account: [
                    { fieldId: 'a-001', fieldLabel: 'Industry', fieldType: 'DROPDOWN', options: ['Technology', 'FinTech', 'SaaS'] },
                    { fieldId: 'a-002', fieldLabel: 'ARR', fieldType: 'NUMBER' },
                ],
                contact: [
                    { fieldId: 'c-001', fieldLabel: 'Job Title', fieldType: 'TEXT' },
                ],
            },
        };
    }
    async getEmailTemplates(tenantId) {
        const templates = await this.prisma.emailTemplate.findMany({
            where: { tenantId },
        });
        return templates.map((t) => ({
            templateId: t.templateId,
            templateName: t.templateName,
            subject: t.subject,
            bodyHtml: t.bodyHtml,
            category: t.category || '',
        }));
    }
    async createTask(tenantId, body, userId, userRole) {
        const taskId = `task_${Date.now()}`;
        let assigneeId = body.assigneeId;
        if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
            assigneeId = userId;
        }
        else if (!assigneeId || assigneeId === 'me') {
            assigneeId = userId;
        }
        if (!assigneeId || assigneeId === 'me') {
            assigneeId = userId;
        }
        let assigneeName = body.assigneeName || 'Unknown';
        let assigneeRole = body.assigneeRole || 'Account Executive';
        if (assigneeId) {
            try {
                const user = await this.prisma.user.findUnique({
                    where: { id: assigneeId },
                });
                if (user) {
                    assigneeName = user.name;
                    assigneeRole = user.role === 'MANAGER' ? 'Team Lead' : 'Account Executive';
                }
            }
            catch {
            }
        }
        const newTask = await this.prisma.engageTask.create({
            data: {
                tenantId,
                taskId,
                title: body.title,
                contactName: body.contactName || 'New Contact',
                companyName: body.companyName || 'New Company',
                channel: ((body.channel || body.taskType || 'CUSTOM')).toUpperCase(),
                status: 'PENDING',
                dueDate: body.dueDate || new Date().toISOString().split('T')[0],
                dueTime: body.dueTime || null,
                scheduledTime: body.dueTime || null,
                dueDateTime: body.dueDate ? `${body.dueDate}T${body.dueTime || '00:00:00'}` : new Date().toISOString(),
                priority: (body.priority || 'NORMAL').toUpperCase(),
                assigneeId,
                assigneeName,
                assigneeRole,
                todoType: body.todoType || 'manual',
                entityType: body.entityType || 'lead',
                interactionCount: 0,
                isOverdue: false,
                isAtRisk: false,
                recommendedNextSteps: body.recommendedNextSteps || [],
            },
        });
        return {
            status: 'success',
            data: {
                taskId: newTask.taskId,
                status: newTask.status,
                createdAt: newTask.createdAt.toISOString(),
            },
        };
    }
    async updateTask(tenantId, taskId, body, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        const updated = await this.prisma.engageTask.update({
            where: { taskId },
            data: body,
        });
        return { status: 'success', data: updated };
    }
    async saveNotes(tenantId, taskId, notes, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        const updated = await this.prisma.engageTask.update({
            where: { taskId },
            data: { notes },
        });
        return { status: 'success', data: updated };
    }
    async getNotes(tenantId, taskId, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        const t = await this.prisma.engageTask.findFirst({
            where: { tenantId, taskId },
        });
        if (!t || !t.notes)
            return [];
        return [
            {
                noteId: `note_${t.taskId}`,
                note: t.notes,
                authorName: t.assigneeName || 'Alex Morgan',
                createdAt: t.updatedAt?.toISOString() || new Date().toISOString(),
            },
        ];
    }
    async sendEmail(tenantId, taskId, body, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        const t = await this.prisma.engageTask.update({
            where: { taskId },
            data: { status: 'COMPLETED' },
        });
        const host = process.env.SMTP_HOST;
        const port = Number(process.env.SMTP_PORT || 587);
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const from = process.env.SMTP_FROM || user;
        if (!host || !user || !pass) {
            throw new common_1.BadRequestException('SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS) is missing in .env');
        }
        const toEmail = body.to || body.contactEmail || '';
        if (!toEmail) {
            throw new common_1.BadRequestException('Recipient email address ("to") is required');
        }
        try {
            const transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass },
            });
            await transporter.sendMail({
                from: `"${(from || '').split('@')[0]}" <${from}>`,
                to: toEmail,
                subject: body.subject || 'Outreach',
                text: body.body || body.text || '',
                html: body.bodyHtml || body.body || body.html || '',
            });
        }
        catch (err) {
            console.error('SMTP sending failed:', err);
            throw new common_1.InternalServerErrorException(`SMTP sending failed: ${err.message || err}`);
        }
        await this.prisma.engageActivity.create({
            data: {
                tenantId,
                activityId: `act_${Date.now()}`,
                contactName: t.contactName,
                company: t.companyName,
                channelType: 'EMAIL',
                summary: `Sent email: ${body.subject || 'Outreach'}`,
                occurredAt: new Date().toISOString(),
                timeAgoLabel: 'Just now',
            },
        });
        return { status: 'success', data: { ok: true } };
    }
    async saveDraft(tenantId, taskId, body, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        const draft = await this.prisma.emailDraft.upsert({
            where: { taskId },
            update: {
                subject: body.subject,
                bodyHtml: body.bodyHtml || body.body || '',
                contactName: body.contactName,
                contactEmail: body.contactEmail,
                fromEmail: body.fromEmail,
                fromLabel: body.fromLabel,
            },
            create: {
                tenantId,
                taskId,
                subject: body.subject,
                bodyHtml: body.bodyHtml || body.body || '',
                contactName: body.contactName,
                contactEmail: body.contactEmail,
                fromEmail: body.fromEmail,
                fromLabel: body.fromLabel,
            },
        });
        return { status: 'success', data: draft };
    }
    async rephraseEmail(tenantId, taskId, body, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        const text = body.bodyHtml || body.body || '';
        const rephrasedBody = text
            ? `${text}\n\n[AI Rephrased: Clearer, more concise call-to-action added.]`
            : 'Hi Sarah,\n\nFollowing up on our Q2 renewal. Let me know if you would like to run through the ROI projections.\n\nBest,\nAlex';
        return {
            status: 'success',
            data: {
                rephrasedBody,
            },
        };
    }
    async markComplete(tenantId, taskId, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        await this.prisma.engageTask.update({
            where: { taskId },
            data: { status: 'COMPLETED' },
        });
        return { status: 'success', data: { ok: true } };
    }
    async skipTask(tenantId, taskId, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        await this.prisma.engageTask.update({
            where: { taskId },
            data: { status: 'COMPLETED' },
        });
        return { status: 'success', data: { ok: true, action: 'skipped' } };
    }
    async dismissTask(tenantId, taskId, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        await this.prisma.engageTask.update({
            where: { taskId },
            data: { status: 'COMPLETED' },
        });
        return { status: 'success', data: { ok: true, action: 'dismissed' } };
    }
    async reassignTask(tenantId, taskId, newAssigneeId, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        const user = await this.prisma.user.findUnique({
            where: { id: newAssigneeId },
        });
        const updated = await this.prisma.engageTask.update({
            where: { taskId },
            data: {
                assigneeId: newAssigneeId,
                assigneeName: user?.name || 'Unknown User',
                assigneeRole: user?.role === 'MANAGER' ? 'Team Lead' : 'Account Executive',
            },
        });
        return { status: 'success', data: updated };
    }
};
exports.M08FrontendEngageService = M08FrontendEngageService;
exports.M08FrontendEngageService = M08FrontendEngageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], M08FrontendEngageService);
//# sourceMappingURL=m08-frontend-engage.service.js.map