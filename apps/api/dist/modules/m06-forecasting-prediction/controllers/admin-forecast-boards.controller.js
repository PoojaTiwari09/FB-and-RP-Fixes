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
exports.AdminForecastBoardsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const admin_forecast_boards_service_1 = require("../services/admin-forecast-boards.service");
const admin_forecast_boards_schema_1 = require("../schemas/admin-forecast-boards.schema");
const TenantHeader = 'X-Tenant-ID';
let AdminForecastBoardsController = class AdminForecastBoardsController {
    adminBoardsService;
    constructor(adminBoardsService) {
        this.adminBoardsService = adminBoardsService;
    }
    async getBoards(tenantId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.adminBoardsService.getBoards(tenantId);
    }
    async getBoard(tenantId, id) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.adminBoardsService.getBoard(tenantId, id);
    }
    async createBoard(tenantId, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = admin_forecast_boards_schema_1.CreateBoardSchema.parse(body);
        return this.adminBoardsService.createBoard(tenantId, data);
    }
    async updateBoard(tenantId, id, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = admin_forecast_boards_schema_1.UpdateBoardSchema.parse(body);
        return this.adminBoardsService.updateBoard(tenantId, id, data);
    }
    async updateColumns(tenantId, id, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = admin_forecast_boards_schema_1.UpdateColumnsSchema.parse(body);
        return this.adminBoardsService.updateBoardColumns(tenantId, id, data);
    }
    async createColumnsFromCrm(tenantId, id, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = admin_forecast_boards_schema_1.CreateColumnsFromCrmSchema.parse(body);
        return this.adminBoardsService.createColumnsFromCrm(tenantId, id, data);
    }
    async updateColumn(tenantId, id, columnId, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = admin_forecast_boards_schema_1.UpdateColumnSchema.parse(body);
        return this.adminBoardsService.updateColumn(tenantId, id, columnId, data);
    }
    async updateColumnVisibility(tenantId, id, columnId, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = admin_forecast_boards_schema_1.UpdateColumnVisibilitySchema.parse(body);
        return this.adminBoardsService.updateColumnVisibility(tenantId, id, columnId, data);
    }
    async deleteColumn(tenantId, id, columnId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.adminBoardsService.deleteColumn(tenantId, id, columnId);
    }
    async reorderColumns(tenantId, id, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = admin_forecast_boards_schema_1.ReorderColumnsSchema.parse(body);
        return this.adminBoardsService.reorderColumns(tenantId, id, data);
    }
    async updateCrmMapping(tenantId, id, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = admin_forecast_boards_schema_1.UpdateCrmMappingSchema.parse(body);
        return this.adminBoardsService.updateCrmMapping(tenantId, id, data);
    }
    async getCrmMapping(tenantId, id) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.adminBoardsService.getCrmMapping(tenantId, id);
    }
    async updateStageMapping(tenantId, id, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = admin_forecast_boards_schema_1.UpdateStageMappingSchema.parse(body);
        return this.adminBoardsService.updateStageMapping(tenantId, id, data);
    }
    async updateReminderConfig(tenantId, id, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = admin_forecast_boards_schema_1.UpdateReminderConfigSchema.parse(body);
        return this.adminBoardsService.updateReminderConfig(tenantId, id, data);
    }
    async updateQuotas(tenantId, id, body) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        const data = admin_forecast_boards_schema_1.UpdateQuotasSchema.parse(body);
        return this.adminBoardsService.updateQuotas(tenantId, id, data);
    }
    async publishBoard(tenantId, id) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.adminBoardsService.publishBoard(tenantId, id);
    }
    async saveDraft(tenantId, id) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.adminBoardsService.saveDraft(tenantId, id);
    }
    async archiveBoard(tenantId, id) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.adminBoardsService.archiveBoard(tenantId, id);
    }
    async getCrmFields(tenantId, objectType, boardId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.adminBoardsService.getCrmFields(tenantId, objectType, boardId);
    }
    async testSync(tenantId, id) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.adminBoardsService.testSync(tenantId, id);
    }
    async testReminder(tenantId, id) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.adminBoardsService.testReminder(tenantId, id);
    }
    async importQuotas(tenantId, id, file) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        if (!file || !file.buffer) {
            throw new common_1.ForbiddenException('Quota import file required');
        }
        const csvContent = file.buffer.toString('utf-8');
        return this.adminBoardsService.importQuotas(tenantId, id, csvContent);
    }
    async getPermissions(tenantId, id) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.adminBoardsService.getPermissions(tenantId, id);
    }
    async autoSubmitPreview(tenantId, id, columnId) {
        if (!tenantId)
            throw new common_1.ForbiddenException('Tenant ID required');
        return this.adminBoardsService.autoSubmitPreview(tenantId, id, columnId);
    }
};
exports.AdminForecastBoardsController = AdminForecastBoardsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "getBoards", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "getBoard", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "createBoard", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "updateBoard", null);
__decorate([
    (0, common_1.Patch)(':id/columns'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "updateColumns", null);
__decorate([
    (0, common_1.Post)(':id/columns/from-crm'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "createColumnsFromCrm", null);
__decorate([
    (0, common_1.Patch)(':id/columns/:columnId'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('columnId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "updateColumn", null);
__decorate([
    (0, common_1.Patch)(':id/columns/:columnId/visibility'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('columnId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "updateColumnVisibility", null);
__decorate([
    (0, common_1.Delete)(':id/columns/:columnId'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('columnId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "deleteColumn", null);
__decorate([
    (0, common_1.Post)(':id/columns/reorder'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "reorderColumns", null);
__decorate([
    (0, common_1.Patch)(':id/crm-mapping'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "updateCrmMapping", null);
__decorate([
    (0, common_1.Get)(':id/crm-mapping'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "getCrmMapping", null);
__decorate([
    (0, common_1.Post)(':id/stage-mapping'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "updateStageMapping", null);
__decorate([
    (0, common_1.Patch)(':id/reminder-config'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "updateReminderConfig", null);
__decorate([
    (0, common_1.Patch)(':id/quotas'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "updateQuotas", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "publishBoard", null);
__decorate([
    (0, common_1.Patch)(':id/save-draft'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "saveDraft", null);
__decorate([
    (0, common_1.Patch)(':id/archive'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "archiveBoard", null);
__decorate([
    (0, common_1.Get)('crm/fields'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Query)('object')),
    __param(2, (0, common_1.Query)('boardId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "getCrmFields", null);
__decorate([
    (0, common_1.Post)(':id/test-sync'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "testSync", null);
__decorate([
    (0, common_1.Post)(':id/test-reminder'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "testReminder", null);
__decorate([
    (0, common_1.Post)(':id/quotas/import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } }),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "importQuotas", null);
__decorate([
    (0, common_1.Get)(':id/permissions'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "getPermissions", null);
__decorate([
    (0, common_1.Get)(':id/columns/:columnId/auto-submit-preview'),
    __param(0, (0, common_1.Headers)(TenantHeader.toLowerCase())),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('columnId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminForecastBoardsController.prototype, "autoSubmitPreview", null);
exports.AdminForecastBoardsController = AdminForecastBoardsController = __decorate([
    (0, common_1.Controller)('api/v1/forecasting/admin/boards'),
    __metadata("design:paramtypes", [admin_forecast_boards_service_1.AdminForecastBoardsService])
], AdminForecastBoardsController);
//# sourceMappingURL=admin-forecast-boards.controller.js.map