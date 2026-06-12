import { SubmissionStatus } from './submission.types';

export interface CrmDeal {
  id: string;
  dealName: string;
  accountName: string;
  amount: number;
  stage: string;
  closeDate: string;
  isClosedWon: boolean;
  isClosedLost: boolean;
  region?: string;
  lob?: string;
  riskScore?: number | null;
  riskLabel?: string | null;
  isPastDue: boolean;
  bestCase?: number | null;
  commit?: number | null;
  submissionStatus?: SubmissionStatus;
  managerAnnotation?: string | null;
  requestedBestCase?: number | null;
  requestedCommit?: number | null;
  requestedBestCaseNote?: string | null;
  requestedCommitNote?: string | null;
  bestCaseState?: 'editable' | 'submitted' | 'approved' | 'reopened' | 'overridden';
  commitState?: 'editable' | 'submitted' | 'approved' | 'reopened' | 'overridden';
  aiPredictionScore?: number | null;
}
