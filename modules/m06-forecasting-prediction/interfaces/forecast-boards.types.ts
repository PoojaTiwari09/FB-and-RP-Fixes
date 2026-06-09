/** TDD §4 — Forecast Boards API response shapes (camelCase) */

export type ForecastPeriodDto = {
  periodId: string;
  tenantId: string;
  name: string;
  startDate: string;
  endDate: string;
  revenueTarget: number;
  isLocked: boolean;
};

export type ForecastBoardAiPredictionDto = {
  predictedAmount: number;
  confidenceRangeLow: number;
  confidenceRangeHigh: number;
  computedAt: string;
};

export type ForecastBoardCoverageDto = {
  openPipelineValue: number;
  weightedPipelineValue: number;
  coverageRatio: number;
  computedAt: string;
};

export type ForecastBoardSubmissionDto = {
  submissionId: string;
  userId: string;
  submittedAmount: number;
  bestCaseAmount?: number;
  notes?: string;
  version: number;
  submittedAt: string;
};

export type ForecastBoardDto = {
  periodId: string;
  tenantId: string;
  name: string;
  revenueTarget: number;
  isLocked: boolean;
  aiPrediction: ForecastBoardAiPredictionDto | null;
  coverageMetrics: ForecastBoardCoverageDto | null;
  submissions: ForecastBoardSubmissionDto[];
};

export type ForecastSubmitResponseDto = {
  submissionId: string;
  periodId: string;
  tenantId: string;
  userId: string;
  submittedAmount: number;
  bestCaseAmount?: number;
  notes?: string;
  version: number;
  submittedAt: string;
};
