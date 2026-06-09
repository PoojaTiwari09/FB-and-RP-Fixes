// ============================================================
// apiHandler.ts — All API calls with mock fallback mechanism
//
// HOW IT WORKS:
//   apiFetch() calls the real endpoint first.
//   If the endpoint errors (network failure, 4xx, 5xx),
//   it falls back to the mock seed data so the UI always renders.
//
// HOW TO GO LIVE:
//   1. Set NEXT_PUBLIC_API_BASE_URL in your .env.local
//   2. Backend devs ship real endpoints
//   3. Real data flows automatically — no code changes needed
//   4. Once confirmed working, delete the catch blocks and
//      the fallbackData params, then delete mockSeeds.ts
//
// DEV TIP:
//   Check `isMock` on the returned object to show a "Mock Data"
//   badge in your UI during development.
// ============================================================

import { DealBoard, BoardDetail, Deal, BriefData, Warning, PlaybookData, PlaybookCriterion, ActivityData, CrmFields, StageOptions, Notification, NotificationsResponse } from '../types/deal-boards.types';
import { MOCK_DEAL_BOARDS, MOCK_BOARD_DETAIL, MOCK_DEALS, MOCK_BRIEF, MOCK_WARNINGS, MOCK_PLAYBOOK, MOCK_ACTIVITY, MOCK_CRM_FIELDS, MOCK_STAGE_OPTIONS, MOCK_NOTIFICATIONS } from '../mocks/deal-boards.mocks';

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
// Set NEXT_PUBLIC_API_BASE_URL in .env.local for your environment.
// Leave blank ("") to call relative paths (same-origin proxy).

import { ENV } from '@shared/config/env';
const BASE_URL = ENV.API_BASE_URL;

// ─── Core Fetch Utility ───────────────────────────────────────

export interface ApiFetchResult<T> {
  data: T;
  isMock: boolean;
}

/**
 * apiFetch — wraps fetch with automatic mock fallback.
 *
 * @param endpoint     - e.g. "/api/deal-boards"
 * @param fallbackData - mock data returned if real call fails
 * @param options      - standard RequestInit (method, body, headers…)
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
      console.warn(
        `[apiFetch] ${endpoint} → HTTP ${res.status}. Using mock fallback.`
      );
      return { data: fallbackData, isMock: true };
    }

    const json = await res.json();
    const responseData = (json && typeof json === 'object' && 'data' in json) ? (json as any).data : json;
    return { data: responseData as T, isMock: (json as any).isMock ?? false };
  } catch (err) {
    console.warn(
      `[apiFetch] ${endpoint} → fetch failed (${err}). Using mock fallback.`
    );
    return { data: fallbackData, isMock: true };
  }
}

// ─── GET Endpoints ────────────────────────────────────────────

/**
 * GET /api/deal-boards
 * Returns all deal board cards shown on the Deal Boards list screen.
 */
export function getDealBoards(): Promise<ApiFetchResult<DealBoard[]>> {
  return apiFetch<DealBoard[]>("/api/deal-boards", MOCK_DEAL_BOARDS);
}

/**
 * GET /api/deal-boards/:boardId
 * Returns board name, ownerTag, and summary cards (Open / Commit /
 * Most Likely / Best Case / Closed Won / Closed Lost).
 */
export function getBoardDetail(
  boardId: string
): Promise<ApiFetchResult<BoardDetail>> {
  return apiFetch<BoardDetail>(
    `/api/deal-boards/${boardId}`,
    MOCK_BOARD_DETAIL[boardId] ?? MOCK_BOARD_DETAIL["board-1"]
  );
}

/**
 * GET /api/deal-boards/:boardId/deals
 * Returns ALL deals for the board — no server-side filtering.
 *
 * Filtering (stage, forecastCategory, amount range, closeDate) and
 * grouping (by stage / by rep) are handled client-side in the
 * frontend. Only this one endpoint is required from the backend.
 */
