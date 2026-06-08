'use client';

import { getManagerM06Headers } from '../services/m06-api';

const headers = () => getManagerM06Headers();

export async function approveSubmission(boardId: string, submissionId: string, field: 'best_case' | 'commit' | 'both' = 'both') {
  const managerId = headers()['x-user-id'] || '00000000-0000-0000-0000-000000000002';
  const res = await fetch(`/api/forecast/submissions/${submissionId}/approve`, {
    method: 'PATCH',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ manager_id: managerId, field }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function reopenSubmission(boardId: string, submissionId: string) {
  const managerId = headers()['x-user-id'] || '00000000-0000-0000-0000-000000000002';
  const res = await fetch(`/api/forecast/submissions/${submissionId}/reopen`, {
    method: 'PATCH',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ manager_id: managerId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function managerOverrideSubmission(
  boardId: string,
  repUserId: string,
  payload: { columnId: string; value: number; note: string; submissionId?: string; field?: 'best_case' | 'commit' | 'both' }
) {
  const managerId = headers()['x-user-id'] || '00000000-0000-0000-0000-000000000002';
  const field = payload.field ?? (payload.columnId === 'col-best-case' ? 'best_case' : payload.columnId === 'col-commit' ? 'commit' : 'both');
  const subId = payload.submissionId ?? `sub-${payload.columnId}`;

  const res = await fetch(`/api/forecast/submissions/${subId}/override`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headers(),
    },
    body: JSON.stringify({
      manager_id: managerId,
      field,
      override_value: payload.value,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
