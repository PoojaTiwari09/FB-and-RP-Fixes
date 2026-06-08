// ============================================================
// apiHandler.ts — All API calls with mock fallback
// ============================================================

import { DealBoard, BoardDetail, Deal, BriefData, Warning, PlaybookData, PlaybookCriterion, ActivityData, CrmFields, StageOptions, Notification, NotificationsResponse } from '../types/deal-boards.types';
import { MOCK_DEAL_BOARDS, MOCK_BOARD_DETAIL, MOCK_DEALS, MOCK_BRIEF, MOCK_WARNINGS, MOCK_PLAYBOOK, MOCK_ACTIVITY, MOCK_CRM_FIELDS, MOCK_STAGE_OPTIONS, MOCK_NOTIFICATIONS } from '../mocks/deal-boards.mocks';
import { getStoredNotifications, markAllStoredRead } from './notificationStore';

// Re-export types so consumers only need to import from apiHandler
export type {
  DealBoard,
  BoardDetail,
  Deal,
  BriefData,
  Warning,
  PlaybookData,
  PlaybookCriterion,
  ActivityData,
  CrmFields,
  StageOptions,
  Notification,
  NotificationsResponse,
};

// ─── Base URL ────────────────────────────────────────────────

import { ENV } from '../config/env';
const BASE_URL = ENV.API_BASE_URL;

// ─── Core Fetch Utility ───────────────────────────────────────

export interface ApiFetchResult<T> {
  data: T;
  isMock: boolean;
}

/**
 * apiFetch — wraps fetch with automatic mock fallback.
 */
export async function apiFetch<T>(
  endpoint: string,
  fallbackData: T,
  options?: RequestInit
): Promise<ApiFetchResult<T>> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!res.ok) {
      console.warn(`[apiFetch] ${endpoint} → HTTP ${res.status}. Using mock fallback.`);
      return { data: fallbackData, isMock: true };
    }

    const json = await res.json();
    const responseData = (json as any).data ?? json;
    return { data: responseData as T, isMock: (json as any).isMock ?? false };
  } catch (err) {
    console.warn(`[apiFetch] ${endpoint} → fetch failed (${err}). Using mock fallback.`);
    return { data: fallbackData, isMock: true };
  }
}

// ─── GET Endpoints ────────────────────────────────────────────

/**
 * GET /api/deals/boards
 * Returns all deal board cards from HubSpot (with mock fallback).
 */
export async function getDealBoards(): Promise<ApiFetchResult<DealBoard[]>> {
  try {
    const res = await fetch(`${BASE_URL}/api/deals/boards`);
    if (!res.ok) throw new Error('Backend error');
    const json = await res.json();
    if (json.success) {
      return { data: json.data, isMock: json.isMock || false };
    }
    throw new Error('Invalid response');
  } catch (err) {
    console.warn('[getDealBoards] Backend failed, using mock:', err);
    return { data: MOCK_DEAL_BOARDS, isMock: true };
  }
}

/**
 * GET /api/deals/boards/:boardId
 * Returns board name, ownerTag, and summary cards from HubSpot (with mock fallback).
 */
export async function getBoardDetail(
  boardId: string
): Promise<ApiFetchResult<BoardDetail>> {
  try {
    const res = await fetch(`${BASE_URL}/api/deals/boards/${boardId}`);
    if (!res.ok) throw new Error('Backend error');
    const json = await res.json();
    if (json.success) {
      return { data: json.data, isMock: json.isMock || false };
    }
    throw new Error('Invalid response');
  } catch (err) {
    console.warn('[getBoardDetail] Backend failed, using mock:', err);
    return { data: MOCK_BOARD_DETAIL[boardId] ?? MOCK_BOARD_DETAIL["board-1"], isMock: true };
  }
}

/**
 * GET /api/deals/boards/:boardId/deals
 * Returns ALL deals for the board from HubSpot (with mock fallback).
 * Filtering (stage, forecastCategory, amount range, closeDate) and
 * grouping (by stage / by rep) are handled client-side.
 */
