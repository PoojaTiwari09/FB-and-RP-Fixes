import { m01ApiV1, DEV_TENANT_ID } from '../lib/api-env';
import { S3_RECORDINGS_FALLBACK, type S3RecordingOption } from '../lib/s3-recordings';

export type { S3RecordingOption };

const M01 = `${m01ApiV1('/capture-transcription')}`;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${M01}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id':  DEV_TENANT_ID,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}


// ── Types ─────────────────────────────────────────────────────────────────────

export interface CallRecord {
  id:              string;
  title:           string;
  callDate:        string;
  durationSeconds: number;
  callType:        'inbound' | 'outbound' | 'meeting';
  callSource:      'zoom' | 'teams' | 'meet' | 'dialer' | 'manual';
  participants:    string[];
  callOwner:       string;
  accountId:       string | null;
  opportunityId:   string | null;
  audioUrl:        string | null;
  transcriptStatus:'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  failureReason?:  string | null;
  skipReason?:     string | null;
  transcript?: Transcript;
  notes?:      CallNote[];
  shares?:     CallShare[];
}

export interface Transcript {
  id:            string;
  fullText:      string;
  summary:       string | null;
  keyHighlights: KeyHighlight[] | null;
  nextSteps:     string[];
  talkRatio:     TalkRatio | null;
  utterances:    Utterance[];
}

export interface Utterance {
  id:              string;
  speaker:         string;
  text:            string;
  startMs:         number;
  endMs:           number;
  confidence:      number;
  isLowConfidence: boolean;
  sequenceIndex:   number;
}

export interface KeyHighlight {
  label:       string;
  text:        string;
  timestampMs: number;
  speaker:     string;
}

export interface TalkRatio {
  [speaker: string]: { durationMs: number; percentage: number };
}

export interface CallNote {
  id:        string;
  authorId:  string;
  content:   string;
  createdAt: string;
  updatedAt: string;
}

export interface CallShare {
  id:             string;
  sharedWithId:   string;
  sharedWithType: 'user' | 'team';
  sharedAt:       string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/** CT sortable list */
export const listCalls = (params?: Record<string, string>) => {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  return apiFetch<{ records: CallRecord[]; total: number }>(`/calls${qs}`);
};

/** CT-13 through CT-24 — full call detail */
export const getCall = (id: string) =>
  apiFetch<CallRecord>(`/calls/${id}`);

/** CT-01/02 — register call */
export const createCall = (data: Partial<CallRecord>) =>
  apiFetch<CallRecord>('/calls', { method: 'POST', body: JSON.stringify(data) });

/** Curated S3 recordings for "Upload from S3" */
export const listS3Recordings = async (): Promise<{ recordings: S3RecordingOption[] }> => {
  try {
    return await apiFetch<{ recordings: S3RecordingOption[] }>('/calls/s3-recordings');
  } catch {
    return { recordings: S3_RECORDINGS_FALLBACK };
  }
};

/** Download from S3 → local disk → same transcription queue as file upload */
export const uploadFromS3 = (recordingId: string) =>
  apiFetch<CallRecord>('/calls/upload-from-s3', {
    method: 'POST',
    body: JSON.stringify({ recordingId }),
  });

/** CT-01/02 — direct audio file upload (no form fields needed) */
export const uploadAudio = async (file: File): Promise<CallRecord> => {
  const formData = new FormData();
  formData.append('audio', file);

  const res = await fetch(`${M01}/calls/upload`, {
    method: 'POST',
    headers: { 'x-tenant-id': DEV_TENANT_ID },  // no Content-Type — browser sets multipart boundary
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Upload failed with status ${res.status}`);
  }
  return res.json() as Promise<CallRecord>;
};

/** CT-05 — org-wide transcript search */
export const searchTranscripts = (q: string, limit = 20, offset = 0) =>
  apiFetch<{ callId: string; callTitle: string; excerpt: string; startMs: number }[]>(
    `/calls/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`,
  );

/** CT-21 — in-call search */
export const searchWithinCall = (callId: string, q: string) =>
  apiFetch<Utterance[]>(`/calls/${callId}/search?q=${encodeURIComponent(q)}`);

/** CT-22 — notes */
export const createNote = (callId: string, content: string) =>
  apiFetch<CallNote>(`/calls/${callId}/notes`, {
    method: 'POST', body: JSON.stringify({ content }),
  });

export const updateNote = (callId: string, noteId: string, content: string) =>
  apiFetch<CallNote>(`/calls/${callId}/notes/${noteId}`, {
    method: 'PUT', body: JSON.stringify({ content }),
  });

export const deleteNote = (callId: string, noteId: string) =>
  apiFetch<void>(`/calls/${callId}/notes/${noteId}`, { method: 'DELETE' });

/** CT-23 — share */
export const shareCall = (callId: string, sharedWithId: string, sharedWithType: 'user' | 'team') =>
  apiFetch<CallShare>(`/calls/${callId}/share`, {
    method: 'POST', body: JSON.stringify({ sharedWithId, sharedWithType }),
  });

/** Inline transcript edit — update a single utterance's text */
export const updateUtterance = (utteranceId: string, text: string) =>
  apiFetch<Utterance>(`/utterances/${utteranceId}`, {
    method: 'PATCH', body: JSON.stringify({ text }),
  });

// ── US-11: Next Steps CRUD ──────────────────────────────────────────────────

/** Get all next steps for a call */
export const getNextSteps = (callId: string) =>
  apiFetch<string[]>(`/calls/${callId}/next-steps`);

/** Add a single next step */
export const addNextStep = (callId: string, step: string) =>
  apiFetch<string[]>(`/calls/${callId}/next-steps`, {
    method: 'POST', body: JSON.stringify({ step }),
  });

/** Update a next step by index */
export const updateNextStep = (callId: string, index: number, step: string) =>
  apiFetch<string[]>(`/calls/${callId}/next-steps`, {
    method: 'PATCH', body: JSON.stringify({ index, step }),
  });

/** Delete a next step by index */
export const deleteNextStep = (callId: string, index: number) =>
  apiFetch<string[]>(`/calls/${callId}/next-steps/${index}`, {
    method: 'DELETE',
  });

/** Run AI extraction (summary, highlights, talk ratio) on an existing transcript */
export const extractAI = (callId: string) =>
  apiFetch<{
    summary: string | null;
    keyHighlights: any[];
    talkRatio: Record<string, { durationMs: number; percentage: number }>;
    nextSteps: string[];
  }>(`/calls/${callId}/extract-ai`, { method: 'POST' });

/** Delete a call and ALL its associated data (transcript, utterances, notes, shares) */
export const deleteCall = (callId: string) =>
  apiFetch<{ success: boolean }>(`/calls/${callId}`, { method: 'DELETE' });

