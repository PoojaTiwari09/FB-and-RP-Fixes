# Doc #11a — Technical Design Document: AI Revenue Predictor

## 1. Document Control

- **Document Title:** Technical Design Document — AI Revenue Predictor
- **Feature Name:** AI Revenue Predictor
- **Product Module Name:** M6 Forecasting Prediction
- **Architecture Owner Module:** M-09 Forecasting and Prediction
- **Version:** 1.0
- **Status:** Draft
- **Owner:** Revenue Intelligence Engineering
- **Reviewers:** Tech Lead, Backend Lead, Data Lead, QA Lead, Product Manager
- **Last Updated:** 2026-04-30

### Naming Note
This document uses **M6 Forecasting Prediction** as the product/module name used in the product mapping, and **M-09 Forecasting and Prediction** as the canonical architecture name used in the system design. Both refer to the same implementation area. 

---

## 2. Purpose

AI Revenue Predictor exists to forecast expected revenue for a forecast period by combining current pipeline state with historical conversion behavior and real-time deal movement. It is one of the two core features of M6 Forecasting Prediction and is the prediction engine inside the collaborative forecasting experience. 

The business problem is that revenue teams often rely on manual judgment, stale spreadsheets, and inconsistent rep inputs when predicting end-of-period outcomes. AI Revenue Predictor reduces this by generating system-computed forecast snapshots based on pipeline value, weighted pipeline, expected deals, closed-won outcomes, and historical conversion patterns. 

This feature belongs in Forecasting Prediction because Stage 6: Predict in the architecture explicitly combines execution data with historical conversion patterns to produce forward-looking revenue projections. Its business value is improved forecast accuracy, faster forecast reviews, better confidence signaling, and more reliable tracking against period targets. 

---

## 3. Scope

### In Scope
- Forecast-period-level AI revenue prediction for open forecast periods. 
- Snapshot generation for predicted revenue, confidence range, model inputs, and computation timestamp. 
- Use of open pipeline value, weighted pipeline value, historical conversion rates, and real-time deal-stage changes as prediction inputs. 
- Refresh and recompute behavior triggered by forecast lifecycle events and upstream deal-stage changes. 
- Explainability payload for UI display, including major contributing factors and freshness metadata. 
- Tenant-scoped storage and retrieval of AI forecast outputs through M-09 APIs. 

### Out of Scope
- Manual forecast submission UX and collaborative board editing behavior, which belong primarily to Forecast Boards. 
- Scenario planning, what-if simulation, or Monte Carlo forecasting, which are not defined in the current architecture. 
- External ML infrastructure dependencies, because the architecture states M-09 operates on data already stored in PostgreSQL and has no external dependency for forecast data access. 
- Revenue dashboard aggregation and forecast accuracy reporting owned by M-10, except where this feature emits outputs consumed downstream. 

### Assumptions
- M-03 provides deal values, stage state, and current pipeline records needed for forecast rollups. 
- Forecast periods are created before prediction requests are served. 
- Historical conversion-rate records are available or can be recomputed from historical deal movement. 
- Deal-stage events are noisy and must be debounced before full recompute. 

### Upstream Dependencies
- M-03 Revenue Graph for deal records, stages, values, and stage-change signals. 
- Platform Core for tenant context, RBAC, and row-level isolation. 

### Downstream Consumers
- Forecast Boards for rendering prediction outputs in the board view. 
- M-10 Performance and Coaching for forecast-submission-based accuracy tracking and downstream reporting linkage. 

---

## 4. Users and Triggers

### Primary Users
- Sales reps reviewing forecast guidance for their active period. 
- Frontline managers reviewing team forecast posture and AI guidance. 
- RevOps and admins overseeing forecast setup, target tracking, and period governance. 

### Trigger Types
- Admin-created forecast period becomes active. 
- User opens Forecast Board or AI prediction endpoint for a period. 
- Background recalculation triggered by `deal.stage.changed`. 
- Scheduled or on-demand refresh for open periods when freshness policy requires a new snapshot. 

