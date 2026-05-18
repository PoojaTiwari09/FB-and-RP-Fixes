# M5 Account Intelligence — Module README

## 1. Document Control

- **Document Title:** Module README — M5 Account Intelligence
- **Module Name:** M5 Account Intelligence
- **Workspace Directory:** `modules/m05-account-intelligence/`
- **Owner:** Product Engineering — M5
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Module Overview

### What this module does
M5 Account Intelligence helps sales, success, and RevOps teams manage customer accounts strategically through a unified workspace centered on **Account Boards**. 

The module aggregates CRM-linked account metadata, recent customer interaction records, conversation-derived objections or risk signals, and AI-generated brief recaps into a high-performance single screen. Users can inspect portfolio health, review renewal likelihoods, identify expansion vectors, and organize accounts from a single execution cockpit.

### Why this module matters
Without a unified account workspace, account owners must jump between isolated CRM tabs, email clients, call recording archives, and manual note sheets to construct a complete picture of customer engagement. M5 reduces this fragmentation by consolidating operational data with real-time AI risk scoring, offering a streamlined operational cockpit for proactive customer management.

### Lifecycle Stage
This module belongs to Stage 5 (**Execute**) of the Revenue Intelligence Lifecycle, surfacing upstream AI data and scoring pipelines into interactive workspaces.

### Core Outputs
The primary outputs of the M5 module are:
1. **Account Board Rows:** A portfolio grid displaying customer lists scoped by rep, tier, or territory.
2. **Account Detail Workspace:** Hydrated summaries containing activity timelines, linked open deals, mapped contacts, and AI account briefs.
3. **Engagement Scores:** Standardized indices (0.0 to 1.0) reflecting recency, volume, and quality of customer touchpoints.
4. **Renewal/Expansion Signals:** Derived warnings (e.g., champion departed, competitive expansion blocking) displayed in the account workspace.
5. **Next Best Actions:** Prescriptive workspace recommendations identifying immediate tasks.

---

## 3. Features in This Module

### Primary Feature
*   **Account Boards:** An interactive pipeline-style or grid-based portfolio workspace. It merges base CRM account attributes with active activity indicators, pgvector-derived smart tracker flags, and AI-generated briefings.

### Supported Workflows
- **Renewal Inspection:** Identifies early-stage renewal risks through low-engagement warnings.
- **Expansion Discovery:** Signals opportunities by tracking positive conversation trends, new stakeholder inclusions, and expansion objections resolved.
- **Portfolio Prioritization:** Enables RevOps and Success managers to dynamically sort and filter accounts by engagement score, industry, ARR value, or risk severity.

---

## 4. Module Boundaries

### What M5 owns as a physical module
At the code level, M5 represents an independent, decoupled physical monorepo workspace located at `modules/m05-account-intelligence/`. It is the sole owner of:
- **Account Boards UI & APIs:** The presentation layer and serving endpoints.
- **Persisted View Configuration:** User-defined saved views, custom columns, and active filters.
- **Engagement Scores Read-Model:** Precomputed metrics scoring logs and trend indicators.
- **Renewal/Expansion Signal Log:** Persisted analytics signals driving portfolio prioritization.
- **Next Best Action Priority Rules:** Evaluator logic mapping risk metrics to workspace alerts.

### What M5 does NOT own
To preserve strict decoupling, M5 does not directly manage or write to:
- **CRM Synced Core Entities:** M10 (Data & Compliance / Revenue Graph) owns transactional tables (`accounts`, `contacts`, `deals`, `activities`). M5 reads these exclusively via public REST APIs.
- **Keyword & Tracker Detection:** M2 (Conversation Intelligence) owns the keyword dictionary and publishes match triggers.
- **AI Summary Execution:** M3 (AI Summaries & GenAI) manages execution workflows generating summaries and deep research briefs.
- **Pipeline Stage Management:** M4 (Deal Intelligence) manages Deals Boards and opportunity state transitions.
- **Forecast Rollups:** M6 (Forecasting & Prediction) owns forecast aggregation workflows.

### Upstream Dependencies

| Upstream Module | What M5 Uses | Integration Pattern |
| :--- | :--- | :--- |
| **M10 Data & Compliance** | Mapped accounts, contacts, deals, activities. | REST API queries over shared read-models. |
| **M2 Conversation Intelligence** | Smart tracker detections, objection signals. | BullMQ subscription to `tracker.detection.created`. |
| **M3 AI Summaries & GenAI** | Account summaries and deep research briefs. | REST API call to `/api/v1/m03-ai-summaries-genai`. |
| **M8 Sales Engagement** | Email dispatch signals. | BullMQ subscription to `email.sent` to update engagement scores. |

