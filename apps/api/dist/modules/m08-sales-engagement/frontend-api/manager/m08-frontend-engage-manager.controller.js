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
exports.M08FrontendEngageManagerController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../../platform-core/guards/tenant.guard");
const m08_frontend_engage_manager_service_1 = require("./m08-frontend-engage-manager.service");
let M08FrontendEngageManagerController = class M08FrontendEngageManagerController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    tasks(req, assigneeId = 'me', date, tab = 'today', channel, search, groupBy, sortBy, page, size) {
        const today = new Date().toISOString().split('T')[0];
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.fetchTasks(req.tenantId, {
            assigneeId,
            date: date || today,
            tab,
            channel,
            search,
            groupBy,
            sortBy,
            page: page ? parseInt(page, 10) : 1,
            size: size ? parseInt(size, 10) : 50,
        }, userId, userRole);
    }
    summary(req, assigneeId = 'me', date) {
        const today = new Date().toISOString().split('T')[0];
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.fetchSummary(req.tenantId, assigneeId, date || today, userId, userRole);
    }
    filtersConfig(req) {
        return this.svc.fetchFiltersConfig(req.tenantId);
    }
    recentActivity(req) {
        return this.svc.fetchRecentActivity(req.tenantId);
    }
    teamMembers(req) {
        return this.svc.fetchTeamMembers(req.tenantId);
    }
    emailTemplates(req) {
        return this.svc.emailTemplates(req.tenantId);
    }
    linkedTo(req, search = '') {
        return this.svc.searchLinkedEntities(req.tenantId, search);
    }
    taskDetail(req, taskId) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.fetchTaskDetail(req.tenantId, taskId, userId, userRole);
    }
    emailDraft(req, taskId) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.fetchEmailDraft(req.tenantId, taskId, userId, userRole);
    }
    linkedInScript(req, taskId) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.fetchLinkedInScript(req.tenantId, taskId, userId, userRole);
    }
    contactDetail(req, contactId) {
        return this.svc.fetchContactDetail(req.tenantId, contactId);
    }
    createTask(req, body) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.createTask(req.tenantId, body, userId, userRole);
    }
    reassign(req, taskId, body) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.reassignTask(req.tenantId, taskId, body.newAssigneeId, userId, userRole);
    }
    markComplete(req, taskId) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.markComplete(req.tenantId, taskId, userId, userRole);
    }
    skip(req, taskId) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.skipTask(req.tenantId, taskId, userId, userRole);
    }
    dismiss(req, taskId) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.dismissTask(req.tenantId, taskId, userId, userRole);
    }
    action(req, taskId, body) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.logAction(req.tenantId, taskId, body.action, userId, userRole);
    }
    notes(req, taskId, body) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.saveNotes(req.tenantId, taskId, body.notes, userId, userRole);
    }
    sendEmail(req, taskId, body) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.sendEmail(req.tenantId, taskId, body, userId, userRole);
    }
    saveDraft(req, taskId, body) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.saveDraft(req.tenantId, taskId, body, userId, userRole);
    }
    rephrase(req, taskId, body) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.rephraseEmail(req.tenantId, taskId, body, userId, userRole);
    }
    updateTask(req, taskId, body) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.updateTask(req.tenantId, taskId, body, userId, userRole);
    }
};
exports.M08FrontendEngageManagerController = M08FrontendEngageManagerController;
__decorate([
    (0, common_1.Get)('api/tasks'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('assigneeId')),
    __param(2, (0, common_1.Query)('date')),
    __param(3, (0, common_1.Query)('tab')),
    __param(4, (0, common_1.Query)('channel')),
    __param(5, (0, common_1.Query)('search')),
    __param(6, (0, common_1.Query)('groupBy')),
    __param(7, (0, common_1.Query)('sortBy')),
    __param(8, (0, common_1.Query)('page')),
    __param(9, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, Object, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "tasks", null);
__decorate([
    (0, common_1.Get)('api/tasks/summary'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('assigneeId')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('api/tasks/filters-config'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "filtersConfig", null);
__decorate([
    (0, common_1.Get)('api/activities/recent'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "recentActivity", null);
__decorate([
    (0, common_1.Get)('api/team/members'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "teamMembers", null);
__decorate([
    (0, common_1.Get)('api/email-templates'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "emailTemplates", null);
__decorate([
    (0, common_1.Get)('api/search/linked-to'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "linkedTo", null);
__decorate([
    (0, common_1.Get)('api/tasks/:taskId/detail'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "taskDetail", null);
__decorate([
    (0, common_1.Get)('api/tasks/:taskId/email-draft'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "emailDraft", null);
__decorate([
    (0, common_1.Get)('api/tasks/:taskId/linkedin-script'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "linkedInScript", null);
__decorate([
    (0, common_1.Get)('api/contacts/:contactId/detail'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('contactId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "contactDetail", null);
__decorate([
    (0, common_1.Post)('api/tasks'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "createTask", null);
__decorate([
    (0, common_1.Patch)('api/tasks/:taskId/reassign'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "reassign", null);
__decorate([
    (0, common_1.Post)('api/tasks/:taskId/mark-complete'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "markComplete", null);
__decorate([
    (0, common_1.Post)('api/tasks/:taskId/skip'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "skip", null);
__decorate([
    (0, common_1.Post)('api/tasks/:taskId/dismiss'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "dismiss", null);
__decorate([
    (0, common_1.Post)('api/tasks/:taskId/action'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "action", null);
__decorate([
    (0, common_1.Post)('api/tasks/:taskId/notes'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "notes", null);
__decorate([
    (0, common_1.Post)('api/tasks/:taskId/send-email'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Post)('api/tasks/:taskId/save-draft'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "saveDraft", null);
__decorate([
    (0, common_1.Post)('api/tasks/:taskId/ai-rephrase'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "rephrase", null);
__decorate([
    (0, common_1.Patch)('api/tasks/:taskId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageManagerController.prototype, "updateTask", null);
exports.M08FrontendEngageManagerController = M08FrontendEngageManagerController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m08_frontend_engage_manager_service_1.M08FrontendEngageManagerService])
], M08FrontendEngageManagerController);
//# sourceMappingURL=m08-frontend-engage-manager.controller.js.map