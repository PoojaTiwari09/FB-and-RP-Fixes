# Doc #11b — Technical Design Document: Forecast Boards

## 1. Document Control

- **Document Title:** Technical Design Document — Forecast Boards
- **Feature Name:** Forecast Boards
- **Product Module Name:** M6 Forecasting Prediction
- **Architecture Owner Module:** M-09 Forecasting and Prediction
- **Version:** 1.0
- **Status:** Draft
- **Owner:** Revenue Intelligence Engineering
- **Reviewers:** Tech Lead, Backend Lead, Frontend Lead, QA Lead, Product Manager
- **Last Updated:** 2026-04-30

### Naming Note
This document uses **M6 Forecasting Prediction** as the product/module name from the product mapping and **M-09 Forecasting and Prediction** as the canonical architecture name from the system architecture. Both refer to the same implementation area. 

---

## 2. Purpose

Forecast Boards provide the collaborative forecasting workspace inside M6 Forecasting Prediction. The feature gives sales reps, managers, and revenue leaders a centralized board that combines CRM pipeline data, R-Intelligence insights, AI prediction outputs, manual submissions, and progress toward target in one structured workspace. 

The business problem is that forecasting is usually fragmented across CRM reports, spreadsheets, manager notes, and separate pipeline review workflows. Forecast Boards solve this by acting like a spreadsheet-style operational board connected directly to live pipeline data and M-09 forecasting services, so teams can review, discuss, submit, and track forecasts in real time. 

This feature belongs in Forecasting Prediction because M-09 explicitly owns forecast periods, board retrieval, submission handling, AI prediction snapshots, coverage metrics, and period locking behavior. Its business value is better forecast collaboration, lower manual reconciliation effort, clearer accountability by period and by user, and tighter alignment between AI guidance and human forecast submissions. 

---

## 3. Scope

### In Scope
- Forecast-period-based board experience for active and historical forecast periods. 
- Board retrieval using M-09 board, prediction, and coverage APIs. 
- Manual submission workflow for reps and managers within the current period. 
- Submission versioning for re-submissions within the same period. 
- Board rendering of AI prediction, pipeline coverage, target tracking, and submission history. 
- Board locking behavior for closed or locked periods. 
- Drill-down from board summary metrics into supporting pipeline-level details through approved M-03 access patterns. 

### Out of Scope
- AI forecast-model internals beyond displaying outputs and explainability, which are covered by the AI Revenue Predictor TDD. 
- Revenue Dashboard aggregation and forecast-accuracy dashboards, which are owned by M-10. 
- CRM writeback of forecast submissions to external systems, which is not defined in the current M-09 architecture. 
- Scenario modeling or multi-scenario simulation, which is not included in the present architecture. 

### Assumptions
- Forecast periods are created by admins before users begin submission workflows. 
- AI prediction snapshots and coverage metrics are available or can be refreshed asynchronously for open periods. 
- Users access boards only within their tenant and subject to RBAC controls. 
- Upstream deal stage and value data exist in M-03 and are accessible through approved patterns. 

### Upstream Dependencies
- M-03 Revenue Graph for deals, values, stages, and pipeline state. 
- Platform Core for tenant propagation, JWT auth, RBAC, and row-level security. 
- M-09 internal AI prediction and coverage services. 

### Downstream Consumers
- M-10 consumes `forecast.submitted` for dashboard and forecast-accuracy tracking. 
- Internal managers and RevOps workflows consume board submissions for review and target tracking. 

---

## 4. Users and Triggers

### Primary Users
- Sales reps entering or updating their forecast number for a period. 
- Managers reviewing team board state, AI prediction, and coverage before forecast calls. 
- RevOps and admins creating periods and monitoring submission completeness and period status. 

### Trigger Types
- Admin creates a forecast period. 
- User opens the Forecast Board for a selected period. 
- User submits or re-submits a forecast number. 
- Background recalculation refreshes coverage and AI prediction after `deal.stage.changed`. 
- Period is locked after forecast close or admin action. 

