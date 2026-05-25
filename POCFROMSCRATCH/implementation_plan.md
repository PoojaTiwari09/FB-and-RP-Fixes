# Revenue Intelligence Dashboard — Phased Implementation Plan

## Project Context

- **Stack:** NestJS API (port 3001) · Next.js 16 (port 3000) · FastAPI/Groq LLM (port 8000) · Supabase Cloud · HubSpot Private App
- **Repo:** `c:\Users\Relanto\Downloads\POCFROMSCRATCH`
- **Run:** `npm run dev:api` · `npm run dev:web` · `npm run dev:ai`
- **Rule:** Each phase ends with ✋ a manual test checkpoint. AI must **ask the user to verify** before proceeding to the next phase.
- **HubSpot Portal ID:** `246259639` · Token key: `HUBSPOT_ACCESS_TOKEN` in `.env.local`
- **Supabase:** Cloud (not local Docker). Keys: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

---

## ✅ Fully Completed — Do Not Re-Implement

### From original build
| Feature | Where |
|---|---|
| BF-02 Tab Filter Engine (AND/OR conditions, 8 field types) | `accounts.service.ts` — `applyTabFilter()` |
| BF-06 RBAC / Permission Profiles (role-based column visibility) | `permission_profiles` table · frontend `visible_to_roles` |
| BF-09 CRM Field Edit Write-Back (HubSpot + Supabase) | `apps/api/src/edits/` |
| BF-10 Multi-Board Orchestration (board switching, session) | `GET /boards` · `useSessionStore.ts` |
| BF-11 Activity Aggregation (21-day windows, zero-activity flags) | `accounts.service.ts` |
| BF-12 AI Brief Generation (Groq LLM, structured output, caching) | `services/ai/main.py` · `POST /ai/summary` |
| BF-13 Ask Anything / NL Query Service | `services/ai/main.py` · `POST /ai/chat` |
| BF-14 Manager Team-View Filter (multi-rep_id) | `GET /accounts?rep_id=...` |
| BF-16 Activity Timeline API | `GET /activities/:hubspotId` |
| BF-17 Board Filtering & Sorting API | Tab filter · sort · pagination · session persistence |
| BF-18 Account Panel Data API | `GET /accounts/:hubspotId` |
| BF-19 To-Dos & Notes API | `apps/api/src/todos/` — full CRUD |
| BF-22 Board Session Persistence | `useSessionStore.ts` Zustand `persist` middleware |

---

## Phase 0.5 — HubSpot Modern Activity Architecture ✅

| What | Detail |
|---|---|
| **Dual-bubble sparkline (BF-21)** | `ActivityTimeline.tsx` — CALL shows 2 sized bubbles (rep=purple, client=pink, area ∝ talk%), EMAIL shows filled/hollow dot, MEETING shows grey dot |
| **Sparkline date fix** | `accounts.service.ts` — `days_ago` now relative to per-company latest activity (not `Date.now()`), so 2024 seed data displays correctly |
| **Sparkline legend + tooltip** | `ActivityTimeline.tsx` — `showLegend` prop, `getOutcomeLabel()`, outcome shown in tooltip |
| **AccountPanel null guards** | `AccountPanel.tsx` — null-safe `risk_label`, `ai_risk_score`, `activity.type` |
| **HubSpot Call objects seeded** | `scripts/seed-hubspot-calls.ts` — 36 Call objects + 36 Note objects in HubSpot, each with talk% stats. Saved to `data/hubspot-calls-map.json` |

---

## Phase 1 — Quick API Fixes ✅

| Feature | What was done |
|---|---|
| **BF-20 Active-Account Sourcing Filter** | `accounts.service.ts` — only companies with ≥1 activity on the board appear. Mandatory, cannot be overridden. |
| **BF-05 Date Range Filter** | `accounts.service.ts` — `getPeriodCutoff()` helper; `period` param filters activity window. Frontend dropdown (All Time / Last 7 / 30 / 90 days) wired to session store + API call. |
| **BF-15 Engagement Gap Summary** | `GET /accounts/engagement-gap?board_slug=...` returns `zero_activity_count`, `zero_activity_arr`, and account list. |

