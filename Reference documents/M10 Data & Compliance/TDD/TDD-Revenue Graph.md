# TDD — Revenue Graph

| Field | Value |
| --- | --- |
| **Document ID** | Doc #11a |
| **Module** | M10 Data & Compliance |
| **Feature** | Revenue Graph |
| **Technical Workspace** | `modules/m10-data-compliance/` |
| **Platform Lifecycle Stage** | Stage 2 — `Model` & Cross-cutting Governance |
| **Canonical API Prefix** | `/api/v1/m10-data-compliance` |
| **Owned Table Schema** | `m10_data_compliance` |
| **Status** | Approved |
| **Version** | v3.0 |
| **Last Updated** | 2026-05-18 |
| **Owner** | Technical Architecture Team & Relanto Engineering |

---

## 1. Boundary & Workspace Note

**Ownership Boundary:**  
Under the approved **v3.0 Single Source of Truth (SSOT)**, the Revenue Graph feature is technically owned and implemented within the single physical monorepo package workspace at `modules/m10-data-compliance/`. It manages the relationship data layer that maps captured customer interactions to accounts, contacts, deals, and activities. 

Revenue Graph is a transactional data service; it does **not** absorb downstream analytical scoring, forecasting metrics, coaching recommendation algorithms, or BI rendering logic. Cross-module queries are strictly routed through published event boundaries and public REST APIs. Direct PostgreSQL schema joins by peer modules are forbidden.

**Shared Dependencies:**  
*   **M1 Capture & Transcription** for asynchronous call, email, and meeting capture events.
*   **Platform Core** for Supabase JWT validation, RBAC, Redis BullMQ queues, and Doppler secrets management.
*   **CRM External Adapter** to interface with Salesforce, HubSpot, and Microsoft Dynamics 365.
*   **Private Python AI Service** for semantic entity-resolution assistance and candidate ranking.
*   **Supabase PostgreSQL 16** with forced Row-Level Security (RLS) and shared-schema tenant isolation.

---

## 2. Technical Purpose & Business Value

### Purpose
Revenue Graph serves as the relational mapping layer of the platform. Its primary objective is to clean, normalize, and connect raw captured customer interactions (calls, meetings, emails) with the correct tenant, account, contact, deal, and activity timeline. Without Revenue Graph, downstream modules would operate on disconnected raw texts and audio. It provides the structured business context that enables advanced deal analytics, smart summary generation, forecasting calculations, and coaching metrics.

### Business Value
*   **Zero Manual Rep Logging**: Captures customer outreach activities automatically, updating CRM pipelines without human effort.
*   **Pipeline Visibility**: Links meeting transcripts and email threads directly to open opportunities, letting sales leaders inspect deal progression.
*   **AI Insight Correctness**: Downstream LLM processes utilize linked account and deal attributes to contextually scope summaries, briefs, and risk analysis.
*   **Portability & Compliance**: Builds a tenant-isolated relationship ledger that can be exported in full to customer warehouses via Data Cloud.

---

## 3. Scope & Non-Goals

### In Scope
*   Normalizing call, email, and meeting intake payloads from **M1 Capture & Transcription**.
*   Matching external email domains and attendee sets to CRM accounts and contacts.
*   Mapping interactions to active pipeline deals based on participant ownership and stage criteria.
*   Maintaining relationship edges and link watermarks within PostgreSQL.
*   Exposing a stable set of public, tenant-scoped read REST APIs for peer modules.
*   Publishing the public platform event `revenue_graph.entity.linked` after successful DB commits.
*   Coordinating opportunity stage changes via the **ADR-005 Deals Board Stage-Change Pattern**.

### Out of Scope
*   Generating raw transcripts or speaker diarization (owned by **M1**).
*   Scorecard grading, topic tagging, or keyword tracking (owned by **M2**).
*   Executive smart summary and deep research generation (owned by **M3**).
*   Aggregating performance attainment dashboards (owned by **M7**).
*   Managing data-cloud destination connectors (handled by the M10 Data Export engine).