### Entry Points
- `GET /api/v1/forecasting/periods/:id/ai-prediction` for current AI Revenue Predictor output. 
- `GET /api/v1/forecasting/periods/:id/board` for board-level forecast view including prediction and coverage. 

### Preconditions
- The tenant has at least one valid forecast period. 
- The requested period exists and belongs to the active tenant. 
- Pipeline and historical data are available for the period, or fallback handling is applied. 
- Tenant RBAC permits the user to view forecast outputs. 

### Trigger Clarification
This feature must distinguish clearly between three different actions: admin creation of forecast periods, manual user forecast submissions, and automatic background recalculation triggered by `deal.stage.changed`. The predictor reacts to the third case most frequently, but it must also refresh outputs when periods are created or when the board requests current prediction data. 

---

## 5. Functional Flow

### Happy Path
1. Admin creates a forecast period with start date, end date, and revenue target. 
2. M-09 identifies the period as open and eligible for prediction. 
3. The prediction service collects current open pipeline value, weighted pipeline value, expected deals, closed-won progress, and historical conversion-rate inputs for that tenant and period. 
4. Deterministic metrics such as pipeline coverage and weighted totals are computed first. 
5. The prediction layer produces a forecast amount and confidence range for the active period. 
6. M-09 stores the result in `ai_forecast_snapshots` with `predictedamount`, `confidencerangelow`, `confidencerangehigh`, `modelinputs`, `computedat`, and `idempotencykey`. 
7. The board and AI prediction APIs return the latest snapshot to the UI. 

### Alternate Paths
- If a recent snapshot already exists and no freshness threshold is breached, the API may return the latest valid snapshot without forcing recompute. 
- If new deal-stage activity arrives, M-09 schedules a batched refresh for the relevant tenant and period rather than recalculating immediately on every event. 
- If historical conversion data is sparse for a specific stage transition, the service may use tenant-level aggregate stage rates or a documented fallback heuristic. 

### Failure Paths
- If the forecast period does not exist, the API returns a not-found error. 
- If tenant context is missing, access is denied by platform tenancy enforcement. 
- If metrics are stale or partially unavailable, the API returns the latest successful snapshot plus freshness metadata, or a recoverable unavailable state if no snapshot exists. 

### Retry and Debounce Behavior
`deal.stage.changed` is explicitly treated as noisy in the architecture. M-09 batches recalculation and runs it at most once per 60 minutes per tenant and period using a queue job keyed by tenant, period, and hour slot. 

---

## 6. Inputs and Outputs

### Inputs
- Open pipeline value for the forecast period. 
- Weighted pipeline value for the forecast period. 
- Expected deals included in near-term close potential. 
- Closed-won progress already realized in the period. 
- Historical stage-to-stage conversion rates from `historical_conversion_rates`. 
- Current deal-stage and value data from upstream pipeline records. 
- Forecast period metadata including date range and revenue target. 

### Derived Metrics
- Pipeline coverage ratio against period revenue target. 
- Weighted expected revenue from open opportunities. 
- Historical stage contribution factors by transition path. 
- Snapshot freshness age and recompute eligibility. 

### Output Records
Primary output is the `ai_forecast_snapshots` record with:
- `snapshotid`
- `tenantid`
- `periodid`
- `predictedamount`
- `confidencerangelow`
- `confidencerangehigh`
- `modelinputs`
- `inputpipelinevalue`
- `computedat`
- `idempotencykey` 

### APIs Exposed or Consumed
- Exposed: `GET /api/v1/forecasting/periods/:id/ai-prediction` 
- Exposed: `GET /api/v1/forecasting/periods/:id/board` 
- Consumed internally: M-03 deal and pipeline reads via approved module access pattern. 

