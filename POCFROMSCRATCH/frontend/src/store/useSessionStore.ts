'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, FilterCondition } from '@/types';

interface SessionState {
  role: Role;
  setRole: (role: Role) => void;
  activeBoard: string;
  setActiveBoard: (slug: string) => void;
  activeTabId: string | null;
  setActiveTabId: (id: string | null) => void;
  selectedRepIds: string[];
  setSelectedRepIds: (ids: string[]) => void;
  period: string;
  setPeriod: (p: string) => void;
  customFilters: FilterCondition[];
  setCustomFilters: (f: FilterCondition[]) => void;
  sortField: string;
  sortDir: 'asc' | 'desc';
  setSortField: (f: string) => void;
  setSortDir: (d: 'asc' | 'desc') => void;
  pageSize: 10 | 20 | 50;
  setPageSize: (n: 10 | 20 | 50) => void;
  page: number;
  setPage: (n: number) => void;
  // ── Phase 4: Board brief config (not persisted) ──────────────────────
  aiBriefsEnabled: boolean;
  boardBriefPeriodDays: number;
  boardBriefType: string;
  setBoardBriefConfig: (config: { aiBriefsEnabled: boolean; briefPeriodDays: number; briefType: string }) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      role: 'rep',
      setRole: (role) => set({ role }),
      activeBoard: 'commercial',
      setActiveBoard: (slug) => set({ activeBoard: slug, page: 1 }),
      activeTabId: null,
      setActiveTabId: (id) => set({ activeTabId: id, page: 1 }),
      selectedRepIds: [],
      setSelectedRepIds: (ids) => set({ selectedRepIds: ids, page: 1 }),
      period: 'all_time',
      setPeriod: (p) => set({ period: p, page: 1 }),
      customFilters: [],
      setCustomFilters: (f) => set({ customFilters: f, page: 1 }),
      sortField: 'exit_arr',
      sortDir: 'desc',
      setSortField: (f) => set({ sortField: f }),
      setSortDir: (d) => set({ sortDir: d }),
      pageSize: 20,
      setPageSize: (n) => set({ pageSize: n, page: 1 }),
      page: 1,
      setPage: (n) => set({ page: n }),
      // Brief config defaults — overwritten when board loads
      aiBriefsEnabled: true,
      boardBriefPeriodDays: 0,   // 0 = uninitialised; real value set by setBoardBriefConfig
      boardBriefType: 'full',
      setBoardBriefConfig: ({ aiBriefsEnabled, briefPeriodDays, briefType }) =>
        set({ aiBriefsEnabled, boardBriefPeriodDays: briefPeriodDays, boardBriefType: briefType }),
    }),
    {
      name: 'rid-session',
      partialize: (state) => ({
        role: state.role,
        activeBoard: state.activeBoard,
        activeTabId: state.activeTabId,
        period: state.period,
        sortField: state.sortField,
        sortDir: state.sortDir,
        pageSize: state.pageSize,
      }),
    },
  ),
);
