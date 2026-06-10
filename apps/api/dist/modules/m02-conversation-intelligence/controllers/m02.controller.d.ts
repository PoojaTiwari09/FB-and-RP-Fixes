import { M02ConversationIntelligenceService } from '../services/m02.service';
export declare class M02ConversationIntelligenceController {
    private readonly service;
    constructor(service: M02ConversationIntelligenceService);
    search(queryDto: Record<string, any>, req: Record<string, any>): Promise<import("../interfaces/search.interface").SearchResult[]>;
    list(queryDto: Record<string, any>, req: Record<string, any>): Promise<{
        conversations: import("../interfaces/search.interface").ConversationRecord[];
        totalCount: number;
        page: number;
        limit: number;
    }>;
    findById(id: string, req: Record<string, any>): Promise<import("../interfaces/search.interface").ConversationRecord>;
    saveSearch(body: Record<string, any>, req: Record<string, any>): Promise<import("../interfaces/search.interface").SavedSearchRecord>;
    getSavedSearches(req: Record<string, any>): Promise<import("../interfaces/search.interface").SavedSearchRecord[]>;
    findAllLegacy(req: Record<string, any>): Promise<import("../interfaces/search.interface").ConversationRecord[]>;
    private requireTenant;
    private requireTenantAndUser;
}
