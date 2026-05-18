# M10 Flows — Sequence Diagrams

| Field | Value |
| --- | --- |
| **Document ID** | Doc #11-Seq |
| **Module** | M10 Data & Compliance |
| **Technical Workspace** | `modules/m10-data-compliance/` |
| **Canonical API Prefix** | `/api/v1/m10-data-compliance` |
| **Owned Table Schema** | `m10_data_compliance` |
| **Status** | Approved |
| **Version** | v3.0 |
| **Last Updated** | 2026-05-18 |
| **Owner** | Technical Architecture Team & Relanto Engineering |

---

## 1. Introduction

This document houses the core sequence diagrams for the unified **M10 Data & Compliance** monorepo package workspace (`modules/m10-data-compliance/`). 

These flows represent the runtime boundaries between **M10**, the platform core, and peer modules. They enforce key architectural rules, including:
*   **Separation of TypeScript Logic and Python AI helper services**
*   **Decoupled event-driven module borders using BullMQ**
*   **Row-Level Security (RLS) database isolation**
*   **The Deals Board Stage-Change Pattern (ADR-005)**
*   **The Daily Synchronization Lock (02:00 UTC sync_id Redis key)**

---

## 2. Sequence Flows

### Flow 1 — Captured Interaction to Revenue Graph Entity Linking

This flow demonstrates how raw interaction recordings are converted into structured business relationships without direct cross-module database coupling.

```mermaid
sequenceDiagram
    autonumber
    participant EXT as External Platform (Zoom/Meet/SMTP)
    participant M1 as M1 Capture & Transcription
    participant BUS as Upstash Redis (BullMQ Event Bus)
    participant M10 as M10 Data & Compliance Service
    participant CRM as CRM External Adapter
    participant AI as Private Python AI Helper Service
    participant DB as Supabase PostgreSQL (m10_data_compliance)
    participant DOWN as Downstream Modules (M2-M9)

    EXT->>M1: Call recording / Email arrives
    M1->>M1: Transcribe audio & extract participants
    M1->>BUS: Publish call.transcription.completed event
    BUS->>M10: Deliver call.transcription.completed event to intake queue
    M10->>DB: Load interaction record + tenant_id context
    M10->>CRM: GET /api/v1/crm/candidates (emails/domains)
    CRM-->>M10: Return CRM account & deal candidates
    M10->>AI: POST /api/v1/ai/entity-resolution (RAG metadata matching)
    AI-->>M10: Return match candidate recommendations + confidence score
    M10->>M10: Evaluate deterministic rules & confidence thresholds
    M10->>DB: INSERT into m10_data_compliance.interaction_links (tenant_id check)
    M10->>BUS: Publish revenue_graph.entity.linked event
    BUS->>DOWN: Notify M2 (CI), M3 (Briefs), M4 (Deals), M7 (Dashboards), M9 (Coaching)
```

### Flow 2 — Admin Policy Update to Outreach Enforcement

This flow details how compliance rules are administered and subsequently enforced at runtime prior to dispatching outbound communications.

```mermaid
sequenceDiagram
    autonumber
    participant ADMIN as Tenant Admin / RevOps
    participant UI as M10 Admin Console
    participant M10 as M10 Data & Compliance Service
    participant DB as PostgreSQL (m10_data_compliance)
    participant AUD as Platform Core Audit Service
    participant M8 as M8 Sales Engagement (Email Composer / Playbooks)
    participant CRM as CRM Opt-out / Consent Store
    participant SMTP as Action Executor (SendGrid Sandbox)

    ADMIN->>UI: Create or update communication policy
    UI->>M10: POST /api/v1/m10-data-compliance/policies (tenant-scoped)
    M10->>DB: INSERT into m10_data_compliance.compliance_policies (active status)
    M10->>AUD: Log policy_updated event to audit table
    M10-->>UI: Return 201 Created + policy summary

    M8->>M10: POST /api/v1/m10-data-compliance/evaluate (email_send request)
    M10->>DB: Load active compliance policies for tenant
    M10->>CRM: Query contact opt-out and legal region (GDPR/CCPA)
    CRM-->>M10: Return communication restriction flags
    M10->>M10: Apply opt-out overrides + region rules

    alt Action is ALLOWED
        M10-->>M8: Return 200 OK (allow decision + reason code)
        M8->>SMTP: Dispatch outbound email
        M8->>AUD: Log allow decision to audit_logs
    else Action is BLOCKED
        M10-->>M8: Return 403 Forbidden (block decision + reason code)
        M8->>AUD: Log blocked decision with reason (e.g. GDPR_CONSENT_REQUIRED)
        M8-->>ADMIN: Display readable block explanation in UI
    end
```

