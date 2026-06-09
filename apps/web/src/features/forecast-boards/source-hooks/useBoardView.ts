'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RepBoardViewResponse } from '../source-types';
import { getRepBoardView } from '../source-services/repBoard.service';
import { getErrorMessage } from '../source-utils/format';

export function useBoardView(boardId: string) {
  const [data, setData] = useState<RepBoardViewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void Promise.resolve()
      .then(() => getRepBoardView(boardId))
      .then((res) => {
        if (!isCurrent) return;
        setData(res);
        setError(null);
      })
      .catch((e: unknown) => {
        if (isCurrent) setError(getErrorMessage(e, 'Failed to load board.'));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [boardId]);

  const togglePanel = useCallback((dealId: string) => {
    setActiveDealId((prev) => prev === dealId ? null : dealId);
  }, []);

  const updateCellValue = useCallback((dealId: string, columnId: string, newValue: number) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        repRow: {
          ...prev.repRow,
          cells: {
            ...prev.repRow.cells,
            [columnId]: {
              ...prev.repRow.cells[columnId],
              value: prev.deals.reduce((sum, deal) => {
                if (deal.id === dealId) return sum + newValue;
                return sum + (columnId === 'col-best-case' ? deal.bestCase ?? 0 : deal.commit ?? 0);
              }, 0),
              lastUpdatedAt: new Date().toISOString(),
            },
          },
        },
        rollup: {
          ...prev.rollup,
          cells: {
            ...prev.rollup.cells,
            [columnId]: prev.deals.reduce((sum, deal) => {
              if (deal.id === dealId) return sum + newValue;
              return sum + (columnId === 'col-best-case' ? deal.bestCase ?? 0 : deal.commit ?? 0);
            }, 0),
          },
        },
        deals: prev.deals.map((deal) => {
          if (deal.id === dealId) {
            return {
              ...deal,
              ...(columnId === 'col-best-case' ? { bestCase: newValue } : {}),
              ...(columnId === 'col-commit' ? { commit: newValue } : {}),
              submissionStatus: 'submitted' as const,
            };
          }
          return deal;
        }),
      };
    });
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getRepBoardView(boardId);
      setData(res);
      setError(null);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to load board.'));
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  return { data, isLoading, error, activeDealId, togglePanel, updateCellValue, refresh };
}
