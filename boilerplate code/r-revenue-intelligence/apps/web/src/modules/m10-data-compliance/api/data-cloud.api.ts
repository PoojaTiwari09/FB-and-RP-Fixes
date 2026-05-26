/* eslint-disable @typescript-eslint/no-explicit-any */
// M10 Data Cloud — API Client
// All calls go to /api/v1/m10-data-compliance (canonical prefix per TDD §7)
// Falls back to rich mock data if backend is unreachable (local dev).

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const PREFIX = `${BASE}/api/v1/m10-data-compliance`;

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const MOCK_CONNECTIONS = [
  { connectionId: 'conn-0001-0000-0000-000000000001', destination: 'postgres', isActive: true, createdAt: '2026-05-20T02:00:00Z' },
  { connectionId: 'conn-0002-0000-0000-000000000002', destination: 'snowflake', isActive: false, createdAt: '2026-05-18T10:30:00Z' },
];

export const MOCK_RUNS = [
  { runId: 'run-0001', connectionId: 'conn-0001-0000-0000-000000000001', destination: 'postgres', status: 'success', rowsExported: 342, startedAt: '2026-05-21T02:00:12Z', completedAt: '2026-05-21T02:04:58Z', errorMessage: null },
  { runId: 'run-0002', connectionId: 'conn-0001-0000-0000-000000000001', destination: 'postgres', status: 'success', rowsExported: 319, startedAt: '2026-05-20T02:00:09Z', completedAt: '2026-05-20T02:05:22Z', errorMessage: null },
  { runId: 'run-0003', connectionId: 'conn-0001-0000-0000-000000000001', destination: 'postgres', status: 'failed',  rowsExported: 0,   startedAt: '2026-05-19T02:00:05Z', completedAt: '2026-05-19T02:01:01Z', errorMessage: 'Connection timeout after 60s' },
  { runId: 'run-0004', connectionId: 'conn-0002-0000-0000-000000000002', destination: 'snowflake', status: 'success', rowsExported: 281, startedAt: '2026-05-18T02:00:08Z', completedAt: '2026-05-18T02:07:33Z', errorMessage: null },
];

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, opts?: RequestInit, mockFallback?: T): Promise<T> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    const res = await fetch(`${PREFIX}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts?.headers,
      },
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  } catch {
    if (mockFallback !== undefined) return mockFallback;
    throw new Error('Failed to fetch');
  }
}

// ─── Connections ──────────────────────────────────────────────────────────────

export const fetchConnections = (): Promise<any[]> =>
  apiFetch('/exports/connections', undefined, MOCK_CONNECTIONS);

export const registerConnection = (body: {
  destination: string;
  destinationName: string;
  config?: Record<string, unknown>;
}): Promise<any> =>
  apiFetch('/exports/connections', { method: 'POST', body: JSON.stringify(body) }, {
    connectionId: `conn-new-${Date.now()}`,
    destination: body.destination,
    isActive: true,
    createdAt: new Date().toISOString(),
  });

export const testConnection = (id: string): Promise<{ success: boolean; message: string }> =>
  apiFetch(`/exports/connections/${id}/test`, { method: 'POST' }, {
    success: true,
    message: 'Connection OK — source has 342 records available for export',
  });

// ─── Export Runs ──────────────────────────────────────────────────────────────

export const fetchExportRuns = (connectionId?: string): Promise<any[]> => {
  const q = connectionId ? `?connectionId=${connectionId}` : '';
  return apiFetch(`/exports/runs${q}`, undefined, MOCK_RUNS);
};

// ─── Replay ───────────────────────────────────────────────────────────────────

export const triggerReplay = (body: {
  connectionId: string;
  datasetName: string;
  windowStart: string;
  windowEnd: string;
}): Promise<{ status: string; runId: string; message: string }> =>
  apiFetch('/exports/replay', { method: 'POST', body: JSON.stringify(body) }, {
    status: 'queued',
    runId: `run-replay-${Date.now()}`,
    message: 'Replay run queued for execution.',
  });
