import { SyncService } from '../services/sync.service';
export declare class SyncController {
    private readonly syncService;
    private readonly logger;
    constructor(syncService: SyncService);
    triggerSync(body: {
        role: string;
    }): Promise<import("../services/sync.service").SyncResult | {
        success: boolean;
        error: string;
    }>;
    getStatus(): import("../services/sync.service").SyncStatus;
}
