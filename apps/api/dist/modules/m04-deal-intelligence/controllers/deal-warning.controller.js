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
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningManagementController = exports.DealWarningController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const deal_warning_service_1 = require("@m04/services/deal-warning.service");
const jwt_guard_1 = require("../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const roles_guard_1 = require("../../platform-core/guards/roles.guard");
const roles_decorator_1 = require("../../platform-core/decorators/roles.decorator");
const database_1 = require("@rri/database");
const authenticated_request_interface_1 = require("@m04/interfaces/authenticated-request.interface");
const deal_warning_dto_1 = require("@m04/schemas/deal-warning.dto");
let DealWarningController = class DealWarningController {
    warningService;
    constructor(warningService) {
        this.warningService = warningService;
    }
    async generateWarnings(dealId, req) {
        const warnings = await this.warningService.generateWarnings(dealId, req.user.id);
        return warnings;
    }
    async getActiveWarnings(dealId) {
        const warnings = await this.warningService.getActiveWarnings(dealId);
        return warnings;
    }
    async getWarningHistory(dealId, query) {
        const warnings = await this.warningService.getWarningHistory(dealId, query.limit || 50);
        return {
            warnings: warnings,
            total: warnings.length,
        };
    }
    async resolveWarning(warningId, req) {
        const warning = await this.warningService.resolveWarning(warningId, req.user.id);
        return warning;
    }
};
exports.DealWarningController = DealWarningController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER, database_1.UserRole.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Generate AI warnings for deal' }),
    (0, swagger_1.ApiParam)({ name: 'dealId', description: 'Deal ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Warnings generated successfully',
        type: [deal_warning_dto_1.DealWarningResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], DealWarningController.prototype, "generateWarnings", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER, database_1.UserRole.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Get active warnings for deal' }),
    (0, swagger_1.ApiParam)({ name: 'dealId', description: 'Deal ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Active warnings retrieved successfully',
        type: [deal_warning_dto_1.DealWarningResponseDto],
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealWarningController.prototype, "getActiveWarnings", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER, database_1.UserRole.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Get warning history for deal' }),
    (0, swagger_1.ApiParam)({ name: 'dealId', description: 'Deal ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Warning history retrieved successfully',
        type: deal_warning_dto_1.WarningListResponseDto,
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof deal_warning_dto_1.QueryWarningDto !== "undefined" && deal_warning_dto_1.QueryWarningDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], DealWarningController.prototype, "getWarningHistory", null);
__decorate([
    (0, common_1.Patch)(':warningId/resolve'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER, database_1.UserRole.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve a warning' }),
    (0, swagger_1.ApiParam)({ name: 'dealId', description: 'Deal ID' }),
    (0, swagger_1.ApiParam)({ name: 'warningId', description: 'Warning ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Warning resolved successfully',
        type: deal_warning_dto_1.DealWarningResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Warning not found',
    }),
    __param(0, (0, common_1.Param)('warningId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], DealWarningController.prototype, "resolveWarning", null);
exports.DealWarningController = DealWarningController = __decorate([
    (0, swagger_1.ApiTags)('Deal Warnings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('deals/:dealId/warnings'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof deal_warning_service_1.DealWarningService !== "undefined" && deal_warning_service_1.DealWarningService) === "function" ? _a : Object])
], DealWarningController);
let WarningManagementController = class WarningManagementController {
    warningService;
    constructor(warningService) {
        this.warningService = warningService;
    }
    async getCriticalWarnings(query) {
        const warnings = await this.warningService.getCriticalWarnings(query.limit || 20);
        return warnings;
    }
    async getWarningsByType(query) {
        if (!query.type) {
            return [];
        }
        const warnings = await this.warningService.getWarningsByType(query.type, query.limit || 50);
        return warnings;
    }
    async getWarningsBySeverity(query) {
        if (!query.severity) {
            return [];
        }
        const warnings = await this.warningService.getWarningsBySeverity(query.severity, query.limit || 50);
        return warnings;
    }
};
exports.WarningManagementController = WarningManagementController;
__decorate([
    (0, common_1.Get)('critical'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get all critical warnings' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Critical warnings retrieved successfully',
        type: [deal_warning_dto_1.DealWarningResponseDto],
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof deal_warning_dto_1.QueryWarningDto !== "undefined" && deal_warning_dto_1.QueryWarningDto) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], WarningManagementController.prototype, "getCriticalWarnings", null);
__decorate([
    (0, common_1.Get)('by-type'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get warnings by type' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Warnings retrieved successfully',
        type: [deal_warning_dto_1.DealWarningResponseDto],
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof deal_warning_dto_1.QueryWarningDto !== "undefined" && deal_warning_dto_1.QueryWarningDto) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], WarningManagementController.prototype, "getWarningsByType", null);
__decorate([
    (0, common_1.Get)('by-severity'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get warnings by severity' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Warnings retrieved successfully',
        type: [deal_warning_dto_1.DealWarningResponseDto],
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof deal_warning_dto_1.QueryWarningDto !== "undefined" && deal_warning_dto_1.QueryWarningDto) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], WarningManagementController.prototype, "getWarningsBySeverity", null);
exports.WarningManagementController = WarningManagementController = __decorate([
    (0, swagger_1.ApiTags)('Deal Warnings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('warnings'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [typeof (_e = typeof deal_warning_service_1.DealWarningService !== "undefined" && deal_warning_service_1.DealWarningService) === "function" ? _e : Object])
], WarningManagementController);
//# sourceMappingURL=deal-warning.controller.js.map