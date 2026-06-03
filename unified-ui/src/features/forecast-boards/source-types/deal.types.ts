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
  submissionStatus?: 'draft' | 'not_started' | 'submitted' | 'approved' | 'reopened';
  managerAnnotation?: string | null;
  requestedBestCase?: number | null;
  requestedCommit?: number | null;
  requestedBestCaseNote?: string | null;
  requestedCommitNote?: string | null;
}
