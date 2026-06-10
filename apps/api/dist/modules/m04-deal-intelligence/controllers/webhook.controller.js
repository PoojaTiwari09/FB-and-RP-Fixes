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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const webhook_service_1 = require("@/services/webhook.service");
const webhook_dto_1 = require("@/schemas/webhook.dto");
const config_1 = require("@nestjs/config");
let WebhookController = WebhookController_1 = class WebhookController {
    webhookService;
    configService;
    logger = new common_1.Logger(WebhookController_1.name);
    constructor(webhookService, configService) {
        this.webhookService = webhookService;
        this.configService = configService;
    }
    async handleHubSpotWebhook(body, signature, timestamp) {
        this.logger.log('Received HubSpot webhook');
        const webhookSecret = this.configService.get('HUBSPOT_WEBHOOK_SECRET');
        if (webhookSecret && signature && timestamp) {
            const isValid = this.webhookService.verifySignature(JSON.stringify(body), signature, timestamp, webhookSecret);
            if (!isValid) {
                this.logger.warn('Invalid webhook signature');
                throw new common_1.BadRequestException('Invalid webhook signature');
            }
        }
        try {
            let processedCount = 0;
            if (Array.isArray(body)) {
                processedCount = await this.webhookService.processBatch({ events: body });
            }
            else if (body.objectId) {
                await this.webhookService.processWebhook(body);
                processedCount = 1;
            }
            else {
                throw new common_1.BadRequestException('Invalid webhook payload');
            }
            return {
                success: true,
                message: 'Webhook processed successfully',
                processedCount,
            };
        }
        catch (error) {
            this.logger.error('Failed to process webhook:', error);
            throw error;
        }
    }
    async testWebhook(body) {
        this.logger.log('Received test webhook:', JSON.stringify(body));
        return {
            message: 'Test webhook received successfully',
            received: body,
        };
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)('hubspot'),
    (0, swagger_1.ApiOperation)({
        summary: 'HubSpot webhook endpoint',
        description: 'Receive webhook events from HubSpot',
    }),
    (0, swagger_1.ApiHeader)({
        name: 'X-HubSpot-Signature',
        description: 'HubSpot signature for verification',
        required: false,
    }),
    (0, swagger_1.ApiHeader)({
        name: 'X-HubSpot-Request-Timestamp',
        description: 'Request timestamp',
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Webhook processed successfully',
        type: webhook_dto_1.WebhookResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid webhook signature or payload',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-hubspot-signature')),
    __param(2, (0, common_1.Headers)('x-hubspot-request-timestamp')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleHubSpotWebhook", null);
__decorate([
    (0, common_1.Post)('hubspot/test'),
    (0, swagger_1.ApiOperation)({
        summary: 'Test HubSpot webhook',
        description: 'Test endpoint for HubSpot webhook integration',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test webhook received',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "testWebhook", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, swagger_1.ApiTags)('Webhooks'),
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhook_service_1.WebhookService,
        config_1.ConfigService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map