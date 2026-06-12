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
exports.M08SalesEngagementController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const m08_service_1 = require("../services/m08.service");
const m08_schema_1 = require("../schemas/m08.schema");
let M08SalesEngagementController = class M08SalesEngagementController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getPlays(req) {
        return this.service.getPlays(req.tenantId);
    }
    async getPlayById(id, req) {
        return this.service.getPlayById(req.tenantId, id);
    }
    async createPlay(body, req) {
        this.enforceRole(req, ['admin']);
        const result = m08_schema_1.CreatePlaySchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException(result.error.errors);
        }
        const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        return this.service.createPlay(result.data, req.tenantId, userId);
    }
    async updatePlay(id, body, req) {
        this.enforceRole(req, ['admin']);
        const result = m08_schema_1.UpdatePlaySchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException(result.error.errors);
        }
        return this.service.updatePlay(id, result.data, req.tenantId);
    }
    async clonePlay(body, req) {
        this.enforceRole(req, ['admin']);
        const result = m08_schema_1.ClonePlaySchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException(result.error.errors);
        }
        const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        return this.service.clonePlay(result.data.playId, req.tenantId, userId);
    }
    async deactivatePlay(body, req) {
        this.enforceRole(req, ['admin']);
        const result = m08_schema_1.DeactivatePlaySchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException(result.error.errors);
        }
        return this.service.deactivatePlay(result.data.playId, req.tenantId);
    }
    async enrollOpportunity(body, req) {
        const result = m08_schema_1.EnrollPlaySchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException(result.error.errors);
        }
        return this.service.enrollOpportunity(result.data, req.tenantId);
    }
    async getEnrollments(query, req) {
        const filters = {
            userId: query.userId,
            dealId: query.dealId,
            status: query.status,
        };
        return this.service.getEnrollments(req.tenantId, filters);
    }
    async getEnrollmentById(id, req) {
        return this.service.getEnrollmentById(req.tenantId, id);
    }
    async completeStep(id, body, req) {
        const result = m08_schema_1.CompleteStepSchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException(result.error.errors);
        }
        const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        return this.service.completeStep(id, result.data, req.tenantId, userId);
    }
    async skipStep(id, body, req) {
        const result = m08_schema_1.SkipStepSchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException(result.error.errors);
        }
        const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        return this.service.skipStep(id, result.data, req.tenantId, userId);
    }
    async addNote(id, body, req) {
        const result = m08_schema_1.CreateNoteSchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException(result.error.errors);
        }
        const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        return this.service.addNote(id, result.data, req.tenantId, userId);
    }
    async getAdoptionDashboard(req) {
        this.enforceRole(req, ['manager', 'admin']);
        return this.service.getAdoptionDashboard(req.tenantId);
    }
    async getRepDashboard(req) {
        this.enforceRole(req, ['manager', 'admin']);
        return this.service.getRepDashboard(req.tenantId);
    }
    async getPlayDashboard(req) {
        this.enforceRole(req, ['manager', 'admin']);
        return this.service.getPlayDashboard(req.tenantId);
    }
    async tasks(req, query) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.fetchManagerTasks(req.tenantId, query, userId, userRole);
    }
    async summary(req, assigneeId = 'me', date) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        const today = new Date().toISOString().split('T')[0];
        return this.service.fetchSummary(req.tenantId, assigneeId, date || today, userId, userRole);
    }
    async filtersConfig(req) {
        return this.service.fetchFiltersConfig(req.tenantId);
    }
    async teamMembers(req) {
        return this.service.fetchTeamMembers(req.tenantId);
    }
    async searchLinkedEntities(req, search = '') {
        return this.service.searchLinkedEntities(req.tenantId, search);
    }
    async emailTemplates(req) {
        return this.service.emailTemplates(req.tenantId);
    }
    async recentActivities(req) {
        return this.service.fetchRecentActivities(req.tenantId);
    }
    async getTasks(req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.fetchRepTasks(req.tenantId, userId, userRole);
    }
    async getSummary(req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.fetchRepSummary(req.tenantId, userId, userRole);
    }
    async getRecentActivity(req, limit) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const activities = await this.service.fetchRecentActivities(req.tenantId);
        return activities.slice(0, isNaN(limitNum) ? 10 : limitNum);
    }
    async getTaskDetail(taskId, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.fetchTaskDetail(req.tenantId, taskId, userId, userRole);
    }
    async getContactDetails(contactId, req) {
        return this.service.fetchContactDetail(req.tenantId, contactId);
    }
    async getEmailDraft(taskId, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.fetchEmailDraft(req.tenantId, taskId, userId, userRole);
    }
    async getNotes(taskId, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        const t = await this.service.validateTaskAccess(req.tenantId, taskId, userId, userRole);
        return t.notes ? [{
                noteId: 'note-001',
                id: 'note-001',
                note: t.notes,
                noteText: t.notes,
                authorName: t.assigneeName || 'Alex Morgan',
                createdAt: t.updatedAt?.toISOString() || new Date().toISOString(),
                timestamp: t.updatedAt?.toISOString() || new Date().toISOString(),
            }] : [];
    }
    async getLinkedInDraft(taskId, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.fetchLinkedInScript(req.tenantId, taskId, userId, userRole);
    }
    async getFilterOptions(req) {
        return this.service.fetchFilterOptions(req.tenantId);
    }
    async getEmailTemplates(req) {
        const res = await this.service.emailTemplates(req.tenantId);
        return res.templates;
    }
    async createTask(body, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.createEngageTask(req.tenantId, body, userId, userRole);
    }
    async saveNotes(taskId, body, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.saveNotes(req.tenantId, taskId, body.notes, userId, userRole);
    }
    async sendEmail(taskId, body, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.sendEmail(req.tenantId, taskId, body, userId, userRole);
    }
    async saveDraft(taskId, body, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.saveDraft(req.tenantId, taskId, body, userId, userRole);
    }
    async rephraseEmail(taskId, body, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.rephraseEmail(req.tenantId, taskId, body, userId, userRole);
    }
    async markComplete(taskId, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.markComplete(req.tenantId, taskId, userId, userRole);
    }
    async skipTask(taskId, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.skipTask(req.tenantId, taskId, userId, userRole);
    }
    async dismissTask(taskId, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.dismissTask(req.tenantId, taskId, userId, userRole);
    }
    async reassignTask(taskId, body, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.reassignEngageTask(req.tenantId, taskId, body.newAssigneeId, userId, userRole, body.scope, body.reason);
    }
    async updateTask(taskId, body, req) {
        const userId = req.userId || req.user?.id || req.user?.sub || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.userRole || req.user?.role || req.headers['x-user-role'] || 'SALES_REP';
        return this.service.updateEngageTask(req.tenantId, taskId, body, userId, userRole);
    }
    async assignableUsers(req) {
        const userId = req.userId || req.user?.id || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        return this.service.fetchAssignableUsers(req.tenantId, userId);
    }
    enforceRole(req, allowedRoles) {
        const role = req.userRole || req.user?.role || req.headers['x-user-role'] || 'representative';
        const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
        if (normalizedAllowed.includes('manager')) {
            normalizedAllowed.push('sales_manager');
        }
        if (!normalizedAllowed.includes(role.toLowerCase())) {
            throw new common_1.ForbiddenException(`Access denied. Role '${role}' does not have sufficient permissions to perform this action.`);
        }
    }
};
exports.M08SalesEngagementController = M08SalesEngagementController;
__decorate([
    (0, common_1.Get)('plays'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getPlays", null);
__decorate([
    (0, common_1.Get)('plays/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getPlayById", null);
__decorate([
    (0, common_1.Post)('plays'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "createPlay", null);
__decorate([
    (0, common_1.Patch)('plays/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "updatePlay", null);
__decorate([
    (0, common_1.Post)('plays/clone'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "clonePlay", null);
__decorate([
    (0, common_1.Post)('plays/deactivate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "deactivatePlay", null);
__decorate([
    (0, common_1.Post)('enrollments'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "enrollOpportunity", null);
__decorate([
    (0, common_1.Get)('enrollments'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getEnrollments", null);
__decorate([
    (0, common_1.Get)('enrollments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getEnrollmentById", null);
__decorate([
    (0, common_1.Patch)('enrollments/:id/step'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "completeStep", null);
__decorate([
    (0, common_1.Post)('enrollments/:id/skip'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "skipStep", null);
__decorate([
    (0, common_1.Post)('enrollments/:id/note'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "addNote", null);
__decorate([
    (0, common_1.Get)('dashboard/adoption'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getAdoptionDashboard", null);
__decorate([
    (0, common_1.Get)('dashboard/rep'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getRepDashboard", null);
__decorate([
    (0, common_1.Get)('dashboard/play'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getPlayDashboard", null);
__decorate([
    (0, common_1.Get)('manager/tasks'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "tasks", null);
__decorate([
    (0, common_1.Get)('manager/tasks/summary'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('assigneeId')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('manager/tasks/filters-config'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "filtersConfig", null);
__decorate([
    (0, common_1.Get)('manager/team/members'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "teamMembers", null);
__decorate([
    (0, common_1.Get)('manager/search/linked-to'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "searchLinkedEntities", null);
__decorate([
    (0, common_1.Get)('manager/email-templates'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "emailTemplates", null);
__decorate([
    (0, common_1.Get)('manager/activities/recent'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "recentActivities", null);
__decorate([
    (0, common_1.Get)('tasks'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getTasks", null);
__decorate([
    (0, common_1.Get)('tasks/summary'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('activity/recent'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getRecentActivity", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId/detail'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getTaskDetail", null);
__decorate([
    (0, common_1.Get)('contacts/:contactId/details'),
    __param(0, (0, common_1.Param)('contactId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getContactDetails", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId/email-draft'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getEmailDraft", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId/notes'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getNotes", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId/linkedin-draft'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getLinkedInDraft", null);
__decorate([
    (0, common_1.Get)('filters/options'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getFilterOptions", null);
__decorate([
    (0, common_1.Get)('email-templates'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "getEmailTemplates", null);
__decorate([
    (0, common_1.Post)('tasks'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "createTask", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/notes'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "saveNotes", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/send-email'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/save-draft'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "saveDraft", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/ai-rephrase'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "rephraseEmail", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/mark-complete'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "markComplete", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/skip'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "skipTask", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/dismiss'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "dismissTask", null);
__decorate([
    (0, common_1.Patch)('tasks/:taskId/reassign'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "reassignTask", null);
__decorate([
    (0, common_1.Patch)('tasks/:taskId'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "updateTask", null);
__decorate([
    (0, common_1.Get)('users/assignable'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08SalesEngagementController.prototype, "assignableUsers", null);
exports.M08SalesEngagementController = M08SalesEngagementController = __decorate([
    (0, common_1.Controller)('api/v1/sales-engagement'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m08_service_1.M08SalesEngagementService])
], M08SalesEngagementController);
//# sourceMappingURL=m08.controller.js.map