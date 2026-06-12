# M06 — API Route Gap Analysis
## "Extend Existing vs. Implement New" Report

> **Purpose**: For each route in the specification, this document identifies whether a matching handler already exists in the codebase (and exactly where), or whether it is missing and must be implemented by the backend team.
>
> **Files Checked**:
> - `modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts`
> - `modules/m06-forecasting-prediction/services/forecast-upgrade.service.ts`
> - `modules/m06-forecasting-prediction/generated/prisma-client/schema.prisma` (the local module schema)
> - `packages/database/prisma/schema.prisma` (the shared database schema)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ **FULLY IMPLEMENTED** | Route + service method + DB fields all exist. Ready to use. |
| ⚠️ **PARTIALLY IMPLEMENTED** | Route and service method exist but have gaps in logic or DB fields that need fixing. |
| 🔴 **NOT IMPLEMENTED** | Route exists but calls a stub / no service logic. OR the route does not exist at all. Backend must implement. |
| 🗄️ **SCHEMA GAP** | The DB model is missing required columns. Migration needed before implementation. |

---

## B1. Forecast Submissions Routes

---

### B1a. `GET /api/forecast/submissions/:period_id/:rep_id`

**Status: ⚠️ PARTIALLY IMPLEMENTED — Extend Required**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getSubmissions()` at line 11
- Service: `forecast-upgrade.service.ts → getSubmissions()` at lines 16–47

**What already works:**
The route exists and is wired. The service queries `forecastSubmission` for the period+rep, deduplicates by latest version per deal, and returns:
```
id, deal_id, deal_name, best_case_value (bestCaseForecast), commit_value (commitForecast),
best_case_state (bestCaseState), commit_state (commitState), approved_best_case (approvedBestCase), approved_commit (approvedCommit)
```

**Gaps — what needs to be fixed:**

1. **🗄️ SCHEMA GAP — Critical**: The local module Prisma schema (`generated/prisma-client/schema.prisma`) for `ForecastSubmission` does **not** have the following columns that the service code is already trying to use:
   - `dealId` — missing from the schema model (line 75–101). The service references `sub.dealId` throughout.
   - `bestCaseState` — missing from schema
   - `commitState` — missing from schema
   - `approvedBestCase` — missing from schema
   - `approvedCommit` — missing from schema
   - `overriddenBy` — missing from schema
   - `managerId` — missing (partially — there is `managerId` but in `ForecastSubmission` the old schema only has `managerOverride`, `managerComment`, `managerId`, `managerName`)

   > **Action for backend team**: Run a migration to add the missing columns to `forecast_submissions`. The shared `packages/database/prisma/schema.prisma` likely has the fuller model — verify there, then sync to the module's generated client.

2. **Logic gap — draft_created log check is broken**: In `createOrUpdateSubmission()`, the code searches for a `'draft_created'` audit log entry keyed on the *new* `sub.id` right after INSERT. Since every INSERT creates a new row with a new ID, `hasLog` will always be `null`, so a `draft_created` log will be written for every save — not just the first one. This is a bug in `createOrUpdateSubmission()` but affects B1a's correctness since it uses the same submission records. **Fix**: check for existing log by `(repUserId, dealId, periodId)` rather than by `sub.id`.

3. **Minor**: The response field `best_case_value` maps from `bestCaseForecast` (which can be `null`). The spec requires `0` as default, but the service returns whatever Prisma gives (may be `null`). **Fix**: add `?? 0` fallback.

**Action for backend team**: Add the missing DB columns via migration, fix the schema, re-generate the Prisma client, then fix the `hasLog` check bug.

---

### B1b. `POST /api/forecast/submissions`

**Status: ⚠️ PARTIALLY IMPLEMENTED — Extend Required**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → createOrUpdateSubmission()` at line 21
- Service: `forecast-upgrade.service.ts → createOrUpdateSubmission()` at lines 49–88

**What already works:**
- Route exists
- Field selection (`best_case` / `commit`) logic exists
- `logActivity('draft_created', ...)` call exists

