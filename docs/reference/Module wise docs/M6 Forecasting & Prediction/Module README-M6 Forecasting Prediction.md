# M6 Forecasting & Prediction — Module README

## 1. Document Control

- **Document Title:** Module README — M6 Forecasting & Prediction
- **Module Name:** M6 Forecasting & Prediction
- **Workspace Directory:** `modules/m06-forecasting-prediction/`
- **Owner:** Product Engineering — M6
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Module Overview

### What this module does
M6 Forecasting & Prediction is the product module responsible for tracking expected revenue and improving forecast accuracy through two core features: **AI Revenue Predictor** and **Quota and Forecast Boards**. 

The module combines live pipeline movements, historical stage-to-stage conversion coefficients, manual manager submissions, and target configurations into a unified, secure forecasting workspace.

### Why this module matters
Without a reliable, system-computed forecasting standard, revenue teams often depend on manual judgment, stale offline spreadsheets, and inconsistent rep forecasting. M6 reduces this fragmentation by consolidating manual collaborative submissions with real-time AI-guided predictions, providing an immutable audit trail for executive decision-making.

### Lifecycle Stage
This module belongs to Stage 6 (**Predict**) of the Revenue Intelligence Lifecycle, converting execution logs and deal histories into forward-looking revenue projections.

### Core Outputs
The primary outputs of the M6 module are:
1. **Forecast Board views:** Spreadsheet-like grids displays of targets, pipeline support, AI predictions, and manual submissions.
2. **Predictive Snapshots:** System-computed expected revenue forecasts, confidence ranges, and explainability coefficients.
3. **Collaborative Forecast Submissions:** Versioned, manager-locked manual forecasting totals.
4. **`forecast.submitted` event:** Standard platform event emitted upon manual locks to propagate targets downstream.

---

## 3. Features in This Module

### AI Revenue Predictor
Predicts expected revenue for a forecast period by applying historical conversion patterns to open deal weights, closed-won totals, and expected progression signals. Outputs are stored inside `predictive_snapshots` to protect read-performance.

### Quota and Forecast Boards
A spreadsheet-like grid workspace for reviewing team progress against revenue quotas. It overlays manual forecasting overrides with system-computed AI predictions, supporting locked period enforcement and append-only versioning.

---

## 4. Module Boundaries

### What M6 owns as a physical module
At the code level, M6 represents an independent, decoupled physical monorepo workspace located at `modules/m06-forecasting-prediction/`. It is the sole owner of:
- **Forecast Period configurations:** Start dates, end dates, locking states, and targets.
- **Manual Forecast Submissions:** Manager and representative collaborative projections.
- **Predictive Snapshots Read-Model:** System-computed AI predictions and coverage rates.
- **`forecast.submitted` event:** Platform-wide event notifying downstream metrics handlers.

### What M6 does NOT own
To preserve strict decoupling, M6 does not directly manage or write to:
- **CRM Synced Core Entities:** M10 (Data & Compliance / Revenue Graph) owns core tables (`accounts`, `contacts`, `deals`, `activities`). M6 reads these exclusively via public REST APIs.
- **Deal Health & Objection Detections:** M4 (Deal Intelligence) manages Deals Boards and deal drivers.
- **Account-Level Prioritizations:** M5 (Account Intelligence) owns Account Boards and engagement metrics.

### Upstream Dependencies

| Upstream Module | What M6 Uses | Integration Pattern |
| :--- | :--- | :--- |
| **M10 Data & Compliance** | Core deals, open pipeline states, and transaction structures. | REST API queries over shared read-models. |
| **M10 Data & Compliance** | Stage changes notifications. | BullMQ subscription to `deal.stage.changed` to trigger recalculations. |

### Downstream Consumers

| Downstream Module | Relationship to M6 |
| :--- | :--- |
| **M7 Revenue Dashboards** | Consumes `forecast.submitted` to aggregate quota attainment and accuracy histories inside performance metrics panels. |
| **M9 Coaching & Training** | Evaluates gaps between AI forecasts and manual rep submissions to trigger training alerts. |

---

## 5. Architecture Snapshot

```
   ┌────────────────────────────────────────────────────────┐
   │                  Frontend Client App                   │
   └───────────────────────────┬────────────────────────────┘
                               │ HTTP REST Requests
                               v
   ┌────────────────────────────────────────────────────────┐
   │               M6 Forecasting & Prediction              │
   │          (modules/m06-forecasting-prediction)          │
   └───────┬───────────────────┬────────────────────┬───────┘
           │                   │                    │
           │ DB Reads          │ API Calls          │ BullMQ Events
           v                   v                    v
   ┌───────────────┐   ┌───────────────┐   ┌────────────────┐
   │  PostgreSQL   │   │  M10 Revenue  │   │  Redis/BullMQ  │
   │  m06_predict  │   │  Graph API    │   │  (Debounced    │
   │  schema       │   │  (CRM Data)   │   │   recalculates)│
   └───────────────┘   └───────────────┘   └────────────────┘
```

