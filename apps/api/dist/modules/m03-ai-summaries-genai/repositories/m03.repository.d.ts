import { PrismaService } from '../database/prisma.service';
export declare class M03AiSummariesGenaiRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private aiBriefDelegate;
    private chatDelegate;
    findAll(tenantId: string): Promise<any>;
    create(data: {
        tenantId: string;
        briefType?: string;
        entityId?: string;
        generatedSummary?: string;
    }): Promise<any>;
    getBrief(tenantId: string, briefType: string, entityId: string): Promise<{
        id: any;
        briefType: any;
        entityId: any;
        generatedSummary: any;
        generationStatus: any;
        sourceReferences: any;
        llmModel: any;
        createdAt: any;
    }>;
    upsertBrief(params: {
        tenantId: string;
        briefType: string;
        entityId: string;
        generatedSummary: string;
        generationStatus?: string;
        llmModel?: string;
        sourceReferences?: any[];
    }): Promise<any>;
    listChatHistory(tenantId: string, limit?: number): Promise<any>;
    saveChatMessage(params: {
        tenantId: string;
        userId: string;
        question: string;
        answer: string;
        citations?: any[];
    }): Promise<any>;
    getWorkspace(tenantId: string): Promise<{
        deals: any[];
        accounts: any[];
        contacts: any[];
        calls: any[];
    }>;
    loadEntityContext(tenantId: string, briefType: string, entityId: string): Promise<any>;
    private loadWorkspaceFromPostgres;
    private contactsFromCallParticipants;
    private mapBrief;
}
