interface AccountQueryParams {
    board_slug: string;
    tab_id?: string;
    rep_id?: string;
    period?: string;
    sort_field?: string;
    sort_dir?: 'asc' | 'desc';
    page?: number;
    page_size?: number;
}
export declare class AccountsService {
    private supabase;
    private getPeriodCutoff;
    getAccounts(tenantId: string, params: AccountQueryParams, userId?: string, userRole?: string): Promise<{
        total: any;
        page: number;
        page_size: number;
        summary: {
            all_count: any;
            all_arr: any;
            tab_counts: Record<string, {
                count: number;
                arr: number;
            }>;
        };
        accounts: any;
    }>;
    getAccountDetail(hubspotId: string): Promise<{
        hubspot_id: any;
        local_id: any;
        name: any;
        domain: any;
        segment: any;
        industry: any;
        type: any;
        city: any;
        country: any;
        employee_count: any;
        exit_arr: number;
        board: any;
        assigned_rep: {
            id: any;
            name: string;
        };
        last_activity_date: any;
        last_activity_days: number;
        brief_available: boolean;
        brief_generated_at: any;
        account_console_url: string;
        contacts: any;
        deals: any;
        activities: any;
        supplementary: {
            manager_note: any;
            next_qbr_date: any;
            ai_risk_score: any;
            risk_label: any;
            strategic_priority: any;
        };
    }>;
    private applyTabFilter;
    private evaluateCondition;
    getSparklineData(boardSlug: string, hubspotIds?: string[]): Promise<{
        sparklines: {
            hubspot_id: string;
            buckets: number[];
            zero_activity_flag: boolean;
            last_activity_days: number;
            highlight_red: boolean;
        }[];
    }>;
    getEngagementGap(boardSlug: string, days?: number): Promise<{
        low_engagement_count: any;
        low_engagement_arr: any;
        window_days: number;
        accounts: any;
    }>;
    private getAllBoardCompanyIds;
    private buildSummary;
}
export {};
