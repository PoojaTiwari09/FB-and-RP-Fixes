# Doc #15a — Technical Design Document (TDD): Deals Boards

## 1. Document Control

- **Document Title:** Technical Design Document — Deals Boards
- **Feature Name:** Deals Boards (Interactive Pipeline Board Workspace)
- **Module Name:** M4 Deal Intelligence
- **Workspace Directory:** `modules/m04-deal-intelligence/`
- **Owner:** Product Engineering — M4
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### Business Problem
Sales teams spend excessive time navigating rigid, slow, and isolated spreadsheet-style CRM dashboards to review deal pipeline health. Crucial details—such as deal stagnancy, missing contact engagement, pricing friction, and competitor risks—are scattered. Deals Boards addresses this by providing an intelligent, collaborative pipeline workspace that overlays raw opportunity data with dynamic, AI-generated risk signals, call summary briefs, and next-step milestones.

### What this feature does
Deals Boards aggregates active opportunity records and presents them in an interactive multi-column Kanban board grouped by pipeline stage. Each deal card displays:
1. **Deal Health Score:** A dynamic indicators rating (`healthy`, `watch`, or `risk`).
2. **AI Risk Warnings:** Flagged objections, competitors, or stagnancy indicators.
3. **Engagement Metrics:** Days since last customer contact, activity volume.
4. **Custom Views:** Personalized column ordering, filters, sorting configurations.

### Value Proposition
- Centralizes opportunity execution inspections into a single high-performance screen.
- Accelerates deal progression by highlighting active deal risks.
- Streamlines stage-change tracking through optimistic UI animations coupled with robust background CRM synchronizations.

---

## 3. Scope & Dependencies

### In Scope
- Multi-column pipeline layout grouped by stage with sorting and filtering options.
- Row-level metadata composition including deal health scores, warning flags, and engagement levels.
- Direct-saved board view preferences stored per user.
- Asynchronous board-refresh handlers and cache invalidation protocols.
- Drag-and-drop stage updates implementing the asynchronous CRM sync contract.

### Out of Scope
- Direct write access to raw external CRM APIs (managed exclusively by M10).
- Rep-level risk trend aggregation panels; those belong to View Deal Drivers.
- Account-level contact map configurations; those belong to M5 Account Intelligence.

### Upstream Dependencies
- **M10 Data & Compliance (Revenue Graph):** Supplies core opportunity tables (`deals`, `activities`) and handles the external CRM write synchronization.
- **M2 Conversation Intelligence:** Emits tracker detections to fuel deal risk flag adjustments.
- **M3 AI Summaries & GenAI:** Emits summary-generated events containing call recaps.

---

## 4. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m04-deal-intelligence`.

### GET /api/v1/m04-deal-intelligence/boards
- **Description:** Retrieve available deals board configurations for the tenant.
- **Headers:** `Authorization: Bearer <token>`, `X-Tenant-ID: <uuid>`
- **Response Payload (`200 OK`):**
  ```json
  [
    {
      "boardId": "uuid",
      "tenantId": "uuid",
      "name": "Standard Pipeline Board",
      "boardType": "pipeline_review",
      "columns": ["qualification", "proposal", "negotiation", "closed_won"],
      "createdAt": "2026-05-18T12:00:00Z"
    }
  ]
  ```

### GET /api/v1/m04-deal-intelligence/boards/:id
- **Description:** Retrieve active opportunity records formatted as columns and rows for board display.
- **Query Params:** `viewId` (optional saved view reference), `ownerId` (optional rep filter)
- **Response Payload (`200 OK`):**
  ```json
  {
    "boardId": "uuid",
    "tenantId": "uuid",
    "name": "Standard Pipeline Board",
    "rows": [
      {
        "dealId": "uuid",
        "dealName": "Acme expansion deal",
        "accountId": "uuid",
        "accountName": "Acme Corp",
        "ownerUserId": "uuid",
        "ownerDisplayName": "Alice Smith",
        "stage": "proposal",
        "value": 150000.00,
        "closeDate": "2026-06-30T00:00:00Z",
        "healthScore": 75.0,
        "healthCategory": "watch",
        "riskFlagCount": 2,
        "riskFlagSummary": "Competitor mentioned; No customer response in 7 days",
        "lastActivityAt": "2026-05-16T14:30:00Z",
        "daysSinceLastContact": 2,
        "syncStatus": "synced"
      }
    ]
  }
  ```

### POST /api/v1/m04-deal-intelligence/deals/:id/stage
- **Description:** Move a deal to a new stage column (triggers optimistic internal update and async CRM sync).
- **Request Payload:**
  ```json
  {
    "targetStage": "negotiation"
  }
  ```
- **Response Payload (`202 Accepted`):**
  ```json
  {
    "dealId": "uuid",
    "status": "pending_sync",
    "targetStage": "negotiation",
    "correlationId": "uuid"
  }
  ```

