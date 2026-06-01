import { ENV } from '@shared/config/env';
import { getBridgeHeaders } from '@shared/lib/backend-headers';
import {
  MOCK_CONTACTS,
  MOCK_PRE_CALL_BRIEF,
  MOCK_SESSION_START,
  MOCK_SESSION_END,
  MOCK_CALL_SUMMARY,
  MOCK_TRANSCRIPT,
  MOCK_SMART_CALLS,
} from '@smart-call/mocks/smart-call.mock';
import type {
  ContactsResponse,
  PreCallBrief,
  SessionStartResponse,
  SessionEndResponse,
  CallSummary,
  TranscriptData,
  SmartCall,
} from '@smart-call/types/smart-call.types';

const SC_BASE = `${ENV.M01_API_BASE_URL}/api/smart-call`;

export async function fetchSmartCalls(): Promise<SmartCall[]> {
  try {
    const res = await fetch(`${SC_BASE}/calls`, { cache: 'no-store', headers: getBridgeHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch smart calls: ${res.status}`);
    return res.json() as Promise<SmartCall[]>;
  } catch (error) {
    console.warn('fetchSmartCalls: falling back to mock data', error);
    return MOCK_SMART_CALLS;
  }
}

// ─── 1. GET /api/smart-call/contacts ──────────────────────────────────────

export async function fetchContacts(query = '', limit = 20): Promise<ContactsResponse> {
  try {
    const params = new URLSearchParams({ q: query, limit: String(limit), offset: '0' });
    const res = await fetch(`${SC_BASE}/contacts?${params}`, { cache: 'no-store', headers: getBridgeHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch contacts: ${res.status}`);
    return res.json() as Promise<ContactsResponse>;
  } catch (error) {
    console.warn('fetchContacts: falling back to mock data', error);
    const filtered = query.trim()
      ? MOCK_CONTACTS.contacts.filter(
          (c) =>
            c.contactName.toLowerCase().includes(query.toLowerCase()) ||
            c.company.toLowerCase().includes(query.toLowerCase()) ||
            c.jobTitle.toLowerCase().includes(query.toLowerCase())
        )
      : MOCK_CONTACTS.contacts;
    return { contacts: filtered, total: filtered.length, hasMore: false };
  }
}

// ─── 2. GET /api/smart-call/contacts/{contactId}/pre-call-brief ───────────

export async function fetchPreCallBrief(contactId: string): Promise<PreCallBrief> {
  try {
    const res = await fetch(`${SC_BASE}/contacts/${contactId}/pre-call-brief`, {
      cache: 'no-store',
      headers: getBridgeHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch pre-call brief: ${res.status}`);
    return res.json() as Promise<PreCallBrief>;
  } catch (error) {
    console.warn('fetchPreCallBrief: falling back to mock data', error);
    return { ...MOCK_PRE_CALL_BRIEF, contactId };
  }
}

// ─── 3. POST /api/smart-call/sessions/start ───────────────────────────────

export async function startSession(
  contactId: string,
  taskId?: string
): Promise<SessionStartResponse> {
  try {
    const res = await fetch(`${SC_BASE}/sessions/start`, {
      method: 'POST',
      headers: getBridgeHeaders(),
      body: JSON.stringify({
        contactId,
        ...(taskId ? { taskId } : {}),
        startedAt: new Date().toISOString(),
        integration: 'ZOOM',
      }),
    });
    if (!res.ok) throw new Error(`Failed to start session: ${res.status}`);
    return res.json() as Promise<SessionStartResponse>;
  } catch (error) {
    console.warn('startSession: falling back to mock data', error);
    return MOCK_SESSION_START;
  }
}

// ─── 4. POST /api/smart-call/sessions/{sessionId}/end ─────────────────────

export async function endSession(sessionId: string): Promise<SessionEndResponse> {
  try {
    const res = await fetch(`${SC_BASE}/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: getBridgeHeaders(),
      body: JSON.stringify({
        endedAt: new Date().toISOString(),
        generateSummary: true,
      }),
    });
    if (!res.ok) throw new Error(`Failed to end session: ${res.status}`);
    return res.json() as Promise<SessionEndResponse>;
  } catch (error) {
    console.warn('endSession: falling back to mock data', error);
    return MOCK_SESSION_END;
  }
}

// ─── 5. GET /api/smart-call/sessions/{sessionId}/summary ──────────────────

export async function fetchCallSummary(sessionId: string): Promise<CallSummary> {
  try {
    const res = await fetch(`${SC_BASE}/sessions/${sessionId}/summary`, {
      cache: 'no-store',
      headers: getBridgeHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch call summary: ${res.status}`);
    return res.json() as Promise<CallSummary>;
  } catch (error) {
    console.warn('fetchCallSummary: falling back to mock data', error);
    return MOCK_CALL_SUMMARY;
  }
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
  try {
    const res = await fetch(`${SC_BASE}/sessions/${sessionId}/summaries`, {
      cache: 'no-store',
      headers: getBridgeHeaders(),
    });
    if (!res.ok) return [];
    return res.json() as Promise<LiveCallChunkSummary[]>;
  } catch {
    return [];
  }
}

// ─── 6. GET /api/smart-call/sessions/{sessionId}/transcript ───────────────

export async function fetchTranscript(sessionId: string): Promise<TranscriptData> {
  try {
    const res = await fetch(`${SC_BASE}/sessions/${sessionId}/transcript`, {
      cache: 'no-store',
      headers: getBridgeHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch transcript: ${res.status}`);
    return res.json() as Promise<TranscriptData>;
  } catch (error) {
    console.warn('fetchTranscript: falling back to mock data', error);
    return { ...MOCK_TRANSCRIPT, sessionId } as TranscriptData;
  }
}
