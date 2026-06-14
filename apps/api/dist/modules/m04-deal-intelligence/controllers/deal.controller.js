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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const deal_service_1 = require("@m04/services/deal.service");
const jwt_guard_1 = require("../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const roles_guard_1 = require("../../platform-core/guards/roles.guard");
const roles_decorator_1 = require("../../platform-core/decorators/roles.decorator");
const database_1 = require("@rri/database");
const authenticated_request_interface_1 = require("@m04/interfaces/authenticated-request.interface");
const deal_dto_1 = require("@m04/schemas/deal.dto");
let DealController = class DealController {
    dealService;
    constructor(dealService) {
        this.dealService = dealService;
    }
    async findAll(query, req) {
        const { page = 1, limit = 25, ...filters } = query;
        const result = await this.dealService.findAll(filters, page, limit);
        return {
            deals: result.deals,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: Math.ceil(result.total / result.limit),
        };
    }
    async getStats(req) {
        const [totalValue, countByStage, highRiskDeals, closingSoon] = await Promise.all([
            this.dealService.calculateTotalValue({}),
            this.dealService.countByStage(),
            this.dealService.getHighRiskDeals(),
            this.dealService.getDealsClosingSoon(30),
        ]);
        return {
            totalValue,
            countByStage,
            highRiskCount: highRiskDeals.length,
            closingSoonCount: closingSoon.length,
        };
    }
    async getHighRiskDeals(req) {
        const deals = await this.dealService.getHighRiskDeals(10);
        return deals;
    }
    async getDealsClosingSoon(req) {
        const deals = await this.dealService.getDealsClosingSoon(30);
        return deals;
    }
    async getMyDeals(req) {
        const deals = await this.dealService.getDealsForOwner(req.user.id, 100);
        return deals;
    }
    async getRecentNotifications(req) {
        return this.dealService.getRecentNotifications(req.user.id, req.user.role);
    }
    async findById(id, req) {
        const deal = await this.dealService.findById(id, req.user.id);
        return deal;
    }
    async update(id, updateDto, req) {
        const deal = await this.dealService.update(id, updateDto, req.user.id);
        return deal;
    }
};
exports.DealController = DealController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER, database_1.UserRole.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Get all deals with filters' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Deals retrieved successfully',
        type: deal_dto_1.DealListResponseDto,
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof deal_dto_1.QueryDealDto !== "undefined" && deal_dto_1.QueryDealDto) === "function" ? _b : Object, typeof (_c = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], DealController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get deal statistics' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Statistics retrieved successfully',
        type: deal_dto_1.DealStatsResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], DealController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('high-risk'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get high risk deals' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'High risk deals retrieved successfully',
        type: [deal_dto_1.DealResponseDto],
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], DealController.prototype, "getHighRiskDeals", null);
__decorate([
    (0, common_1.Get)('closing-soon'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER, database_1.UserRole.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Get deals closing soon (next 30 days)' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Deals closing soon retrieved successfully',
        type: [deal_dto_1.DealResponseDto],
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], DealController.prototype, "getDealsClosingSoon", null);
__decorate([
    (0, common_1.Get)('my-deals'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Get deals for current user' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'User deals retrieved successfully',
        type: [deal_dto_1.DealResponseDto],
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], DealController.prototype, "getMyDeals", null);
__decorate([
    (0, common_1.Get)('notifications/recent'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER, database_1.UserRole.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Get recent deal updates' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Notifications retrieved successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], DealController.prototype, "getRecentNotifications", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER, database_1.UserRole.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Get deal by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Deal ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Deal retrieved successfully',
        type: deal_dto_1.DealResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_j = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _j : Object]),
    __metadata("design:returntype", Promise)
], DealController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(database_1.UserRole.ADMIN, database_1.UserRole.MANAGER, database_1.UserRole.SALES_REP),
    (0, swagger_1.ApiOperation)({ summary: 'Update deal' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Deal ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Deal updated successfully',
        type: deal_dto_1.DealResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_k = typeof deal_dto_1.UpdateDealDto !== "undefined" && deal_dto_1.UpdateDealDto) === "function" ? _k : Object, typeof (_l = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _l : Object]),
    __metadata("design:returntype", Promise)
], DealController.prototype, "update", null);
exports.DealController = DealController = __decorate([
    (0, swagger_1.ApiTags)('Deals'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('deals'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof deal_service_1.DealService !== "undefined" && deal_service_1.DealService) === "function" ? _a : Object])
], DealController);
//# sourceMappingURL=deal.controller.js.map