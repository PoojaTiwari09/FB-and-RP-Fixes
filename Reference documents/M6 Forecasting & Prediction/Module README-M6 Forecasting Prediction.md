# M6 Forecasting Prediction — Module README

## 1. Module Overview

### What this module does
M6 Forecasting Prediction is the product module responsible for tracking expected revenue and improving forecast accuracy through two core features: **AI Revenue Predictor** and **Forecast Boards**. In the architecture, this maps to **M-09 Forecasting and Prediction**, which owns forecast periods, collaborative submissions, AI forecast snapshots, pipeline coverage metrics, and historical conversion-rate data. 

### Why this module matters
Revenue teams need a reliable way to predict whether they will hit target, understand how much pipeline supports the target, and compare human judgment with system-generated forecast guidance. This module matters because it turns live pipeline movement, historical conversion behavior, and manual team inputs into a structured forecasting system instead of disconnected spreadsheet-based forecasting. 

### Lifecycle stage
M6 belongs to **Stage 6: Predict** of the Revenue Intelligence Lifecycle. In the architecture, the Predict stage combines execution data and historical deal behavior to generate forward-looking revenue projections and collaborative forecast outputs. M6 explicitly maps to Architecture Module **M-09 Forecasting and Prediction**.

### Core outputs
This module produces:
- AI revenue projections for a period. 
- Collaborative forecast submissions by reps and managers. 
- Pipeline coverage metrics against revenue target. 
- Forecast-period definitions and board views. 
- Historical conversion-rate records used for forecast computation. 

---

## 2. Features in This Module

### AI Revenue Predictor
AI Revenue Predictor forecasts expected revenue for a period by combining closed-won deals, weighted pipeline, expected deals, historical conversion patterns, and real-time pipeline data. The architecture persists these outputs in `ai_forecast_snapshots` and exposes them through the AI prediction and board endpoints. 

### Forecast Boards
Forecast Boards are the collaborative forecasting workspace for reviewing targets, pipeline support, AI prediction, and manual submissions in one spreadsheet-like interface. The product mapping describes them as a centralized board connected to CRM pipeline data and R-Intelligence insights, while the architecture supports them with dedicated board, submit, prediction, and coverage APIs. 

---

## 3. Module Boundaries

### What M6 owns
M6/M-09 owns:
- forecast period definitions, 
- forecast submissions and submission versioning, 
- AI forecast snapshots, 
- pipeline coverage metrics, 
- historical conversion rates, 
- forecast accuracy log records. 

### What M6 does not own
M6 does not own upstream deal system-of-record data, CRM sync behavior, or raw pipeline entity modeling. Those belong upstream, especially to M-03 Revenue Graph and related execution modules. 

M6 also does not own Revenue Dashboard visualization or coaching analytics. Those belong to M-10, which consumes M-09 outputs such as `forecast.submitted`. 

### Upstream dependencies
M-09 depends on upstream deal values, stages, and pipeline state from M-03 and reacts to `deal.stage.changed` to refresh coverage and prediction outputs. It also relies on Platform Core for tenant context, RBAC, and row-level security enforcement. 

### Downstream consumer
M-10 Performance and Coaching is the main downstream consumer. It consumes `forecast.submitted` to track forecast accuracy and support dashboard/reporting use cases. 

---

## 4. Architecture Snapshot

### Main components
The main M-09 components are:
- Forecast period service,
- Forecast board service,
- Submission service,
- AI prediction snapshot service,
- Coverage calculation service,
- Recalculation queue worker,
- Forecasting persistence layer for forecasting schema tables. 

### Recalculation flow
When upstream deal-stage movement occurs, M-09 consumes `deal.stage.changed` and schedules recalculation for open forecast periods. Because this event is noisy, M-09 batches recalculation and runs it at most once every 60 minutes per tenant and period. 

### Prediction snapshot flow
Prediction refresh collects pipeline and historical conversion data, computes deterministic metrics, produces a forecast output with confidence range, and stores the result in `ai_forecast_snapshots` with `computed_at` and `idempotency_key`. The latest valid snapshot is then returned by AI prediction and board APIs. 