### Entry Points
- `GET /api/v1/forecasting/periods` to list available forecast periods. 
- `POST /api/v1/forecasting/periods` to create a forecast period with target. 
- `GET /api/v1/forecasting/periods/:id/board` to fetch the full Forecast Board. 
- `POST /api/v1/forecasting/periods/:id/submit` to submit a forecast amount for the current period. 
- `GET /api/v1/forecasting/periods/:id/ai-prediction` to fetch current AI Revenue Predictor output. 
- `GET /api/v1/forecasting/periods/:id/coverage` to fetch pipeline coverage metrics. 

### Preconditions
- Requested period exists and belongs to the tenant. 
- User has access to the board based on tenant and role. 
- Period is open if the user is attempting to submit or re-submit. 
- Pipeline and coverage data are available, or last-known snapshot/fallback response can be served. 

### Trigger Clarification
This feature must clearly distinguish:
- **period creation** by admins, 
- **submission actions** by reps or managers, 
- **background recalculation** triggered by `deal.stage.changed`, which updates board-visible AI prediction and coverage without being a manual user action. 

---

## 5. Functional Flow

### Happy Path
1. Admin creates a forecast period with name, date range, and revenue target. 
2. User opens the board for that period using the board endpoint. 
3. The board service loads period metadata, latest forecast submissions, current AI prediction snapshot, and current coverage metrics. 
4. User reviews board summary, target progress, pipeline support, and AI guidance. 
5. User submits a forecast amount using the submit endpoint. 
6. M-09 validates period state, creates a new submission version, and emits `forecast.submitted`. 
7. Board refresh shows the latest submission and updated submission history for that user and period. 

### Alternate Paths
- If a user already submitted for the same period, a new submission is created with incremented version rather than updating the prior row in place. 
- If the board is opened while coverage or AI prediction is stale, the board can still serve the latest valid values while background recompute is pending. 
- Managers may review without submitting immediately, using AI prediction and coverage for coaching or review flow. 

### Failure Paths
- If the period is locked, the board remains readable but new submissions are rejected. 
- If the requested period does not exist, the API returns not found. 
- If tenant context or auth is invalid, access is denied. 
- If dependent board sections cannot load, the system should degrade gracefully and surface section-level status rather than failing the entire board when possible. 

### Retry and Debounce Behavior
Board reads are synchronous user actions, but coverage and AI refresh are asynchronous background recalculations. Because `deal.stage.changed` is noisy, M-09 batches recalculation at most once per 60 minutes per tenant and period rather than refreshing board metrics on every single deal update. 

---

## 6. Inputs and Outputs

### Inputs
- Forecast period metadata from `forecast_periods`. 
- Forecast submissions from `forecast_submissions`. 
- AI prediction snapshot from `ai_forecast_snapshots`. 
- Coverage metrics from `pipeline_coverage_metrics`. 
- Historical conversion context indirectly surfaced through AI prediction outputs. 
- Upstream deal values, stages, and open pipeline state from M-03. 

### Derived Metrics
- Progress to target using submitted value and AI predicted value against revenue target. 
- Coverage ratio against period target. 
- Submission recency and latest version state. 
- Board freshness indicators for AI prediction and coverage sections. 

### Output Records
Primary persisted board-related outputs are:
- `forecast_submissions` rows for each user submission version. 
- `forecast.submitted` event for downstream tracking. 

Primary read model displayed by the board includes:
- period header and status,
- AI prediction block,
- coverage block,
- submission block,
- submission history,
- target progress indicators. 

### APIs Exposed or Consumed
- `GET /api/v1/forecasting/periods` 
- `POST /api/v1/forecasting/periods` 
- `GET /api/v1/forecasting/periods/:id/board` 
- `POST /api/v1/forecasting/periods/:id/submit` 
- `GET /api/v1/forecasting/periods/:id/ai-prediction` 
- `GET /api/v1/forecasting/periods/:id/coverage` 

