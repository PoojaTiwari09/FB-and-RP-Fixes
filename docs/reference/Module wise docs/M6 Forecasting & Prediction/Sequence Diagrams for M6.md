# Sequence Diagrams for M6 Forecasting & Prediction

## 1. Document Control

- **Document Title:** Sequence Diagrams — M6 Forecasting & Prediction
- **Module Name:** M6 Forecasting & Prediction
- **Workspace Directory:** `modules/m06-forecasting-prediction/`
- **Owner:** Product Engineering — M6
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## SD-01 — Upstream Event to Forecast Recalculation

### Purpose
This diagram models the asynchronous event-driven workflow when upstream deal pipeline changes occur. Rather than blocking transactions by calculating heavy mathematical predictions on the read path, M6 enqueues debounced and rate-limited recalculation jobs to update cached read-models in PostgreSQL.

### Preconditions
- The target period is open and eligible for recalculation.
- The PostgreSQL target table resides under the tenant-scoped `m06_forecasting_prediction` schema.
- **Rate Limit Guard:** A maximum of one recalculation per tenant/period is allowed within a 60-minute window.

### Mermaid Diagram
```mermaid
sequenceDiagram
    autonumber
    participant M10 as M10 Data & Compliance
    participant M6 as M6 Forecasting & Prediction API
    participant Redis as Redis (BullMQ Queue)
    participant Worker as M6 Recalculation Worker
    participant DB as PostgreSQL (m06_forecasting_prediction)

    M10->>M6: deal.stage.changed (event)
    Note over M6: Event Envelope Validation (v1 Standard)<br/>Includes eventId, tenantId, correlationId,<br/>occurredAt, publishedAt, camelCase payload

    M6->>DB: Fetch last recalculation timestamp
    Note over DB: Check m06_forecasting_prediction.predictive_snapshots
    DB-->>M6: Computed at (timestamp)

    alt Less than 60 minutes since last recalculation
        Note over M6: Rate Limit Active<br/>Absorb event and skip enqueue
    else Greater than or equal to 60 minutes since last recalculation
        M6->>Redis: Enqueue forecast.recalc.requested (job)
        Note right of Redis: Job debounced by 5000ms<br/>to absorb rapid event bursts
    end

    Redis->>Worker: Dispatch recalculation job
    Worker->>M10: GET /api/v1/m10-data-compliance/deals?periodId=...
    M10-->>Worker: Hydrated open deals and values
    
    Worker->>DB: Load stage conversion rates
    DB-->>Worker: historical conversion rates
    
    Worker->>Worker: Calculate expected revenue, confidence boundaries, and coverage ratio
    
    Worker->>DB: Insert new predictive snapshot
    Note over DB: Target table: m06_forecasting_prediction.predictive_snapshots<br/>Appends predictedAmount, confidenceRangeLow, confidenceRangeHigh, coverageRatio
    
    Worker-->>Redis: Ack job completion
```

### Postconditions
- The `m06_forecasting_prediction.predictive_snapshots` row is updated with fresh calculations.
- Quota Boards immediately render fresh predictive analytics.

---

## SD-02 — Admin Creates Forecast Period to Board Available

### Purpose
This diagram illustrates the workflow where an administrator defines forecast period parameters, start/end dates, and revenue quotas, initializing the board workspace for sales team interactions.

### Preconditions
- The requesting admin user is authenticated with a JWT.
- Row-Level Security (RLS) is active on the PostgreSQL database.

### Mermaid Diagram
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin User
    participant FE as Frontend Client App
    participant M6 as M6 Forecasting & Prediction API
    participant DB as PostgreSQL (m06_forecasting_prediction)

    Admin->>FE: Enter Period, Dates & Target Quota
    FE->>M6: POST /api/v1/m06-forecasting-prediction/periods
    Note over M6: Validate JWT claims & role (Admin/RevOps)<br/>Set app.current_tenant_id context

    M6->>DB: Insert period configuration
    Note over DB: Target table: m06_forecasting_prediction.forecast_periods<br/>Sets is_locked = false
    DB-->>M6: Return created periodId

    M6-->>FE: 201 Created with period metadata
    
    Note over FE: Forecast Board is now initialized and visible<br/>in period selection listings
