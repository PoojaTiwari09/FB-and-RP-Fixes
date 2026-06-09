# Doc #11b — Technical Design Document (TDD): Forecast Boards

## 1. Document Control

- **Document Title:** Technical Design Document — Forecast Boards
- **Feature Name:** Forecast Boards (Collaborative Quotas & Forecast Grid)
- **Module Name:** M6 Forecasting & Prediction
- **Workspace Directory:** `modules/m06-forecasting-prediction/`
- **Owner:** Product Engineering — M6
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### Business Problem
Collaborative forecasting is historically a highly fragmented activity. Sales reps, frontline managers, and RevOps leaders exchange forecast adjustments across emails, spreadsheets, and CRM reports, leading to reconciliation errors. There is no automated comparison overlaying manual human overrides with system-computed AI predictions. Forecast Boards solves this by introducing a spreadsheet-style, real-time board workspace connected directly to live transaction metrics.

### What this feature does
Forecast Boards serves a central interface that overlays period quotas with:
1. **Manual Submissions:** rep and manager version-controlled forecast overrides.
2. **System AI Projections:** Expected revenue calculations pulled from the latest predictive snapshots.
3. **Pipeline Coverage Metrics:** Open pipeline values and coverage ratios.

### Value Proposition
- Standardizes forecasting workflows inside an immutable, secure grid interface.
- Ensures absolute audit compliance by versioning adjustments.
- Enforces strict administrative boundaries to lock forecast windows.

---

## 3. Scope & Dependencies

### In Scope
- Grid workspaces displaying period metadata, submissions, predictions, and coverage.
- Secure manual submission APIs supporting Reps, Managers, and Admins roles.
- Strict locked period validation blocks.
- Append-only, version-incremented database storage.
- Standard platform `forecast.submitted` event generation.

### Out of Scope
- AI Revenue predictor model algorithms; those belong to the AI Revenue Predictor TDD.
- Historical attainment graphs and accuracy tracking boards; those belong to M7 Revenue Dashboards.

### Upstream Dependencies
- **M10 Data & Compliance (Revenue Graph):** Provides transactional CRM targets and structures.
- **Platform Core:** Handles cryptographically signed token verifications and RLS scopes.

---

## 4. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m06-forecasting-prediction`.

### GET /api/v1/m06-forecasting-prediction/periods
- **Description:** Retrieve available forecast periods for the active tenant.
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
- **Description:** Hydrate full collaborative Forecast Board grid data.
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
- **Description:** Submit a manual forecast override amount.
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

## 5. Database Schema Design

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

-- 2. Forecast Submissions Table (Immutable adjustments)
CREATE TABLE m06_forecasting_prediction.forecast_submissions (
  submission_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id           UUID NOT NULL REFERENCES m06_forecasting_prediction.forecast_periods(period_id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL,
  user_id             UUID NOT NULL,
  submitted_amount    NUMERIC(15,2) NOT NULL CHECK (submitted_amount >= 0.00),
  committed_deal_ids  JSONB NOT NULL DEFAULT '[]', -- List of supporting deals
  version             INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  submitted_at        TIMESTAMPTZ DEFAULT NOW(),
  idempotency_key     VARCHAR(255) NOT NULL UNIQUE
);

-- Indexes for performance & security
CREATE INDEX idx_forecast_submissions_lookup ON m06_forecasting_prediction.forecast_submissions (tenant_id, period_id, user_id, version DESC);
```

---

## 6. Functional & Governance Logic

### Strict Locked-Period Validation
When a forecast period's `is_locked` attribute is set to `true`, the write path is immediately blocked.
- Any POST requests targeting `/submit` must throw a server-side `403 Forbidden` error with description `"Forecast period is locked. No new submissions accepted."`.
- Frontend interfaces must read this lock state and dynamically disable submit buttons. Frontend verification is helper-only; backend enforcement is the canonical security boundary.

### Immutable Versioning Rules
Forecast adjustments must maintain a verifiable audit ledger.
- **Append-Only Write Pattern:** Mutation statements (`UPDATE` or `DELETE` SQL commands) are strictly prohibited on `forecast_submissions`.
- **Version Assignment:**
  - If a user has no prior submission for the current period, the record is inserted with `version = 1`.
  - If prior rows exist for `(tenant_id, period_id, user_id)`, the backend queries the maximum active version and inserts the new record setting `version = max_version + 1`.
- **Query Hydration:** Board reads always select the record with the maximum `version` integer as the active representation, keeping historical rows for auditing.

---

## 7. Event Generation

Upon successful transaction commits inside `forecast_submissions`, M6 emits the `forecast.submitted` platform event to notify downstream consumers.

### Event Schema (camelCase Envelope)
```json
{
  "eventId": "uuid",
  "tenantId": "uuid",
  "correlationId": "uuid",
  "occurredAt": "2026-05-18T23:50:00Z",
  "publishedAt": "2026-05-18T23:50:01Z",
  "payload": {
    "submissionId": "uuid",
    "periodId": "uuid",
    "userId": "uuid",
    "submittedAmount": 980000.00,
    "version": 2,
    "submittedAt": "2026-05-18T23:50:00Z"
  }
}
```

---

## 8. Security & Tenancy Isolation

- **Row-Level Security:** RLS is enabled and active on all tables.
- **Access Control Roles:** Period creation requires administrative role bounds (`Admin`, `RevOps`), while manual adjustments are open to standard `Sales Rep` and `Sales Manager` roles matching tenant visibility rules.
