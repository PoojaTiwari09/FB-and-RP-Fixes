# Doc #18b — Technical Design Document (TDD): Account Boards

## 1. Document Control

- **Document Title:** Technical Design Document — Account Boards
- **Feature Name:** Account Boards (Strategic Account Portfolio Workspace)
- **Module Name:** M5 Account Intelligence
- **Workspace Directory:** `modules/m05-account-intelligence/`
- **Owner:** Product Engineering — M5
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### Business Problem
Account planning, renewal reviews, and expansion tracking are historically isolated activities. Account owners (CSMs, account managers, and sales reps) spend critical hours searching for context across Salesforce records, Outlook inbox activity, call transcripts, and slide briefs. Important renewal warnings (e.g., champion departed, sudden drop in meeting activity) go unnoticed, leading to customer churn. M5 addresses this by synthesizing multi-source data into a high-performance Account Board workspace.

### What this feature does
Account Boards aggregates and consolidates customer account information into a unified grid workspace. Each account row displays:
1. **Engagement Score:** A normalized index (0.0 to 1.0) indicating interaction intensity.
2. **Objection & Risk Indicators:** High-severity signals matched from call trackers.
3. **AI Briefing:** Structured, AI-generated account summaries.
4. **Prioritized Actions:** Prescriptive workspace cues indicating immediate follow-up tasks.

### Value Proposition
- Reduces context switching by merging operational, behavioral, and AI-generated contexts.
- Accelerates renewal planning by highlighting active account risks.
- Assures fast, scalable board loads by implementing precomputed read-models.

---

## 3. Scope & Dependencies

### In Scope
- Portfolio grids featuring dynamic page loading, column adjustments, and saved filter restoration.
- Detailed hydration panels aggregating activity histories, stakeholder directories, and summary briefs.
- Persistent saved view preferences per user.
- Asynchronous debounced background scoring workers.
- Robust partial hydration fallback protocols during upstream failures.

### Out of Scope
- Pipeline deal stage execution; those belong to M4 Deal Intelligence.
- Long-term revenue forecast projections; those belong to M6 Forecasting & Prediction.
- Automated email outreach execution; those belong to M8 Sales Engagement.

### Upstream Dependencies
- **M10 Data & Compliance (Revenue Graph):** Provides transactional account, contact, deal, and activity data.
- **M2 Conversation Intelligence:** Emits `tracker.detection.created` event envelopes.
- **M3 AI Summaries & GenAI:** Serves structured account briefs.
- **M8 Sales Engagement:** Emits `email.sent` event envelopes.

---

## 4. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m05-account-intelligence`.

### GET /api/v1/m05-account-intelligence/boards
- **Description:** Retrieve the listing of available board configurations for the tenant.
- **Headers:** `Authorization: Bearer <token>`, `X-Tenant-ID: <uuid>`
- **Response Payload (`200 OK`):**
  ```json
  [
    {
      "boardId": "uuid",
      "tenantId": "uuid",
      "name": "Key CS Renewal Board",
      "boardType": "renewal_review",
      "createdAt": "2026-05-18T12:00:00Z"
    }
  ]
  ```

### GET /api/v1/m05-account-intelligence/boards/:id
- **Description:** Hydrate account board rows scoped to the board configuration and filters.
- **Query Params:** `viewId` (optional saved view filter), `page` (default 1), `pageSize` (default 50), `sortBy`
- **Response Payload (`200 OK`):**
  ```json
  {
    "boardId": "uuid",
    "tenantId": "uuid",
    "name": "Key CS Renewal Board",
    "rows": [
      {
        "accountId": "uuid",
        "crmAccountId": "ACT-9901",
        "accountName": "Acme Corp",
        "ownerUserId": "uuid",
        "segment": "Enterprise",
        "industry": "SaaS",
        "arr": 150000.00,
        "lastActivityAt": "2026-05-17T14:30:00Z",
        "engagementScore": 0.85,
        "engagementLabel": "healthy",
        "healthStatus": "healthy",
        "renewalSignals": ["expansion_opportunity"],
        "openDealCount": 2,
        "primaryContacts": [
          {
            "contactId": "uuid",
            "name": "Jane Doe",
            "role": "Sponsor"
          }
        ],
        "aiContextSummary": "Strong adoption metrics; renewal discussion initiated.",
        "nextBestAction": "Schedule QBR meeting",
        "dataFreshness": {
          "activityAt": "2026-05-17T14:30:00Z",
          "scoreAt": "2026-05-18T02:00:00Z",
          "briefAt": "2026-05-18T02:05:00Z",
          "stale": false
        }
      }
    ]
  }
  ```

### GET /api/v1/m05-account-intelligence/boards/:id/accounts/:accountId
- **Description:** Hydrate complete account details (timeline, contacts, deals, AI brief).
- **Response Payload (`200 OK`):**
  ```json
  {
    "accountId": "uuid",
    "accountName": "Acme Corp",
    "contacts": [
      { "contactId": "uuid", "name": "Jane Doe", "email": "jane@acme.com", "role": "Sponsor" }
    ],
    "deals": [
      { "dealId": "uuid", "name": "Acme Expansion", "value": 50000.00, "stage": "proposal" }
    ],
    "activities": [
      { "activityId": "uuid", "activityType": "call", "subject": "Intro Zoom Meeting", "occurredAt": "2026-05-17T14:30:00Z" }
    ],
    "engagementScoreHistory": [
      { "score": 0.85, "computedAt": "2026-05-18T02:00:00Z" }
    ],
    "aiBrief": {
      "summary": "Acme Corp has maintained high activity levels...",
      "keyRisks": "None identified",
      "computedAt": "2026-05-18T02:05:00Z"
    }
  }
  ```

