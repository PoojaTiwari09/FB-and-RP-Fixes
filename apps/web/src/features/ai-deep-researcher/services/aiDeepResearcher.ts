// ============================================================
// SERVICE LAYER — AI Deep Researcher
// Revenue Intelligence UI | Sales Manager
// ------------------------------------------------------------
// Every API call for this screen lives here.
// All functions call the real backend endpoints directly.
// No mock fallbacks — all data comes from the database via Groq.
// ============================================================

import { ENV } from '@shared/config/env';
import { API_ENDPOINTS } from '@ai-deep-researcher/config/endpoints';
import type {
  FiltersDefaults,
  ExampleQuestionsResponse,
  RunAnalysisParams,
  RunAnalysisResponse,
  ProgressResponse,
  ReportResponse,
  DashboardResponse,
  ExecutiveSummaryResponse,
  KeyFindingsResponse,
  ObjectionsResponse,
  TrendsResponse,
  RisksOpportunitiesResponse,
  RecommendationsResponse,
  EvidenceResponse,
  GetEvidenceParams,
  EscalationAnswer,
  ShareRecommendationResponse,
} from '@ai-deep-researcher/types';

import { getBridgeHeaders } from '@shared/lib/backend-headers';

const BASE_URL = ENV.API_BASE_URL;

// ─── Internal helpers ────────────────────────────────────────

function authHeaders(): Record<string, string> {
  return getBridgeHeaders();
}

function log(label: string, detail: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `%c[AI Deep Researcher] %c${label}`,
      'color:#6366f1;font-weight:bold',
      'color:#10b981;font-weight:bold',
      detail,
    );
  }
}

// ─── Progress state (for UI) ──────────────────────────────────
export function resetMockProgress(): void {
  // No-op: kept for interface compatibility with the hook
}

// ============================================================
// 1. GET Filters Defaults
// ============================================================
export async function getFiltersDefaults(): Promise<FiltersDefaults> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.FILTERS_DEFAULTS}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getFiltersDefaults', envelope);
  return envelope.data;
}

// ============================================================
// 2. GET Example Questions
// ============================================================
export async function getExampleQuestions(): Promise<ExampleQuestionsResponse> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.EXAMPLE_QUESTIONS}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getExampleQuestions', envelope);
  return envelope.data;
}

// ============================================================
// 3. POST Run Analysis
// ============================================================
export async function runAnalysis(params: RunAnalysisParams): Promise<RunAnalysisResponse> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.RUN_ANALYSIS}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('runAnalysis', envelope);
  return envelope.data;
}

// ============================================================
// 4. GET Progress
// ============================================================
export async function getProgress(jobId: string): Promise<ProgressResponse> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.PROGRESS(jobId)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getProgress', envelope);
  return envelope.data;
}

// ============================================================
// Legacy Report (for testing / backward compat if needed)
// ============================================================
export async function getReport(jobId: string): Promise<ReportResponse> {
  const res = await fetch(`${BASE_URL}/api/ai-deep-researcher/report/${jobId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getReport', envelope);
  return envelope.data;
}

// ============================================================
// Granular Report Endpoints
// ============================================================

export async function getDashboard(jobId: string): Promise<DashboardResponse> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.DASHBOARD}?jobId=${jobId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getDashboard', envelope);
  return envelope.data;
}

export async function getExecutiveSummary(jobId: string): Promise<ExecutiveSummaryResponse> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.EXECUTIVE_SUMMARY}?jobId=${jobId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getExecutiveSummary', envelope);
  return envelope.data;
}

export async function getKeyFindings(jobId: string): Promise<KeyFindingsResponse> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.KEY_FINDINGS}?jobId=${jobId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getKeyFindings', envelope);
  return envelope.data;
}

export async function getObjections(jobId: string): Promise<ObjectionsResponse> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.OBJECTIONS}?jobId=${jobId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getObjections', envelope);
  return envelope.data;
}

export async function getTrends(jobId: string): Promise<TrendsResponse> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.TRENDS}?jobId=${jobId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getTrends', envelope);
  return envelope.data;
}

export async function getRisksOpportunities(jobId: string): Promise<RisksOpportunitiesResponse> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.RISKS_OPPORTUNITIES}?jobId=${jobId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getRisksOpportunities', envelope);
  return envelope.data;
}

export async function getRecommendations(jobId: string): Promise<RecommendationsResponse> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.RECOMMENDATIONS}?jobId=${jobId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getRecommendations', envelope);
  return envelope.data;
}

// ============================================================
// 6. GET Evidence
// ============================================================
export async function getEvidence(
  jobId: string,
  { finding = 'all', page = 1, size = 10 }: GetEvidenceParams = {},
 ): Promise<EvidenceResponse> {
  const params = new URLSearchParams({ finding, page: String(page), size: String(size), jobId });
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.EVIDENCE}?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getEvidence', envelope);
  return envelope.data;
}

// ============================================================
// 7. POST Escalation
// ============================================================
export async function submitEscalation(jobId: string, question: string): Promise<EscalationAnswer> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.ESCALATION_SUBMIT}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ jobId, question }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('submitEscalation', envelope);
  return envelope.data;
}

// ============================================================
// 8. POST Share
// ============================================================
export async function shareRecommendation(
  jobId: string,
  recommendationId: string,
  channel: string,
): Promise<ShareRecommendationResponse> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.RECOMMENDATION_SHARE}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ jobId, recommendationId, channel }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('shareRecommendation', envelope);
  return envelope.data;
}

// ============================================================
// Refactored REST Endpoints for on-demand UI actions
// ============================================================

export async function getRepCalls(repId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.REP_CALLS(repId)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getRepCalls', { repId, envelope });
  return envelope.data;
}

export async function getAllReps(): Promise<any> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.REPS}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getAllReps', envelope);
  return envelope.data;
}

export async function getObjectionRepBreakdown(objectionId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.OBJECTION_REP_BREAKDOWN(objectionId)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getObjectionRepBreakdown', { objectionId, envelope });
  return envelope.data;
}

export async function getObjectionEvidence(objectionId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.OBJECTION_EVIDENCE(objectionId)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getObjectionEvidence', { objectionId, envelope });
  return envelope.data;
}

export async function getCallDetails(callId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.CALL_DETAILS(callId)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getCallDetails', { callId, envelope });
  return envelope.data;
}

export async function getAccountDetails(accountId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.ACCOUNT_DETAILS(accountId)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getAccountDetails', { accountId, envelope });
  return envelope.data;
}

export async function getRecommendationDetails(recId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.RECOMMENDATION_DETAILS(recId)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const envelope = await res.json();
  log('getRecommendationDetails', { recId, envelope });
  return envelope.data;
}
