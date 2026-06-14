import { getBackendUrl } from '@shared/config/module-api';
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

async function unwrap<T>(res: Response): Promise<T> {
  const payload = await res.json();
  return (payload.data !== undefined ? payload.data : payload) as T;
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
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/call-reviews?${qs}`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch call reviews: ${res.status}`);
  return unwrap<CallReviewsResponse>(res);
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
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/manager/calls?${qs}`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch all calls: ${res.status}`);
  return unwrap<CallsResponse>(res);
}

// ─── Review Detail ───────────────────────────────────────────────────────────

export async function fetchCallReviewDetail(
  reviewId: string
): Promise<CallReviewDetail> {
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/call-reviews/${reviewId}`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch review detail: ${res.status}`);
  return unwrap<CallReviewDetail>(res);
}

// ─── Scorecards ──────────────────────────────────────────────────────────────

export async function fetchScorecards(): Promise<{ scorecards: Scorecard[] }> {
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/scorecards`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch scorecards: ${res.status}`);
  return unwrap<{ scorecards: Scorecard[] }>(res);
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<{ users: User[] }> {
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/users`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
  return unwrap<{ users: User[] }>(res);
}

// ─── Patch Review ────────────────────────────────────────────────────────────

export async function patchCallReview(
  reviewId: string,
  body: { scorecardId?: string; reviewerId?: string }
): Promise<{ success: boolean }> {
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/call-reviews/${reviewId}`, {
    method: 'PATCH',
    headers: {
      ...getBridgeHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to patch review: ${res.status}`);
  return unwrap<{ success: boolean }>(res);
}

// ─── Mark Not Applicable ─────────────────────────────────────────────────────

export async function markNotApplicable(
  reviewId: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/call-reviews/${reviewId}/mark-na`, {
    method: 'POST',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to mark N/A: ${res.status}`);
  return unwrap<{ success: boolean }>(res);
}

// ─── Analytics Summary ───────────────────────────────────────────────────────

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/analytics/summary`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch analytics summary: ${res.status}`);
  return unwrap<AnalyticsSummary>(res);
}

// ─── Score Trend ─────────────────────────────────────────────────────────────

export async function fetchScoreTrend(): Promise<{ trendData: TrendPoint[] }> {
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/analytics/score-trend`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch score trend: ${res.status}`);
  const data = await unwrap<any>(res);
  const trendData = data.data || data.trendData || data || [];
  return { trendData };
}

// ─── Focus Areas ─────────────────────────────────────────────────────────────

export async function fetchFocusAreas(): Promise<{ focusAreas: FocusArea[] }> {
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/analytics/focus-areas`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch focus areas: ${res.status}`);
  const data = await unwrap<any>(res);
  const focusAreas = data.areas || data.focusAreas || data.data || [];
  return { focusAreas };
}

// ─── Common Tags ─────────────────────────────────────────────────────────────

export async function fetchCommonTags(): Promise<{ tags: TagCount[] }> {
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/analytics/common-tags`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch common tags: ${res.status}`);
  const data = await unwrap<any>(res);
  const tags = data.tags || data.data || [];
  return { tags };
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
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/analytics/review-history?${qs}`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch review history: ${res.status}`);
  return unwrap<ReviewHistoryResponse>(res);
}

export async function saveCallReviewDraft(
  reviewId: string,
  body: { answers?: any; coaching?: any }
): Promise<{ success: boolean }> {
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/call-reviews/${reviewId}/save-draft`, {
    method: 'POST',
    headers: {
      ...getBridgeHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to save draft: ${res.status}`);
  return unwrap<{ success: boolean }>(res);
}

export async function submitCallReview(
  reviewId: string,
  body: { answers?: any; coaching?: any }
): Promise<{ success: boolean; finalScore: number }> {
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/call-reviews/${reviewId}/submit`, {
    method: 'POST',
    headers: {
      ...getBridgeHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to submit review: ${res.status}`);
  return unwrap<{ success: boolean; finalScore: number }>(res);
}

export async function saveCoachingFeedback(
  reviewId: string,
  coaching: any
): Promise<{ success: boolean }> {
  const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/call-reviews/${reviewId}/coaching`, {
    method: 'POST',
    headers: {
      ...getBridgeHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(coaching),
  });
  if (!res.ok) throw new Error(`Failed to save coaching: ${res.status}`);
  return unwrap<{ success: boolean }>(res);
}
