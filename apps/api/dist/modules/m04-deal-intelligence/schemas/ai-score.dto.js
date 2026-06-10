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
exports.ScoreHistoryResponseDto = exports.ScoreHistoryDto = exports.AIScoreResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AIScoreResponseDto {
    dealId;
    score;
    explanation;
    factors;
    recommendations;
    generatedAt;
}
exports.AIScoreResponseDto = AIScoreResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], AIScoreResponseDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'AI score (0-100)',
        example: 75,
    }),
    __metadata("design:type", Number)
], AIScoreResponseDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Score explanation',
        example: 'High engagement, strong champion, but missing economic buyer',
    }),
    __metadata("design:type", String)
], AIScoreResponseDto.prototype, "explanation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Score factors',
        example: {
            engagement: 85,
            qualification: 70,
            momentum: 65,
            risk: 80,
        },
    }),
    __metadata("design:type", Object)
], AIScoreResponseDto.prototype, "factors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Recommendations',
        type: [String],
        example: ['Schedule meeting with economic buyer', 'Update MEDDICC criteria'],
    }),
    __metadata("design:type", Array)
], AIScoreResponseDto.prototype, "recommendations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Generated at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], AIScoreResponseDto.prototype, "generatedAt", void 0);
class ScoreHistoryDto {
    score;
    recordedAt;
    change;
}
exports.ScoreHistoryDto = ScoreHistoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Score',
        example: 75,
    }),
    __metadata("design:type", Number)
], ScoreHistoryDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Recorded at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], ScoreHistoryDto.prototype, "recordedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Change from previous score',
        example: 5,
    }),
    __metadata("design:type", Number)
], ScoreHistoryDto.prototype, "change", void 0);
class ScoreHistoryResponseDto {
    dealId;
    currentScore;
    history;
    averageScore;
    trend;
}
exports.ScoreHistoryResponseDto = ScoreHistoryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], ScoreHistoryResponseDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Current score',
        example: 75,
    }),
    __metadata("design:type", Number)
], ScoreHistoryResponseDto.prototype, "currentScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Score history',
        type: [ScoreHistoryDto],
    }),
    __metadata("design:type", Array)
], ScoreHistoryResponseDto.prototype, "history", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Average score',
        example: 72.5,
    }),
    __metadata("design:type", Number)
], ScoreHistoryResponseDto.prototype, "averageScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Trend (up, down, stable)',
        example: 'up',
    }),
    __metadata("design:type", String)
], ScoreHistoryResponseDto.prototype, "trend", void 0);
//# sourceMappingURL=ai-score.dto.js.map