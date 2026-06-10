import { M03AiSummariesGenaiRepository } from '../repositories/m03.repository';
export declare class WorkspaceService {
    private readonly repo;
    constructor(repo: M03AiSummariesGenaiRepository);
    getWorkspace(tenantId: string): Promise<{
        deals: {
            id: any;
            name: any;
            stage: any;
            accountId: any;
            account_id: any;
            created_at: any;
        }[];
        accounts: {
            id: any;
            name: any;
        }[];
        contacts: {
            id: any;
            name: any;
            email: any;
            accountId: any;
            account_id: any;
        }[];
        calls: {
            id: any;
            title: any;
            transcript: any;
            accountId: any;
            account_id: any;
            account_name: any;
            dealId: any;
            deal_id: any;
            created_at: any;
            duration_seconds: any;
            call_source: any;
            participants: any;
        }[];
    }>;
    getChatHistory(tenantId: string): Promise<any>;
    saveChat(tenantId: string, userId: string, question: string, answer: string, citations: any[]): Promise<any>;
    deleteChat(tenantId: string, id: string): Promise<{
        deleted: boolean;
    }>;
    upsertDeal(tenantId: string, payload: any): {
        id: any;
        name: any;
        stage: any;
        accountId: any;
        account_id: any;
        created_at: any;
    };
    private normalizeDeal;
    private normalizeAccount;
    private normalizeContact;
    private normalizeCall;
}
