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
exports.MarkAsReadDto = exports.NotificationStatsDto = exports.NotificationQueryDto = exports.NotificationResponseDto = exports.NotificationPriority = exports.NotificationType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var NotificationType;
(function (NotificationType) {
    NotificationType["DEAL_STAGE_CHANGE"] = "DEAL_STAGE_CHANGE";
    NotificationType["DEAL_WARNING"] = "DEAL_WARNING";
    NotificationType["TASK_ASSIGNED"] = "TASK_ASSIGNED";
    NotificationType["TASK_DUE_SOON"] = "TASK_DUE_SOON";
    NotificationType["TASK_OVERDUE"] = "TASK_OVERDUE";
    NotificationType["COMMENT_MENTION"] = "COMMENT_MENTION";
    NotificationType["RISK_ESCALATION"] = "RISK_ESCALATION";
    NotificationType["PLAYBOOK_COMPLETED"] = "PLAYBOOK_COMPLETED";
    NotificationType["DEAL_CLOSING_SOON"] = "DEAL_CLOSING_SOON";
    NotificationType["AI_SCORE_CHANGE"] = "AI_SCORE_CHANGE";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["MEDIUM"] = "MEDIUM";
    NotificationPriority["HIGH"] = "HIGH";
    NotificationPriority["URGENT"] = "URGENT";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
class NotificationResponseDto {
    id;
    userId;
    type;
    title;
    message;
    priority;
    dealId;
    entityId;
    actionUrl;
    isRead;
    createdAt;
    readAt;
}
exports.NotificationResponseDto = NotificationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notification ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notification type',
        enum: NotificationType,
        example: NotificationType.TASK_ASSIGNED,
    }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notification title',
        example: 'New task assigned',
    }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notification message',
        example: 'You have been assigned a new task: Follow up with decision maker',
    }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Priority',
        enum: NotificationPriority,
        example: NotificationPriority.MEDIUM,
    }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Related deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "dealId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Related entity ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "entityId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Action URL',
        example: '/deals/123e4567-e89b-12d3-a456-426614174000/tasks',
    }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "actionUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Read status',
        example: false,
    }),
    __metadata("design:type", Boolean)
], NotificationResponseDto.prototype, "isRead", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], NotificationResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Read at timestamp',
        example: '2024-01-15T11:00:00Z',
    }),
    __metadata("design:type", Date)
], NotificationResponseDto.prototype, "readAt", void 0);
class NotificationQueryDto {
    type;
    isRead;
    page = 1;
    limit = 20;
}
exports.NotificationQueryDto = NotificationQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by type',
        enum: NotificationType,
    }),
    (0, class_validator_1.IsEnum)(NotificationType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NotificationQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by read status',
        example: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], NotificationQueryDto.prototype, "isRead", void 0);
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
], NotificationQueryDto.prototype, "page", void 0);
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
], NotificationQueryDto.prototype, "limit", void 0);
class NotificationStatsDto {
    total;
    unread;
    byType;
    byPriority;
}
exports.NotificationStatsDto = NotificationStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total notifications',
        example: 45,
    }),
    __metadata("design:type", Number)
], NotificationStatsDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unread notifications',
        example: 12,
    }),
    __metadata("design:type", Number)
], NotificationStatsDto.prototype, "unread", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notifications by type',
        example: {
            TASK_ASSIGNED: 5,
            DEAL_WARNING: 3,
            COMMENT_MENTION: 4,
        },
    }),
    __metadata("design:type", Object)
], NotificationStatsDto.prototype, "byType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notifications by priority',
        example: {
            URGENT: 2,
            HIGH: 5,
            MEDIUM: 3,
            LOW: 2,
        },
    }),
    __metadata("design:type", Object)
], NotificationStatsDto.prototype, "byPriority", void 0);
class MarkAsReadDto {
    notificationIds;
}
exports.MarkAsReadDto = MarkAsReadDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notification IDs to mark as read',
        example: ['123e4567-e89b-12d3-a456-426614174000'],
    }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MarkAsReadDto.prototype, "notificationIds", void 0);
//# sourceMappingURL=notification.dto.js.map