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
  CallProcessStatus,
  CallProcessResponse,
} from '../types/calls.types';

import { getBackendUrl } from '@shared/config/module-api';
import { getBridgeHeaders } from '@shared/lib/backend-headers';
import { unwrapM01Payload } from '@shared/lib/m01-api-payload';

// ─── Helper ───────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  let fullUrl = '';
  if (url.startsWith('/api/v1/')) {
    fullUrl = `${getBackendUrl()}${url}`;
  } else {
    fullUrl = `${getBackendUrl()}/api/v1/capture-transcription${url.substring(4)}`;
  }
  const res = await fetch(fullUrl, {
    ...options,
    headers: { ...getBridgeHeaders(), ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  const json = (await res.json()) as Record<string, unknown>;
  return unwrapM01Payload<T>(json);
}

// ─── 1. GET /api/v1/capture-transcription/calls ────────────────────────────────────────

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
  if (filters.dateRange && filters.dateRange !== 'all') params.set('dateRange', filters.dateRange);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);

  return apiFetch<CallsListResponse>(`/api/v1/capture-transcription/calls?${params.toString()}`);
}

// ─── 2. GET /api/v1/capture-transcription/calls/:callId ────────────────────────────────

export async function fetchCallDetail(callId: string): Promise<CallMetadata> {
  return apiFetch<CallMetadata>(`/api/v1/capture-transcription/calls/${callId}`);
}

// ─── 3. GET /api/v1/capture-transcription/calls/accounts ───────────────────────────────

export async function fetchAccounts(search?: string): Promise<AccountsResponse> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiFetch<AccountsResponse>(`/api/v1/capture-transcription/calls/accounts${params}`);
}

// ─── 4. GET /api/v1/capture-transcription/calls/participants ───────────────────────────

export async function fetchParticipants(search?: string, accountId?: string): Promise<ParticipantsResponse> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (accountId) params.set('accountId', accountId);
  return apiFetch<ParticipantsResponse>(`/api/v1/capture-transcription/calls/participants?${params.toString()}`);
}

// ─── 5b. Call processing (transcribe + analyze on open) ───────

export async function fetchCallProcessStatus(callId: string): Promise<CallProcessStatus> {
  return apiFetch<CallProcessStatus>(`/api/v1/capture-transcription/calls/${callId}/process-status`);
}

// ─── 5c. POST /api/v1/capture-transcription/calls/:callId/process ───────

export async function triggerCallProcess(callId: string): Promise<CallProcessResponse> {
  return apiFetch<CallProcessResponse>(`/api/v1/capture-transcription/calls/${callId}/process`, {
    method: 'POST',
  });
}

// ─── 6. GET /api/v1/capture-transcription/calls/:callId/metadata ──────────────────────

export async function fetchCallMetadata(callId: string): Promise<CallMetadata> {
  return apiFetch<CallMetadata>(`/api/v1/capture-transcription/calls/${callId}/metadata`);
}

// ─── 7. GET /api/v1/capture-transcription/calls/:callId/briefs ────────────────────────

export async function fetchBriefsList(callId: string, page = 1, size = 10): Promise<BriefsListResponse> {
  return apiFetch<BriefsListResponse>(`/api/v1/capture-transcription/calls/${callId}/briefs?page=${page}&size=${size}`);
}

// ─── 8. GET /api/v1/capture-transcription/calls/:callId/briefs/:briefId ───────────────

export async function fetchBriefDetail(callId: string, briefId: string): Promise<BriefDetail> {
  return apiFetch<BriefDetail>(`/api/v1/capture-transcription/calls/${callId}/briefs/${briefId}`);
}

// ─── 9. GET /api/brief-templates ─────────────────────────────

export async function fetchBriefTemplates(): Promise<BriefTemplatesResponse> {
  return apiFetch<BriefTemplatesResponse>('/api/brief-templates');
}

// ─── 10. GET /api/brief-periods ──────────────────────────────

export async function fetchBriefPeriods(): Promise<BriefPeriodsResponse> {
  return apiFetch<BriefPeriodsResponse>('/api/brief-periods');
}

// ─── 11. POST /api/v1/capture-transcription/calls/:callId/briefs ──────────────────────

