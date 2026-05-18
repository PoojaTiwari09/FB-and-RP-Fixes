# M10 Flows — Sequence Diagrams

This document contains the key sequence diagrams for the M10 product-facing grouping: **Revenue Graph**, **Configure Compliance Settings**, and **Data Cloud / Data Export**. M10 is grouped together at the product level, but the actual runtime ownership is split: Revenue Graph and Data Cloud align mainly to the model/data platform, while Configure Compliance Settings is a cross-cutting governance capability enforced across platform actions.[1][2]

These flows are written to help backend engineers, QA engineers, PMs, and freshers understand where events begin, where ownership changes, and where enforcement or export decisions are made. The architecture requires event-driven module communication, strict tenant isolation, idempotent jobs, and customer-owned data export without manual Relanto.ai intervention.[2]

## Flow 1 — Captured interaction to Revenue Graph entity linking

This flow shows how raw captured interaction data becomes structured revenue context. The system architecture places Revenue Graph in the model stage, where captured interaction records are cleaned, normalized, and connected to accounts, contacts, deals, and other revenue entities so downstream modules can use business context instead of disconnected raw data.[1][2]

```mermaid
sequenceDiagram
    autonumber
    participant EXT as External System
    participant M01 as M-01 Capture / Connectors
    participant BUS as Event Bus
    participant M03 as Revenue Graph Service
    participant CRM as CRM Context Adapter
    participant AI as AI Entity Resolution Service
    participant DB as Tenant-scoped DB
    participant DOWN as Downstream Modules

    EXT->>M01: Call / email / meeting / CRM activity arrives
    M01->>DB: Store raw interaction with tenant_id
    M01->>BUS: Publish call.transcription.completed or equivalent event
    BUS->>M03: Deliver capture-complete event
    M03->>DB: Load interaction + tenant-safe source context
    M03->>CRM: Fetch account / contact / deal candidates
    CRM-->>M03: CRM entities and mapping hints
    M03->>AI: Resolve entity matches using transcript + CRM context
    AI-->>M03: account_id / deal_id / contact_id candidates
    M03->>M03: Apply mapping rules and confidence thresholds
    M03->>DB: Persist linked entities in Revenue Graph tables
    M03->>BUS: Publish revenue_graph.entity.linked
    BUS->>DOWN: Notify M-04, M-05, M-06, M-07, M-08 consumers
```

### Notes

- M-01 is the capture entry point and M-03 is the model-stage owner that turns raw interaction records into linked business context.[1][2]
- Downstream modules should consume the published event or public contracts rather than directly querying internal ownership logic, because the platform architecture requires event-driven boundaries between modules.[2]
- Every write must stay tenant-scoped, because the architecture mandates shared PostgreSQL with RLS and no cross-tenant mixing of client data.[2]

## Flow 2 — Admin policy update to outreach enforcement

This flow shows how an admin configuration change becomes a real runtime enforcement decision for email or call actions. The product mapping defines Configure Compliance Settings as admin-configured email and call compliance rules, and the architecture requires the platform to enforce CRM opt-outs and regional policies through shared governance controls.[1][2]

```mermaid
sequenceDiagram
    autonumber
    participant ADMIN as Tenant Admin / RevOps
    participant UI as Admin Console
    participant API as Compliance Policy API
    participant DB as Compliance Schema
    participant AUD as Audit Service
    participant ENG as Email / Call / Workflow Service
    participant POL as Policy Evaluation Service
    participant CRM as CRM Opt-out / Consent Source
    participant ACT as Action Executor

    ADMIN->>UI: Create or update compliance policy
    UI->>API: Submit tenant-scoped policy change
    API->>DB: Save policy version and active config
    API->>AUD: Log policy create / update / activate event
    API-->>UI: Return success + policy summary

    ENG->>POL: Evaluate planned email / call / workflow action
    POL->>DB: Load active tenant compliance policies
    POL->>CRM: Load opt-out, consent, and region context
    CRM-->>POL: Return communication restriction signals
    POL->>POL: Apply tenant policy + regional rules

    alt Action allowed
        POL-->>ENG: allow + reason code
        ENG->>ACT: Execute send / call / workflow step
        ENG->>AUD: Log allow decision
    else Action blocked
        POL-->>ENG: block + reason code
        ENG->>AUD: Log blocked decision
        ENG-->>UI: Return readable block reason to user
    end
```

### Notes

- Compliance configuration is not enough by itself; enforcement must happen at runtime immediately before outreach or governed actions execute.[2]
- The main runtime inputs are tenant policy, CRM opt-out state, consent information, and region-aware rules such as GDPR- and CCPA-oriented restrictions.[1][2]
- Audit logging is required both for policy changes and for allow/block decisions, because this feature affects governance-sensitive platform actions.[2]

## Flow 3 — Scheduled Data Cloud export and retry

This flow shows how customer-owned platform data moves to a client-owned warehouse. The product mapping defines Data Cloud as a structured export capability for conversations, deal insights, forecast data, user activity, and AI insights, while the architecture requires daily sync, supported warehouse destinations, idempotent jobs, and customer ownership of exported data.[1][2]

