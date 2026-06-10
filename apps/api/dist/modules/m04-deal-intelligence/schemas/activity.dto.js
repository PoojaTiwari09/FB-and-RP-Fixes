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
exports.ActivityTimelineDto = exports.ActivityQueryDto = exports.ActivityResponseDto = exports.UpdateActivityDto = exports.CreateActivityDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const deal_activity_entity_1 = require("@/entities/deal-activity.entity");
class CreateActivityDto {
    type;
    subject;
    summary;
    contactId;
    contactName;
    activityDate;
    durationMinutes;
    crmActivityId;
    crmData;
}
exports.CreateActivityDto = CreateActivityDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Activity type',
        enum: deal_activity_entity_1.ActivityType,
        example: deal_activity_entity_1.ActivityType.EMAIL,
    }),
    (0, class_validator_1.IsEnum)(deal_activity_entity_1.ActivityType),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Activity subject',
        example: 'Follow-up call with decision maker',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Activity summary',
        example: 'Discussed pricing and implementation timeline',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Contact ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "contactId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Contact name',
        example: 'John Smith',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "contactName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Activity date',
        example: '2024-01-15T10:30:00Z',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "activityDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Duration in minutes',
        example: 30,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateActivityDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'CRM activity ID',
        example: '12345678',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "crmActivityId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'CRM data',
        example: {},
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateActivityDto.prototype, "crmData", void 0);
class UpdateActivityDto {
    subject;
    summary;
    contactId;
    contactName;
    activityDate;
    durationMinutes;
}
exports.UpdateActivityDto = UpdateActivityDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Activity subject',
        example: 'Follow-up call with decision maker',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateActivityDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Activity summary',
        example: 'Discussed pricing and implementation timeline',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateActivityDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Contact ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateActivityDto.prototype, "contactId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Contact name',
        example: 'John Smith',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateActivityDto.prototype, "contactName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Activity date',
        example: '2024-01-15T10:30:00Z',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateActivityDto.prototype, "activityDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Duration in minutes',
        example: 30,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateActivityDto.prototype, "durationMinutes", void 0);
class ActivityResponseDto {
    id;
    dealId;
    type;
    subject;
    summary;
    contactId;
    contactName;
    activityDate;
    durationMinutes;
    crmActivityId;
    crmData;
    createdAt;
}
exports.ActivityResponseDto = ActivityResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Activity ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], ActivityResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], ActivityResponseDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Activity type',
        enum: deal_activity_entity_1.ActivityType,
        example: deal_activity_entity_1.ActivityType.EMAIL,
    }),
    __metadata("design:type", String)
], ActivityResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Activity subject',
        example: 'Follow-up call with decision maker',
    }),
    __metadata("design:type", String)
], ActivityResponseDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Activity summary',
        example: 'Discussed pricing and implementation timeline',
    }),
    __metadata("design:type", String)
], ActivityResponseDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Contact ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], ActivityResponseDto.prototype, "contactId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Contact name',
        example: 'John Smith',
    }),
    __metadata("design:type", String)
], ActivityResponseDto.prototype, "contactName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Activity date',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], ActivityResponseDto.prototype, "activityDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Duration in minutes',
        example: 30,
    }),
    __metadata("design:type", Number)
], ActivityResponseDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CRM activity ID',
        example: '12345678',
    }),
    __metadata("design:type", String)
], ActivityResponseDto.prototype, "crmActivityId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'CRM data',
        example: {},
    }),
    __metadata("design:type", Object)
], ActivityResponseDto.prototype, "crmData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], ActivityResponseDto.prototype, "createdAt", void 0);
class ActivityQueryDto {
    type;
    startDate;
    endDate;
    page = 1;
    limit = 20;
}
exports.ActivityQueryDto = ActivityQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by activity type',
        enum: deal_activity_entity_1.ActivityType,
    }),
    (0, class_validator_1.IsEnum)(deal_activity_entity_1.ActivityType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActivityQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Start date for filtering',
        example: '2024-01-01',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActivityQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'End date for filtering',
        example: '2024-12-31',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActivityQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Page number',
        example: 1,
        default: 1,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ActivityQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Items per page',
        example: 20,
        default: 20,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ActivityQueryDto.prototype, "limit", void 0);
class ActivityTimelineDto {
    total;
    byType;
    activities;
    lastActivityDate;
}
exports.ActivityTimelineDto = ActivityTimelineDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total activities',
        example: 45,
    }),
    __metadata("design:type", Number)
], ActivityTimelineDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Activities by type',
        example: {
            EMAIL: 15,
            CALL: 10,
            MEETING: 8,
            NOTE: 12,
        },
    }),
    __metadata("design:type", Object)
], ActivityTimelineDto.prototype, "byType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Recent activities',
        type: [ActivityResponseDto],
    }),
    __metadata("design:type", Array)
], ActivityTimelineDto.prototype, "activities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Last activity date',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], ActivityTimelineDto.prototype, "lastActivityDate", void 0);
//# sourceMappingURL=activity.dto.js.map