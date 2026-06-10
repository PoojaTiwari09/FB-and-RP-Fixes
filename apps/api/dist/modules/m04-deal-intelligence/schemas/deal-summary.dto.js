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
exports.QuerySummaryDto = exports.WeeklyChangesResponseDto = exports.SummaryHistoryResponseDto = exports.DealSummaryResponseDto = exports.GenerateSummaryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class GenerateSummaryDto {
    dealId;
}
exports.GenerateSummaryDto = GenerateSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal ID to generate summary for' }),
    __metadata("design:type", String)
], GenerateSummaryDto.prototype, "dealId", void 0);
class DealSummaryResponseDto {
    id;
    dealId;
    summary;
    keyPoints;
    nextSteps;
    competitorMentions;
    confidenceScore;
    flaggedForReview;
    weeklyChanges;
    isCurrent;
    createdAt;
    updatedAt;
}
exports.DealSummaryResponseDto = DealSummaryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Summary ID' }),
    __metadata("design:type", String)
], DealSummaryResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deal ID' }),
    __metadata("design:type", String)
], DealSummaryResponseDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'AI-generated summary text' }),
    __metadata("design:type", String)
], DealSummaryResponseDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: 'Key points extracted' }),
    __metadata("design:type", Array)
], DealSummaryResponseDto.prototype, "keyPoints", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: 'Recommended next steps' }),
    __metadata("design:type", Array)
], DealSummaryResponseDto.prototype, "nextSteps", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Competitor mentions' }),
    __metadata("design:type", Array)
], DealSummaryResponseDto.prototype, "competitorMentions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'AI confidence score (0-1)' }),
    __metadata("design:type", Number)
], DealSummaryResponseDto.prototype, "confidenceScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Flagged for manual review' }),
    __metadata("design:type", Boolean)
], DealSummaryResponseDto.prototype, "flaggedForReview", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Weekly changes detected' }),
    __metadata("design:type", Object)
], DealSummaryResponseDto.prototype, "weeklyChanges", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Is this the current summary' }),
    __metadata("design:type", Boolean)
], DealSummaryResponseDto.prototype, "isCurrent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Created timestamp' }),
    __metadata("design:type", Date)
], DealSummaryResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Updated timestamp' }),
    __metadata("design:type", Date)
], DealSummaryResponseDto.prototype, "updatedAt", void 0);
class SummaryHistoryResponseDto {
    summaries;
    total;
}
exports.SummaryHistoryResponseDto = SummaryHistoryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [DealSummaryResponseDto], description: 'Summary history' }),
    __metadata("design:type", Array)
], SummaryHistoryResponseDto.prototype, "summaries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total count' }),
    __metadata("design:type", Number)
], SummaryHistoryResponseDto.prototype, "total", void 0);
class WeeklyChangesResponseDto {
    hasChanges;
    summaryChanged;
    keyPointsAdded;
    keyPointsRemoved;
    nextStepsAdded;
    nextStepsRemoved;
    competitorChanges;
    confidenceScoreChange;
    message;
}
exports.WeeklyChangesResponseDto = WeeklyChangesResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Has changes detected' }),
    __metadata("design:type", Boolean)
], WeeklyChangesResponseDto.prototype, "hasChanges", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Summary text changed' }),
    __metadata("design:type", Boolean)
], WeeklyChangesResponseDto.prototype, "summaryChanged", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Key points added' }),
    __metadata("design:type", Array)
], WeeklyChangesResponseDto.prototype, "keyPointsAdded", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Key points removed' }),
    __metadata("design:type", Array)
], WeeklyChangesResponseDto.prototype, "keyPointsRemoved", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Next steps added' }),
    __metadata("design:type", Array)
], WeeklyChangesResponseDto.prototype, "nextStepsAdded", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Next steps removed' }),
    __metadata("design:type", Array)
], WeeklyChangesResponseDto.prototype, "nextStepsRemoved", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Competitor changes' }),
    __metadata("design:type", Object)
], WeeklyChangesResponseDto.prototype, "competitorChanges", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Confidence score change' }),
    __metadata("design:type", Number)
], WeeklyChangesResponseDto.prototype, "confidenceScoreChange", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Message if no changes' }),
    __metadata("design:type", String)
], WeeklyChangesResponseDto.prototype, "message", void 0);
class QuerySummaryDto {
    limit = 10;
}
exports.QuerySummaryDto = QuerySummaryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Limit number of results', default: 10, minimum: 1, maximum: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QuerySummaryDto.prototype, "limit", void 0);
//# sourceMappingURL=deal-summary.dto.js.map