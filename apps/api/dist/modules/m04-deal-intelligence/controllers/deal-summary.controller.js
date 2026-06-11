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
exports.SummaryManagementController = exports.DealSummaryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const deal_summary_service_1 = require("@/services/deal-summary.service");
const auth_guard_1 = require("@/guards/auth.guard");
const roles_guard_1 = require("@/guards/roles.guard");
const roles_decorator_1 = require("@/decorators/roles.decorator");
const user_role_enum_1 = require("@/interfaces/user-role.enum");
const deal_summary_dto_1 = require("@/schemas/deal-summary.dto");
let DealSummaryController = class DealSummaryController {
    summaryService;
    constructor(summaryService) {
        this.summaryService = summaryService;
    }
    async generateSummary(dealId, req) {
        const summary = await this.summaryService.generateSummary(dealId, req.user.id);
        return summary;
    }
    async getCurrentSummary(dealId) {
        const summary = await this.summaryService.getCurrentSummary(dealId);
        return summary;
    }
    async getSummaryHistory(dealId, query) {
        const summaries = await this.summaryService.getSummaryHistory(dealId, query.limit || 10);
        return {
            summaries: summaries,
            total: summaries.length,
        };
    }
    async detectWeeklyChanges(dealId) {
        const changes = await this.summaryService.detectWeeklyChanges(dealId);
        return changes;
    }
    async flagForReview(summaryId, req) {
        await this.summaryService.flagForReview(summaryId, req.user.id);
        return { message: 'Summary flagged for review' };
    }
    async unflagForReview(summaryId, req) {
        await this.summaryService.unflagForReview(summaryId, req.user.id);
        return { message: 'Summary unflagged from review' };
    }
};
exports.DealSummaryController = DealSummaryController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.MANAGER, user_role_enum_1.UserRole.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Generate AI summary for deal' }),
    (0, swagger_1.ApiParam)({ name: 'dealId', description: 'Deal ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Summary generated successfully',
        type: deal_summary_dto_1.DealSummaryResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealSummaryController.prototype, "generateSummary", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.MANAGER, user_role_enum_1.UserRole.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get current summary for deal' }),
    (0, swagger_1.ApiParam)({ name: 'dealId', description: 'Deal ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Current summary retrieved successfully',
        type: deal_summary_dto_1.DealSummaryResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'No summary found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealSummaryController.prototype, "getCurrentSummary", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.MANAGER, user_role_enum_1.UserRole.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get summary history for deal' }),
    (0, swagger_1.ApiParam)({ name: 'dealId', description: 'Deal ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Summary history retrieved successfully',
        type: deal_summary_dto_1.SummaryHistoryResponseDto,
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, deal_summary_dto_1.QuerySummaryDto]),
    __metadata("design:returntype", Promise)
], DealSummaryController.prototype, "getSummaryHistory", null);
__decorate([
    (0, common_1.Get)('weekly-changes'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.MANAGER, user_role_enum_1.UserRole.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Detect weekly changes in deal summary' }),
    (0, swagger_1.ApiParam)({ name: 'dealId', description: 'Deal ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Weekly changes detected successfully',
        type: deal_summary_dto_1.WeeklyChangesResponseDto,
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DealSummaryController.prototype, "detectWeeklyChanges", null);
__decorate([
    (0, common_1.Patch)(':summaryId/flag'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Flag summary for review' }),
    (0, swagger_1.ApiParam)({ name: 'dealId', description: 'Deal ID' }),
    (0, swagger_1.ApiParam)({ name: 'summaryId', description: 'Summary ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Summary flagged successfully',
    }),
    __param(0, (0, common_1.Param)('summaryId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealSummaryController.prototype, "flagForReview", null);
__decorate([
    (0, common_1.Patch)(':summaryId/unflag'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Unflag summary from review' }),
    (0, swagger_1.ApiParam)({ name: 'dealId', description: 'Deal ID' }),
    (0, swagger_1.ApiParam)({ name: 'summaryId', description: 'Summary ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Summary unflagged successfully',
    }),
    __param(0, (0, common_1.Param)('summaryId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealSummaryController.prototype, "unflagForReview", null);
exports.DealSummaryController = DealSummaryController = __decorate([
    (0, swagger_1.ApiTags)('Deal Summaries'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('deals/:dealId/summaries'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [deal_summary_service_1.DealSummaryService])
], DealSummaryController);
let SummaryManagementController = class SummaryManagementController {
    summaryService;
    constructor(summaryService) {
        this.summaryService = summaryService;
    }
    async getFlaggedSummaries(query) {
        const summaries = await this.summaryService.getFlaggedSummaries(query.limit || 50);
        return summaries;
    }
};
exports.SummaryManagementController = SummaryManagementController;
__decorate([
    (0, common_1.Get)('flagged'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get all flagged summaries' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Flagged summaries retrieved successfully',
        type: [deal_summary_dto_1.DealSummaryResponseDto],
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deal_summary_dto_1.QuerySummaryDto]),
    __metadata("design:returntype", Promise)
], SummaryManagementController.prototype, "getFlaggedSummaries", null);
exports.SummaryManagementController = SummaryManagementController = __decorate([
    (0, swagger_1.ApiTags)('Deal Summaries'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('summaries'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [deal_summary_service_1.DealSummaryService])
], SummaryManagementController);
//# sourceMappingURL=deal-summary.controller.js.map