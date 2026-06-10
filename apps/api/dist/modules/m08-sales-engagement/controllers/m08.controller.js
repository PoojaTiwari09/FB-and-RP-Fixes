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
        const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.headers['x-user-role'] || 'SALES_REP';
        return this.service.fetchManagerTasks(req.tenantId, query, userId, userRole);
    }
    async summary(req, assigneeId = 'me', date) {
        const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.headers['x-user-role'] || 'SALES_REP';
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
        const { MOCK_RECENT_ACTIVITY } = require('./m08-rep-bridge.mock');
        return { status: 'success', data: MOCK_RECENT_ACTIVITY };
    }
    enforceRole(req, allowedRoles) {
        const role = req.headers['x-user-role'] || 'representative';
        if (!allowedRoles.includes(role)) {
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
exports.M08SalesEngagementController = M08SalesEngagementController = __decorate([
    (0, common_1.Controller)('api/v1/sales-engagement'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [m08_service_1.M08SalesEngagementService])
], M08SalesEngagementController);
//# sourceMappingURL=m08.controller.js.map