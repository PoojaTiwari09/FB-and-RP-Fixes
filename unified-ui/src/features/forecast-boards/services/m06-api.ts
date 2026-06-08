import {
  BACKEND_MANAGER_USER_ID,
  BACKEND_REP_USER_ID,
  getClientBackendHeaders,
  type BackendRole,
} from '@shared/lib/backend-api.shared';

/** Demo tenant — must match packages/database/prisma/seed-m06.ts */
export const M06_DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const M06_DEMO_MANAGER_ID = '00000000-0000-0000-0000-000000000002';
export const M06_DEMO_REP_ID = 'me';

/** Same-origin path — proxied by app/api/v1/forecasting/[...path]/route.ts */
export const M06_API_BASE = '/api/v1/forecasting';
export const M06_LEGACY_API_BASE = M06_API_BASE;
export const DEMO_TENANT_ID = M06_DEMO_TENANT_ID;

/** Resolve at call time so client bundles never keep a stale SSR absolute URL. */
export function getM06ApiBase(): string {
  return M06_API_BASE;
}

async function m06Fetch(path: string, init?: RequestInit): Promise<Response> {
  // Same-origin route handler injects tenant headers server-side.
  return fetch(`${M06_API_BASE}${path}`, init);
}

export type ForecastPeriod = {
  periodId: string;
  tenantId: string;
  name: string;
  startDate: string;
  endDate: string;
  revenueTarget: number;
  isLocked: boolean;
};

export type ForecastBoardPayload = {
  periodId: string;
  tenantId: string;
  name: string;
  revenueTarget: number;
  isLocked: boolean;
  aiPrediction: {
    predictedAmount: number;
    confidenceRangeLow: number;
    confidenceRangeHigh: number;
    computedAt: string;
  } | null;
  coverageMetrics: {
    openPipelineValue: number;
    weightedPipelineValue: number;
    coverageRatio: number;
    computedAt: string;
  } | null;
  submissions: Array<{
    submissionId: string;
    userId: string;
    submittedAmount: number;
    bestCaseAmount?: number;
    notes?: string;
    version: number;
    submittedAt: string;
  }>;
};

function m06Headers(role: BackendRole, userId?: string): Record<string, string> {
  const defaultUserId = role === 'sales_manager' ? M06_DEMO_MANAGER_ID : M06_DEMO_REP_ID;
  return {
    'Content-Type': 'application/json',
    'x-tenant-id': M06_DEMO_TENANT_ID,
    'X-Tenant-ID': M06_DEMO_TENANT_ID,
    'x-org-id': M06_DEMO_TENANT_ID,
    'x-user-id': userId ?? defaultUserId,
    'x-user-role': role === 'sales_manager' ? 'manager' : 'sales_rep',
  };
}

export function getRepM06Headers(userId = BACKEND_REP_USER_ID) {
  return m06Headers('sales_rep', userId);
}

export function getManagerM06Headers(userId = BACKEND_MANAGER_USER_ID) {
  return m06Headers('sales_manager', userId);
}

/** Client components — reads role cookie when role not passed explicitly. */
export function getM06HeadersForClient(role?: BackendRole, userId?: string) {
  if (role) return m06Headers(role, userId);
  const base = getClientBackendHeaders();
  const isManager = base['x-user-id'] === BACKEND_MANAGER_USER_ID;
  return m06Headers(isManager ? 'sales_manager' : 'sales_rep', base['x-user-id']);
}