---

## Phase 2 — Board Management CRUD ✅

| Feature | What was done |
|---|---|
| `PUT /boards/:slug` | Update name, description, default_sort_field, default_sort_dir |
| `POST /boards/:slug/duplicate` | Deep-copies board_config + board_tabs + board_columns with new IDs |
| `DELETE /boards/:slug` | Cascade deletes columns → tabs → config |
| `BoardSettingsPanel.tsx` | ⋯ ellipsis menu (manager/admin only) — Edit modal, Duplicate (one-click), Delete (confirm dialog) with redirect |
| Frontend wiring | `page.tsx` handlers: `handleBoardUpdated`, `handleBoardDuplicated`, `handleBoardDeleted` |

---

## Phase 3 — Board Creation Wizard + Column Config API ✅

| Feature | What was done |
|---|---|
| `POST /boards` (4-step wizard) | `boards.service.ts` — `validateBoardStep()` + `finalizeBoard()`. Steps 1–4 validated. `parent_board_slug` stored for company pool inheritance. |
| `POST /boards/:slug/columns` | Add column (max 15, deduplication check) |
| `PUT /boards/:slug/columns/:colId` | Update column label/order/visibility |
| `DELETE /boards/:slug/columns/:colId` | Remove optional column (name + exit_arr protected) |
| `CreateBoardWizard.tsx` | 4-step wizard with step indicator. Step 1 includes Company Source dropdown (picks `parent_board_slug`) so new boards inherit company pool from an existing board. |
| `BoardSettingsPanel.tsx` — Columns tab | Active columns list with ✕ remove buttons (required columns protected). Add column grid from available fields. |

> [!NOTE]
> **`parent_board_slug` SQL migration required if not run yet:**
> ```sql
> ALTER TABLE board_config ADD COLUMN IF NOT EXISTS parent_board_slug TEXT DEFAULT NULL;
> ```
> Run in Supabase → SQL Editor → https://supabase.com/dashboard/project/cjpmmdnttgerqbshnchd/editor

---

## Phase 4 — AI Brief Configuration API ✅

| Feature | What was done |
|---|---|
| `PATCH /boards/:slug/brief-config` | `boards.service.ts` — `updateBriefConfig()` stores `ai_briefs_enabled`, `brief_type`, `brief_period_days`. Validates: brief_type ∈ {full, summary, risk_only}, period_days ∈ {7,30,60,90}. |
| Board response shape | `getAllBoards()` now returns `brief_type` + `brief_period_days` alongside `ai_briefs_enabled` |
| SQL migration `003_brief_config.sql` | `ALTER TABLE board_config ADD COLUMN IF NOT EXISTS brief_type TEXT NOT NULL DEFAULT 'full', ADD COLUMN IF NOT EXISTS brief_period_days INT NOT NULL DEFAULT 30;` — **run this if not done** |
| `updateBriefConfig` API helper | `apps/web/src/lib/api.ts` |
| `BoardConfig` type | Added `brief_type: string` + `brief_period_days: number` |
| `BoardSettingsPanel.tsx` — AI Briefs tab | Toggle on/off + Brief Type dropdown (Full/Summary/Risk Focus) + Default Time Window dropdown (7/30/60/90 days). Save button calls `PATCH /boards/:slug/brief-config` separately from general settings. |
| Session store (`useSessionStore.ts`) | Added `aiBriefsEnabled`, `boardBriefPeriodDays`, `boardBriefType`, `setBoardBriefConfig`. Default `boardBriefPeriodDays: 0` (sentinel; real value injected on board load). |
| `AccountPanel.tsx` | Hides AI Briefs tab when `aiBriefsEnabled=false`. `briefPeriod` is derived as `briefPeriodOverride ?? (boardBriefPeriodDays \|\| 90)` — store-driven with user override. Syncs when `boardBriefPeriodDays` changes. |
| `page.tsx` | Calls `setBoardBriefConfig` on board load + on `handleBoardUpdated`. Uses individual `useSessionStore((s) => s.field)` selectors (not full destructure) to prevent infinite re-render loops. |

