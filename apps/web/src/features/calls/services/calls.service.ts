import { mockSearchResponse, mockCallDetails, mockAiResponse, mockFilterOptions } from '@calls/mocks/calls.mock';
import { SearchResponse, CallDetail, AiAskResponse, FilterOptions } from '@calls/types';
import { getBackendUrl } from '@shared/config/module-api';
import { ENV } from '@shared/config/env';
import { getBridgeHeaders } from '@shared/lib/backend-headers';
import { fetchApiOrMock, shouldUseMockData } from '@shared/lib/api-data-source';

const bridgeHeaders = () => getBridgeHeaders();

function normalizeSearchResponse(raw: Record<string, unknown>): SearchResponse {
  const chartRaw = (raw.chart ?? {}) as Record<string, unknown>;
  const emptySeries = { days: [], weeks: [], months: [], quarters: [] };
  const pick = (g: string) => {
    const fromKey = chartRaw[g];
    if (Array.isArray(fromKey)) return fromKey;
    if (Array.isArray(chartRaw.data) && (chartRaw.granularity === g || g === 'weeks')) {
      return chartRaw.data;
    }
    return [];
  };
  const chart = {
    days: pick('days'),
    weeks: pick('weeks'),
    months: pick('months'),
    quarters: pick('quarters'),
  };
  return {
    ...(raw as unknown as SearchResponse),
    chart:
      chart.days.length || chart.weeks.length
        ? chart
        : shouldUseMockData()
          ? mockSearchResponse.chart
          : { days: [], weeks: [], months: [], quarters: [] },
    emailChart: (raw.emailChart as SearchResponse['emailChart']) ?? chart,
    emailResults: (raw.emailResults as SearchResponse['emailResults']) ?? [],
    results: (raw.results as SearchResponse['results']) ?? [],
    meta: (raw.meta as SearchResponse['meta']) ??
      (shouldUseMockData()
        ? mockSearchResponse.meta
        : { total: 0, callsCount: 0, emailsCount: 0 }),
  };
}

function apiQueryParams(params: Record<string, string>): URLSearchParams {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (!v || /^all\b/i.test(v)) return;
    qs.set(k, v);
  });
  return qs;
}

export const callsService = {
  // 1. GET /api/v1/conversation-intelligence/filters/options
  getFilterOptions: async (): Promise<FilterOptions> => {
    return fetchApiOrMock(
      'getFilterOptions',
      async () => {
        const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/filters/options`, {
          headers: bridgeHeaders(),
        });
        if (!res.ok) throw new Error(`Failed to fetch filter options: ${res.status}`);
        return res.json();
      },
      () => mockFilterOptions,
    );
  },

  // 2. GET /api/v1/conversation-intelligence/search/calls
  getSearchResponse: async (
    filters: Record<string, string>,
    sortConfig: { key: string; direction: string } | null,
    tab: 'all' | 'calls' | 'emails'
  ): Promise<SearchResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.set('tab', tab);
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== 'all') queryParams.set(k, v);
    });
    if (sortConfig) {
      queryParams.set('sortBy', sortConfig.key);
      queryParams.set('sortOrder', sortConfig.direction);
    }

    return fetchApiOrMock(
      'getSearchResponse',
      async () => {
        const res = await fetch(
          `${getBackendUrl()}/api/v1/conversation-intelligence/search/calls?${queryParams.toString()}`,
          { headers: bridgeHeaders() },
        );
        if (!res.ok) throw new Error(`Failed to fetch calls search results: ${res.status}`);
        const raw = await res.json();
        return normalizeSearchResponse(raw);
      },
      () => mockSearchResponse,
    );
  },
  
  // 3. GET /api/v1/conversation-intelligence/calls/:callId
  getCallDetail: async (id: string): Promise<CallDetail> => {
    return fetchApiOrMock(
      `getCallDetail:${id}`,
      async () => {
        const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/search/calls/${id}`, {
          headers: bridgeHeaders(),
        });
        if (!res.ok) throw new Error(`Failed to fetch call details: ${res.status}`);
        return res.json();
      },
      () => mockCallDetails[id] || mockCallDetails['call_001'],
    );
  },

  // 4. POST /api/v1/conversation-intelligence/calls/ai-ask
  askAiQuestion: async (callId: string, question: string): Promise<AiAskResponse> => {
    return fetchApiOrMock(
      'askAiQuestion',
      async () => {
        const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/calls/ai-ask`, {
          method: 'POST',
          headers: bridgeHeaders(),
          body: JSON.stringify({ callId, question }),
        });
        if (!res.ok) throw new Error(`Failed to ask AI: ${res.status}`);
        return res.json();
      },
      () => mockAiResponse,
    );
  },

  exportCsv: async (
    filters: Record<string, string>,
    fields: unknown,
  ): Promise<{ success: boolean; jobId: string; message: string }> => {
    return fetchApiOrMock(
      'exportCsv',
      async () => {
        const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/calls/export`, {
          method: 'POST',
          headers: bridgeHeaders(),
          body: JSON.stringify({ filters, fields }),
        });
        if (!res.ok) throw new Error(`Failed to export CSV: ${res.status}`);
        return res.json();
      },
      () => ({
        success: true,
        jobId: 'export_job_mock',
        message: 'Export queued (mock).',
      }),
    );
  },

  createStream: async (
    name: string,
    filters: Record<string, string>,
    notifications: unknown,
    sharing: unknown,
  ): Promise<{ success: boolean; streamId: string; message: string }> => {
    return fetchApiOrMock(
      'createStream',
      async () => {
        const res = await fetch(`${getBackendUrl()}/api/v1/conversation-intelligence/streams`, {
          method: 'POST',
          headers: bridgeHeaders(),
          body: JSON.stringify({ name, filters, notifications, sharing }),
        });
        if (!res.ok) throw new Error(`Failed to create stream: ${res.status}`);
        return res.json();
      },
      () => ({
        success: true,
        streamId: 'stream_mock',
        message: 'Stream created (mock).',
      }),
    );
  },
};
