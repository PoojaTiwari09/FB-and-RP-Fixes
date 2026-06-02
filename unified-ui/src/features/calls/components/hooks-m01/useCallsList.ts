import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CallListItem, CallsListFilters, CallStatus, DurationFilter } from '../types/calls.types';
import { fetchCallsList } from '../services/calls-list.service';
import { MOCK_ACCOUNTS, MOCK_PARTICIPANTS, MOCK_CALL_METADATA_MAP } from '../mocks/calls.mock';

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
  clearDateRange: () => void;  // clears date filter only
  // Multi-select toggles
  toggleAccount: (id: string) => void;
  toggleDealType: (value: string) => void;
  toggleParticipantId: (id: string) => void;
  // Clear helpers
  clearAccount: () => void;
  clearDealType: () => void;
  clearParticipantId: () => void;
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
  dateRange: 'all',   // 'all' = no date filter applied
  startDate: null,
  endDate: null,
};

// Helper to parse duration string (e.g., "24:12" or "1:12:05") to total minutes
const parseDurationToMinutes = (durStr: string): number => {
  const parts = durStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  return 0;
};

// Helper: is callDate within the selected date range
const isWithinDateRange = (
  dateTimeStr: string,
  range: string,
  startStr: string | null,
  endStr: string | null
): boolean => {
  // 'all' means no date restriction
  if (!range || range === 'all') return true;

  const callDate = new Date(dateTimeStr);
  const now = new Date('2026-05-28T23:59:59');

  if (range === 'last7days') {
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    return callDate >= sevenDaysAgo && callDate <= now;
  }
  if (range === 'last30days') {
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    return callDate >= thirtyDaysAgo && callDate <= now;
  }
  if (range === 'custom' && startStr && endStr) {
    const start = new Date(startStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endStr);
    end.setHours(23, 59, 59, 999);
    return callDate >= start && callDate <= end;
  }
  return true;
};

// Toggle helper: if value exists in array remove it; otherwise add it
function toggleInArray(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function useCallsList(): UseCallsListReturn {
  const [rawCalls, setRawCalls] = useState<CallListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CallsListFilters>(DEFAULT_FILTERS);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCallsList({});
      setRawCalls(data.calls);
    } catch {
      setError('Failed to load calls.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredCalls = useMemo(() => {
    return rawCalls.filter((call) => {
      // 1. Status Filter
      if (filters.status && filters.status !== 'all') {
        if (call.status !== filters.status) return false;
      }

      // 2. Duration Filter
      if (filters.duration && filters.duration !== 'all') {
        const minutes = parseDurationToMinutes(call.duration);
        if (filters.duration === 'lt2' && minutes >= 2) return false;
        if (filters.duration === '2to10' && (minutes < 2 || minutes > 10)) return false;
        if (filters.duration === 'gt10' && minutes <= 10) return false;
      }

      // 3. Deal Type Filter — OR within selected values
      if (filters.dealType.length > 0) {
        const match = filters.dealType.some(
          (dt) => call.dealType.toLowerCase() === dt.toLowerCase()
        );
        if (!match) return false;
      }

      // 4. Account Filter — OR within selected IDs, map id → name
      if (filters.account.length > 0) {
        const selectedNames = filters.account
          .map((id) => MOCK_ACCOUNTS.accounts.find((a) => a.accountId === id)?.accountName)
          .filter(Boolean) as string[];

        const match = selectedNames.some(
          (name) => call.account.toLowerCase() === name.toLowerCase()
        );
        if (!match) return false;
      }

      // 5. Participants Filter — OR within selected IDs
      if (filters.participantId.length > 0) {
        const selectedNames = filters.participantId
          .map((id) => MOCK_PARTICIPANTS.participants.find((p) => p.participantId === id)?.name)
          .filter(Boolean) as string[];

        const metadata = MOCK_CALL_METADATA_MAP[call.callId];
        const hasAny = selectedNames.some((name) =>
          metadata?.participants?.some(
            (p) => p.name.toLowerCase() === name.toLowerCase()
          )
        );
        if (!hasAny) return false;
      }

      // 6. Date Range Filter
      if (filters.dateRange) {
        if (!isWithinDateRange(call.dateTime, filters.dateRange, filters.startDate, filters.endDate)) {
          return false;
        }
      }

      // 7. Search Filter (keyword, account, owner)
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTitle = call.callTitle.toLowerCase().includes(query);
        const matchesInsight = call.keyInsight.toLowerCase().includes(query);
        const matchesAccount = call.account.toLowerCase().includes(query);
        const matchesOwner = call.owner.ownerName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesInsight && !matchesAccount && !matchesOwner) return false;
      }

      return true;
    });
  }, [rawCalls, filters]);

  // ─── Setters ───────────────────────────────────────────────

  const setStatus = (status: CallStatus | 'all') =>
    setFilters((f) => ({ ...f, status, page: 1 }));

  const setDuration = (duration: DurationFilter) =>
    setFilters((f) => ({ ...f, duration, page: 1 }));

  const setSearch = (search: string) =>
    setFilters((f) => ({ ...f, search, page: 1 }));

  const setDateRange = (
    dateRange: string,
    startDate: string | null = null,
    endDate: string | null = null
  ) =>
    setFilters((f) => ({
      ...f,
      dateRange: dateRange as CallsListFilters['dateRange'],
      startDate,
      endDate,
      page: 1,
    }));

  // Multi-select toggles
  const toggleAccount = (id: string) =>
    setFilters((f) => ({ ...f, account: toggleInArray(f.account, id), page: 1 }));

  const toggleDealType = (value: string) =>
    setFilters((f) => ({ ...f, dealType: toggleInArray(f.dealType, value), page: 1 }));

  const toggleParticipantId = (id: string) =>
    setFilters((f) => ({ ...f, participantId: toggleInArray(f.participantId, id), page: 1 }));

  // Clear all selections for a filter
  const clearDateRange = () =>
    setFilters((f) => ({ ...f, dateRange: 'all', startDate: null, endDate: null, page: 1 }));

  const clearAccount = () => setFilters((f) => ({ ...f, account: [], page: 1 }));
  const clearDealType = () => setFilters((f) => ({ ...f, dealType: [], page: 1 }));
  const clearParticipantId = () => setFilters((f) => ({ ...f, participantId: [], page: 1 }));

  const setPage = (page: number) => setFilters((f) => ({ ...f, page }));

  return {
    calls: filteredCalls,
    totalCount: filteredCalls.length,
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
    setPage,
    reload: load,
  };
}
