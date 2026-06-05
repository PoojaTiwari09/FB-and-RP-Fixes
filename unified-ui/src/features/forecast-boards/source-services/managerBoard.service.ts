'use client';

import type { ManagerBoardViewResponse, RepDrillDownResponse, PendingApprovalEntry } from '../source-types';
import { M06_API_BASE, getManagerM06Headers } from '../services/m06-api';

const headers = () => getManagerM06Headers();

export async function getManagerBoardView(boardId: string): Promise<ManagerBoardViewResponse> {
  const res = await fetch(`${M06_API_BASE}/boards/${boardId}/view`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getRepDrillDown(boardId: string, repUserId: string): Promise<RepDrillDownResponse> {
  const res = await fetch(`${M06_API_BASE}/boards/${boardId}/reps/${repUserId}/drilldown`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPendingApprovals(boardId: string): Promise<PendingApprovalEntry[]> {
  const res = await fetch(`${M06_API_BASE}/boards/${boardId}/pending-approvals`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPendingApprovalCount(boardId: string): Promise<number> {
  const res = await fetch(`${M06_API_BASE}/boards/${boardId}/pending-approvals/count`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.pendingCount;
}

export async function bulkUploadTargets(boardId: string, file: File): Promise<{ message: string; updatedCount: number }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${M06_API_BASE}/boards/${boardId}/targets/bulk`, {
    method: 'POST',
    headers: {
      'x-tenant-id': headers()['x-tenant-id'],
      'X-Tenant-ID': headers()['X-Tenant-ID'],
      'x-org-id': headers()['x-org-id'],
      'x-user-id': headers()['x-user-id'],
      'x-user-role': headers()['x-user-role'],
    },
    body: formData,
  });
  
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function assignTargets(boardId: string, periodId: string, assignments: { repUserId: string; targetValue: number }[]): Promise<any> {
  const res = await fetch(`${M06_API_BASE}/boards/targets/assign`, {
    method: 'POST',
    headers: {
      ...headers(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ periodId, assignments }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
