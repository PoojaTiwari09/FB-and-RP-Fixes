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
var WebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@/database/inject-repository");
const m04_entity_repository_1 = require("@/database/m04-entity.repository");
const deal_entity_1 = require("@/entities/deal.entity");
const hubspot_client_service_1 = require("./hubspot-client.service");
const deal_sync_service_1 = require("./deal-sync.service");
let WebhookService = WebhookService_1 = class WebhookService {
    dealRepository;
    hubspotClient;
    dealSyncService;
    logger = new common_1.Logger(WebhookService_1.name);
    constructor(dealRepository, hubspotClient, dealSyncService) {
        this.dealRepository = dealRepository;
        this.hubspotClient = hubspotClient;
        this.dealSyncService = dealSyncService;
    }
    async processWebhook(event) {
        this.logger.log(`Processing webhook event ${event.eventId} for object ${event.objectId}`);
        try {
            const deal = await this.dealRepository.findOne({
                where: { crmDealId: event.objectId },
            });
            if (!deal) {
                this.logger.warn(`Deal not found for HubSpot ID ${event.objectId}, syncing...`);
                await this.dealSyncService.syncSingleDeal(event.objectId);
                return;
            }
            switch (event.propertyName) {
                case 'dealstage':
                    await this.handleStageChange(deal, event.propertyValue);
                    break;
                case 'amount':
                    await this.handleAmountChange(deal, event.propertyValue);
                    break;
                case 'closedate':
                    await this.handleCloseDateChange(deal, event.propertyValue);
                    break;
                case 'dealname':
                    await this.handleNameChange(deal, event.propertyValue);
                    break;
                default:
                    await this.dealSyncService.syncSingleDeal(event.objectId);
            }
            this.logger.log(`Successfully processed webhook event ${event.eventId}`);
        }
        catch (error) {
            this.logger.error(`Failed to process webhook event ${event.eventId}:`, error);
            throw error;
        }
    }
    async processBatch(batch) {
        let processed = 0;
        for (const event of batch.events) {
            try {
                await this.processWebhook(event);
                processed++;
            }
            catch (error) {
                this.logger.error(`Failed to process event ${event.eventId}:`, error);
            }
        }
        return processed;
    }
    async handleStageChange(deal, newStage) {
        const oldStage = deal.stage;
        deal.stage = newStage;
        deal.updatedAt = new Date();
        await this.dealRepository.save(deal);
        this.logger.log(`Deal ${deal.id} stage changed from ${oldStage} to ${newStage}`);
        if (newStage.toLowerCase().includes('closed')) {
            this.logger.log(`Deal ${deal.id} closed`);
        }
    }
    async handleAmountChange(deal, newAmount) {
        const oldAmount = deal.amount;
        deal.amount = parseFloat(newAmount) || 0;
        deal.updatedAt = new Date();
        await this.dealRepository.save(deal);
        this.logger.log(`Deal ${deal.id} amount changed from ${oldAmount} to ${newAmount}`);
    }
    async handleCloseDateChange(deal, newCloseDate) {
        const oldCloseDate = deal.closeDate;
        deal.closeDate = new Date(newCloseDate);
        deal.updatedAt = new Date();
        await this.dealRepository.save(deal);
        this.logger.log(`Deal ${deal.id} close date changed from ${oldCloseDate} to ${newCloseDate}`);
    }
    async handleNameChange(deal, newName) {
        const oldName = deal.name;
        deal.name = newName;
        deal.updatedAt = new Date();
        await this.dealRepository.save(deal);
        this.logger.log(`Deal ${deal.id} name changed from ${oldName} to ${newName}`);
    }
    verifySignature(requestBody, signature, timestamp, secret) {
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(timestamp + requestBody)
            .digest('hex');
        const providedSignature = signature.replace('sha256=', '');
        return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature));
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = WebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(deal_entity_1.Deal)),
    __metadata("design:paramtypes", [m04_entity_repository_1.M04EntityRepository,
        hubspot_client_service_1.HubSpotClientService,
        deal_sync_service_1.DealSyncService])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map