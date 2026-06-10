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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_service_1 = require("@/services/analytics.service");
const analytics_dto_1 = require("@/schemas/analytics.dto");
const auth_guard_1 = require("@/guards/auth.guard");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getAnalytics(dto, req) {
        return this.analyticsService.getAnalytics(dto, req.user.id);
    }
    async getHistoricalMetrics(dto, req) {
        return this.analyticsService.getHistoricalMetrics(req.user.id, dto);
    }
    async getAEAnalytics(boardId, req) {
        const dto = {
            scope: 'PERSONAL',
            boardId,
            period: 'THIS_QUARTER',
        };
        return this.analyticsService.getAnalytics(dto, req.user.id);
    }
    async getManagerAnalytics(boardId, req) {
        const dto = {
            scope: 'TEAM',
            boardId,
            period: 'THIS_QUARTER',
        };
        return this.analyticsService.getAnalytics(dto, req.user.id);
    }
    async getExecutiveAnalytics(req) {
        const dto = {
            scope: 'EXECUTIVE',
            period: 'THIS_QUARTER',
        };
        return this.analyticsService.getAnalytics(dto, req.user.id);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get analytics',
        description: 'Get analytics based on user role and scope (Personal, Team, or Executive)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Analytics retrieved successfully',
        type: analytics_dto_1.AEAnalyticsResponseDto,
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_dto_1.GetAnalyticsRequestDto, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('historical'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get historical metrics',
        description: 'Get historical metrics for trend analysis',
    }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: Number, example: 30 }),
    (0, swagger_1.ApiQuery)({
        name: 'metricTypes',
        required: false,
        type: [String],
        example: ['aiScore', 'pipelineValue'],
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Historical metrics retrieved successfully',
        type: [analytics_dto_1.HistoricalMetricsResponseDto],
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_dto_1.HistoricalMetricsRequestDto, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getHistoricalMetrics", null);
__decorate([
    (0, common_1.Get)('ae'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get AE analytics (shortcut)',
        description: 'Get Account Executive analytics for current quarter',
    }),
    (0, swagger_1.ApiQuery)({ name: 'boardId', required: false, type: String }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'AE analytics retrieved successfully',
        type: analytics_dto_1.AEAnalyticsResponseDto,
    }),
    __param(0, (0, common_1.Query)('boardId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAEAnalytics", null);
__decorate([
    (0, common_1.Get)('manager'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Manager analytics (shortcut)',
        description: 'Get Sales Manager analytics for current quarter',
    }),
    (0, swagger_1.ApiQuery)({ name: 'boardId', required: false, type: String }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manager analytics retrieved successfully',
        type: analytics_dto_1.ManagerAnalyticsResponseDto,
    }),
    __param(0, (0, common_1.Query)('boardId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getManagerAnalytics", null);
__decorate([
    (0, common_1.Get)('executive'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Executive analytics (shortcut)',
        description: 'Get CRO/VP Sales analytics for current quarter',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Executive analytics retrieved successfully',
        type: analytics_dto_1.ExecutiveAnalyticsResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getExecutiveAnalytics", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Analytics'),
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map