export async function generateBrief(callId: string, body: GenerateBriefRequest): Promise<GenerateBriefResponse> {
  const url = `/api/v1/capture-transcription/calls/${callId}/briefs`;
  return apiFetch<GenerateBriefResponse>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── 11b. POST /api/v1/capture-transcription/calls/:callId/briefs/:briefId/regenerate ─

export async function regenerateBrief(
  callId: string,
  briefId: string,
  body: GenerateBriefRequest,
): Promise<GenerateBriefResponse> {
  const url = `/api/v1/capture-transcription/calls/${callId}/briefs/${briefId}/regenerate`;
  return apiFetch<GenerateBriefResponse>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── 12. POST /api/v1/capture-transcription/calls/:callId/briefs/:briefId/share-link ──

export async function generateShareLink(callId: string, briefId: string): Promise<ShareLinkResponse> {
  const url = `/api/v1/capture-transcription/calls/${callId}/briefs/${briefId}/share-link`;
  return apiFetch<ShareLinkResponse>(url, { method: 'POST' });
}

// ─── 13. POST /api/v1/capture-transcription/calls/:callId/briefs/:briefId/share-internal

export async function shareInternally(
  callId: string,
  briefId: string,
  body: ShareInternalRequest,
): Promise<ShareInternalResponse> {
  const url = `/api/v1/capture-transcription/calls/${callId}/briefs/${briefId}/share-internal`;
  return apiFetch<ShareInternalResponse>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── 15. GET /api/v1/capture-transcription/calls/:callId/briefs/:briefId/formatted-summary

export async function fetchFormattedSummary(callId: string, briefId: string): Promise<FormattedSummaryResponse> {
  const url = `/api/v1/capture-transcription/calls/${callId}/briefs/${briefId}/formatted-summary`;
  return apiFetch<FormattedSummaryResponse>(url);
}

// ─── 22. GET /api/v1/capture-transcription/calls/:callId/transcript ───────────────────

export async function fetchTranscript(
  callId: string,
  params: { page?: number; size?: number; search?: string; showLowConfidenceOnly?: boolean },
): Promise<TranscriptResponse> {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', String(params.page));
  if (params.size) qp.set('size', String(params.size));
  if (params.search) qp.set('search', params.search);
  if (params.showLowConfidenceOnly) qp.set('showLowConfidenceOnly', 'true');
  return apiFetch<TranscriptResponse>(`/api/v1/capture-transcription/calls/${callId}/transcript?${qp.toString()}`);
}

// ─── 23. GET /api/v1/capture-transcription/calls/:callId/transcript/summary ───────────

export async function fetchTranscriptSummary(callId: string): Promise<TranscriptSummary> {
  return apiFetch<TranscriptSummary>(`/api/v1/capture-transcription/calls/${callId}/transcript/summary`);
}

// ─── 24. GET /api/v1/capture-transcription/calls/:callId/transcript/talk-ratio ────────

export async function fetchTalkRatio(callId: string): Promise<TalkRatio> {
  return apiFetch<TalkRatio>(`/api/v1/capture-transcription/calls/${callId}/transcript/talk-ratio`);
}

// ─── 25. GET /api/v1/capture-transcription/calls/:callId/transcript/audio ─────────────

export async function fetchAudio(callId: string): Promise<AudioMeta> {
  return apiFetch<AudioMeta>(`/api/v1/capture-transcription/calls/${callId}/transcript/audio`);
}

// ─── 26. GET /api/v1/capture-transcription/calls/:callId/transcript/topics ────────────

export async function fetchTopics(callId: string): Promise<TopicsResponse> {
  return apiFetch<TopicsResponse>(`/api/v1/capture-transcription/calls/${callId}/transcript/topics`);
}

// ─── 27. GET /api/v1/capture-transcription/calls/:callId/next-steps ───────────────────

export async function fetchNextSteps(callId: string): Promise<NextStepsResponse> {
  return apiFetch<NextStepsResponse>(`/api/v1/capture-transcription/calls/${callId}/next-steps`);
}

// ─── 28. PATCH /api/v1/capture-transcription/calls/:callId/next-steps/:stepId ─────────

export async function updateNextStep(
  callId: string,
  stepId: string,
  completed: boolean,
): Promise<Pick<NextStep, 'stepId' | 'completed'> & { updatedAt: string }> {
  return apiFetch(`/api/v1/capture-transcription/calls/${callId}/next-steps/${stepId}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
}

// ─── 29. POST /api/v1/capture-transcription/calls/:callId/notes ────────────────────────────

export async function saveCallNote(callId: string, note: string): Promise<NoteResponse> {
  const payload = {
    callId,
    note,
    userId: process.env.NEXT_PUBLIC_USER_ID || 'usr_001',
    timestamp: new Date().toISOString(),
  };
  return apiFetch<NoteResponse>(`/api/v1/capture-transcription/calls/${callId}/notes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCallNotes(callId: string): Promise<NoteResponse[]> {
  return apiFetch<NoteResponse[]>(`/api/v1/capture-transcription/calls/${callId}/notes`);
}

// ─── 30. POST /api/v1/capture-transcription/calls/:callId/share (full call share) ───────────

export async function shareFullCall(callId: string): Promise<CallShareResponse> {
  return apiFetch<CallShareResponse>(`/api/v1/capture-transcription/calls/${callId}/share`, {
    method: 'POST',
  });
}

// ─── 31. GET /api/v1/capture-transcription/calls/:callId/briefs/:briefId/export/pdf ─────────

export async function exportBriefAsPdf(callId: string, briefId: string): Promise<PdfExportResponse> {
  const url = `/api/v1/capture-transcription/calls/${callId}/briefs/${briefId}/export/pdf`;
  return apiFetch<PdfExportResponse>(url, { headers: { Accept: 'application/pdf' } });
}