> [!IMPORTANT]
> **SQL migration for Phase 4** (run in Supabase SQL Editor if not already done):
> ```sql
> ALTER TABLE board_config
>   ADD COLUMN IF NOT EXISTS brief_type TEXT NOT NULL DEFAULT 'full',
>   ADD COLUMN IF NOT EXISTS brief_period_days INT NOT NULL DEFAULT 30;
> ```

> [!NOTE]
> **Confirmed working:** `PATCH /boards/commercial/brief-config` returns 200. Board response includes `brief_period_days: 7`. AccountPanel period dropdown now reflects board config. AI Briefs tab disappears when disabled.

---

## Phase 5 — Real-Time CRM Sync ✅

**Effort:** ~2 days | **Dependencies:** Phase 4 ✅ | **Features:** BF-08

### What was built

#### 5A. Scheduled Sync (every 5 minutes) ✅
**File:** `apps/api/src/sync/sync.service.ts`
- `@Interval(300_000)` decorator fires `scheduledSync()` every 5 minutes
- `runFullSync()` syncs companies (12), contacts (32), deals (29) → Supabase via upsert
- Does NOT sync crm_activities (seeded manually)
- `isSyncing` boolean guard prevents overlapping sync runs

#### 5B. Manual Sync Trigger ✅
**File:** `apps/api/src/sync/sync.controller.ts`
- `POST /sync/trigger` (admin only) → calls `runFullSync()`, returns `{ success, companies, contacts, deals, duration_ms, synced_at }`
- `GET /sync/status` → returns `{ last_sync, next_sync_in_seconds, is_syncing }`
- Role guard: non-admin returns `{ success: false, error: "Only admin role can trigger sync" }`

#### 5C. HubSpot Webhook Receiver ✅
**File:** `apps/api/src/sync/webhook.controller.ts`
- `POST /sync/hubspot-webhook` — validates `X-HubSpot-Signature-V3` HMAC (optional; set `HUBSPOT_WEBHOOK_SECRET` env var)
- Routes `company.propertyChange`, `contact.propertyChange`, `deal.propertyChange` → targeted Supabase column updates only (no full re-sync)
- **Local dev setup:** `ngrok http 3001` → copy URL → HubSpot Private App → Webhooks → Add endpoint

#### 5D. Frontend — Sync Status Bar ✅
**File:** `apps/web/src/components/board/SyncStatusBar.tsx`
- Polls `GET /sync/status` every 60s (every 3s while `is_syncing: true`)
- Shows green dot "Last synced X min ago" / red dot on error / idle dot on first load
- Animated CSS spinner during active sync
- "Sync Now" pill button (admin role only)
- Inline result badge: "✓ Synced — 12 cos, 32 contacts, 29 deals"
- Wired to board page via `onSyncComplete={loadAccounts}` — table refreshes immediately after sync

### Live sync stats confirmed
```
POST /sync/trigger → { success: true, companies: 12, contacts: 32, deals: 29, duration_ms: 6334 }
GET  /sync/status  → { last_sync: { ... }, is_syncing: false }
POST /sync/trigger (role: rep) → { success: false, error: "Only admin role can trigger sync" }
```

---

## Phase 6 — Final Polish, Edge Cases & Gong Theme ✅

**Effort:** ~1 day | **Dependencies:** Phase 5 ✅

### What was built

