# Manager – Review & Reassign Training + Fix Review 404

## Background

Two items:

1. **Review button 404 (fixed):** The "Review" button on completed training rows was showing a 404. Root cause: **stale `.next` cache**. After clearing `.next` and restarting the dev server, the route `/training/[trainingId]/sessions/[sessionId]/results` resolves correctly (200). The route files were always in the right place — this was never a code bug. **No code change needed — just a restart.**

2. **Manager Review & Reassign:** New manager-side functionality to review a rep's completed practice and optionally reassign the training.

---

## User Review Required

> [!IMPORTANT]
> The Figma spec (`Figma_Coaching-AI-Trainer.txt`) has **no manager screens defined** — it covers only the Sales Rep flow (Dashboard → Setup → Session → Results). This plan designs the manager experience from scratch, borrowing styles from the existing rep views.

> [!IMPORTANT]
> **Routing decision:** The `/training` prefix is currently in `REP_ONLY_PREFIXES` in [middleware.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/middleware.ts). The plan creates a new route at `/training/manage` and updates the middleware to allow **both roles** to access `/training`. The manager sidebar will get a "Coaching > AI Trainer" nav item pointing to `/training/manage`.

> [!IMPORTANT]
> **Reassignment creates a new row on the rep side.** Since there's no real backend, mock mode will add the reassigned training to an in-memory store that the rep's `fetchTrainingDashboard()` also reads. This makes the end-to-end demo work across role switches within a single browser session.

---

## Open Questions

> [!NOTE]
> **Q1:** When a manager views a rep's results, should they see the exact same results page the rep sees? Or a stripped-down read-only view? **Current plan: reuse the exact same Results page components.**

> [!NOTE]
> **Q2:** After reassignment, should the manager's table row status change to "Reassigned"? Or should it stay as "Completed" with a "Reassigned" badge? **Current plan: show a "Reassigned" badge on the row and disable the Reassign button.**

---

## Proposed Changes

### 1. Fix Review 404

No code change. Root cause was stale `.next` cache. Clearing it fixed the issue. **If the user still sees the 404, they just need to stop the old dev server, delete `.next`, and restart.**

---

### 2. Types

#### [NEW] [trainingManager.types.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/types/trainingManager.types.ts)

```typescript
export interface ManagedRepTraining {
  id: string;                  // training ID
  repId: string;               // the sales rep who did it
  repName: string;             // display name
  trainingTitle: string;
  completedDate: string;       // ISO date
  overallScore: number;        // 0–100
  overallRating: string;       // "Good", "Needs Practice", etc.
  lastSessionId: string;       // for navigating to results
  isReassigned: boolean;       // true if manager already reassigned
}

export interface ManagerDashboardPage {
  trainings: ManagedRepTraining[];
}

export interface ReassignResponse {
  success: boolean;
  newTrainingId: string;       // the newly created training row ID on rep side
}
```

---

### 3. Mocks

#### [NEW] [trainingManager.mock.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/mocks/trainingManager.mock.ts)

- 3–4 completed trainings for "Alex Chen" (rep-001) with varied scores
- An in-memory `reassignedTrainings` array that `reassignTraining()` pushes to, and `fetchTrainingDashboard()` reads from to show new rep-side rows
- Export `getReassignedRepTrainings()` for the rep dashboard to pick up

---

### 4. Services

#### [NEW] [trainingManager.service.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/services/trainingManager.service.ts)

Two functions following the same `USE_MOCK_DATA` pattern:

**`fetchManagerDashboard(): Promise<ManagerDashboardPage>`**
- Mock mode: return `MANAGER_DASHBOARD_MOCK` + merge any `isReassigned` state
- Real mode: `GET /api/manager/trainings` (all completed trainings across reps)
- Fallback: mock on failure

**`reassignTraining(trainingId: string, repId: string): Promise<ReassignResponse>`**
- Mock mode: push to in-memory `reassignedTrainings`, mark row as `isReassigned`, return mock response
- Real mode: `POST /api/manager/trainings/:trainingId/reassign` with `{ repId }`
- Fallback: mock on failure

#### [MODIFY] [trainingDashboard.service.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/services/trainingDashboard.service.ts)

- In mock mode, append any entries from `getReassignedRepTrainings()` to the dashboard trainings list. This makes newly reassigned trainings appear on the rep side during demo.

---

### 5. Manager Components

All under `src/features/training/components/manager/`:

#### [NEW] ManagerTrainingTable.tsx
- Same table structure as rep's [TrainingTable.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/components/rep/Dashboard/TrainingTable.tsx)
- Columns: **Rep Name**, **Training Title**, **Completed Date**, **Score**, **Action**
- Action column: "Review" button + "Reassign" button
- Reuses `TrainingStatusBadge` (or a "Reassigned" variant)

#### [NEW] ManagerTrainingTableRow.tsx
- One row per `ManagedRepTraining`
- Score shown as a number badge with color (green ≥80, amber <80)
- "Review" link → `/training/manage/[trainingId]/sessions/[sessionId]/results`
- "Reassign" button → calls `reassignTraining()`, then shows confirmation toast and disables button
- If `isReassigned`, show "Reassigned ✓" badge instead of Reassign button

