'use client';

import { useState, useEffect } from 'react';
import { getSubmissionHistory } from '../source-services/history.service';
import { getErrorMessage } from '../source-utils/format';

export function useSubmissionHistory(
  boardId: string, repUserId: string, columnId: string, isOpen: boolean, dealId?: string
) {
  const [history, setHistory] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (isOpen && boardId && repUserId) {
      setIsLoading(true);
      getSubmissionHistory(boardId, repUserId, columnId, dealId)
        .then((data: any) => {
          if (active) {
            setHistory(data.history || []);
            setActivity(data.activity || []);
            setError(null);
          }
        })
        .catch((e: unknown) => {
          if (active) setError(getErrorMessage(e, 'Failed to load submission history.'));
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }
    return () => { active = false; };
  }, [boardId, repUserId, columnId, dealId, isOpen]);

  return { history, activity, isLoading, error };
}
