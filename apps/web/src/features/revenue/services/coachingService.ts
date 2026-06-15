// ============================================================
// Revenue / Coaching Insights — Real API Service
// Endpoints pointing to m05-account-intelligence
// Base URL: process.env.NEXT_PUBLIC_API_BASE_URL
// ============================================================

import type {
  CoachingFilters,
  CoachingParams,
  ActivityResponse,
  InteractionResponse,
  ResponsivenessResponse,
  ScorecardsResponse,
  AiInsightsResponse,
  TeamVsBenchmarkResponse,
} from '../types/coaching.types';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status} on ${path}`);
  }
  const parsed = await res.json();
  if (parsed && typeof parsed === 'object' && 'success' in parsed && 'data' in parsed) {
    return parsed.data as T;
  }
  return parsed as T;
}

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null) continue;
    q.set(key, String(val));
  }
  const str = q.toString();
  return str ? `?${str}` : '';
}

// ─── Page Filters ─────────────────────────────────────────────
export async function getCoachingFilters(): Promise<CoachingFilters> {
  return apiFetch<CoachingFilters>('/api/v1/account-intelligence/coaching/filters');
}

// ─── Tab 1 — Activity ─────────────────────────────────────────
export async function getCoachingActivity(
  params: CoachingParams,
): Promise<ActivityResponse> {
  const q = buildQuery(params as Record<string, unknown>);
  return apiFetch<ActivityResponse>(`/api/v1/account-intelligence/coaching/activity${q}`);
}

// ─── Tab 2 — Interaction ──────────────────────────────────────
export async function getCoachingInteraction(
  params: CoachingParams,
): Promise<InteractionResponse> {
  const q = buildQuery(params as Record<string, unknown>);
  return apiFetch<InteractionResponse>(`/api/v1/account-intelligence/coaching/interaction${q}`);
}

// ─── Tab 3 — Responsiveness ───────────────────────────────────
export async function getCoachingResponsiveness(
  params: CoachingParams,
): Promise<ResponsivenessResponse> {
  const q = buildQuery(params as Record<string, unknown>);
  return apiFetch<ResponsivenessResponse>(`/api/v1/account-intelligence/coaching/responsiveness${q}`);
}

// ─── Tab 4 — Scorecards ───────────────────────────────────────
export async function getCoachingScorecards(
  params: CoachingParams,
): Promise<ScorecardsResponse> {
  const q = buildQuery(params as Record<string, unknown>);
  return apiFetch<ScorecardsResponse>(`/api/v1/account-intelligence/coaching/scorecards${q}`);
}

// ─── Right Panel — AI Insights ────────────────────────────────
export async function getAiInsights(
  params: CoachingParams,
): Promise<AiInsightsResponse> {
  const q = buildQuery(params as Record<string, unknown>);
  return apiFetch<AiInsightsResponse>(`/api/v1/account-intelligence/coaching/ai-insights${q}`);
}

// ─── Right Panel — Team vs Benchmark ─────────────────────────
export async function getTeamVsBenchmark(
  params: CoachingParams,
): Promise<TeamVsBenchmarkResponse> {
  const q = buildQuery(params as Record<string, unknown>);
  return apiFetch<TeamVsBenchmarkResponse>(`/api/v1/account-intelligence/coaching/team-vs-benchmark${q}`);
}

// ─── Rep Details ─────────────────────────────────────────────
export async function getCoachingRepDetails(repId: string): Promise<any> {
  return apiFetch<any>(`/api/v1/account-intelligence/coaching/rep/${repId}`);
}

