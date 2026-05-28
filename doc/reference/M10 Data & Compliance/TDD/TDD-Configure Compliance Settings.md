# TDD — Configure Compliance Settings

| Field | Value |
| --- | --- |
| **Document ID** | Doc #11b |
| **Module** | M10 Data & Compliance |
| **Feature** | Configure Compliance Settings |
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
The **Configure Compliance Settings** capability is owned and physically implemented within the single unified monorepo package workspace at `modules/m10-data-compliance/`. 

Its job is to act as the platform's runtime governance and compliance gatekeeper. While administrative interfaces reside here, this subsystem interacts directly with **M8 Sales Engagement** (outbound emails/sequences) and future calling adapters to intercept, evaluate, and block communications based on active customer policies, CRM opt-outs, and regional rules (GDPR/CCPA). 

It does **not** manage SMTP connection pools, dialing networks, or down-stream analytics reporting. All decisions are written to transactional audit logs within the `m10_data_compliance` schema namespace.

**Shared Dependencies:**  
*   **M8 Sales Engagement** to invoke the compliance runtime gate prior to dispatching outreach.
*   **Platform Core** for Supabase JWT verification, secret management (Doppler), and telemetry.
*   **CRM External Adapter** to verify and cache contact-level opt-out settings.
*   **Supabase PostgreSQL 16** with forced Row-Level Security (RLS) and shared-schema tenant isolation.

---

## 2. Technical Purpose & Business Value

### Purpose
Configure Compliance Settings provides a centralized policy and runtime enforcement engine. It allows enterprise tenant administrators to establish rules for outbound customer communication channels and regional data handling, and automatically evaluates those rules in real time immediately before any outreach takes place. 

Crucially, the engine implements a **fail-closed** strategy: if the contact’s opt-out state or required consent details are missing or cannot be fetched due to API/network issues, the transaction is immediately blocked to prevent compliance breaches.

### Business Value
*   **Mitigate Legal Risk**: Protects the organization from costly regulatory fines associated with CCPA, CCAR, and GDPR violations.
*   **Brand Trust Preservation**: Ensures contacts who have opted out of communication (Do Not Contact flags) are never messaged.
*   **Governance Auditability**: Creates an immutable audit ledger of every policy change and runtime communication decision for compliance reviews.
*   **Operational Control**: Provides tenant-level self-service compliance rule management without engineering or Relanto.ai support interventions.

---

## 3. Scope & Non-Goals

### In Scope
*   Creating, updating, deactivating, and scoping tenant compliance policies in PostgreSQL.
*   Integrating CCPA and GDPR region resolution logic based on contact location parameters.
*   Synchronizing and caching contact-level CRM opt-out flags.
*   Providing a high-performance REST evaluation endpoint (`/api/v1/m10-data-compliance/evaluate`).
*   Enforcing a strict fail-closed mechanism when opt-out data is unreachable.
*   Writing immutable audit records for all policy decisions and configuration updates.

### Out of Scope
*   Downstream ClickHouse dashboard views (owned by **M7 R-Revenue Dashboards**).
*   Enforcing physical file encryption scopes inside raw S3 buckets.
*   Exposing public compliance dashboards to non-admin roles.

---

## 4. Functional Requirements

*   **FR-1 Tenant Administration**: Admins can manage structured regional and channel-level policies.
*   **FR-2 Real-Time Runtime Gate**: Intercepts M8 email composer and playbooks to evaluate allow/block decisions.
*   **FR-3 Fail-Closed Safety**: The system blocks the dispatch if critical CRM opt-out or consent data is missing or unreachable.
*   **FR-4 Regional Rulesets**: Resolves regional scopes automatically, verifying lawful basis rules for EU (GDPR) and sale of info scopes for California (CCPA).
*   **FR-5 Policy Versioning**: Maintains history for every change in policy rules, supporting auditable rollbacks.
*   **FR-6 Telemetry & Auditing**: Logs correlation IDs, tenant contexts, contact IDs, and exact policy rules triggered for every evaluation.

---

## 5. Architectural Design & Runtime Logic

### 5.1 Real-Time Evaluation Algorithm
When **M8 Sales Engagement** receives a request to send an email:
1. M8 makes a private HTTP call to `/api/v1/m10-data-compliance/evaluate` containing the tenant ID, sender ID, contact email, and channel.
2. The compliance engine parses the request, validating tenant scopes via Supabase JWT.
3. The engine fetches contact-level opt-out records from the PostgreSQL database cache or CRM API.
    *   *If the API times out or contact records are missing:* Return `block` with reason `FAIL_CLOSED_MISSING_DATA`.
4. The engine determines the contact’s region (CCPA or GDPR family).
5. The engine loads the active policy tree for the tenant.
6. The engine executes rule mapping:
    *   **DNC Check**: If opt-out is `true`, return `block` with reason `CRM_OPTED_OUT`.
    *   **GDPR Check**: If region is EU and consent is not explicitly granted, return `block` with reason `GDPR_CONSENT_REQUIRED`.
    *   **CCPA Check**: If California and opt-out flag is present, return `block` with reason `CCPA_RESTRICTED`.
7. If no block rules trigger, return `allow` with reason `POLICY_PASSED`.
8. Write decision, transaction metadata, and policy signatures to `m10_data_compliance.compliance_audit_entries`.

---

## 6. PostgreSQL Database Schema Namespace (`m10_data_compliance`)

