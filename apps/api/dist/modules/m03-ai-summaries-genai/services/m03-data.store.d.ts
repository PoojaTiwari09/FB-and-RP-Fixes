export declare const M03_DEV_ORG = "a0000000-0000-0000-0000-000000000001";
export declare const M03_DEV_USER = "c0000000-0000-0000-0000-000000000001";
export declare class M03DataStore {
    jobs: Map<string, any>;
    reports: Map<string, any>;
    citations: Map<string, any[]>;
    feedback: any[];
    auditLog: any[];
    briefs: Map<string, any>;
    querySessions: Map<string, any>;
    chatHistory: any[];
    workspace: {
        deals: any[];
        accounts: any[];
        contacts: any[];
        calls: any[];
    };
    seedWorkspace(): void;
    insertJob(row: any): void;
    getJob(id: string, orgId: string): any;
    listJobs(orgId: string, userId: string, status?: string, limit?: number): any[];
    countActiveJobs(orgId: string, userId: string): number;
    updateJob(id: string, patch: Record<string, any>): void;
    insertReport(row: any): void;
    getReport(id: string, orgId: string): any;
    getCitations(reportId: string): any[];
    setCitations(reportId: string, rows: any[]): void;
    insertBrief(row: any): any;
    listBriefs(orgId: string, entityId?: string): any[];
}
export declare const m03DataStore: M03DataStore;
