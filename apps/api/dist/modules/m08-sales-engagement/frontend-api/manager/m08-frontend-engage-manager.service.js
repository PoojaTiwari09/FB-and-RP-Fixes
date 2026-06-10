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
exports.M08FrontendEngageManagerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const nodemailer = __importStar(require("nodemailer"));
let M08FrontendEngageManagerService = class M08FrontendEngageManagerService {
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
    async fetchTasks(tenantId, query, userId, userRole) {
        let targetAssigneeId = query.assigneeId;
        if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
            targetAssigneeId = userId;
        }
        else if (targetAssigneeId === 'me') {
            targetAssigneeId = userId;
        }
        const whereClause = { tenantId };
        if (targetAssigneeId && targetAssigneeId !== 'all') {
            whereClause.assigneeId = targetAssigneeId;
        }
        const tasks = await this.prisma.engageTask.findMany({
            where: whereClause,
        });
        let list = tasks;
        const todayStr = query.date;
        const now = new Date();
        const isCurrentlySnoozed = (t) => {
            if (!t.snoozedUntil)
                return false;
            return new Date(t.snoozedUntil) > now;
        };
        const getCounts = (taskList) => ({
            today: taskList.filter((t) => ((t.dueDate && t.dueDate <= todayStr) || t.priority.toUpperCase() === 'HIGH') && t.status.toLowerCase() !== 'completed' && !isCurrentlySnoozed(t)).length,
            inProgress: taskList.filter((t) => t.status.toLowerCase() === 'in_progress' && !isCurrentlySnoozed(t)).length,
            upcoming: taskList.filter((t) => t.dueDate && t.dueDate > todayStr && t.priority.toUpperCase() !== 'HIGH' && t.status.toLowerCase() !== 'completed' && !isCurrentlySnoozed(t)).length,
            completed: taskList.filter((t) => t.status.toLowerCase() === 'completed').length,
            snoozed: taskList.filter((t) => isCurrentlySnoozed(t)).length,
        });
        let channelFilteredList = list;
        if (query.channel && query.channel !== 'all') {
            channelFilteredList = list.filter((t) => t.channel.toLowerCase() === query.channel?.toLowerCase());
        }
        const tabCounts = getCounts(channelFilteredList);
        const currentTab = query.tab || 'today';
        switch (currentTab) {
            case 'today':
                list = channelFilteredList.filter((t) => ((t.dueDate && t.dueDate <= todayStr) || t.priority.toUpperCase() === 'HIGH') && t.status.toLowerCase() !== 'completed' && !isCurrentlySnoozed(t));
                break;
            case 'inProgress':
                list = channelFilteredList.filter((t) => t.status.toLowerCase() === 'in_progress' && !isCurrentlySnoozed(t));
                break;
            case 'upcoming':
                list = channelFilteredList.filter((t) => t.dueDate && t.dueDate > todayStr && t.priority.toUpperCase() !== 'HIGH' && t.status.toLowerCase() !== 'completed' && !isCurrentlySnoozed(t));
                break;
            case 'completed':
                list = channelFilteredList.filter((t) => t.status.toLowerCase() === 'completed');
                break;
            case 'snoozed':
                list = channelFilteredList.filter((t) => isCurrentlySnoozed(t));
                break;
            default:
                list = channelFilteredList;
        }
        if (query.search?.trim()) {
            const q = query.search.toLowerCase();
            list = list.filter((t) => String(t.title).toLowerCase().includes(q) ||
                String(t.contactName).toLowerCase().includes(q) ||
                String(t.companyName).toLowerCase().includes(q));
        }
        const sorted = [...list];
        const sortBy = query.sortBy || 'due_date';
        if (sortBy === 'priority') {
            const order = { HIGH: 0, NORMAL: 1, LOW: 2 };
            sorted.sort((a, b) => (order[String(a.priority).toUpperCase()] ?? 1) - (order[String(b.priority).toUpperCase()] ?? 1));
        }
        else if (sortBy === 'recent_activity') {
            sorted.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
        }
        else {
            sorted.sort((a, b) => {
                const d = String(a.dueDate).localeCompare(String(b.dueDate));
                return d !== 0 ? d : String(a.dueTime || '').localeCompare(String(b.dueTime || ''));
            });
        }
        const page = query.page || 1;
        const size = query.size || 50;
        const total = sorted.length;
        const totalPages = Math.ceil(total / size) || 1;
        const pagedTasks = sorted.slice((page - 1) * size, page * size);
        const atRisk = pagedTasks.filter((t) => t.aiSignalType === 'risk').length;
        const dueToday = pagedTasks.filter((t) => t.dueDate === todayStr).length;
        const groups = [];
        const highPriority = pagedTasks.filter((t) => t.priority.toUpperCase() === 'HIGH');
        const normalPriority = pagedTasks.filter((t) => t.priority.toUpperCase() !== 'HIGH');
        const mapTask = (t) => ({
            id: t.taskId,
            title: t.title,
            contactName: t.contactName,
            companyName: t.companyName,
            channel: t.channel.toLowerCase(),
            scheduledTime: t.scheduledTime || '',
            dueDateTime: t.dueDateTime || '',
            isOverdue: t.isOverdue,
            isAtRisk: t.isAtRisk,
            interactionCount: t.interactionCount,
            priority: t.priority.toLowerCase(),
            status: t.status.toLowerCase(),
            dueDate: t.dueDate,
            dueTime: t.dueTime || '',
            assigneeId: t.assigneeId || 'me',
            assigneeName: t.assigneeName || 'Alex Morgan',
            assigneeRole: t.assigneeRole || 'Account Executive',
            arr: t.arr || '',
            todoType: t.todoType || 'manual',
            entityType: t.entityType || 'lead',
            workflowName: t.workflowName || '',
            workflowStep: t.workflowStep ? parseInt(t.workflowStep, 10) : undefined,
            totalWorkflowSteps: t.totalWorkflowSteps || undefined,
            aiSignal: t.aiSignal || '',
            aiSignalType: t.aiSignalType || '',
            snoozedUntil: t.snoozedUntil,
        });
        if (highPriority.length) {
            groups.push({ groupLabel: 'High Priority', count: highPriority.length, tasks: highPriority.map(mapTask) });
        }
        if (normalPriority.length || !highPriority.length) {
            groups.push({ groupLabel: 'All Tasks', count: normalPriority.length, tasks: normalPriority.map(mapTask) });
        }
        const normalizedTabCounts = {
            today: tabCounts.today,
            inProgress: tabCounts.inProgress,
            upcoming: tabCounts.upcoming,
            completed: tabCounts.completed,
            snooze: tabCounts.snoozed,
        };
        return {
            status: 'success',
            data: {
                groups,
                tabCounts: normalizedTabCounts,
                statusPills: { atRisk, dueToday },
                pagination: {
                    page,
                    size,
                    total,
                    totalPages,
                },
            },
        };
    }
    async fetchSummary(tenantId, assigneeId, date, userId, userRole) {
        let targetAssigneeId = assigneeId;
        if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
            targetAssigneeId = userId;
        }
        else if (targetAssigneeId === 'me') {
            targetAssigneeId = userId;
        }
        const whereClause = { tenantId };
        if (targetAssigneeId && targetAssigneeId !== 'all') {
            whereClause.assigneeId = targetAssigneeId;
        }
        const tasks = await this.prisma.engageTask.findMany({
            where: whereClause,
        });
        const list = tasks;
        const now = new Date();
        const isCurrentlySnoozed = (t) => {
            if (!t.snoozedUntil)
                return false;
            return new Date(t.snoozedUntil) > now;
        };
        const activeList = list.filter((t) => !isCurrentlySnoozed(t));
        const todayTasks = activeList.filter((t) => t.dueDate === date);
        const completedToday = todayTasks.filter((t) => t.status.toLowerCase() === 'completed').length;
        const totalToday = todayTasks.length;
        const highPriorityRemaining = todayTasks.filter((t) => t.priority.toUpperCase() === 'HIGH' && t.status.toLowerCase() !== 'completed').length;
        const atRisk = activeList.filter((t) => t.isAtRisk && t.status.toLowerCase() !== 'completed').length;
        const completionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
        return {
            status: 'success',
            data: {
                totalToday,
                completedToday,
                atRisk,
                dueToday: totalToday,
                highPriorityRemaining,
                completionPercentage,
                headerAlert: `${highPriorityRemaining} high-priority deals need attention today — ${atRisk} at risk of slipping`,
            },
        };
    }
    async fetchTeamMembers(tenantId) {
        const users = await this.prisma.user.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
        });
        const members = users.map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role === 'MANAGER' ? 'Team Lead' : 'Account Executive',
        }));
        return { status: 'success', data: members };
    }
    async fetchRecentActivity(tenantId) {
        const activities = await this.prisma.engageActivity.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
        return {
            status: 'success',
            data: activities.map((a) => ({
                id: a.activityId,
                contactName: a.contactName,
                companyName: a.company || '',
                activityType: a.channelType.toLowerCase(),
                description: a.summary,
                timeAgo: a.timeAgoLabel || '1h ago',
            })),
        };
    }
    async fetchFiltersConfig(tenantId) {
        return {
            status: 'success',
            data: {
                flows: [
                    'Enterprise Outbound Q2 2026',
                    'Mid-Market Follow-up',
                    'Social Selling Campaign',
                ],
                entityTypes: ['account', 'deal', 'lead'],
                localTimes: ['morning', 'business_hours', 'custom'],
            },
        };
    }
    async fetchTaskDetail(tenantId, taskId, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        const t = await this.prisma.engageTask.findFirst({
            where: { tenantId, taskId },
        });
        if (!t)
            throw new common_1.NotFoundException('Task not found');
        return {
            status: 'success',
            data: {
                id: t.taskId,
                title: t.title,
                contactName: t.contactName,
                companyName: t.companyName,
                channel: t.channel.toLowerCase(),
                scheduledTime: t.scheduledTime || '',
                dueDateTime: t.dueDateTime || '',
                isOverdue: t.isOverdue,
                isAtRisk: t.isAtRisk,
                interactionCount: t.interactionCount,
                priority: t.priority.toLowerCase(),
                status: t.status.toLowerCase(),
                dueDate: t.dueDate,
                dueTime: t.dueTime || '',
                assigneeId: t.assigneeId || 'me',
                assigneeName: t.assigneeName || 'Alex Morgan',
                assigneeRole: t.assigneeRole || 'Account Executive',
                arr: t.arr || '',
                todoType: t.todoType || 'manual',
                entityType: t.entityType || 'lead',
                workflowName: t.workflowName || '',
                workflowStep: t.workflowStep ? parseInt(t.workflowStep, 10) : undefined,
                totalWorkflowSteps: t.totalWorkflowSteps || undefined,
                aiSignal: t.aiSignal || '',
                aiSignalType: t.aiSignalType || '',
                aiInsight: t.aiInsight || '',
                recommendedNextSteps: t.recommendedNextSteps || [],
                recentActivity: t.recentActivity || [],
                notes: t.notes || '',
            },
        };
    }
    async fetchEmailDraft(tenantId, taskId, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        const d = await this.prisma.emailDraft.findFirst({
            where: { tenantId, taskId },
        });
        if (!d) {
            return {
                status: 'success',
                data: {
                    to: 'client@company.com',
                    fromOptions: ['alex.morgan@relanto.ai (Gmail)'],
                    subject: 'Outreach Follow-up',
                    body: 'Hi, following up on our connection.',
                },
            };
        }
        return {
            status: 'success',
            data: {
                to: d.contactEmail || '',
                fromOptions: d.fromLabel ? [d.fromLabel] : ['alex.morgan@relanto.ai (Gmail)'],
                subject: d.subject,
                body: d.bodyHtml,
            },
        };
    }
    async fetchLinkedInScript(tenantId, taskId, userId, userRole) {
        const t = await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        const contact = await this.prisma.engageContact.findFirst({
            where: { tenantId, contactId: t.contactId || '' },
        });
        return {
            status: 'success',
            data: {
                messageScript: t.messageScript || 'Hi, would love to connect.',
                mutualConnections: t.mutualConnections || 5,
                linkedInProfileUrl: contact?.linkedInUrl || 'https://linkedin.com',
            },
        };
    }
    async fetchContactDetail(tenantId, contactId) {
        const c = await this.prisma.engageContact.findFirst({
            where: { tenantId, contactId },
        });
        if (!c)
            throw new common_1.NotFoundException('Contact not found');
        return {
            status: 'success',
            data: {
                id: c.contactId,
                name: c.contactName,
                role: c.jobTitle || '',
                companyName: c.company || '',
            },
        };
    }
    async searchLinkedEntities(tenantId, search) {
        const contacts = await this.prisma.engageContact.findMany({
            where: { tenantId },
        });
        const list = contacts.map((c) => ({
            id: c.contactId,
            name: c.contactName,
            type: 'contact',
            subLabel: `${c.jobTitle || 'Executive'} · ${c.company || 'Company'}`,
        }));
        const q = search.toLowerCase();
        const filtered = list.filter((i) => i.name.toLowerCase().includes(q) || i.subLabel.toLowerCase().includes(q));
        return {
            status: 'success',
            data: {
                results: filtered,
            },
        };
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
        return {
            status: 'success',
            data: {
                taskId: updated.taskId,
                assigneeId: updated.assigneeId,
                assigneeName: updated.assigneeName,
                assigneeRole: updated.assigneeRole,
                updatedAt: updated.updatedAt.toISOString(),
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
        return {
            status: 'success',
            data: {
                taskId,
                status: 'completed',
                action: 'skipped',
                updatedAt: new Date().toISOString(),
            },
        };
    }
    async dismissTask(tenantId, taskId, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        await this.prisma.engageTask.update({
            where: { taskId },
            data: { status: 'COMPLETED' },
        });
        return {
            status: 'success',
            data: {
                taskId,
                status: 'completed',
                action: 'dismissed',
                updatedAt: new Date().toISOString(),
            },
        };
    }
    async logAction(tenantId, taskId, action, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        return {
            status: 'success',
            data: {
                taskId,
                action,
                loggedAt: new Date().toISOString(),
            },
        };
    }
    async emailTemplates(tenantId) {
        const templates = await this.prisma.emailTemplate.findMany({
            where: { tenantId },
        });
        const mapped = templates.map((t) => ({
            id: t.templateId,
            name: t.templateName,
            subject: t.subject,
            body: t.bodyHtml,
        }));
        return {
            status: 'success',
            data: {
                templates: mapped.length ? mapped : [],
            },
        };
    }
    async saveNotes(tenantId, taskId, notes, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        await this.prisma.engageTask.update({
            where: { taskId },
            data: { notes },
        });
        return { status: 'success', data: { ok: true } };
    }
    async saveDraft(tenantId, taskId, body, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        const draft = await this.prisma.emailDraft.upsert({
            where: { taskId },
            update: {
                subject: body.subject,
                bodyHtml: body.body || body.bodyHtml || '',
                contactName: body.contactName,
                contactEmail: body.contactEmail,
                fromEmail: body.fromEmail,
                fromLabel: body.fromLabel,
            },
            create: {
                tenantId,
                taskId,
                subject: body.subject,
                bodyHtml: body.body || body.bodyHtml || '',
                contactName: body.contactName,
                contactEmail: body.contactEmail,
                fromEmail: body.fromEmail,
                fromLabel: body.fromLabel,
            },
        });
        return { status: 'success', data: draft };
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
        try {
            const transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: {
                    user,
                    pass,
                },
            });
            await transporter.sendMail({
                from: `"${from.split('@')[0]}" <${from}>`,
                to: body.to || body.contactEmail || t.contactName,
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
    async rephraseEmail(tenantId, taskId, body, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        const text = body.body || body.bodyHtml || '';
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
    async updateTask(tenantId, taskId, body, userId, userRole) {
        await this.validateTaskAccess(tenantId, taskId, userId, userRole);
        const updated = await this.prisma.engageTask.update({
            where: { taskId },
            data: body,
        });
        return { status: 'success', data: updated };
    }
};
exports.M08FrontendEngageManagerService = M08FrontendEngageManagerService;
exports.M08FrontendEngageManagerService = M08FrontendEngageManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], M08FrontendEngageManagerService);
//# sourceMappingURL=m08-frontend-engage-manager.service.js.map