---

## 5. Precomputed Read-Model Pattern

To achieve < 500ms p99 latency SLA across portfolios with thousands of accounts, M5 enforces the **Precomputed Read-Model Pattern**:
1. **Direct Query Bypass:** M5 is strictly prohibited from running real-time multi-joins across transactional database tables (activities, trackers, email logs) during client request cycles.
2. **Local Snapshoting:** Precomputed engagement scores, normalized risks, and next-action logs are stored in `m05_account_intelligence.account_drivers`.
3. **Async Trigger Loop:** 
   - When an `email.sent` or `tracker.detection.created` event is consumed, the background worker enqueues a debounced recomputation task (`M05_REFRESH_DEBOUNCE_SEC = 120`).
   - The task runs outside the HTTP thread pool, updates `account_drivers`, and updates the client UI via Server-Sent Events (SSE).

---

## 6. Database Schema Design

All tables reside under the `m05_account_intelligence` PostgreSQL schema.

```sql
-- Create Schema Namespace
CREATE SCHEMA IF NOT EXISTS m05_account_intelligence;

-- 1. Account Boards Table
CREATE TABLE m05_account_intelligence.account_boards (
  board_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  name                VARCHAR(255) NOT NULL,
  board_type          VARCHAR(50) NOT NULL CHECK (board_type IN ('my_accounts', 'territory_review', 'renewal_review', 'risk_board')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Account Board Columns Table
CREATE TABLE m05_account_intelligence.account_board_columns (
  column_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id            UUID NOT NULL REFERENCES m05_account_intelligence.account_boards(board_id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL,
  column_key          VARCHAR(100) NOT NULL,
  display_name        VARCHAR(255) NOT NULL,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Account Board Views Preference Table
CREATE TABLE m05_account_intelligence.account_board_views (
  view_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id            UUID NOT NULL REFERENCES m05_account_intelligence.account_boards(board_id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL,
  user_id             UUID NOT NULL,
  name                VARCHAR(255) NOT NULL,
  is_default          BOOLEAN NOT NULL DEFAULT false,
  filters             JSONB NOT NULL, -- Persisted custom filters
  visible_columns     JSONB NOT NULL, -- Array of column_key identifiers
  sorting_rules       JSONB NOT NULL, -- Persisted sort ordering
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Account Drivers Read-Model Table (Scores & Renewal Signals)
CREATE TABLE m05_account_intelligence.account_drivers (
  driver_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  account_id          UUID NOT NULL, -- References M10 account UUID
  engagement_score    NUMERIC(3,2) DEFAULT 0.00 CHECK (engagement_score >= 0.00 AND engagement_score <= 1.00),
  engagement_label    VARCHAR(50) NOT NULL CHECK (engagement_label IN ('healthy', 'watch', 'at_risk')),
  renewal_signals     JSONB NOT NULL DEFAULT '[]', -- Array of active warnings
  next_best_action    TEXT,
  computed_at         TIMESTAMPTZ DEFAULT NOW(),
  data_freshness      JSONB NOT NULL DEFAULT '{}' -- Detailed freshness metrics log
);

-- Indexes for performance & security
CREATE INDEX idx_account_boards_tenant ON m05_account_intelligence.account_boards (tenant_id);
CREATE INDEX idx_board_views_user ON m05_account_intelligence.account_board_views (tenant_id, user_id, board_id);
CREATE INDEX idx_account_drivers_lookup ON m05_account_intelligence.account_drivers (tenant_id, account_id);
```

---

## 7. Engagement & Health Scoring Logic

The scoring engine aggregates transactional activity signals from M10 and tracking data from M2, processing them against weighted priority rules:

### Scoring Components & Decay Logic
- **Outbound Email:** `+0.05` points.
- **Inbound Email:** `+0.10` points.
- **Customer Meeting/Call:** `+0.30` points.
- **Objection Tracker Detections:** `-0.15` points (e.g., competitor active, pricing friction).
- **Time Decay:** The calculated base score decays exponentially after `M05_STALE_AFTER_SEC = 900` without new touchpoints.
  $$\text{Score}_{\text{decayed}} = \text{Score}_{\text{base}} \times e^{-\lambda t}$$

### Health Boundaries
- **Healthy (Score >= 0.75):** Frequent touchpoints, zero high-severity renewal flags.
- **Watch (0.45 <= Score < 0.75):** Declining touchpoint trajectory or single objection flag.
- **At Risk (Score < 0.45):** Inactivity exceeding 14 days, or high-severity tracker warnings (e.g., champion departed).

---

## 8. Resilience & Partial Hydration Fallback

If upstream integrations fail, M5 enforces strict **Graceful Degradation Policies**:
- **M3 API Outage:** If the REST call to M3 AI Summaries (`GET /api/v1/m03-ai-summaries-genai/...`) timeouts, M5 intercepts the exception, sets `aiContextSummary = null`, flags `aiContextState = "unavailable"`, and proceeds to return core CRM and scoring metrics.
- **M10 API Outage:** Since core CRM details are hosted by M10, M5 cannot load base account identities during a complete M10 outage. M5 throws a structured `GatewayTimeoutException` and issues a Sentry Alert to trigger on-call remediation.

---

## 9. Security & Multi-Tenancy

- **Row-Level Security:** `ALTER TABLE ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` are applied to all newly created tables.
- **Tenant Context Interception:** Global interceptors validate cryptographic Supabase JWT RS256 signatures, extracting and verifying the `tenant_id` claim, appending RLS parameters before executing queries.
