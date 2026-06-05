'use client';

import type { RepBoardViewResponse, BoardColumn, ActiveBoardForPeriodResponse } from '../source-types';
import { M06_API_BASE, getRepM06Headers } from '../services/m06-api';

const headers = () => getRepM06Headers();

export async function getRepBoardView(boardId: string): Promise<RepBoardViewResponse> {
  const repUserId = headers()['x-user-id'] || 'me';
  const periodId = boardId === 'board-q1' ? 'q1-fy26-demo' : boardId === 'board-q2' ? 'q2-fy26-demo' : boardId;

  // 1. Fetch periods to find active period info
  const periodsRes = await fetch(`/api/forecast/periods`, { headers: headers(), cache: 'no-store' });
  if (!periodsRes.ok) throw new Error('Failed to fetch periods');
  const periodsEnvelope = await periodsRes.json();
  const periods = periodsEnvelope.data || [];
  const currentPeriod = periods.find((p: any) => p.id === periodId) || periods[0] || {
    id: periodId,
    name: 'Q2 FY26',
    start_date: '2026-04-01',
    end_date: '2026-06-30',
    submission_deadline: '2026-06-30'
  };

  // 2. Fetch rep's drilldown (deals list)
  const drilldownRes = await fetch(`/api/forecast/drill-down/${repUserId}?period_id=${periodId}`, { headers: headers(), cache: 'no-store' });
  if (!drilldownRes.ok) throw new Error('Failed to fetch drill-down');
  const drilldownEnvelope = await drilldownRes.json();
  const drilldownDeals = drilldownEnvelope.data || [];

  // 3. Fetch summary / rollup details
  const summaryRes = await fetch(`/api/forecast/drill-down/${repUserId}/summary?period_id=${periodId}`, { headers: headers(), cache: 'no-store' });
  if (!summaryRes.ok) throw new Error('Failed to fetch summary');
  const summaryEnvelope = await summaryRes.json();
  const summary = summaryEnvelope.data || { pipeline_total: 0, best_case_total: 0, commit_total: 0, closed_won_total: 0 };

  // 4. Fetch targets for period to get rep's target
  const targetsRes = await fetch(`/api/forecast/targets/${periodId}`, { headers: headers(), cache: 'no-store' });
  let quotaVal = 5000000; // default seed fallback
  if (targetsRes.ok) {
    const targetsEnvelope = await targetsRes.json();
    const targets = targetsEnvelope.data || [];
    const repTarget = targets.find((t: any) => t.rep_id === repUserId);
    if (repTarget) quotaVal = repTarget.target_value;
  }

  // 5. Construct RepBoardViewResponse
  const deals = drilldownDeals.map((d: any) => ({
    id: String(d.deal_id),
    dealName: String(d.deal_name),
    accountName: String(d.account_name ?? 'Account'),
    amount: Number(d.amount ?? 0),
    stage: String(d.stage ?? ''),
    closeDate: String(d.close_date ?? ''),
    isClosedWon: Boolean(d.is_closed_won),
    isClosedLost: Boolean(d.is_closed_lost),
    isPastDue: Boolean(d.is_past_due),
    bestCase: d.best_case_value != null ? Number(d.best_case_value) : 0,
    commit: d.commit_value != null ? Number(d.commit_value) : 0,
    submissionStatus: String(d.commit_state ?? 'draft'),
    bestCaseState: d.best_case_state ?? 'editable',
    commitState: d.commit_state ?? 'editable',
    managerAnnotation: d.manager_annotation ? String(d.manager_annotation) : null,
    requestedBestCase: d.requested_best_case != null ? Number(d.requested_best_case) : null,
    requestedCommit: d.requested_commit != null ? Number(d.requested_commit) : null,
    requestedBestCaseNote: d.requested_best_case_note ? String(d.requested_best_case_note) : null,
    requestedCommitNote: d.requested_commit_note ? String(d.requested_commit_note) : null,
  }));

  // Find rep's overall submission status
  const hasSubmitted = deals.some((d: any) => d.bestCaseState === 'submitted' || d.commitState === 'submitted');
  const hasApproved = deals.every((d: any) => d.bestCaseState === 'approved' || d.commitState === 'approved');
  const overallStatus = hasApproved ? 'approved' : hasSubmitted ? 'submitted' : 'draft';

  const cells = {
    'col-pipeline': {
      value: summary.pipeline_total,
      submissionId: null,
      lastUpdatedAt: null,
      isAutoSubmit: true,
      note: null,
      managerAnnotation: null,
    },
    'col-best-case': {
      value: summary.best_case_total,
      submissionId: null,
      lastUpdatedAt: null,
      isAutoSubmit: false,
      note: null,
      managerAnnotation: null,
    },
    'col-commit': {
      value: summary.commit_total,
      submissionId: null,
      lastUpdatedAt: null,
      isAutoSubmit: false,
      note: null,
      managerAnnotation: null,
    },
    'col-closed': {
      value: summary.closed_won_total,
      submissionId: null,
      lastUpdatedAt: null,
      isAutoSubmit: true,
      note: null,
      managerAnnotation: null,
    }
  };

  const columns: BoardColumn[] = [
    { id: 'col-pipeline', label: 'Pipeline', columnType: 'Metric', submissionMode: 'Auto', sortOrder: 1, isVisible: true },
    { id: 'col-best-case', label: 'Best Case', columnType: 'Submission', submissionMode: 'Manual', sortOrder: 2, isVisible: true },
    { id: 'col-commit', label: 'Commit', columnType: 'Submission', submissionMode: 'Manual', sortOrder: 3, isVisible: true },
    { id: 'col-closed', label: 'Closed Won', columnType: 'Metric', submissionMode: 'Auto', sortOrder: 4, isVisible: true },
  ];

  // Calculate days left for deadline banner
  const deadlineStr = currentPeriod.submission_deadline || currentPeriod.end_date;
  const daysLeft = Math.ceil((new Date(deadlineStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return {
    board: {
      id: boardId,
      name: boardId === 'board-q1' ? 'Q1 FY26 Forecast Board' : 'Q2 FY26 Forecast Board',
      status: 'active',
      periodType: 'quarterly',
    },
    period: {
      id: currentPeriod.id,
      name: currentPeriod.name,
      startDate: currentPeriod.start_date,
      endDate: currentPeriod.end_date,
      isLocked: false,
    },
    columns,
    repRow: {
      repUserId,
      repName: 'Alex Chen',
      avatarInitials: 'AC',
      cells,
      targetAttainment: {
        quota: quotaVal,
        closed: summary.closed_won_total,
        attainmentPct: quotaVal > 0 ? Math.round(((summary.closed_won_total + summary.commit_total) / quotaVal) * 100) : 0,
      },
      aiPredictionScore: 95,
      submissionStatus: overallStatus as any,
    },
    deals,
    rollup: {
      cells: {
        'col-pipeline': summary.pipeline_total,
        'col-best-case': summary.best_case_total,
        'col-commit': summary.commit_total,
        'col-closed': summary.closed_won_total,
      },
      targetAttainment: {
        totalQuota: quotaVal,
        totalClosed: summary.closed_won_total,
        attainmentPct: quotaVal > 0 ? Math.round(((summary.closed_won_total + summary.commit_total) / quotaVal) * 100) : 0,
      },
      submittedCount: deals.filter((d: any) => d.commitState === 'submitted' || d.bestCaseState === 'submitted').length,
      totalCount: deals.length,
    },
    deadlineBanner: {
      isDue: daysLeft <= 0,
      message: `${daysLeft} days left to submit your forecast`,
    },
    aiPredictionSummary: null,
  };
}

export async function submitForecast(
  boardId: string,
  payload: { columnId?: string; repUserId: string; value?: number; note?: string; dealId?: string; status?: string },
) {
  const periodId = boardId === 'board-q1' ? 'q1-fy26-demo' : boardId === 'board-q2' ? 'q2-fy26-demo' : boardId;
  const field = payload.columnId === 'col-best-case' ? 'best_case' : 'commit';

  let subId = payload.dealId;
  if (payload.value !== undefined && payload.dealId) {
    const saveRes = await fetch(`/api/forecast/submissions`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rep_id: payload.repUserId,
        deal_id: payload.dealId,
        period_id: periodId,
        field,
        value: payload.value,
      }),
    });
    if (!saveRes.ok) throw new Error(await saveRes.text());
    const saveEnvelope = await saveRes.json();
    if (saveEnvelope.success && saveEnvelope.data) {
      subId = saveEnvelope.data.id;
    }
  }

  if (payload.status === 'submitted' && subId) {
    const submitRes = await fetch(`/api/forecast/submissions/${subId}/submit`, {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rep_id: payload.repUserId,
        field: payload.columnId === 'col-best-case' ? 'best_case' : payload.columnId === 'col-commit' ? 'commit' : 'both',
      }),
    });
    if (!submitRes.ok) throw new Error(await submitRes.text());
    return submitRes.json();
  }

  if (payload.status === 'overridden' && subId) {
    const overrideRes = await fetch(`/api/forecast/submissions/${subId}/override`, {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        manager_id: '00000000-0000-0000-0000-000000000002', // Central manager ID for demo
        field: payload.columnId === 'col-best-case' ? 'best_case' : payload.columnId === 'col-commit' ? 'commit' : 'both',
        override_value: payload.value,
      }),
    });
    if (!overrideRes.ok) throw new Error(await overrideRes.text());
    return overrideRes.json();
  }

  return { success: true };
}

export async function getActiveBoardForPeriod(periodId: string): Promise<ActiveBoardForPeriodResponse> {
  const boardId = periodId === 'q1-fy26-demo' ? 'board-q1' : 'board-q2';
  return {
    board: { id: boardId, name: periodId === 'q1-fy26-demo' ? 'Q1 FY26 Forecast Board' : 'Q2 FY26 Forecast Board', status: 'active', periodType: 'quarterly' },
    period: { id: periodId, name: periodId === 'q1-fy26-demo' ? 'Q1 FY26' : 'Q2 FY26', startDate: '', endDate: '', isLocked: false },
  };
}

export async function approveChangeRequest(
  boardId: string,
  payload: { repUserId: string; dealId: string; columnId: string }
) {
  // Fallback stub
  return { success: true };
}