### Submission flow
A user submits a forecast amount through the submit endpoint for an open period. If the user already submitted for that period, M-09 creates a new submission row with incremented version and emits `forecast.submitted` instead of updating the previous row in place. 

### Coverage calculation flow
Coverage logic computes open pipeline value, weighted pipeline value, and coverage ratio for the forecast period. The results are stored in `pipeline_coverage_metrics` and surfaced on Forecast Boards and coverage APIs. 

---

## 5. APIs

The table below shows the main M-09 endpoints and how they map to features.

| Endpoint | Method | Called by | Used for | Feature mapping |
|---|---|---|---|---|
| `/api/v1/forecasting/periods` | GET | Frontend | List all forecast periods for the tenant.  | Forecast Boards |
| `/api/v1/forecasting/periods` | POST | Admin frontend | Create a forecast period with revenue target.  | Forecast Boards |
| `/api/v1/forecasting/periods/:id/board` | GET | Frontend | Fetch full board view including submissions, AI prediction, and coverage.  | Forecast Boards |
| `/api/v1/forecasting/periods/:id/submit` | POST | Frontend | Submit forecast amount for the selected period.  | Forecast Boards |
| `/api/v1/forecasting/periods/:id/ai-prediction` | GET | Frontend | Fetch current AI Revenue Predictor output.  | AI Revenue Predictor |
| `/api/v1/forecasting/periods/:id/coverage` | GET | Frontend | Fetch pipeline coverage metrics for the period.  | Forecast Boards + AI Revenue Predictor support |

### API usage notes
- `GET /periods` and `POST /periods` are period-management endpoints and primarily support Forecast Boards setup and navigation. 
- `GET /:id/board` is the main Forecast Boards endpoint because it assembles submissions, AI prediction, and coverage into one board response. 
- `POST /:id/submit` is the manual submission endpoint and supports versioned collaborative forecasting. 
- `GET /:id/ai-prediction` directly serves AI Revenue Predictor. 
- `GET /:id/coverage` serves board-visible pipeline support metrics and also acts as a deterministic support layer for forecast understanding. 

---

## 6. Events

### Event consumed
M-09 consumes `deal.stage.changed`. The module uses this event to refresh `pipeline_coverage_metrics` and `ai_forecast_snapshots` for open periods. 

### Event emitted
M-09 emits `forecast.submitted` when a user creates a forecast submission. The payload includes `eventid`, `submissionid`, `periodid`, `tenantid`, `userid`, `submittedamount`, `version`, and `submittedat`, and M-10 consumes it downstream. 

### Recompute batching rule
`deal.stage.changed` is considered noisy, so M-09 batches recalculation and allows at most one refresh per tenant and period per 60-minute window. The queue job is keyed by tenant, period, and hour slot to avoid unnecessary duplicate recalculations. 

### Idempotency notes
Prediction snapshots and coverage calculations use explicit `idempotencykey` fields in their tables to prevent duplicate writes. Event processing across the platform is expected to be idempotent because duplicate delivery is possible with queue retries. 

---

## 7. Data Ownership

M-09 owns the following forecasting schema tables:

### `forecast_periods`
Stores forecast period definitions including name, date range, revenue target, lock state, and creator. 

### `forecast_submissions`
Stores individual rep and manager forecast submissions, including submitted amount, deal references, version, and submitted timestamp. This is the system of record for versioned manual submissions. 

### `ai_forecast_snapshots`
Stores AI Revenue Predictor outputs per period, including predicted amount, confidence range, model inputs, input pipeline value, computed timestamp, and idempotency key. 

### `pipeline_coverage_metrics`
Stores period-level pipeline support metrics such as open pipeline value, weighted pipeline value, coverage ratio, computed timestamp, and idempotency key. 

### `historical_conversion_rates`
Stores tenant-scoped stage-to-stage historical conversion rates used by the prediction layer. 

### `forecast_accuracy_log`
Stores post-period forecast accuracy data by comparing submitted amounts with actual closed revenue outcomes. This supports downstream tracking and retrospective analysis. 

---

## 8. Local Development

