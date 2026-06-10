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
exports.CoachingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const coaching_service_1 = require("@/services/coaching.service");
const coaching_dto_1 = require("@/schemas/coaching.dto");
const auth_guard_1 = require("@/guards/auth.guard");
const permissions_decorator_1 = require("../../platform-core/decorators/permissions.decorator");
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
    (0, permissions_decorator_1.RequirePermissions)('system.manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coaching_dto_1.GenerateCoachingPromptsDto]),
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
    (0, permissions_decorator_1.RequirePermissions)('system.manage'),
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
    (0, permissions_decorator_1.RequirePermissions)('system.manage'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getTeamOpportunities", null);
exports.CoachingController = CoachingController = __decorate([
    (0, swagger_1.ApiTags)('Coaching'),
    (0, common_1.Controller)('coaching'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [coaching_service_1.CoachingService])
], CoachingController);
//# sourceMappingURL=coaching.controller.js.map