### Adjacent Modules

| Adjacent Module | Relationship to M5 |
| :--- | :--- |
| **M4 Deal Intelligence** | Deals Boards focus on transactional pipeline stages and deal health. M5 focuses on broad account-level metrics and renewal/expansion logs. |
| **M6 Forecasting & Prediction** | Consumes portfolio trends to compute long-term quota projections. |
| **M8 Sales Engagement** | Provides the outbound workspace where reps execute the next-best-action alerts generated by M5. |

---

## 5. Architecture Snapshot

```
   ┌────────────────────────────────────────────────────────┐
   │                  Frontend Client App                   │
   └───────────────────────────┬────────────────────────────┘
                               │ HTTP REST Requests
                               v
   ┌────────────────────────────────────────────────────────┐
   │                M5 Account Intelligence                 │
   │           (modules/m05-account-intelligence)           │
   └───────┬───────────────────┬────────────────────┬───────┘
           │                   │                    │
           │ DB Reads          │ API Calls          │ BullMQ Events
           v                   v                    v
   ┌───────────────┐   ┌───────────────┐   ┌────────────────┐
   │  PostgreSQL   │   │  M10 Revenue  │   │  Redis/BullMQ  │
   │  m05_account  │   │  Graph API    │   │  (Async score  │
   │  schema       │   │  (CRM Data)   │   │   recomputes)  │
   └───────────────┘   └───────────────┘   └────────────────┘
```

### Main Components
- **`AccountBoardsController`:** Exposes public endpoint groups under the `/api/v1/m05-account-intelligence` prefix.
- **`EngagementScoreService`:** Processes background activity metrics scoring, maintaining cached read-models.
- **`M5 Background Workers:`** BullMQ queues consuming activity events to refresh account state.
- **PostgreSQL Schema namespace `m05_account_intelligence`:** Physically holds saved views, columns mapping, engagement metrics, and renewal records.

### Account Board Read Path
1. The client requests a portfolio via `GET /api/v1/m05-account-intelligence/boards`.
2. M5 loads the user's view configurations from `m05_account_intelligence.account_board_views`.
3. M5 calls the **M10 Data & Compliance** REST API to fetch the core tenant-scoped account records matching active filters.
4. M5 joins these accounts with local cached snapshots from `m05_account_intelligence.account_drivers`.
5. The unified, hydrated payload is returned to the client in under 500ms.

### Context Freshness & Async Recomputation
Computing multi-source activity scores synchronously during HTTP request flows violates platform performance goals. M5 implements the **Precomputed Read-Model Pattern**:
- HTTP requests pull pre-calculated metrics from `m05_account_intelligence.account_drivers` ensuring low-latency reads.
- When an `email.sent` or `tracker.detection.created` event is consumed, the background worker enqueues a debounced scoring task.
- The scoring results are stored in `m05_account_intelligence.account_drivers`, flagging rows as refreshed.

---

## 6. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m05-account-intelligence`.

### GET /api/v1/m05-account-intelligence/boards
- **Description:** Retrieve available account board configurations for the tenant.
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
- **Description:** Retrieve the hydrated list of customer accounts matching the board configuration.
- **Query Params:** `viewId` (optional saved view filter), `page`, `pageSize`, `sortBy`
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
- **Description:** Retrieve detailed account workspace panel data including contacts, deals, activities, and AI briefs.
- **Response Payload (`200 OK`):**
  ```json
  {
    "accountId": "uuid",
    "accountName": "Acme Corp",
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

## 7. Operational & Security Policies

- **Row-Level Security (RLS):** Enabled and forced on all tables inside the `m05_account_intelligence` namespace. Database sessions must bind `app.current_tenant_id` at initialization.
- **Tenant Scoping Guardrail:** RLS prevents query leakage, but every endpoint handler must explicitly validate tenant parameters in the incoming JWT context, returning a `403 Forbidden` on mismatched context.
- **Partial Hydration Fallback:** If upstream dependencies (such as M3 AI summaries) become unavailable, the board must successfully load base account and engagement records, replacing AI blocks with `aiContextSummary = null` and appropriate data freshness markers.
- **Secrets Management:** Doppler is the exclusive manager for service tokens and database connections. No secrets are stored in code or committed environments.
