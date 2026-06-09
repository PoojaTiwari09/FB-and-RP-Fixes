'use client';
import { useState, useEffect, useCallback } from 'react';
import type { CallReview, Call } from '@calls/types/calls.types';

const sortValueMap: Record<string, string> = {
  'Newest First': 'newest',
  'Oldest First': 'oldest',
  'Highest Priority': 'highestPriority',
  'Overdue First': 'overdueFirst',
};

interface UseCallsTableOptions {
  fetchData: (params: Record<string, string>) => Promise<{
    totalCount: number;
    data: (CallReview | Call)[];
  }>;
}

export function useCallsTable({ fetchData }: UseCallsTableOptions) {
  const [rows, setRows] = useState<(CallReview | Call)[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Status');
  const [priority, setPriority] = useState('All Priority');
  const [callType, setCallType] = useState('All Call Types');
  const [sort, setSort] = useState('Newest First');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      params.status = status;
      params.priority = priority;
      params.callType = callType;
      params.sort = sortValueMap[sort] ?? 'newest';

      const result = await fetchData(params);
      setRows(result.data);
      setTotalCount(result.totalCount);
    } catch {
      setError('Failed to load calls. Showing cached data.');
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, callType, sort, fetchData]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const resetFilters = () => {
    setSearch('');
    setStatus('All Status');
    setPriority('All Priority');
    setCallType('All Call Types');
    setSort('Newest First');
  };

  return {
    rows,
    totalCount,
    loading,
    error,
    setError,
    search, setSearch,
    status, setStatus,
    priority, setPriority,
    callType, setCallType,
    sort, setSort,
    resetFilters,
  };
}
