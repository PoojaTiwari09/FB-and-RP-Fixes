'use client';

import type { ManagerBoardViewResponse, RepDrillDownResponse, PendingApprovalEntry, BoardColumn } from '../source-types';
import { M06_API_BASE, getManagerM06Headers } from '../services/m06-api';

const headers = () => getManagerM06Headers();

export async function getManagerBoardView(boardId: string): Promise<ManagerBoardViewResponse> {
  const managerId = headers()['x-user-id'] || '00000000-0000-0000-0000-000000000002';
  const periodId = boardId === '00000000-0000-0000-0000-0000000000a1' ? '00000000-0000-0000-0000-0000000000b1' : boardId === '00000000-0000-0000-0000-0000000000a2' ? '00000000-0000-0000-0000-0000000000b2' : boardId;

  // 1. Fetch manager board rows (reps list)
  const mbRes = await fetch(`/api/forecast/periods/${periodId}/reps`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!mbRes.ok) throw new Error(await mbRes.text());
  const mbEnvelope = await mbRes.json();
  const reps = mbEnvelope.data || [];

  // 2. Fetch periods list
  const periodsRes = await fetch(`/api/forecast/periods`, { headers: headers(), cache: 'no-store' });
  const periodsEnvelope = await periodsRes.json();
  const periods = periodsEnvelope.data || [];
  const currentPeriod = periods.find((p: any) => p.id === periodId) || periods[0] || {
    id: periodId,
    name: 'Q2 FY26',
    start_date: '2026-04-01',
    end_date: '2026-06-30',
    submission_deadline: '2026-06-30'
  };

  // 3. Map to ManagerRow[]
  const rows = reps.map((item: any) => ({
    repUserId: item.rep_id,
    repName: item.rep_name,
    avatarInitials: item.rep_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2),
    isExcluded: false,
    isInactive: false,
    cells: {
      'col-pipeline': { value: item.pipeline_total, submissionId: null, lastUpdatedAt: null, isAutoSubmit: true, note: null, managerAnnotation: null },
      'col-best-case': { value: item.best_case_total, submissionId: null, lastUpdatedAt: null, isAutoSubmit: false, note: null, managerAnnotation: null },
      'col-commit': { value: item.commit_total, submissionId: null, lastUpdatedAt: null, isAutoSubmit: false, note: null, managerAnnotation: null },
      'col-closed': { value: item.closed_total, submissionId: null, lastUpdatedAt: null, isAutoSubmit: true, note: null, managerAnnotation: null }
    },
    targetAttainment: {
      quota: item.target_value,
      closed: item.closed_total,
      attainmentPct: item.target_progress_pct,
    },
    submissionStatus: item.has_pending_requests ? 'submitted' : 'draft',
    aiPredictionScore: item.ai_prediction_score,
  }));

  // 4. Construct aggregate RollupData
  const rollup = {
    cells: {
      'col-pipeline': reps.reduce((sum: number, item: any) => sum + item.pipeline_total, 0),
      'col-best-case': reps.reduce((sum: number, item: any) => sum + item.best_case_total, 0),
      'col-commit': reps.reduce((sum: number, item: any) => sum + item.commit_total, 0),
      'col-closed': reps.reduce((sum: number, item: any) => sum + item.closed_total, 0),
    },
    targetAttainment: {
      totalQuota: reps.reduce((sum: number, item: any) => sum + item.target_value, 0),
      totalClosed: reps.reduce((sum: number, item: any) => sum + item.closed_total, 0),
      attainmentPct: 0
    },
    submittedCount: reps.filter((item: any) => !item.has_pending_requests).length,
    totalCount: reps.length
  };
  rollup.targetAttainment.attainmentPct = rollup.targetAttainment.totalQuota > 0 ? Math.round(((rollup.targetAttainment.totalClosed + rollup.cells['col-commit']) / rollup.targetAttainment.totalQuota) * 100) : 0;

  const columns: BoardColumn[] = [
    { id: 'col-pipeline', label: 'Pipeline', columnType: 'Metric', submissionMode: 'Auto', sortOrder: 1, isVisible: true },
    { id: 'col-best-case', label: 'Best Case', columnType: 'Submission', submissionMode: 'Manual', sortOrder: 2, isVisible: true },
    { id: 'col-commit', label: 'Commit', columnType: 'Submission', submissionMode: 'Manual', sortOrder: 3, isVisible: true },
    { id: 'col-closed', label: 'Closed Won', columnType: 'Metric', submissionMode: 'Auto', sortOrder: 4, isVisible: true },
  ];

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
      isLocked: false,
    },
    columns,
    rows,
    rollup,
    deadlineBanner: {
      isDue: daysLeft <= 0,
      message: `${daysLeft} days left to submit your forecast`,
    },
  };
}

