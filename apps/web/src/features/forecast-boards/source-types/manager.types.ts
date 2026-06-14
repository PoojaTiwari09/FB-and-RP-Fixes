import type { ForecastBoard, ForecastPeriod, BoardColumn, RollupData, DeadlineBanner } from './board.types';
import type { ForecastActivityEntry, SubmissionCell, TargetAttainment, SubmissionStatus } from './submission.types';
import type { CrmDeal } from './deal.types';

export interface ManagerRow {
  repUserId: string;
  repName: string;
  avatarInitials: string;
  isExcluded: boolean;
  isInactive: boolean;
  cells: Record<string, SubmissionCell>;
  targetAttainment: TargetAttainment;
  submissionStatus: SubmissionStatus;
  aiPredictionScore?: number | null;
}

export interface ManagerBoardViewResponse {
  board: ForecastBoard;
  period: ForecastPeriod;
  columns: BoardColumn[];
  rows: ManagerRow[];
  rollup: RollupData;
  deadlineBanner: DeadlineBanner | null;
}

export interface RepDrillDownDeal extends CrmDeal {
  upForRenewal: boolean;
  upForRenewalAmount: number | null;
  churn: number | null;
}

export interface RepDrillDownResponse {
  rep: { id: string; name: string; avatarInitials: string };
  summaryCards: {
    pipeline: number;
    commit: number | null;
    bestCase: number | null;
    closed: number;
  };
  deals: RepDrillDownDeal[];
  submission: {
    id: string;
    status: SubmissionStatus;
    commitForecast: number;
    bestCaseForecast: number;
    notes: string | null;
    managerComment: string | null;
  } | null;
  targetAttainment: TargetAttainment;
  existingAnnotation: string | null;
  columns: BoardColumn[];
}

export interface PendingApprovalEntry {
  repUserId: string;
  repName: string;
  avatarInitials: string;
  commitValue: number | null;
  bestCaseValue: number | null;
  submittedAt: string;
  note: string | null;
  submissionId: string;
  activity?: ForecastActivityEntry[];
  requestType?: 'best_case' | 'commit' | 'both';
  dealName?: string;
  dealId?: string;
}