### Flow 3 — Scheduled Data Cloud Export with Daily Sync Lock

This flow maps the scheduled daily extraction of platform records to client-owned destinations, showing the critical **02:00 UTC Redis sync_id lock** prevention check.

```mermaid
sequenceDiagram
    autonumber
    participant CRON as Platform Core Scheduler
    participant M10 as M10 Data & Compliance Service
    participant REDIS as Upstash Redis (Shared Lock Cache)
    participant DB as PostgreSQL (m10_data_compliance)
    participant AUD as Platform Core Audit Service
    participant WH as Customer Warehouse (Snowflake/BigQuery/S3)

    CRON->>M10: Trigger daily scheduled export (At 02:00 UTC strictly)
    M10->>REDIS: GET sync_id (Check if active export is running)
    
    alt Lock already exists
        REDIS-->>M10: Lock active (sync_id present)
        M10->>AUD: Log warning "Export execution blocked: Parallel run detected"
        M10-->>CRON: Terminate execution safely (No-op)
    else Lock is empty
        REDIS-->>M10: Lock free
        M10->>REDIS: SET sync_id with TTL (Acquire Daily Sync Lock)
        M10->>DB: Load tenant connector config & secrets reference
        M10->>DB: Load last watermarked checkpoints
        M10->>DB: SELECT incremental dataset rows where updated_at > checkpoint
        M10->>M10: Transform rows into destination schema batches
        M10->>WH: Upsert/Append data batches (Idempotent Merge check)
        
        alt Export SUCCESS
            WH-->>M10: Return 200 OK Success
            M10->>DB: UPDATE checkpoints table with new cursor watermark
            M10->>DB: INSERT into m10_data_compliance.data_cloud_export_runs (status = success)
            M10->>REDIS: DEL sync_id (Release Daily Sync Lock)
        else Export FAILURE
            WH-->>M10: Return error (Connection Timeout / Credential Error)
            M10->>DB: INSERT into m10_data_compliance.data_cloud_export_runs (status = failed)
            M10->>REDIS: DEL sync_id (Release lock to support immediate replay retry)
            M10->>AUD: Trigger PagerDuty operational alert
        end
    end
```

### Flow 4 — Deals Board Stage-Change Pattern (ADR-005)

This flow documents how UI-triggered pipeline stage updates are coordinated through M10 to maintain CRM synchronization integrity.

```mermaid
sequenceDiagram
    autonumber
    participant UI as M4 Deals Board UI
    participant M4 as M4 Deal Intelligence Service
    participant BUS as Redis Queue (BullMQ Event Bus)
    participant M10 as M10 Data & Compliance Service
    participant CRM as External CRM Platform (Salesforce/HubSpot)
    participant M8 as M8 Sales Engagement (Sequence Workflows)
    participant M6 as M6 Forecasting (Coverage Pipelines)

    UI->>M4: Sales rep drags deal card to new stage
    M4->>M4: Perform optimistic local DB update
    M4->>BUS: Publish internal deal.stage.update.requested message
    BUS->>M10: Deliver update request message to coordinate queue
    M10->>CRM: PATCH /opportunity/:id (Synchronize new stage value)
    CRM-->>M10: Sync successful (200 OK response committed)
    M10->>M10: Commit change to m10_data_compliance.deals table
    M10->>BUS: Publish public platform event deal.stage.changed
    BUS->>M4: Consume event to lock card position on Board
    BUS->>M8: Consume event to trigger stage-based auto-playbooks
    BUS->>M6: Consume event to recalculate quarterly forecast predictions
```

---

## 3. Diagram Usage & Review Guidelines

*   **Engineering Implementation Reference**: Developers building M10 backend controllers must structure their code to support the exact event contracts and asynchronous boundaries outlined in these diagrams.
*   **At-Least-Once Delivery**: Downstream modules consuming `revenue_graph.entity.linked` or `deal.stage.changed` must implement standard idempotency checks to tolerate duplicate event deliveries safely.
*   **Doppler Secrets Context**: Database adapters and CRM integration services depicted in Flows 1, 2, and 3 must retrieve their API keys and connection strings dynamically via Doppler secrets mapping, never referencing plaintext strings in code.