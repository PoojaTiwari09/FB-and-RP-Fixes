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
exports.M08FrontendEngageController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const m08_frontend_engage_service_1 = require("./m08-frontend-engage.service");
let M08FrontendEngageController = class M08FrontendEngageController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    tasks(req) {
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        const userId = req.userId || req.headers['x-user-id'];
        return this.svc.getTasks(req.tenantId, userId, userRole);
    }
    summary(req) {
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        const userId = req.userId || req.headers['x-user-id'];
        return this.svc.getTaskSummary(req.tenantId, userId, userRole);
    }
    recent(req, limit) {
        const n = parseInt(limit || '10', 10);
        const userId = req.userId;
        const userRole = req.userRole;
        return this.svc.getRecentActivity(req.tenantId, Number.isFinite(n) ? n : 10, userId, userRole);
    }
    taskDetail(taskId, req) {
        return this.svc.getTaskDetail(req.tenantId, taskId, req.userId, req.userRole);
    }
    contactDetails(contactId, req) {
        return this.svc.getContactDetails(req.tenantId, contactId, req.userId, req.userRole);
    }
    emailDraft(taskId, req) {
        return this.svc.getEmailDraft(req.tenantId, taskId, req.userId, req.userRole);
    }
    getNotes(taskId, req) {
        return this.svc.getNotes(req.tenantId, taskId, req.userId, req.userRole);
    }
    linkedInDraft(taskId, req) {
        return this.svc.getLinkedInDraft(req.tenantId, taskId, req.userId, req.userRole);
    }
    filterOptions(req) {
        return this.svc.getFilterOptions(req.tenantId);
    }
    emailTemplates(req) {
        return this.svc.getEmailTemplates(req.tenantId);
    }
    createTask(body, req) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.createTask(req.tenantId, body, userId, userRole);
    }
    saveNotes(taskId, body, req) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.saveNotes(req.tenantId, taskId, body.notes, userId, userRole);
    }
    sendEmail(taskId, body, req) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.sendEmail(req.tenantId, taskId, body, userId, userRole);
    }
    saveDraft(taskId, body, req) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.saveDraft(req.tenantId, taskId, body, userId, userRole);
    }
    rephraseEmail(taskId, body, req) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.rephraseEmail(req.tenantId, taskId, body, userId, userRole);
    }
    markComplete(taskId, req) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.markComplete(req.tenantId, taskId, userId, userRole);
    }
    skipTask(taskId, req) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.skipTask(req.tenantId, taskId, userId, userRole);
    }
    dismissTask(taskId, req) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.dismissTask(req.tenantId, taskId, userId, userRole);
    }
    reassignTask(taskId, body, req) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.reassignTask(req.tenantId, taskId, body.newAssigneeId, userId, userRole);
    }
    updateTask(taskId, body, req) {
        const userId = req.userId || req.headers['x-user-id'];
        const userRole = req.userRole || req.headers['x-user-role'] || 'SALES_REP';
        return this.svc.updateTask(req.tenantId, taskId, body, userId, userRole);
    }
};
exports.M08FrontendEngageController = M08FrontendEngageController;
__decorate([
    (0, common_1.Get)('tasks'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "tasks", null);
__decorate([
    (0, common_1.Get)('tasks/summary'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('activity/recent'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "recent", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId/detail'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "taskDetail", null);
__decorate([
    (0, common_1.Get)('contacts/:contactId/details'),
    __param(0, (0, common_1.Param)('contactId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "contactDetails", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId/email-draft'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "emailDraft", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId/notes'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "getNotes", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId/linkedin-draft'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "linkedInDraft", null);
__decorate([
    (0, common_1.Get)('filters/options'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "filterOptions", null);
__decorate([
    (0, common_1.Get)('email-templates'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "emailTemplates", null);
__decorate([
    (0, common_1.Post)('tasks'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "createTask", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/notes'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "saveNotes", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/send-email'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/save-draft'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "saveDraft", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/ai-rephrase'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "rephraseEmail", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/mark-complete'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "markComplete", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/skip'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "skipTask", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/dismiss'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "dismissTask", null);
__decorate([
    (0, common_1.Patch)('tasks/:taskId/reassign'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "reassignTask", null);
__decorate([
    (0, common_1.Patch)('tasks/:taskId'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], M08FrontendEngageController.prototype, "updateTask", null);
exports.M08FrontendEngageController = M08FrontendEngageController = __decorate([
    (0, common_1.Controller)('api/engage'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m08_frontend_engage_service_1.M08FrontendEngageService])
], M08FrontendEngageController);
//# sourceMappingURL=m08-frontend-engage.controller.js.map