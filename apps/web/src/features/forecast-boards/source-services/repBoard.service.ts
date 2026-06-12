'use client';

import type { RepBoardViewResponse, BoardColumn, ActiveBoardForPeriodResponse } from '../source-types';
import { M06_API_BASE, getRepM06Headers } from '../services/m06-api';

const headers = (userId?: string) => {
  const rawId = userId || getRepM06Headers()['x-user-id'] || 'me';
  const resolvedId = (rawId === 'me' || rawId === '00000000-0000-0000-0000-000000000003') ? 'sarah' : rawId;
  return getRepM06Headers(resolvedId);
};

export async function getRepBoardView(boardId: string): Promise<RepBoardViewResponse> {
  const repUserId = headers()['x-user-id'] || 'sarah';
  const periodId = boardId === '00000000-0000-0000-0000-0000000000a1' ? '00000000-0000-0000-0000-0000000000b1' : boardId === '00000000-0000-0000-0000-0000000000a2' ? '00000000-0000-0000-0000-0000000000b2' : boardId;

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

  // 3b. Fetch closed deals
  const closedRes = await fetch(`/api/forecast/closed-deals/${repUserId}?period_id=${periodId}`, { headers: headers(), cache: 'no-store' });
  let closedWonTotal = summary.closed_won_total;
  if (closedRes.ok) {
    const closedEnvelope = await closedRes.json();
    if (closedEnvelope.data && closedEnvelope.data.total_closed_value != null) {
      closedWonTotal = closedEnvelope.data.total_closed_value;
    }
  }

  // 3c. Fetch pipeline
  const pipelineRes = await fetch(`/api/forecast/pipeline/${repUserId}?period_id=${periodId}`, { headers: headers(), cache: 'no-store' });
  let pipelineTotal = summary.pipeline_total;
  if (pipelineRes.ok) {
    const pipelineEnvelope = await pipelineRes.json();
    if (pipelineEnvelope.data && pipelineEnvelope.data.total_pipeline_value != null) {
      pipelineTotal = pipelineEnvelope.data.total_pipeline_value;
    }
  }

  // 3d. Fetch AI Prediction Score
  const aiRes = await fetch(`/api/forecast/ai-predictor/scores/${repUserId}`, { headers: headers(), cache: 'no-store' });
  let aiScore = 70;
  if (aiRes.ok) {
    const aiEnvelope = await aiRes.json();
    if (aiEnvelope.data && aiEnvelope.data.ai_prediction_score != null) {
      aiScore = aiEnvelope.data.ai_prediction_score;
    }
  }

  // 4. Fetch targets for period to get rep's target
  const targetsRes = await fetch(`/api/forecast/targets/${periodId}`, { headers: headers(), cache: 'no-store' });
  let quotaVal = 5000000; // default seed fallback
  let repName = repUserId === 'sarah' ? 'Sarah Chen' : 'Alex Morgan';
  if (targetsRes.ok) {
    const targetsEnvelope = await targetsRes.json();
    const targets = targetsEnvelope.data || [];
    const repTarget = targets.find((t: any) => t.rep_id === repUserId);
    if (repTarget) {
      quotaVal = repTarget.target_value;
      if (repTarget.rep_name) repName = repTarget.rep_name;
    }
  }
  const avatarInitials = repName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

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
    bestCase: (d.best_case_state === 'approved' || d.best_case_state === 'overridden') ? Number(d.approved_best_case ?? 0) : (d.best_case_value != null ? Number(d.best_case_value) : null),
    commit: (d.commit_state === 'approved' || d.commit_state === 'overridden') ? Number(d.approved_commit ?? 0) : (d.commit_value != null ? Number(d.commit_value) : null),
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

  const totalLockedCommit = deals.reduce((acc: number, d: any) => acc + (d.commit ?? 0), 0);

  const cells = {
    'col-pipeline': {
      value: pipelineTotal,
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
      value: closedWonTotal,
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
      name: boardId === '00000000-0000-0000-0000-0000000000a1' ? 'Q1 FY26 Forecast Board' : 'Q2 FY26 Forecast Board',
      status: 'active',
      periodType: 'quarterly',
    },
    period: {
      id: currentPeriod.id,
      name: currentPeriod.name,
      startDate: currentPeriod.start_date,
      endDate: currentPeriod.end_date,
      submissionDeadline: currentPeriod.submission_deadline,
      isLocked: false,
    },
    columns,
    repRow: {
      repUserId,
      repName,
      avatarInitials,
      cells,
      targetAttainment: {
        quota: quotaVal,
        closed: closedWonTotal,
        attainmentPct: quotaVal > 0 ? Math.round(((closedWonTotal + totalLockedCommit) / quotaVal) * 100) : 0,
      },
      aiPredictionScore: aiScore,
      submissionStatus: overallStatus as any,
    },
    deals,
    rollup: {
      cells: {
        'col-pipeline': pipelineTotal,
        'col-best-case': summary.best_case_total,
        'col-commit': summary.commit_total,
        'col-closed': closedWonTotal,
      },
      targetAttainment: {
        totalQuota: quotaVal,
        totalClosed: closedWonTotal,
        attainmentPct: quotaVal > 0 ? Math.round(((closedWonTotal + totalLockedCommit) / quotaVal) * 100) : 0,
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
  const periodId = boardId === '00000000-0000-0000-0000-0000000000a1' ? '00000000-0000-0000-0000-0000000000b1' : boardId === '00000000-0000-0000-0000-0000000000a2' ? '00000000-0000-0000-0000-0000000000b2' : boardId;
  const field = payload.columnId === 'col-best-case' ? 'best_case' : 'commit';
  const customHeaders = headers(payload.repUserId);

  let subId = payload.dealId;
  if (payload.value !== undefined && payload.dealId) {
    const saveRes = await fetch(`/api/forecast/submissions`, {
      method: 'POST',
      headers: { ...customHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...customHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...customHeaders, 'Content-Type': 'application/json' },
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
  const boardId = periodId === '00000000-0000-0000-0000-0000000000b1' ? '00000000-0000-0000-0000-0000000000a1' : '00000000-0000-0000-0000-0000000000a2';
  return {
    board: { id: boardId, name: periodId === '00000000-0000-0000-0000-0000000000b1' ? 'Q1 FY26 Forecast Board' : 'Q2 FY26 Forecast Board', status: 'active', periodType: 'quarterly' },
    period: { id: periodId, name: periodId === '00000000-0000-0000-0000-0000000000b1' ? 'Q1 FY26' : 'Q2 FY26', startDate: '', endDate: '', isLocked: false },
  };
}

export async function approveChangeRequest(
  boardId: string,
  payload: { repUserId: string; dealId: string; columnId: string }
) {
  // Fallback stub
  return { success: true };
}
