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
exports.ForecastBoardsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const forecast_boards_service_1 = require("../services/forecast-boards.service");
const TenantHeader = 'X-Tenant-ID';
const UserHeader = 'X-User-ID';
let ForecastBoardsController = class ForecastBoardsController {
    boardsService;
    constructor(boardsService) {
        this.boardsService = boardsService;
    }
    async listBoards(tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.listBoards(tenantId);
    }
    async getBoardsByPeriod(tenantId, periodId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.getBoardByPeriod(tenantId, periodId);
    }
    async getBoardView(tenantId, userId, role, boardId, includeInactive) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.getBoardView(tenantId, boardId, role, userId, includeInactive === 'true');
    }
    async submitForecast(tenantId, userId, role, boardId, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.submitForecast(tenantId, boardId, body, userId, role);
    }
    async approveChangeRequest(tenantId, userId, role, boardId, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.approveChangeRequest(tenantId, boardId, body, userId, role);
    }
    async getRepDeals(tenantId, userId, role, boardId, repUserId, columnId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.getRepDeals(tenantId, boardId, repUserId, columnId, userId, role);
    }
    async getRepHistory(tenantId, userId, role, boardId, repUserId, columnId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.getRepHistory(tenantId, boardId, repUserId, columnId, userId, role);
    }
    async getRepDrilldown(tenantId, userId, role, boardId, repUserId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.getRepDrilldown(tenantId, boardId, repUserId, userId, role);
    }
    async addAnnotation(tenantId, userId, role, boardId, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.addManagerAnnotation(tenantId, boardId, body.submissionId, body.managerId || userId, body.annotation || body.content || '', role, body.repUserId);
    }
    async excludeMember(tenantId, userId, role, boardId, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.excludeMember(tenantId, boardId, body.repUserId, body.managerId || userId, body.reason, role);
    }
    async removeExclusion(tenantId, role, boardId, repUserId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.removeExclusion(tenantId, boardId, repUserId, role);
    }
    async approveSubmission(tenantId, managerId, role, boardId, submissionId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.approveSubmission(tenantId, boardId, submissionId, managerId, role);
    }
    async reopenSubmission(tenantId, managerId, role, boardId, submissionId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.reopenSubmission(tenantId, boardId, submissionId, managerId, role);
    }
    async overrideSubmission(tenantId, managerId, role, boardId, repUserId, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        if (body.value == null || !body.note || !body.columnId)
            throw new common_1.BadRequestException('Value, note, and columnId are required');
        return this.boardsService.overrideSubmission(tenantId, boardId, repUserId, managerId, body, role);
    }
    async getPendingApprovalsCount(tenantId, managerId, boardId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.getPendingApprovalsCount(tenantId, boardId, managerId);
    }
    async getPendingApprovals(tenantId, managerId, boardId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.getPendingApprovals(tenantId, boardId, managerId);
    }
    async assignTargets(tenantId, userId, role, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.boardsService.assignTargets(tenantId, body, userId, role);
    }
    async getNotifications(tenantId, repId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = await this.boardsService.getNotifications(tenantId, repId);
        return { success: true, data };
    }
    async markNotificationSeen(tenantId, id) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = await this.boardsService.markNotificationSeen(tenantId, id);
        return { success: true, data };
    }
    async getSubmissionActivity(tenantId, submissionId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = await this.boardsService.getSubmissionActivity(tenantId, submissionId);
        return { success: true, data };
    }
};
exports.ForecastBoardsController = ForecastBoardsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "listBoards", null);
__decorate([
    (0, common_1.Get)('by-period/:periodId'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('periodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "getBoardsByPeriod", null);
__decorate([
    (0, common_1.Get)(':boardId/view'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Param)('boardId')),
    __param(4, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "getBoardView", null);
__decorate([
    (0, common_1.Post)(':boardId/submit'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Param)('boardId')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "submitForecast", null);
__decorate([
    (0, common_1.Post)(':boardId/approve-change'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Param)('boardId')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "approveChangeRequest", null);
__decorate([
    (0, common_1.Get)(':boardId/reps/:repUserId/deals/:columnId'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Param)('boardId')),
    __param(4, (0, common_1.Param)('repUserId')),
    __param(5, (0, common_1.Param)('columnId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "getRepDeals", null);
__decorate([
    (0, common_1.Get)(':boardId/reps/:repUserId/history/:columnId'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Param)('boardId')),
    __param(4, (0, common_1.Param)('repUserId')),
    __param(5, (0, common_1.Param)('columnId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "getRepHistory", null);
__decorate([
    (0, common_1.Get)(':boardId/reps/:repUserId/drilldown'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Param)('boardId')),
    __param(4, (0, common_1.Param)('repUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "getRepDrilldown", null);
__decorate([
    (0, common_1.Post)(':boardId/annotations'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Param)('boardId')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "addAnnotation", null);
__decorate([
    (0, common_1.Post)(':boardId/exclude'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Param)('boardId')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "excludeMember", null);
__decorate([
    (0, common_1.Delete)(':boardId/exclude/:repUserId'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)('x-user-role')),
    __param(2, (0, common_1.Param)('boardId')),
    __param(3, (0, common_1.Param)('repUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "removeExclusion", null);
__decorate([
    (0, common_1.Patch)(':boardId/submissions/:submissionId/approve'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Param)('boardId')),
    __param(4, (0, common_1.Param)('submissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "approveSubmission", null);
__decorate([
    (0, common_1.Patch)(':boardId/submissions/:submissionId/reopen'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Param)('boardId')),
    __param(4, (0, common_1.Param)('submissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "reopenSubmission", null);
__decorate([
    (0, common_1.Patch)(':boardId/reps/:repUserId/submission'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Param)('boardId')),
    __param(4, (0, common_1.Param)('repUserId')),
    __param(5, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "overrideSubmission", null);
__decorate([
    (0, common_1.Get)(':boardId/pending-approvals/count'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Param)('boardId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "getPendingApprovalsCount", null);
__decorate([
    (0, common_1.Get)(':boardId/pending-approvals'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Param)('boardId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "getPendingApprovals", null);
__decorate([
    (0, common_1.Post)('targets/assign'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Headers)(UserHeader.toLowerCase())),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "assignTargets", null);
__decorate([
    (0, common_1.Get)('notifications/:repId'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('repId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)('notifications/:id/seen'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "markNotificationSeen", null);
__decorate([
    (0, common_1.Get)('submissions/:submissionId/activity'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('submissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ForecastBoardsController.prototype, "getSubmissionActivity", null);
exports.ForecastBoardsController = ForecastBoardsController = __decorate([
    (0, common_1.Controller)('api/v1/forecasting/boards'),
    __metadata("design:paramtypes", [forecast_boards_service_1.ForecastBoardsService])
], ForecastBoardsController);
//# sourceMappingURL=forecast-boards.controller.js.map