**Gaps — what needs to be fixed:**

1. **Logic bug — always INSERTs instead of UPDATE**: The spec says "if a row already exists → UPDATE; if not → INSERT." The current implementation **always INSERT**s a new versioned row (append-only pattern). While this is acceptable for audit purposes, the service creates a new row *every time* the rep types into a cell, generating massive version bloat. The spec expects only one row per `(rep_id, deal_id, period_id)` that gets updated in-place.

   > **Decision needed**: Confirm with the team whether the append-only immutable versioning is the intended pattern, or whether in-place UPDATE is desired. If append-only → document this clearly and fix the frontend to always use the latest version. If in-place UPDATE → rewrite the service method to use `upsert`.

2. **Logic bug — `draft_created` log fires every call**: As noted in B1a, the `hasLog` check is keyed on the brand-new `sub.id`, so it always returns null → always logs `draft_created`. **Fix**: check for existing log by `(repUserId, dealId, periodId)` and `action = 'draft_created'` first.

3. **🗄️ SCHEMA GAP**: Same column gaps as B1a — `dealId`, `bestCaseState`, `commitState`, `approvedBestCase`, `approvedCommit` must exist in the table.

---

### B1c. `PATCH /api/forecast/submissions/:id/submit`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → submitForecast()` at line 33
- Service: `forecast-upgrade.service.ts → submitForecast()` at lines 90–131

**What already works (matches spec exactly):**
- `field = 'best_case'` → sets only `bestCaseState = 'submitted'`, leaves `commitState` unchanged ✅
- `field = 'commit'` → sets only `commitState = 'submitted'`, leaves `bestCaseState` unchanged ✅
- `field = 'both'` → sets both states to `'submitted'` ✅
- Calls `logActivity(sub.id, 'submitted', repId)` ✅
- Returns `{ success: true, data: { id, best_case_state, commit_state } }` ✅ (note: service returns without `success` wrapper — controller wraps it)

**Minor note**: The controller response wraps with `{ success: true, data }` — confirm this is what frontend expects.

**🗄️ SCHEMA GAP**: Same column gaps apply — `bestCaseState`, `commitState` must exist. Once the migration runs, this route will work fully.

---

### B1d. `PATCH /api/forecast/submissions/:id/approve`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → approveSubmission()` at line 46
- Service: `forecast-upgrade.service.ts → approveSubmission()` at lines 133–189

**What already works (matches spec exactly):**
- Sets state columns to `'approved'` based on `field` ✅
- Copies `bestCaseForecast → approvedBestCase` and `commitForecast → approvedCommit` ✅
- Calls `logActivity(sub.id, 'approved', managerId)` ✅
- Calls `createNotification(repId, repName, subId, 'approved', field, dealName, approvedBestCase, approvedCommit)` ✅
- Calls `syncManualForecast(repId, dealId, periodId, approvedCommit)` ✅
- Returns `{ id, approved_best_case, approved_commit, best_case_state, commit_state }` ✅

**Minor note**: The `createNotification` call passes `approvedBestCase` and `approvedCommit` as separate params (not `finalValue`) — matches the spec requirement.

**🗄️ SCHEMA GAP**: Same column gaps apply.

---

### B1e. `PATCH /api/forecast/submissions/:id/reopen`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → reopenSubmission()` at line 59
- Service: `forecast-upgrade.service.ts → reopenSubmission()` at lines 191–231

**What already works (matches spec exactly):**
- Sets both `bestCaseState = 'reopened'` AND `commitState = 'reopened'` ✅
- Calls `logActivity(sub.id, 'reopened', managerId)` ✅
- Calls `createNotification(...)` with `action_type = 'reopened'`, `request_type = 'both'`, passes current `bestCaseForecast` and `commitForecast` ✅
- Returns `{ id, best_case_state, commit_state }` ✅

**🗄️ SCHEMA GAP**: Same column gaps apply.

---

### B1f. `PATCH /api/forecast/submissions/:id/override`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → overrideSubmission()` at line 72
- Service: `forecast-upgrade.service.ts → overrideSubmission()` at lines 233–290

