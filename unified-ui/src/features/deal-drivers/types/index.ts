// ─── Shared ───────────────────────────────────────────────────────────────────
export type Period = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'CUSTOM';
export type Trend = 'up' | 'down' | 'flat';
export type Priority = 'high' | 'medium' | 'low';
export type WarningType = 'noNextStep' | 'singleThreaded' | 'noClosePlan' | 'staleGt14d' | 'championLeft';
export type CloseDateStatus = 'overdue' | 'soon' | 'ok';
export type DaysFlaggedStatus = 'high' | 'medium' | 'low';
export type SortByDeals = 'riskScore' | 'dealAmount' | 'closeDate' | 'daysFlagged';
export type SortByDrilldown = 'dealAmount' | 'closeDate' | 'daysFlagged';

// ─── Summary (4.1) ────────────────────────────────────────────────────────────
export interface SummaryResponse {
  totalActiveDeals: { value: number; deltaVsLast30Days: number };
  dealsWithWarnings: { count: number; pctOfTotal: number };
  highestRiskWarning: { label: string; warningType: string; priority: Priority };
  mostImpactedStage: { stage: string; pctImpacted: number };
  warningTrend: { value: number; direction: Trend };
}

// ─── Risk Matrix (4.2) ────────────────────────────────────────────────────────
export interface RepWarning {
  pct: number;
  needsTraining?: boolean;
}
export interface Rep {
  repId: string;
  repName: string;
  role: string;
  totalDeals: number;
  warnings: {
    noNextStep: RepWarning;
    singleThreaded: RepWarning;
    noClosePlan: RepWarning;
    staleGt14d: { pct: number };
    championLeft: { pct: number };
  };
}
export interface RiskMatrixResponse { reps: Rep[] }

// ─── Compare Periods (4.3) ────────────────────────────────────────────────────
export interface PeriodComparison {
  warningType: string;
  periodAValue: number;
  periodBValue: number;
  delta: number;
  trend: Trend;
}
export interface ComparePeriodsResponse { comparisons: PeriodComparison[] }

// ─── At-Risk Deals (4.4) ──────────────────────────────────────────────────────
export interface AtRiskDeal {
  dealId: string;
  accountName: string;
  repName: string;
  dealAmount: number;
  crmStage: string;
  closeDate: string;
  warningTypes: string[];
  daysFlagged: number;
  riskScore: number;
}
export interface AtRiskDealsResponse { totalCount: number; deals: AtRiskDeal[] }

// ─── AI Insights (4.5) ────────────────────────────────────────────────────────
export interface AiInsight {
  id: string;
  priority: Priority;
  avatarColor: string;
  type: string;
  insight: string;
  recommendation: string;
  rep?: string;
  account?: string;
  score?: number;
  tags: string[];
}
export interface AiInsightsResponse { insights: AiInsight[] }

// ─── Drilldown (4.6) ──────────────────────────────────────────────────────────
export interface DrilldownResponse {
  rep: { id: string; name: string; role: string; initials: string };
  summary: { dealsFlagged: number; totalValueAtRisk: number; avgCloseDate: string; warningTrend: number };
  flaggedDeals: {
    rank: number; dealId: string; accountName: string; dealAmount: number;
    crmStage: string; closeDate: string; closeDateStatus: CloseDateStatus;
    daysFlagged: number; daysFlaggedStatus: DaysFlaggedStatus;
  }[];
  repSidebar: { warningRate: number; dealsInPipeline: number; avgCloseRate: number; aiCoachingTip: string };
}
