import { DealDriversAnalyticsService } from '../services/deal-drivers-analytics.service';
export declare class DealDriversManagerController {
    private readonly analytics;
    constructor(analytics: DealDriversAnalyticsService);
    getSummary(query: Record<string, string>): Promise<{
        totalActiveDeals: {
            value: number;
            deltaVsLast30Days: number;
        };
        dealsWithWarnings: {
            count: number;
            pctOfTotal: number;
        };
        highestRiskWarning: {
            label: string;
            warningType: import("../interfaces/deal-driver.types").WarningTypeKey;
            priority: "high";
        };
        mostImpactedStage: {
            stage: string;
            pctImpacted: number;
        };
        warningTrend: {
            value: number;
            direction: "up";
        };
    }>;
    getRiskMatrix(query: Record<string, string>): Promise<{
        reps: {
            repId: string;
            repName: string;
            role: string;
            totalDeals: number;
            warnings: {
                noNextStep: {
                    pct: number;
                    needsTraining: boolean;
                };
                singleThreaded: {
                    pct: number;
                    needsTraining: boolean;
                };
                noClosePlan: {
                    pct: number;
                    needsTraining: boolean;
                };
                staleGt14d: {
                    pct: number;
                };
                championLeft: {
                    pct: number;
                };
            };
        }[];
    }>;
    getComparePeriods(query: Record<string, string>): Promise<{
        comparisons: {
            warningType: "no_next_step" | "single_threaded" | "no_close_plan" | "stale_gt14d" | "champion_left";
            periodAValue: number;
            periodBValue: number;
            delta: number;
            trend: string;
        }[];
    }>;
    getAtRiskDeals(query: Record<string, string>): Promise<{
        totalCount: number;
        deals: {
            dealId: string;
            accountName: string;
            repName: string;
            dealAmount: number;
            crmStage: string;
            closeDate: string;
            warningTypes: import("../interfaces/deal-driver.types").WarningTypeKey[];
            daysFlagged: number;
            riskScore: number;
        }[];
    }>;
    getAiInsights(query: Record<string, string>): Promise<{
        insights: {
            id: string;
            priority: string;
            avatarColor: string;
            type: string;
            insight: string;
            recommendation: string;
            tags: any[];
        }[];
    } | {
        insights: {
            id: string;
            priority: string;
            avatarColor: string;
            type: string;
            insight: string;
            recommendation: string;
            rep: string;
            account: string;
            score: number;
            tags: string[];
        }[];
    }>;
    getDrilldown(query: Record<string, string>): Promise<{
        rep: {
            id: string;
            name: string;
            role: string;
            initials: string;
        };
        summary: {
            dealsFlagged: number;
            totalValueAtRisk: number;
            avgCloseDate: string;
            warningTrend: number;
        };
        flaggedDeals: {
            rank: number;
            dealId: string;
            accountName: string;
            dealAmount: number;
            crmStage: string;
            closeDate: string;
            closeDateStatus: "ok" | "overdue" | "soon";
            daysFlagged: number;
            daysFlaggedStatus: "high" | "medium" | "low";
        }[];
        repSidebar: {
            warningRate: number;
            dealsInPipeline: number;
            avgCloseRate: number;
            aiCoachingTip: string;
        };
    }>;
    exportDrilldown(body: Record<string, string>): {
        downloadUrl: string;
    };
    exportRiskMatrix(_body: Record<string, string>): {
        downloadUrl: string;
    };
    scheduleOneOnOne(body: {
        repId: string;
        suggestedDate: string;
        note?: string;
    }): {
        confirmationMessage: string;
        calendarEventId: string;
    };
}