export async function fetchPeriods(
  tenantId: string = DEMO_TENANT_ID,
  headers: Record<string, string> = getRepM06Headers(),
): Promise<ForecastPeriod[]> {
  const res = await m06Fetch('/periods', {
    headers: { ...headers, 'X-Tenant-ID': tenantId },
    cache: 'no-store',
  });
  if (res.status === 404) {
    throw new Error(
      'Forecasting API not available. Ensure unified-api is running on port 3001 with M06 module loaded.',
    );
  }
  if (!res.ok) throw new Error(`Failed to load forecast periods (${res.status})`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  const wrapped = (data as { periods?: ForecastPeriod[]; data?: ForecastPeriod[] }).periods
    ?? (data as { data?: ForecastPeriod[] }).data;
  return Array.isArray(wrapped) ? wrapped : [];
}

export async function fetchForecastBoard(
  tenantId: string,
  periodId: string,
  userId: string,
  role: BackendRole = 'sales_rep',
): Promise<ForecastBoardPayload> {
  const headers = m06Headers(role, userId);

  const boardsRes = await m06Fetch(`/boards/by-period/${periodId}`, {
    headers,
    cache: 'no-store',
  });
  if (!boardsRes.ok) throw new Error('Failed to load boards');
  const boardsPayload = await boardsRes.json();
  const board = boardsPayload.board ?? boardsPayload[0];
  if (!board) throw new Error('No boards found for period');

  const boardId = board.id;
  const viewRes = await m06Fetch(`/boards/${boardId}/view`, {
    headers,
    cache: 'no-store',
  });
  if (!viewRes.ok) throw new Error('Failed to load board view');
  const viewData = await viewRes.json();

  const isManager = role === 'sales_manager';
  const row =
    viewData.rows?.find((r: { repUserId?: string; userId?: string }) =>
      [r.repUserId, r.userId].includes(userId),
    ) ||
    viewData.repRow ||
    viewData.rows?.[0];
  const pipelineColumn = viewData.columns?.find((c: { label?: string }) =>
    c.label?.toLowerCase().includes('pipeline'),
  );
  const targetColumn = viewData.columns?.find((c: { label?: string }) =>
    c.label?.toLowerCase().includes('target'),
  );
  const target = isManager
    ? viewData.rollup?.targetAttainment?.totalQuota
    : (row?.targetAttainment?.quota ?? row?.cells?.[targetColumn?.id]?.value);
  const pipeline = isManager
    ? viewData.rollup?.cells?.[pipelineColumn?.id]
    : row?.cells?.[pipelineColumn?.id]?.value;

  const sourceRows = viewData.rows || (viewData.repRow ? [viewData.repRow] : []);
  const commitColumn = viewData.columns?.find((c: { label?: string }) =>
    c.label?.toLowerCase().includes('commit'),
  );
  const bestCaseColumn = viewData.columns?.find((c: { label?: string }) =>
    c.label?.toLowerCase().includes('best'),
  );
  const submissions = sourceRows
    .map((r: Record<string, unknown>) => {
      const cells = r.cells as Record<string, { value?: number; submissionId?: string }> | undefined;
      const metrics = r.metrics as { commit?: number; bestCase?: number } | undefined;
      const commit = cells?.[commitColumn?.id]?.value ?? metrics?.commit;
      if (commit == null) return null;
      return {
        submissionId:
          cells?.[commitColumn?.id]?.submissionId ||
          `sub-${String(r.repUserId || r.userId)}`,
        userId: String(r.repUserId || r.userId || r.name),
        submittedAmount: commit,
        bestCaseAmount: cells?.[bestCaseColumn?.id]?.value ?? metrics?.bestCase,
        notes: String(r.submissionStatus || ''),
        version: 1,
        submittedAt: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  const periodMeta = boardsPayload.period;
  return {
    periodId,
    tenantId,
    name: viewData.board?.name || viewData.name || board.name || 'Forecast Board',
    revenueTarget: target ?? periodMeta?.revenueTarget ?? 0,
    isLocked: Boolean(periodMeta?.isLocked),
    aiPrediction: null,
    coverageMetrics: {
      openPipelineValue: pipeline || 0,
      weightedPipelineValue: (pipeline || 0) * 0.5,
      coverageRatio: (pipeline || 0) / (target || 1),
      computedAt: new Date().toISOString(),
    },
    submissions: submissions as ForecastBoardPayload['submissions'],
  };
}

export async function submitForecast(
  tenantId: string,
  periodId: string,
  userId: string,
  body: {
    submittedAmount: number;
    bestCaseAmount?: number;
    notes?: string;
    committedDealIds: string[];
  },
) {
  const headers = {
    ...getRepM06Headers(userId),
    'Content-Type': 'application/json',
  };

  const boardsRes = await m06Fetch(`/boards/by-period/${periodId}`, { headers, cache: 'no-store' });
  if (!boardsRes.ok) throw new Error('Failed to load boards');
  const boardsPayload = await boardsRes.json();
  const board = boardsPayload.board ?? boardsPayload[0];
  if (!board) throw new Error('No boards found for period');

  const boardId = board.id;
  const columnId =
    board.columns?.find((c: { label: string }) => c.label.toLowerCase().includes('commit'))?.id ||
    'col-commit';

  const res = await m06Fetch(`/boards/${boardId}/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      columnId,
      repUserId: userId,
      value: body.submittedAmount,
      note: body.notes,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Submit failed');
  }
  return res.json();
}

export async function fetchRepPeriodBoard(periodId: string, repUserId = BACKEND_REP_USER_ID) {
  const headers = getRepM06Headers(repUserId);
  const res = await m06Fetch(
    `/periods/${periodId}/board?repUserId=${encodeURIComponent(repUserId)}`,
    { headers, cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Failed to load period board');
  return res.json();
}

export function resolveM06PeriodId(
  periodId: string,
  periods: ForecastPeriod[],
): string {
  if (periodId !== 'current') return periodId;
  return periods.find((p) => !p.isLocked)?.periodId ?? periods[0]?.periodId ?? periodId;
}

export async function fetchTeamBoard(
  periodId: string,
  baseline?: string,
  headers = getManagerM06Headers(),
) {
  const buildPath = (route: 'team/board' | 'team-forecast', pid: string) => {
    const params = new URLSearchParams({ periodId: pid || 'current' });
    if (baseline) params.set('baseline', baseline);
    return `/${route}?${params}`;
  };

  const tryFetch = async (pid: string) => {
    let res = await m06Fetch(buildPath('team/board', pid), { headers, cache: 'no-store' });
    if (res.status === 404) {
      const body = await res.clone().json().catch(() => ({}));
      const msg = String((body as { message?: string }).message ?? '');
      if (msg.includes('Cannot GET')) {
        res = await m06Fetch(buildPath('team-forecast', pid), { headers, cache: 'no-store' });
      }
    }
    return res;
  };

  let res = await tryFetch(periodId && periodId !== 'current' ? periodId : 'current');
  if (res.status === 404 && periodId && periodId !== 'current') {
    res = await tryFetch('current');
  }

  if (res.status === 404) {
    const body = await res.json().catch(() => ({}));
    const msg = String((body as { message?: string }).message ?? '');
    if (msg.includes('Cannot GET')) {
      throw new Error(
        'Forecasting API route missing. Restart the demo (unified-api must include M06 module).',
      );
    }
    throw new Error(
      'No forecast period data in database. From monorepo root run: .\\seed-m06.ps1 (or .\\start-demo.ps1)',
    );
  }
  if (!res.ok) throw new Error(`Failed to load team board (${res.status})`);
  return res.json();
}

export async function fetchAtRiskDeals(headers = getManagerM06Headers()) {
  const res = await m06Fetch('/team/at-risk-deals', { headers, cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load at-risk deals');
  return res.json();
}

export async function fetchAiPrediction(
  periodId: string,
  repUserId?: string,
  baseline?: string,
  headers = getRepM06Headers(repUserId),
) {
  const params = new URLSearchParams();
  if (baseline) params.set('baseline', baseline);
  if (repUserId) params.set('repUserId', repUserId);
  const qs = params.toString();
  const res = await m06Fetch(
    `/periods/${periodId}/ai-prediction${qs ? `?${qs}` : ''}`,
    { headers, cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Failed to load AI prediction');
  return res.json();
}
