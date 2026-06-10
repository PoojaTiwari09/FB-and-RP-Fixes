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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskEscalationResponseDto = exports.DeescalateRiskDto = exports.EscalateRiskDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class EscalateRiskDto {
    riskReason;
}
exports.EscalateRiskDto = EscalateRiskDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reason for escalation',
        example: 'Deal has been stalled for 3 weeks with no response from decision maker',
        maxLength: 500,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], EscalateRiskDto.prototype, "riskReason", void 0);
class DeescalateRiskDto {
    reason;
}
exports.DeescalateRiskDto = DeescalateRiskDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reason for de-escalation',
        example: 'Decision maker has re-engaged and scheduled next meeting',
        maxLength: 500,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], DeescalateRiskDto.prototype, "reason", void 0);
class RiskEscalationResponseDto {
    id;
    isHighRisk;
    riskReason;
    escalatedBy;
    escalatedAt;
    message;
}
exports.RiskEscalationResponseDto = RiskEscalationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], RiskEscalationResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is high risk',
        example: true,
    }),
    __metadata("design:type", Boolean)
], RiskEscalationResponseDto.prototype, "isHighRisk", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Risk reason',
        example: 'Deal has been stalled for 3 weeks with no response from decision maker',
    }),
    __metadata("design:type", String)
], RiskEscalationResponseDto.prototype, "riskReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Escalated by user ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], RiskEscalationResponseDto.prototype, "escalatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Escalated at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], RiskEscalationResponseDto.prototype, "escalatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message',
        example: 'Deal escalated to high risk successfully',
    }),
    __metadata("design:type", String)
], RiskEscalationResponseDto.prototype, "message", void 0);
//# sourceMappingURL=risk-escalation.dto.js.map