'use client';

import type { SubmissionHistoryResponse } from '../source-types';
import { M06_API_BASE, getRepM06Headers } from '../services/m06-api';

export async function getSubmissionHistory(
  boardId: string, repUserId: string, columnId: string,
): Promise<SubmissionHistoryResponse> {
  try {
    const res = await fetch(`${M06_API_BASE}/boards/${boardId}/reps/${repUserId}/history/${columnId}`, {
      headers: getRepM06Headers(),
      cache: 'no-store',
    });
    if (!res.ok) return { history: [] };
    return res.json();
  } catch {
    return { history: [] };
  }
}