### Main Components
- **`ForecastPeriodsController`:** Exposes public endpoint groups under the `/api/v1/m06-forecasting-prediction` prefix.
- **`AIRevenuePredictorService`:** Generates expected revenue projections and confidence boundaries.
- **`M6 Background Recalculation Workers:`** BullMQ queues consuming pipeline updates to refresh predictive models.
- **PostgreSQL Schema namespace `m06_forecasting_prediction`:** Physically holds periods, submissions, and predictions.

### Rate-Limited Recalculation Pattern
Executing mathematical predictions and multi-join coverage ratios synchronously during user reads violates platform SLAs. M6 implements the **Precomputed Read-Model Pattern** coupled with **Rate-Limited Recalculation Guards**:
- Read requests pull cached metrics from `m06_forecasting_prediction.predictive_snapshots`, guaranteeing under 500ms p99 latency.
- When a `deal.stage.changed` event is consumed, the background worker enqueues a recalculation task.
- **Rate Limit Guard:** Due to the mathematical complexity of the predictive ML models, the forecasting engine restricts real-time updates. A maximum of **one forecast recalculation** per tenant/period is allowed within a **60-minute window**, absorbing high-frequency transaction noise.

---

## 6. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m06-forecasting-prediction`.

### GET /api/v1/m06-forecasting-prediction/periods
- **Description:** Retrieve available forecast periods for the tenant.
- **Headers:** `Authorization: Bearer <token>`, `X-Tenant-ID: <uuid>`
- **Response Payload (`200 OK`):**
  ```json
  [
    {
      "periodId": "uuid",
      "tenantId": "uuid",
      "name": "Q2-2026",
      "startDate": "2026-04-01",
      "endDate": "2026-06-30",
      "revenueTarget": 1000000.00,
      "isLocked": false
    }
  ]
  ```

### GET /api/v1/m06-forecasting-prediction/periods/:id/board
- **Description:** Retrieve the spreadsheet-style collaborative Forecast Board grid.
- **Response Payload (`200 OK`):**
  ```json
  {
    "periodId": "uuid",
    "tenantId": "uuid",
    "name": "Q2-2026",
    "revenueTarget": 1000000.00,
    "isLocked": false,
    "aiPrediction": {
      "predictedAmount": 950000.00,
      "confidenceRangeLow": 900000.00,
      "confidenceRangeHigh": 1020000.00,
      "computedAt": "2026-05-18T22:00:00Z"
    },
    "coverageMetrics": {
      "openPipelineValue": 3500000.00,
      "weightedPipelineValue": 1200000.00,
      "coverageRatio": 3.50,
      "computedAt": "2026-05-18T22:00:00Z"
    },
    "submissions": [
      {
        "submissionId": "uuid",
        "userId": "uuid",
        "submittedAmount": 980000.00,
        "version": 2,
        "submittedAt": "2026-05-18T14:30:00Z"
      }
    ]
  }
  ```

### POST /api/v1/m06-forecasting-prediction/periods/:id/submit
- **Description:** Submit manual forecast amount. If prior submissions exist, appends a new row version.
- **Request Payload:**
  ```json
  {
    "submittedAmount": 980000.00,
    "committedDealIds": ["uuid-1", "uuid-2"]
  }
  ```
- **Response Payload (`201 Created`):**
  ```json
  {
    "submissionId": "uuid",
    "periodId": "uuid",
    "tenantId": "uuid",
    "userId": "uuid",
    "submittedAmount": 980000.00,
    "version": 2,
    "submittedAt": "2026-05-18T23:50:00Z"
  }
  ```

---

## 7. Operational & Security Policies

- **Locked-Period Enforcement:** If a period's `isLocked` field is `true`, the `submit` API must block all manual modifications, returning a `403 Forbidden` exception.
- **Immutable Versioning Rule:** Submissions inside `forecast_submissions` are strictly **append-only**. A manager modifying a forecast generates a new row version increment, maintaining a historical audit trail.
- **Tenancy Isolation:** Row-Level Security is strictly enforced. Every PostgreSQL query must execute under a tenant session context.
- **Fallback Rule:** If predictive computations are missing or delayed, Forecast Boards must render successfully with section-level empty state warnings rather than throwing an endpoint exception.