### Prerequisites
Before working on M6 locally, make sure you have:
- the full product service stack running in TypeScript,
- PostgreSQL with the forecasting schema migrated,
- Platform Core auth and tenant context enabled,
- seeded deal and period data,
- queue worker support for recalculation jobs. 

### Setup steps
1. Pull the latest codebase and install dependencies for the product service. 
2. Run database migrations so forecasting tables exist. 
3. Configure local environment variables for database, JWT auth, queue, and feature flags. 
4. Seed a tenant, users, open deals, forecast periods, and historical conversion-rate records. 
5. Start API service and worker processes. 

### Seed data for periods and deals
Local development should include:
- at least one tenant,
- one admin user,
- one manager,
- one rep,
- one open forecast period,
- one locked historical period,
- multiple open deals across different stages,
- sample historical conversion-rate records,
- sample submissions with more than one version for one user. 

### Run and test commands
Recommended local checks:
- run the API server, 
- run the queue worker, 
- call `GET /api/v1/forecasting/periods`, 
- create a test period via `POST /api/v1/forecasting/periods`, 
- fetch board via `GET /api/v1/forecasting/periods/:id/board`, 
- submit via `POST /api/v1/forecasting/periods/:id/submit`, 
- trigger recalculation flow by simulating `deal.stage.changed`. 

> Note: exact repo commands like `pnpm test`, `npm run start:dev`, or `nx test` are not defined in the architecture document, so keep those aligned to the actual codebase conventions when this README is added to the repository. 

---

## 9. Configuration

### Required env vars
This module requires environment variables for:
- database connection,
- JWT/auth configuration,
- tenant-aware application context,
- queue/backoff configuration,
- feature flag access where used. 

### Optional env vars
Optional configuration may include:
- recalculation batch delay overrides,
- prediction freshness thresholds,
- observability/alerting integrations,
- local seed toggles. 

### Feature flags
Forecasting should be controlled through tenant-aware feature flags consistent with the platform rule that every module has its own feature flag configuration. 

### Env registry
See **Doc #18 — Environment Variables Registry: M6** for the source-of-truth list of required and optional environment variables for this module. 

---

## 10. Operational Notes

### Common failure modes
Typical operational issues include:
- missing or stale forecast periods, 
- missing coverage metrics, 
- missing AI forecast snapshots for a new period, 
- duplicate event delivery, 
- queue backlog delaying recalculation, 
- locked-period submission attempts from frontend users. 

### Locked period behavior
Locked periods must reject new submissions at the API layer. The board may remain readable, but write actions must fail with the locked-period guard to preserve forecast governance. 

### Replay and recompute guidance
If upstream stage-change events were delayed or missed, recompute should be re-triggered safely using the same batching and idempotency approach rather than forcing manual direct table edits. Snapshot and coverage recalculation are designed to be retry-safe when idempotency keys are respected. 

### Prediction freshness checks
Operational checks should verify:
- latest `ai_forecast_snapshots.computed_at`, 
- latest `pipeline_coverage_metrics.computed_at`, 
- queue backlog depth, 
- stale board serve rate, 
- number of open periods without a current snapshot. 

---

## 11. Related Docs

- **System Architecture Document (SAD):** platform-wide architecture, module boundaries, event architecture, schemas, and APIs. 
- **TDD — AI Revenue Predictor:** feature-level design for prediction logic, snapshots, confidence ranges, and explainability. 
- **TDD — Forecast Boards:** feature-level design for board lifecycle, layout, submissions, versioning, and locking. 
- **Sequence Diagrams — M6:** end-to-end interaction flows for creation, submission, recalculation, and downstream consumption. 
- **API docs and runbooks:** implementation-facing request/response specs and operational procedures, to be linked when repository paths are finalized. 

---

## Quick Summary for Engineers

If you are new to M6, remember these three rules first:
1. **Forecast Boards** are the operational workspace. 
2. **AI Revenue Predictor** is the system-generated prediction engine behind one part of that workspace. 
3. M-09 must stay **tenant-safe, versioned, idempotent, and debounced** because forecasting depends on noisy upstream pipeline changes and must remain reliable under real production load. 
