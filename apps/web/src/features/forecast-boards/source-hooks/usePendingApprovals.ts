'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PendingApprovalEntry } from '../source-types';
import { getPendingApprovals, getPendingApprovalCount } from '../source-services/managerBoard.service';
import { approveSubmission, reopenSubmission, managerOverrideSubmission } from '../source-services/approval.service';

export function usePendingApprovals(boardId: string, onStateChange?: () => void) {
  const [approvals, setApprovals] = useState<PendingApprovalEntry[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getPendingApprovals(boardId);
      const count = await getPendingApprovalCount(boardId);
      setApprovals(list);
      setPendingCount(count);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const approve = useCallback(async (submissionId: string, requestType: string) => {
    await approveSubmission(boardId, submissionId, requestType as any);
    setApprovals((prev) => prev.filter((a) => a.submissionId !== submissionId));
    setPendingCount((prev) => Math.max(prev - 1, 0));
    if (onStateChange) onStateChange();
  }, [boardId, onStateChange]);

  const reopen = useCallback(async (submissionId: string) => {
    await reopenSubmission(boardId, submissionId);
    setApprovals((prev) => prev.filter((a) => a.submissionId !== submissionId));
    setPendingCount((prev) => Math.max(prev - 1, 0));
    if (onStateChange) onStateChange();
  }, [boardId, onStateChange]);

  const override = useCallback(async (
    repUserId: string,
    columnId: string,
    value: number,
    note: string,
    removeFromQueue = true
  ) => {
    await managerOverrideSubmission(boardId, repUserId, { columnId, value, note });
    if (removeFromQueue) {
      setApprovals((prev) => prev.filter((a) => a.repUserId !== repUserId));
      setPendingCount((prev) => Math.max(prev - 1, 0));
      if (onStateChange) onStateChange();
    }
  }, [boardId, onStateChange]);

  return { approvals, setApprovals, pendingCount, setPendingCount, isLoading, approve, reopen, override, refresh };
}