---

## 5. Drag-and-Drop Stage Update Pattern (ADR-005)

To prevent lagging UI transitions and coordinate multiple downstream event actions, Deals Boards implements a strict optimistic state pattern:

1. **Optimistic Local Update:** When the rep drags a deal card in the UI, M4 writes a temporary stage update to the local read-model database and flags the status column as `pending_sync`.
2. **Publish Integration Request:** M4 immediately publishes an internal `deal.stage.update.requested` request message containing `dealId`, `targetStage`, and `tenantId` to the background BullMQ queue.
3. **Synchronize to External CRM:** **M10 Data & Compliance** consumes `deal.stage.update.requested` and attempts to write to the external CRM API (Salesforce/HubSpot).
4. **Durable Confirmation:**
   - On success, **M10** writes the final opportunity state to the `m10_data_compliance.deals` database table and emits a public platform event: `deal.stage.changed`.
   - M4 consumes `deal.stage.changed` and updates `m04_deal_intelligence.deal_drivers` durably: setting the stage, clearing the `pending_sync` flag to `synced`, and updating the board client via Server-Sent Events (SSE).
   - On failure, **M10** publishes `deal.stage.sync.failed`. M4 consumes this, reverts the stage column locally, and notifies the client to slide the deal card back to the previous stage.

---

## 6. Database Schema Design

All tables reside under the `m04_deal_intelligence` PostgreSQL schema.

```sql
-- Create Schema Namespace
CREATE SCHEMA IF NOT EXISTS m04_deal_intelligence;

-- 1. Deal Boards Configuration Table
CREATE TABLE m04_deal_intelligence.deal_boards (
  board_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  name                VARCHAR(255) NOT NULL,
  board_type          VARCHAR(50) NOT NULL CHECK (board_type IN ('my_deals', 'team_deals', 'pipeline_review', 'risk_board')),
  columns             JSONB NOT NULL, -- Array of stage identifiers
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Deal Board Columns Table
CREATE TABLE m04_deal_intelligence.deal_board_columns (
  column_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id            UUID NOT NULL REFERENCES m04_deal_intelligence.deal_boards(board_id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL,
  stage_name          VARCHAR(100) NOT NULL,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Deal Board Views Preference Table
CREATE TABLE m04_deal_intelligence.deal_board_views (
  view_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id            UUID NOT NULL REFERENCES m04_deal_intelligence.deal_boards(board_id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL,
  user_id             UUID NOT NULL,
  name                VARCHAR(255) NOT NULL,
  is_default          BOOLEAN NOT NULL DEFAULT false,
  filters             JSONB NOT NULL, -- JSON block mapping applied filters
  visible_columns     JSONB NOT NULL, -- JSON block mapping visible columns and orders
  sorting_rules       JSONB NOT NULL, -- JSON block mapping sorting rules
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance & security
CREATE INDEX idx_deal_boards_tenant ON m04_deal_intelligence.deal_boards (tenant_id);
CREATE INDEX idx_board_columns_lookup ON m04_deal_intelligence.deal_board_columns (board_id, tenant_id);
CREATE INDEX idx_board_views_user ON m04_deal_intelligence.deal_board_views (tenant_id, user_id, board_id);
```

---

## 7. Board Health Score Calculation Inputs

M4 does not invent transactional deal state; it consumes core CRM inputs from **M10** and aggregates risk/engagement flags. The health score recompute (computed inside `deal_drivers`) operates on the following metrics:

| Input Parameter | Weight | Source Module | Risk Condition |
| :--- | :--- | :--- | :--- |
| **Stage Stagnation** | `20%` | M10 (Deals) | Opportunity remains in the same stage exceeding `M04_ENGAGEMENT_WINDOW_DAYS` (14 days). |
| **Activity Gap** | `30%` | M10 (Activities)| No customer customer meetings or outbound emails recorded in the last 14 days. |
| **Tracker Risks** | `25%` | M2 (Trackers) | Detection of active pricing, competitor, or contract objections. |
| **Summary Brief Risks**| `25%` | M3 (Briefs) | Negative sentiment spikes or major customer obstacles extracted from summaries. |

---

## 8. Security & Multi-Tenancy

### Row-Level Security
RLS is enabled on all tables under the `m04_deal_intelligence` schema. Database connections are configured to inject the active tenant context (`app.current_tenant_id`) at query startup:
```sql
ALTER TABLE m04_deal_intelligence.deal_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE m04_deal_intelligence.deal_board_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY deal_boards_isolation ON m04_deal_intelligence.deal_boards
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### Access Scope Scrutiny
Sellers can only read board rows corresponding to active deals within their explicit reporting hierarchy. Administrative functions (such as modifying columns mapping or changing global tenant thresholds) are secured using specific organizational permission profiles.