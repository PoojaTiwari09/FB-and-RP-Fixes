# Doc #14 — Sequence Diagrams for M4

## 1. Document Control

- **Document Title:** Sequence Diagrams — M4 Deal Intelligence
- **Module:** M4 Deal Intelligence
- **Owner:** Product Engineering — M4
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. SD-01: Call Summary Generated to Deal Board Enrichment

This diagram shows how a newly generated call summary in **M3** triggers an asynchronous deal health recomputation and updates the board read-models in **M4**.

```mermaid
sequenceDiagram
    autonumber
    participant M3 as M3 AI Summaries & GenAI
    participant Bus as Message Bus (BullMQ)
    participant M10 as M10 Data & Compliance
    participant M4 as M4 Deal Intelligence API
    participant M4_DB as M4 Postgres DB
    participant UI as Deals Board UI

    M3->>Bus: Emit call.summary.generated (eventId, tenantId, summaryId, callId)
    activate M3
    deactivate M3
    
    par Update CRM linkage
        Bus->>M10: Consume call.summary.generated
        M10->>M10: Update CRM note records & relationship links
    and Enrich Deal Health & Board rows
        Bus->>M4: Consume call.summary.generated
        activate M4
        M4->>M4_DB: Read deal board mappings & active risk flags
        M4->>M4: Recompute health score using latest summary risk warnings
        M4->>M4_DB: Update m04_deal_intelligence.deal_drivers (refresh deal risk score)
        deactivate M4
    end

    UI->>M4: GET /api/v1/m04-deal-intelligence/boards/:id (tenantId)
    activate M4
    M4->>M4_DB: Read m04_deal_intelligence.deal_boards & deal_drivers
    M4_DB-->>M4: Return board configuration and deal records
    M4-->>UI: Return refreshed board rows (200 OK)
    deactivate M4
```

---

## 3. SD-02: Tracker Detection to Deal Risk Flag Update

This diagram illustrates the asynchronous flow when a dynamic keyword tracker in **M2** fires, creating a deal risk flag and updating the active pipeline Deals Board rows in **M4**.

```mermaid
sequenceDiagram
    autonumber
    participant M2 as M2 Conversation Intelligence
    participant Bus as Message Bus (BullMQ)
    participant M4 as M4 Background Worker
    participant M4_DB as M4 Postgres DB
    participant UI as Deals Board UI

    M2->>Bus: Emit tracker.detection.created (eventId, tenantId, trackerId, dealId)
    activate M2
    deactivate M2

    Bus->>M4: Consume tracker.detection.created
    activate M4
    M4->>M4_DB: SELECT * FROM m04_deal_intelligence.deal_drivers WHERE deal_id = :dealId AND tenant_id = :tenantId
    M4_DB-->>M4: Return current deal risk metadata
    
    alt New Risk Detection (Idempotency Check)
        M4->>M4: Append tracker risk flag and adjust deal health score
        M4->>M4_DB: Update m04_deal_intelligence.deal_drivers (set risk_flags & health_score)
        M4_DB-->>M4: Durable write complete
    else Duplicate Detection
        M4-->>M4: Log duplicate warning, skip write
    end
    deactivate M4

    UI->>M4: GET /api/v1/m04-deal-intelligence/boards/:id
    activate M4
    M4->>M4_DB: Fetch latest deal_drivers & deal_boards snapshots
    M4_DB-->>M4: Return deal board rows
    M4-->>UI: Return updated deal row with health badges
    deactivate M4
```

---

## 4. SD-03: User Opens Deals Board & Saved View Restoration

This diagram maps the read-heavy REST query path where a user opens the Deals Board UI, fetching the board layout, columns, and applying their personalized saved filters and views.

```mermaid
sequenceDiagram
    autonumber
    actor User as Sales Representative
    participant UI as Deals Board UI
    participant M4 as M4 Deal Intelligence API
    participant M4_DB as M4 Postgres DB

    User->>UI: Open Deals Board Screen
    UI->>M4: GET /api/v1/m04-deal-intelligence/boards/:id?viewId=:viewId
    activate M4
    
    M4->>M4_DB: Fetch board structure (m04_deal_intelligence.deal_boards)
    M4_DB-->>M4: Return board columns & filters schema
    
    M4->>M4_DB: Fetch custom preferences (m04_deal_intelligence.deal_board_views)
    M4_DB-->>M4: Return user column layouts, sorting preferences
    
    M4->>M4_DB: Fetch active deal rows (m04_deal_intelligence.deal_drivers joined with active deals)
    M4_DB-->>M4: Return deal records & health snapshots
    
    M4->>M4: Apply tenant scopes, pagination, sorting & filter models
    M4-->>UI: Return board configuration & filtered board rows (200 OK)
    deactivate M4
    UI-->>User: Render restored Deals Board
```

