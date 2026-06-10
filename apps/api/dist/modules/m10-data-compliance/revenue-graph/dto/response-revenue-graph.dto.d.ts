export interface ActivitySummaryDto {
    activityId: string;
    sourceType: string;
    sourcePlatform?: string;
    occurredAt: string;
    status: string;
}
export interface AccountResponseDto {
    accountId: string;
    tenantId: string;
    name: string;
    domain?: string;
    region?: string;
    industry?: string;
    crmSource?: string;
    crmSyncedAt?: string;
    recentActivities?: ActivitySummaryDto[];
    activeDealsCount?: number;
    contactsCount?: number;
}
export interface ContactResponseDto {
    contactId: string;
    tenantId: string;
    email: string;
    name?: string;
    title?: string;
    accountId?: string;
    accountName?: string;
    crmSource?: string;
}
export interface DealResponseDto {
    dealId: string;
    tenantId: string;
    name: string;
    stage?: string;
    amount?: number;
    currency?: string;
    closeDate?: string;
    isActive: boolean;
    account?: {
        accountId: string;
        name: string;
    };
    contacts?: Array<{
        contactId: string;
        name?: string;
        email: string;
    }>;
    recentActivities?: ActivitySummaryDto[];
}
export interface InteractionLinkResponseDto {
    activityId: string;
    sourceType: string;
    sourceRecordId: string;
    status: string;
    confidence?: string;
    linkedEntities: Array<{
        entityType: string;
        entityId: string;
        confidence: string;
        signals: string[];
        aiAssisted: boolean;
    }>;
    linkedAt?: string;
}
export interface CrmSyncStatusResponseDto {
    tenantId: string;
    syncStates: Array<{
        crmSource: string;
        entityType: string;
        status: string;
        lastSyncedAt?: string;
        recordsSynced: number;
        errorMessage?: string;
    }>;
}
export interface PaginatedResponseDto<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}
export interface RelationshipGraphDto {
    dealId: string;
    dealName: string;
    stage: string;
    amount?: number;
    account?: {
        accountId: string;
        name: string;
        domain?: string;
    };
    contacts: Array<{
        contactId: string;
        name?: string;
        email: string;
        role?: string;
    }>;
    recentActivities: ActivitySummaryDto[];
    confidenceLevel?: string;
}
