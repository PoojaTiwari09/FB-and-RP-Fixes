export interface AiCallReviewerCall {
  id: string;
  callName: string;
  account: string;
  dateTime: string;
  duration: string;
  type: string;
  stage: string;
  score: number;
  status: string;
  tags: string[];
}

export interface AiCallReviewerListResult {
  calls: AiCallReviewerCall[];
  pagination: { page: number; size: number; total: number; totalPages: number };
}
