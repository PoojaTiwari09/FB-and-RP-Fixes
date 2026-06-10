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
exports.CoachingSessionDto = exports.CoachingPromptsResponseDto = exports.CoachingPromptDto = exports.GenerateCoachingPromptsDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class GenerateCoachingPromptsDto {
    dealId;
    repId;
}
exports.GenerateCoachingPromptsDto = GenerateCoachingPromptsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateCoachingPromptsDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Sales rep user ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateCoachingPromptsDto.prototype, "repId", void 0);
class CoachingPromptDto {
    question;
    context;
    category;
}
exports.CoachingPromptDto = CoachingPromptDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Coaching question',
        example: 'Have you identified the economic buyer for this deal?',
    }),
    __metadata("design:type", String)
], CoachingPromptDto.prototype, "question", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Context for the question',
        example: 'The MEDDICC playbook shows Economic Buyer criterion is not started',
    }),
    __metadata("design:type", String)
], CoachingPromptDto.prototype, "context", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category of the prompt',
        example: 'Qualification',
    }),
    __metadata("design:type", String)
], CoachingPromptDto.prototype, "category", void 0);
class CoachingPromptsResponseDto {
    dealId;
    dealName;
    repName;
    stage;
    prompts;
    focusAreas;
    generatedAt;
}
exports.CoachingPromptsResponseDto = CoachingPromptsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], CoachingPromptsResponseDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deal name',
        example: 'Acme Corp - Enterprise Plan',
    }),
    __metadata("design:type", String)
], CoachingPromptsResponseDto.prototype, "dealName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sales rep name',
        example: 'John Doe',
    }),
    __metadata("design:type", String)
], CoachingPromptsResponseDto.prototype, "repName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deal stage',
        example: 'Proposal Sent',
    }),
    __metadata("design:type", String)
], CoachingPromptsResponseDto.prototype, "stage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Coaching prompts',
        type: [CoachingPromptDto],
    }),
    __metadata("design:type", Array)
], CoachingPromptsResponseDto.prototype, "prompts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Focus areas for coaching',
        example: ['Qualification', 'Stakeholder Engagement', 'Timeline Management'],
    }),
    __metadata("design:type", Array)
], CoachingPromptsResponseDto.prototype, "focusAreas", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Generated at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], CoachingPromptsResponseDto.prototype, "generatedAt", void 0);
class CoachingSessionDto {
    id;
    dealId;
    managerId;
    repId;
    notes;
    actionItems;
    sessionDate;
    createdAt;
}
exports.CoachingSessionDto = CoachingSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Session ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], CoachingSessionDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], CoachingSessionDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Manager ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], CoachingSessionDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sales rep ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], CoachingSessionDto.prototype, "repId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Coaching notes',
        example: 'Discussed qualification criteria and next steps',
    }),
    __metadata("design:type", String)
], CoachingSessionDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Action items',
        example: ['Schedule call with economic buyer', 'Update MEDDICC playbook'],
    }),
    __metadata("design:type", Array)
], CoachingSessionDto.prototype, "actionItems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Session date',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], CoachingSessionDto.prototype, "sessionDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], CoachingSessionDto.prototype, "createdAt", void 0);
//# sourceMappingURL=coaching.dto.js.map