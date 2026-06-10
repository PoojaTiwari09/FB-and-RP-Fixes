import { PrismaService } from '../../database/prisma.service';
export declare class DataCloudRepository {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createConnection(tenantId: string, data: {
        destination: string;
        config: object;
    }): Promise<any>;
    findConnections(tenantId: string): Promise<any[]>;
    findConnectionById(tenantId: string, connectionId: string): Promise<any | null>;
    setConnectionActive(tenantId: string, connectionId: string, isActive: boolean): Promise<any>;
    createExportRun(data: {
        tenantId: string;
        connectionId: string;
        status: string;
    }): Promise<any>;
    updateExportRun(runId: string, data: {
        status: string;
        rowsExported?: number;
        errorMessage?: string;
        completedAt?: Date;
        filePaths?: any;
    }): Promise<any>;
    findExportRunById(tenantId: string, runId: string): Promise<any | null>;
    findExportRuns(tenantId: string, connectionId?: string): Promise<any[]>;
    getCheckpoint(tenantId: string, domain: string): Promise<any | null>;
    upsertCheckpoint(tenantId: string, domain: string, lastCursor: string): Promise<any>;
    extractAccounts(tenantId: string, since?: Date): Promise<any[]>;
    extractContacts(tenantId: string, since?: Date): Promise<any[]>;
    extractDeals(tenantId: string, since?: Date): Promise<any[]>;
    extractActivities(tenantId: string, since?: Date): Promise<any[]>;
}
