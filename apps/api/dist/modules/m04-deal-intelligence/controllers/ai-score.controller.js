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
exports.AIScoreController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ai_score_service_1 = require("@/services/ai-score.service");
const ai_score_dto_1 = require("@/schemas/ai-score.dto");
const auth_guard_1 = require("@/guards/auth.guard");
let AIScoreController = class AIScoreController {
    scoreService;
    constructor(scoreService) {
        this.scoreService = scoreService;
    }
    async generateScore(dealId) {
        return this.scoreService.generateScore(dealId);
    }
    async getCurrentScore(dealId) {
        return this.scoreService.getCurrentScore(dealId);
    }
    async getScoreHistory(dealId) {
        return this.scoreService.getScoreHistory(dealId);
    }
};
exports.AIScoreController = AIScoreController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate AI score',
        description: 'Generate a new AI score for the deal with explanation and recommendations',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'AI score generated successfully',
        type: ai_score_dto_1.AIScoreResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AIScoreController.prototype, "generateScore", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get current AI score',
        description: 'Retrieve the current AI score for the deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Current AI score retrieved successfully',
        type: ai_score_dto_1.AIScoreResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AIScoreController.prototype, "getCurrentScore", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get score history',
        description: 'Retrieve the AI score history for the deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Score history retrieved successfully',
        type: ai_score_dto_1.ScoreHistoryResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AIScoreController.prototype, "getScoreHistory", null);
exports.AIScoreController = AIScoreController = __decorate([
    (0, swagger_1.ApiTags)('AI Score'),
    (0, common_1.Controller)('deals/:dealId/score'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [ai_score_service_1.AIScoreService])
], AIScoreController);
//# sourceMappingURL=ai-score.controller.js.map