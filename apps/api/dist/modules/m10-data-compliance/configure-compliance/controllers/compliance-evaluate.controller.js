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
var ComplianceEvaluateController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceEvaluateController = void 0;
const common_1 = require("@nestjs/common");
const compliance_evaluate_service_1 = require("../services/compliance-evaluate.service");
const jwt_guard_1 = require("../../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../../platform-core/guards/tenant.guard");
const m10_dev_auth_guard_1 = require("../../guards/m10-dev-auth.guard");
const compliance_schema_1 = require("../schemas/compliance.schema");
const M10AuthGuard = process.env.M10_STANDALONE_AUTH === 'true' ? m10_dev_auth_guard_1.M10DevAuthGuard : jwt_guard_1.JwtAuthGuard;
let ComplianceEvaluateController = ComplianceEvaluateController_1 = class ComplianceEvaluateController {
    evaluateService;
    logger = new common_1.Logger(ComplianceEvaluateController_1.name);
    constructor(evaluateService) {
        this.evaluateService = evaluateService;
    }
    async evaluate(req, body) {
        const parsed = compliance_schema_1.EvaluateOutreachSchema.safeParse(body);
        if (!parsed.success) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: 'Invalid evaluation request body',
                errors: parsed.error.flatten(),
            };
        }
        const dto = parsed.data;
        this.logger.log(`POST /evaluate — correlationId=${dto.correlationId} tenant=${req.tenantId} recipient=${dto.recipientEmail} channel=${dto.channel}`);
        const result = await this.evaluateService.evaluate(req.tenantId, dto);
        if (result.decision === 'block') {
            this.logger.warn(`BLOCKED outreach correlationId=${dto.correlationId} reason=${result.reasonCode} tenant=${req.tenantId}`);
            return {
                decision: 'block',
                reasonCode: result.reasonCode,
                explanation: result.explanation,
                correlationId: result.correlationId,
                triggeredPolicyId: result.triggeredPolicyId ?? null,
            };
        }
        return {
            decision: 'allow',
            reasonCode: result.reasonCode,
            correlationId: result.correlationId,
        };
    }
};
exports.ComplianceEvaluateController = ComplianceEvaluateController;
__decorate([
    (0, common_1.Post)('evaluate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ComplianceEvaluateController.prototype, "evaluate", null);
exports.ComplianceEvaluateController = ComplianceEvaluateController = ComplianceEvaluateController_1 = __decorate([
    (0, common_1.Controller)('api/v1/m10-data-compliance'),
    (0, common_1.UseGuards)(M10AuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [compliance_evaluate_service_1.ComplianceEvaluateService])
], ComplianceEvaluateController);
//# sourceMappingURL=compliance-evaluate.controller.js.map