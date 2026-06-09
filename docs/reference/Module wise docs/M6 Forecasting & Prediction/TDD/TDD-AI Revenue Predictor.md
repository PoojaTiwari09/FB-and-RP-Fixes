# Doc #11a — Technical Design Document (TDD): AI Revenue Predictor

## 1. Document Control

- **Document Title:** Technical Design Document — AI Revenue Predictor
- **Feature Name:** AI Revenue Predictor (Expected Revenue Predictive Engine)
- **Module Name:** M6 Forecasting & Prediction
- **Workspace Directory:** `modules/m06-forecasting-prediction/`
- **Owner:** Product Engineering — M6
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### Business Problem
Revenue forecasting is typically a manual, spreadsheet-driven process subject to human optimism and delayed data entry. Sales leaders struggle to compare subjective representative forecasts with objective, data-driven targets. AI Revenue Predictor resolves this by generating system-computed forecast snapshots based on live transaction records, stage weightings, close probabilities, and historical win-rate coefficients.

### What this feature does
The AI Revenue Predictor computes forward-looking revenue forecasts for defined periods. It delivers:
1. **Predicted Revenue Amount:** An objective system forecast for the active period.
2. **Confidence Ranges:** Numerically bounded low/high expected revenue envelopes.
3. **Explainability payload:** Clear UI signals showing top positive/negative contributors (e.g. late-stage pipeline growth, pricing objections, conversion rate changes).

### Value Proposition
- Eliminates manual spreadsheet calculations by automating pipeline conversion tracking.
- Provides objective forecast standards based on historical statistical baselines.
- Optimizes system performance through precomputed read-models and rate-limited worker recalculations.

---

## 3. Scope & Dependencies

### In Scope
- Period-level AI revenue predictions for open forecast periods.
- Storing generated outputs inside precomputed `predictive_snapshots` tables.
- Running debounced, rate-limited recalculations triggered by `deal.stage.changed` events.
- Building structured explainability JSON payloads for UI presentation.
- Enforcing tenant isolation and Row-Level Security.

### Out of Scope
- Manual forecast submission controls; those belong to Quota and Forecast Boards.
- Monte Carlo simulations or multi-scenario scenario planning.
- Directly querying CRM transactional databases on user read requests.

### Upstream Dependencies
- **M10 Data & Compliance (Revenue Graph):** Serves base deal attributes and emits `deal.stage.changed` event envelopes.
- **Platform Core:** Handles token validations, tenant contexts, and role permissions.

---

## 4. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m06-forecasting-prediction`.

### GET /api/v1/m06-forecasting-prediction/periods/:id/ai-prediction
- **Description:** Retrieve current AI Revenue Predictor output and explainability payload for the period.
- **Headers:** `Authorization: Bearer <token>`, `X-Tenant-ID: <uuid>`
- **Response Payload (`200 OK`):**
  ```json
  {
    "periodId": "uuid",
    "tenantId": "uuid",
    "aiPrediction": {
      "predictedAmount": 950000.00,
      "confidenceRangeLow": 900000.00,
      "confidenceRangeHigh": 1020000.00,
      "computedAt": "2026-05-18T22:00:00Z",
      "explainability": {
        "closedWonToDate": 450000.00,
        "weightedOpenPipeline": 500000.00,
        "primaryDriver": "Late-stage pipeline growth (+15%)",
        "conversionBaselineMode": "tenant_historical",
        "freshnessAgeSeconds": 300,
        "stale": false
      }
    }
  }
  ```

---

## 5. Rate-Limited Recalculation Pattern

To protect database stability and guarantee under 500ms p99 read latency SLAs, M6 enforces the **Precomputed Read-Model Pattern** coupled with **Rate-Limited Recalculation Guards**:
1. **Direct Query Bypass:** M6 is strictly prohibited from running real-time multi-joins across transactional tables during client requests.
2. **Local Snapshoting:** Precomputed forecasts and coverage metrics are stored in `m06_forecasting_prediction.predictive_snapshots`.
3. **Async Trigger Loop:** When a `deal.stage.changed` event is consumed, the background worker enqueues a recalculation task.
4. **Debounce and Concurrency controls:** The queue job uses a 5000ms delay (`M06_RECALC_DELAY_MS`) to absorb burst pipeline movements.
5. **Rate Limit Guard:** Due to the mathematical complexity of the predictive ML models, the forecasting engine restricts real-time updates. A maximum of **one forecast recalculation** per tenant/period is allowed within a **60-minute window** (`M06_RECALC_LIMIT_MINUTES = 60`).