---

## 5. SD-04: User Opens View Deal Drivers Scoped Analytics

This diagram describes how a manager inspects rep-level driver analytics scoped to a specific Deals Board segment, served asynchronously using precomputed snapshots.

```mermaid
sequenceDiagram
    autonumber
    actor User as Sales Manager
    participant UI as Manager Portal UI
    participant M4 as M4 Deal Intelligence API
    participant M4_DB as M4 Postgres DB
    participant Bus as Message Bus (BullMQ)

    User->>UI: Click View Deal Drivers
    UI->>M4: GET /api/v1/m04-deal-intelligence/deal-drivers?boardId=:boardId
    activate M4
    
    M4->>M4_DB: Fetch latest driver snapshot (m04_deal_intelligence.deal_drivers)
    M4_DB-->>M4: Return computed driver records

    alt Fresh Snapshot Available (Within 5-minute TTL)
        M4-->>UI: Return cached rep-level driver analytics (200 OK)
    else Snapshot Stale (TTL Expired)
        M4->>Bus: Enqueue background driver recomputation job
        Bus-->>M4: Job accepted
        M4->>M4: Compute board-scoped derived analytics & rank risks
        M4->>M4_DB: Write refreshed snapshot to m04_deal_intelligence.deal_drivers
        M4-->>UI: Return updated rep-level driver analytics (200 OK)
    end
    deactivate M4
    UI-->>User: Render Deal Driver charts and drill-down cards
```

---

## 6. SD-05: ADR-005 Deals Board UI Stage-Change Request Pattern

This diagram details the core architectural constraint defined in **ADR-005**. When a user drags a deal card to a new stage column on the Deals Board UI:

```mermaid
sequenceDiagram
    autonumber
    actor User as Sales Representative
    participant UI as Deals Board UI
    participant M4 as M4 Deal Intelligence API
    participant M4_DB as M4 Postgres DB
    participant Bus as Message Bus (BullMQ)
    participant M10 as M10 Data & Compliance
    participant CRM as External CRM (Salesforce API)

    User->>UI: Drag Deal Card to new stage column (Optimistic transition)
    UI->>M4: POST /api/v1/m04-deal-intelligence/deals/:id/stage (body: targetStage)
    activate M4
    
    M4->>M4_DB: Write temporary optimistic stage to read-model (flag as "pending_sync")
    M4->>Bus: Publish internal request: deal.stage.update.requested (dealId, targetStage, tenantId)
    M4-->>UI: Return 202 Accepted (Stage change queued, pending CRM verification)
    deactivate M4

    Bus->>M10: Consume deal.stage.update.requested
    activate M10
    M10->>CRM: PATCH /services/data/v60.0/sobjects/Opportunity/:id (StageName = targetStage)
    activate CRM
    CRM-->>M10: Return 200 OK (CRM Update Successful)
    deactivate CRM
    
    M10->>M10: Write changes durably to m10_data_compliance.deals table
    M10->>Bus: Emit public platform event: deal.stage.changed (eventId, tenantId, dealId, stage)
    deactivate M10

    par Update Deal Board Column Position
        Bus->>M4: Consume deal.stage.changed
        activate M4
        M4->>M4_DB: Update m04_deal_intelligence.deal_drivers (set stage, clear "pending_sync" flag)
        M4_DB-->>M4: Durable write complete
        M4->>UI: Push Server-Sent Event (SSE) to update column position durably
        deactivate M4
    and Update Revenue Forecasts
        Bus->>M6 as M6 Forecasting & Prediction: Consume deal.stage.changed
        M6->>M6: Recalculate pipeline coverage & forecast projections
    and Trigger Outbound Workflows
        Bus->>M8 as M8 Sales Engagement: Consume deal.stage.changed
        M8->>M8: Trigger playbook sequences and email compose auto-drafts
    end
```
