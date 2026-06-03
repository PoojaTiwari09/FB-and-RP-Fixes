'use client';

import type { RepBoardViewResponse, ActiveBoardForPeriodResponse } from '../source-types';
import { M06_API_BASE, getRepM06Headers } from '../services/m06-api';

const headers = () => getRepM06Headers();

export async function getRepBoardView(boardId: string): Promise<RepBoardViewResponse> {
  const res = await fetch(`${M06_API_BASE}/boards/${boardId}/view`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());

  const raw = await res.json();

  // Map the M06 API response to RepBoardViewResponse shape
  const columns = (raw.columns ?? []).map((c: Record<string, unknown>) => ({
    id: String(c.id),
    label: String(c.label),
    columnType: String(c.type ?? c.columnType ?? 'Metric'),
    submissionMode: String(c.submissionMode ?? 'Auto'),
    sortOrder: Number(c.sortOrder ?? 0),
    isVisible: true,
  }));

  const rows = raw.rows ?? (raw.repRow ? [raw.repRow] : []);
  const row = rows[0] ?? {};

  const cells: Record<string, { value: number | null; submissionId: string | null; lastUpdatedAt: string | null; isAutoSubmit: boolean; note: string | null; managerAnnotation: string | null }> = {};
  const rawCells = (row.cells ?? {}) as Record<string, { value?: number; submissionId?: string; lastUpdatedAt?: string; note?: string; managerAnnotation?: string }>;
  for (const col of columns) {
    const c = rawCells[col.id];
    cells[col.id] = {
      value: c?.value ?? null,
      submissionId: c?.submissionId ?? null,
      lastUpdatedAt: c?.lastUpdatedAt ?? null,
      isAutoSubmit: col.submissionMode === 'Auto',
      note: c?.note ?? null,
      managerAnnotation: c?.managerAnnotation ?? null,
    };
  }

  const deals = (raw.deals ?? []).map((d: Record<string, unknown>, i: number) => ({
    id: String(d.id ?? `deal-${i}`),
    dealName: String(d.dealName ?? d.name ?? 'Deal'),
    accountName: String(d.accountName ?? d.account ?? ''),
    amount: Number(d.amount ?? 0),
    stage: String(d.stage ?? ''),
    closeDate: String(d.closeDate ?? ''),
    isClosedWon: Boolean(d.isClosedWon),
    isClosedLost: Boolean(d.isClosedLost),
    isPastDue: Boolean(d.isPastDue),
    bestCase: d.bestCase != null ? Number(d.bestCase) : null,
    commit: d.commit != null ? Number(d.commit) : null,
    submissionStatus: String(d.submissionStatus ?? 'draft'),
    managerAnnotation: d.managerAnnotation ? String(d.managerAnnotation) : null,
  }));

  const ta = (row.targetAttainment ?? {}) as { quota?: number; closed?: number; attainmentPct?: number };

  return {
    board: {
      id: String(raw.board?.id ?? boardId),
      name: String(raw.board?.name ?? raw.name ?? 'Forecast Board'),
      status: 'active',
      periodType: 'quarterly',
    },
    period: {
      id: String(raw.period?.id ?? ''),
      name: String(raw.period?.name ?? ''),
      startDate: String(raw.period?.startDate ?? ''),
      endDate: String(raw.period?.endDate ?? ''),
      isLocked: Boolean(raw.period?.isLocked),
    },
    columns,
    repRow: {
      repUserId: String(row.repUserId ?? row.userId ?? ''),
      repName: String(row.repName ?? row.name ?? 'Rep'),
      avatarInitials: String(row.avatarInitials ?? ''),
      cells,
      targetAttainment: { quota: ta.quota ?? null, closed: ta.closed ?? 0, attainmentPct: ta.attainmentPct ?? null },
      aiPredictionScore: row.aiPredictionScore ?? null,
      submissionStatus: String(row.submissionStatus ?? 'draft') as 'draft',
    },
    deals,
    rollup: raw.rollup ?? {
      cells: {},
      targetAttainment: { totalQuota: null, totalClosed: 0, attainmentPct: null },
      submittedCount: 0,
      totalCount: 0,
    },
    deadlineBanner: raw.deadlineBanner ?? null,
    aiPredictionSummary: raw.aiPredictionSummary ?? null,
  };
}

export async function submitForecast(
  boardId: string,
  payload: { columnId?: string; repUserId: string; value?: number; note?: string; dealId?: string; status?: string },
) {
  const res = await fetch(`${M06_API_BASE}/boards/${boardId}/submit`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getActiveBoardForPeriod(periodId: string): Promise<ActiveBoardForPeriodResponse> {
  const res = await fetch(`${M06_API_BASE}/boards/by-period/${periodId}`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const board = data.board ?? data[0] ?? data;
  return {
    board: { id: board.id, name: board.name, status: 'active', periodType: 'quarterly' },
    period: data.period ?? { id: periodId, name: periodId, startDate: '', endDate: '', isLocked: false },
  };
}

export async function approveChangeRequest(
  boardId: string,
  payload: { repUserId: string; dealId: string; columnId: string }
) {
  const res = await fetch(`${M06_API_BASE}/boards/${boardId}/approve-change`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