#### 6A. Error Boundaries & Empty States ✅
- **API error banner** — red banner with retry button when `fetchAccounts` or `fetchBoards` throws. Uses `role="alert"` for accessibility.
- **Empty state** — "No accounts match your filters" with contextual "Clear filter" button when a tab filter is active
- **Panel empty states** — "No contacts found" / "No deals found" instead of blank sections
- **AI brief fallback** — "No brief generated" state with Refresh CTA

#### 6B. Performance & UX ✅
- **300ms debounce** via `debounceRef` on all sort/filter dependency changes — prevents API spam on rapid clicks
- **Skeleton loaders** — 6 shimmer rows (`loading-skeleton` class, `@keyframes shimmer`) shown during fetch
- **Aria labels** — `aria-label`, `aria-sort`, `aria-pressed`, `aria-current`, `role="columnheader"` on all interactive elements
- **Totals row** — pinned first row showing aggregate Exit ARR + Open Deals value across current page
- **Priority star ★** — shown for `strategic_priority` accounts in the name cell
- **Keyboard nav** — table rows are `tabIndex={0}` with `onKeyDown Enter` handlers

#### 6C. Date Filter Persistence ✅
`period` field is in `partialize` in `useSessionStore` — verified to survive page refresh.

#### 6D. Gong-Inspired Light Theme ✅
Complete `globals.css` rewrite (2,000+ lines), matching the Gong Revenue Intelligence UI screenshots:

| Element | Design |
|---|---|
| **Sidebar** | Deep purple-black `#1E0A3C` · white text · purple left-border active indicator |
| **Main background** | Clean white `#F9FAFB` |
| **Board selector** | Pill tabs (rounded-full) with purple active state |
| **Filter dropdowns** | Pill style, white bg, box-shadow, purple focus ring |
| **Summary cards** | White cards with border, purple active background |
| **Data table** | White rows · 2px purple active border · totals row in `bg-tertiary` |
| **Panel sections** | Card-boxed (`panel-section`) with gray header + icon labels |
| **Panel header** | Segment badge (purple pill) + "Go to CRM ↗" button inline |
| **Activity tooltips** | Dark sidebar-bg background for high contrast |
| **Skeleton shimmer** | Light gray `#F3F4F6→#E9EAEC` (no dark flash) |
| **Toasts** | Dark sidebar-bg with colored left border |

---

## Dependency Graph

```
✅ Phase 0.5  (HubSpot Calls + Sparkline Fix)
✅ Phase 1    (BF-20, BF-05, BF-15)
     ↓
✅ Phase 2    (BF-07 Board CRUD)
     ↓
✅ Phase 3    (BF-01 Creation + BF-03 Columns)
     ↓
✅ Phase 4    (BF-04 AI Brief Config)
     ↓
✅ Phase 5    (BF-08 Real-Time Sync)
     ↓
✅ Phase 6    (Polish + Gong Theme) ← ALL PHASES COMPLETE 🎉
```

---

## Key Files Reference

