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
Object.defineProperty(exports, "__esModule", { value: true });
exports.M08SalesEngagementService = void 0;
const common_1 = require("@nestjs/common");
const m08_repository_1 = require("../repositories/m08.repository");
const event_publisher_service_1 = require("../../platform-core/events/event-publisher.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let M08SalesEngagementService = class M08SalesEngagementService {
    repo;
    events;
    queue;
    constructor(repo, events, queue) {
        this.repo = repo;
        this.events = events;
        this.queue = queue;
    }
    async getPlays(tenantId) {
        return this.repo.findPlays(tenantId);
    }
    async getPlayById(tenantId, playId) {
        return this.repo.findPlayById(tenantId, playId);
    }
    async createPlay(dto, tenantId, userId) {
        const play = await this.repo.createPlay(tenantId, userId, dto);
        await this.events.publish('play.created', {
            playId: play.id,
            tenantId,
            name: play.name,
            createdBy: userId,
        });
        return play;
    }
    async updatePlay(playId, dto, tenantId) {
        return this.repo.updatePlay(tenantId, playId, dto);
    }
    async clonePlay(playId, tenantId, userId) {
        const cloned = await this.repo.clonePlay(tenantId, playId, userId);
        await this.events.publish('play.created', {
            playId: cloned.id,
            tenantId,
            name: cloned.name,
            createdBy: userId,
            clonedFrom: playId,
        });
        return cloned;
    }
    async deactivatePlay(playId, tenantId) {
        return this.repo.deactivatePlay(tenantId, playId);
    }
    async enrollOpportunity(dto, tenantId) {
        if (dto.triggerEventId) {
            const existing = await this.repo.checkIdempotency(tenantId, dto.playId, dto.dealId, dto.triggerEventId);
            if (existing) {
                console.warn(`[Duplicate Enrollment Skipped] Play ${dto.playId} is already active for deal ${dto.dealId} under event ${dto.triggerEventId}`);
                return existing;
            }
        }
        const enrollment = await this.repo.createEnrollment(tenantId, dto.playId, dto.dealId, dto.userId, dto.triggerEventId);
        await this.repo.logAdherence(tenantId, enrollment.id, dto.userId, dto.playId, 0.0);
        await this.events.publish('play.activated', {
            enrollmentId: enrollment.id,
            tenantId,
            playId: dto.playId,
            dealId: dto.dealId,
            userId: dto.userId,
            status: enrollment.status,
        });
        await this.triggerOutreachAlerts(tenantId, enrollment.id, 'enrolled');
        return enrollment;
    }
    async getEnrollments(tenantId, filters) {
        return this.repo.findEnrollments(tenantId, filters);
    }
    async getEnrollmentById(tenantId, enrollmentId) {
        return this.repo.findEnrollmentById(tenantId, enrollmentId);
    }
    async completeStep(enrollmentId, dto, tenantId, userId) {
        const updated = await this.repo.completeStep(tenantId, enrollmentId, dto.stepId, userId, dto.notes);
        const totalSteps = updated.play.steps.length;
        const completedSteps = updated.completions.length;
        const score = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 100;
        await this.repo.logAdherence(tenantId, enrollmentId, updated.userId, updated.playId, score);
        await this.events.publish('play.step.completed', {
            enrollmentId,
            tenantId,
            stepId: dto.stepId,
            completedBy: userId,
            adherenceScore: score,
        });
        await this.events.publish('adherence.updated', {
            enrollmentId,
            tenantId,
            userId: updated.userId,
            adherenceScore: score,
        });
        if (updated.status === 'completed') {
            await this.events.publish('play.completed', {
                enrollmentId,
                tenantId,
                playId: updated.playId,
                dealId: updated.dealId,
                completedAt: new Date(),
            });
        }
        return updated;
    }
    async skipStep(enrollmentId, dto, tenantId, userId) {
        const updated = await this.repo.skipStep(tenantId, enrollmentId, dto.stepId, userId, dto.reason);
        const totalSteps = updated.play.steps.length;
        const completedSteps = updated.completions.length;
        const score = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 100;
        await this.repo.logAdherence(tenantId, enrollmentId, updated.userId, updated.playId, score);
        await this.events.publish('play.step.skipped', {
            enrollmentId,
            tenantId,
            stepId: dto.stepId,
            skippedBy: userId,
            reason: dto.reason,
            adherenceScore: score,
        });
        await this.events.publish('adherence.updated', {
            enrollmentId,
            tenantId,
            userId: updated.userId,
            adherenceScore: score,
        });
        if (updated.status === 'completed') {
            await this.events.publish('play.completed', {
                enrollmentId,
                tenantId,
                playId: updated.playId,
                dealId: updated.dealId,
                completedAt: new Date(),
            });
        }
        return updated;
    }
    async addNote(enrollmentId, dto, tenantId, userId) {
        return this.repo.createNote(tenantId, enrollmentId, userId, dto.noteText);
    }
    async getAdoptionDashboard(tenantId) {
        return this.repo.getAdoptionAnalytics(tenantId);
    }
    async getRepDashboard(tenantId) {
        return this.repo.getRepLeaderboard(tenantId);
    }
    async getPlayDashboard(tenantId) {
        return this.repo.getPlayAnalytics(tenantId);
    }
    async evaluateTriggers(eventType, payload, tenantId) {
        console.log(`[Trigger Engine] Evaluating rules for consumed event: ${eventType} in tenant ${tenantId}`);
        const matchingPlays = await this.repo.findActivePlaysForTrigger(tenantId, eventType);
        for (const play of matchingPlays) {
            const conditions = play.triggerConditions || [];
            let isMatch = true;
            for (const cond of conditions) {
                if (cond.eventType !== eventType)
                    continue;
                const val = payload[cond.field];
                if (cond.operator === 'equals' && String(val) !== String(cond.value)) {
                    isMatch = false;
                    break;
                }
                if (cond.operator === 'contains' && (!val || !String(val).includes(cond.value))) {
                    isMatch = false;
                    break;
                }
            }
            if (isMatch) {
                console.log(`[Trigger Match Success] Auto-enrolling Deal ${payload.dealId} into Playbook "${play.name}"`);
                await this.queue.add('process-auto-enrollment', {
                    tenantId,
                    playId: play.id,
                    dealId: payload.dealId,
                    userId: payload.ownerId || payload.userId || '00000000-0000-0000-0000-000000000000',
                    triggerEventId: payload.eventId || '00000000-0000-0000-0000-000000000000',
                }, {
                    attempts: 3,
                    backoff: 5000,
                    removeOnComplete: true,
                });
            }
        }
    }
    async fetchManagerTasks(tenantId, query, userId, userRole) {
        let targetAssigneeId = query.assigneeId;
        if (userRole === 'SALES_REP' || userRole === 'sales_rep') {
            targetAssigneeId = userId;
        }
        else if (targetAssigneeId === 'me') {
            targetAssigneeId = userId;
        }
        const whereClause = { tenantid: tenantId };
        if (targetAssigneeId && targetAssigneeId !== 'all') {
            whereClause.userId = targetAssigneeId;
        }
        const rawTasks = await this.repo.prisma.task.findMany({ where: whereClause });
        const todayStr = query.date || new Date().toISOString().split('T')[0];
        const mappedTasks = rawTasks.map((t) => ({
            id: t.id,
            title: t.description || 'Task',
            contactName: 'Unknown Contact',
            companyName: 'Unknown Company',
            channel: t.type || 'custom',
            scheduledTime: '',
            dueDateTime: t.dueDate ? t.dueDate.toISOString() : '',
            isOverdue: t.dueDate ? t.dueDate < new Date() && t.status !== 'completed' : false,
            isAtRisk: false,
            interactionCount: 0,
            priority: t.priority === 1 ? 'high' : t.priority === 2 ? 'normal' : 'low',
            status: t.status || 'pending',
            dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : '',
            dueTime: '',
            assigneeId: t.userId || 'me',
            assigneeName: 'Assignee',
            assigneeRole: 'Rep',
            arr: '',
            todoType: 'manual',
            entityType: 'lead',
            workflowName: '',
            aiSignal: '',
            aiSignalType: '',
        }));
        const getCounts = (taskList) => ({
            today: taskList.filter((t) => ((t.dueDate && t.dueDate <= todayStr) || t.priority === 'high') && t.status !== 'completed').length,
            inProgress: taskList.filter((t) => t.status === 'in_progress').length,
            upcoming: taskList.filter((t) => t.dueDate && t.dueDate > todayStr && t.priority !== 'high' && t.status !== 'completed').length,
            completed: taskList.filter((t) => t.status === 'completed').length,
            snooze: 0,
        });
        let list = mappedTasks;
        if (query.channel && query.channel !== 'all') {
            list = list.filter((t) => t.channel === query.channel.toLowerCase());
        }
        const tabCounts = getCounts(list);
        const currentTab = query.tab || 'today';
        switch (currentTab) {
            case 'today':
                list = list.filter((t) => ((t.dueDate && t.dueDate <= todayStr) || t.priority === 'high') && t.status !== 'completed');
                break;
            case 'inProgress':
                list = list.filter((t) => t.status === 'in_progress');
                break;
            case 'upcoming':
                list = list.filter((t) => t.dueDate && t.dueDate > todayStr && t.priority !== 'high' && t.status !== 'completed');
                break;
            case 'completed':
                list = list.filter((t) => t.status === 'completed');
                break;
        }
        if (query.search?.trim()) {
            const q = query.search.toLowerCase();
            list = list.filter((t) => String(t.title).toLowerCase().includes(q));
        }
        const page = query.page ? parseInt(query.page) : 1;
        const size = query.size ? parseInt(query.size) : 50;
        const total = list.length;
        const totalPages = Math.ceil(total / size) || 1;
        const pagedTasks = list.slice((page - 1) * size, page * size);
        const highPriority = pagedTasks.filter((t) => t.priority === 'high');
        const normalPriority = pagedTasks.filter((t) => t.priority !== 'high');
        const groups = [];
        if (highPriority.length)
            groups.push({ groupLabel: 'High Priority', count: highPriority.length, tasks: highPriority });
        if (normalPriority.length || !highPriority.length)
            groups.push({ groupLabel: 'All Tasks', count: normalPriority.length, tasks: normalPriority });
        return {
            status: 'success',
            data: {
                groups,
                tabCounts,
                statusPills: { atRisk: 0, dueToday: tabCounts.today },
                pagination: { page, size, total, totalPages },
            },
        };
    }
    async fetchSummary(tenantId, assigneeId, date, userId, userRole) {
        let targetAssigneeId = assigneeId;
        if (userRole === 'SALES_REP' || userRole === 'sales_rep')
            targetAssigneeId = userId;
        else if (targetAssigneeId === 'me')
            targetAssigneeId = userId;
        const whereClause = { tenantid: tenantId };
        if (targetAssigneeId && targetAssigneeId !== 'all')
            whereClause.userId = targetAssigneeId;
        const rawTasks = await this.repo.prisma.task.findMany({ where: whereClause });
        const todayTasks = rawTasks.filter((t) => t.dueDate && t.dueDate.toISOString().split('T')[0] === date);
        const completedToday = todayTasks.filter((t) => t.status === 'completed').length;
        const totalToday = todayTasks.length;
        const highPriorityRemaining = todayTasks.filter((t) => t.priority === 1 && t.status !== 'completed').length;
        const atRisk = 0;
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
                headerAlert: `${highPriorityRemaining} high-priority deals need attention today`,
            },
        };
    }
    async fetchFiltersConfig(tenantId) {
        return {
            status: 'success',
            data: {
                flows: ['Enterprise Outbound', 'Mid-Market Follow-up'],
                entityTypes: ['account', 'deal', 'lead'],
                localTimes: ['morning', 'business_hours'],
            },
        };
    }
    async fetchTeamMembers(tenantId) {
        const users = await this.repo.prisma.user.findMany({ where: { tenantid: tenantId } });
        return {
            status: 'success',
            data: users.map((u) => ({ id: u.id, name: u.name ?? u.email, role: u.role })),
        };
    }
    async searchLinkedEntities(tenantId, search) {
        return { status: 'success', data: { results: [] } };
    }
    async emailTemplates(tenantId) {
        return { status: 'success', data: { templates: [] } };
    }
    async triggerOutreachAlerts(tenantId, enrollmentId, actionType) {
        try {
            await this.events.publish('notification.alert.requested', {
                tenantId,
                channel: 'slack',
                body: `Sales play enrollment ${actionType}: ${enrollmentId}`,
                metadata: { enrollmentId, actionType, module: 'm08-sales-engagement' },
            });
            await this.events.publish('notification.alert.requested', {
                tenantId,
                channel: 'email',
                subject: 'Sales play enrollment',
                body: `Enrollment ${enrollmentId} — action: ${actionType}`,
                metadata: { enrollmentId, actionType, module: 'm08-sales-engagement' },
            });
        }
        catch (e) {
            console.error('[Integration Alerts Suppressed] Non-blocking notification issue.', e);
        }
    }
};
exports.M08SalesEngagementService = M08SalesEngagementService;
exports.M08SalesEngagementService = M08SalesEngagementService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(m08_repository_1.M08SalesEngagementRepository)),
    __param(1, (0, common_1.Inject)(event_publisher_service_1.EventPublisherService)),
    __param(2, (0, bullmq_1.InjectQueue)('m08-queue')),
    __metadata("design:paramtypes", [m08_repository_1.M08SalesEngagementRepository,
        event_publisher_service_1.EventPublisherService,
        bullmq_2.Queue])
], M08SalesEngagementService);
//# sourceMappingURL=m08.service.js.map