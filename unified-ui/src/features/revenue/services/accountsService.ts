// ============================================================
// Revenue / Accounts — Real API Service
// Endpoints from: final-api-endpoints_1.md (/api/manager/...)
// Base URL: process.env.NEXT_PUBLIC_API_BASE_URL
// ============================================================

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
  AiChatRequest,
  AiChatResponse,
} from '../types/accounts.types';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status} on ${path}`);
  }
  return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      val.forEach((v) => q.append(key, String(v)));
    } else {
      q.set(key, String(val));
    }
  }
  const str = q.toString();
  return str ? `?${str}` : '';
}

// ─── Alert Banner ────────────────────────────────────────────
export async function getAlertBanner(): Promise<AlertBannerData> {
  return apiFetch<AlertBannerData>('/api/manager/revenue/accounts/alert');
}

// ─── KPI Summary Cards ───────────────────────────────────────
export async function getAccountsSummary(
  viewing?: string[],
  period?: string,
): Promise<KpiSummaryResponse> {
  const q = buildQuery({ viewing, period });
  return apiFetch<KpiSummaryResponse>(`/api/manager/revenue/accounts/summary${q}`);
}

// ─── Viewing Filter Dropdown ─────────────────────────────────
export async function getViewers(): Promise<ViewersResponse> {
  return apiFetch<ViewersResponse>('/api/manager/revenue/accounts/viewers');
}

// ─── Account List ────────────────────────────────────────────
export async function getAccounts(
  params: AccountListParams,
): Promise<AccountListResponse> {
  const q = buildQuery(params as Record<string, unknown>);
  return apiFetch<AccountListResponse>(`/api/manager/revenue/accounts${q}`);
}

// ─── Recent Activity Dots (tooltip) ──────────────────────────
export async function getRecentActivities(
  accountId: string,
  limit = 5,
): Promise<RecentActivity[]> {
  return apiFetch<RecentActivity[]>(
    `/api/manager/revenue/accounts/${accountId}/activities/recent?limit=${limit}`,
  );
}

// ─── Account Drawer — Overview ────────────────────────────────
export async function getAccountOverview(
  accountId: string,
): Promise<AccountOverviewData> {
  return apiFetch<AccountOverviewData>(
    `/api/manager/revenue/accounts/${accountId}/overview`,
  );
}

// ─── Account Drawer — Activity Feed ──────────────────────────
export async function getAccountActivity(
  accountId: string,
  params: ActivityFeedParams,
): Promise<ActivityFeedResponse> {
  const q = buildQuery(params as Record<string, unknown>);
  return apiFetch<ActivityFeedResponse>(
    `/api/manager/revenue/accounts/${accountId}/activity${q}`,
  );
}

// ─── Account Drawer — Briefs ──────────────────────────────────
const briefCache = new Map<string, AccountBriefs>();

export async function getAccountBriefs(accountId: string, force = false): Promise<AccountBriefs> {
  if (!force && briefCache.has(accountId)) {
    return briefCache.get(accountId)!;
  }
  const result = await apiFetch<AccountBriefs>(
    `/api/manager/revenue/accounts/${accountId}/briefs`,
  );
  briefCache.set(accountId, result);
  return result;
}

// ─── Account Drawer — Todos ──────────────────────────────────
export async function getAccountTodos(accountId: string): Promise<TodosResponse> {
  return apiFetch<TodosResponse>(
    `/api/manager/revenue/accounts/${accountId}/todos`,
  );
}

export async function toggleTodo(
  accountId: string,
  todoId: string,
  completed: boolean,
): Promise<void> {
  await apiFetch(`/api/manager/revenue/accounts/${accountId}/todos/${todoId}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
}

// ─── Account Drawer — Notes ──────────────────────────────────
export async function getAccountNotes(accountId: string): Promise<NotesData> {
  return apiFetch<NotesData>(
    `/api/manager/revenue/accounts/${accountId}/notes`,
  );
}

export async function saveAccountNotes(
  accountId: string,
  notes: string,
): Promise<void> {
  await apiFetch(`/api/manager/revenue/accounts/${accountId}/notes`, {
    method: 'PATCH',
    body: JSON.stringify({ notes }),
  });
}

// ─── Account Drawer — CRM ────────────────────────────────────
export async function getAccountCrm(accountId: string): Promise<CrmData> {
  return apiFetch<CrmData>(
    `/api/manager/revenue/accounts/${accountId}/crm`,
  );
}

// ─── AI Chat ─────────────────────────────────────────────────
export async function sendAiChat(
  accountId: string,
  body: AiChatRequest,
): Promise<AiChatResponse> {
  return apiFetch<AiChatResponse>(
    `/api/manager/revenue/accounts/${accountId}/ai-chat`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}
