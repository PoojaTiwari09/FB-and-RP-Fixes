// src/modules/deal-drivers/deal-drivers.entities.ts
// All TypeScript domain types for the Deal Drivers feature.

export enum UserRole {
  SALES_REP    = 'sales_rep',
  SALES_MANAGER = 'sales_manager',
  CRO          = 'cro',
  ADMIN_REVOPS = 'revops',
}

export enum Period {
  NOW           = 'NOW',
  LAST_30_DAYS  = 'LAST_30_DAYS',
  LAST_90_DAYS  = 'LAST_90_DAYS',
}

export enum HeatmapRank {
  FIRST  = 1,
  SECOND = 2,
  THIRD  = 3,
  NONE   = 0,
}

export interface PeriodWindow {
  start: Date
  end:   Date
}

// ─── Rep deal set (denominator) ───────────────────────────────────────────────

export interface RepDealSet {
  repId:              string
  qualifyingDealIds:  string[]
  dealCount:          number
}

// ─── Warning activation ────────────────────────────────────────────────────────

export interface WarningActivationResult {
  activeHours:    number
  meetsThreshold: boolean   // >= 24h
}

export type ActivationMap = Map<string, Map<string, WarningActivationResult>>
// Map<dealId, Map<warningId, WarningActivationResult>>

// ─── Matrix types ─────────────────────────────────────────────────────────────

export interface MatrixCell {
  repId:        string
  warningId:    string
  flaggedCount: number
  dealCount:    number
  percentage:   number
  heatmapRank:  HeatmapRank
  isNull:       boolean     // true when dealCount = 0 → show "—"
  tooltipText:  string      // US-11: "X of Y deals had this warning"
}

export interface MatrixRow {
  repId:     string
  repName:   string
  segment:   string | null
  dealCount: number
  cells:     Record<string, MatrixCell>
}

export interface TeamAverageRow {
  averages: Record<string, number | null>
}

export interface WarningColumn {
  warningId:           string
  warningKey:          string
  label:               string
  sortOrder:           number
  trainingNeeded:      boolean
  highlightedRepCount: number
}

export interface DealDriversMatrix {
  boardId:       string
  boardName:     string
  managerId:     string
  managerName:   string
  period:        Period
  periodWindow:  PeriodWindow
  warnings:      WarningColumn[]
  rows:          MatrixRow[]
  teamAverage:   TeamAverageRow
  generatedAt:   Date
  insightText:   string
}

// ─── Drill-down ───────────────────────────────────────────────────────────────

export interface DrillDownDeal {
  dealId:             string
  accountName:        string
  amount:             number
  currency:           string
  crmStage:           string
  closeDate:          Date
  warningActiveHours: number
  viewDealUrl:        string  // US-15: "/boards/${boardId}/deals/${dealId}?tab=warnings"
}

export interface DrillDownResult {
  repId:          string
  repName:        string
  warningId:      string
  warningLabel:   string
  boardId:        string
  boardName:      string
  period:         Period
  flaggedCount:   number
  totalDealCount: number
  percentage:     number
  deals:          DrillDownDeal[]
}

// ─── Board comparison ─────────────────────────────────────────────────────────

export interface BoardWarningRate {
  warningId:         string
  warningKey:        string
  label:             string
  flaggedCount:      number
  totalDeals:        number
  percentage:        number
  isBoardSpecific:   boolean
  deltaFromBaseline: number | null
  deltaDirection:    'WORSE' | 'BETTER' | 'UNCHANGED' | null
}

// US-20: structured insight summary
export interface InsightSummary {
  worseningCount:      number
  improvingCount:      number
  topWorseningWarning: string | null
  topWorseningDelta:   number | null
  recommendation:      'escalate_enablement' | 'individual_coaching' | 'on_track'
}

export interface BoardComparisonResult {
  baselineBoardId:     string
  baselineBoardName:   string
  comparisonBoardId:   string
  comparisonBoardName: string
  managerId:           string | null
  period:              Period
  baselineRates:       BoardWarningRate[]
  comparisonRates:     BoardWarningRate[]
  overlappingWarnings: Array<{
    warningId:     string
    label:         string
    baselinePct:   number
    comparisonPct: number
    delta:         number
    direction:     'WORSE' | 'BETTER' | 'UNCHANGED'
  }>
  insightText:    string
  insightSummary: InsightSummary  // US-20
}

// ─── Coaching effectiveness ───────────────────────────────────────────────────

export interface CoachingWarningSnapshot {
  warningId:       string
  label:           string
  percentage:      number | null
  flaggedCount:    number
  dealCount:       number
  deltaPercentage: number | null  // US-25: currentPct - baselinePct (negative = improved)
  direction:       'IMPROVED' | 'REGRESSED' | 'UNCHANGED' | null  // US-25: only on currentSnapshot
}

// US-25: rep-level summary
export interface RepSummary {
  improvedCount:    number
  regressedCount:   number
  unchangedCount:   number
  overallDirection: 'IMPROVING' | 'REGRESSING' | 'MIXED' | 'NO_CHANGE'
}

export interface CoachingEffectivenessResult {
  repId:             string
  repName:           string
  boardId:           string
  boardName:         string
  baselinePeriod:    Period
  currentPeriod:     Period
  baselineSnapshot:  CoachingWarningSnapshot[]
  currentSnapshot:   CoachingWarningSnapshot[]
  improvements:      string[]
  regressions:       string[]
  insightText:       string
  repSummary:        RepSummary  // US-25
}
