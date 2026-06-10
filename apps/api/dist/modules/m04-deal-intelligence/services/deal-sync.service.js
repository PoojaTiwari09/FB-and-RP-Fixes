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
var DealSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealSyncService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@/database/inject-repository");
const m04_entity_repository_1 = require("@/database/m04-entity.repository");
const schedule_1 = require("@nestjs/schedule");
const hubspot_client_service_1 = require("./hubspot-client.service");
const entities_1 = require("@/entities");
const hubspot_types_interface_1 = require("@/interfaces/hubspot-types.interface");
let DealSyncService = DealSyncService_1 = class DealSyncService {
    dealRepository;
    syncLogRepository;
    hubspotClient;
    logger = new common_1.Logger(DealSyncService_1.name);
    isSyncing = false;
    constructor(dealRepository, syncLogRepository, hubspotClient) {
        this.dealRepository = dealRepository;
        this.syncLogRepository = syncLogRepository;
        this.hubspotClient = hubspotClient;
    }
    async handleIncrementalSync() {
        if (this.isSyncing) {
            this.logger.warn('Sync already in progress, skipping');
            return;
        }
        if (!this.hubspotClient.isConfigured()) {
            this.logger.warn('Skipping incremental deal sync: HubSpot client is not configured (missing HUBSPOT_ACCESS_TOKEN or HUBSPOT_API_KEY)');
            return;
        }
        this.logger.log('Starting incremental deal sync');
        try {
            await this.syncDeals(entities_1.SyncType.INCREMENTAL);
        }
        catch (error) {
            this.logger.error('Incremental sync cron task failed', error);
        }
    }
    async syncDeals(syncType = entities_1.SyncType.INCREMENTAL) {
        if (!this.hubspotClient.isConfigured()) {
            throw new common_1.HttpException('HubSpot integration is not configured. Please check your environment variables.', common_1.HttpStatus.BAD_REQUEST);
        }
        this.isSyncing = true;
        const syncLog = await this.createSyncLog(syncType, entities_1.SyncEntityType.DEAL);
        try {
            await this.updateSyncLog(syncLog.id, {
                status: entities_1.SyncStatus.IN_PROGRESS,
                startedAt: new Date(),
            });
            let allDeals = [];
            let after;
            let hasMore = true;
            while (hasMore) {
                const response = await this.hubspotClient.getDeals(100, after);
                allDeals = allDeals.concat(response.results);
                if (response.paging?.next?.after) {
                    after = response.paging.next.after;
                }
                else {
                    hasMore = false;
                }
            }
            this.logger.log(`Fetched ${allDeals.length} deals from HubSpot`);
            let created = 0;
            let updated = 0;
            let failed = 0;
            for (const hubspotDeal of allDeals) {
                try {
                    const existingDeal = await this.dealRepository.findOne({
                        where: { crmDealId: hubspotDeal.id },
                    });
                    if (existingDeal) {
                        await this.updateDealFromHubSpot(existingDeal, hubspotDeal);
                        updated++;
                    }
                    else {
                        await this.createDealFromHubSpot(hubspotDeal);
                        created++;
                    }
                }
                catch (error) {
                    this.logger.error(`Failed to sync deal ${hubspotDeal.id}`, error.stack);
                    failed++;
                }
            }
            const completedAt = new Date();
            const durationMs = syncLog.startedAt
                ? completedAt.getTime() - syncLog.startedAt.getTime()
                : 0;
            await this.updateSyncLog(syncLog.id, {
                status: entities_1.SyncStatus.COMPLETED,
                recordsProcessed: allDeals.length,
                recordsCreated: created,
                recordsUpdated: updated,
                recordsFailed: failed,
                completedAt,
                durationMs,
            });
            this.logger.log(`Sync completed: ${created} created, ${updated} updated, ${failed} failed`);
            const finalLog = await this.syncLogRepository.findOne({ where: { id: syncLog.id } });
            return finalLog;
        }
        catch (error) {
            this.logger.error('Sync failed', error.stack);
            await this.updateSyncLog(syncLog.id, {
                status: entities_1.SyncStatus.FAILED,
                errorMessage: error.message,
                errorDetails: { stack: error.stack },
                completedAt: new Date(),
            });
            throw error;
        }
        finally {
            this.isSyncing = false;
        }
    }
    async createDealFromHubSpot(hubspotDeal) {
        const owner = hubspotDeal.properties.hubspot_owner_id
            ? await this.hubspotClient.getOwnerById(hubspotDeal.properties.hubspot_owner_id)
            : null;
        const deal = this.dealRepository.create({
            crmDealId: hubspotDeal.id,
            name: hubspotDeal.properties.dealname || 'Untitled Deal',
            stage: this.mapHubSpotStage(hubspotDeal.properties.dealstage),
            amount: parseFloat(hubspotDeal.properties.amount || '0'),
            forecastCategory: this.mapForecastCategory(hubspotDeal.properties.hs_forecast_category),
            ownerId: hubspotDeal.properties.hubspot_owner_id || 'unknown',
            ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown',
            closeDate: hubspotDeal.properties.closedate
                ? new Date(hubspotDeal.properties.closedate)
                : undefined,
            probability: parseInt(hubspotDeal.properties.hs_forecast_probability || '0', 10),
            crmData: hubspotDeal.properties,
            lastSyncedAt: new Date(),
        });
        return this.dealRepository.save(deal);
    }
    async updateDealFromHubSpot(existingDeal, hubspotDeal) {
        const owner = hubspotDeal.properties.hubspot_owner_id
            ? await this.hubspotClient.getOwnerById(hubspotDeal.properties.hubspot_owner_id)
            : null;
        existingDeal.name = hubspotDeal.properties.dealname || existingDeal.name;
        existingDeal.stage = this.mapHubSpotStage(hubspotDeal.properties.dealstage);
        existingDeal.amount = parseFloat(hubspotDeal.properties.amount || '0');
        existingDeal.forecastCategory = this.mapForecastCategory(hubspotDeal.properties.hs_forecast_category);
        existingDeal.ownerId = hubspotDeal.properties.hubspot_owner_id || existingDeal.ownerId;
        existingDeal.ownerName = owner
            ? `${owner.firstName} ${owner.lastName}`
            : existingDeal.ownerName;
        existingDeal.closeDate = hubspotDeal.properties.closedate
            ? new Date(hubspotDeal.properties.closedate)
            : existingDeal.closeDate;
        existingDeal.probability = parseInt(hubspotDeal.properties.hs_forecast_probability || '0', 10);
        existingDeal.crmData = hubspotDeal.properties;
        existingDeal.lastSyncedAt = new Date();
        return this.dealRepository.save(existingDeal);
    }
    mapHubSpotStage(hubspotStage) {
        const stageMap = {
            [hubspot_types_interface_1.HubSpotDealStage.APPOINTMENT_SCHEDULED]: entities_1.DealStage.PROSPECTING,
            [hubspot_types_interface_1.HubSpotDealStage.QUALIFIED_TO_BUY]: entities_1.DealStage.QUALIFICATION,
            [hubspot_types_interface_1.HubSpotDealStage.PRESENTATION_SCHEDULED]: entities_1.DealStage.NEEDS_ANALYSIS,
            [hubspot_types_interface_1.HubSpotDealStage.DECISION_MAKER_BOUGHT_IN]: entities_1.DealStage.PROPOSAL,
            [hubspot_types_interface_1.HubSpotDealStage.CONTRACT_SENT]: entities_1.DealStage.NEGOTIATION,
            [hubspot_types_interface_1.HubSpotDealStage.CLOSED_WON]: entities_1.DealStage.CLOSED_WON,
            [hubspot_types_interface_1.HubSpotDealStage.CLOSED_LOST]: entities_1.DealStage.CLOSED_LOST,
        };
        return stageMap[hubspotStage] || entities_1.DealStage.PROSPECTING;
    }
    mapForecastCategory(category) {
        const categoryMap = {
            PIPELINE: entities_1.ForecastCategory.PIPELINE,
            BEST_CASE: entities_1.ForecastCategory.BEST_CASE,
            COMMIT: entities_1.ForecastCategory.COMMIT,
            CLOSED: entities_1.ForecastCategory.CLOSED,
        };
        return categoryMap[category] || entities_1.ForecastCategory.PIPELINE;
    }
    async createSyncLog(syncType, entityType) {
        const syncLog = this.syncLogRepository.create({
            syncType,
            entityType,
            status: entities_1.SyncStatus.PENDING,
        });
        return this.syncLogRepository.save(syncLog);
    }
    async updateSyncLog(id, updates) {
        await this.syncLogRepository.update(id, updates);
    }
    async getSyncLogs(limit = 50) {
        return this.syncLogRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async getLastSuccessfulSync(entityType) {
        return this.syncLogRepository.findOne({
            where: {
                entityType,
                status: entities_1.SyncStatus.COMPLETED,
            },
            order: { completedAt: 'DESC' },
        });
    }
    async syncSingleDeal(hubspotDealId) {
        this.logger.log(`Syncing single deal: ${hubspotDealId}`);
        if (!this.hubspotClient.isConfigured()) {
            throw new common_1.HttpException('HubSpot integration is not configured. Please check your environment variables.', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const hubspotDeal = await this.hubspotClient.getDealById(hubspotDealId);
            const existingDeal = await this.dealRepository.findOne({
                where: { crmDealId: hubspotDealId },
            });
            if (existingDeal) {
                return await this.updateDealFromHubSpot(existingDeal, hubspotDeal);
            }
            else {
                return await this.createDealFromHubSpot(hubspotDeal);
            }
        }
        catch (error) {
            this.logger.error(`Failed to sync deal ${hubspotDealId}:`, error);
            throw error;
        }
    }
};
exports.DealSyncService = DealSyncService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DealSyncService.prototype, "handleIncrementalSync", null);
exports.DealSyncService = DealSyncService = DealSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(entities_1.Deal)),
    __param(1, (0, inject_repository_1.InjectRepository)(entities_1.SyncLog)),
    __metadata("design:paramtypes", [m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        hubspot_client_service_1.HubSpotClientService])
], DealSyncService);
//# sourceMappingURL=deal-sync.service.js.map