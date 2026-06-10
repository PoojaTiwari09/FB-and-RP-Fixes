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
exports.ResolveWarningDto = exports.QueryWarningDto = exports.WarningListResponseDto = exports.DealWarningResponseDto = exports.GenerateWarningsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const entities_1 = require("@/entities");
class GenerateWarningsDto {
    dealId;
}
exports.GenerateWarningsDto = GenerateWarningsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal ID to generate warnings for' }),
    __metadata("design:type", String)
], GenerateWarningsDto.prototype, "dealId", void 0);
class DealWarningResponseDto {
    id;
    dealId;
    type;
    severity;
    message;
    recommendedAction;
    isActive;
    metadata;
    resolvedAt;
    resolvedBy;
    createdAt;
    updatedAt;
}
exports.DealWarningResponseDto = DealWarningResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Warning ID' }),
    __metadata("design:type", String)
], DealWarningResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal ID' }),
    __metadata("design:type", String)
], DealWarningResponseDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.WarningType, description: 'Warning type' }),
    __metadata("design:type", String)
], DealWarningResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.WarningSeverity, description: 'Warning severity' }),
    __metadata("design:type", String)
], DealWarningResponseDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Warning message' }),
    __metadata("design:type", String)
], DealWarningResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Recommended action' }),
    __metadata("design:type", String)
], DealWarningResponseDto.prototype, "recommendedAction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Is warning active' }),
    __metadata("design:type", Boolean)
], DealWarningResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata' }),
    __metadata("design:type", Object)
], DealWarningResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Resolved timestamp' }),
    __metadata("design:type", Date)
], DealWarningResponseDto.prototype, "resolvedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Resolved by user ID' }),
    __metadata("design:type", String)
], DealWarningResponseDto.prototype, "resolvedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Created timestamp' }),
    __metadata("design:type", Date)
], DealWarningResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Updated timestamp' }),
    __metadata("design:type", Date)
], DealWarningResponseDto.prototype, "updatedAt", void 0);
class WarningListResponseDto {
    warnings;
    total;
}
exports.WarningListResponseDto = WarningListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [DealWarningResponseDto], description: 'List of warnings' }),
    __metadata("design:type", Array)
], WarningListResponseDto.prototype, "warnings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total count' }),
    __metadata("design:type", Number)
], WarningListResponseDto.prototype, "total", void 0);
class QueryWarningDto {
    type;
    severity;
    limit = 50;
}
exports.QueryWarningDto = QueryWarningDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.WarningType, description: 'Filter by warning type' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.WarningType),
    __metadata("design:type", String)
], QueryWarningDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.WarningSeverity, description: 'Filter by severity' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.WarningSeverity),
    __metadata("design:type", String)
], QueryWarningDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Limit number of results', default: 50, minimum: 1, maximum: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryWarningDto.prototype, "limit", void 0);
class ResolveWarningDto {
    warningId;
}
exports.ResolveWarningDto = ResolveWarningDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Warning ID to resolve' }),
    __metadata("design:type", String)
], ResolveWarningDto.prototype, "warningId", void 0);
//# sourceMappingURL=deal-warning.dto.js.map