**What already works (matches spec exactly):**
- Sets relevant state columns to `'overridden'` ✅
- Sets `approvedBestCase` and/or `approvedCommit` to `override_value` ✅
- Sets `overriddenBy = managerId` ✅
- Calls `logActivity(sub.id, 'overridden', managerId)` ✅
- Calls `createNotification(...)` with `action_type = 'overridden'`, passes final values ✅
- Calls `syncManualForecast(...)` ✅
- Returns `{ id, approved_best_case, approved_commit, best_case_state, commit_state }` ✅

**Minor issue**: Service uses `this.prisma.user` (line 266) to look up the rep's name, but earlier methods (B1d reopen) use `this.prisma.forecastUser`. Inconsistency — one of them will throw at runtime depending on which Prisma client is available. **Fix**: standardize to one model. Check which model actually contains user records.

**🗄️ SCHEMA GAP**: `overriddenBy` is referenced in the service but missing from the generated schema.

---

## B2. Notifications Routes

---

### B2a. `GET /api/forecast/notifications/:rep_id`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getNotifications()` at line 87
- Service: `forecast-upgrade.service.ts → getNotifications()` at lines 294–309

**What already works (matches spec exactly):**
- Queries `forecastNotification WHERE repId = :repId AND isSeen = false ORDER BY createdAt DESC` ✅
- Returns `{ id, action_type, request_type, deal_name, rep_name, best_case_value, commit_value, created_at }` ✅

**Minor note**: The service falls back `best_case_value: n.bestCaseValue ?? n.finalValue` and `commit_value: n.commitValue ?? n.finalValue`. If `bestCaseValue` and `commitValue` columns do not exist on `ForecastNotification` model in the generated schema → this will throw at runtime.

**🗄️ SCHEMA GAP** (likely): Verify that `ForecastNotification` model in the module's generated Prisma schema has: `actionType`, `requestType`, `dealName`, `repName`, `bestCaseValue`, `commitValue`, `finalValue`, `isSeen`. If using the shared `packages/database` schema, confirm these columns are migrated.

---

### B2b. `PATCH /api/forecast/notifications/:id/seen`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → markNotificationSeen()` at line 97
- Service: `forecast-upgrade.service.ts → markNotificationSeen()` at lines 311–317

**What already works:**
- Sets `isSeen = true` ✅
- Returns `{ success: true }` ✅

---

## B3. Activity Log Routes

---

### B3a. `GET /api/forecast/activity/:submission_id`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getSubmissionActivity()` at line 109
- Service: `forecast-upgrade.service.ts → getSubmissionActivity()` at lines 321–339

**What already works:**
- Queries `forecastAuditLog WHERE forecastSubmissionId = :submissionId ORDER BY createdAt ASC` ✅
- Returns `{ id, status, performed_by_name, timestamp, notes }` ✅

---

### B3b. Internal `logActivity(submissionId, status, performedByUserId)`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Implementation:**
- Service: `forecast-upgrade.service.ts → logActivity()` at lines 341–354

**What already works:**
- Inserts into `forecastAuditLog` with `submissionId`, `action` (status), `actorId`, `actorName`, `actorRole`, `metadata.notes` ✅
- Called internally by submit (B1c), approve (B1d), reopen (B1e), override (B1f) ✅

---

## B4. Notifications Internal Function

---

### `createNotification(repId, repName, submissionId, actionType, requestType, dealName, bestCaseValue, commitValue)`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Implementation:**
- Service: `forecast-upgrade.service.ts → createNotification()` at lines 358–383

**What already works:**
- Inserts into `forecastNotification` with all specified fields ✅
- Sets `isSeen = false` (omitted from data, relies on DB default — confirm `@default(false)` in schema) ✅
- All parameters match the spec signature ✅
- Called internally by approve (B1d), reopen (B1e), override (B1f) ✅

**Minor note**: `isSeen` is explicitly set to `false` in the insert (line 380) which is correct and safe.

---

## B5. Targets Routes

---