export async function getDeals(
  boardId: string,
  owner?: string
): Promise<ApiFetchResult<Deal[]>> {
  try {
    const url = owner
      ? `${BASE_URL}/api/deals/boards/${boardId}/deals?owner=${encodeURIComponent(owner)}`
      : `${BASE_URL}/api/deals/boards/${boardId}/deals`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Backend error');
    const json = await res.json();
    if (json.success) {
      const mapped = (json.data || []).map((deal: any) => ({
        ...deal,
        id: deal.id || deal.dealId || '',
        name: deal.name || deal.dealName || 'Unknown Deal',
        assignedRep: deal.ownerName || deal.assignedRep || 'Lakshmi Prasanna Dara',
        assignedRepEmail: deal.ownerEmail || deal.assignedRepEmail,
      }));
      return { data: mapped, isMock: json.isMock || false };
    }
    throw new Error('Invalid response');
  } catch (err) {
    console.warn('[getDeals] Backend failed, using mock:', err);
    let fallback = MOCK_DEALS[boardId] ?? MOCK_DEALS["board-1"];
    if (owner) {
      fallback = fallback.filter((d: any) =>
        d.assignedRep?.toLowerCase().includes(owner.toLowerCase())
      );
    }
    return { data: fallback, isMock: true };
  }
}

/**
 * GET /api/deals/:dealId/brief
 * Returns AI summary, what changed this week, buyer sentiment,
 * last interaction, and key risks. Default tab on deal open.
 */
export function getDealBrief(dealId: string): Promise<ApiFetchResult<BriefData>> {
  return apiFetch<BriefData>(`/api/deals/${dealId}/brief`, MOCK_BRIEF[dealId] ?? MOCK_BRIEF["deal-1"]);
}

/**
 * GET /api/deals/:dealId/warnings
 * Returns all AI warnings for a deal with severity and status.
 */
export function getDealWarnings(dealId: string): Promise<ApiFetchResult<Warning[]>> {
  return apiFetch<Warning[]>(`/api/deals/${dealId}/warnings`, MOCK_WARNINGS[dealId] ?? []);
}

/**
 * GET /api/deals/:dealId/playbook
 * Returns MEDDIC playbook criteria, completion status, score %, and
 * AI-suggested notes per criterion.
 */
export function getDealPlaybook(dealId: string): Promise<ApiFetchResult<PlaybookData>> {
  return apiFetch<PlaybookData>(`/api/deals/${dealId}/playbook`, MOCK_PLAYBOOK[dealId] ?? MOCK_PLAYBOOK["deal-1"]);
}

/**
 * GET /api/deals/:dealId/activity
 * Returns activity timeline with interaction counts and dated events.
 */
export function getDealActivity(dealId: string): Promise<ApiFetchResult<ActivityData>> {
  return apiFetch<ActivityData>(`/api/deals/${dealId}/activity`, MOCK_ACTIVITY[dealId] ?? MOCK_ACTIVITY["deal-1"]);
}

/**
 * GET /api/deals/:dealId/crm-fields
 * Returns current editable CRM fields for the Update CRM tab.
 */
export function getDealCrmFields(dealId: string): Promise<ApiFetchResult<CrmFields>> {
  return apiFetch<CrmFields>(`/api/deals/${dealId}/crm-fields`, MOCK_CRM_FIELDS[dealId] ?? MOCK_CRM_FIELDS["deal-1"]);
}

/**
 * GET /api/deals/stage-options
 * Returns available pipeline stages and forecast categories for
 * dropdowns in the Update CRM tab and filter panel.
 */
export function getStageOptions(): Promise<ApiFetchResult<StageOptions>> {
  return apiFetch<StageOptions>("/api/deals/stage-options", MOCK_STAGE_OPTIONS);
}

function mergeWithStoredNotifications(mock: NotificationsResponse): NotificationsResponse {
  const stored = getStoredNotifications();
  if (stored.length === 0) return mock;

  const merged = [...stored, ...mock.notifications];
  // Remove duplicates by id
  const seen = new Set<string>();
  const unique = merged.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });

  const unreadCount = unique.filter((n) => !n.read).length;
  return { unreadCount, notifications: unique };
}

