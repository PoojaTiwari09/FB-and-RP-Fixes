import { ENV } from '@shared/config/env';
import { getBridgeHeaders } from '@shared/lib/backend-headers';
import { fetchApiOrMock } from '@shared/lib/api-data-source';
import type {
  CallReview,
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
import {
  MOCK_CALL_REVIEWS,
  MOCK_ALL_CALLS,
  MOCK_REVIEW_DETAIL,
  MOCK_REVIEW_DETAILS,
  MOCK_SCORECARDS,
  MOCK_USERS,
  MOCK_ANALYTICS_SUMMARY,
  MOCK_SCORE_TREND,
  MOCK_FOCUS_AREAS,
  MOCK_COMMON_TAGS,
  MOCK_REVIEW_HISTORY,
} from '@calls/mocks/calls.mock';

// ─── Filter helper (client-side, applied to mock fallback data) ──────────────

function applyCallFilters<T extends CallReview>(
  data: T[],
  params: {
    search?: string;
    status?: string;
    priority?: string;
    callType?: string;
    sort?: string;
  }
): T[] {
  let result = [...data];

  if (params.search) {
    const s = params.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.callTitle.toLowerCase().includes(s) ||
        c.account.toLowerCase().includes(s)
    );
  }

  if (params.status && params.status !== 'All Status') {
    result = result.filter((c) => c.status === params.status);
  }

  if (params.priority && params.priority !== 'All Priority') {
    result = result.filter((c) => c.priority === params.priority);
  }

  if (params.callType && params.callType !== 'All Call Types') {
    result = result.filter((c) => c.callType === params.callType);
  }

  if (params.sort) {
    if (params.sort === 'newest') {
      result.sort(
        (a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime()
      );
    } else if (params.sort === 'oldest') {
      result.sort(
        (a, b) => new Date(a.callDate).getTime() - new Date(b.callDate).getTime()
      );
    } else if (params.sort === 'highestPriority') {
      const pmap: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
      result.sort((a, b) => (pmap[b.priority] ?? 0) - (pmap[a.priority] ?? 0));
    } else if (params.sort === 'overdueFirst') {
      const isOverdue = (d: string) => (new Date(d) < new Date() ? 1 : 0);
      result.sort((a, b) => isOverdue(b.dueDate) - isOverdue(a.dueDate));
    }
  }

  return result;
}

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
  const qs = apiQueryParams(params);
  return fetchApiOrMock(
    'fetchCallReviews',
    async () => {
      const res = await fetch(`${ENV.M02_API_BASE_URL}/api/call-reviews?${qs}`, {
        cache: 'no-store',
        headers: getBridgeHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch call reviews: ${res.status}`);
      return res.json();
    },
    () => {
      const data = applyCallFilters(MOCK_CALL_REVIEWS, params);
      return { totalCount: data.length, data };
    },
  );
}

// ─── All Calls ───────────────────────────────────────────────────────────────

export async function fetchAllCalls(params: {
  search?: string;
  status?: string;
  priority?: string;
  callType?: string;
  sort?: string;
}): Promise<CallsResponse> {
  const qs = apiQueryParams(params);
  return fetchApiOrMock(
    'fetchAllCalls',
    async () => {
      const res = await fetch(`${ENV.M02_API_BASE_URL}/api/manager/calls?${qs}`, {
        cache: 'no-store',
        headers: getBridgeHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch all calls: ${res.status}`);
      return res.json();
    },
    () => {
      const data = applyCallFilters(MOCK_ALL_CALLS, params);
      return { totalCount: data.length, data };
    },
  );
}

// ─── Review Detail ───────────────────────────────────────────────────────────

export async function fetchCallReviewDetail(
  reviewId: string
): Promise<CallReviewDetail> {
  return fetchApiOrMock(
    `fetchCallReviewDetail:${reviewId}`,
    async () => {
      const res = await fetch(`${ENV.M02_API_BASE_URL}/api/call-reviews/${reviewId}`, {
        cache: 'no-store',
        headers: getBridgeHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch review detail: ${res.status}`);
      return res.json();
    },
    () => MOCK_REVIEW_DETAILS[reviewId] ?? MOCK_REVIEW_DETAIL,
  );
}

// ─── Scorecards ──────────────────────────────────────────────────────────────

export async function fetchScorecards(): Promise<{ scorecards: Scorecard[] }> {
  return fetchApiOrMock(
    'fetchScorecards',
    async () => {
      const res = await fetch(`${ENV.M02_API_BASE_URL}/api/scorecards`, {
        cache: 'no-store',
        headers: getBridgeHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch scorecards: ${res.status}`);
      return res.json();
    },
    () => ({ scorecards: MOCK_SCORECARDS }),
  );
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<{ users: User[] }> {
  return fetchApiOrMock(
    'fetchUsers',
    async () => {
      const res = await fetch(`${ENV.M02_API_BASE_URL}/api/users`, {
        cache: 'no-store',
        headers: getBridgeHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
      return res.json();
    },
    () => ({ users: MOCK_USERS }),
  );
}

// ─── Patch Review ────────────────────────────────────────────────────────────

export async function patchCallReview(
  reviewId: string,
  body: { scorecardId?: string; reviewerId?: string }
): Promise<{ success: boolean }> {
  return fetchApiOrMock(
    `patchCallReview:${reviewId}`,
    async () => {
      const res = await fetch(`${ENV.M02_API_BASE_URL}/api/call-reviews/${reviewId}`, {
        method: 'PATCH',
        headers: getBridgeHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to patch review: ${res.status}`);
      return res.json();
    },
    () => ({ success: true }),
  );
}

// ─── Mark Not Applicable ─────────────────────────────────────────────────────

export async function markNotApplicable(
  reviewId: string
): Promise<{ success: boolean }> {
  return fetchApiOrMock(
    `markNotApplicable:${reviewId}`,
    async () => {
      const res = await fetch(`${ENV.M02_API_BASE_URL}/api/call-reviews/${reviewId}/mark-na`, {
        method: 'POST',
        headers: getBridgeHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to mark N/A: ${res.status}`);
      return res.json();
    },
    () => ({ success: true }),
  );
}

// ─── Analytics Summary ───────────────────────────────────────────────────────

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  return fetchApiOrMock(
    'fetchAnalyticsSummary',
    async () => {
      const res = await fetch(`${ENV.M02_API_BASE_URL}/api/analytics/summary`, {
        cache: 'no-store',
        headers: getBridgeHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch analytics summary: ${res.status}`);
      return res.json();
    },
    () => MOCK_ANALYTICS_SUMMARY,
  );
}

// ─── Score Trend ─────────────────────────────────────────────────────────────

export async function fetchScoreTrend(): Promise<{ trendData: TrendPoint[] }> {
  return fetchApiOrMock(
    'fetchScoreTrend',
    async () => {
      const res = await fetch(`${ENV.M02_API_BASE_URL}/api/analytics/score-trend`, {
        cache: 'no-store',
        headers: getBridgeHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch score trend: ${res.status}`);
      return res.json();
    },
    () => ({ trendData: MOCK_SCORE_TREND }),
  );
}

// ─── Focus Areas ─────────────────────────────────────────────────────────────

export async function fetchFocusAreas(): Promise<{ focusAreas: FocusArea[] }> {
  return fetchApiOrMock(
    'fetchFocusAreas',
    async () => {
      const res = await fetch(`${ENV.M02_API_BASE_URL}/api/analytics/focus-areas`, {
        cache: 'no-store',
        headers: getBridgeHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch focus areas: ${res.status}`);
      return res.json();
    },
    () => ({ focusAreas: MOCK_FOCUS_AREAS }),
  );
}

// ─── Common Tags ─────────────────────────────────────────────────────────────

export async function fetchCommonTags(): Promise<{ tags: TagCount[] }> {
  return fetchApiOrMock(
    'fetchCommonTags',
    async () => {
      const res = await fetch(`${ENV.M02_API_BASE_URL}/api/analytics/common-tags`, {
        cache: 'no-store',
        headers: getBridgeHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch common tags: ${res.status}`);
      return res.json();
    },
    () => ({ tags: MOCK_COMMON_TAGS }),
  );
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
  return fetchApiOrMock(
    'fetchReviewHistory',
    async () => {
      const res = await fetch(`${ENV.M02_API_BASE_URL}/api/analytics/review-history?${qs}`, {
        cache: 'no-store',
        headers: getBridgeHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch review history: ${res.status}`);
      return res.json();
    },
    () => ({
      totalCount: MOCK_REVIEW_HISTORY.length,
      reviews: MOCK_REVIEW_HISTORY,
    }),
  );
}