#### [NEW] ReassignConfirmModal.tsx
- Lightweight modal: "Are you sure you want to reassign *{trainingTitle}* to *{repName}*?"
- Confirm / Cancel
- Shows loading spinner on confirm

---

### 6. Routes

#### [NEW] [/training/manage/page.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/app/(dashboard)/training/manage/page.tsx)

Manager dashboard page:
- Title: "Team Training Review"
- Subtitle: "{count} completed sessions to review"
- Renders `ManagerTrainingTable`
- Server component, calls `fetchManagerDashboard()`

#### Manager Results — reuse existing results route

The manager's "Review" link navigates to `/training/manage/[trainingId]/sessions/[sessionId]/results`. To avoid duplicating the entire results page, we have two options:

**Option A (recommended):** Create a thin wrapper page at `/training/manage/[trainingId]/sessions/[sessionId]/results/page.tsx` that imports and reuses the same `ResultsHeader`, `OverallScoreCard`, and `ResultsTabSwitcher` components. Adds a "Back to Team Review" link instead of "Back to Dashboard".

**Option B:** Use a shared `(training-results)` route group. More complex, less clear.

Going with **Option A**.

#### [NEW] [/training/manage/[trainingId]/sessions/[sessionId]/results/page.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/app/(dashboard)/training/manage/[trainingId]/sessions/[sessionId]/results/page.tsx)

Same as the rep results page but:
- "Back to Team Review" link instead of "Back to Dashboard"
- Optional: "Reassign Training" button in the header area

---

### 7. Middleware Update

#### [MODIFY] [middleware.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/middleware.ts)

Current:
```typescript
const REP_ONLY_PREFIXES = ['/training', ...];
```

Change to:
```typescript
const REP_ONLY_PREFIXES = ['/training/[^m]', ...]; // everything except /training/manage
```

Actually, cleaner approach: remove `/training` from `REP_ONLY_PREFIXES` and add specific sub-route checks:

```typescript
// Rep-only: /training but NOT /training/manage
// Manager-only: /training/manage
```

The middleware will be updated to:
- Allow reps to access `/training` (but not `/training/manage`)
- Allow managers to access `/training/manage` (but not `/training` root or `/training/:id`)

---

### 8. Sidebar Update

#### [MODIFY] [Sidebar.tsx](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/shared/components/Sidebar/Sidebar.tsx)

Add to `managerNavItems`:
```typescript
{
  label: 'Coaching',
  icon: <GraduationCap size={18} />,
  subItems: [
    { label: 'AI Trainer Review', icon: <Bot size={16} />, href: '/training/manage' },
  ],
},
```

---

### 9. Rep Dashboard — Show Reassigned Trainings

#### [MODIFY] [trainingDashboard.service.ts](file:///c:/Users/Relanto/Downloads/FrontendCombined/Revenue-Intelligence-UI/src/features/training/services/trainingDashboard.service.ts)

In mock mode, merge `getReassignedRepTrainings()` into the dashboard trainings array. This makes the demo loop work:
1. Manager reviews → clicks "Reassign"
2. Switch to rep role → refreshes dashboard → sees new "in-progress" row

---

## File Summary

| Action | File | Purpose |
|--------|------|---------|
| NEW | `types/trainingManager.types.ts` | Manager types |
| NEW | `mocks/trainingManager.mock.ts` | Manager mock data + in-memory reassign store |
| NEW | `services/trainingManager.service.ts` | Manager fetch + reassign services |
| NEW | `components/manager/ManagerTrainingTable.tsx` | Table component |
| NEW | `components/manager/ManagerTrainingTableRow.tsx` | Row component |
| NEW | `components/manager/ReassignConfirmModal.tsx` | Confirmation modal |
| NEW | `app/(dashboard)/training/manage/page.tsx` | Manager dashboard page |
| NEW | `app/(dashboard)/training/manage/[trainingId]/sessions/[sessionId]/results/page.tsx` | Manager results view |
| MODIFY | `middleware.ts` | Allow managers on `/training/manage` |
| MODIFY | `Sidebar.tsx` | Add "AI Trainer Review" to manager nav |
| MODIFY | `trainingDashboard.service.ts` | Merge reassigned trainings in mock mode |

---

## Verification Plan

### Automated Tests
- `npx tsc --noEmit` — TypeScript compiles cleanly
- Test all route status codes via `Invoke-WebRequest`

### Manual Verification (in browser)
1. **Rep flow (unchanged):**
   - Visit `/training` as rep → dashboard loads, "Review" button on completed row works (no more 404)
   - After manager reassigns, refresh rep dashboard → new row appears

2. **Manager flow (new):**
   - Set `user_role=sales_manager` cookie → sidebar shows "AI Trainer Review"
   - Visit `/training/manage` → table of completed rep trainings
   - Click "Review" → see rep's results (read-only)
   - Click "Reassign" → confirmation modal → confirm → row shows "Reassigned ✓"
   - Switch back to rep cookie → refresh `/training` → reassigned training appears as new in-progress row
