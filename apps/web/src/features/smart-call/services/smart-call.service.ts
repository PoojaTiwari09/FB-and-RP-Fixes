import { ENV } from '@shared/config/env';
import { getBridgeHeaders } from '@shared/lib/backend-headers';
import type {
  ContactsResponse,
  PreCallBrief,
  SessionStartResponse,
  SessionEndResponse,
  CallSummary,
  TranscriptData,
  SmartCall,
} from '@smart-call/types/smart-call.types';

import { resolveApiBase } from '@shared/config/module-api';

const SC_BASE = `${resolveApiBase()}/api/v1/capture-transcription/smart-call`;

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...getBridgeHeaders(),
      ...(init?.headers as Record<string, string>),
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`AUTHENTICATION_ERROR: Unauthorized (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(`API_ERROR: HTTP ${res.status}`);
  }
  const parsed = await res.json();
  if (parsed && typeof parsed === 'object' && 'success' in parsed && 'data' in parsed) {
    return parsed.data as T;
  }
  return parsed as T;
}

export async function fetchSmartCalls(): Promise<SmartCall[]> {
  return apiFetch<SmartCall[]>(`${SC_BASE}/calls`, { cache: 'no-store' });
}

// ─── 1. GET /api/smart-call/contacts ──────────────────────────────────────

export async function fetchContacts(query = '', limit = 20): Promise<ContactsResponse> {
  const params = new URLSearchParams({ q: query, limit: String(limit), offset: '0' });
  return apiFetch<ContactsResponse>(`${SC_BASE}/contacts?${params}`, { cache: 'no-store' });
}

// ─── 2. GET /api/smart-call/contacts/{contactId}/pre-call-brief ───────────

export async function fetchPreCallBrief(contactId: string): Promise<PreCallBrief> {
  return apiFetch<PreCallBrief>(`${SC_BASE}/contacts/${contactId}/pre-call-brief`, {
    cache: 'no-store',
  });
}

// ─── 3. POST /api/smart-call/sessions/start ───────────────────────────────

export async function startSession(
  contactId: string,
  taskId?: string
): Promise<SessionStartResponse> {
  return apiFetch<SessionStartResponse>(`${SC_BASE}/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contactId,
      ...(taskId ? { taskId } : {}),
      startedAt: new Date().toISOString(),
      integration: 'ZOOM',
    }),
  });
}

// ─── 4. POST /api/smart-call/sessions/{sessionId}/end ─────────────────────

export async function endSession(sessionId: string): Promise<SessionEndResponse> {
  return apiFetch<SessionEndResponse>(`${SC_BASE}/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endedAt: new Date().toISOString(),
      generateSummary: true,
    }),
  });
}

// ─── 5. GET /api/smart-call/sessions/{sessionId}/summary ──────────────────

export async function fetchCallSummary(sessionId: string): Promise<CallSummary> {
  return apiFetch<CallSummary>(`${SC_BASE}/sessions/${sessionId}/summary`, {
    cache: 'no-store',
  });
}

// ─── Live call chunk summaries (Postgres) ───────────────────────────────────

export type LiveCallChunkSummary = {
  chunk_index: number;
  time_start: string;
  time_end: string;
  summary_text: string;
  key_topics?: string[];
  sentiment?: string;
  competitors_mentioned?: string[];
  raw_transcript?: string;
};

export async function fetchSessionSummaries(
  sessionId: string,
): Promise<LiveCallChunkSummary[]> {
  return apiFetch<LiveCallChunkSummary[]>(`${SC_BASE}/sessions/${sessionId}/summaries`, {
    cache: 'no-store',
  });
}

// ─── 6. GET /api/smart-call/sessions/{sessionId}/transcript ───────────────

export async function fetchTranscript(sessionId: string): Promise<TranscriptData> {
  return apiFetch<TranscriptData>(`${SC_BASE}/sessions/${sessionId}/transcript`, {
    cache: 'no-store',
  });
}
