# Module README: M4 Deal Intelligence

**Workspace Directory:** `modules/m04-deal-intelligence/`  
**Reference Doc Path:** `/Reference documents/M4 Deal Intelligence/Module README-M4 Deal Intelligence.md`

## 1. Document Control

- **Document Title:** Module README: M4 Deal Intelligence
- **Module:** M4 Deal Intelligence
- **Owner:** Product Engineering — M4
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Module Overview

**M4 Deal Intelligence** is the core product and backend module that helps sales representatives, managers, and revenue leaders manage, review, and analyze pipeline health. It serves two core user-facing features: **Deals Boards** and **View Deal Drivers**.

This module turns raw CRM transaction data, AI-generated risk signals, meeting summaries, and engagement timelines into actionable pipeline workspaces. 

From the platform lifecycle perspective, M4 resides inside **Stage 5 — Execute**. It acts as the primary workspace where revenue organizations inspect deal risks, drill down into customer conversation drivers, and optimistically trigger pipeline changes.

Core outputs owned and computed by M4 are:
- Unified multi-stage pipeline board views for active deals, columns, and custom user filters.
- Persisted board configurations, column orders, and personalized saved views.
- Deal health metrics, MEDDIC/BANT validation parameters, and deal risk scores.
- Rep-level and board-scoped deal driver snapshot aggregations.

---

## 3. Physical Workspace & Schema Definition

Under the v3.0 platform architecture, M4 is a fully decoupled physical monorepo package with absolute ownership of its backend routes, background workers, migrations, and storage models:

- **Technical Workspace:** `modules/m04-deal-intelligence/`
- **PostgreSQL Schema Namespace:** `m04_deal_intelligence`
- **Canonical API Prefix:** `/api/v1/m04-deal-intelligence`
- **Global Enablement Flag:** `M04_ENABLED`

---

## 4. Module Boundaries & Dependencies

M4 owns the presentation, customization, and analytical aggregation of deal-level pipeline intelligence. It does **not** directly own raw CRM database synchronization, speech-to-text transcription, call summarization, or account-level dashboards.

```
                  ┌─────────────────────────────────────────┐
                  │      M10 Data & Compliance (CRM)        │
                  └────────────────────┬────────────────────┘
                                       │ (deals, activities)
                                       v
┌──────────────────────────────────────┴────────────────────────────────────┐
│                       M4 Deal Intelligence (Workspace)                    │
│                                                                           │
│   ┌──────────────────────────────────────┐  ┌─────────────────────────┐   │
│   │           Deals Boards               │  │    View Deal Drivers    │   │
│   │   (m04_deal_intelligence.boards)     │  │  (m04_deal_drivers)     │   │
│   └──────────────────┬───────────────────┘  └────────────▲────────────┘   │
└──────────────────────┼───────────────────────────────────┼────────────────┘
                       │ (deal.stage.update.requested)     │ (tracker.detection.created)
                       v                                   │
                  ┌────┴───────────────────────────────────┴─┐
                  │      Message Bus (BullMQ / Redis)       │
                  └────────────────────┬────────────────────┘
                                       │ (deal.stage.changed)
                                       v
                  ┌────────────────────┴────────────────────┐
                  │     M6 Forecasting & Prediction (M6)    │
                  └─────────────────────────────────────────┘
```

### Upstream Dependencies (Inputs Consumed)
- **M1 Capture & Transcription:** Supplies raw transcripts and meeting segments.
- **M2 Conversation Intelligence:** Emits `tracker.detection.created` and `call.topics.tagged` events to drive deal risk flags and driver aggregations.
- **M3 AI Summaries & GenAI:** Emits `call.summary.generated` to invalidate cached board context and update brief details.
- **M10 Data & Compliance (Revenue Graph):** Supplies permission models, deal structures, and account relationships.

### Downstream Consumers (Outputs Emitted)
- **M6 Forecasting & Prediction:** Consumes stage change events to update revenue forecasts and quotas.
- **M8 Sales Engagement:** Evaluates deal risks and drivers to trigger workflow playbooks and email templates.
- **M9 Coaching & Training:** Inspects deal-driver warning patterns to trigger sales coaching exercises.

---

## 5. API Specification

All REST API endpoints are hosted under the unified prefix: `/api/v1/m04-deal-intelligence`.

| HTTP Method | Route Path | Description |
| :--- | :--- | :--- |
| **GET** | `/api/v1/m04-deal-intelligence/boards` | Fetch all active deals boards configurations for the tenant. |
| **GET** | `/api/v1/m04-deal-intelligence/boards/:id` | Retrieve scoped deals and columns formatted for Deals Board display. |
| **POST** | `/api/v1/m04-deal-intelligence/boards/:id/views` | Create or update a personalized saved view (filters, columns, sorting). |
| **POST** | `/api/v1/m04-deal-intelligence/deals/:id/stage` | Optimistically request a deal stage change (triggers internal ADR-005 loop). |
| **GET** | `/api/v1/m04-deal-intelligence/deal-drivers` | Retrieve rep-level, team-level, or board-scoped deal driver snapshots. |

---

## 6. Events Specification

M4 operates asynchronously using **BullMQ** on Redis.

### Events Consumed
- `revenue_graph.entity.linked` (Updates active boards with new entity association links).
- `tracker.detection.created` (Triggers asynchronous deal driver snapshot updates).
- `call.summary.generated` (Invalidates deal brief details and triggers board UI refresh signals).
- `deal.stage.changed` (Emitted by **M10**; durably locks deal stage changes in the local read models).
- `email.sent` (Updates deal's last activity timestamps).

### Internal Request Messages
- `deal.stage.update.requested` (Published by M4 to request a CRM synchronization from **M10**).

---

## 7. Data Ownership & Schema Layout

All tables are defined inside `modules/m04-deal-intelligence/prisma/schema.prisma` under the `m04_deal_intelligence` PostgreSQL schema.

- `deal_boards` (Stores deal board layouts, column setups, and standard tenant definitions).
- `deal_board_columns` (Stores columns mapped to pipeline stage configurations).
- `deal_board_views` (Stores custom user-defined board view preferences).
- `deal_drivers` (Stores computed deal risk parameters, MEDDIC/BANT checklists, and snapshot metrics).

---

## 8. Special Domain Rules & Constraints

### A. The UI Stage-Change Request Pattern (ADR-005)
When a salesperson drags and drops a deal card to a new stage in the Deals Board UI:
1. M4 performs an optimistic local DB update and publishes an internal `deal.stage.update.requested` message to BullMQ.
2. **M10 Data & Compliance** consumes this request, executes the outbound synchronization to the external CRM system (Salesforce/HubSpot), and waits for success.
3. Once the external CRM updates successfully, **M10** publishes the public platform event `deal.stage.changed` to the message bus.
4. M4, M8, and M6 consume `deal.stage.changed`. M4 writes the stage change durably. M4 is strictly prohibited from writing directly to the external CRM or emitting the public `deal.stage.changed` event directly from UI triggers.

### B. Event-Driven Loop Safety
M10 (Revenue Graph) supplies transaction data to M4, but M10 also consumes `deal.stage.changed` (emitted after CRM sync). Developers must rely strictly on asynchronous event propagation rather than attempting synchronous cross-module updates, preventing database locks and circular dependency deadlocks.