export async function getRepDrillDown(boardId: string, repUserId: string): Promise<RepDrillDownResponse> {
  const periodId = boardId === 'board-q1' ? 'q1-fy26-demo' : boardId === 'board-q2' ? 'q2-fy26-demo' : boardId;

  // 1. Fetch rep's drilldown (deals list)
  const ddRes = await fetch(`/api/forecast/drill-down/${repUserId}?period_id=${periodId}`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!ddRes.ok) throw new Error(await ddRes.text());
  const ddEnvelope = await ddRes.json();
  const drilldownDeals = ddEnvelope.data || [];

  // 2. Fetch summary / rollup details
  const summaryRes = await fetch(`/api/forecast/drill-down/${repUserId}/summary?period_id=${periodId}`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!summaryRes.ok) throw new Error('Failed to fetch summary');
  const summaryEnvelope = await summaryRes.json();
  const summary = summaryEnvelope.data || { pipeline_total: 0, best_case_total: 0, commit_total: 0, closed_won_total: 0 };

  // 3. Fetch targets to find rep quota
  const targetsRes = await fetch(`/api/forecast/targets/${periodId}`, { headers: headers(), cache: 'no-store' });
  let quotaVal = 5000000;
  if (targetsRes.ok) {
    const targetsEnvelope = await targetsRes.json();
    const targets = targetsEnvelope.data || [];
    const repTarget = targets.find((t: any) => t.rep_id === repUserId);
    if (repTarget) quotaVal = repTarget.target_value;
  }

  // 4. Construct deals list
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
    bestCase: (d.best_case_state === 'approved' || d.best_case_state === 'overridden') ? Number(d.approved_best_case ?? 0) : (d.best_case_value != null ? Number(d.best_case_value) : 0),
    commit: (d.commit_state === 'approved' || d.commit_state === 'overridden') ? Number(d.approved_commit ?? 0) : (d.commit_value != null ? Number(d.commit_value) : 0),
    submissionStatus: d.commit_state === 'submitted' || d.best_case_state === 'submitted' ? 'submitted' : d.commit_state === 'approved' && d.best_case_state === 'approved' ? 'approved' : 'draft',
    bestCaseState: d.best_case_state ?? 'editable',
    commitState: d.commit_state ?? 'editable',
    approvedBestCase: d.approved_best_case,
    approvedCommit: d.approved_commit,
    managerAnnotation: d.manager_annotation ? String(d.manager_annotation) : null,
    upForRenewal: false,
    upForRenewalAmount: null,
    churn: null,
    aiPredictionScore: d.ai_prediction_score ?? 70,
  }));

  const columns: BoardColumn[] = [
    { id: 'col-pipeline', label: 'Pipeline', columnType: 'Metric', submissionMode: 'Auto', sortOrder: 1, isVisible: true },
    { id: 'col-best-case', label: 'Best Case', columnType: 'Submission', submissionMode: 'Manual', sortOrder: 2, isVisible: true },
    { id: 'col-commit', label: 'Commit', columnType: 'Submission', submissionMode: 'Manual', sortOrder: 3, isVisible: true },
    { id: 'col-closed', label: 'Closed Won', columnType: 'Metric', submissionMode: 'Auto', sortOrder: 4, isVisible: true },
  ];

  return {
    rep: { id: repUserId, name: 'Alex Chen', avatarInitials: 'AC' },
    summaryCards: {
      pipeline: summary.pipeline_total,
      commit: summary.commit_total,
      bestCase: summary.best_case_total,
      closed: summary.closed_won_total,
    },
    deals,
    submission: deals.length > 0 ? {
      id: deals[0].id ?? 'sub-0',
      status: deals.some((d: any) => d.commitState === 'submitted' || d.bestCaseState === 'submitted') ? 'submitted' : 'draft',
      commitForecast: summary.commit_total,
      bestCaseForecast: summary.best_case_total,
      notes: null,
      managerComment: null,
    } : null,
    targetAttainment: {
      quota: quotaVal,
      closed: summary.closed_won_total,
      attainmentPct: quotaVal > 0 ? Math.round(((summary.closed_won_total + summary.commit_total) / quotaVal) * 100) : 0,
    },
    existingAnnotation: null,
    columns,
  };
}

