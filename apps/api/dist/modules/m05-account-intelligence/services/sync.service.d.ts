export interface SyncResult {
    success: boolean;
    companies: number;
    contacts: number;
    deals: number;
    duration_ms: number;
    synced_at: string;
    error?: string;
}
export interface SyncStatus {
    last_sync: SyncResult | null;
    next_sync_in_seconds: number | null;
    is_syncing: boolean;
}
export declare class SyncService {
    private readonly logger;
    private supabase;
    private hsClient;
    private lastSync;
    private isSyncing;
    private lastScheduledAt;
    private readonly INTERVAL_MS;
    constructor();
    scheduledSync(): Promise<void>;
    runFullSync(): Promise<SyncResult>;
    getStatus(): SyncStatus;
    private syncCompanies;
    private syncContacts;
    private syncDeals;
    private sleep;
}
