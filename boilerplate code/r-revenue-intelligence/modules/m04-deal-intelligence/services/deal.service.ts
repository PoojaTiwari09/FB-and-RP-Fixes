import {
  BadGatewayException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@/database/inject-repository';
import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { Deal, DealStage, ForecastCategory, AuditAction, AuditEntityType } from '@/entities';
import { DealRepository, DealFilters } from '@/repositories/deal.repository';
import { AuditLogService } from './audit-log.service';
import { HubSpotClientService } from './hubspot-client.service';

@Injectable()
export class DealService implements OnModuleInit {
  private readonly logger = new Logger(DealService.name);

  constructor(
    @InjectRepository(Deal)
    private readonly dealEntityRepository: Repository<Deal>,
    private readonly dealRepository: DealRepository,
    private readonly auditLogService: AuditLogService,
    private readonly hubSpotClientService: HubSpotClientService,
    private readonly configService: ConfigService,
  ) { }

  async onModuleInit() {
    this.logger.log('Initializing DealService - checking for COMMIT category deals');
    try {
      const commitDeals = await this.getDealsByForecastCategory(ForecastCategory.COMMIT);
      this.logger.log(`Found ${commitDeals.length} COMMIT deals.`);
      if (commitDeals.length === 0) {
        this.logger.log('No COMMIT deals found. Promoting 5 PIPELINE/BEST_CASE deals to COMMIT.');
        const pipelineOrBestCaseDeals = await this.dealEntityRepository.find({
          where: [
            { forecastCategory: ForecastCategory.PIPELINE },
            { forecastCategory: ForecastCategory.BEST_CASE },
          ],
          take: 5,
        });
        
        for (const deal of pipelineOrBestCaseDeals) {
          deal.forecastCategory = ForecastCategory.COMMIT;
          deal.probability = 90;
          await this.dealEntityRepository.save(deal);
          this.logger.log(`Promoted deal ${deal.name} to COMMIT.`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to seed COMMIT category deals:', error);
    }
  }

  async findAll(
    filters: DealFilters,
    page: number = 1,
    limit: number = 25,
  ): Promise<{ deals: Deal[]; total: number; page: number; limit: number }> {
    this.logger.log(`Finding deals with filters: ${JSON.stringify(filters)}`);

    const [deals, total] = await this.dealRepository.findAll(filters, page, limit);

    return {
      deals,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, userId: string): Promise<Deal> {
    this.logger.log(`Finding deal by ID: ${id}`);

    const deal = await this.dealRepository.findById(id, [
      'warnings',
      'playbooks',
      'activities',
      'comments',
      'tasks',


    ]);

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    await this.auditLogService.log({
      userId,
      action: AuditAction.VIEW_DEAL,
      entityType: AuditEntityType.DEAL,
      entityId: id,
      metadata: { dealName: deal.name },
    });

    return deal;
  }

  async findByCrmId(crmDealId: string): Promise<Deal | null> {
    return this.dealRepository.findByCrmId(crmDealId);
  }

  async findDealByIdWithoutLogging(id: string): Promise<Deal | null> {
    return this.dealRepository.findById(id);
  }

  async update(
    id: string,
    updates: Partial<Deal>,
    userId: string,
  ): Promise<Deal> {
    this.logger.log(`Updating deal ${id}`);

    const existingDeal = await this.dealRepository.findById(id);
    if (!existingDeal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    await this.syncDealUpdatesToHubSpot(existingDeal, updates);

    const updatedDeal = await this.dealRepository.update(id, updates);

    if (!updatedDeal) {
      throw new NotFoundException(`Deal with ID ${id} not found after update`);
    }

    await this.auditLogService.log({
      userId,
      action: AuditAction.UPDATE_DEAL,
      entityType: AuditEntityType.DEAL,
      entityId: id,
      changesAfter: updates,
      metadata: { dealName: updatedDeal.name },
    });

    return updatedDeal;
  }

  private async syncDealUpdatesToHubSpot(
    existingDeal: Deal,
    updates: Partial<Deal>,
  ): Promise<void> {
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

      const syncedDeal = await this.hubSpotClientService.updateDeal(
        hubSpotTarget.id,
        properties,
        hubSpotTarget.idProperty,
      );

      if (!hubSpotTarget.idProperty && syncedDeal.id !== existingDeal.crmDealId) {
        await this.dealEntityRepository.update(existingDeal.id, {
          crmDealId: syncedDeal.id,
          lastSyncedAt: new Date(),
        });
      }
    } catch (error) {
      const hubSpotError = this.getHubSpotErrorDetails(error);
      this.logger.error(
        `Failed to sync deal ${existingDeal.id} to HubSpot deal ${existingDeal.crmDealId}: ${hubSpotError.message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadGatewayException(
        `Deal was not updated because HubSpot rejected the CRM sync (${hubSpotError.statusCode}). ${hubSpotError.message}`,
      );
    }
  }

  private async resolveHubSpotDealTarget(
    existingDeal: Deal,
    properties: Record<string, any>,
  ): Promise<{ id: string; idProperty?: string; created?: boolean }> {
    if (this.isHubSpotObjectId(existingDeal.crmDealId)) {
      return { id: existingDeal.crmDealId };
    }

    const idProperty = this.configService.get<string>('HUBSPOT_DEAL_ID_PROPERTY')?.trim();
    if (idProperty) {
      return { id: existingDeal.crmDealId, idProperty };
    }

    const matches = await this.hubSpotClientService.findDealsByExactName(existingDeal.name);
    if (matches.length === 1) {
      this.logger.log(
        `Resolved local deal ${existingDeal.id} to HubSpot deal ${matches[0].id} by exact deal name`,
      );
      return { id: matches[0].id };
    }

    const reason =
      matches.length === 0
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

      this.logger.log(
        `Created HubSpot deal ${createdDeal.id} for local deal ${existingDeal.id} (${existingDeal.crmDealId})`,
      );

      return { id: createdDeal.id, created: true };
    }

    throw new BadGatewayException(
      `Cannot sync this deal to HubSpot because crmDealId "${existingDeal.crmDealId}" is not a HubSpot object ID and the app could not safely match it. ${reason} Set HUBSPOT_DEAL_ID_PROPERTY to the HubSpot unique property that stores this Deal Id, enable HUBSPOT_CREATE_MISSING_DEALS, or run a HubSpot full sync so crmDealId contains HubSpot object IDs.`,
    );
  }

  private shouldCreateMissingHubSpotDeals(): boolean {
    const rawValue = this.configService.get<string>('HUBSPOT_CREATE_MISSING_DEALS');
    return rawValue === undefined || rawValue.toLowerCase() === 'true';
  }

  private getHubSpotErrorDetails(error: unknown): { statusCode: number; message: string } {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const statusCode = error.getStatus();

      if (typeof response === 'string') {
        return { statusCode, message: response };
      }

      if (response && typeof response === 'object') {
        const message = (response as { message?: string | string[] }).message;
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

  private isHubSpotObjectId(crmDealId: string): boolean {
    return /^\d+$/.test(crmDealId.trim());
  }

  private mapDealUpdatesToHubSpotProperties(updates: Partial<Deal>): Record<string, any> {
    const properties: Record<string, any> = {};

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
      const nextStepProperty = this.configService.get<string>('HUBSPOT_NEXT_STEP_PROPERTY');
      if (nextStepProperty) {
        properties[nextStepProperty] = updates.nextStep;
      }
    }

    return properties;
  }

  private mapDealToHubSpotProperties(deal: Deal): Record<string, any> {
    const properties: Record<string, any> = {
      dealname: deal.name,
      dealstage: this.mapDealStageToHubSpot(deal.stage),
      amount: deal.amount,
      closedate: deal.closeDate
        ? new Date(deal.closeDate).toISOString().split('T')[0]
        : undefined,
    };

    return Object.fromEntries(
      Object.entries(properties).filter(([, value]) => value !== undefined),
    );
  }

  private mapDealStageToHubSpot(stage: DealStage): string {
    const rawMap = this.configService.get<string>('HUBSPOT_DEAL_STAGE_MAP');
    if (rawMap) {
      try {
        const stageMap = JSON.parse(rawMap) as Record<string, string>;
        return stageMap[stage] || stage;
      } catch (error) {
        this.logger.warn('HUBSPOT_DEAL_STAGE_MAP is not valid JSON; using local stage value');
      }
    }

    return stage;
  }

  async getDealsForBoard(
    boardFilters: any[],
    page: number = 1,
    limit: number = 25,
  ): Promise<{ deals: Deal[]; total: number }> {
    this.logger.log(`Getting deals for board with ${boardFilters.length} filters`);

    const [deals, total] = await this.dealRepository.findByBoardFilters(
      boardFilters,
      page,
      limit,
    );

    return { deals, total };
  }

  async getDealsForOwner(ownerId: string, limit: number = 100): Promise<Deal[]> {
    return this.dealRepository.getDealsForOwner(ownerId, limit);
  }

  async getHighRiskDeals(limit: number = 10): Promise<Deal[]> {
    return this.dealRepository.getHighRiskDeals(limit);
  }

  async getDealsClosingSoon(days: number = 30): Promise<Deal[]> {
    return this.dealRepository.getDealsClosingSoon(days);
  }

  async getDealsByForecastCategory(category: ForecastCategory): Promise<Deal[]> {
    return this.dealRepository.getDealsByForecastCategory(category);
  }

  async calculateTotalValue(filters: DealFilters): Promise<number> {
    return this.dealRepository.calculateTotalValue(filters);
  }

  async countByStage(): Promise<Record<string, number>> {
    return this.dealRepository.countByStage();
  }

  async updateAIScore(dealId: string, aiScore: number): Promise<void> {
    await this.dealRepository.update(dealId, { aiScore });
  }

  async updateWarningCount(dealId: string, warningCount: number): Promise<void> {
    await this.dealRepository.update(dealId, { warningCount });
  }

  async markAsHighRisk(dealId: string, reason: string): Promise<void> {
    await this.dealRepository.update(dealId, {
      isHighRisk: true,
      riskReason: reason,
    });
  }

  async clearHighRisk(dealId: string): Promise<void> {
    await this.dealRepository.update(dealId, {
      isHighRisk: false,
      riskReason: undefined,
    });
  }

  async updateContactCount(dealId: string, contactCount: number): Promise<void> {
    await this.dealRepository.update(dealId, { contactCount });
  }

  async updateActivityStrength(dealId: string, activityStrength: number): Promise<void> {
    await this.dealRepository.update(dealId, { activityStrength });
  }

  async updateLastActivityAt(dealId: string, lastActivityAt: Date): Promise<void> {
    await this.dealRepository.update(dealId, { lastActivityAt });
  }

  async getRecentNotifications(userId: string, userRole: string): Promise<any[]> {
    this.logger.log(`Fetching recent notifications for user ${userId} (${userRole})`);
    
    // Fetch recent deal updates from audit log
    const logs = await this.auditLogService.findRecentDealUpdates(30);
    
    // Filter logs based on role-based ownership if normal USER
    let filteredLogs = logs;
    if (userRole === 'USER') {
      const userDeals = await this.dealRepository.getDealsForOwner(userId, 1000);
      const userDealIds = new Set(userDeals.map(d => d.id));
      filteredLogs = logs.filter(log => userDealIds.has(log.entityId));
    }
    
    // Map logs to user-friendly notification payloads
    return filteredLogs.map(log => {
      const dealName = log.metadata?.dealName || 'a deal';
      const actor = log.userName || 'Someone';
      
      const changes = log.changesAfter || {};
      const updatedFields = Object.keys(changes);
      
      let actionDetails = 'updated the deal';
      if (updatedFields.length > 0) {
        const fieldLabels = updatedFields.map(f => {
          if (f === 'stage') return 'Stage';
          if (f === 'amount') return 'Deal Amount';
          if (f === 'closeDate') return 'Close Date';
          if (f === 'nextStep') return 'Next Step';
          return f;
        });
        
        if (fieldLabels.length === 1) {
          actionDetails = `updated the ${fieldLabels[0]}`;
          if (changes.stage) {
            actionDetails = `moved stage to ${changes.stage.replace(/_/g, ' ')}`;
          }
        } else if (fieldLabels.length > 1) {
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
}
