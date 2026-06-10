import { WorkspaceService } from '../services/workspace.service';
export declare class WorkspaceController {
    private readonly workspace;
    constructor(workspace: WorkspaceService);
    getWorkspace(req: any): Promise<{
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
    getChatHistory(req: any): Promise<any>;
    saveChat(body: {
        question: string;
        answer: string;
        citations?: any[];
    }, req: any): Promise<any>;
    deleteChat(id: string, req: any): Promise<{
        deleted: boolean;
    }>;
    createDeal(body: any, req: any): {
        id: any;
        name: any;
        stage: any;
        accountId: any;
        account_id: any;
        created_at: any;
    };
}