### Events Emitted
This feature itself does not define a dedicated prediction event in the current architecture. The wider M-09 module emits `forecast.submitted` for manual submission flow, while prediction refresh remains an internal recalculation concern unless a future event contract is added. 

---

## 7. Data Model

### Tables Used
- `forecast_periods` 
- `ai_forecast_snapshots` 
- `pipeline_coverage_metrics` 
- `historical_conversion_rates` 
- `forecast_submissions` for board context and comparison, though prediction is system-generated. 
- Upstream deal data from M-03-owned deal records. 

### Fields Owned
`ai_forecast_snapshots` owns the canonical AI prediction output:
- `snapshotid`
- `tenantid`
- `periodid`
- `predictedamount`
- `confidencerangelow`
- `confidencerangehigh`
- `modelinputs`
- `inputpipelinevalue`
- `computedat`
- `idempotencykey` 

### Versioning Rules
AI prediction is append-style snapshot history, not in-place overwrite. The latest valid snapshot for a period is selected by `computedat` descending, while historical snapshots remain available for audit and debugging. 

### Validation Rules
- `periodid` must exist in `forecast_periods`. 
- Snapshot rows must be tenant-scoped. 
- Confidence range values must be numerically valid and ordered low <= high. 
- `predictedamount` and input values must be non-null for successful snapshots unless the record is explicitly marked partial in a future schema revision. 

### Idempotency Keys
Prediction snapshot creation uses `idempotencykey` to prevent duplicate snapshot writes for the same recompute trigger context. This is especially important when the queue retries or duplicate upstream events are delivered. 

---

## 8. Prediction and Calculation Logic

### 8.1 Prediction Objective and Forecast Horizon
The objective is to estimate expected revenue for a defined forecast period such as a month or quarter. The forecast horizon is bounded by the selected `forecast_periods` record, so all input aggregation and prediction output must align to that period’s `startdate` and `enddate`. 

The predictor is period-based, not perpetual. It answers the question: **“What revenue is likely to close within this forecast period given current pipeline state and historical conversion behavior?”** 

### 8.2 Input Feature Set
The product definition states that AI Revenue Predictor combines closed-won deals, weighted pipeline, expected deals, historical conversion patterns, and real-time pipeline data. These become the minimum required feature family for the predictor. 

Recommended implementation-level input groups:
- **Realized revenue inputs:** closed-won amount already booked in the current period. 
- **Pipeline state inputs:** open pipeline value, weighted pipeline value, open-deal count, stage distribution, and close-date alignment to the active period. 
- **Expected-deal inputs:** deals flagged or inferred as likely to close based on stage, value, timing, and progression. 
- **Historical behavior inputs:** stage-to-stage conversion rates and sample sizes from historical periods. 
- **Freshness inputs:** last recompute time, recent stage changes, and whether the current snapshot is stale. 

### 8.3 Historical Conversion-Rate Usage
Historical conversion rates are stored in `historical_conversion_rates` with `fromstage`, `tostage`, `conversionrate`, `samplesize`, `computedfromperiod`, and `computedat`. These rates are used to estimate how much of the active pipeline is likely to move forward and eventually convert inside the forecast window. 

At implementation level, this should be handled in two layers:
1. Deterministic retrieval of the latest valid stage conversion rates for the tenant. 
2. Prediction logic that applies those rates to current stage-weighted pipeline segments to estimate expected closed revenue contribution. 

When sample size is too low, the service should fall back to broader tenant-level or stage-family rates rather than producing unstable outputs. The fallback must be captured inside `modelinputs` so the UI and operators can understand prediction quality. 

### 8.4 Confidence Range Computation
The architecture explicitly stores `confidencerangelow` and `confidencerangehigh` in `ai_forecast_snapshots`, so confidence output is a first-class requirement rather than a UI-only calculation. 

The confidence band should be generated from variability in the underlying inputs, especially:
- historical conversion-rate spread,
- stage-mix uncertainty,
- expected-deal uncertainty,
- and freshness of the current pipeline state. 

