import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { HubSpotClientService } from './hubspot-client.service';
import { Deal, SyncLog, SyncType, SyncEntityType } from '@/entities';
export declare class DealSyncService {
    private readonly dealRepository;
    private readonly syncLogRepository;
    private readonly hubspotClient;
    private readonly logger;
    private isSyncing;
    constructor(dealRepository: Repository<Deal>, syncLogRepository: Repository<SyncLog>, hubspotClient: HubSpotClientService);
    handleIncrementalSync(): Promise<void>;
    syncDeals(syncType?: SyncType): Promise<SyncLog>;
    private createDealFromHubSpot;
    private updateDealFromHubSpot;
    private mapHubSpotStage;
    private mapForecastCategory;
    private createSyncLog;
    private updateSyncLog;
    getSyncLogs(limit?: number): Promise<SyncLog[]>;
    getLastSuccessfulSync(entityType: SyncEntityType): Promise<SyncLog | null>;
    syncSingleDeal(hubspotDealId: string): Promise<Deal>;
}