```mermaid
sequenceDiagram
    autonumber
    participant SCH as Scheduler / Queue Trigger
    participant ORCH as Data Cloud Orchestrator
    participant CFG as Connection Config Store
    participant CP as Checkpoint Store
    participant SRC as Revenue Graph + Source Datasets
    participant XFORM as Export Transformer
    participant WH as Customer Warehouse
    participant RUN as Export Run Log
    participant DLQ as Retry / Dead-letter Flow

    SCH->>ORCH: Trigger scheduled daily export for tenant
    ORCH->>CFG: Load tenant destination config + secrets reference
    CFG-->>ORCH: Destination type and active connection
    ORCH->>CP: Load last successful checkpoint
    CP-->>ORCH: Return dataset cursors / last sync timestamps
    ORCH->>RUN: Create export run with idempotency key
    ORCH->>SRC: Read tenant-scoped changed data
    SRC-->>ORCH: Structured source rows
    ORCH->>XFORM: Build export schema payloads
    XFORM-->>ORCH: Warehouse-ready batches
    ORCH->>WH: Upsert / append export batches

    alt Export success
        WH-->>ORCH: Success
        ORCH->>CP: Advance checkpoints
        ORCH->>RUN: Mark run successful
    else Export failure
        WH-->>ORCH: Error / partial write failure
        ORCH->>RUN: Mark run failed or partial_failed
        ORCH->>DLQ: Queue retry / replay action
    end
```

### Notes

- Data Cloud belongs to the customer-ownership story: clients must be able to export all of their data, in full, to supported client-owned destinations such as Snowflake, BigQuery, Databricks, S3, and Redshift.[2]
- Export runs must be idempotent and safe to retry, because the architecture explicitly marks Data Cloud jobs as idempotent and daily sync as the required baseline behavior.[2]
- Source reads and destination writes must remain tenant-scoped, because cross-tenant data access is forbidden across the platform.[2]

## Flow 4 — Consent change or deletion to governance and export enforcement

This flow shows how a consent revocation or deletion request affects both compliance behavior and exported data behavior. The architecture requires client data deletion to be automated, forbids shared-model training use without explicit consent, and treats Configure Compliance Settings plus Data Cloud as enforcement points for customer-controlled data usage.[2]

```mermaid
sequenceDiagram
    autonumber
    participant SRC as CRM / Admin / Privacy Request Source
    participant GOV as Governance Intake Service
    participant DB as Compliance / Core Data Store
    participant BUS as Event Bus
    participant POL as Policy Evaluation Service
    participant ENG as Outreach Services
    participant DC as Data Cloud Orchestrator
    participant AUD as Audit Service

    SRC->>GOV: Consent revoked or deletion request submitted
    GOV->>DB: Persist consent change or deletion state
    GOV->>AUD: Log governance event
    GOV->>BUS: Publish consent.updated or deletion.request.completed

    BUS->>POL: Notify compliance enforcement layer
    POL->>DB: Refresh policy-relevant consent / deletion state
    POL-->>ENG: Future governed actions now blocked or restricted

    BUS->>DC: Notify export pipeline of updated governance state
    DC->>DB: Resolve affected datasets / tombstones / exclusions
    DC->>AUD: Log export-governance adjustment
    DC-->>DC: Apply next export behavior (exclude, tombstone, or delete marker)
```

### Notes

- The architecture explicitly says no AI training pipeline may read client data unless an explicit consent record exists, so consent changes are governance events, not just profile updates.[2]
- Client data deletion must be an automated operation, and future exports must reflect deletion-aware behavior rather than relying on manual cleanup.[2]
- This flow touches both cross-cutting governance and Data Cloud, which is why it should stay in a shared M10 flows document rather than inside only one feature TDD.[2]

## Diagram usage rules

Use these sequence diagrams as **cross-feature flow references**, not as replacements for feature TDDs. The system architecture says feature-specific internal logic belongs in the relevant TDD, while shared infrastructure, data-flow understanding, and module interaction patterns belong in architecture and sequence documentation.[2]

### Recommended mapping

| Diagram | Primary owner | Supporting docs |
|---|---|---|
| Captured interaction to Revenue Graph entity linking | Revenue Graph / M-03 | `tdd-revenue-graph.md` |
| Admin policy update to outreach enforcement | Platform Core / Governance | `tdd-configure-compliance-settings.md` |
| Scheduled Data Cloud export and retry | Data Platform / M-03 | `tdd-data-cloud.md` |
| Consent change or deletion to governance and export enforcement | Shared: Governance + Data Cloud | `tdd-configure-compliance-settings.md`, `tdd-data-cloud.md` |

The best way to maintain M10 documentation is to keep **one README, three feature TDDs, and one shared flows file**. That keeps the product grouping understandable for freshers while preserving the real architecture ownership boundaries needed by engineers and reviewers.[1][2]