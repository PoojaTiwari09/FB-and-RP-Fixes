export interface JoinedDataContext {
    calls: any[];
    emails: any[];
    deals: any[];
    accounts: any[];
    contacts: any[];
    relationships: {
        callToDeal: Record<string, string>;
        dealToAccount: Record<string, string>;
        accountToContacts: Record<string, string[]>;
    };
}
export declare class CrossObjectJoinerService {
    joinForScope(orgId: string, scope: {
        accountIds?: string[];
        dealIds?: string[];
        region?: string;
        segment?: string;
        stage?: string;
        teamId?: string;
        periodDays?: number;
    }): Promise<JoinedDataContext>;
    private emptyContext;
}
