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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealStatsResponseDto = exports.DealListResponseDto = exports.DealResponseDto = exports.UpdateDealDto = exports.QueryDealDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const entities_1 = require("@m04/entities");
class QueryDealDto {
    ownerId;
    stage;
    forecastCategory;
    minAmount;
    maxAmount;
    closeDateFrom;
    closeDateTo;
    isHighRisk;
    search;
    page = 1;
    limit = 25;
}
exports.QueryDealDto = QueryDealDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Owner ID filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryDealDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.DealStage, description: 'Deal stage filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.DealStage),
    __metadata("design:type", typeof (_a = typeof entities_1.DealStage !== "undefined" && entities_1.DealStage) === "function" ? _a : Object)
], QueryDealDto.prototype, "stage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.ForecastCategory, description: 'Forecast category filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.ForecastCategory),
    __metadata("design:type", typeof (_b = typeof entities_1.ForecastCategory !== "undefined" && entities_1.ForecastCategory) === "function" ? _b : Object)
], QueryDealDto.prototype, "forecastCategory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Minimum deal amount' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryDealDto.prototype, "minAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Maximum deal amount' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryDealDto.prototype, "maxAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Close date from (ISO 8601)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], QueryDealDto.prototype, "closeDateFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Close date to (ISO 8601)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], QueryDealDto.prototype, "closeDateTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter high risk deals' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], QueryDealDto.prototype, "isHighRisk", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search by deal name or account name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryDealDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1, minimum: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryDealDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page', default: 25, minimum: 1, maximum: 10000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10000),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryDealDto.prototype, "limit", void 0);
class UpdateDealDto {
    name;
    stage;
    amount;
    forecastCategory;
    closeDate;
    probability;
    nextStep;
    accountName;
}
exports.UpdateDealDto = UpdateDealDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Deal name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDealDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.DealStage, description: 'Deal stage' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.DealStage),
    __metadata("design:type", typeof (_c = typeof entities_1.DealStage !== "undefined" && entities_1.DealStage) === "function" ? _c : Object)
], UpdateDealDto.prototype, "stage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Deal amount' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateDealDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.ForecastCategory, description: 'Forecast category' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.ForecastCategory),
    __metadata("design:type", typeof (_d = typeof entities_1.ForecastCategory !== "undefined" && entities_1.ForecastCategory) === "function" ? _d : Object)
], UpdateDealDto.prototype, "forecastCategory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Close date (ISO 8601)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], UpdateDealDto.prototype, "closeDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Win probability (0-100)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateDealDto.prototype, "probability", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Next step description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDealDto.prototype, "nextStep", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Account name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDealDto.prototype, "accountName", void 0);
class DealResponseDto {
    id;
    crmDealId;
    name;
    stage;
    amount;
    forecastCategory;
    ownerId;
    ownerName;
    accountId;
    accountName;
    closeDate;
    probability;
    aiScore;
    warningCount;
    contactCount;
    activityStrength;
    isHighRisk;
    riskReason;
    nextStep;
    lastActivityAt;
    lastSyncedAt;
    createdAt;
    updatedAt;
}
exports.DealResponseDto = DealResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal ID' }),
    __metadata("design:type", String)
], DealResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'CRM Deal ID' }),
    __metadata("design:type", String)
], DealResponseDto.prototype, "crmDealId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal name' }),
    __metadata("design:type", String)
], DealResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.DealStage, description: 'Deal stage' }),
    __metadata("design:type", typeof (_e = typeof entities_1.DealStage !== "undefined" && entities_1.DealStage) === "function" ? _e : Object)
], DealResponseDto.prototype, "stage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal amount' }),
    __metadata("design:type", Number)
], DealResponseDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.ForecastCategory, description: 'Forecast category' }),
    __metadata("design:type", typeof (_f = typeof entities_1.ForecastCategory !== "undefined" && entities_1.ForecastCategory) === "function" ? _f : Object)
], DealResponseDto.prototype, "forecastCategory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Owner ID' }),
    __metadata("design:type", String)
], DealResponseDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Owner name' }),
    __metadata("design:type", String)
], DealResponseDto.prototype, "ownerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Account ID' }),
    __metadata("design:type", String)
], DealResponseDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Account name' }),
    __metadata("design:type", String)
], DealResponseDto.prototype, "accountName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Close date' }),
    __metadata("design:type", Date)
], DealResponseDto.prototype, "closeDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Win probability (0-100)' }),
    __metadata("design:type", Number)
], DealResponseDto.prototype, "probability", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'AI-generated score (0-100)' }),
    __metadata("design:type", Number)
], DealResponseDto.prototype, "aiScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of active warnings' }),
    __metadata("design:type", Number)
], DealResponseDto.prototype, "warningCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of contacts engaged' }),
    __metadata("design:type", Number)
], DealResponseDto.prototype, "contactCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Activity strength score (0-10)' }),
    __metadata("design:type", Number)
], DealResponseDto.prototype, "activityStrength", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Is deal flagged as high risk' }),
    __metadata("design:type", Boolean)
], DealResponseDto.prototype, "isHighRisk", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Risk reason if high risk' }),
    __metadata("design:type", String)
], DealResponseDto.prototype, "riskReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Next step description' }),
    __metadata("design:type", String)
], DealResponseDto.prototype, "nextStep", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Last activity timestamp' }),
    __metadata("design:type", Date)
], DealResponseDto.prototype, "lastActivityAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Last sync timestamp' }),
    __metadata("design:type", Date)
], DealResponseDto.prototype, "lastSyncedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Created timestamp' }),
    __metadata("design:type", Date)
], DealResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Updated timestamp' }),
    __metadata("design:type", Date)
], DealResponseDto.prototype, "updatedAt", void 0);
class DealListResponseDto {
    deals;
    total;
    page;
    limit;
    totalPages;
}
exports.DealListResponseDto = DealListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [DealResponseDto], description: 'List of deals' }),
    __metadata("design:type", Array)
], DealListResponseDto.prototype, "deals", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of deals' }),
    __metadata("design:type", Number)
], DealListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current page number' }),
    __metadata("design:type", Number)
], DealListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Items per page' }),
    __metadata("design:type", Number)
], DealListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total pages' }),
    __metadata("design:type", Number)
], DealListResponseDto.prototype, "totalPages", void 0);
class DealStatsResponseDto {
    totalValue;
    countByStage;
    highRiskCount;
    closingSoonCount;
}
exports.DealStatsResponseDto = DealStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total deal value' }),
    __metadata("design:type", Number)
], DealStatsResponseDto.prototype, "totalValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal count by stage' }),
    __metadata("design:type", Object)
], DealStatsResponseDto.prototype, "countByStage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'High risk deal count' }),
    __metadata("design:type", Number)
], DealStatsResponseDto.prototype, "highRiskCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deals closing in next 30 days' }),
    __metadata("design:type", Number)
], DealStatsResponseDto.prototype, "closingSoonCount", void 0);
//# sourceMappingURL=deal.dto.js.map