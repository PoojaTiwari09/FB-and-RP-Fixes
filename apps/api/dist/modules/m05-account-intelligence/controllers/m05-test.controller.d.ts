export declare class M05TestController {
    health(): {
        success: boolean;
        module: string;
        timestamp: string;
    };
    smoke(): {
        success: boolean;
        module: string;
        checks: string[];
        webhookSecretConfigured: boolean;
        hubspotTokenConfigured: boolean;
        hubspotPortalId: string;
    };
    verification(): {
        success: boolean;
        module: string;
        count: number;
        matrix: import("../database/m05-verification.matrix").M05VerificationRow[];
        manifest: {
            boards: ({
                slug: string;
                url: string;
                accounts: number;
                tabs: string[];
            } | {
                slug: string;
                url: string;
                accounts: number;
                tabs?: undefined;
            })[];
            accounts: {
                hubspot_id: string;
                name: string;
                board: string;
                exit_arr: number;
                rep: string;
                ai_risk: number;
            }[];
            highlights: {
                high_arr_tab: string;
                at_risk_tab: string;
                engagement_gap: string;
                renewal_deal: string;
                sparkline_rich: string;
            };
        };
        stats: {
            boards: number;
            companies: number;
            companies_demo: number;
            companies_commercial: number;
            deals: number;
            contacts: number;
            activities: number;
            todos: number;
            notes: number;
            ai_briefs_cached: number;
        };
        reload_seed: string;
    };
    seed(): {
        success: boolean;
        module: string;
        message: string;
        stats: {
            boards: number;
            companies: number;
            companies_demo: number;
            companies_commercial: number;
            deals: number;
            contacts: number;
            activities: number;
            todos: number;
            notes: number;
            ai_briefs_cached: number;
        };
        manifest: {
            boards: ({
                slug: string;
                url: string;
                accounts: number;
                tabs: string[];
            } | {
                slug: string;
                url: string;
                accounts: number;
                tabs?: undefined;
            })[];
            accounts: {
                hubspot_id: string;
                name: string;
                board: string;
                exit_arr: number;
                rep: string;
                ai_risk: number;
            }[];
            highlights: {
                high_arr_tab: string;
                at_risk_tab: string;
                engagement_gap: string;
                renewal_deal: string;
                sparkline_rich: string;
            };
        };
        verification: string;
        urls: {
            demo: string;
            commercial: string;
        };
    };
}
