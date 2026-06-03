export type SubmissionStatus = 'submitted' | 'draft' | 'not_started' | 'approved' | 'reopened';

export interface SubmissionCell {
  value: number | null;
  submissionId: string | null;
  lastUpdatedAt: string | null;
  isAutoSubmit: boolean;
  note: string | null;
  managerAnnotation: string | null;
}

export interface TargetAttainment {
  quota: number | null;
  closed: number;
  attainmentPct: number | null;
}

export interface SubmissionHistoryEntry {
  periodLabel: string;
  submitterName: string;
  submittedAt: string;
  value: number;
  previousValue: number | null;
  delta: number | null;
  deltaDirection: 'up' | 'down' | 'flat' | null;
  note: string | null;
}

export interface SubmissionHistoryResponse {
  history: SubmissionHistoryEntry[];
}

export type ForecastActivityAction =
  | 'DRAFT_CREATED'
  | 'BOARD_SUBMIT'
  | 'SUBMISSION_APPROVED'
  | 'SUBMISSION_REOPENED'
  | 'MANAGER_OVERRIDE'
  | 'MANAGER_ANNOTATION';

export interface ForecastActivityEntry {
  id: string;
  action: ForecastActivityAction;
  actorName: string;
  occurredAt: string;
  description: string;
}