export function getDeals(
  boardId: string
): Promise<ApiFetchResult<Deal[]>> {
  return apiFetch<Deal[]>(
    `/api/deal-boards/${boardId}/deals`,
    MOCK_DEALS[boardId] ?? MOCK_DEALS["board-1"]
  );
}

/**
 * GET /api/deals/:dealId/brief
 * Returns AI summary, what changed this week, buyer sentiment,
 * last interaction, and key risks. Default tab on deal open.
 */
export function getDealBrief(
  dealId: string
): Promise<ApiFetchResult<BriefData>> {
  return apiFetch<BriefData>(
    `/api/deals/${dealId}/brief`,
    MOCK_BRIEF[dealId] ?? MOCK_BRIEF["deal-1"]
  );
}

/**
 * GET /api/deals/:dealId/warnings
 * Returns all AI warnings for a deal with severity and status.
 */
export function getDealWarnings(
  dealId: string
): Promise<ApiFetchResult<Warning[]>> {
  return apiFetch<Warning[]>(
    `/api/deals/${dealId}/warnings`,
    MOCK_WARNINGS[dealId] ?? []
  );
}

/**
 * GET /api/deals/:dealId/playbook
 * Returns MEDDIC playbook criteria, completion status, score %, and
 * AI-suggested notes per criterion.
 */
export function getDealPlaybook(
  dealId: string
): Promise<ApiFetchResult<PlaybookData>> {
  return apiFetch<PlaybookData>(
    `/api/deals/${dealId}/playbook`,
    MOCK_PLAYBOOK[dealId] ?? MOCK_PLAYBOOK["deal-1"]
  );
}

/**
 * GET /api/deals/:dealId/activity
 * Returns activity timeline with interaction counts and dated events.
 */
export function getDealActivity(
  dealId: string
): Promise<ApiFetchResult<ActivityData>> {
  return apiFetch<ActivityData>(
    `/api/deals/${dealId}/activity`,
    MOCK_ACTIVITY[dealId] ?? MOCK_ACTIVITY["deal-1"]
  );
}

/**
 * GET /api/deals/:dealId/crm-fields
 * Returns current editable CRM fields for the Update CRM tab.
 */
export function getDealCrmFields(
  dealId: string
): Promise<ApiFetchResult<CrmFields>> {
  return apiFetch<CrmFields>(
    `/api/deals/${dealId}/crm-fields`,
    MOCK_CRM_FIELDS[dealId] ?? MOCK_CRM_FIELDS["deal-1"]
  );
}

/**
 * GET /api/deals/stage-options
 * Returns available pipeline stages and forecast categories for
 * dropdowns in the Update CRM tab and filter panel.
 */
export function getStageOptions(): Promise<ApiFetchResult<StageOptions>> {
  return apiFetch<StageOptions>("/api/deals/stage-options", MOCK_STAGE_OPTIONS);
}

/**
 * GET /api/notifications
 * Returns recent notifications and unread count for the bell icon.
 */
export function getNotifications(): Promise<
  ApiFetchResult<NotificationsResponse>
> {
  return apiFetch<NotificationsResponse>(
    "/api/notifications",
    MOCK_NOTIFICATIONS
  );
}

// ─── PATCH / POST Mutations ───────────────────────────────────
// Mutations use optimistic mock responses on failure so the UI
// doesn't break. Remove the catch fallbacks once backend is live.

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
    console.warn(
      `[updatePlaybookCriterion] failed (${err}). Returning optimistic mock.`
    );
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
    console.warn(
      `[triggerWarningAction] failed (${err}). Returning optimistic mock.`
    );
    return {
      message: "Action triggered (mock — backend not yet connected)",
      actionTriggered: true,
      status: "ok",
    };
  }
}

/**
 * PATCH /api/notifications/read-all
 * Marks all notifications as read.
 * Triggered by "Mark All as Read" button.
 */
export async function markAllNotificationsRead(): Promise<{
  message: string;
  status: string;
}> {
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(
      `[markAllNotificationsRead] failed (${err}). Returning optimistic mock.`
    );
    return {
      message: "All marked as read (mock — backend not yet connected)",
      status: "ok",
    };
  }
}


