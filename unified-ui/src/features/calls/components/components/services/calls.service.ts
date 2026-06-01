// ============================================================
// Calls Service — Centralized API Layer
// Flow: API first. Mock only when NEXT_PUBLIC_USE_MOCK_DATA=true.
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

import {
  MOCK_CALLS_LIST,
  MOCK_ACCOUNTS,
  MOCK_PARTICIPANTS,
  MOCK_CALL_METADATA,
  MOCK_CALL_METADATA_MAP,
  MOCK_BRIEFS_LIST,
  MOCK_BRIEF_DETAIL_MAP,
  MOCK_BRIEF_TEMPLATES,
  MOCK_BRIEF_PERIODS,
  MOCK_GENERATE_BRIEF,
  MOCK_SHARE_LINK,
  MOCK_FORMATTED_SUMMARY,
  MOCK_TRANSCRIPT_MAP,
  MOCK_TRANSCRIPT_SUMMARY_MAP,
  MOCK_TALK_RATIO_MAP,
  MOCK_AUDIO,
  MOCK_TOPICS_MAP,
  MOCK_NEXT_STEPS_MAP,
} from '../mocks/calls.mock';

import { ENV } from '@shared/config/env';
import { fetchApiOrMock } from '@shared/lib/api-data-source';
import { getBridgeHeaders } from '@shared/lib/backend-headers';

// ─── Config (M01 bridge @ /api/calls) ───────────────────────

const API_BASE_URL = ENV.M01_API_BASE_URL;

const DEFAULT_HEADERS: HeadersInit = getBridgeHeaders();

// ─── Helper ───────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: { ...DEFAULT_HEADERS, ...options?.headers },
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

  return fetchApiOrMock('CallsListResponse', () => apiFetch<CallsListResponse>(`/api/calls?${params.toString()}`), () => MOCK_CALLS_LIST);
}

// ─── 2. GET /api/calls/:callId ────────────────────────────────

export async function fetchCallDetail(callId: string): Promise<CallMetadata> {
  return fetchApiOrMock('CallMetadata', () => apiFetch<CallMetadata>(`/api/calls/${callId}`), () => MOCK_CALL_METADATA_MAP[callId] ?? MOCK_CALL_METADATA);
}

// ─── 3. GET /api/calls/accounts ───────────────────────────────

export async function fetchAccounts(search?: string): Promise<AccountsResponse> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return fetchApiOrMock('AccountsResponse', () => apiFetch<AccountsResponse>(`/api/calls/accounts${params}`), () => MOCK_ACCOUNTS);
}

// ─── 4. GET /api/calls/participants ───────────────────────────

export async function fetchParticipants(search?: string, accountId?: string): Promise<ParticipantsResponse> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (accountId) params.set('accountId', accountId);
  return fetchApiOrMock('ParticipantsResponse', () => apiFetch<ParticipantsResponse>(`/api/calls/participants?${params.toString()}`), () => MOCK_PARTICIPANTS);
}

// ─── 6. GET /api/calls/:callId/metadata ──────────────────────

export async function fetchCallMetadata(callId: string): Promise<CallMetadata> {
  return fetchApiOrMock('CallMetadata', () => apiFetch<CallMetadata>(`/api/calls/${callId}/metadata`), () => MOCK_CALL_METADATA_MAP[callId] ?? MOCK_CALL_METADATA);
}

// ─── 7. GET /api/calls/:callId/briefs ────────────────────────

export async function fetchBriefsList(callId: string, page = 1, size = 10): Promise<BriefsListResponse> {
  return fetchApiOrMock('BriefsListResponse', () => apiFetch<BriefsListResponse>(`/api/calls/${callId}/briefs?page=${page}&size=${size}`), () => MOCK_BRIEFS_LIST);
}

// ─── 8. GET /api/calls/:callId/briefs/:briefId ───────────────

export async function fetchBriefDetail(callId: string, briefId: string): Promise<BriefDetail> {
  return fetchApiOrMock('BriefDetail', () => apiFetch<BriefDetail>(`/api/calls/${callId}/briefs/${briefId}`), () => MOCK_BRIEF_DETAIL_MAP[callId] ?? Object.values(MOCK_BRIEF_DETAIL_MAP)[0]);
}

// ─── 9. GET /api/brief-templates ─────────────────────────────

export async function fetchBriefTemplates(): Promise<BriefTemplatesResponse> {
  return fetchApiOrMock('BriefTemplatesResponse', () => apiFetch<BriefTemplatesResponse>('/api/brief-templates'), () => MOCK_BRIEF_TEMPLATES);
}