### Events Emitted
- `forecast.submitted` with payload containing `eventid`, `submissionid`, `periodid`, `tenantid`, `userid`, `submittedamount`, `version`, and `submittedat`. 

---

## 7. Data Model

### Tables Used
- `forecast_periods` 
- `forecast_submissions` 
- `ai_forecast_snapshots` 
- `pipeline_coverage_metrics` 
- `historical_conversion_rates` indirectly via AI prediction support. 
- `forecast_accuracy_log` downstream for post-period tracking. 

### Fields Owned
`forecast_periods` owns:
- `periodid`
- `tenantid`
- `name`
- `startdate`
- `enddate`
- `revenuetarget`
- `islocked`
- `createdby` 

`forecast_submissions` owns:
- `submissionid`
- `periodid`
- `tenantid`
- `userid`
- `submittedamount`
- `committeddealids` or `dealids`
- `bestcasedealids`
- `version`
- `submittedat` 

### Versioning Rules
Submissions are append-only by version. When a user submits again for the same period, the system creates a new row with `version = existing_latest_version + 1`. It does not overwrite the previous submission. 

### Validation Rules
- The period must exist. 
- The period must belong to the tenant. 
- The user must be authorized. 
- Locked periods reject new submissions. 
- Submitted amount must be numeric and valid according to application constraints. 

### Idempotency Keys
The architecture does not define a dedicated submission idempotency key field on `forecast_submissions`, so idempotent behavior relies on controlled API action semantics plus downstream event uniqueness through `submissionid` and `eventid`. Forecast recompute jobs use explicit idempotency keys for coverage and AI snapshots. 

---

## 8. Forecast Period and Board Logic

### 8.1 Forecast Period Lifecycle
Forecast Boards are period-centered. A forecast board always exists in the context of a `forecast_periods` record, which defines the board’s name, date range, target, and lock state. 

Lifecycle states at feature level:
1. **Created** — admin defines period and revenue target. 
2. **Open** — board is active for review and submission. 
3. **Locked** — no new submissions accepted; board becomes read-focused. 
4. **Historical** — board remains available for reference, comparison, and downstream forecast-accuracy analysis. 

Recommended UI status model:
- Upcoming
- Open
- Locked
- Closed/Historical

The persisted architecture field that directly governs write behavior is `islocked`. 

### 8.2 Board Layout and Sections
The product sheet describes Forecast Boards as a centralized forecasting workspace combining CRM pipeline data, R-Intelligence insights, and manual forecast submissions in a spreadsheet-like board. 

The board should be organized into these sections:

#### A. Period Header
- Period name
- Start and end dates
- Revenue target
- Lock status
- Data Freshness indicator showing the `computed_at` timestamp from the latest coverage/snapshot record 

#### B. AI Prediction Panel
- Predicted revenue
- Confidence range
- Snapshot timestamp
- Short explainability summary 

#### C. Coverage Panel
- Open pipeline value
- Weighted pipeline value
- Coverage ratio
- Supporting drill-down affordance 

#### D. Submission Panel
- Current user latest submitted amount
- Submission timestamp
- Current version
- Submit or re-submit action depending on lock state 

#### E. Submission History / Team Review Panel
- Prior versions for the current user
- Team or manager view of submissions where role permits 

#### F. Pipeline Drill-Down Panel
- Supporting deals contributing to coverage and forecast posture
- Deal-stage/value breakdown via approved access pattern 

The layout should feel spreadsheet-like for quick review and editing, but each section must map cleanly to existing endpoints rather than introducing a separate undocumented board backend. 

### 8.3 Submission Workflow
Submission flow is defined by the M-09 submit endpoint.

Base flow:
1. User opens board for active period. 
2. User enters forecast amount. 
3. Frontend calls `POST /api/v1/forecasting/periods/:id/submit`. 
4. Service loads period. 
5. Service rejects if `islocked = true`. 
6. Service fetches latest existing submission for `(tenantid, periodid, userid)`. 
7. Service creates a new submission row with incremented version. 
8. M-09 emits `forecast.submitted`. 
9. Frontend refreshes the board and displays the newest version as the active submission. 