Implementation guidance:
- Keep confidence range generation separate from deterministic coverage computation. 
- Use a stable and explainable approach so identical inputs produce repeatable confidence bounds. 
- Store the confidence-driving factors in `modelinputs` for auditability and UI explanation. 

### 8.5 Snapshot Generation and Refresh Rules
Prediction outputs are stored as forecast snapshots, not live-only ephemeral calculations. Every successful recompute writes a new row into `ai_forecast_snapshots` with computed timestamp and idempotency key. 

Snapshot refresh should occur under these conditions:
- a new open forecast period is created, 
- the current period has no valid prediction snapshot, 
- the existing snapshot exceeds freshness policy, 
- a batched recalculation job runs after upstream `deal.stage.changed`, 
- board or AI prediction API requests require a current snapshot and stale data cannot be served. 

Recompute must be debounced. The architecture rule is at most one recalculation per tenant and period per 60-minute window, even if many deal-stage events arrive. 

### 8.6 Deterministic Metrics vs Model-Based Prediction
This TDD intentionally separates deterministic computations from predictive outputs.

**Deterministic computations**
- Open pipeline totals. 
- Weighted pipeline totals. 
- Coverage ratio against target. 
- Closed-won-to-date amount. 
- Historical conversion-rate lookup and aggregation. 

**Model-based prediction outputs**
- Predicted revenue amount. 
- Confidence low/high values. 
- Explainability summary describing which inputs most influenced the final output. 

This separation is important for correctness, debugging, QA, and UI trust. Users should be able to see which values are exact rollups and which values are forecast estimates. 

### 8.7 Prediction Explainability for UI
The UI should not display only a single predicted number. It should also show a compact explanation built from stored `modelinputs` and derived metadata so users understand why the number moved. 

Minimum explainability payload should include:
- snapshot timestamp and freshness age, 
- open pipeline value and weighted pipeline value used, 
- closed-won amount already counted, 
- historical conversion-rate basis or fallback mode, 
- confidence range and its interpretation, 
- top contributors, such as late-stage pipeline strength or drop in stage conversion expectations. 

Suggested UI language example:
- “Prediction increased because weighted late-stage pipeline grew and recent stage progression improved.”
- “Confidence is moderate because sample size for historical conversion is limited in one stage segment.” 

---

## 9. Service and Integration Design

### Internal Services Involved
- M-09 Forecasting application service for forecast period orchestration and snapshot persistence. 
- Queue worker for debounced recalculation jobs. 
- M-03 data access through approved internal API pattern for deal, value, and stage context. 
- Platform Core for tenant propagation, RBAC, and audit support. 

### Event Subscriptions
- Subscribes to `deal.stage.changed` from M-03 to refresh coverage and AI forecast snapshots for open periods. 

### Public API Contracts
- `GET /api/v1/forecasting/periods/:id/ai-prediction` returns current predictor output. 
- `GET /api/v1/forecasting/periods/:id/board` returns board payload that includes AI prediction and coverage. 

### Fallback Behavior
The architecture states M-09 has no external dependency because it operates on data already stored in PostgreSQL from upstream modules. If immediate recompute cannot complete, the service should return the most recent valid snapshot with freshness metadata instead of failing the user request whenever possible. 

---

## 10. Security and Compliance

### Tenant Isolation
All forecast data is tenant-scoped and protected under row-level security. Every prediction snapshot must be created and read within the active tenant context. 

### RBAC
Only authorized tenant users can access forecast predictions. Admins and RevOps have broader configuration access, while sales users access predictions appropriate to their workspace role. 

### Locked-Period Rules
Locked-period rules primarily block new submissions, but prediction reads for historical analysis may remain allowed based on role. No write or recompute behavior should mutate closed historical user-submission records in a way that breaks auditability. 