```

### Postconditions
- A new record exists inside `m06_forecasting_prediction.forecast_periods`.
- Forecast Board endpoints can now serve read-models for the period.

---

## SD-03 — User Submits Forecast Amount with Locked-Period Guard

### Purpose
This diagram details the manual forecast submission sequence. It highlights the locked-period validation, append-only immutable row versioning, and the propagation of `forecast.submitted` downstream.

### Preconditions
- Sales user is authenticated and tenant-authorized.
- The forecast period is open (`is_locked = false`).

### Mermaid Diagram
```mermaid
sequenceDiagram
    autonumber
    actor User as Sales Rep / Manager
    participant FE as Frontend Client App
    participant M6 as M6 Forecasting & Prediction API
    participant DB as PostgreSQL (m06_forecasting_prediction)
    participant Bus as Event Bus (Platform Event Broker)
    participant M7 as M7 Revenue Dashboards

    User->>FE: Enter manual forecast override amount
    FE->>M6: POST /api/v1/m06-forecasting-prediction/periods/:id/submit
    Note over M6: Validate JWT + tenant_id context

    M6->>DB: Fetch period locking status
    Note over DB: Target table: m06_forecasting_prediction.forecast_periods
    DB-->>M6: Returns is_locked flag

    alt Period is locked (is_locked = true)
        M6-->>FE: 403 Forbidden ("Forecast period is locked")
    else Period is open (is_locked = false)
        M6->>DB: Get latest submission version for user + period
        Note over DB: Target table: m06_forecasting_prediction.forecast_submissions
        DB-->>M6: Version number (e.g. latest = v1, or null)

        alt First Submission
            M6->>DB: Insert forecast_submissions (version = 1)
        else Re-submission
            M6->>DB: Insert forecast_submissions (version = latest + 1)
            Note over DB: Append-only write. Prior rows preserved for audit.
        end
        DB-->>M6: Return persisted submission row

        M6->>Bus: Publish forecast.submitted (event)
        Note right of Bus: Event payload: submissionId, periodId,<br/>userId, submittedAmount, version, submittedAt<br/>formatted in camelCase envelope
        
        Bus->>M7: Deliver forecast.submitted (downstream consumer)

        M6-->>FE: 201 Created with latest submission details
    end
```

### Postconditions
- An immutable new version record is appended to `m06_forecasting_prediction.forecast_submissions`.
- Downstream performance dashboards ingest the submission event to calculate attainment scores.

---

## SD-04 — User Opens Forecast Board with AI Predictions

### Purpose
This diagram shows the read-path assembly workflow when a user opens the Quota and Forecast Board. The system compositionally overlays period metadata, submissions, predictions, and coverage ratios.

### Preconditions
- Target forecast period exists.
- Partial hydration fallbacks are enabled if background calculations are missing.

### Mermaid Diagram
```mermaid
sequenceDiagram
    autonumber
    actor User as Sales User
    participant FE as Frontend Client App
    participant M6 as M6 Forecasting & Prediction API
    participant DB as PostgreSQL (m06_forecasting_prediction)

    User->>FE: Open Forecast Board
    FE->>M6: GET /api/v1/m06-forecasting-prediction/periods/:id/board
    Note over M6: Validate JWT + tenant RLS context

    par Fetch Period Config
        M6->>DB: Fetch period details
        Note over DB: Read m06_forecasting_prediction.forecast_periods
        DB-->>M6: period metadata (name, target, is_locked)
    and Fetch Submissions
        M6->>DB: Fetch latest user submissions
        Note over DB: Read m06_forecasting_prediction.forecast_submissions (latest version)
        DB-->>M6: list of representative submissions
    and Fetch Predictive Snapshot
        M6->>DB: Fetch latest computed predictions & coverage
        Note over DB: Read m06_forecasting_prediction.predictive_snapshots
        alt Snapshot Exists
            DB-->>M6: expectedAmount, confidence boundaries, coverageRatio
        else No Snapshot / Stale
            DB-->>M6: Null / Stale indicators
            Note over M6: Partial Hydration Fallback:<br/>Set aiPrediction = null<br/>Mark section pending/empty
        end
    end

    M6->>M6: Assemble Forecast Board layout
    M6-->>FE: 200 OK (Assembled Board JSON)
    FE-->>User: Render Forecast Board grid
```

### Postconditions
- User views the collaborative Forecast Board spreadsheet grid.
- Stale background metrics degrade gracefully without breaking page assembly.
