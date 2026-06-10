import { DealSyncService } from '@/services/deal-sync.service';
import { SyncLog } from '@/entities';
export declare class SyncController {
    private readonly syncService;
    constructor(syncService: DealSyncService);
    triggerFullSync(): Promise<SyncLog>;
    triggerIncrementalSync(): Promise<SyncLog>;
    getSyncLogs(limit?: number): Promise<SyncLog[]>;
    getSyncStatus(): Promise<{
        lastSync: SyncLog | null;
        isSyncing: boolean;
    }>;
}