---

## 4. Functional Requirements

*   **FR-1 Automatic Activity Normalization**: The intake worker consumes interaction events, validating that the payloads are normalized and structured before matching begins.
*   **FR-2 Mandatory Tenant Resolution**: The query middleware enforces tenant context via Supabase JWT claims. Inbound events lacking `tenant_id` are rejected immediately.
*   **FR-3 Rule-Based & AI-Assisted Entity Linking**: Links activities using deterministic rules first, falling back to Python-based semantic embeddings only when deterministic scores are ambiguous.
*   **FR-4 Explainable Confidence Mapping**: Stores link decisions with clear classification levels (`high`, `medium`, `low`) and structured explanation logs for admin review.
*   **FR-5 Retry-Safe Idempotent Writes**: Uses database upsert constraints and BullMQ deduplication to guarantee that replayed ingestion jobs do not generate duplicate activity rows.
*   **FR-6 Transactional Stage-Change Management**: Implements **ADR-005** to coordinate CRM opportunity updates on UI events.

---

## 5. Architectural Design & Flow

### 5.1 Automated Data Ingestion
1. **M1 Capture & Transcription** publishes `call.transcription.completed`.
2. M10's intake worker consumes the event and validates the standard v1 envelope structure.
3. The worker invokes the relationship pipeline asynchronously via BullMQ on Redis.

### 5.2 Contextual Resolution Precedence
The resolution engine matches interactions using a strict priority order:
1.  **Exact Email Address Match**: Checks participants against `m10_data_compliance.contacts`.
2.  **Domain-to-Account Mapping**: Maps email domains to `m10_data_compliance.accounts` (skipping free domains like `gmail.com`).
3.  **Active Opportunity Linkage**: Queries `m10_data_compliance.deals` to link the activity to open opportunities owned by the seller.
4.  **AI Semantic Fallback**: If multiple open opportunities exist, M10 POSTs to the private Python AI service to evaluate context similarity between the transcript and active deal descriptions, ranking candidates.
5.  **Durable Save & Event Publication**: Commits the activity record, writes to `m10_data_compliance.interaction_links`, and publishes `revenue_graph.entity.linked` downstream.

### 5.3 Deals Board Stage-Change Pattern (ADR-005)
When a seller drags a deal card in the **M4 Deal Intelligence** UI:
1. M4 performs an optimistic local DB stage change and publishes `deal.stage.update.requested` to BullMQ.
2. **M10** consumes this request, triggers the outbound CRM PATCH call via `M10_CRM_CONTEXT_API_BASE_URL` using the authorization key `M10_CRM_CONTEXT_API_KEY`, and awaits standard HTTP confirmation.
3. Upon durable CRM success, M10 updates the stage in `m10_data_compliance.deals` and publishes `deal.stage.changed` to the platform.
4. **M4** consumes the change event to commit its board state; **M8** and **M6** consume it to trigger automated playbooks and predictive forecasts.

---

## 6. PostgreSQL Database Schema Namespace (`m10_data_compliance`)

All tables reside under the isolated `m10_data_compliance` schema namespace in PostgreSQL. RLS is enabled and forced on all tables.

### 6.1 Schema Structure

