export interface ForecastPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isLocked: boolean;
}

export interface ForecastBoard {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'archived';
  periodType: 'monthly' | 'quarterly';
}

export interface BoardColumn {
  id: string;
  label: string;
  columnType: 'Metric' | 'Submission' | 'Target' | 'AiScore';
  submissionMode: 'NA' | 'Auto' | 'Manual';
  sortOrder: number;
  isVisible: boolean;
  infoTooltip?: string;
}

export interface RollupData {
  cells: Record<string, number>;
  targetAttainment: {
    totalQuota: number | null;
    totalClosed: number;
    attainmentPct: number | null;
  };
  submittedCount: number;
  totalCount: number;
}

export interface DeadlineBanner {
  message: string;
  isDue: boolean;
}

export interface ActiveBoardForPeriodResponse {
  board: ForecastBoard;
  period: ForecastPeriod;
}

export interface TeamRollupSubmission {
  repUserId: string;
  repName: string;
  avatarInitials?: string;
  value: number | null;
  status: 'submitted' | 'draft' | 'not_started' | 'approved' | 'reopened';
}