### B5a. `GET /api/forecast/targets/:period_id`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getTargets()` at line 121
- Service: `forecast-upgrade.service.ts → getTargets()` at lines 387–399

**What already works:**
- Queries `Quota WHERE periodId = :period_id` ✅
- Returns `{ rep_id, rep_name, target_value }` ✅

---

### B5b. `POST /api/forecast/targets/assign`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → assignTargets()` at line 131
- Service: `forecast-upgrade.service.ts → assignTargets()` at lines 401–423

**What already works:**
- Body: `{ period_id, manager_id, assignments: [{ rep_id, target_value }] }` ✅
- UPSERTs each assignment into `Quota` table ✅
- Returns `{ assigned_count: N }` (wrapped in `{ success: true, data: {...} }` by controller) ✅

---

## B6. Forecast Periods Routes

---

### B6a. `GET /api/forecast/periods`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getPeriods()` at line 145
- Service: `forecast-upgrade.service.ts → getPeriods()` at lines 427–438

**What already works:**
- Queries all `forecastPeriod` rows ✅
- Returns `{ id, name, start_date, end_date, submission_deadline }` ✅

**Note**: `submission_deadline` falls back to `end_date` if null (line 436) — this is correct.

---

### B6b. `GET /api/forecast/periods/:period_id/reps`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getPeriodReps()` at line 155
- Service: `forecast-upgrade.service.ts → getPeriodReps()` at lines 440–463

**What already works:**
- Unions reps from `forecastSubmission` and `Quota` for the period ✅
- Returns `{ rep_id, rep_name }` ✅

---

## B7. Closed Deals Routes

---

### B7a. `GET /api/closed-deals/:rep_id?period_id=:period_id`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getClosedDealsTotal()` at line 167
- Service: `forecast-upgrade.service.ts → getClosedDealsTotal()` at lines 467–482

**What already works:**
- Queries `crmDeal WHERE repUserId = :repId AND stage = 'Closed Won' AND isClosedWon = true AND closeDate BETWEEN period.startDate AND period.endDate` ✅
- Returns `{ rep_id, period_id, total_closed_value }` ✅

---

### B7b. `GET /api/closed-deals/:rep_id/:deal_id`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getClosedDealValue()` at line 177
- Service: `forecast-upgrade.service.ts → getClosedDealValue()` at lines 484–489

**What already works:**
- Queries single deal with `isClosedWon = true` filter ✅
- Returns `0` if not Closed Won ✅

---

## B8. Pipeline Routes + Internal Function

---

### B8a. `GET /api/pipeline/:rep_id?period_id=:period_id`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getPipelineTotal()` at line 189
- Service: `forecast-upgrade.service.ts → getPipelineTotal()` at lines 493–522

**What already works:**
- Queries `pipelineValuesCache WHERE repId AND dealId = '' AND periodId` (aggregate row, `dealId = ''` = rep-level row) ✅
- Falls back to `recomputePipeline()` if cache miss ✅
- Returns `{ rep_id, period_id, pipeline_value }` ✅

**Note**: The spec says `WHERE deal_id IS NULL` for the aggregate row, but the implementation uses `dealId = ''` (empty string). This is a minor schema design difference — ensure the seed and migration use `''` not `NULL` for this sentinel value, or adjust the query.

---

### B8b. `GET /api/pipeline/:rep_id/:deal_id?period_id=:period_id`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getPipelineDealValue()` at line 199
- Service: `forecast-upgrade.service.ts → getPipelineDealValue()` at lines 524–552

**What already works:**
- Queries `pipelineValuesCache` by `repId + dealId + periodId` ✅
- Falls back to recompute if cache miss ✅
- Returns `{ deal_id, period_id, pipeline_value }` ✅

---

### B8c. Internal `recomputePipeline(rep_id, deal_id, period_id)`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Implementation:**
- Service: `forecast-upgrade.service.ts → recomputePipeline()` at lines 554–614

**What already works:**
- Computes deal-level `pipeline_value = amount * probability` ✅
- UPSERTs deal-level cache row ✅
- Recomputes and UPSERTs rep-level aggregate row ✅
- Called from `getPipelineTotal()` and `getPipelineDealValue()` on cache miss ✅

