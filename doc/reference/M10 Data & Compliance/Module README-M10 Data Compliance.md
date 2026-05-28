# Module README — M10 Data & Compliance

| Field | Value |
| --- | --- |
| **Document ID** | Doc #11 |
| **Module** | M10 Data & Compliance |
| **Technical Workspace** | `modules/m10-data-compliance/` |
| **Platform Lifecycle Stage** | Stage 2 — `Model` & Cross-cutting Governance |
| **Canonical API Prefix** | `/api/v1/m10-data-compliance` |
| **Owned Table Schema** | `m10_data_compliance` |
| **Status** | Approved |
| **Version** | v3.0 |
| **Last Updated** | 2026-05-18 |
| **Owner** | Technical Architecture Team & Relanto Engineering |

---

## 1. Introduction & Overview

**M10 Data & Compliance** is a unified, foundational monorepo workspace module that groups three critical platform-level capabilities: **Revenue Graph**, **Configure Compliance**, and **Data Cloud / Data Export**. Together, these capabilities connect captured customer interactions to structural revenue entities, enforce compliant outreach and data-usage governance controls, and allow customers reliable, automated access to their own exported platform data.

Unlike legacy draft models that treated M10 as a virtual coordination layer, under the **v3.0 Single Source of Truth (SSOT)**, M10 is physically unified under a single monorepo package at `modules/m10-data-compliance/`. It provides a clean, decoupled boundary that manages transactional relationships and cross-cutting governance without polluting downstream analytics or LLM execution layers.

---

## 2. Decoupled Workspace Boundaries & Positioning

M10 operates at **Stage 2 — `Model` & Cross-cutting Governance** within the platform lifecycle. It acts as the structural gateway between raw raw interaction events (Stage 1) and downstream intelligence, forecasting, and visualization modules (Stages 3–7).

```
  ┌──────────────────────────────────────────┐
  │      M1 Capture & Transcription          │
  └────────────────────┬─────────────────────┘
                       │
                       │ (call.transcription.completed)
                       v
  ┌──────────────────────────────────────────┐
  │   M10 Data & Compliance (Workspace)      │ <─── Enforces opt-out & consent rules
  └──────────┬────────────────────┬──────────┘
             │                    │
             │ (linked metadata)  │ (linked metadata)
             v                    v
  ┌──────────────────────┐    ┌──────────────────────┐
  │ M2 Conversation Intel│    │ M3 AI Summaries/GenAI│
  └──────────────────────┘    └──────────────────────┘
```

### Core Workspace Information
*   **Physical Workspace Directory**: `modules/m10-data-compliance/`
*   **Canonical API Prefix**: Strictly `/api/v1/m10-data-compliance` across all endpoints.
*   **PostgreSQL Isolated Schema Namespace**: `m10_data_compliance` (Enforced via RLS and prisma schemas).
*   **Technology Backing**: Supabase PostgreSQL 16 (system of record), pgvector (optional graph entity embeddings), Upstash Redis (BullMQ queue orchestration and synchronization locking).

---

## 3. Core Capability Design

M10 is architected around three core design zones, unified under the `modules/m10-data-compliance/` boundary but cleanly modularized in code:

### 3.1 Revenue Graph
Revenue Graph is the connected relationship layer that links captured calls, meetings, emails, CRM records, and external activity signals to the correct account, contact, deal, and user entities.
*   **Automated Data Capture Engine**: Normalizes and consumes lifecycle activity signals from **M1 Capture & Transcription** and email providers.
*   **Contextual Data Mapping**: Links records to CRM entities using deterministic email-domain matching and rule-based hierarchies first, leveraging Python FastAPI AI resolution services only as a fallback.
*   **AI Context Layer**: Exposes unified, tenant-scoped relationship APIs so downstream modules (M2, M3, M4, M5, M6) can operate with business meaning rather than raw text.

#### The Deals Board Stage-Change Pattern (ADR-005)
To prevent direct database writes or out-of-order event publishing:
1. When a salesperson changes a deal card stage in the **M4 Deal Intelligence** UI, M4 performs an optimistic local DB update and publishes an internal `deal.stage.update.requested` request message.
2. **M10** consumes this internal message, performs the outbound synchronization to the external CRM system, and waits for a successful sync.
3. Upon success, **M10** publishes the public platform event `deal.stage.changed` to the event bus.
4. **M4**, **M8**, and **M6** consume `deal.stage.changed` to update their respective records. Direct CRM writes are prohibited outside M10.

### 3.2 Configure Compliance Settings
Configure Compliance Settings is the cross-cutting governance layer that allows tenant admins to define and enforce communication and data-usage policies across the platform.
*   **Opt-out Enforcement**: Automatically checks CRM opt-out preferences (Do Not Contact flags) immediately prior to outbound dispatches.
*   **Regional Policy Handling**: Enforces GDPR- and CCPA-oriented rules based on contact, account, or tenant jurisdiction.
*   **Runtime Action Gates**: Evaluates allow/block decisions for **M8 Sales Engagement** (Email Composer, Workflow Automation) and future call executors.
*   **Safe Failure Mode**: Fails closed and blocks communication if compliance-critical opt-out or consent data is unavailable.

