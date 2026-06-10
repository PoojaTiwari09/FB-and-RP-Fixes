export declare enum UserRole {
    SALES_REP = "sales_rep",
    SALES_MANAGER = "sales_manager",
    CRO = "cro",
    ADMIN_REVOPS = "revops"
}
export declare enum Period {
    NOW = "NOW",
    LAST_30_DAYS = "LAST_30_DAYS",
    LAST_90_DAYS = "LAST_90_DAYS"
}
export declare enum HeatmapRank {
    FIRST = 1,
    SECOND = 2,
    THIRD = 3,
    NONE = 0
}
export interface PeriodWindow {
    start: Date;
    end: Date;
}
export interface RepDealSet {
    repId: string;
    qualifyingDealIds: string[];
    dealCount: number;
}
export interface WarningActivationResult {
    activeHours: number;
    meetsThreshold: boolean;
}
export type ActivationMap = Map<string, Map<string, WarningActivationResult>>;
export interface MatrixCell {
    repId: string;
    warningId: string;
    flaggedCount: number;
    dealCount: number;
    percentage: number;
    heatmapRank: HeatmapRank;
    isNull: boolean;
    tooltipText: string;
}
export interface MatrixRow {
    repId: string;
    repName: string;
    segment: string | null;
    dealCount: number;
    cells: Record<string, MatrixCell>;
}
export interface TeamAverageRow {
    averages: Record<string, number | null>;
}
export interface WarningColumn {
    warningId: string;
    warningKey: string;
    label: string;
    sortOrder: number;
    trainingNeeded: boolean;
    highlightedRepCount: number;
}
export interface DealDriversMatrix {
    boardId: string;
    boardName: string;
    managerId: string;
    managerName: string;
    period: Period;
    periodWindow: PeriodWindow;
    warnings: WarningColumn[];
    rows: MatrixRow[];
    teamAverage: TeamAverageRow;
    generatedAt: Date;
    insightText: string;
}
export interface DrillDownDeal {
    dealId: string;
    accountName: string;
    amount: number;
    currency: string;
    crmStage: string;
    closeDate: Date;
    warningActiveHours: number;
    viewDealUrl: string;
}
export interface DrillDownResult {
    repId: string;
    repName: string;
    warningId: string;
    warningLabel: string;
    boardId: string;
    boardName: string;
    period: Period;
    flaggedCount: number;
    totalDealCount: number;
    percentage: number;
    deals: DrillDownDeal[];
}
export interface BoardWarningRate {
    warningId: string;
    warningKey: string;
    label: string;
    flaggedCount: number;
    totalDeals: number;
    percentage: number;
    isBoardSpecific: boolean;
    deltaFromBaseline: number | null;
    deltaDirection: 'WORSE' | 'BETTER' | 'UNCHANGED' | null;
}
export interface InsightSummary {
    worseningCount: number;
    improvingCount: number;
    topWorseningWarning: string | null;
    topWorseningDelta: number | null;
    recommendation: 'escalate_enablement' | 'individual_coaching' | 'on_track';
}
export interface BoardComparisonResult {
    baselineBoardId: string;
    baselineBoardName: string;
    comparisonBoardId: string;
    comparisonBoardName: string;
    managerId: string | null;
    period: Period;
    baselineRates: BoardWarningRate[];
    comparisonRates: BoardWarningRate[];
    overlappingWarnings: Array<{
        warningId: string;
        label: string;
        baselinePct: number;
        comparisonPct: number;
        delta: number;
        direction: 'WORSE' | 'BETTER' | 'UNCHANGED';
    }>;
    insightText: string;
    insightSummary: InsightSummary;
}
export interface CoachingWarningSnapshot {
    warningId: string;
    label: string;
    percentage: number | null;
    flaggedCount: number;
    dealCount: number;
    deltaPercentage: number | null;
    direction: 'IMPROVED' | 'REGRESSED' | 'UNCHANGED' | null;
}
export interface RepSummary {
    improvedCount: number;
    regressedCount: number;
    unchangedCount: number;
    overallDirection: 'IMPROVING' | 'REGRESSING' | 'MIXED' | 'NO_CHANGE';
}
export interface CoachingEffectivenessResult {
    repId: string;
    repName: string;
    boardId: string;
    boardName: string;
    baselinePeriod: Period;
    currentPeriod: Period;
    baselineSnapshot: CoachingWarningSnapshot[];
    currentSnapshot: CoachingWarningSnapshot[];
    improvements: string[];
    regressions: string[];
    insightText: string;
    repSummary: RepSummary;
}
