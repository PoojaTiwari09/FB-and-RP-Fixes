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
exports.GeneratePlaybookSuggestionsDto = exports.PlaybookSummaryDto = exports.PlaybookItemResponseDto = exports.UpdatePlaybookItemDto = exports.CreatePlaybookItemDto = exports.PlaybookItemStatus = exports.PlaybookType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const deal_playbook_entity_1 = require("@m04/entities/deal-playbook.entity");
Object.defineProperty(exports, "PlaybookType", { enumerable: true, get: function () { return deal_playbook_entity_1.PlaybookType; } });
Object.defineProperty(exports, "PlaybookItemStatus", { enumerable: true, get: function () { return deal_playbook_entity_1.PlaybookItemStatus; } });
class CreatePlaybookItemDto {
    type;
    criterion;
    notes;
    order;
}
exports.CreatePlaybookItemDto = CreatePlaybookItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Playbook type',
        enum: deal_playbook_entity_1.PlaybookType,
        example: deal_playbook_entity_1.PlaybookType.MEDDICC,
    }),
    (0, class_validator_1.IsEnum)(deal_playbook_entity_1.PlaybookType),
    __metadata("design:type", typeof (_a = typeof deal_playbook_entity_1.PlaybookType !== "undefined" && deal_playbook_entity_1.PlaybookType) === "function" ? _a : Object)
], CreatePlaybookItemDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Criterion name (e.g., Metrics, Economic Buyer)',
        example: 'Metrics',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlaybookItemDto.prototype, "criterion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notes for this criterion',
        example: 'Customer wants to reduce costs by 30%',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePlaybookItemDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Display order',
        example: 1,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePlaybookItemDto.prototype, "order", void 0);
class UpdatePlaybookItemDto {
    status;
    notes;
    aiSuggestion;
}
exports.UpdatePlaybookItemDto = UpdatePlaybookItemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Playbook status',
        enum: deal_playbook_entity_1.PlaybookItemStatus,
        example: deal_playbook_entity_1.PlaybookItemStatus.COMPLETED,
    }),
    (0, class_validator_1.IsEnum)(deal_playbook_entity_1.PlaybookItemStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_b = typeof deal_playbook_entity_1.PlaybookItemStatus !== "undefined" && deal_playbook_entity_1.PlaybookItemStatus) === "function" ? _b : Object)
], UpdatePlaybookItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notes for this criterion',
        example: 'Customer wants to reduce costs by 30%',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePlaybookItemDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'AI-generated suggestion',
        example: 'Consider asking about current cost structure',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePlaybookItemDto.prototype, "aiSuggestion", void 0);
class PlaybookItemResponseDto {
    id;
    dealId;
    type;
    criterion;
    status;
    notes;
    aiSuggestion;
    order;
    completedBy;
    completedAt;
    createdAt;
    updatedAt;
}
exports.PlaybookItemResponseDto = PlaybookItemResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Playbook item ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], PlaybookItemResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], PlaybookItemResponseDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Playbook type',
        enum: deal_playbook_entity_1.PlaybookType,
        example: deal_playbook_entity_1.PlaybookType.MEDDICC,
    }),
    __metadata("design:type", typeof (_c = typeof deal_playbook_entity_1.PlaybookType !== "undefined" && deal_playbook_entity_1.PlaybookType) === "function" ? _c : Object)
], PlaybookItemResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Criterion name',
        example: 'Metrics',
    }),
    __metadata("design:type", String)
], PlaybookItemResponseDto.prototype, "criterion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Playbook status',
        enum: deal_playbook_entity_1.PlaybookItemStatus,
        example: deal_playbook_entity_1.PlaybookItemStatus.IN_PROGRESS,
    }),
    __metadata("design:type", typeof (_d = typeof deal_playbook_entity_1.PlaybookItemStatus !== "undefined" && deal_playbook_entity_1.PlaybookItemStatus) === "function" ? _d : Object)
], PlaybookItemResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notes',
        example: 'Customer wants to reduce costs by 30%',
    }),
    __metadata("design:type", String)
], PlaybookItemResponseDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'AI suggestion',
        example: 'Consider asking about current cost structure',
    }),
    __metadata("design:type", String)
], PlaybookItemResponseDto.prototype, "aiSuggestion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Display order',
        example: 1,
    }),
    __metadata("design:type", Number)
], PlaybookItemResponseDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Completed by user ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], PlaybookItemResponseDto.prototype, "completedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Completed at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], PlaybookItemResponseDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], PlaybookItemResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Updated at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], PlaybookItemResponseDto.prototype, "updatedAt", void 0);
class PlaybookSummaryDto {
    type;
    totalItems;
    completedItems;
    inProgressItems;
    notStartedItems;
    completionPercentage;
    items;
}
exports.PlaybookSummaryDto = PlaybookSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Playbook type',
        enum: deal_playbook_entity_1.PlaybookType,
        example: deal_playbook_entity_1.PlaybookType.MEDDICC,
    }),
    __metadata("design:type", typeof (_e = typeof deal_playbook_entity_1.PlaybookType !== "undefined" && deal_playbook_entity_1.PlaybookType) === "function" ? _e : Object)
], PlaybookSummaryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total items',
        example: 7,
    }),
    __metadata("design:type", Number)
], PlaybookSummaryDto.prototype, "totalItems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Completed items',
        example: 4,
    }),
    __metadata("design:type", Number)
], PlaybookSummaryDto.prototype, "completedItems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'In progress items',
        example: 2,
    }),
    __metadata("design:type", Number)
], PlaybookSummaryDto.prototype, "inProgressItems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Not started items',
        example: 1,
    }),
    __metadata("design:type", Number)
], PlaybookSummaryDto.prototype, "notStartedItems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Completion percentage',
        example: 57.14,
    }),
    __metadata("design:type", Number)
], PlaybookSummaryDto.prototype, "completionPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Playbook items',
        type: [PlaybookItemResponseDto],
    }),
    __metadata("design:type", Array)
], PlaybookSummaryDto.prototype, "items", void 0);
class GeneratePlaybookSuggestionsDto {
    type;
}
exports.GeneratePlaybookSuggestionsDto = GeneratePlaybookSuggestionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Playbook type',
        enum: deal_playbook_entity_1.PlaybookType,
        example: deal_playbook_entity_1.PlaybookType.MEDDICC,
    }),
    (0, class_validator_1.IsEnum)(deal_playbook_entity_1.PlaybookType),
    __metadata("design:type", typeof (_f = typeof deal_playbook_entity_1.PlaybookType !== "undefined" && deal_playbook_entity_1.PlaybookType) === "function" ? _f : Object)
], GeneratePlaybookSuggestionsDto.prototype, "type", void 0);
//# sourceMappingURL=playbook.dto.js.map