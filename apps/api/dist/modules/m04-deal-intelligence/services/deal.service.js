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
var DealService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const inject_repository_1 = require("@/database/inject-repository");
const m04_entity_repository_1 = require("@/database/m04-entity.repository");
const entities_1 = require("@/entities");
const deal_repository_1 = require("@/repositories/deal.repository");
const audit_log_service_1 = require("./audit-log.service");
const hubspot_client_service_1 = require("./hubspot-client.service");
let DealService = DealService_1 = class DealService {
    dealEntityRepository;
    dealRepository;
    auditLogService;
    hubSpotClientService;
    configService;
    logger = new common_1.Logger(DealService_1.name);
    constructor(dealEntityRepository, dealRepository, auditLogService, hubSpotClientService, configService) {
        this.dealEntityRepository = dealEntityRepository;
        this.dealRepository = dealRepository;
        this.auditLogService = auditLogService;
        this.hubSpotClientService = hubSpotClientService;
        this.configService = configService;
    }
    async onModuleInit() {
        this.logger.log('Initializing DealService - checking for COMMIT category deals');
        try {
            const commitDeals = await this.getDealsByForecastCategory(entities_1.ForecastCategory.COMMIT);
            this.logger.log(`Found ${commitDeals.length} COMMIT deals.`);
            if (commitDeals.length === 0) {
                this.logger.log('No COMMIT deals found. Promoting 5 PIPELINE/BEST_CASE deals to COMMIT.');
                const pipelineOrBestCaseDeals = await this.dealEntityRepository.find({
                    where: [
                        { forecastCategory: entities_1.ForecastCategory.PIPELINE },
                        { forecastCategory: entities_1.ForecastCategory.BEST_CASE },
                    ],
                    take: 5,
                });
                for (const deal of pipelineOrBestCaseDeals) {
                    deal.forecastCategory = entities_1.ForecastCategory.COMMIT;
                    deal.probability = 90;
                    await this.dealEntityRepository.save(deal);
                    this.logger.log(`Promoted deal ${deal.name} to COMMIT.`);
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to seed COMMIT category deals:', error);
        }
    }
    async findAll(filters, page = 1, limit = 25) {
        this.logger.log(`Finding deals with filters: ${JSON.stringify(filters)}`);
        const [deals, total] = await this.dealRepository.findAll(filters, page, limit);
        return {
            deals,
            total,
            page,
            limit,
        };
    }
    async findById(id, userId) {
        this.logger.log(`Finding deal by ID: ${id}`);
        const deal = await this.dealRepository.findById(id, [
            'warnings',
            'playbooks',
            'activities',
            'comments',
            'tasks',
        ]);
        if (!deal) {
            throw new common_1.NotFoundException(`Deal with ID ${id} not found`);
        }
        await this.auditLogService.log({
            userId,
            action: entities_1.AuditAction.VIEW_DEAL,
            entityType: entities_1.AuditEntityType.DEAL,
            entityId: id,
            metadata: { dealName: deal.name },
        });
        return deal;
    }
    async findByCrmId(crmDealId) {
        return this.dealRepository.findByCrmId(crmDealId);
    }
    async findDealByIdWithoutLogging(id) {
        return this.dealRepository.findById(id);
    }
    async update(id, updates, userId) {
        this.logger.log(`Updating deal ${id}`);
        const existingDeal = await this.dealRepository.findById(id);
        if (!existingDeal) {
            throw new common_1.NotFoundException(`Deal with ID ${id} not found`);
        }
        await this.syncDealUpdatesToHubSpot(existingDeal, updates);
        const updatedDeal = await this.dealRepository.update(id, updates);
        if (!updatedDeal) {
            throw new common_1.NotFoundException(`Deal with ID ${id} not found after update`);
        }
        await this.auditLogService.log({
            userId,
            action: entities_1.AuditAction.UPDATE_DEAL,
            entityType: entities_1.AuditEntityType.DEAL,
            entityId: id,
            changesAfter: updates,
            metadata: { dealName: updatedDeal.name },
        });
        return updatedDeal;
    }
    async syncDealUpdatesToHubSpot(existingDeal, updates) {
        if (!this.hubSpotClientService.isConfigured()) {
            this.logger.warn('Skipping HubSpot deal update because HubSpot access token is not configured');
            return;
        }
        if (!existingDeal.crmDealId) {
            this.logger.warn(`Skipping HubSpot deal update for ${existingDeal.id}: crmDealId is missing`);
            return;
        }
        const properties = this.mapDealUpdatesToHubSpotProperties(updates);
        if (Object.keys(properties).length === 0) {
            return;
        }
        try {
            const hubSpotTarget = await this.resolveHubSpotDealTarget(existingDeal, properties);
            if (hubSpotTarget.created) {
                return;
            }
            const syncedDeal = await this.hubSpotClientService.updateDeal(hubSpotTarget.id, properties, hubSpotTarget.idProperty);
            if (!hubSpotTarget.idProperty && syncedDeal.id !== existingDeal.crmDealId) {
                await this.dealEntityRepository.update(existingDeal.id, {
                    crmDealId: syncedDeal.id,
                    lastSyncedAt: new Date(),
                });
            }
        }
        catch (error) {
            const hubSpotError = this.getHubSpotErrorDetails(error);
            this.logger.error(`Failed to sync deal ${existingDeal.id} to HubSpot deal ${existingDeal.crmDealId}: ${hubSpotError.message}`, error instanceof Error ? error.stack : undefined);
            throw new common_1.BadGatewayException(`Deal was not updated because HubSpot rejected the CRM sync (${hubSpotError.statusCode}). ${hubSpotError.message}`);
        }
    }
    async resolveHubSpotDealTarget(existingDeal, properties) {
        if (this.isHubSpotObjectId(existingDeal.crmDealId)) {
            return { id: existingDeal.crmDealId };
        }
        const idProperty = this.configService.get('HUBSPOT_DEAL_ID_PROPERTY')?.trim();
        if (idProperty) {
            return { id: existingDeal.crmDealId, idProperty };
        }
        const matches = await this.hubSpotClientService.findDealsByExactName(existingDeal.name);
        if (matches.length === 1) {
            this.logger.log(`Resolved local deal ${existingDeal.id} to HubSpot deal ${matches[0].id} by exact deal name`);
            return { id: matches[0].id };
        }
        const reason = matches.length === 0
            ? 'No HubSpot deal has the same deal name.'
            : `${matches.length} HubSpot deals have the same deal name.`;
        if (matches.length === 0 && this.shouldCreateMissingHubSpotDeals()) {
            const createdDeal = await this.hubSpotClientService.createDeal({
                ...this.mapDealToHubSpotProperties(existingDeal),
                ...properties,
            });
            await this.dealEntityRepository.update(existingDeal.id, {
                crmDealId: createdDeal.id,
                lastSyncedAt: new Date(),
            });
            this.logger.log(`Created HubSpot deal ${createdDeal.id} for local deal ${existingDeal.id} (${existingDeal.crmDealId})`);
            return { id: createdDeal.id, created: true };
        }
        throw new common_1.BadGatewayException(`Cannot sync this deal to HubSpot because crmDealId "${existingDeal.crmDealId}" is not a HubSpot object ID and the app could not safely match it. ${reason} Set HUBSPOT_DEAL_ID_PROPERTY to the HubSpot unique property that stores this Deal Id, enable HUBSPOT_CREATE_MISSING_DEALS, or run a HubSpot full sync so crmDealId contains HubSpot object IDs.`);
    }
    shouldCreateMissingHubSpotDeals() {
        const rawValue = this.configService.get('HUBSPOT_CREATE_MISSING_DEALS');
        return rawValue === undefined || rawValue.toLowerCase() === 'true';
    }
    getHubSpotErrorDetails(error) {
        if (error instanceof common_1.HttpException) {
            const response = error.getResponse();
            const statusCode = error.getStatus();
            if (typeof response === 'string') {
                return { statusCode, message: response };
            }
            if (response && typeof response === 'object') {
                const message = response.message;
                return {
                    statusCode,
                    message: Array.isArray(message) ? message.join(', ') : message || error.message,
                };
            }
            return { statusCode, message: error.message };
        }
        return {
            statusCode: 502,
            message: error instanceof Error ? error.message : 'Unknown HubSpot sync error',
        };
    }
    isHubSpotObjectId(crmDealId) {
        return /^\d+$/.test(crmDealId.trim());
    }
    mapDealUpdatesToHubSpotProperties(updates) {
        const properties = {};
        if (updates.name !== undefined) {
            properties.dealname = updates.name;
        }
        if (updates.amount !== undefined) {
            properties.amount = updates.amount;
        }
        if (updates.closeDate !== undefined) {
            properties.closedate = updates.closeDate
                ? new Date(updates.closeDate).toISOString().split('T')[0]
                : null;
        }
        if (updates.stage !== undefined) {
            properties.dealstage = this.mapDealStageToHubSpot(updates.stage);
        }
        if (updates.forecastCategory !== undefined) {
            properties.hs_forecast_category = updates.forecastCategory;
        }
        if (updates.probability !== undefined) {
            properties.hs_forecast_probability = Number(updates.probability) / 100;
        }
        if (updates.nextStep !== undefined) {
            const nextStepProperty = this.configService.get('HUBSPOT_NEXT_STEP_PROPERTY');
            if (nextStepProperty) {
                properties[nextStepProperty] = updates.nextStep;
            }
        }
        return properties;
    }
    mapDealToHubSpotProperties(deal) {
        const properties = {
            dealname: deal.name,
            dealstage: this.mapDealStageToHubSpot(deal.stage),
            amount: deal.amount,
            closedate: deal.closeDate
                ? new Date(deal.closeDate).toISOString().split('T')[0]
                : undefined,
        };
        return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined));
    }
    mapDealStageToHubSpot(stage) {
        const rawMap = this.configService.get('HUBSPOT_DEAL_STAGE_MAP');
        if (rawMap) {
            try {
                const stageMap = JSON.parse(rawMap);
                return stageMap[stage] || stage;
            }
            catch (error) {
                this.logger.warn('HUBSPOT_DEAL_STAGE_MAP is not valid JSON; using local stage value');
            }
        }
        return stage;
    }
    async getDealsForBoard(boardFilters, page = 1, limit = 25) {
        this.logger.log(`Getting deals for board with ${boardFilters.length} filters`);
        const [deals, total] = await this.dealRepository.findByBoardFilters(boardFilters, page, limit);
        return { deals, total };
    }
    async getDealsForOwner(ownerId, limit = 100) {
        return this.dealRepository.getDealsForOwner(ownerId, limit);
    }
    async getHighRiskDeals(limit = 10) {
        return this.dealRepository.getHighRiskDeals(limit);
    }
    async getDealsClosingSoon(days = 30) {
        return this.dealRepository.getDealsClosingSoon(days);
    }
    async getDealsByForecastCategory(category) {
        return this.dealRepository.getDealsByForecastCategory(category);
    }
    async calculateTotalValue(filters) {
        return this.dealRepository.calculateTotalValue(filters);
    }
    async countByStage() {
        return this.dealRepository.countByStage();
    }
    async updateAIScore(dealId, aiScore) {
        await this.dealRepository.update(dealId, { aiScore });
    }
    async updateWarningCount(dealId, warningCount) {
        await this.dealRepository.update(dealId, { warningCount });
    }
    async markAsHighRisk(dealId, reason) {
        await this.dealRepository.update(dealId, {
            isHighRisk: true,
            riskReason: reason,
        });
    }
    async clearHighRisk(dealId) {
        await this.dealRepository.update(dealId, {
            isHighRisk: false,
            riskReason: undefined,
        });
    }
    async updateContactCount(dealId, contactCount) {
        await this.dealRepository.update(dealId, { contactCount });
    }
    async updateActivityStrength(dealId, activityStrength) {
        await this.dealRepository.update(dealId, { activityStrength });
    }
    async updateLastActivityAt(dealId, lastActivityAt) {
        await this.dealRepository.update(dealId, { lastActivityAt });
    }
    async getRecentNotifications(userId, userRole) {
        this.logger.log(`Fetching recent notifications for user ${userId} (${userRole})`);
        const logs = await this.auditLogService.findRecentDealUpdates(30);
        let filteredLogs = logs;
        const normalizedRole = String(userRole).toUpperCase();
        if (normalizedRole === 'USER' || normalizedRole === 'SALES_REP') {
            const userDeals = await this.dealRepository.getDealsForOwner(userId, 1000);
            const userDealIds = new Set(userDeals.map(d => d.id));
            filteredLogs = logs.filter(log => userDealIds.has(log.entityId));
        }
        return filteredLogs.map(log => {
            const dealName = log.metadata?.dealName || 'a deal';
            const actor = log.userName || 'Someone';
            const changes = log.changesAfter || {};
            const updatedFields = Object.keys(changes);
            let actionDetails = 'updated the deal';
            if (updatedFields.length > 0) {
                const fieldLabels = updatedFields.map(f => {
                    if (f === 'stage')
                        return 'Stage';
                    if (f === 'amount')
                        return 'Deal Amount';
                    if (f === 'closeDate')
                        return 'Close Date';
                    if (f === 'nextStep')
                        return 'Next Step';
                    return f;
                });
                if (fieldLabels.length === 1) {
                    actionDetails = `updated the ${fieldLabels[0]}`;
                    if (changes.stage) {
                        actionDetails = `moved stage to ${changes.stage.replace(/_/g, ' ')}`;
                    }
                }
                else if (fieldLabels.length > 1) {
                    actionDetails = `updated: ${fieldLabels.join(', ')}`;
                }
            }
            const message = `${actor} ${actionDetails} for "${dealName}"`;
            return {
                id: log.id,
                dealId: log.entityId,
                dealName,
                userName: actor,
                userId: log.userId,
                message,
                changes,
                createdAt: log.createdAt,
            };
        });
    }
};
exports.DealService = DealService;
exports.DealService = DealService = DealService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(entities_1.Deal)),
    __metadata("design:paramtypes", [m04_entity_repository_1.M04EntityRepository,
        deal_repository_1.DealRepository,
        audit_log_service_1.AuditLogService,
        hubspot_client_service_1.HubSpotClientService,
        config_1.ConfigService])
], DealService);
//# sourceMappingURL=deal.service.js.map