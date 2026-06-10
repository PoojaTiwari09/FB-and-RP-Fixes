export declare const M05_TAB_FILTERS: {
    all: {
        operator: "AND";
        conditions: {
            field: string;
            op: string;
            value: unknown;
        }[];
    };
    highArr: {
        operator: "AND";
        conditions: {
            field: string;
            op: string;
            value: number;
        }[];
    };
    atRisk: {
        operator: "AND";
        conditions: {
            field: string;
            op: string;
            value: number;
        }[];
    };
};
export declare function m05SeedManifest(): {
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
export declare class M05DataStore {
    private tables;
    constructor();
    reset(): void;
    table(name: string): any[];
    clone<T>(row: T): T;
    stats(): {
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
}
export declare const m05DataStore: M05DataStore;
