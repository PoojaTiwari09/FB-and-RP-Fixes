// ============================================================
// TYPES — AI Deep Researcher
// Revenue Intelligence UI | Sales Manager
// ============================================================

// ─── Filter / Config types ──────────────────────────────────

export interface FilterOption {
  default: string;
  options: string[];
}

export interface RepCohortOption {
  label: string;
  value: string;
  repCount: number;
  isAutoSet: boolean;
}

export interface FiltersDefaults {
  dateRange: FilterOption;
  segment: FilterOption;
  callStage: FilterOption;
  region: FilterOption;
  repCohort: RepCohortOption;
}

export interface ExampleQuestionsResponse {
  questions: string[];
}

// ─── Analysis job types ─────────────────────────────────────

export interface RunAnalysisParams {
  query: string;
  dateRange: string;
  segment: string;
  callStage: string;
  region: string;
  repCohort?: string;
}

export interface RunAnalysisResponse {
  jobId: string;
  status: 'queued' | 'in_progress' | 'complete' | 'failed';
  estimatedDurationSeconds: number;
}

// ─── Progress types ──────────────────────────────────────────

export type StepStatus = 'queued' | 'in_progress' | 'complete' | 'failed';

export interface Step {
  stepId: string;
  label: string;
  status: StepStatus;
  detail: string | null;
}

export interface ProgressResponse {
  jobId: string;
  progressPercent: number;
  status: 'queued' | 'in_progress' | 'complete' | 'failed';
  steps: Step[];
}

// ─── Report types ────────────────────────────────────────────

export type TrendDirection = 'up' | 'down' | 'flat';

export interface ObjectionFinding {
  rank: number;
  objection: string;
  frequencyPct: number;
  resolutionRatePct: number;
  trend: TrendDirection;
}

export interface LowResolutionAlert {
  objection: string;
  resolutionRatePct: number;
  unaddressedRatePct: number;
}

export interface RepPerformanceItem {
  repId: string;
  repName: string;
  initials: string;
  avatarColor: string;
  objection: string;
  resolutionRatePct: number;
  coachingNeeded: boolean;
}

export interface KeyFindings {
  objections: ObjectionFinding[];
  lowResolutionAlerts: LowResolutionAlert[];
  repPerformance: RepPerformanceItem[];
}

export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface Recommendation {
  recommendationId: string;
  priority: RecommendationPriority;
  title: string;
  description: string;
  basedOnTags: string[];
}

export interface DashboardResponse {
  reportTitle: string;
  filterTags: string[];
  tabs: string[];
  totalCalls: number;
  totalReps: number;
}

export interface ExecutiveSummaryResponse {
  execSummary: string;
}

export interface KeyFindingsResponse {
  objections: ObjectionFinding[];
  lowResolutionAlerts: LowResolutionAlert[];
  repPerformance: RepPerformanceItem[];
}

export interface ObjectionsResponse {
  objections: ObjectionFinding[];
}

export interface TrendsResponse {
  trends: string;
}

export interface RisksOpportunitiesResponse {
  risksAndOpportunities: string;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
}

// Legacy report response for backwards compatibility / mock setup
export interface ReportResponse extends DashboardResponse, ExecutiveSummaryResponse, TrendsResponse, RisksOpportunitiesResponse, RecommendationsResponse {
  keyFindings: KeyFindings;
}

// ─── Evidence types ──────────────────────────────────────────

export interface EvidenceItem {
  evidenceId: string;
  callId: string;
  finding: string;
  repName: string;
  prospectName: string;
  accountName: string;
  accountId: string;
  callDate: string;
  quote: string;
  callTimestampSeconds: number;
}

export interface EvidenceResponse {
  total: number;
  page: number;
  totalPages: number;
  evidence: EvidenceItem[];
}

export interface GetEvidenceParams {
  finding?: string;
  page?: number;
  size?: number;
}

// ─── Escalation (chatbot) types ──────────────────────────────

export interface EscalationAnswer {
  question: string;
  answer: string;
  suggestDeepAnalysis: boolean;
}

export interface EscalationHistoryItem {
  q: string;
  answer: string;
  suggestDeepAnalysis: boolean;
}

// ─── Share types ─────────────────────────────────────────────

export interface ShareRecommendationResponse {
  message: string;
  status: 'success' | 'error';
}

// ─── UI phase enum ───────────────────────────────────────────

export type ResearchPhase = 'input' | 'running' | 'report';

export interface ShareStatusMap {
  [recommendationId: string]: 'loading' | 'success' | 'error' | undefined;
}