---

## 6. Database Schema Design

All tables reside under the `m06_forecasting_prediction` PostgreSQL schema.

```sql
-- Create Schema Namespace
CREATE SCHEMA IF NOT EXISTS m06_forecasting_prediction;

-- 1. Forecast Periods Table
CREATE TABLE m06_forecasting_prediction.forecast_periods (
  period_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  name                VARCHAR(255) NOT NULL,
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  revenue_target      NUMERIC(15,2) NOT NULL CHECK (revenue_target >= 0.00),
  is_locked           BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  CHECK (start_date <= end_date)
);

-- 2. Predictive Snapshots Table (AI Forecasts & Coverage Metrics)
CREATE TABLE m06_forecasting_prediction.predictive_snapshots (
  snapshot_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL,
  period_id             UUID NOT NULL REFERENCES m06_forecasting_prediction.forecast_periods(period_id) ON DELETE CASCADE,
  predicted_amount      NUMERIC(15,2) NOT NULL CHECK (predicted_amount >= 0.00),
  confidence_range_low  NUMERIC(15,2) NOT NULL CHECK (confidence_range_low >= 0.00),
  confidence_range_high NUMERIC(15,2) NOT NULL CHECK (confidence_range_high >= 0.00),
  coverage_ratio        NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  model_inputs          JSONB NOT NULL DEFAULT '{}', -- Details about conversion coefficients
  computed_at           TIMESTAMPTZ DEFAULT NOW(),
  idempotency_key       VARCHAR(255) NOT NULL UNIQUE,
  CHECK (confidence_range_low <= confidence_range_high)
);

-- Indexes for performance & security
CREATE INDEX idx_forecast_periods_tenant ON m06_forecasting_prediction.forecast_periods (tenant_id);
CREATE INDEX idx_predictive_snapshots_lookup ON m06_forecasting_prediction.predictive_snapshots (tenant_id, period_id, computed_at DESC);
```

---

## 7. Prediction & Calculation Logic

The predictor calculates expected revenue for the target period using three core input feature families:

### Calculation Formula
$$\text{Expected Revenue} = \text{Revenue}_{\text{closed-won}} + \sum_{s \in \text{stages}} \left( \text{Pipeline}_{s} \times C_{s} \times e^{-\lambda t} \right)$$
Where:
- $\text{Pipeline}_{s}$: Sum of open deal values in stage $s$ slated to close in the current period.
- $C_{s}$: Historical conversion rate coefficient for stage $s$.
- $e^{-\lambda t}$: Time decay factor based on deal stagnation duration $t$.

### Low-Sample Conversion Fallback Heuristics
- **Minimum Sample Threshold:** The engine requires at least `M06_PREDICTION_MIN_SAMPLE_SIZE = 50` historical deal records in stage $s$ to compute a stable stage conversion coefficient $C_{s}$.
- **Fallback Rule:** If historical samples for stage $s$ are below 50, the predictor falls back to broader tenant-level default stage rates or global family coefficients.
- **Explainability Logging:** Whenever a fallback is triggered, the engine logs the event inside the snapshot's `model_inputs` JSON block, adding a `fallbackApplied = true` flag to alert the UI and RevOps managers of predictive confidence limitations.

### Confidence Range Boundaries
- Calculated using historical conversion standard deviations:
  $$\text{Confidence Envelopes} = \text{Expected Revenue} \pm \left( z \times \sigma_{\text{pipeline}} \right)$$
- If inputs are noisy or fallbacks are highly active, the confidence range boundaries dynamically widen.

---

## 8. Resilience & Graceful Degradation

- **M10 Integration Timeout:** If M10 Data & Compliance REST queries fail during recalculation workers execution, the background job aborts and queues a retry task.
- **Partial Hydration Fallback:** If no fresh predictive snapshot can be computed, M6 exposes the most recent cached snapshot, appending `stale = true` and `freshnessAgeSeconds` indicators to the JSON payload.
- **Zero-Value Protection:** If no prior snapshot exists, the API returns a `404 Not Found` with `aiPredictionStatus = "pending"` instead of serving a misleading zero forecast.

---

## 9. Security & Tenancy Isolation

- **Row-Level Security:** Forced on all newly created PostgreSQL tables.
- **Tenant Context Interception:** Global interceptors parse incoming JWT tokens, verifying standard `tenant_id` claims before database connection queries are bound.
