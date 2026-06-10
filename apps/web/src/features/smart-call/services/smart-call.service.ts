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

async function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
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
  return res;
}

export async function fetchSmartCalls(): Promise<SmartCall[]> {
  const res = await fetchWithAuth(`${SC_BASE}/calls`, { cache: 'no-store' });
  return res.json() as Promise<SmartCall[]>;
}

// ─── 1. GET /api/smart-call/contacts ──────────────────────────────────────

export async function fetchContacts(query = '', limit = 20): Promise<ContactsResponse> {
  const params = new URLSearchParams({ q: query, limit: String(limit), offset: '0' });
  const res = await fetchWithAuth(`${SC_BASE}/contacts?${params}`, { cache: 'no-store' });
  return res.json() as Promise<ContactsResponse>;
}

// ─── 2. GET /api/smart-call/contacts/{contactId}/pre-call-brief ───────────

export async function fetchPreCallBrief(contactId: string): Promise<PreCallBrief> {
  const res = await fetchWithAuth(`${SC_BASE}/contacts/${contactId}/pre-call-brief`, {
    cache: 'no-store',
  });
  return res.json() as Promise<PreCallBrief>;
}

// ─── 3. POST /api/smart-call/sessions/start ───────────────────────────────

export async function startSession(
  contactId: string,
  taskId?: string
): Promise<SessionStartResponse> {
  const res = await fetchWithAuth(`${SC_BASE}/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contactId,
      ...(taskId ? { taskId } : {}),
      startedAt: new Date().toISOString(),
      integration: 'ZOOM',
    }),
  });
  return res.json() as Promise<SessionStartResponse>;
}

// ─── 4. POST /api/smart-call/sessions/{sessionId}/end ─────────────────────

export async function endSession(sessionId: string): Promise<SessionEndResponse> {
  const res = await fetchWithAuth(`${SC_BASE}/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endedAt: new Date().toISOString(),
      generateSummary: true,
    }),
  });
  return res.json() as Promise<SessionEndResponse>;
}

// ─── 5. GET /api/smart-call/sessions/{sessionId}/summary ──────────────────

export async function fetchCallSummary(sessionId: string): Promise<CallSummary> {
  const res = await fetchWithAuth(`${SC_BASE}/sessions/${sessionId}/summary`, {
    cache: 'no-store',
  });
  return res.json() as Promise<CallSummary>;
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
  const res = await fetchWithAuth(`${SC_BASE}/sessions/${sessionId}/summaries`, {
    cache: 'no-store',
  });
  return res.json() as Promise<LiveCallChunkSummary[]>;
}

// ─── 6. GET /api/smart-call/sessions/{sessionId}/transcript ───────────────

export async function fetchTranscript(sessionId: string): Promise<TranscriptData> {
  const res = await fetchWithAuth(`${SC_BASE}/sessions/${sessionId}/transcript`, {
    cache: 'no-store',
  });
  return res.json() as Promise<TranscriptData>;
}
