// ============================================================
// Calls Service — Centralized API Layer
// ============================================================

import type {
  CallsListFilters,
  CallsListResponse,
  AccountsResponse,
  ParticipantsResponse,
  CallMetadata,
  BriefsListResponse,
  BriefDetail,
  BriefTemplatesResponse,
  BriefPeriodsResponse,
  GenerateBriefRequest,
  GenerateBriefResponse,
  ShareLinkResponse,
  ShareInternalRequest,
  ShareInternalResponse,
  FormattedSummaryResponse,
  TranscriptResponse,
  TranscriptSummary,
  TalkRatio,
  AudioMeta,
  TopicsResponse,
  NextStepsResponse,
  NextStep,
  NoteResponse,
  CallShareResponse,
  PdfExportResponse,
} from '../types/calls.types';

import { ENV } from '@shared/config/env';

// ─── Config (M01 bridge @ /api/calls) ───────────────────────

const API_BASE_URL = ENV.M01_API_BASE_URL;

// ─── Helper ───────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: { ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ─── 1. GET /api/calls ────────────────────────────────────────

export async function fetchCallsList(filters: Partial<CallsListFilters>): Promise<CallsListResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.size) params.set('size', String(filters.size));
  if (filters.search) params.set('search', filters.search);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.duration && filters.duration !== 'all') params.set('duration', filters.duration);
  if (filters.dealType && filters.dealType.length > 0) params.set('dealType', filters.dealType.join(','));
  if (filters.account && filters.account.length > 0) params.set('account', filters.account.join(','));
  if (filters.participantId && filters.participantId.length > 0) params.set('participantId', filters.participantId.join(','));
  if (filters.ownerId) params.set('ownerId', filters.ownerId);
  if (filters.dateRange) params.set('dateRange', filters.dateRange);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);

  return apiFetch<CallsListResponse>(`/api/calls?${params.toString()}`);
}

// ─── 2. GET /api/calls/:callId ────────────────────────────────

export async function fetchCallDetail(callId: string): Promise<CallMetadata> {
  return apiFetch<CallMetadata>(`/api/calls/${callId}`);
}

// ─── 3. GET /api/calls/accounts ───────────────────────────────

export async function fetchAccounts(search?: string): Promise<AccountsResponse> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiFetch<AccountsResponse>(`/api/calls/accounts${params}`);
}

// ─── 4. GET /api/calls/participants ───────────────────────────

export async function fetchParticipants(search?: string, accountId?: string): Promise<ParticipantsResponse> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (accountId) params.set('accountId', accountId);
  return apiFetch<ParticipantsResponse>(`/api/calls/participants?${params.toString()}`);
}

// ─── 6. GET /api/calls/:callId/metadata ──────────────────────

export async function fetchCallMetadata(callId: string): Promise<CallMetadata> {
  return apiFetch<CallMetadata>(`/api/calls/${callId}/metadata`);
}

// ─── 7. GET /api/calls/:callId/briefs ────────────────────────

export async function fetchBriefsList(callId: string, page = 1, size = 10): Promise<BriefsListResponse> {
  return apiFetch<BriefsListResponse>(`/api/calls/${callId}/briefs?page=${page}&size=${size}`);
}

// ─── 8. GET /api/calls/:callId/briefs/:briefId ───────────────

export async function fetchBriefDetail(callId: string, briefId: string): Promise<BriefDetail> {
  return apiFetch<BriefDetail>(`/api/calls/${callId}/briefs/${briefId}`);
}

// ─── 9. GET /api/brief-templates ─────────────────────────────

export async function fetchBriefTemplates(): Promise<BriefTemplatesResponse> {
  return apiFetch<BriefTemplatesResponse>('/api/brief-templates');
}

// ─── 10. GET /api/brief-periods ──────────────────────────────

export async function fetchBriefPeriods(): Promise<BriefPeriodsResponse> {
  return apiFetch<BriefPeriodsResponse>('/api/brief-periods');
}

// ─── 11. POST /api/calls/:callId/briefs ──────────────────────

