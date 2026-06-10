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
exports.WebhookSubscriptionDto = exports.WebhookResponseDto = exports.WebhookBatchDto = exports.HubSpotWebhookDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class HubSpotWebhookDto {
    objectId;
    propertyName;
    propertyValue;
    changeSource;
    eventId;
    subscriptionId;
    portalId;
    occurredAt;
}
exports.HubSpotWebhookDto = HubSpotWebhookDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Object ID',
        example: '12345678',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HubSpotWebhookDto.prototype, "objectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Property name',
        example: 'dealstage',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HubSpotWebhookDto.prototype, "propertyName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Property value',
        example: 'closedwon',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HubSpotWebhookDto.prototype, "propertyValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Change source',
        example: 'CRM',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HubSpotWebhookDto.prototype, "changeSource", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Event ID',
        example: '123456789',
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], HubSpotWebhookDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Subscription ID',
        example: '987654',
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], HubSpotWebhookDto.prototype, "subscriptionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Portal ID',
        example: '12345',
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], HubSpotWebhookDto.prototype, "portalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Occurred at timestamp',
        example: 1642234567890,
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], HubSpotWebhookDto.prototype, "occurredAt", void 0);
class WebhookBatchDto {
    events;
}
exports.WebhookBatchDto = WebhookBatchDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Webhook events',
        type: [HubSpotWebhookDto],
    }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], WebhookBatchDto.prototype, "events", void 0);
class WebhookResponseDto {
    success;
    message;
    processedCount;
}
exports.WebhookResponseDto = WebhookResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Success status',
        example: true,
    }),
    __metadata("design:type", Boolean)
], WebhookResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message',
        example: 'Webhook processed successfully',
    }),
    __metadata("design:type", String)
], WebhookResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Processed events count',
        example: 5,
    }),
    __metadata("design:type", Number)
], WebhookResponseDto.prototype, "processedCount", void 0);
class WebhookSubscriptionDto {
    id;
    eventType;
    propertyName;
    active;
    createdAt;
}
exports.WebhookSubscriptionDto = WebhookSubscriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Subscription ID',
        example: '987654',
    }),
    __metadata("design:type", String)
], WebhookSubscriptionDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Event type',
        example: 'deal.propertyChange',
    }),
    __metadata("design:type", String)
], WebhookSubscriptionDto.prototype, "eventType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Property name (for property change events)',
        example: 'dealstage',
    }),
    __metadata("design:type", String)
], WebhookSubscriptionDto.prototype, "propertyName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Active status',
        example: true,
    }),
    __metadata("design:type", Boolean)
], WebhookSubscriptionDto.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created at timestamp',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], WebhookSubscriptionDto.prototype, "createdAt", void 0);
//# sourceMappingURL=webhook.dto.js.map