The board should not perform in-place row mutation semantics in the UI because the architecture is versioned append, not mutable overwrite. 

### 8.4 Submission Versioning Rules
Submission versioning is explicit in the architecture. Re-submission is treated as a version bump, not as a duplicate or update-in-place operation. 

Rules:
- First submission for a `(tenantid, periodid, userid)` combination gets version `1`. 
- Every later submission for the same user and period gets `latest_version + 1`. 
- The latest version is the active visible submission in the board summary. 
- Older versions remain queryable for audit and historical review. 

Suggested UI treatment:
- Show latest version in main board row.
- Provide “view history” drawer or expandable history section.
- Mark prior versions read-only and timestamped. 

### 8.5 Board Locking Behavior
Locking behavior is governed by `forecast_periods.islocked`. When the period is locked, no new submissions or re-submissions are allowed. The architecture explicitly rejects submission attempts with a forbidden error: “Forecast period is locked. No new submissions accepted.” 

Board behavior by state:
- **Open period:** board is fully interactive for allowed users. 
- **Locked period:** board remains readable, but submit controls are disabled and server-side enforcement rejects write attempts. 
- **Historical locked period:** board is read-only and should emphasize actuals/accuracy linkage where available. 

Frontend must never rely only on disabled buttons. Server-side lock validation remains the source of truth. 

### 8.6 Coverage Metrics and Drill-Down Behavior
Coverage metrics are a first-class board section, not a hidden implementation detail. The architecture exposes `GET /api/v1/forecasting/periods/:id/coverage`, and the product definition expects Forecast Boards to help users review pipeline performance and progress toward targets. 

The board should show:
- open pipeline value, 
- weighted pipeline value, 
- coverage ratio against target, 
- timestamp of the latest coverage computation. 

Drill-down behavior should let users understand **why** coverage looks strong or weak. At UI level, drill-down should navigate to supporting pipeline details by stage, owner, or deal group using approved read patterns from M-03 data, without violating module ownership boundaries. 

Recommended drill-down views:
- by stage,
- by deal owner,
- by close-date bucket,
- by high-value deals,
- by committed vs best-case supporting deals when submission-linked lists are present. 

---

## 9. Service and Integration Design

### Internal Services Involved
- M-09 board service for assembling period, submission, prediction, and coverage data. 
- M-09 submission service for locked-period checks and versioned submission writes. 
- M-09 recalculation worker for coverage and AI snapshot refresh. 
- Platform Core for JWT auth, tenant context, and RBAC. 
- M-03 access path for underlying deal and pipeline context. 

### Event Subscriptions
- Subscribes to `deal.stage.changed` indirectly to keep board-visible prediction and coverage fresh. 

### Public API Contracts
- `GET /api/v1/forecasting/periods`
- `POST /api/v1/forecasting/periods`
- `GET /api/v1/forecasting/periods/:id/board`
- `POST /api/v1/forecasting/periods/:id/submit`
- `GET /api/v1/forecasting/periods/:id/ai-prediction`
- `GET /api/v1/forecasting/periods/:id/coverage` 

### Fallback Behavior
If AI prediction or coverage sections are stale or temporarily unavailable, the board should serve the latest valid snapshot and clearly mark freshness instead of failing the entire page. This keeps the board operational during recalculation lag. 

---

## 10. Security and Compliance

### Tenant Isolation
Every board read and write is tenant-scoped and protected through row-level security and tenant context propagation. Users must never see another tenant’s periods, submissions, predictions, or coverage data. 

### RBAC
Board access is role-sensitive:
- reps can view and submit their own forecast data, 
- managers can review team board state subject to team-access rules, 
- admins and RevOps can create periods and oversee broad forecast operations. 

### Locked-Period Rules
Locked periods must reject new submissions at the API layer regardless of frontend behavior. This is a compliance and auditability rule for forecast governance, not only a UX rule. 