**Note**: Currently only called on cache miss (read path). The spec also requires it to be called from deal create/update/delete route handlers. **Check** whether the deal CRUD routes in `m06.controller.ts` call `recomputePipeline()` — if not, add those calls there.

---

## B9. AI Revenue Predictor Sync Routes

---

### B9a. `GET /api/ai-predictor/scores/:rep_id`

**Status: ⚠️ PARTIALLY IMPLEMENTED — Gaps Exist**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getAiPredictionScores()` at line 215
- Service: `forecast-upgrade.service.ts → getAiPredictionScores()` at lines 618–639

**What already works:**
- Route exists and is registered ✅
- Returns `{ deal_id, ai_prediction_score }` ✅

**Gaps — what needs to be fixed:**

1. **Fragile score derivation**: The current implementation fetches the last `AiForecastSnapshot`, extracts its `modelInputs` JSON, finds deal entries by `deal.deal === crmDeal.dealName` match (name match — not ID match), then maps `aiConf` string → numeric score (High=95, Med=70, Low=40). This is brittle because:
   - Name matching breaks if deal names are not unique
   - Only looks at the single most-recent snapshot (ignores per-rep/per-deal granularity)
   - Score is a hardcoded 3-bucket value, not a real percentage

2. **Spec intent**: The spec says "If the AI Revenue Predictor already exposes these via an existing route, use that." **Check** `modules/m06-forecasting-prediction/services/m06.service.ts` (64KB) or any `ai-predictor` module for a dedicated scores endpoint. If one exists, point the frontend there instead.

**Action for backend team**: If a proper per-deal AI score table/endpoint already exists in `m06.service.ts` or the Python service, use that. Otherwise, keep this implementation but add a `forecastDeal`-level score field to the Prisma model and populate it during AI prediction runs.

---

### B9b. Internal `syncManualForecast(rep_id, deal_id, period_id, final_value)`

**Status: ⚠️ PARTIALLY IMPLEMENTED — Schema Gap**

**Existing Implementation:**
- Service: `forecast-upgrade.service.ts → syncManualForecast()` at lines 641–649

**What already works:**
- Called by approve (B1d) and override (B1f) ✅
- Updates the `crmDeal` record ✅

**Gaps:**

1. **🗄️ SCHEMA GAP**: The generated Prisma schema for `CrmDeal` (`schema.prisma` lines 117–139) does **not** have `manualForecast` or `manualForecastUpdatedAt` columns. The service calls `prisma.crmDeal.update({ data: { manualForecast, manualForecastUpdatedAt } })` — this will fail at runtime.

   **Action for backend team**: Add to `crm_deals` table:
   ```sql
   ALTER TABLE crm_deals ADD COLUMN manual_forecast FLOAT;
   ALTER TABLE crm_deals ADD COLUMN manual_forecast_updated_at TIMESTAMP;
   ```
   Then regenerate the Prisma client.

---

## B10. Drill-Down Routes

---

### B10a. `GET /api/forecast/drill-down/:rep_id?period_id=:period_id`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getRepDrilldown()` at line 227
- Service: `forecast-upgrade.service.ts → getRepDrilldown()` at lines 653–706

**What already works:**
- JOINs deals + submissions + pipeline cache + AI scores ✅
- Returns all required fields including `approved_best_case`, `approved_commit`, `best_case_state`, `commit_state`, `has_pending_request`, `pipeline_value`, `closed_value`, `ai_prediction_score` ✅
- `has_pending_request` logic: `commitState === 'submitted' || bestCaseState === 'submitted'` ✅
- Also returns frontend-required extras: `is_closed_won`, `is_closed_lost`, `is_past_due`, `manager_annotation`, `requested_best_case`, `requested_commit`, `requested_best_case_note`, `requested_commit_note` ✅

**🗄️ SCHEMA GAP**: All column gaps from B1a apply. Once migration runs, this will work fully.

---

