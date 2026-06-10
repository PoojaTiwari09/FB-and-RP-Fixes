import type { AiCallReviewerListResult } from '@calls/types/ai-call-reviewer.types';
import { ENV } from '@shared/config/env';
import { getBridgeHeaders } from '@shared/lib/backend-headers';
import {
  pickDemoRecordingUrl,
  toAssemblyAISafeUrl,
  toProxiedAudioUrl,
} from '@shared/lib/demo-recordings';

// Import just the types we need
export type CallDetail = any;
export type TranscriptEntry = any;
export type AIInsights = any;
export type ReviewData = any;
export type FeedbackData = any;
export type CoachingInsights = any;

import { resolveApiBase } from '@shared/config/module-api';

const BASE_URL = () => {
  return `${resolveApiBase()}/api/v1/capture-transcription`;
};

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

async function safeFetch<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store', headers: getBridgeHeaders() });
  } catch (err) {
    throw new Error(
      'Cannot reach the unified API. Run .\\start-demo.ps1 from the monorepo root (API on :3001, UI on :3000).',
      { cause: err },
    );
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch from ${url}: ${res.status}`);
  }
  const json = (await res.json()) as Record<string, unknown>;
  return unwrapApiPayload<T>(json);
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

  const url = `${BASE_URL()}/calls?${qs.toString()}`;
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
  return safeFetch<CallDetail>(`${BASE_URL()}/calls/${callId}?view=ai-reviewer`);
}

export async function fetchTranscript(callId: string): Promise<TranscriptEntry[]> {
  const result = await safeFetch<{ entries: TranscriptEntry[] }>(
    `${BASE_URL()}/calls/${callId}/transcript-entries`
  );
  return result.entries;
}

export async function fetchAIInsights(callId: string): Promise<AIInsights> {
  return safeFetch<AIInsights>(`${BASE_URL()}/calls/${callId}/ai-insights`);
}

/** Public URL AssemblyAI (and other cloud services) can download. */
export async function fetchRemoteRecordingUrl(callId: string): Promise<string> {
  const result = await safeFetch<{ audioUrl: string | null; expiresAt: string } | null>(
    `${BASE_URL()}/calls/${callId}/audio-url`
  );
  const raw = result?.audioUrl?.trim() || pickDemoRecordingUrl(callId);
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
  return safeFetch<ReviewData | null>(`${BASE_URL()}/calls/${callId}/review`);
}

export async function fetchFeedback(callId: string): Promise<FeedbackData | null> {
  return safeFetch<FeedbackData | null>(`${BASE_URL()}/calls/${callId}/feedback`);
}

export async function acknowledgeFeedback(
  callId: string,
  repResponse?: string
): Promise<{ success: boolean; acknowledgedAt: string }> {
  const res = await fetch(`${BASE_URL()}/calls/${callId}/feedback/acknowledge`, {
    method: 'POST',
    headers: getBridgeHeaders(),
    body: JSON.stringify({ repResponse }),
  });
  if (!res.ok) throw new Error(`Failed to acknowledge feedback: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function updateActionItem(
  callId: string,
  actionItemId: string,
  status: string,
  notes?: string
): Promise<{ success: boolean; updatedAt: string }> {
  const res = await fetch(`${BASE_URL()}/calls/${callId}/action-items/${actionItemId}`, {
    method: 'PATCH',
    headers: getBridgeHeaders(),
    body: JSON.stringify({ status, notes }),
  });
  if (!res.ok) throw new Error(`Failed to update action item: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function fetchCoachingInsights(): Promise<CoachingInsights> {
  return safeFetch<CoachingInsights>(`${BASE_URL()}/coaching/insights`);
}
