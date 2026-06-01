import type { AiCallReviewerListResult } from '@calls/types/ai-call-reviewer.types';
import {
  MOCK_CALLS,
  MOCK_CALL_DETAILS,
  MOCK_TRANSCRIPTS,
  MOCK_AI_INSIGHTS,
  MOCK_REVIEWS,
  MOCK_FEEDBACK,
  MOCK_COACHING_INSIGHTS,
  type CallDetail,
  type TranscriptEntry,
  type AIInsights,
  type ReviewData,
  type FeedbackData,
  type CoachingInsights,
} from '@calls/data/mockData';
import { ENV } from '@shared/config/env';
import { getBridgeHeaders } from '@shared/lib/backend-headers';
import { fetchApiOrMock } from '@shared/lib/api-data-source';
import {
  pickDemoRecordingUrl,
  toAssemblyAISafeUrl,
  toProxiedAudioUrl,
} from '@shared/lib/demo-recordings';

const BASE_URL = `${ENV.M01_API_BASE_URL}/api`;

function unwrapApiPayload<T>(json: Record<string, unknown>): T {
  if (json.error) {
    throw new Error(String(json.error));
  }
  if (json.data !== undefined) {
    return json.data as T;
  }
  if (Array.isArray(json.calls) && json.totalCount !== undefined) {
    const total = Number(json.totalCount);
    const page = Number(json.page ?? 1);
    const size = Number(json.size ?? 20);
    return {
      calls: json.calls,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.max(1, Math.ceil(total / size)),
      },
    } as T;
  }
  return json as T;
}

async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  return fetchApiOrMock(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: getBridgeHeaders() });
      if (!res.ok) {
        throw new Error(`Failed to fetch from ${url}: ${res.status}`);
      }
      const json = (await res.json()) as Record<string, unknown>;
      return unwrapApiPayload<T>(json);
    },
    () => fallback,
  );
}

export interface CallsListParams {
  search?: string;
  type?: string;
  sort?: string;
  page?: number;
  size?: number;
}

export type CallsListResult = AiCallReviewerListResult;

export async function fetchCalls(params: CallsListParams = {}): Promise<CallsListResult> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.type && params.type !== 'All' && params.type !== 'All Types') {
    qs.set('type', params.type);
  }
  if (params.sort) qs.set('sort', params.sort);
  if (params.page) qs.set('page', String(params.page));
  if (params.size) qs.set('size', String(params.size));
  qs.set('view', 'ai-reviewer');

  const url = `${BASE_URL}/calls?${qs.toString()}`;

  if (ENV.USE_MOCK_DATA) {
    return fetchApiOrMock(url, async () => fetchCallsFromApi(url), () => ({
      calls: MOCK_CALLS,
      pagination: { page: 1, size: 20, total: MOCK_CALLS.length, totalPages: 1 },
    }));
  }

  return fetchCallsFromApi(url);
}

async function fetchCallsFromApi(url: string): Promise<CallsListResult> {
  const res = await fetch(url, { cache: 'no-store', headers: getBridgeHeaders() });
  if (!res.ok) {
    throw new Error(`Failed to fetch calls: ${res.status}`);
  }
  const json = (await res.json()) as Record<string, unknown>;
  return unwrapApiPayload<CallsListResult>(json);
}

export async function fetchCall(callId: string): Promise<CallDetail> {
  const fallback = MOCK_CALL_DETAILS[callId] ?? MOCK_CALL_DETAILS['call_001'];
  return safeFetch<CallDetail>(
    `${BASE_URL}/calls/${callId}?view=ai-reviewer`,
    fallback,
  );
}

export async function fetchTranscript(callId: string): Promise<TranscriptEntry[]> {
  const fallback = MOCK_TRANSCRIPTS[callId] ?? MOCK_TRANSCRIPTS['call_001'];
  const result = await safeFetch<{ entries: TranscriptEntry[] }>(
    `${BASE_URL}/calls/${callId}/transcript-entries`,
    { entries: fallback }
  );
  return result.entries ?? fallback;
}

export async function fetchAIInsights(callId: string): Promise<AIInsights> {
  const fallback = MOCK_AI_INSIGHTS[callId] ?? MOCK_AI_INSIGHTS['call_001'];
  return safeFetch<AIInsights>(`${BASE_URL}/calls/${callId}/ai-insights`, fallback);
}

/** Public URL AssemblyAI (and other cloud services) can download. */
export async function fetchRemoteRecordingUrl(callId: string): Promise<string> {
  const fallbackRemote = pickDemoRecordingUrl(callId);
  const result = await safeFetch<{ audioUrl: string | null; expiresAt: string } | null>(
    `${BASE_URL}/calls/${callId}/audio-url`,
    { audioUrl: fallbackRemote, expiresAt: new Date().toISOString() },
  );

  const raw = result?.audioUrl?.trim() || fallbackRemote;
  return toAssemblyAISafeUrl(raw, callId);
}

export async function fetchAudioUrl(callId: string): Promise<{ audioUrl: string; expiresAt: string } | null> {
  const remote = await fetchRemoteRecordingUrl(callId);
  return {
    audioUrl: toProxiedAudioUrl(remote),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  };
}

export async function fetchReview(callId: string): Promise<ReviewData | null> {
  const fallback = MOCK_REVIEWS[callId] ?? null;
  return safeFetch<ReviewData | null>(`${BASE_URL}/calls/${callId}/review`, fallback);
}

export async function fetchFeedback(callId: string): Promise<FeedbackData | null> {
  const fallback = MOCK_FEEDBACK[callId] ?? null;
  return safeFetch<FeedbackData | null>(`${BASE_URL}/calls/${callId}/feedback`, fallback);
}

export async function acknowledgeFeedback(
  callId: string,
  repResponse?: string
): Promise<{ success: boolean; acknowledgedAt: string }> {
  return fetchApiOrMock(
    `acknowledgeFeedback:${callId}`,
    async () => {
      const res = await fetch(`${BASE_URL}/calls/${callId}/feedback/acknowledge`, {
        method: 'POST',
        headers: getBridgeHeaders(),
        body: JSON.stringify({ repResponse }),
      });
      if (!res.ok) throw new Error(`Failed to acknowledge feedback: ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    () => ({ success: true, acknowledgedAt: new Date().toISOString() }),
  );
}

export async function updateActionItem(
  callId: string,
  actionItemId: string,
  status: string,
  notes?: string
): Promise<{ success: boolean; updatedAt: string }> {
  return fetchApiOrMock(
    `updateActionItem:${callId}:${actionItemId}`,
    async () => {
      const res = await fetch(`${BASE_URL}/calls/${callId}/action-items/${actionItemId}`, {
        method: 'PATCH',
        headers: getBridgeHeaders(),
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error(`Failed to update action item: ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    () => ({ success: true, updatedAt: new Date().toISOString() }),
  );
}

export async function fetchCoachingInsights(): Promise<CoachingInsights> {
  return safeFetch<CoachingInsights>(`${BASE_URL}/coaching/insights`, MOCK_COACHING_INSIGHTS);
}
