'use client';

import { useState, useEffect } from 'react';
import type { SubmissionHistoryResponse } from '../source-types';
import { getSubmissionHistory } from '../source-services/history.service';
import { getErrorMessage } from '../source-utils/format';

export function useSubmissionHistory(
  boardId: string, repUserId: string, columnId: string, isOpen: boolean, dealId?: string
) {
  const [data, setData] = useState<SubmissionHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;
    void Promise.resolve()
      .then(() => {
        setIsLoading(true);
        return getSubmissionHistory(boardId, repUserId, columnId, dealId);
      })
      .then((res) => {
        if (!isCurrent) return;
        setData(res);
        setError(null);
      })
      .catch((e: unknown) => {
        if (isCurrent) setError(getErrorMessage(e, 'Failed to load submission history.'));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [boardId, repUserId, columnId, isOpen, dealId]);

  return { history: data?.history ?? [], isLoading, error };
}
