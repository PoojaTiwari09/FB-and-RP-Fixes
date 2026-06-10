import { M02ConversationIntelligenceRepository } from '../repositories/m02.repository';
import { HybridSearchService } from './hybrid-search.service';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import { SearchQueryDto, SavedSearchDto, SearchResult, ConversationRecord, SavedSearchRecord } from '../interfaces/search.interface';
export declare class M02ConversationIntelligenceService {
    private readonly repo;
    private readonly searchService;
    private readonly events;
    constructor(repo: M02ConversationIntelligenceRepository, searchService: HybridSearchService, events: EventPublisherService);
    searchConversations(dto: SearchQueryDto, tenantId: string): Promise<SearchResult[]>;
    getConversations(filters: SearchQueryDto, tenantId: string): Promise<{
        conversations: ConversationRecord[];
        totalCount: number;
        page: number;
        limit: number;
    }>;
    getConversationById(id: string, tenantId: string): Promise<ConversationRecord | undefined>;
    createSavedSearch(dto: SavedSearchDto, tenantId: string, userId: string): Promise<SavedSearchRecord>;
    getSavedSearches(tenantId: string, userId: string): Promise<SavedSearchRecord[]>;
    findAll(tenantId: string): Promise<ConversationRecord[]>;
    create(dto: Record<string, unknown>, tenantId: string): Promise<import("../interfaces/search.interface").SearchSyncLog>;
}
