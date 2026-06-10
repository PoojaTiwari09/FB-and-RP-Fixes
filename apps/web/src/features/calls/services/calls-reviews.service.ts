import { resolveApiBase } from '@shared/config/module-api';
import { ENV } from '@shared/config/env';
import { getBridgeHeaders } from '@shared/lib/backend-headers';
import type {
  CallReviewDetail,
  Scorecard,
  User,
  AnalyticsSummary,
  TrendPoint,
  FocusArea,
  TagCount,
  CallReviewsResponse,
  CallsResponse,
  ReviewHistoryResponse,
} from '@calls/types/calls.types';

function apiQueryParams(params: Record<string, string>): URLSearchParams {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (!v || /^all\b/i.test(v)) return;
    qs.set(k, v);
  });
  return qs;
}

// ─── Call Reviews ────────────────────────────────────────────────────────────

export async function fetchCallReviews(params: {
  search?: string;
  status?: string;
  priority?: string;
  callType?: string;
  sort?: string;
}): Promise<CallReviewsResponse> {
  const qs = apiQueryParams(params as Record<string, string>);
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/call-reviews?${qs}`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch call reviews: ${res.status}`);
  return res.json() as Promise<CallReviewsResponse>;
}

// ─── All Calls ───────────────────────────────────────────────────────────────

export async function fetchAllCalls(params: {
  search?: string;
  status?: string;
  priority?: string;
  callType?: string;
  sort?: string;
}): Promise<CallsResponse> {
  const qs = apiQueryParams(params as Record<string, string>);
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/manager/calls?${qs}`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch all calls: ${res.status}`);
  return res.json() as Promise<CallsResponse>;
}

// ─── Review Detail ───────────────────────────────────────────────────────────

export async function fetchCallReviewDetail(
  reviewId: string
): Promise<CallReviewDetail> {
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/call-reviews/${reviewId}`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch review detail: ${res.status}`);
  return res.json() as Promise<CallReviewDetail>;
}

// ─── Scorecards ──────────────────────────────────────────────────────────────

export async function fetchScorecards(): Promise<{ scorecards: Scorecard[] }> {
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/scorecards`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch scorecards: ${res.status}`);
  return res.json() as Promise<{ scorecards: Scorecard[] }>;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<{ users: User[] }> {
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/users`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
  return res.json() as Promise<{ users: User[] }>;
}

// ─── Patch Review ────────────────────────────────────────────────────────────

export async function patchCallReview(
  reviewId: string,
  body: { scorecardId?: string; reviewerId?: string }
): Promise<{ success: boolean }> {
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/call-reviews/${reviewId}`, {
    method: 'PATCH',
    headers: {
      ...getBridgeHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to patch review: ${res.status}`);
  return res.json() as Promise<{ success: boolean }>;
}

// ─── Mark Not Applicable ─────────────────────────────────────────────────────

export async function markNotApplicable(
  reviewId: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/call-reviews/${reviewId}/mark-na`, {
    method: 'POST',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to mark N/A: ${res.status}`);
  return res.json() as Promise<{ success: boolean }>;
}

// ─── Analytics Summary ───────────────────────────────────────────────────────

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/analytics/summary`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch analytics summary: ${res.status}`);
  return res.json() as Promise<AnalyticsSummary>;
}

// ─── Score Trend ─────────────────────────────────────────────────────────────

export async function fetchScoreTrend(): Promise<{ trendData: TrendPoint[] }> {
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/analytics/score-trend`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch score trend: ${res.status}`);
  const payload = await res.json();
  // Map trendData if it comes back as `data` from backend
  const data = payload.data || payload.trendData || [];
  return { trendData: data } as { trendData: TrendPoint[] };
}

// ─── Focus Areas ─────────────────────────────────────────────────────────────

export async function fetchFocusAreas(): Promise<{ focusAreas: FocusArea[] }> {
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/analytics/focus-areas`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch focus areas: ${res.status}`);
  const payload = await res.json();
  const data = payload.data || payload.areas || payload.focusAreas || [];
  return { focusAreas: data } as { focusAreas: FocusArea[] };
}

// ─── Common Tags ─────────────────────────────────────────────────────────────

export async function fetchCommonTags(): Promise<{ tags: TagCount[] }> {
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/analytics/common-tags`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch common tags: ${res.status}`);
  const payload = await res.json();
  const data = payload.data || payload.tags || [];
  return { tags: data } as { tags: TagCount[] };
}

// ─── Review History ──────────────────────────────────────────────────────────

export async function fetchReviewHistory(params: {
  repId?: string;
  dateRange?: string;
  search?: string;
  page?: number;
}): Promise<ReviewHistoryResponse> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && qs.set(k, String(v)));
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/analytics/review-history?${qs}`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch review history: ${res.status}`);
  return res.json() as Promise<ReviewHistoryResponse>;
}

export async function saveCallReviewDraft(
  reviewId: string,
  body: { answers?: any; coaching?: any }
): Promise<{ success: boolean }> {
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/call-reviews/${reviewId}/save-draft`, {
    method: 'POST',
    headers: {
      ...getBridgeHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to save draft: ${res.status}`);
  return res.json() as Promise<{ success: boolean }>;
}

export async function submitCallReview(
  reviewId: string,
  body: { answers?: any; coaching?: any }
): Promise<{ success: boolean; finalScore: number }> {
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/call-reviews/${reviewId}/submit`, {
    method: 'POST',
    headers: {
      ...getBridgeHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to submit review: ${res.status}`);
  return res.json() as Promise<{ success: boolean; finalScore: number }>;
}

export async function saveCoachingFeedback(
  reviewId: string,
  coaching: any
): Promise<{ success: boolean }> {
  const res = await fetch(`${resolveApiBase()}/api/v1/conversation-intelligence/call-reviews/${reviewId}/coaching`, {
    method: 'POST',
    headers: {
      ...getBridgeHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(coaching),
  });
  if (!res.ok) throw new Error(`Failed to save coaching: ${res.status}`);
  return res.json() as Promise<{ success: boolean }>;
}