| Module | Files |
|---|---|
| **NestJS Accounts** | `apps/api/src/accounts/accounts.service.ts` · `accounts.controller.ts` |
| **NestJS Boards** | `apps/api/src/boards/boards.service.ts` · `boards.controller.ts` |
| **NestJS Sync** | `apps/api/src/sync/sync.service.ts` · `sync.controller.ts` · `webhook.controller.ts` |
| **NestJS Edits** | `apps/api/src/edits/edits.service.ts` · `edits.controller.ts` |
| **NestJS Todos** | `apps/api/src/todos/todos.service.ts` · `todos.controller.ts` |
| **FastAPI AI** | `services/ai/main.py` |
| **Frontend Board Page** | `apps/web/src/app/board/[slug]/page.tsx` |
| **Frontend Board Components** | `apps/web/src/components/board/SyncStatusBar.tsx` · `BoardSettingsPanel.tsx` · `CreateBoardWizard.tsx` · `ActivityTimeline.tsx` |
| **Frontend Panel** | `apps/web/src/components/panel/AccountPanel.tsx` |
| **Frontend UI Utils** | `apps/web/src/components/ui/ToastContainer.tsx` · `InlineEdit.tsx` |
| **Frontend Store** | `apps/web/src/store/useSessionStore.ts` · `usePanelStore.ts` |
| **Frontend API Lib** | `apps/web/src/lib/api.ts` |
| **Design System** | `apps/web/src/app/globals.css` |
| **Supabase Schema** | `supabase/migrations/001_initial_schema.sql` |
| **Supabase Migrations** | `002_parent_board_slug.sql` · `003_brief_config.sql` |
| **Seed Scripts** | `scripts/seed-hubspot.ts` · `seed-supabase.ts` · `seed-hubspot-calls.ts` · `sync-once.ts` |
| **Seed Data** | `data/seed-p1-foundation.json` · `seed-p2-deals.json` · `seed-p3-activities.json` · `seed-p4-supplementary.json` |
| **ID Maps** | `data/hubspot-id-map.json` · `data/hubspot-calls-map.json` |

---

## Live Data Snapshot (as of Phase 5 sync)

| Entity | Count | Source |
|---|---|---|
| Companies (`crm_companies`) | 12 | HubSpot → Supabase (sync) |
| Contacts (`crm_contacts`) | 32 | HubSpot → Supabase (sync) |
| Deals (`crm_deals`) | 29 | HubSpot → Supabase (sync) |
| Activities (`crm_activities`) | ~36+ | Seeded via `seed-hubspot-calls.ts` (not synced) |
| Boards | 3 | `commercial`, `enterprise`, `startup` (or custom) |
| Tabs per board | 4–5 | Renewal · Upsell · Churn · Strategic |

---

## Known Constraints & Gotchas

| Item | Detail |
|---|---|
| `crm_companies.last_activity_date` | Does NOT exist as a DB column — computed from `crm_activities`. Sorted in-memory in `accounts.service.ts`. |
| HubSpot `deal_type` property | Clashes with internal `dealtype`. Managed in Supabase only, not pushed to HubSpot. |
| Activity dates | Seed data uses 2024 timestamps. Sparkline uses per-company latest activity as reference, not `Date.now()`. |
| Note→Call association | HubSpot v4 default association not supported (400). Notes are associated to Company/Contact only — harmless. |
| Supabase `board` column on `crm_companies` | Set by `sync-once.ts` via HubSpot `board_assignment` custom property. If sync is re-run, it re-populates correctly. |
| 32 contacts in Supabase | 30 seeded + 2 default HubSpot contacts. The 2 extras have no company associations — safe to ignore. |
| `useSessionStore` selectors | Must use individual `useSessionStore((s) => s.field)` selectors — NOT full destructure `useSessionStore()`. Full destructure causes infinite re-renders when any store field changes. |
| `brief_period_days` store default | Set to `0` (sentinel). Real value injected by `setBoardBriefConfig` on board load. AccountPanel uses `boardBriefPeriodDays \|\| 90` as fallback so it never shows `0`. |
| `BoardSettingsPanel.tsx` | AI Briefs tab save calls `PATCH /boards/:slug/brief-config` (not the general `PUT /boards/:slug`). General tab save does NOT persist AI brief settings. |
| `SyncService` concurrency | `isSyncing` boolean guard prevents overlapping runs. If the API crashes mid-sync, restart `dev:api` to reset the flag. |
| Webhook signature validation | `HUBSPOT_WEBHOOK_SECRET` env var is optional. If not set, signature check is skipped. Set it in `.env.local` for production-like security. |
| CSS globals rewrite (Phase 6) | All dark-theme classes replaced with light-theme tokens. If any component references old dark CSS vars (e.g., `--bg-elevated`, old `--surface-glass`) it will fall back gracefully but may look off. |
