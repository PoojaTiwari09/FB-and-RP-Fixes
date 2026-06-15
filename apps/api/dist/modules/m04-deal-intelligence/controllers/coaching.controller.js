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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const coaching_service_1 = require("@m04/services/coaching.service");
const coaching_dto_1 = require("@m04/schemas/coaching.dto");
const jwt_guard_1 = require("../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const roles_guard_1 = require("../../platform-core/guards/roles.guard");
const roles_decorator_1 = require("../../platform-core/decorators/roles.decorator");
const database_1 = require("@rri/database");
const authenticated_request_interface_1 = require("@m04/interfaces/authenticated-request.interface");
let CoachingController = class CoachingController {
    coachingService;
    constructor(coachingService) {
        this.coachingService = coachingService;
    }
    async generatePrompts(dto) {
        return this.coachingService.generateCoachingPrompts(dto);
    }
    async getPromptsForDeal(dealId) {
        return this.coachingService.generateCoachingPrompts({ dealId });
    }
    async getTeamOpportunities(req) {
        return this.coachingService.getTeamCoachingOpportunities(req.user.id);
    }
};
exports.CoachingController = CoachingController;
__decorate([
    (0, common_1.Post)('prompts'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate coaching prompts',
        description: 'Generate AI-powered coaching prompts for a deal',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Coaching prompts generated successfully',
        type: coaching_dto_1.CoachingPromptsResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    (0, roles_decorator_1.Roles)(database_1.UserRole.MANAGER, database_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof coaching_dto_1.GenerateCoachingPromptsDto !== "undefined" && coaching_dto_1.GenerateCoachingPromptsDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "generatePrompts", null);
__decorate([
    (0, common_1.Get)('deals/:dealId/prompts'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get coaching prompts for a deal',
        description: 'Get AI-powered coaching prompts for a specific deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Coaching prompts retrieved successfully',
        type: coaching_dto_1.CoachingPromptsResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    (0, roles_decorator_1.Roles)(database_1.UserRole.MANAGER, database_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getPromptsForDeal", null);
__decorate([
    (0, common_1.Get)('opportunities'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get team coaching opportunities',
        description: 'Get coaching opportunities across all team deals',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Coaching opportunities retrieved successfully',
        type: [coaching_dto_1.CoachingPromptsResponseDto],
    }),
    (0, roles_decorator_1.Roles)(database_1.UserRole.MANAGER, database_1.UserRole.ADMIN),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getTeamOpportunities", null);
exports.CoachingController = CoachingController = __decorate([
    (0, swagger_1.ApiTags)('Coaching'),
    (0, common_1.Controller)('coaching'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [typeof (_a = typeof coaching_service_1.CoachingService !== "undefined" && coaching_service_1.CoachingService) === "function" ? _a : Object])
], CoachingController);
//# sourceMappingURL=coaching.controller.js.map