import { PrismaService } from '../../database/prisma.service';
export declare class RevenueGraphRepository {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAccounts(tenantId: string, opts?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        data: any[];
        total: number;
    }>;
    findAccountById(tenantId: string, accountId: string): Promise<any | null>;
    listAccountsForMatching(tenantId: string, limit?: number): Promise<any[]>;
    listContactsForMatching(tenantId: string, limit?: number): Promise<any[]>;
    upsertAccount(tenantId: string, data: {
        crmAccountId?: string;
        name: string;
        domain?: string;
        region?: string;
        industry?: string;
        crmSource?: string;
    }): Promise<any>;
    findContactByEmail(tenantId: string, email: string): Promise<any | null>;
    findContactById(tenantId: string, contactId: string): Promise<any | null>;
    upsertContact(tenantId: string, data: {
        email: string;
        name?: string;
        accountId?: string;
        crmContactId?: string;
        crmSource?: string;
    }): Promise<any>;
    findDeals(tenantId: string, opts?: {
        accountId?: string;
        isActive?: boolean;
        stage?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: any[];
        total: number;
    }>;
    findDealById(tenantId: string, dealId: string): Promise<any | null>;
    findOpenDealsByAccount(tenantId: string, accountId: string): Promise<any[]>;
    updateDealStage(tenantId: string, dealId: string, stage: string): Promise<any>;
    upsertActivity(tenantId: string, data: {
        idempotencyKey: string;
        sourceType: string;
        sourcePlatform?: string;
        sourceRecordId?: string;
        occurredAt: Date;
        transcriptId?: string;
        calendarEventId?: string;
        emailThreadId?: string;
        status?: string;
    }): Promise<any>;
    updateActivityStatus(activityId: string, status: string, linkedFields?: {
        accountId?: string;
        contactId?: string;
        dealId?: string;
    }): Promise<any>;
    upsertInteractionLinks(tenantId: string, activityId: string, links: Array<{
        entityType: string;
        entityId: string;
        confidence: string;
        signals: string[];
        aiAssisted: boolean;
        explanation?: object;
    }>): Promise<any[]>;
    findLinksByActivity(tenantId: string, activityId: string): Promise<any[]>;
    createLinkDecisionLog(tenantId: string, data: {
        activityId: string;
        idempotencyKey: string;
        candidatesJson: object;
        selectedLinks: object;
        rejectedLinks: object;
        aiRequestSent: boolean;
        aiResponseJson?: object;
        processingMs?: number;
        outcome: string;
        failureReason?: string;
    }): Promise<any>;
    getActiveMappingRules(tenantId: string): Promise<any | null>;
    getCrmSyncStates(tenantId: string): Promise<any[]>;
    upsertCrmSyncState(tenantId: string, crmSource: string, entityType: string, data: Partial<{
        status: string;
        lastSyncedAt: Date;
        lastCursor: string;
        recordsSynced: number;
        errorMessage: string;
    }>): Promise<any>;
}
