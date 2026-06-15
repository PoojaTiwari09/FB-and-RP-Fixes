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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const settings_service_1 = require("@m04/services/settings.service");
const settings_dto_1 = require("@m04/schemas/settings.dto");
const jwt_guard_1 = require("../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const authenticated_request_interface_1 = require("@m04/interfaces/authenticated-request.interface");
let SettingsController = class SettingsController {
    settingsService;
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async saveFilters(dto, req) {
        return this.settingsService.saveFilters(req.user.id, dto);
    }
    async getFilters(boardId, req) {
        return this.settingsService.getFilters(req.user.id, boardId);
    }
    async saveViewSettings(dto, req) {
        return this.settingsService.saveViewSettings(req.user.id, dto);
    }
    async getViewSettings(boardId, req) {
        return this.settingsService.getViewSettings(req.user.id, boardId);
    }
    async saveNotificationSettings(dto, req) {
        return this.settingsService.saveNotificationSettings(req.user.id, dto);
    }
    async getNotificationSettings(req) {
        return this.settingsService.getNotificationSettings(req.user.id);
    }
    async saveCoachingSettings(dto, req) {
        return this.settingsService.saveCoachingSettings(req.user.id, dto);
    }
    async getCoachingSettings(req) {
        return this.settingsService.getCoachingSettings(req.user.id);
    }
    async saveGlobalSettings(dto, req) {
        return this.settingsService.saveGlobalSettings(req.user.id, dto);
    }
    async getGlobalSettings(req) {
        return this.settingsService.getGlobalSettings(req.user.id);
    }
    async getAllSettings(req) {
        return this.settingsService.getAllSettings(req.user.id);
    }
    async deleteSettings(preferenceKey, boardId, req) {
        await this.settingsService.deleteSettings(req.user.id, preferenceKey, boardId);
        return { message: 'Settings deleted successfully' };
    }
    async resetAllSettings(req) {
        await this.settingsService.resetAllSettings(req.user.id);
        return { message: 'All settings reset successfully' };
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Post)('filters'),
    (0, swagger_1.ApiOperation)({
        summary: 'Save filter settings',
        description: 'Save user filter preferences for a board or globally',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Filters saved successfully',
        type: settings_dto_1.GetFiltersResponseDto,
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof settings_dto_1.SaveFiltersRequestDto !== "undefined" && settings_dto_1.SaveFiltersRequestDto) === "function" ? _b : Object, typeof (_c = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "saveFilters", null);
__decorate([
    (0, common_1.Get)('filters'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get filter settings',
        description: 'Get user filter preferences for a board or globally',
    }),
    (0, swagger_1.ApiQuery)({ name: 'boardId', required: false, type: String }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Filters retrieved successfully',
        type: settings_dto_1.GetFiltersResponseDto,
    }),
    __param(0, (0, common_1.Query)('boardId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getFilters", null);
__decorate([
    (0, common_1.Post)('view'),
    (0, swagger_1.ApiOperation)({
        summary: 'Save view settings',
        description: 'Save user view preferences (columns, sort, group by, etc.)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'View settings saved successfully',
        type: settings_dto_1.GetViewSettingsResponseDto,
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof settings_dto_1.SaveViewSettingsRequestDto !== "undefined" && settings_dto_1.SaveViewSettingsRequestDto) === "function" ? _e : Object, typeof (_f = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "saveViewSettings", null);
__decorate([
    (0, common_1.Get)('view'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get view settings',
        description: 'Get user view preferences for a board or globally',
    }),
    (0, swagger_1.ApiQuery)({ name: 'boardId', required: false, type: String }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'View settings retrieved successfully',
        type: settings_dto_1.GetViewSettingsResponseDto,
    }),
    __param(0, (0, common_1.Query)('boardId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_g = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getViewSettings", null);
__decorate([
    (0, common_1.Post)('notifications'),
    (0, swagger_1.ApiOperation)({
        summary: 'Save notification settings',
        description: 'Save user notification preferences',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Notification settings saved successfully',
        type: settings_dto_1.GetNotificationSettingsResponseDto,
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof settings_dto_1.SaveNotificationSettingsRequestDto !== "undefined" && settings_dto_1.SaveNotificationSettingsRequestDto) === "function" ? _h : Object, typeof (_j = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _j : Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "saveNotificationSettings", null);
__decorate([
    (0, common_1.Get)('notifications'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get notification settings',
        description: 'Get user notification preferences',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Notification settings retrieved successfully',
        type: settings_dto_1.GetNotificationSettingsResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _k : Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getNotificationSettings", null);
__decorate([
    (0, common_1.Post)('coaching'),
    (0, swagger_1.ApiOperation)({
        summary: 'Save coaching settings',
        description: 'Save manager coaching preferences (manager only)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Coaching settings saved successfully',
        type: settings_dto_1.GetCoachingSettingsResponseDto,
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof settings_dto_1.SaveCoachingSettingsRequestDto !== "undefined" && settings_dto_1.SaveCoachingSettingsRequestDto) === "function" ? _l : Object, typeof (_m = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _m : Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "saveCoachingSettings", null);
__decorate([
    (0, common_1.Get)('coaching'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get coaching settings',
        description: 'Get manager coaching preferences (manager only)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Coaching settings retrieved successfully',
        type: settings_dto_1.GetCoachingSettingsResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_o = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _o : Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getCoachingSettings", null);
__decorate([
    (0, common_1.Post)('global'),
    (0, swagger_1.ApiOperation)({
        summary: 'Save global settings',
        description: 'Save user global preferences (timezone, theme, etc.)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Global settings saved successfully',
        type: settings_dto_1.GetGlobalSettingsResponseDto,
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof settings_dto_1.SaveGlobalSettingsRequestDto !== "undefined" && settings_dto_1.SaveGlobalSettingsRequestDto) === "function" ? _p : Object, typeof (_q = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _q : Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "saveGlobalSettings", null);
__decorate([
    (0, common_1.Get)('global'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get global settings',
        description: 'Get user global preferences',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Global settings retrieved successfully',
        type: settings_dto_1.GetGlobalSettingsResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _r : Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getGlobalSettings", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all settings',
        description: 'Get all user settings in one response',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All settings retrieved successfully',
        type: settings_dto_1.AllSettingsResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_s = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _s : Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getAllSettings", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete specific settings',
        description: 'Delete a specific preference setting',
    }),
    (0, swagger_1.ApiQuery)({ name: 'preferenceKey', required: true, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'boardId', required: false, type: String }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Settings deleted successfully',
    }),
    __param(0, (0, common_1.Query)('preferenceKey')),
    __param(1, (0, common_1.Query)('boardId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_t = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _t : Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "deleteSettings", null);
__decorate([
    (0, common_1.Delete)('all'),
    (0, swagger_1.ApiOperation)({
        summary: 'Reset all settings',
        description: 'Reset all user settings to defaults',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All settings reset successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_u = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _u : Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "resetAllSettings", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)('Settings'),
    (0, common_1.Controller)('settings'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [typeof (_a = typeof settings_service_1.SettingsService !== "undefined" && settings_service_1.SettingsService) === "function" ? _a : Object])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map