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
exports.RiskEscalationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const deal_service_1 = require("@/services/deal.service");
const risk_escalation_dto_1 = require("@/schemas/risk-escalation.dto");
const auth_guard_1 = require("@/guards/auth.guard");
let RiskEscalationController = class RiskEscalationController {
    dealService;
    constructor(dealService) {
        this.dealService = dealService;
    }
    async escalateRisk(dealId, dto, req) {
        await this.dealService.markAsHighRisk(dealId, dto.riskReason);
        const deal = await this.dealService.findById(dealId, req.user.id);
        return {
            id: deal.id,
            isHighRisk: deal.isHighRisk,
            riskReason: deal.riskReason,
            escalatedBy: req.user.id,
            escalatedAt: new Date(),
            message: 'Deal escalated to high risk successfully',
        };
    }
    async deescalateRisk(dealId, dto, req) {
        await this.dealService.clearHighRisk(dealId);
        return {
            message: 'Deal de-escalated from high risk successfully',
            reason: dto.reason,
        };
    }
};
exports.RiskEscalationController = RiskEscalationController;
__decorate([
    (0, common_1.Post)('escalate'),
    (0, swagger_1.ApiOperation)({
        summary: 'Escalate deal to high risk',
        description: 'Mark a deal as high risk with a reason',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Deal escalated to high risk successfully',
        type: risk_escalation_dto_1.RiskEscalationResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, risk_escalation_dto_1.EscalateRiskDto, Object]),
    __metadata("design:returntype", Promise)
], RiskEscalationController.prototype, "escalateRisk", null);
__decorate([
    (0, common_1.Post)('deescalate'),
    (0, swagger_1.ApiOperation)({
        summary: 'De-escalate deal from high risk',
        description: 'Remove high risk status from a deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Deal de-escalated successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, risk_escalation_dto_1.DeescalateRiskDto, Object]),
    __metadata("design:returntype", Promise)
], RiskEscalationController.prototype, "deescalateRisk", null);
exports.RiskEscalationController = RiskEscalationController = __decorate([
    (0, swagger_1.ApiTags)('Risk Escalation'),
    (0, common_1.Controller)('deals/:dealId/risk'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [deal_service_1.DealService])
], RiskEscalationController);
//# sourceMappingURL=risk-escalation.controller.js.map