```sql
-- Enforce Namespace Isolation
CREATE SCHEMA IF NOT EXISTS m10_data_compliance;

-- Accounts Table
CREATE TABLE m10_data_compliance.accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    crm_account_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts Table
CREATE TABLE m10_data_compliance.contacts (
    contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(tenant_id) ON DELETE CASCADE,
    crm_contact_id VARCHAR(100) NOT NULL,
    account_id UUID REFERENCES m10_data_compliance.accounts(account_id) ON DELETE SET NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deals Table
CREATE TABLE m10_data_compliance.deals (
    deal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    crm_deal_id VARCHAR(100) NOT NULL,
    account_id UUID NOT NULL REFERENCES m10_data_compliance.accounts(account_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    stage VARCHAR(100) NOT NULL,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activities Table
CREATE TABLE m10_data_compliance.activities (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    activity_type VARCHAR(30) NOT NULL,
    source_platform VARCHAR(50) NOT NULL,
    source_record_id VARCHAR(100) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interaction Links Table
CREATE TABLE m10_data_compliance.interaction_links (
    link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    activity_id UUID NOT NULL REFERENCES m10_data_compliance.activities(activity_id) ON DELETE CASCADE,
    account_id UUID REFERENCES m10_data_compliance.accounts(account_id) ON DELETE CASCADE,
    deal_id UUID REFERENCES m10_data_compliance.deals(deal_id) ON DELETE CASCADE,
    confidence_level VARCHAR(20) NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
    explanation JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Apply Row-Level Security Policies
ALTER TABLE m10_data_compliance.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE m10_data_compliance.accounts FORCE ROW LEVEL SECURITY;

CREATE POLICY accounts_tenant_isolation ON m10_data_compliance.accounts
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

## 7. Public API Design

All endpoints are hosted strictly under the canonical API prefix `/api/v1/m10-data-compliance`.

### 7.1 GET /api/v1/m10-data-compliance/accounts
Retrieves accounts scoped to the authenticated tenant.
*   **Query Params**: `limit`, `offset`, `search` (domain/name match).
*   **Response Payload**:
    ```json
    {
      "accounts": [
        {
          "accountId": "uuid-here",
          "name": "ACME Corp",
          "domain": "acme.com",
          "updatedAt": "2026-05-18T10:00:00Z"
        }
      ]
    }
    ```

### 7.2 GET /api/v1/m10-data-compliance/deals
Retrieves transactional deal records scoped to the tenant.
*   **Query Params**: `limit`, `offset`, `stage`.
*   **Response Payload**:
    ```json
    {
      "deals": [
        {
          "dealId": "uuid-here",
          "accountId": "uuid-here",
          "name": "Enterprise Renewal Q2",
          "amount": 150000.00,
          "stage": "Proposal"
        }
      ]
    }
    ```

### 7.3 GET /api/v1/m10-data-compliance/deals/:id/relationship
Fetches full relationship graph details for a single opportunity, including linked contacts and recent activity timelines.

---

## 8. Environment Variables Mapping

The Revenue Graph capability relies on these standard `M10_` prefixed monorepo environment variables:
*   `M10_REVENUE_GRAPH_ENABLED`: Enables graph processing.
*   `M10_REVENUE_GRAPH_WRITE_ENABLED`: Enables commits to DB.
*   `M10_REVENUE_GRAPH_PUBLISH_EVENTS`: Toggles emission of `revenue_graph.entity.linked` event.
*   `M10_ENTITY_RESOLUTION_MIN_CONFIDENCE`: Cut-off score for auto-linking (`0.78`).
*   `M10_CRM_CONTEXT_API_BASE_URL`: Sync adapter URL path.
*   `M10_CRM_CONTEXT_API_KEY`: Secrets reference key.
*   `M10_AI_SERVICE_BASE_URL`: Path to Python AI resolution API.
*   `M10_LINKING_QUEUE_NAME`: BullMQ queue key (`revenue-graph-linking`).

---

## 9. Testing & Validation Checklist

*   **Unit Verification**: Tests mapping logic under edge cases: missing CRM opportunity indices, overlapping contact participants, and shared domain lookups.
*   **Deduplication Tests**: Simulates double delivery of `call.transcription.completed` to verify that `m10_data_compliance.activities` constraints prevent duplicate rows.
*   **RLS Security Tests**: Simulates a cross-tenant read execution to verify that PostgreSQL blocks non-owning client calls immediately at the database layer.
*   **ADR-005 Workflow Tests**: Mocks the `deal.stage.update.requested` event, asserts successful CRM outbound synchronization, and verifies that the system emits the public event `deal.stage.changed` with 100% envelope compliance.