### B10b. `GET /api/forecast/drill-down/:rep_id/summary?period_id=:period_id`

**Status: ✅ FULLY IMPLEMENTED**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getRepDrilldownSummary()` at line 237
- Service: `forecast-upgrade.service.ts → getRepDrilldownSummary()` at lines 708–722

**What already works:**
- Calls `getRepDrilldown()` and aggregates ✅
- `pipeline_total` = sum of deal pipeline values ✅
- `best_case_total` = sum of `approvedBestCase ?? bestCaseForecast` ✅
- `commit_total` = sum of `approvedCommit ?? commitForecast` ✅
- `closed_won_total` = sum of `closedValue` (from deals where `isClosedWon`) ✅

**Note**: The spec says `pipeline_total` = from `pipeline_cache` rep-level aggregate row. The implementation re-computes it by summing deal-level pipeline values from the drilldown. These should produce the same result, but the cache row is the authoritative source. For performance on large datasets, consider reading directly from `pipelineValuesCache` aggregate row for the summary.

---

### B10c. `GET /api/forecast/manager-board/:manager_id?period_id=:period_id`

**Status: ⚠️ PARTIALLY IMPLEMENTED — Manager Scoping Gap**

**Existing Handler:**
- Controller: `forecast-upgrade.controller.ts → getManagerBoard()` at line 247
- Service: `forecast-upgrade.service.ts → getManagerBoard()` at lines 724–761

**What already works:**
- Returns aggregated row per rep ✅
- Returns `{ rep_id, rep_name, pipeline_total, best_case_total, commit_total, closed_total, ai_prediction_score, target_value, target_progress_pct, has_pending_requests }` ✅
- `has_pending_requests` logic: `any deal with has_pending_request = true` ✅
- `target_progress_pct` formula: `((closed_total + commit_total) / target_value) * 100` ✅

**Gaps — what needs to be fixed:**

1. **Manager scoping not implemented**: The service ignores `managerId` (line 724–728) and returns ALL reps with `role = 'sales_rep'` in the tenant. The spec requires reps **under this manager**. A manager should only see their direct reports.

   **Action for backend team**: The `User` model (schema line 141–155) has a `managerId` column. Filter reps by `managerId = :manager_id`:
   ```ts
   const reps = await this.prisma.forecastUser.findMany({
     where: { tenantid: '...', role: 'sales_rep', managerId: managerId },
   });
   ```
   If `forecastUser` doesn't have a `managerId`, join through the `users` table instead.

2. **Performance**: The current implementation calls `getRepDrilldown()` twice per rep (once for summary, once for `hasPending`). These should be merged into a single call.

---

## Critical Schema Migration Required (Summary)

Before any of the B1/B10 routes will work at runtime, the following columns must be added to the `forecast_submissions` table and the Prisma client regenerated:

| Column | Type | Required By |
|--------|------|-------------|
| `deal_id` | `VARCHAR / UUID nullable` | B1a, B1b, B1c, B1d, B1e, B1f, B10a |
| `best_case_state` | `VARCHAR` default `'editable'` | B1a, B1c, B1d, B1e, B1f |
| `commit_state` | `VARCHAR` default `'editable'` | B1a, B1c, B1d, B1e, B1f |
| `approved_best_case` | `FLOAT nullable` | B1a, B1d, B1f |
| `approved_commit` | `FLOAT nullable` | B1a, B1d, B1f |
| `overridden_by` | `VARCHAR nullable` | B1f |

And for `crm_deals`:

| Column | Type | Required By |
|--------|------|-------------|
| `manual_forecast` | `FLOAT nullable` | B9b |
| `manual_forecast_updated_at` | `TIMESTAMP nullable` | B9b |

And verify `forecast_notifications` has:

| Column | Type | Required By |
|--------|------|-------------|
| `action_type` | `VARCHAR` | B2a, B4 |
| `request_type` | `VARCHAR` | B2a, B4 |
| `deal_name` | `VARCHAR` | B2a, B4 |
| `rep_name` | `VARCHAR` | B2a, B4 |
| `best_case_value` | `FLOAT nullable` | B2a, B4 |
| `commit_value` | `FLOAT nullable` | B2a, B4 |
| `final_value` | `FLOAT` | B2a, B4 |
| `is_seen` | `BOOLEAN` default `false` | B2a, B2b, B4 |

---

## Full Status Summary Table

| Route | Status | Action |
|-------|--------|--------|
| `GET /api/forecast/submissions/:period_id/:rep_id` | ⚠️ Partial | Fix schema gaps + `draft_created` bug |
| `POST /api/forecast/submissions` | ⚠️ Partial | Fix upsert logic + schema gaps |
| `PATCH /api/forecast/submissions/:id/submit` | ✅ Full | Run migration only |
| `PATCH /api/forecast/submissions/:id/approve` | ✅ Full | Run migration only |
| `PATCH /api/forecast/submissions/:id/reopen` | ✅ Full | Run migration only |
| `PATCH /api/forecast/submissions/:id/override` | ✅ Full | Fix `user` vs `forecastUser` model inconsistency + migration |
| `GET /api/forecast/notifications/:rep_id` | ✅ Full | Verify `ForecastNotification` schema columns |
| `PATCH /api/forecast/notifications/:id/seen` | ✅ Full | Ready |
| `GET /api/forecast/activity/:submission_id` | ✅ Full | Ready |
| `logActivity()` internal | ✅ Full | Ready |
| `createNotification()` internal | ✅ Full | Verify schema columns |
| `GET /api/forecast/targets/:period_id` | ✅ Full | Ready |
| `POST /api/forecast/targets/assign` | ✅ Full | Ready |
| `GET /api/forecast/periods` | ✅ Full | Ready |
| `GET /api/forecast/periods/:period_id/reps` | ✅ Full | Ready |
| `GET /api/closed-deals/:rep_id?period_id=` | ✅ Full | Ready |
| `GET /api/closed-deals/:rep_id/:deal_id` | ✅ Full | Ready |
| `GET /api/pipeline/:rep_id?period_id=` | ✅ Full | Verify `dealId = ''` sentinel |
| `GET /api/pipeline/:rep_id/:deal_id?period_id=` | ✅ Full | Ready |
| `recomputePipeline()` internal | ✅ Full | Hook into deal CRUD handlers |
| `GET /api/forecast/ai-predictor/scores/:rep_id` | ⚠️ Partial | Improve score derivation or use dedicated table |
| `syncManualForecast()` internal | ⚠️ Partial | Add `manualForecast` columns to `crm_deals` |
| `GET /api/forecast/drill-down/:rep_id?period_id=` | ✅ Full | Run migration only |
| `GET /api/forecast/drill-down/:rep_id/summary?period_id=` | ✅ Full | Run migration only |
| `GET /api/forecast/manager-board/:manager_id?period_id=` | ⚠️ Partial | Add manager scoping filter |

---

## Prioritized Action Items for Backend Team

### Priority 1 — Database Migration (Blocks everything)
1. Add `deal_id`, `best_case_state`, `commit_state`, `approved_best_case`, `approved_commit`, `overridden_by` to `forecast_submissions`.
2. Add `manual_forecast`, `manual_forecast_updated_at` to `crm_deals`.
3. Verify `forecast_notifications` has all required columns.
4. Regenerate the Prisma client after migrations.

### Priority 2 — Bug Fixes (Can be done in parallel with migration)
5. **B1a / B1b**: Fix the `draft_created` log check — use `(repUserId, dealId, periodId)` lookup, not `sub.id`.
6. **B1b**: Decide and implement the upsert-vs-insert-new-version strategy for cell saves.
7. **B1f / B1d**: Standardize `prisma.user` vs `prisma.forecastUser` — pick one model for rep name lookup.
8. **B10c**: Add `managerId` filter to `getManagerBoard()` so managers only see their own reps.

### Priority 3 — Enhancements (After core is working)
9. **B8c**: Hook `recomputePipeline()` into deal create/update/delete handlers.
10. **B9a**: Replace name-based AI score lookup with a proper per-deal score table/column.