All governance tables reside under the isolated `m10_data_compliance` schema namespace in PostgreSQL. RLS is enabled and forced on all tables.

### 6.1 Schema Structure

```sql
-- Enforce Namespace Isolation
CREATE SCHEMA IF NOT EXISTS m10_data_compliance;

-- Compliance Policies Table
CREATE TABLE m10_data_compliance.compliance_policies (
    policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(tenant_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    channel VARCHAR(50) NOT NULL, -- 'email', 'call', 'data_export'
    region_family VARCHAR(50) NOT NULL, -- 'GDPR', 'CCPA', 'GLOBAL'
    rule_definition JSONB NOT NULL, -- structured JSON tree
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRM Opt-outs Table (Cache & Sync Store)
CREATE TABLE m10_data_compliance.crm_optouts (
    optout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    is_opted_out BOOLEAN NOT NULL DEFAULT false,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_email_channel UNIQUE (tenant_id, contact_email, channel)
);

-- Consent Logs Table (Lawful basis ledger)
CREATE TABLE m10_data_compliance.consent_logs (
    consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    consent_type VARCHAR(100) NOT NULL, -- e.g., 'email_marketing'
    status VARCHAR(50) NOT NULL, -- 'granted', 'revoked'
    source VARCHAR(100) NOT NULL, -- 'web_form', 'manual_crm', 'opt_in_email'
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance Audit Entries
CREATE TABLE m10_data_compliance.compliance_audit_entries (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    correlation_id UUID NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('allow', 'block')),
    reason_code VARCHAR(100) NOT NULL,
    triggered_policy_ids UUID[],
    evaluation_metadata JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Fast Enforcement Gate Lookups
CREATE INDEX idx_optouts_lookup ON m10_data_compliance.crm_optouts (tenant_id, contact_email);
CREATE INDEX idx_policies_active ON m10_data_compliance.compliance_policies (tenant_id, is_active);

-- Enable RLS
ALTER TABLE m10_data_compliance.compliance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE m10_data_compliance.compliance_policies FORCE ROW LEVEL SECURITY;

CREATE POLICY policy_tenant_isolation ON m10_data_compliance.compliance_policies
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

## 7. Public API Design

All endpoints are hosted strictly under the canonical API prefix `/api/v1/m10-data-compliance`.

### 7.1 POST /api/v1/m10-data-compliance/policies
Creates a new tenant compliance policy. Only administrators may call this.
*   **Request Payload**:
    ```json
    {
      "name": "GDPR Email Enforcement",
      "channel": "email",
      "regionFamily": "GDPR",
      "ruleDefinition": {
        "requireExplicitConsent": true,
        "fallbackAction": "block"
      }
    }
    ```
*   **Response**: `201 Created`

### 7.2 GET /api/v1/m10-data-compliance/policies
Retrieves all policies (active and inactive) scoped to the tenant.

### 7.3 POST /api/v1/m10-data-compliance/evaluate
Evaluates an outbound action against active tenant policies and opt-outs.
*   **Request Payload**:
    ```json
    {
      "correlationId": "uuid-here",
      "recipientEmail": "buyer@buyercompany.com",
      "channel": "email",
      "context": {
        "jurisdiction": "EU",
        "outboundType": "marketing"
      }
    }
    ```
*   **Response Payload (Allowed)**:
    ```json
    {
      "decision": "allow",
      "reasonCode": "POLICY_PASSED",
      "correlationId": "uuid-here"
    }
    ```
*   **Response Payload (Blocked)**:
    ```json
    {
      "decision": "block",
      "reasonCode": "GDPR_CONSENT_REQUIRED",
      "explanation": "Contact resides in EU and has no active consent record on file.",
      "correlationId": "uuid-here"
    }
    ```

---

## 8. Environment Variables Mapping

The Configure Compliance capability relies on these standard `M10_` prefixed monorepo environment variables:
*   `M10_COMPLIANCE_ENABLED`: Toggles the policy evaluation engine.
*   `M10_COMPLIANCE_RUNTIME_ENFORCEMENT_ENABLED`: Actively blocks outreach on block decisions.
*   `M10_COMPLIANCE_FAIL_CLOSED_ON_MISSING_OPTOUT`: Enforces fail-closed on unreachable CRM data.
*   `M10_COMPLIANCE_GDPR_RULESET_ENABLED`: Enforces GDPR rule families.
*   `M10_COMPLIANCE_CCPA_RULESET_ENABLED`: Enforces CCPA rule families.
*   `M10_COMPLIANCE_CRM_OPTOUT_API_BASE_URL`: Path to CRM opt-out adapter.
*   `M10_COMPLIANCE_CONSENT_SERVICE_BASE_URL`: Path to core platform consent database.

---

## 9. Testing & Validation Checklist

*   **Opt-out Interception Tests**: Asserts that sending an email to an opted-out contact returns a deterministic `block` decision.
*   **Fail-Closed Verification**: Mocks a 500 network timeout when contacting the CRM opt-out endpoint. Verifies that the evaluation engine immediately returns `block` with `FAIL_CLOSED_MISSING_DATA` reason.
*   **GDPR Consent Grids**: Tests GDPR evaluation across three states: no record (blocked), active revocation (blocked), and active grant (allowed).
*   **RLS Security Isolation**: Validates that administrators from Tenant A cannot retrieve, view, or modify policies belonging to Tenant B.
