import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HubSpotClientService } from './hubspot-client.service';
import {
  Deal,
  DealStage,
  ForecastCategory,
  SyncLog,
  SyncType,
  SyncEntityType,
  SyncStatus,
} from '@/entities';
import { HubSpotDeal, HubSpotDealStage } from '@/interfaces/hubspot-types.interface';

@Injectable()
export class DealSyncService {
  private readonly logger = new Logger(DealSyncService.name);
  private isSyncing = false;

  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(SyncLog)
    private readonly syncLogRepository: Repository<SyncLog>,
    private readonly hubspotClient: HubSpotClientService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleIncrementalSync() {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping');
      return;
    }

    this.logger.log('Starting incremental deal sync');
    await this.syncDeals(SyncType.INCREMENTAL);
  }

  async syncDeals(syncType: SyncType = SyncType.INCREMENTAL): Promise<SyncLog> {
    this.isSyncing = true;
    const syncLog = await this.createSyncLog(syncType, SyncEntityType.DEAL);

    try {
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.IN_PROGRESS,
        startedAt: new Date(),
      });

      let allDeals: HubSpotDeal[] = [];
      let after: string | undefined;
      let hasMore = true;

      // Fetch all deals from HubSpot with pagination
      while (hasMore) {
        const response = await this.hubspotClient.getDeals(100, after);
        allDeals = allDeals.concat(response.results);

        if (response.paging?.next?.after) {
          after = response.paging.next.after;
        } else {
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
          } else {
            await this.createDealFromHubSpot(hubspotDeal);
            created++;
          }
        } catch (error) {
          this.logger.error(`Failed to sync deal ${hubspotDeal.id}`, error.stack);
          failed++;
        }
      }

      const completedAt = new Date();
      const durationMs = syncLog.startedAt 
        ? completedAt.getTime() - syncLog.startedAt.getTime() 
        : 0;

      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.COMPLETED,
        recordsProcessed: allDeals.length,
        recordsCreated: created,
        recordsUpdated: updated,
        recordsFailed: failed,
        completedAt,
        durationMs,
      });

      this.logger.log(
        `Sync completed: ${created} created, ${updated} updated, ${failed} failed`,
      );

      const finalLog = await this.syncLogRepository.findOne({ where: { id: syncLog.id } });
      return finalLog!;
    } catch (error) {
      this.logger.error('Sync failed', error.stack);

      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
        errorDetails: { stack: error.stack },
        completedAt: new Date(),
      });

      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private async createDealFromHubSpot(hubspotDeal: HubSpotDeal): Promise<Deal> {
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

  private async updateDealFromHubSpot(
    existingDeal: Deal,
    hubspotDeal: HubSpotDeal,
  ): Promise<Deal> {
    const owner = hubspotDeal.properties.hubspot_owner_id
      ? await this.hubspotClient.getOwnerById(hubspotDeal.properties.hubspot_owner_id)
      : null;

    existingDeal.name = hubspotDeal.properties.dealname || existingDeal.name;
    existingDeal.stage = this.mapHubSpotStage(hubspotDeal.properties.dealstage);
    existingDeal.amount = parseFloat(hubspotDeal.properties.amount || '0');
    existingDeal.forecastCategory = this.mapForecastCategory(
      hubspotDeal.properties.hs_forecast_category,
    );
    existingDeal.ownerId = hubspotDeal.properties.hubspot_owner_id || existingDeal.ownerId;
    existingDeal.ownerName = owner
      ? `${owner.firstName} ${owner.lastName}`
      : existingDeal.ownerName;
    existingDeal.closeDate = hubspotDeal.properties.closedate
      ? new Date(hubspotDeal.properties.closedate)
      : existingDeal.closeDate;
    existingDeal.probability = parseInt(
      hubspotDeal.properties.hs_forecast_probability || '0',
      10,
    );
    existingDeal.crmData = hubspotDeal.properties;
    existingDeal.lastSyncedAt = new Date();

    return this.dealRepository.save(existingDeal);
  }

  private mapHubSpotStage(hubspotStage: string): DealStage {
    const stageMap: Record<string, DealStage> = {
      [HubSpotDealStage.APPOINTMENT_SCHEDULED]: DealStage.PROSPECTING,
      [HubSpotDealStage.QUALIFIED_TO_BUY]: DealStage.QUALIFICATION,
      [HubSpotDealStage.PRESENTATION_SCHEDULED]: DealStage.NEEDS_ANALYSIS,
      [HubSpotDealStage.DECISION_MAKER_BOUGHT_IN]: DealStage.PROPOSAL,
      [HubSpotDealStage.CONTRACT_SENT]: DealStage.NEGOTIATION,
      [HubSpotDealStage.CLOSED_WON]: DealStage.CLOSED_WON,
      [HubSpotDealStage.CLOSED_LOST]: DealStage.CLOSED_LOST,
    };

    return stageMap[hubspotStage] || DealStage.PROSPECTING;
  }

  private mapForecastCategory(category: string): ForecastCategory {
    const categoryMap: Record<string, ForecastCategory> = {
      PIPELINE: ForecastCategory.PIPELINE,
      BEST_CASE: ForecastCategory.BEST_CASE,
      COMMIT: ForecastCategory.COMMIT,
      CLOSED: ForecastCategory.CLOSED,
    };

    return categoryMap[category] || ForecastCategory.PIPELINE;
  }

  private async createSyncLog(syncType: SyncType, entityType: SyncEntityType): Promise<SyncLog> {
    const syncLog = this.syncLogRepository.create({
      syncType,
      entityType,
      status: SyncStatus.PENDING,
    });

    return this.syncLogRepository.save(syncLog);
  }

  private async updateSyncLog(id: string, updates: Partial<SyncLog>): Promise<void> {
    await this.syncLogRepository.update(id, updates);
  }

  async getSyncLogs(limit: number = 50): Promise<SyncLog[]> {
    return this.syncLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getLastSuccessfulSync(entityType: SyncEntityType): Promise<SyncLog | null> {
    return this.syncLogRepository.findOne({
      where: {
        entityType,
        status: SyncStatus.COMPLETED,
      },
      order: { completedAt: 'DESC' },
    });
  }

  /**
   * Sync a single deal by HubSpot ID
   */
  async syncSingleDeal(hubspotDealId: string): Promise<Deal> {
    this.logger.log(`Syncing single deal: ${hubspotDealId}`);

    try {
      // Fetch deal from HubSpot
      const hubspotDeal = await this.hubspotClient.getDealById(hubspotDealId);

      // Check if deal exists in our database
      const existingDeal = await this.dealRepository.findOne({
        where: { crmDealId: hubspotDealId },
      });

      if (existingDeal) {
        return await this.updateDealFromHubSpot(existingDeal, hubspotDeal);
      } else {
        return await this.createDealFromHubSpot(hubspotDeal);
      }
    } catch (error) {
      this.logger.error(`Failed to sync deal ${hubspotDealId}:`, error);
      throw error;
    }
  }
}