### Audit Logging
Period creation, submission creation, and lock-state changes should be audit-logged through platform patterns. Submission history itself also acts as a business audit trail because versions are append-only. 

---

## 11. Error Handling

### Key Error Cases
- Period not found. 
- Unauthorized board access. 
- Locked-period submission attempt. 
- Duplicate client retry causing repeated submit action. 
- Stale or missing coverage metrics. 
- Missing AI prediction snapshot for a newly created period. 

### Handling Rules
- Locked-period submit returns forbidden. 
- Missing board sections should fail gracefully at section level where possible. 
- Duplicate downstream event handling uses `submissionid` uniqueness for consumer safety. 
- Recalc failures for coverage/prediction should not block viewing existing submissions. 
- If no submission exists yet, board should display a clear empty state rather than zero as a fake submission. 

### Retry and DLQ Behavior
Submission itself is synchronous API behavior, but background recompute and event processing follow queue retry and dead-letter handling patterns defined in the architecture. 

---

## 12. Observability

### Logs
Emit structured logs for:
- board requested, 
- period created, 
- submission created, 
- submission rejected due to locked period, 
- version increment assigned, 
- board served with stale prediction/coverage sections. 

### Metrics
Track:
- board load count, 
- board API latency, 
- submission success/failure rate, 
- locked-period rejection count, 
- average submission versions per user per period, 
- stale board section rate, 
- period completion rate by tenant and role. 

### Alerts
Alert on:
- spike in submission failures, 
- spike in locked-period submit attempts, 
- board latency breaches, 
- coverage/prediction freshness SLA breaches, 
- missing `forecast.submitted` emissions after successful submission writes. 

---

## 13. Non-Functional Requirements

- Board load latency must remain acceptable for interactive forecast review. 
- Submission workflow must be reliable and safe under user retries and browser refreshes. 
- Recalculation lag must not make the board unusable; freshness must be visible. 
- System must scale across many tenants, many open periods, and many submission versions without degrading board usability. 

---

## 14. Test Strategy

### Unit Tests
- Period lock-state validation. 
- Submission version increment logic. 
- Board assembly response mapper. 
- Empty state behavior for no submission / no prediction / no coverage. 

### Integration Tests
- Create period -> load board successfully. 
- Submit once -> version 1 created. 
- Re-submit -> version increments to 2. 
- Locked period -> submit rejected. 
- Board endpoint returns submissions + AI prediction + coverage together. 
- `forecast.submitted` emitted after successful submission. 

### Regression Tests
- Latest submission selected correctly after multiple versions. 
- Locked historical board stays readable. 
- Stale coverage/prediction state is labeled correctly. 
- Duplicate user action does not corrupt visible version ordering. 

### Negative Tests
- Invalid period ID. 
- Cross-tenant access attempt. 
- Missing target configuration on period creation validation. 
- Board opened before first prediction snapshot exists. 
- Coverage endpoint temporarily unavailable. 

---

## 15. Open Implementation Notes

- Keep the board backend thin and compositional: assemble existing M-09 outputs rather than inventing parallel board-only data models. 
- Treat the board as the operational surface for M-09, while AI Revenue Predictor remains the computational engine behind one board section. 
- Preserve append-only submission history because this is important for governance, auditability, and later forecast-accuracy analysis. 
- Make freshness visible in the UI so users understand when numbers are current versus slightly delayed by batched recalculation. 

---

## 16. Acceptance Criteria

- Users can list available forecast periods and open a board for a selected period. 
- Forecast Board displays period metadata, submissions, AI prediction, and coverage data in one unified workspace. 
- Users can submit a forecast amount for open periods through the defined submit API. 
- Re-submission creates a new version instead of overwriting the previous row. 
- Locked periods reject new submissions while remaining readable. 
- Board behavior maps directly to M-09 APIs without undocumented backend contracts. 
- Successful submissions emit `forecast.submitted` for downstream consumers. 
