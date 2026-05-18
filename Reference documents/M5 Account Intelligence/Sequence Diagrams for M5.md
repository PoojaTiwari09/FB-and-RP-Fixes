# Sequence Diagrams for M5 Account Intelligence

## 1. Document Control

- **Document Title:** Sequence Diagrams — M5 Account Intelligence
- **Module Name:** M5 Account Intelligence
- **Workspace Directory:** `modules/m05-account-intelligence/`
- **Owner:** Product Engineering — M5
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## SD-01 — Upstream Event Integration to Account Board Refresh

### Purpose
This diagram models the asynchronous event-driven workflow when upstream customer interactions or AI-generated signals occur. Rather than blocking transactional performance by computing activity and risk metrics in the read-path, M5 enqueues debounced scoring jobs to refresh cached read-models in PostgreSQL.

### Preconditions
- The account has been resolved and mapped within the platform CRM database.
- An event-broker (BullMQ backed by Redis) is online and routing messages.
- The PostgreSQL target table resides under the tenant-scoped `m05_account_intelligence` schema.

### Mermaid Diagram
```mermaid
sequenceDiagram
    autonumber
    participant M2 as M2 Conversation Intelligence
    participant M8 as M8 Sales Engagement
    participant M5 as M5 Account Intelligence
    participant Redis as Redis (BullMQ Queue)
    participant Worker as M5 Refresh Worker
    participant DB as PostgreSQL (m05_account_intelligence)

    alt Customer objection detected in call
        M2->>M5: tracker.detection.created (event)
    else Outbound customer email sent
        M8->>M5: email.sent (event)
    end

    Note over M5: Event Envelope Validation (v1 Standard)<br/>Includes eventId, tenantId, correlationId,<br/>occurredAt, publishedAt, camelCase payload

    M5->>DB: Check active scoring debounce state
    DB-->>M5: Debounce active (skip) or inactive (proceed)
    M5->>Redis: Enqueue account.refresh.requested (job)
    Note right of Redis: Job debounced by 120 seconds<br/>to coalesce multiple rapid activities

    Redis->>Worker: Dispatch refresh job
    Worker->>DB: Load last computed score snapshot
    DB-->>Worker: account_drivers record
    
    Worker->>Worker: Calculate new score & prioritize signals
    Note over Worker: Score = Weighted mix of interaction recency,<br/>volume, and tracker objection severity.

    Worker->>DB: Upsert refreshed account analytics
    Note over DB: Target table: m05_account_intelligence.account_drivers<br/>Updates engagementScore, renewalSignals, nextBestAction
    
    Worker-->>Redis: Ack job completion
```

### Postconditions
- The `m05_account_intelligence.account_drivers` row is updated with refreshed scores and prioritization logs.
- Next client board reads immediately display current engagement metrics without running calculations synchronously.

---

## SD-02 — User Opens Account Board with Saved View Restoration

### Purpose
This diagram illustrates the hydration sequence when a sales representative or customer success manager opens the portfolio cockpit. The system retrieves customized column orderings, active filters, and joins core CRM records via **M10 Data & Compliance** with M5-owned engagement layers.

### Preconditions
- The requesting user is authenticated with a JWT.
- Row-Level Security (RLS) is active on the PostgreSQL tenant database.

### Mermaid Diagram
```mermaid
sequenceDiagram
    autonumber
    actor User as Sales / CS Rep
    participant Client as Frontend Client App
    participant M5 as M5 Account Intelligence API
    participant DB as PostgreSQL (m05_account_intelligence)
    participant M10 as M10 Data & Compliance (REST API)

    User->>Client: Open Account Board Workspace
    Client->>M5: GET /api/v1/m05-account-intelligence/boards/:id?viewId=xyz
    Note over M5: Validate JWT claims<br/>Set app.current_tenant_id context

    M5->>DB: Fetch user view configurations
    Note over DB: Target table: m05_account_intelligence.account_board_views
    DB-->>M5: Saved visible columns, sortRules, and filters JSON

    M5->>M10: GET /api/v1/m10-data-compliance/accounts?filters=...
    Note right of M10: Resolves transactional CRM records<br/>scoped to the active tenant_id
    M10-->>M5: Array of core account records (ARR, Owner, Industry)

    M5->>DB: Fetch engagement metrics and renewal signals
    Note over DB: Target table: m05_account_intelligence.account_drivers
    DB-->>M5: Array of matching precomputed score snapshots

    M5->>M5: Join CRM accounts with M5 cached metrics
    Note over M5: Fallback Rule: If score is missing,<br/>default engagementScore to null

    M5-->>Client: 200 OK (Unified JSON portfolio payload)
    Client-->>User: Render Account Board workspace
```

### Postconditions
- Portfolio records are displayed applying filters, column preferences, and engagement flags.
- Complete separation of CRM data ownership (M10) and UI representation (M5) is maintained.

---

## SD-03 — User Opens Account Detail Panel with AI Context Hydration

### Purpose
This diagram details the deep hydration workflow when a user inspects a specific account card. The panel merges transactional history with the AI summary brief generated by **M3 AI Summaries & GenAI**.

### Preconditions
- The selected account exists and is mapped inside the tenant workspace scope.
- If M3 AI summaries fail or timeout, the M5 endpoint must execute partial fallback hydration.

### Mermaid Diagram
```mermaid
sequenceDiagram
    autonumber
    actor User as Sales / CS Rep
    participant Client as Frontend Client App
    participant M5 as M5 Account Intelligence API
    participant M10 as M10 Data & Compliance (REST API)
    participant DB as PostgreSQL (m05_account_intelligence)
    participant M3 as M3 AI Summaries & GenAI (REST API)

    User->>Client: Click Account Card
    Client->>M5: GET /api/v1/m05-account-intelligence/boards/:id/accounts/:accountId
    Note over M5: Validate JWT + tenant_id context

    par Fetch Transactional Context
        M5->>M10: GET /api/v1/m10-data-compliance/accounts/:accountId/details
        M10-->>M5: Hydrated contacts, linked deals, and activity histories
    and Fetch Engagement History
        M5->>DB: Fetch score analytics logs
        Note over DB: Target table: m05_account_intelligence.account_drivers
        DB-->>M5: Score logs and active renewal/expansion signals
    and Fetch AI Brief Summary
        M5->>M3: GET /api/v1/m03-ai-summaries-genai/accounts/:accountId/brief
        Note right of M3: Fetch precomputed AI account brief summary
        alt M3 API Success
            M3-->>M5: Account Brief JSON (structured summary, risk signals)
        else M3 API Timeout / Outage
            M3-->>M5: 504 Timeout / error response
            Note over M5: Partial Hydration Fallback Rule:<br/>Set aiContextSummary = null<br/>Include warning metadata
        end
    end

    M5->>M5: Assemble comprehensive detail payload
    M5-->>Client: 200 OK (Hydrated detail JSON)
    Client-->>User: Render detailed Account Workspace panel
```

### Postconditions
- User sees detailed activity timelines, stakeholder directories, and summary briefs.
- Resilience is preserved; dependency outages do not crash the primary account workspace.