### Audit Logging
Prediction recompute requests, snapshot creation, and administrative forecast-period actions should be traceable through platform audit patterns. 

---

## 11. Error Handling

### Key Error Cases
- Forecast period not found. 
- Tenant mismatch or unauthorized access. 
- Missing historical conversion data. 
- Stale or incomplete pipeline metrics. 
- Duplicate recompute trigger delivery. 
- Partial recompute where coverage refresh succeeds but snapshot generation fails. 

### Handling Rules
- Duplicate events must be absorbed through idempotency keying. 
- Recompute retries should use queue retry policies and DLQ for repeated failures. 
- If no fresh prediction can be generated, the service should return last-known snapshot plus status metadata when available. 
- If no snapshot exists at all, return a recoverable “prediction unavailable” state rather than a misleading zero forecast. 

---

## 12. Observability

### Logs
Emit structured logs for:
- prediction recompute requested, 
- prediction recompute skipped due to debounce, 
- snapshot generated, 
- snapshot generation failed, 
- stale snapshot served. 

### Metrics
Track:
- recompute job count, 
- recompute success/failure rate, 
- snapshot freshness age, 
- prediction generation latency, 
- stale prediction serve rate, 
- confidence range width distribution, 
- fallback-rate usage for sparse historical conversion inputs. 

### Alerts
Alert on:
- repeated recompute job failures, 
- prediction freshness SLA breach, 
- queue backlog growth, 
- abnormal spike in duplicate-trigger suppression, 
- zero snapshots generated for active open periods. 

---

## 13. Non-Functional Requirements

- Prediction freshness must remain within the accepted recalculation policy for open periods. 
- Board and prediction API reads must remain responsive even when recompute is delayed by serving the latest valid snapshot. 
- Recalculation jobs must remain reliable under noisy event load from active sales days. 
- Design must scale across many tenants and multiple open forecast periods without generating duplicate snapshot storms. 

---

## 14. Test Strategy

### Unit Tests
- Historical conversion-rate selection logic. 
- Weighted pipeline and deterministic metric computation. 
- Confidence range calculation contract. 
- Snapshot idempotency-key generation. 
- Explainability payload assembly. 

### Integration Tests
- Period creation followed by initial prediction generation. 
- `deal.stage.changed` event causes debounced recompute for open periods only. 
- Latest snapshot is returned by AI prediction API. 
- Board API includes prediction and coverage together. 

### Regression Tests
- Stable output for fixed input dataset. 
- No duplicate snapshots for duplicate event delivery. 
- Low-sample historical conversion fallback does not break prediction. 
- Snapshot freshness and stale-serving behavior remain correct. 

### Negative Tests
- Missing period. 
- Unauthorized tenant access. 
- Empty pipeline. 
- Sparse conversion history. 
- Recompute failure with existing previous snapshot. 

---

## 15. Open Implementation Notes

- Keep deterministic coverage computation and predictive output generation as separate service functions even if both run in the same recalculation workflow. 
- Store enough `modelinputs` detail to support explainability, audit, QA reproduction, and future forecast-accuracy backtesting. 
- Preserve historical snapshots rather than overwriting them, because M6 forecasting maturity depends on accuracy tracking over time. 
- Prefer explicit freshness metadata in API responses so frontend engineers do not infer freshness from timestamps alone. 

---

## 16. Acceptance Criteria

- System can generate a prediction snapshot for any valid open forecast period. 
- Prediction uses pipeline state, weighted pipeline, expected deals, closed-won progress, and historical conversion patterns. 
- Snapshot is stored in `ai_forecast_snapshots` with prediction, confidence range, model inputs, timestamp, and idempotency key. 
- Recompute is debounced to at most once per hour per tenant and period for noisy stage-change events. 
- API can return the latest valid AI prediction and explainability metadata for UI rendering. 
- System remains tenant-safe, idempotent, and observable under duplicate-event and partial-failure conditions. 
