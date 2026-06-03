'use client';

import { M06_API_BASE, getManagerM06Headers } from '../services/m06-api';

const headers = () => getManagerM06Headers();

export async function approveSubmission(boardId: string, submissionId: string) {
  const res = await fetch(`${M06_API_BASE}/boards/${boardId}/submissions/${submissionId}/approve`, {
    method: 'PATCH',
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function reopenSubmission(boardId: string, submissionId: string) {
  const res = await fetch(`${M06_API_BASE}/boards/${boardId}/submissions/${submissionId}/reopen`, {
    method: 'PATCH',
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function managerOverrideSubmission(
  boardId: string,
  repUserId: string,
  payload: { columnId: string; value: number; note: string }
) {
  const res = await fetch(`${M06_API_BASE}/boards/${boardId}/reps/${repUserId}/submission`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headers(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