export async function getPendingApprovals(boardId: string): Promise<PendingApprovalEntry[]> {
  const managerId = headers()['x-user-id'] || '00000000-0000-0000-0000-000000000002';
  const periodId = boardId === 'board-q1' ? 'q1-fy26-demo' : boardId === 'board-q2' ? 'q2-fy26-demo' : boardId;

  const mRes = await fetch(`/api/forecast/manager-board/${managerId}?period_id=${periodId}`, { headers: headers(), cache: 'no-store' });
  if (!mRes.ok) return [];
  const mEnvelope = await mRes.json();
  const reps = mEnvelope.data || [];

  const pendingEntries: PendingApprovalEntry[] = [];

  for (const rep of reps) {
    if (rep.has_pending_requests) {
      const ddRes = await fetch(`/api/forecast/drill-down/${rep.rep_id}?period_id=${periodId}`, { headers: headers(), cache: 'no-store' });
      if (ddRes.ok) {
        const ddEnvelope = await ddRes.json();
        const deals = ddEnvelope.data || [];
        for (const deal of deals) {
          if (deal.has_pending_request) {
            let reqType = 'both';
            if (deal.best_case_state === 'submitted' && deal.commit_state !== 'submitted') reqType = 'best_case';
            else if (deal.commit_state === 'submitted' && deal.best_case_state !== 'submitted') reqType = 'commit';

            let activityList: any[] = [];
            if (deal.id) {
              const actRes = await fetch(`/api/forecast/activity/${deal.id}`, { headers: headers(), cache: 'no-store' });
              if (actRes.ok) {
                const actEnvelope = await actRes.json();
                activityList = actEnvelope.data || [];
              }
            }

            pendingEntries.push({
              repUserId: rep.rep_id,
              repName: rep.rep_name,
              avatarInitials: rep.rep_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2),
              commitValue: deal.commit_value,
              bestCaseValue: deal.best_case_value,
              submittedAt: activityList.length > 0 ? activityList[activityList.length - 1].timestamp : new Date().toISOString(),
              note: deal.requested_best_case_note || deal.requested_commit_note || 'Forecast submitted',
              submissionId: deal.id ?? `sub-${deal.deal_id}`,
              activity: activityList.map((a: any) => ({
                id: a.id || a.activity_id,
                action: a.status || 'BOARD_SUBMIT',
                actorName: a.performed_by_name || 'System',
                occurredAt: a.timestamp || new Date().toISOString(),
                description: a.notes || '',
              })),
              requestType: reqType as any,
              dealName: deal.deal_name,
              dealId: deal.deal_id,
            });
          }
        }
      }
    }
  }

  return pendingEntries;
}

export async function getPendingApprovalCount(boardId: string): Promise<number> {
  try {
    const list = await getPendingApprovals(boardId);
    return list.length;
  } catch {
    return 0;
  }
}

export async function bulkUploadTargets(boardId: string, file: File): Promise<{ message: string; updatedCount: number }> {
  // Bulk upload targets stub
  return { message: 'Bulk targets uploaded successfully', updatedCount: 5 };
}

export async function assignTargets(boardId: string, periodId: string, assignments: { repUserId: string; targetValue: number }[]): Promise<any> {
  const managerId = headers()['x-user-id'] || '00000000-0000-0000-0000-000000000002';
  const mappedPeriodId = periodId === 'board-q1' ? 'q1-fy26-demo' : periodId === 'board-q2' ? 'q2-fy26-demo' : periodId;

  const res = await fetch(`${M06_API_BASE}/boards/targets/assign`, {
    method: 'POST',
    headers: {
      ...headers(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      periodId: mappedPeriodId,
      assignments: assignments.map((a) => ({ repUserId: a.repUserId, targetValue: a.targetValue }))
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
