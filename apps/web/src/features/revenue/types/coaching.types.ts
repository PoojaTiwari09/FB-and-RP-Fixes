// ============================================================
// Revenue / Coaching Insights — TypeScript Types
// Derived from: final-api-endpoints_1.md
// All shapes mirror exact API response structures.
// ============================================================

// ─── Page Filters ────────────────────────────────────────────
export interface CoachingTeam {
  id: string;
  name: string;
}

export interface CoachingFilters {
  periods: string[];      // e.g. ["Last 7 days", "Last 30 days", ...]
  teams: CoachingTeam[];
}

export interface CoachingParams {
  period?: string;
  teamId?: string;
}

// ─── Tab 1 — Activity ────────────────────────────────────────
export interface RepActivity {
  repId: string;
  repName: string;
  initials: string;
  avatarColor: string;
  callsCount: number;
  emailsCount: number;
  meetingsCount: number;
  totalActivities: number;
}

export type ActivityResponse = RepActivity[];

// ─── Tab 2 — Interaction ─────────────────────────────────────
export type InteractionStatus = 'optimal' | 'warning' | 'critical';

export interface RepInteraction {
  repId: string;
  repName: string;
  initials: string;
  avatarColor: string;
  talkRatio: number;           // percentage
  talkRatioStatus: InteractionStatus;
  questionRate: number;        // per hour
  questionRateStatus: InteractionStatus;
  interactivity: number;       // 1–10 scale
  monologue: string;           // mm:ss format
  monologueStatus: InteractionStatus;
}

export interface InteractionBenchmarks {
  talkRatioOptimal: string;    // e.g. "<43%"
  questionRateOptimal: string; // e.g. "18+/hr"
  monologueOptimal: string;    // e.g. "<2 min"
}

export interface InteractionResponse {
  reps: RepInteraction[];
  benchmarks: InteractionBenchmarks;
}

// ─── Tab 3 — Responsiveness ──────────────────────────────────
export interface RepResponsiveness {
  repId: string;
  repName: string;
  avgResponseTime: string;   // e.g. "2.3 hrs"
  followUpRate: number;      // percentage
  replyRate: number;         // percentage
}

export type ResponsivenessResponse = RepResponsiveness[];

// ─── Tab 4 — Scorecards ──────────────────────────────────────
export interface ScoreCategory {
  name: string;
  score: number;
}

export interface RepScorecard {
  repId: string;
  repName: string;
  overallScore: number;
  categories: ScoreCategory[];
}

export type ScorecardsResponse = RepScorecard[];

// ─── Right Panel — AI Coaching Insights ──────────────────────
export interface AiCoachingInsight {
  repName: string;
  avatarColor: string;
  insight: string;
  recommendation: string;
}

export type AiInsightsResponse = AiCoachingInsight[];

// ─── Right Panel — Team vs Benchmark ─────────────────────────
export type BenchmarkMetric = 'talkRatio' | 'questionRate' | 'monologue' | string;

export interface TeamVsBenchmarkItem {
  metric: BenchmarkMetric;
  teamAvg: number;
  benchmarkValue: number;
  delta: number;
}

export type TeamVsBenchmarkResponse = TeamVsBenchmarkItem[];

// ─── Generic API Error ───────────────────────────────────────
export interface ApiError {
  message: string;
  statusCode?: number;
}
