'use client';

// ============================================================
// useAccountsData — Custom hooks for Revenue Accounts module
// Pattern: API-first → on error → mock fallback
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/accountsService';
import * as mock from '../services/mock/mockAccountsService';
import type {
  AlertBannerData,
  KpiSummaryResponse,
  ViewersResponse,
  AccountListParams,
  AccountListResponse,
  RecentActivity,
  AccountOverviewData,
  ActivityFeedParams,
  ActivityFeedResponse,
  AccountBriefs,
  TodosResponse,
  NotesData,
  CrmData,
} from '../types/accounts.types';

// ─── Generic hook state ─────────────────────────────────────
interface HookState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isMockFallback: boolean;
}

function useApiWithFallback<T>(
  fetcher: () => Promise<T>,
  fallback: () => T,
  deps: unknown[],
) {
  const [state, setState] = useState<HookState<T>>({
    data: null,
    isLoading: true,
    error: null,
    isMockFallback: false,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await fetcher();
      setState({
        data,
        isLoading: false,
        error: null,
        isMockFallback: false,
      });
    } catch (err: any) {
      console.warn('API call failed, falling back to mock data:', err);
      setState({
        data: fallback(),
        isLoading: false,
        error: null,
        isMockFallback: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, retry: load };
}

// ─── Alert Banner ────────────────────────────────────────────
export function useAlertBanner() {
  return useApiWithFallback<AlertBannerData>(
    () => api.getAlertBanner(),
    () => mock.mockAlertBanner(),
    [],
  );
}

// ─── KPI Summary Cards ───────────────────────────────────────
export function useAccountsSummary(viewing?: string[], period?: string) {
  return useApiWithFallback<KpiSummaryResponse>(
    () => api.getAccountsSummary(viewing, period),
    () => mock.mockAccountsSummary(),
    [JSON.stringify(viewing), period],
  );
}

// ─── Viewing Filter Dropdown ─────────────────────────────────
export function useViewers() {
  return useApiWithFallback<ViewersResponse>(
    () => api.getViewers(),
    () => mock.mockViewers(),
    [],
  );
}

// ─── Account List ────────────────────────────────────────────
export function useAccountsList(params: AccountListParams) {
  return useApiWithFallback<AccountListResponse>(
    () => api.getAccounts(params),
    () => mock.mockAccountsList(),
    [JSON.stringify(params)],
  );
}

// ─── Recent Activities (per account, for tooltip) ────────────
export function useRecentActivities(accountId: string | null, limit = 5) {
  return useApiWithFallback<RecentActivity[]>(
    () =>
      accountId
        ? api.getRecentActivities(accountId, limit)
        : Promise.resolve([]),
    () => (accountId ? mock.mockRecentActivities(accountId) : []),
    [accountId, limit],
  );
}

// ─── Account Drawer — Overview ────────────────────────────────
export function useAccountOverview(accountId: string | null) {
  return useApiWithFallback<AccountOverviewData>(
    () =>
      accountId
        ? api.getAccountOverview(accountId)
        : Promise.resolve({ risksAndObjections: [] }),
    () => (accountId ? mock.mockAccountOverview(accountId) : { risksAndObjections: [] }),
    [accountId],
  );
}

// ─── Account Drawer — Activity Feed ──────────────────────────
export function useAccountActivity(
  accountId: string | null,
  params: ActivityFeedParams,
) {
  return useApiWithFallback<ActivityFeedResponse>(
    () =>
      accountId
        ? api.getAccountActivity(accountId, params)
        : Promise.resolve({ items: [], total: 0, page: 1, totalPages: 0 }),
    () =>
      accountId
        ? mock.mockAccountActivity(accountId)
        : { items: [], total: 0, page: 1, totalPages: 0 },
    [accountId, JSON.stringify(params)],
  );
}

// ─── Account Drawer — Briefs ──────────────────────────────────
export function useAccountBriefs(accountId: string | null) {
  return useApiWithFallback<AccountBriefs>(
    () =>
      accountId
        ? api.getAccountBriefs(accountId)
        : Promise.resolve({ briefContent: '' }),
    () => (accountId ? mock.mockAccountBriefs(accountId) : { briefContent: '' }),
    [accountId],
  );
}

// ─── Account Drawer — Todos ──────────────────────────────────
export function useAccountTodos(accountId: string | null) {
  const hook = useApiWithFallback<TodosResponse>(
    () =>
      accountId
        ? api.getAccountTodos(accountId)
        : Promise.resolve({ todos: [] }),
    () => (accountId ? mock.mockAccountTodos(accountId) : { todos: [] }),
    [accountId],
  );

  const toggleTodo = useCallback(
    async (todoId: string, completed: boolean) => {
      if (!accountId) return;
      try {
        await api.toggleTodo(accountId, todoId, completed);
      } catch {
        // Optimistic update already applied in component — no re-throw
      }
    },
    [accountId],
  );

  return { ...hook, toggleTodo };
}

// ─── Account Drawer — Notes ──────────────────────────────────
export function useAccountNotes(accountId: string | null) {
  const hook = useApiWithFallback<NotesData>(
    () =>
      accountId
        ? api.getAccountNotes(accountId)
        : Promise.resolve({ notes: '', updatedAt: '' }),
    () =>
      accountId ? mock.mockAccountNotes(accountId) : { notes: '', updatedAt: '' },
    [accountId],
  );

  const saveNotes = useCallback(
    async (notes: string) => {
      if (!accountId) return;
      try {
        await api.saveAccountNotes(accountId, notes);
      } catch {
        console.error('[Notes] Save failed (mock mode, no-op)');
      }
    },
    [accountId],
  );

  return { ...hook, saveNotes };
}

// ─── Account Drawer — CRM ────────────────────────────────────
export function useAccountCrm(accountId: string | null) {
  return useApiWithFallback<CrmData>(
    () =>
      accountId
        ? api.getAccountCrm(accountId)
        : Promise.resolve({ crmFields: [] }),
    () => (accountId ? mock.mockAccountCrm(accountId) : { crmFields: [] }),
    [accountId],
  );
}
