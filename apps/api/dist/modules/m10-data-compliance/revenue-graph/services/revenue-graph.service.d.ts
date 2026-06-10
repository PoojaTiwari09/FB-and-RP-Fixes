import { HttpService } from '@nestjs/axios';
import { RevenueGraphRepository } from '../repositories/revenue-graph.repository';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';
import { NormalizedIntake } from '../schemas/revenue-graph.schema';
import type { AccountResponseDto, DealResponseDto, ContactResponseDto, CrmSyncStatusResponseDto, PaginatedResponseDto, RelationshipGraphDto } from '../dto/response-revenue-graph.dto';
export declare class RevenueGraphService {
    private readonly repo;
    private readonly events;
    private readonly http;
    private readonly logger;
    constructor(repo: RevenueGraphRepository, events: EventPublisherService, http: HttpService);
    getAccounts(tenantId: string, opts?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<PaginatedResponseDto<AccountResponseDto>>;
    getAccountById(tenantId: string, accountId: string): Promise<AccountResponseDto>;
    getDeals(tenantId: string, opts?: {
        accountId?: string;
        isActive?: boolean;
        stage?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponseDto<DealResponseDto>>;
    getDealById(tenantId: string, dealId: string): Promise<DealResponseDto>;
    getDealRelationship(tenantId: string, dealId: string): Promise<RelationshipGraphDto>;
    getContactById(tenantId: string, contactId: string): Promise<ContactResponseDto>;
    getCrmSyncStatus(tenantId: string): Promise<CrmSyncStatusResponseDto>;
    triggerCrmSync(tenantId: string, crmSource: string, entityTypes: string[]): Promise<{
        message: string;
        jobIds: string[];
    }>;
    processInteractionLinking(intake: NormalizedIntake): Promise<void>;
    private resolveContacts;
    private resolveAccount;
    private resolveDeal;
    private calculateOverallConfidence;
    private callAiEntityResolution;
    private mergeAiResults;
    private publishEntityLinkedEvent;
    private mapDeal;
}
