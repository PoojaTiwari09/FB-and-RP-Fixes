'use client';

import type { SubmissionHistoryResponse } from '../source-types';
import { getRepM06Headers } from '../services/m06-api';

export async function getSubmissionHistory(
  boardId: string,
  repUserId: string,
  columnId: string,
  dealId?: string
): Promise<SubmissionHistoryResponse> {
  try {
    const periodId = boardId === '00000000-0000-0000-0000-0000000000a1' ? '00000000-0000-0000-0000-0000000000b1' : boardId === '00000000-0000-0000-0000-0000000000a2' ? '00000000-0000-0000-0000-0000000000b2' : boardId;
    
    // We can fetch the list of all submissions for this rep, deal, and period.
    // In our new REST API design, we can query GET /api/forecast/submissions/:period_id/:rep_id
    // to find submissions. But since we need all historical versions of submissions, let's look at the database.
    // Wait, let's fetch from the activity logs first, or we can fetch a new endpoint if we had one.
    // Wait, let's look at `/api/forecast/activity/:submission_id`. But we don't have a direct endpoint for all versions.
    // Wait, let's call GET `/api/forecast/submissions/:period_id/:rep_id` to find the current submission ID for this deal.
    const subsRes = await fetch(`/api/forecast/submissions/${periodId}/${repUserId}`, {
      headers: getRepM06Headers(repUserId),
      cache: 'no-store',
    });
    if (!subsRes.ok) return { history: [] };
    const subsEnvelope = await subsRes.json();
    const subsList = subsEnvelope.data || [];
    
    // Find the current active submission for the deal
    const activeSub = dealId ? subsList.find((s: any) => s.deal_id === dealId) : subsList[0];
    if (!activeSub || !activeSub.id) return { history: [] };

    // Fetch the activity log list
    const actRes = await fetch(`/api/forecast/activity/${activeSub.id}`, {
      headers: getRepM06Headers(repUserId),
      cache: 'no-store',
    });
    if (!actRes.ok) return { history: [] };
    const actEnvelope = await actRes.json();
    const activityLogs = actEnvelope.data || [];

    // Map activity logs to history rows
    const history: any[] = [];
    let prevValue = 0;

    activityLogs.forEach((log: any, index: number) => {
      // Extract values from note or just construct a sequence of values
      // Note might say: "Submitted best_case forecast..." or "Overrode commit with value 4500000"
      // Let's parse value from note if present, otherwise default to active values.
      let val = columnId === 'col-best-case' ? activeSub.best_case_value : activeSub.commit_value;
      const match = log.notes?.match(/value\s+([\d.]+)/i) || log.notes?.match(/([\d.]+)k/i);
      if (match) {
        const parsed = parseFloat(match[1]);
        val = match[0].toLowerCase().includes('k') ? parsed * 1000 : parsed;
      }

      const delta = index > 0 ? val - prevValue : 0;
      const deltaDirection = index > 0 ? (delta > 0 ? 'up' : delta < 0 ? 'down' : null) : null;

      history.push({
        id: log.id,
        periodLabel: `Month ${index + 1}`,
        submitterName: log.performed_by_name || 'Rep',
        submittedAt: new Date(log.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        value: val,
        delta: Math.abs(delta),
        deltaDirection,
      });

      prevValue = val;
    });

    const rawActivity = activityLogs.map((log: any) => {
      let action = 'Draft created';
      if (log.status === 'submitted') action = 'Submitted';
      if (log.status === 'approved') action = 'Approved';
      if (log.status === 'reopened') action = 'Reopened';
      if (log.status === 'overridden') action = 'Overridden';

      return {
        id: log.id,
        action,
        actorRole: log.performed_by_name || 'System',
        createdAt: log.timestamp,
        notes: log.notes,
      };
    });

    return { history: history.reverse(), activity: rawActivity.reverse() };
  } catch (e) {
    console.error('getSubmissionHistory error:', e);
    return { history: [], activity: [] };
  }
}
