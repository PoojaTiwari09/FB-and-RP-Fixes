import { useState, useEffect, useCallback } from 'react';
import type { CallListItem, CallsListFilters, CallStatus, DurationFilter } from '../types/calls.types';
import { fetchCallsList } from '../services/calls-list.service';

interface UseCallsListReturn {
  calls: CallListItem[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  filters: CallsListFilters;
  setStatus: (status: CallStatus | 'all') => void;
  setDuration: (duration: DurationFilter) => void;
  setSearch: (search: string) => void;
  setDateRange: (range: string, start?: string | null, end?: string | null) => void;
  clearDateRange: () => void;
  toggleAccount: (id: string) => void;
  toggleDealType: (value: string) => void;
  toggleParticipantId: (id: string) => void;
  clearAccount: () => void;
  clearDealType: () => void;
  clearParticipantId: () => void;
  setOwnerFilter: (ownerId: string) => void;
  setPage: (page: number) => void;
  reload: () => void;
}

const DEFAULT_FILTERS: CallsListFilters = {
  page: 1,
  size: 20,
  search: '',
  status: 'all',
  duration: 'all',
  dealType: [],
  account: [],
  participantId: [],
  ownerId: '',
  dateRange: 'all',
  startDate: null,
  endDate: null,
};

function toggleInArray(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function filtersKey(f: CallsListFilters): string {
  return JSON.stringify({
    page: f.page,
    size: f.size,
    search: f.search,
    status: f.status,
    duration: f.duration,
    dealType: f.dealType,
    account: f.account,
    participantId: f.participantId,
    ownerId: f.ownerId,
    dateRange: f.dateRange,
    startDate: f.startDate,
    endDate: f.endDate,
  });
}

export function useCallsList(): UseCallsListReturn {
  const [calls, setCalls] = useState<CallListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CallsListFilters>(DEFAULT_FILTERS);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCallsList(filters);
      
      let filtered = data.calls || [];
      if (filters.dealType && filters.dealType.length > 0) {
        filtered = filtered.filter((c) =>
          filters.dealType.some((dt) => c.dealType?.toLowerCase() === dt.toLowerCase())
        );
      }
      if (filters.participantId && filters.participantId.length > 0) {
        filtered = filtered.filter((c) =>
          c.participants && c.participants.length > 0 &&
          filters.participantId.some((pid) =>
            c.participants!.some((cp) => cp.name?.toLowerCase() === pid.toLowerCase() || cp.name === pid)
          )
        );
      }
      
      setCalls(filtered);
      setTotalCount(filtered.length);
    } catch (err) {
      const hint =
        err instanceof Error && err.message.includes('400')
          ? ' Check that unified API on :3001 is running (restart after updates).'
          : '';
      setError(`Failed to load calls.${hint}`);
      setCalls([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [filtersKey(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = (status: CallStatus | 'all') =>
    setFilters((f) => ({ ...f, status, page: 1 }));

  const setDuration = (duration: DurationFilter) =>
    setFilters((f) => ({ ...f, duration, page: 1 }));

  const setSearch = (search: string) =>
    setFilters((f) => ({ ...f, search, page: 1 }));

  const setDateRange = (
    dateRange: string,
    startDate: string | null = null,
    endDate: string | null = null,
  ) =>
    setFilters((f) => ({
      ...f,
      dateRange: dateRange as CallsListFilters['dateRange'],
      startDate,
      endDate,
      page: 1,
    }));

  const toggleAccount = (id: string) =>
    setFilters((f) => ({ ...f, account: toggleInArray(f.account, id), page: 1 }));

  const toggleDealType = (value: string) =>
    setFilters((f) => ({ ...f, dealType: toggleInArray(f.dealType, value), page: 1 }));

  const toggleParticipantId = (id: string) =>
    setFilters((f) => ({ ...f, participantId: toggleInArray(f.participantId, id), page: 1 }));

  const clearDateRange = () =>
    setFilters((f) => ({ ...f, dateRange: 'all', startDate: null, endDate: null, page: 1 }));

  const clearAccount = () => setFilters((f) => ({ ...f, account: [], page: 1 }));
  const clearDealType = () => setFilters((f) => ({ ...f, dealType: [], page: 1 }));
  const clearParticipantId = () => setFilters((f) => ({ ...f, participantId: [], page: 1 }));

  const setOwnerFilter = (ownerId: string) =>
    setFilters((f) => ({ ...f, ownerId, page: 1 }));

  const setPage = (page: number) => setFilters((f) => ({ ...f, page }));

  return {
    calls,
    totalCount,
    isLoading,
    error,
    filters,
    setStatus,
    setDuration,
    setSearch,
    setDateRange,
    clearDateRange,
    toggleAccount,
    toggleDealType,
    toggleParticipantId,
    clearAccount,
    clearDealType,
    clearParticipantId,
    setOwnerFilter,
    setPage,
    reload: load,
  };
}