/**
 * GET /api/deals/notifications?repName=...
 * Returns recent notifications and unread count for the bell icon.
 */
export function getNotifications(repName?: string): Promise<ApiFetchResult<NotificationsResponse>> {
  const url = repName
    ? `/api/deals/notifications?repName=${encodeURIComponent(repName)}`
    : "/api/deals/notifications";
  const mergedFallback = mergeWithStoredNotifications(MOCK_NOTIFICATIONS);
  return apiFetch<NotificationsResponse>(url, mergedFallback);
}

// ─── PATCH / POST Mutations ───────────────────────────────────
// Mutations use optimistic mock responses on failure so the UI
// doesn't break.

/**
 * PATCH /api/deals/:dealId
 * Updates stage, amount, forecastCategory, nextStep, closeDate.
 * Triggered by "Save Changes" on the Update CRM tab.
 */
export async function updateDeal(
  dealId: string,
  body: Partial<CrmFields>
): Promise<{ message: string; dealId: string; updatedFields: Partial<CrmFields>; status: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[updateDeal] PATCH /api/deals/${dealId} failed (${err}). Returning optimistic mock.`);
    return {
      message: "Updated (mock — backend not yet connected)",
      dealId,
      updatedFields: body,
      status: "ok",
    };
  }
}

/**
 * PATCH /api/deals/:dealId/playbook/criteria/:criterionId
 * Updates the completion status of a single MEDDIC criterion.
 * status must be "Completed" | "Pending" | "N/A"
 */
export async function updatePlaybookCriterion(
  dealId: string,
  criterionId: string,
  status: "Completed" | "Pending" | "N/A"
): Promise<{ message: string; criterionId: string; updatedStatus: string }> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/deals/${dealId}/playbook/criteria/${criterionId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[updatePlaybookCriterion] failed (${err}). Returning optimistic mock.`);
    return {
      message: "Updated (mock — backend not yet connected)",
      criterionId,
      updatedStatus: status,
    };
  }
}

/**
 * PATCH /api/deals/:dealId/warnings/:warningId
 * Marks a specific warning as resolved.
 * Body: { status: "resolved" }
 */
export async function resolveWarning(
  dealId: string,
  warningId: string
): Promise<{ message: string; warningId: string; status: string }> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/deals/${dealId}/warnings/${warningId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[resolveWarning] failed (${err}). Returning optimistic mock.`);
    return {
      message: "Resolved (mock — backend not yet connected)",
      warningId,
      status: "resolved",
    };
  }
}

/**
 * POST /api/deals/:dealId/warnings/:warningId/action
 * Triggers the recommended action for a warning
 * (e.g. schedule a call, send email).
 */
export async function triggerWarningAction(
  dealId: string,
  warningId: string
): Promise<{ message: string; actionTriggered: boolean; status: string }> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/deals/${dealId}/warnings/${warningId}/action`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[triggerWarningAction] failed (${err}). Returning optimistic mock.`);
    return {
      message: "Action triggered (mock — backend not yet connected)",
      actionTriggered: true,
      status: "ok",
    };
  }
}

/**
 * PATCH /api/deals/notifications/read-all?repName=...
 * Marks all notifications as read.
 * Triggered by "Mark All as Read" button.
 */
export async function markAllNotificationsRead(repName?: string): Promise<{
  message: string;
  status: string;
}> {
  try {
    const url = repName
      ? `${BASE_URL}/api/deals/notifications/read-all?repName=${encodeURIComponent(repName)}`
      : `${BASE_URL}/api/deals/notifications/read-all`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    markAllStoredRead();
    return await res.json();
  } catch (err) {
    console.warn(`[markAllNotificationsRead] failed (${err}). Returning optimistic mock.`);
    markAllStoredRead();
    return {
      message: "All marked as read (mock — backend not yet connected)",
      status: "ok",
    };
  }
}


