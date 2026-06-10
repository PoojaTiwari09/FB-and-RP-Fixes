import { PrismaService } from '../database/prisma.service';
import { ConversationRecord, SavedSearchRecord, SearchSyncLog, SavedSearchDto } from '../interfaces/search.interface';
export declare class M02ConversationIntelligenceRepository {
    private readonly prisma;
    private static readonly logger;
    private static demoCorpusByTenant;
    private static savedSearchesByTenant;
    private static syncLogsByTenant;
    constructor(prisma: PrismaService);
    private get callRecordDelegate();
    private get transcriptDelegate();
    private get emailDelegate();
    private get savedSearchDelegate();
    private get syncLogDelegate();
    private demoCorpusFor;
    private mapCallToConversation;
    private mapEmailToConversation;
    findAllConversations(tenantId: string): Promise<ConversationRecord[]>;
    findConversationById(id: string, tenantId: string): Promise<ConversationRecord | undefined>;
    findSavedSearches(tenantId: string, _userId: string): Promise<SavedSearchRecord[]>;
    createSavedSearch(data: SavedSearchDto, tenantId: string, userId: string): Promise<SavedSearchRecord>;
    findSyncLogs(tenantId: string): Promise<SearchSyncLog[]>;
    createSyncLog(data: {
        entityType: 'transcript' | 'email';
        entityId?: string;
        idempotencyKey?: string;
        recordsSynced?: number;
    }, tenantId: string): Promise<SearchSyncLog>;
    private safeFindCalls;
    private safeFindEmails;
    private generateSampleCorpus;
    private static readonly DEV_SEED_USER_ID;
    private generateSampleSavedSearches;
    private generateSampleSyncLogs;
}