// ─── 10. GET /api/brief-periods ──────────────────────────────

export async function fetchBriefPeriods(): Promise<BriefPeriodsResponse> {
  return fetchApiOrMock('BriefPeriodsResponse', () => apiFetch<BriefPeriodsResponse>('/api/brief-periods'), () => MOCK_BRIEF_PERIODS);
}

// ─── 11. POST /api/calls/:callId/briefs ──────────────────────

export async function generateBrief(callId: string, body: GenerateBriefRequest): Promise<GenerateBriefResponse> {
  const url = `/api/calls/${callId}/briefs`;
  return fetchApiOrMock(
    'generateBrief',
    async () => {
      const result = await apiFetch<GenerateBriefResponse>(url, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return result;
    },
    () => ({ ...MOCK_GENERATE_BRIEF, briefTemplate: body.briefTemplate, period: body.period }),
  );
}

// ─── 11b. POST /api/calls/:callId/briefs/:briefId/regenerate ─

export async function regenerateBrief(
  callId: string,
  briefId: string,
  body: GenerateBriefRequest,
): Promise<GenerateBriefResponse> {
  const url = `/api/calls/${callId}/briefs/${briefId}/regenerate`;
  console.log(`[Regenerate API] POST ${API_BASE_URL}${url}`, body);
  return fetchApiOrMock(
    'regenerateBrief',
    () =>
      apiFetch<GenerateBriefResponse>(url, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    () => ({
      briefId,
      briefTemplate: body.briefTemplate,
      period: body.period,
      generatedAt: new Date().toISOString(),
      status: 'completed',
    }),
  );
}

// ─── 12. POST /api/calls/:callId/briefs/:briefId/share-link ──

export async function generateShareLink(callId: string, briefId: string): Promise<ShareLinkResponse> {
  const url = `/api/calls/${callId}/briefs/${briefId}/share-link`;
  console.log(`[Share API] POST ${API_BASE_URL}${url}`, { callId, briefId });
  return fetchApiOrMock(
    'generateShareLink',
    () => apiFetch<ShareLinkResponse>(url, { method: 'POST' }),
    () => ({
      shareableLink: `https://app.mock.ai/share/brief_${briefId}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  );
}

// ─── 13. POST /api/calls/:callId/briefs/:briefId/share-internal

export async function shareInternally(
  callId: string,
  briefId: string,
  body: ShareInternalRequest,
): Promise<ShareInternalResponse> {
  const url = `/api/calls/${callId}/briefs/${briefId}/share-internal`;
  console.log(`[Share API] POST ${API_BASE_URL}${url}`, { callId, briefId, ...body });
  return fetchApiOrMock(
    'shareInternally',
    () =>
      apiFetch<ShareInternalResponse>(url, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    () => ({ message: 'Shared internally with team', sentTo: body.recipientEmails }),
  );
}

// ─── 15. GET /api/calls/:callId/briefs/:briefId/formatted-summary

export async function fetchFormattedSummary(callId: string, briefId: string): Promise<FormattedSummaryResponse> {
  const url = `/api/calls/${callId}/briefs/${briefId}/formatted-summary`;
  console.log(`[Share API] GET ${API_BASE_URL}${url}`, { callId, briefId });
  return fetchApiOrMock(
    'fetchFormattedSummary',
    () => apiFetch<FormattedSummaryResponse>(url),
    () => ({
      formattedText: `CALL BRIEF — Generated AI Summary\nAccount: Acme Corp | Date: ${new Date().toLocaleDateString()}\n\nOVERVIEW\nThis call focused on key business objectives and strategic alignment.\n\nKEY DISCUSSION POINTS\n- [1:45] Enterprise plan pricing structure and tier comparison\n- [5:20] CRM integration requirements and capabilities\n- [8:10] Data migration timeline and support process\n\nGenerated by CallIntel on ${new Date().toLocaleDateString()}`,
    }),
  );
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
  return fetchApiOrMock('TranscriptResponse', () => apiFetch<TranscriptResponse>(`/api/calls/${callId}/transcript?${qp.toString()}`), () => MOCK_TRANSCRIPT_MAP[callId] ?? Object.values(MOCK_TRANSCRIPT_MAP)[0]);
}

// ─── 23. GET /api/calls/:callId/transcript/summary ───────────

export async function fetchTranscriptSummary(callId: string): Promise<TranscriptSummary> {
  return fetchApiOrMock('TranscriptSummary', () => apiFetch<TranscriptSummary>(`/api/calls/${callId}/transcript/summary`), () => MOCK_TRANSCRIPT_SUMMARY_MAP[callId] ?? Object.values(MOCK_TRANSCRIPT_SUMMARY_MAP)[0]);
}

// ─── 24. GET /api/calls/:callId/transcript/talk-ratio ────────

export async function fetchTalkRatio(callId: string): Promise<TalkRatio> {
  return fetchApiOrMock('TalkRatio', () => apiFetch<TalkRatio>(`/api/calls/${callId}/transcript/talk-ratio`), () => MOCK_TALK_RATIO_MAP[callId] ?? Object.values(MOCK_TALK_RATIO_MAP)[0]);
}

// ─── 25. GET /api/calls/:callId/transcript/audio ─────────────

export async function fetchAudio(callId: string): Promise<AudioMeta> {
  return fetchApiOrMock('AudioMeta', () => apiFetch<AudioMeta>(`/api/calls/${callId}/transcript/audio`), () => MOCK_AUDIO);
}

// ─── 26. GET /api/calls/:callId/transcript/topics ────────────

export async function fetchTopics(callId: string): Promise<TopicsResponse> {
  return fetchApiOrMock('TopicsResponse', () => apiFetch<TopicsResponse>(`/api/calls/${callId}/transcript/topics`), () => MOCK_TOPICS_MAP[callId] ?? Object.values(MOCK_TOPICS_MAP)[0]);
}

// ─── 27. GET /api/calls/:callId/next-steps ───────────────────

export async function fetchNextSteps(callId: string): Promise<NextStepsResponse> {
  return fetchApiOrMock('NextStepsResponse', () => apiFetch<NextStepsResponse>(`/api/calls/${callId}/next-steps`), () => MOCK_NEXT_STEPS_MAP[callId] ?? Object.values(MOCK_NEXT_STEPS_MAP)[0]);
}

// ─── 28. PATCH /api/calls/:callId/next-steps/:stepId ─────────

export async function updateNextStep(
  callId: string,
  stepId: string,
  completed: boolean,
): Promise<Pick<NextStep, 'stepId' | 'completed'> & { updatedAt: string }> {
  return fetchApiOrMock(
    'updateNextStep',
    () =>
      apiFetch(`/api/calls/${callId}/next-steps/${stepId}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      }),
    () => ({ stepId, completed, updatedAt: new Date().toISOString() }),
  );
}

// ─── 29. POST /api/calls/:callId/notes ────────────────────────────

export async function saveCallNote(callId: string, note: string): Promise<NoteResponse> {
  const payload = {
    callId,
    note,
    userId: process.env.NEXT_PUBLIC_USER_ID || 'usr_001',
    timestamp: new Date().toISOString(),
  };
  console.log(`[Notes API] POST /api/calls/${callId}/notes`, payload);
  return fetchApiOrMock(
    'saveCallNote',
    () =>
      apiFetch<NoteResponse>(`/api/calls/${callId}/notes`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    () => ({
      noteId: `note_${Date.now()}`,
      callId,
      note,
      userId: payload.userId,
      timestamp: payload.timestamp,
      createdAt: payload.timestamp,
    }),
  );
}

// ─── 30. POST /api/calls/:callId/share (full call share) ───────────

export async function shareFullCall(callId: string): Promise<CallShareResponse> {
  console.log('[Share API] POST /api/calls/:callId/share', { callId });
  return fetchApiOrMock(
    'shareFullCall',
    () =>
      apiFetch<CallShareResponse>(`/api/calls/${callId}/share`, {
        method: 'POST',
      }),
    () => ({
      shareableLink: `https://app.callintel.io/shared/call/${callId}?token=tkn_${Date.now()}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  );
}

// ─── 31. GET /api/calls/:callId/briefs/:briefId/export/pdf ─────────

export async function exportBriefAsPdf(callId: string, briefId: string): Promise<PdfExportResponse> {
  const url = `/api/calls/${callId}/briefs/${briefId}/export/pdf`;
  console.log(`[Export API] GET ${API_BASE_URL}${url}`, { callId, briefId });
  return fetchApiOrMock(
    'exportBriefAsPdf',
    () => apiFetch<PdfExportResponse>(url, { headers: { Accept: 'application/pdf' } }),
    () => ({
      contentType: 'application/pdf',
      fileName: `Call_Brief.pdf`,
      fileSizeKb: 248,
      downloadUrl: `https://storage.mock.ai/exports/${briefId}/Call_Brief.pdf`,
    }),
  );
}
