import type { ForecastBoard, ForecastPeriod, BoardColumn, RollupData, DeadlineBanner } from './board.types';
import type { SubmissionCell, TargetAttainment, SubmissionStatus } from './submission.types';
import type { CrmDeal } from './deal.types';

export interface RepRow {
  repUserId: string;
  repName: string;
  avatarInitials: string;
  cells: Record<string, SubmissionCell>;
  targetAttainment: TargetAttainment;
  aiPredictionScore: number | null;
  submissionStatus: SubmissionStatus;
}

export interface RepBoardViewResponse {
  board: ForecastBoard;
  period: ForecastPeriod;
  columns: BoardColumn[];
  repRow: RepRow;
  deals: CrmDeal[];
  rollup: RollupData;
  deadlineBanner: DeadlineBanner | null;
  aiPredictionSummary: {
    predictedAmount: number | null;
    confidenceRangeLow: number | null;
    confidenceRangeHigh: number | null;
    computedAt: string | null;
  } | null;
}