### 3.3 Data Cloud / Data Export
Data Cloud is the structured data export pipeline that lands customer-owned platform data into customer warehouses (Snowflake, BigQuery, Databricks, Amazon S3, Redshift).
*   **Full Portability**: Enables full data export without manual intervention from Relanto.ai staff, fulfilling core customer data ownership.
*   **Idempotency & Replay**: Enforces batching, checkpoint watermarks, and retry-safe upserts so that job failures can be recovered without duplicating records.
*   **The Daily Synchronization Lock**: The scheduled export process executes daily starting strictly at **02:00 UTC**. To prevent duplicate parallel export processes, the orchestrator obtains and holds a persistent **`sync_id`** lock key in Redis for the duration of the run.

---

## 4. System Event Boundaries

All inter-module communication is asynchronous and driven by event-driven BullMQ queues on Redis.

### 4.1 Events Consumed
M10 consumes the following platform event contracts:
*   `call.transcription.completed` (Triggers interaction mapping to accounts and deals).
*   `crm.fields.extracted` (Pushes key structured data parameters into relational tables).
*   `email.sent` (Captures outreach activities to update transaction timelines).
*   `call.summary.generated` (Saves generated summaries to CRM opportunity note fields).

### 4.2 Events Emitted
M10 publishes the following public events to notify downstream consumers:
*   `revenue_graph.entity.linked` (Fires after successful CRM entity resolution and matching).
*   `deal.stage.changed` (Fires after a deal stage change is durably recorded/synced to CRM).

---

## 5. PostgreSQL Schema Namespace (`m10_data_compliance`)

All transactional, relational, and governance tables owned by M10 reside strictly within the `m10_data_compliance` schema namespace. 

### Table Inventory
*   `m10_data_compliance.accounts`: Tenant-scoped CRM-synced account records.
*   `m10_data_compliance.contacts`: Tenant-scoped contact records and identity resolution fields.
*   `m10_data_compliance.deals`: Opportunity/deal records required for relationship mapping.
*   `m10_data_compliance.activities`: Interaction timeline entries linked to accounts, contacts, and deals.
*   `m10_data_compliance.interaction_links`: Mapped relationships per interaction, including confidence and explanation.
*   `m10_data_compliance.compliance_policies`: Tenant policy definitions for regional and channel rules.
*   `m10_data_compliance.crm_optouts`: Opt-out preferences synced from CRM or manual input.
*   `m10_data_compliance.consent_logs`: Consent grant and revocation records per tenant and contact.
*   `m10_data_compliance.data_cloud_connections`: Tenant-scoped warehouse destination configurations.
*   `m10_data_compliance.data_cloud_export_runs`: Job run tracking and status history.
*   `m10_data_compliance.data_cloud_checkpoints`: Sync watermarks per export domain.

---

## 6. Environment Variables Naming Convention

All environment configuration variables owned by M10 carry the standard `M10_` prefix to enforce monorepo boundaries. 

### Naming Patterns
*   `M10_ENABLED`: Central toggle for the M10 module.
*   `M10_REVENUE_GRAPH_ENABLED`: Enables entity resolution and linking.
*   `M10_COMPLIANCE_ENABLED`: Enables policy evaluation and opt-out checks.
*   `M10_DATA_EXPORT_ENABLED`: Enablesscheduled exports.
*   `M10_API_PREFIX`: Unified prefix `/api/v1/m10-data-compliance`.
*   `M10_API_PORT`: Standard monorepo port `3010`.
*   `M10_DATABASE_URL`: Connection string for PostgreSQL schema.

---

## 7. Recommended Documentation Directory Structure

To maintain clean technical borders, documentation inside the monorepo is organized as follows:

```text
docs/modules/m10-data-compliance/
├── README.md                                  # This module overview
├── env-registry.md                            # Complete environment variables
├── sequence-diagrams.md                       # Core Mermaid runtime flows
└── TDD/
    ├── TDD-Revenue-Graph.md                   # Technical design for relationship graph
    ├── TDD-Configure-Compliance-Settings.md   # Technical design for governance policy
    └── TDD-Data-Cloud-Export.md               # Technical design for warehouse connectors
```

---

## 8. Common Mistakes to Avoid

*   **Treating M10 as a Virtual Product Wrapper**: Do not split code or configuration files into conceptual virtual namespaces. Keep all transactional, schema, and route definitions within `modules/m10-data-compliance/`.
*   **Direct Schema Queries**: Bypassing API and event boundaries to run direct SQL joins on M10 tables is strictly prohibited. Downstream modules must consume `revenue_graph.entity.linked` or call public REST APIs.
*   **Bypassing Runtime Compliance Checks**: Do not assume compliance settings are purely configuration screens. Enforcement must happen at actual outreach decision points at runtime.
*   **ClickHouse Integration Placement**: Columnar dashboard queries and performance aggregations belong strictly to **M7 R-Revenue Dashboards** under the `m07_revenue_dashboards` namespace. Do not add raw ClickHouse analytical tables to the transactional `m10_data_compliance` schema.
*   **Bypassing ADR-005**: Do not let **M4 Deal Intelligence** perform direct database writes to CRM tables or emit `deal.stage.changed` directly. Ensure all UI-triggered stage updates route through M10 using `deal.stage.update.requested`.
