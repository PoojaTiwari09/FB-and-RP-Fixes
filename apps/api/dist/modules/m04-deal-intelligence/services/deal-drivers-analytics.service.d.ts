import { DealCatalogService } from './deal-catalog.service';
import type { WarningTypeKey } from '../interfaces/deal-driver.types';
type DealRow = Record<string, unknown>;
export declare class DealDriversAnalyticsService {
    private readonly catalog;
    constructor(catalog: DealCatalogService);
    private daysSince;
    detectWarnings(deal: DealRow): WarningTypeKey[];
    private riskScore;
    private repKey;
    private filterDeals;
    getSummary(params: Record<string, unknown>): Promise<{
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
            warningType: WarningTypeKey;
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
    getRiskMatrix(params: Record<string, unknown>): Promise<{
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
    getComparePeriods(params: Record<string, unknown>): Promise<{
        comparisons: {
            warningType: "no_next_step" | "single_threaded" | "no_close_plan" | "stale_gt14d" | "champion_left";
            periodAValue: number;
            periodBValue: number;
            delta: number;
            trend: string;
        }[];
    }>;
    getAtRiskDeals(params: Record<string, unknown>): Promise<{
        totalCount: number;
        deals: {
            dealId: string;
            accountName: string;
            repName: string;
            dealAmount: number;
            crmStage: string;
            closeDate: string;
            warningTypes: WarningTypeKey[];
            daysFlagged: number;
            riskScore: number;
        }[];
    }>;
    getAiInsights(params: Record<string, unknown>): Promise<{
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
    getDrilldown(params: Record<string, unknown>): Promise<{
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
    private closeDateStatus;
    private daysFlaggedStatus;
}
export {};
