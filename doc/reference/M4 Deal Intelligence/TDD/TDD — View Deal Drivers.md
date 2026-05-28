# Doc #15b — Technical Design Document (TDD): View Deal Drivers

## 1. Document Control

- **Document Title:** Technical Design Document — View Deal Drivers
- **Feature Name:** View Deal Drivers (Board-Scoped Opportunity Risks & Analytics)
- **Module Name:** M4 Deal Intelligence
- **Workspace Directory:** `modules/m04-deal-intelligence/`
- **Owner:** Product Engineering — M4
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### Business Problem
Sales managers struggle to spot recurring trends in deal degradation across their sales representatives. Reviewing opportunities one by one to find why deals are stalling, when competitors are blocking bids, or where customer engagement is lacking is tedious and error-prone. View Deal Drivers solves this by aggregating low-level warnings and smart trackers into high-level, rep-level risk explanations, helping managers coach reps on pipeline risks.

### What this feature does
View Deal Drivers is an analytical aggregation feature. It reads the opportunities scoped to a Deals Board and translates repeated warning signals into a ranked, structured ledger of deal drivers:
1. **Engagement Gaps:** Reps who have failed to secure active customer contact.
2. **Competitor Blocks:** Competitive signals extracted from trackers.
3. **Stagnation Points:** Opportunities stalling in specific columns.
4. **MEDDIC/BANT Checklist Gaps:** Incomplete deal qualification frameworks.

### Value Proposition
- Translates unstructured noise into clear, ranked pipeline drivers.
- Empowers managers to quickly identify systemic sales bottlenecks.
- Measures risk progression over time (increasing, stable, decreasing trends).

---

## 3. Scope & Dependencies

### In Scope
- Rep-level and team-level deal driver aggregation scoped to specific boards.
- Normalization pipelines mapping low-level signals into driver categories.
- Previous-period trend comparison (last 7, 14, 30 days, or current quarter-to-date).
- Markdown-structured explanation generation for UI detail cards.
- Snapshot persistence inside `m04_deal_intelligence.deal_drivers`.

### Out of Scope
- Interactive in-call coaching suggestions; those belong to M9 Coaching & Training.
- Authoring custom tracker dictionaries; those belong to M2 Conversation Intelligence.

### Upstream Dependencies
- **M2 Conversation Intelligence:** Supplies tracker detections and category tags.
- **M10 Data & Compliance (Revenue Graph):** Supplies deal ownership records, account maps, and historical activity timelines.
- **M3 AI Summaries & GenAI:** Supplies structured call recaps and brief warnings.

---

## 4. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m04-deal-intelligence`.

### GET /api/v1/m04-deal-intelligence/deal-drivers
- **Description:** Retrieve the computed deal driver snapshots for a rep, team, or board scope.
- **Headers:** `Authorization: Bearer <token>`, `X-Tenant-ID: <uuid>`
- **Query Params:** `boardId` (required), `scopeType` (`rep` or `team`), `scopeId` (optional rep/team UUID), `windowDays` (default `30`)
- **Response Payload (`200 OK`):**
  ```json
  {
    "boardId": "uuid",
    "tenantId": "uuid",
    "scopeType": "rep",
    "scopeId": "user-uuid",
    "computedAt": "2026-05-18T23:50:00Z",
    "drivers": [
      {
        "driverId": "uuid",
        "driverType": "engagement-gap",
        "driverLabel": "Low customer engagement",
        "severity": "high",
        "affectedDealCount": 6,
        "affectedValue": 450000.00,
        "trend": "increased",
        "comparisonValue": 25.0,
        "explanation": "This rep has 6 active deals showing low engagement risk. The pattern is concentrated in late-stage opportunities with no recent customer meetings or outbound emails in the selected window.",
        "topImpactedDeals": [
          {
            "dealId": "uuid",
            "dealName": "Acme expansion deal",
            "value": 150000.00
          }
        ]
      }
    ]
  }
  ```

---

## 5. Warning-to-Driver Transformation Pipeline

View Deal Drivers is not a flat list of active deal alerts. It processes low-level signals through a multi-stage aggregation pipeline:

```
┌────────────────────────────────┐
│      Raw Signal Sources        │
│   (Trackers, Emails, Stages)   │
└───────────────┬────────────────┘
                v
┌────────────────────────────────┐
│      Signal Normalization      │
│  (Map to driver taxonomies)    │
└───────────────┬────────────────┘
                v
┌────────────────────────────────┐
│    Deduplication & Grouping    │
│  (1 count per deal in category)│
└───────────────┬────────────────┘
                v
┌────────────────────────────────┐
│      Ranking & Synthesis       │
│  (Sort by value and severity)  │
└───────────────┬────────────────┘
                v
┌────────────────────────────────┐
│      Snapshot Persistence      │
│  (m04_deal_intelligence)       │
└────────────────────────────────┘
```

### Transformation Taxonomy Rules
- Raw events such as "No customer response in 10 days" and "No meetings booked" are normalized to `engagement-gap`.
- Opportunity stage durations exceeding thresholds are normalized to `stage-stall`.
- Positive competitor trackers are mapped to `tracker-risk`.
- Stale, low-confidence, or unverified signals decrease the overall driver confidence score (`confidence_score`) rather than failing execution.

---

## 6. Database Schema Design

All tables reside under the `m04_deal_intelligence` PostgreSQL schema.

```sql
-- 1. Deal Drivers Snapshot Table
CREATE TABLE m04_deal_intelligence.deal_drivers (
  driver_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  board_id            UUID NOT NULL REFERENCES m04_deal_intelligence.deal_boards(board_id) ON DELETE CASCADE,
  scope_type          VARCHAR(50) NOT NULL CHECK (scope_type IN ('rep', 'team', 'board_segment')),
  scope_id            UUID NOT NULL, -- Mapped to representative userId or teamId
  driver_type         VARCHAR(100) NOT NULL, -- e.g. engagement-gap, stage-stall, tracker-risk
  driver_label        VARCHAR(255) NOT NULL,
  severity            VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_deal_count INTEGER NOT NULL DEFAULT 0,
  affected_value      NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  trend               VARCHAR(50) NOT NULL CHECK (trend IN ('increased', 'decreased', 'stable', 'insufficient-data')),
  comparison_value    NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  top_deal_ids        JSONB NOT NULL, -- Array of deal UUIDs for drill-down
  explanation_text    TEXT NOT NULL,
  confidence_score    NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  computed_at         TIMESTAMPTZ DEFAULT NOW(),
  window_start_at     TIMESTAMPTZ NOT NULL,
  window_end_at       TIMESTAMPTZ NOT NULL
);

-- Indexes for performance & security
CREATE INDEX idx_deal_drivers_scope ON m04_deal_intelligence.deal_drivers (tenant_id, scope_type, scope_id);
CREATE INDEX idx_deal_drivers_board ON m04_deal_intelligence.deal_drivers (board_id);
```

---

## 7. Time-Window & Comparison Projections

### Active Overlap Model
To guarantee alignment between the Deals Board columns and calculated deal drivers, all snapshots evaluate active risks using the **Active Overlap Model**. Under this policy, drivers are computed on warnings that were *unresolved or active* during the target analysis window.

### Time Intervals
Managers can toggle analysis ranges:
- **Last 7 days** (compared to preceding 7 days).
- **Last 14 days** (compared to preceding 14 days).
- **Last 30 days** (compared to preceding 30 days - Default).
- **Current Quarter to Date** (compared to prior quarter equivalent window).

If insufficient historical data exists to calculate delta trends, `trend` is populated as `insufficient-data` and comparison indices default to `0.00`.

---

## 8. Operational Concurrency & Debouncing

### Debounced Snapshot Generation
Generating analytical aggregates over large customer databases is CPU-intensive. M4 background workers implement a debounced computation queue:
- When a `tracker.detection.created` or board row change event is consumed, the recompute worker schedules a delay window of 60 seconds (`M04_DRIVER_RECOMPUTE_DEBOUNCE_MS = 60000`).
- Consecutive triggers within the debounce window extend the timer, merging multiple deal changes into a single analytical run.
- Computed driver snapshots carry a TTL of 5 minutes (`M04_DRIVER_SNAPSHOT_TTL_SEC = 300`). UI reads request precomputed snapshots; the system avoids real-time analytical runs during standard user queries.

---

## 9. Security & Tenant Isolation

- **Row-Level Security:** Strictly enforced on the `deal_drivers` table under the `m04_deal_intelligence` schema. Database views are filtered by `tenant_id` at runtime.
- **Sensitive Contact Masking:** If a deal driver is constructed from tracker logs matching high-security contact names (e.g. key government stakeholders), the driver explanation generator automatically masks employee or buyer identity details, preventing authorization leakage.