export async function generateBrief(callId: string, body: GenerateBriefRequest): Promise<GenerateBriefResponse> {
  const url = `/api/calls/${callId}/briefs`;
  return apiFetch<GenerateBriefResponse>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── 11b. POST /api/calls/:callId/briefs/:briefId/regenerate ─

export async function regenerateBrief(
  callId: string,
  briefId: string,
  body: GenerateBriefRequest,
): Promise<GenerateBriefResponse> {
  const url = `/api/calls/${callId}/briefs/${briefId}/regenerate`;
  return apiFetch<GenerateBriefResponse>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── 12. POST /api/calls/:callId/briefs/:briefId/share-link ──

export async function generateShareLink(callId: string, briefId: string): Promise<ShareLinkResponse> {
  const url = `/api/calls/${callId}/briefs/${briefId}/share-link`;
  return apiFetch<ShareLinkResponse>(url, { method: 'POST' });
}

// ─── 13. POST /api/calls/:callId/briefs/:briefId/share-internal

export async function shareInternally(
  callId: string,
  briefId: string,
  body: ShareInternalRequest,
): Promise<ShareInternalResponse> {
  const url = `/api/calls/${callId}/briefs/${briefId}/share-internal`;
  return apiFetch<ShareInternalResponse>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── 15. GET /api/calls/:callId/briefs/:briefId/formatted-summary

export async function fetchFormattedSummary(callId: string, briefId: string): Promise<FormattedSummaryResponse> {
  const url = `/api/calls/${callId}/briefs/${briefId}/formatted-summary`;
  return apiFetch<FormattedSummaryResponse>(url);
}

// ─── 22. GET /api/calls/:callId/transcript ───────────────────

export async function fetchTranscript(
  callId: string,
  params: { page?: number; size?: number; search?: string; showLowConfidenceOnly?: boolean },
): Promise<TranscriptResponse> {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', String(params.page));
  if (params.size) qp.set('size', String(params.size));
  if (params.search) qp.set('search', params.search);
  if (params.showLowConfidenceOnly) qp.set('showLowConfidenceOnly', 'true');
  return apiFetch<TranscriptResponse>(`/api/calls/${callId}/transcript?${qp.toString()}`);
}

// ─── 23. GET /api/calls/:callId/transcript/summary ───────────

export async function fetchTranscriptSummary(callId: string): Promise<TranscriptSummary> {
  return apiFetch<TranscriptSummary>(`/api/calls/${callId}/transcript/summary`);
}

// ─── 24. GET /api/calls/:callId/transcript/talk-ratio ────────

export async function fetchTalkRatio(callId: string): Promise<TalkRatio> {
  return apiFetch<TalkRatio>(`/api/calls/${callId}/transcript/talk-ratio`);
}

// ─── 25. GET /api/calls/:callId/transcript/audio ─────────────

export async function fetchAudio(callId: string): Promise<AudioMeta> {
  return apiFetch<AudioMeta>(`/api/calls/${callId}/transcript/audio`);
}

// ─── 26. GET /api/calls/:callId/transcript/topics ────────────

export async function fetchTopics(callId: string): Promise<TopicsResponse> {
  return apiFetch<TopicsResponse>(`/api/calls/${callId}/transcript/topics`);
}

// ─── 27. GET /api/calls/:callId/next-steps ───────────────────

export async function fetchNextSteps(callId: string): Promise<NextStepsResponse> {
  return apiFetch<NextStepsResponse>(`/api/calls/${callId}/next-steps`);
}

// ─── 28. PATCH /api/calls/:callId/next-steps/:stepId ─────────

export async function updateNextStep(
  callId: string,
  stepId: string,
  completed: boolean,
): Promise<Pick<NextStep, 'stepId' | 'completed'> & { updatedAt: string }> {
  return apiFetch(`/api/calls/${callId}/next-steps/${stepId}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
}

// ─── 29. POST /api/calls/:callId/notes ────────────────────────────

export async function saveCallNote(callId: string, note: string): Promise<NoteResponse> {
  const payload = {
    callId,
    note,
    userId: process.env.NEXT_PUBLIC_USER_ID || 'usr_001',
    timestamp: new Date().toISOString(),
  };
  return apiFetch<NoteResponse>(`/api/calls/${callId}/notes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCallNotes(callId: string): Promise<NoteResponse[]> {
  return apiFetch<NoteResponse[]>(`/api/calls/${callId}/notes`);
}

// ─── 30. POST /api/calls/:callId/share (full call share) ───────────

export async function shareFullCall(callId: string): Promise<CallShareResponse> {
  return apiFetch<CallShareResponse>(`/api/calls/${callId}/share`, {
    method: 'POST',
  });
}

// ─── 31. GET /api/calls/:callId/briefs/:briefId/export/pdf ─────────

export async function exportBriefAsPdf(callId: string, briefId: string): Promise<PdfExportResponse> {
  const url = `/api/calls/${callId}/briefs/${briefId}/export/pdf`;
  return apiFetch<PdfExportResponse>(url, { headers: { Accept: 'application/pdf' } });
}
