# TDD — Data Cloud / Data Export

| Field | Value |
| --- | --- |
| **Document ID** | Doc #11c |
| **Module** | M10 Data & Compliance |
| **Feature** | Data Cloud / Data Export |
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
Under the approved **v3.0 Single Source of Truth (SSOT)**, the **Data Cloud / Data Export** capability is physically implemented within the unified monorepo package workspace at `modules/m10-data-compliance/`. 

Data Cloud represents the outbound integration layer that extracts tenant-scoped platform records and lands them directly in client-owned warehouses (Snowflake, BigQuery, Databricks, Amazon S3, Redshift). 

It depends on the **Revenue Graph** and upstream systems for clean, normalized, and isolated source records. Crucially, Data Cloud is an export tool; it does **not** manage customer warehouse analytics logic, dbt modeling, dashboard rendering, or downstream data access rights. All operational configurations, logs, and failure states are persisted inside the `m10_data_compliance` database namespace.

**Shared Dependencies:**  
*   **M10 Revenue Graph** for account, contact, deal, and activity relationship mappings.
*   **Platform Core** for Supabase JWT verification, background workers (BullMQ), and credential secret lookups (Doppler / AWS Secrets Manager).
*   **Upstash Redis** to manage BullMQ queue states and enforce the **Daily Synchronization Lock**.
*   **Customer Warehouses** as destination targets for the extracted datasets.

---

## 2. Technical Purpose & Business Value

### Purpose
Data Cloud is an enterprise customer data portability and ownership feature. It enables automated, scheduled synchronizations of all platform transactional and relationship records from the R-Revenue PostgreSQL database to customer-managed data lakes and warehouses. 

The feature must run daily without manual engineering intervention from Relanto.ai, and is architected to guarantee strict multi-tenant isolation, idempotent upserts, and robust failure recovery through structured job replay.

### Business Value
*   **Customer Data Ownership**: Gives enterprise customers full control and native offline access to their sales engagement and transcription metadata.
*   **Cross-Functional BI**: Enables customer RevOps and BI teams to join platform interaction data with external financial, CRM, and product usage records.
*   **Regulatory Compliance**: Supports enterprise data portability requirements (GDPR Right to Data Portability).
*   **Zero Vendor Lock-in**: Demonstrates a high-trust partnership model, allowing clients to egress their raw telemetry seamlessly.

---

## 3. Scope & Non-Goals

### In Scope
*   Managing tenant-specific warehouse configurations and connection adapter credentials.
*   Resolving and packing transactional, contact, deal, and activity datasets for egress.
*   Executing daily scheduled exports starting at **02:00 UTC** strictly.
*   Acquiring and holding a Redis-based **`sync_id`** lock to prevent parallel duplicate runs.
*   Ensuring retry-safe, idempotent batch writes in destination adapter integrations.
*   Providing manual and automated replay triggers to handle transient warehouse outages.
*   Exposing run history, progress, checkpoints, and failure categorization in admin APIs.

### Out of Scope
*   Customer-side warehouse schema updates or transformations.
*   Developing custom BI dashboards inside Snowflake or BigQuery.
*   Reverse ETL (pulling data from customer warehouses back into R-Revenue).

---

## 4. Functional Requirements

*   **FR-1 Stable Structured Datasets**: Exposes a documented, standard analytics schema including accounts, contacts, deals, activities, scores, and briefs.
*   **FR-2 Extensible Connector Adapters**: Integrates target adapters for Snowflake, BigQuery, Databricks, Amazon S3, and Redshift.
*   **FR-3 Predictable Cron Scheduling**: Automatically runs syncs on a regular timeline, with the default set strictly to **02:00 UTC**.
*   **FR-4 Daily Ingestion Lock**: Enforces a Redis-based **`sync_id`** lock per run to block concurrent parallel executions.
*   **FR-5 Idempotence**: Guarantees that repeating a run or backfilling a date range does not duplicate or corrupt customer warehouse tables.
*   **FR-6 Safe Replay Trigger**: Allows tenant admins and internal support to trigger manual replay of missed or failed sync windows via API.
*   **FR-7 Deletion & Privacy Propagation**: Excludes or tombstones exported data according to active GDPR/CCPA consent and deletion logs.

---

## 5. Architectural Design & Runtime Logic

### 5.1 The Daily Synchronization Lock
Scheduled export pipelines carry high processing and network I/O overhead. To prevent concurrent runs due to schedule overlaps, backfill requests, or worker retries:
1. The cron scheduler triggers the export worker daily at **02:00 UTC** strictly.
2. The orchestrator checks Upstash Redis for the key `m10_data_export:lock:<tenant_id>:<destination_type>`.
3. If the key exists, the run aborts immediately, writing a warning to the audit logs: *"Parallel export blocked: Active lock sync_id present."*
4. If free, the worker acquires the lock, setting the Redis key with an active **`sync_id`** value and a 4-hour Time-to-Live (TTL).
5. The worker extracts, transforms, and loads the data.
6. Upon complete success or terminal failure, the worker deletes the Redis lock key, clearing the path for future replay runs.

### 5.2 Idempotency Pattern
Destination adapters use a robust **Upsert/Merge** pattern to prevent duplicate writes during job retries:
*   Every batch carries a run-level idempotency key: `tenant_id:destination:dataset_name:date_window`.
*   Adapters check if the batch has already been successfully committed.
*   Relational destination tables use merge/upsert based on primary keys (`deal_id`, `account_id`, `activity_id`).
*   Object storage targets (Amazon S3) use deterministic overwrite partition keys (`y=YYYY/m=MM/d=DD`).

---

## 6. PostgreSQL Database Schema Namespace (`m10_data_compliance`)

All operational tables reside under the isolated `m10_data_compliance` schema namespace in PostgreSQL. RLS is enabled and forced on all tables.

### 6.1 Schema Structure

```sql
-- Enforce Namespace Isolation
CREATE SCHEMA IF NOT EXISTS m10_data_compliance;

-- Connection Management Table
CREATE TABLE m10_data_compliance.data_cloud_connections (
    connection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(tenant_id) ON DELETE CASCADE,
    destination_type VARCHAR(50) NOT NULL, -- 'snowflake', 'bigquery', 's3', etc.
    destination_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'inactive', -- 'active', 'inactive', 'suspended'
    credential_secret_ref VARCHAR(255) NOT NULL, -- reference key in Doppler/Secrets manager
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Export Runs Ledger
CREATE TABLE m10_data_compliance.data_cloud_export_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    connection_id UUID NOT NULL REFERENCES m10_data_compliance.data_cloud_connections(connection_id) ON DELETE CASCADE,
    sync_id VARCHAR(100) NOT NULL, -- correlation lock identifier
    dataset_name VARCHAR(100) NOT NULL, -- 'deals', 'accounts', 'activities', etc.
    sync_mode VARCHAR(50) NOT NULL, -- 'incremental', 'full_backfill'
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL, -- 'running', 'success', 'failed'
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    rows_exported INTEGER NOT NULL DEFAULT 0,
    error_code VARCHAR(100),
    error_message TEXT
);

-- Sync Checkpoint Cursors
CREATE TABLE m10_data_compliance.data_cloud_checkpoints (
    checkpoint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    connection_id UUID NOT NULL REFERENCES m10_data_compliance.data_cloud_connections(connection_id) ON DELETE CASCADE,
    dataset_name VARCHAR(100) NOT NULL,
    last_successful_watermark TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_conn_dataset UNIQUE (tenant_id, connection_id, dataset_name)
);

-- Apply RLS
ALTER TABLE m10_data_compliance.data_cloud_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE m10_data_compliance.data_cloud_connections FORCE ROW LEVEL SECURITY;

CREATE POLICY connection_tenant_isolation ON m10_data_compliance.data_cloud_connections
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

## 7. Public API Design

All endpoints are hosted strictly under the canonical API prefix `/api/v1/m10-data-compliance`.

### 7.1 POST /api/v1/m10-data-compliance/exports/connections
Registers a new warehouse destination config.
*   **Request Payload**:
    ```json
    {
      "destinationType": "snowflake",
      "destinationName": "Enterprise Data Lake",
      "credentialSecretRef": "sec_sf_tenant_123"
    }
    ```
*   **Response**: `201 Created`

### 7.2 POST /api/v1/m10-data-compliance/exports/connections/:id/test
Tests credential validity and write connectivity without executing a permanent export.

### 7.3 POST /api/v1/m10-data-compliance/exports/replay
Manually triggers an export backfill for a failed or missed date window.
*   **Request Payload**:
    ```json
    {
      "connectionId": "uuid-here",
      "datasetName": "deals",
      "windowStart": "2026-05-10T00:00:00Z",
      "windowEnd": "2026-05-11T00:00:00Z"
    }
    ```
*   **Response**:
    ```json
    {
      "status": "queued",
      "runId": "uuid-here",
      "message": "Replay run queued for execution."
    }
    ```

---

## 8. Environment Variables Mapping

The Data Export capability relies on these standard `M10_` prefixed monorepo environment variables:
*   `M10_DATA_EXPORT_ENABLED`: Master toggle for the structured warehouse export pipeline.
*   `M10_DATA_EXPORT_SCHEDULED_EXPORT_ENABLED`: Enables or disables automatic cron execution.
*   `M10_DATA_EXPORT_SYNC_CRON`: Chron scheduling string. **Must start at 02:00 UTC** (`0 2 * * *`).
*   `M10_DATA_EXPORT_IDEMPOTENCY_ENABLED`: Enforces retry-safe upserts in adapters.
*   `M10_DATA_EXPORT_RESPECT_CONSENT_RESTRICTIONS`: Excludes restricted data on policy match.
*   `M10_DATA_EXPORT_SECRET_PROVIDER`: Secrets engine for credentials (`aws-secrets-manager`).

---

## 9. Testing & Validation Checklist

*   **Idempotency Overwrite Tests**: Simulates a network outage midway through a Snowflake sync. Re-runs the job with the same idempotency key and asserts that no duplicate rows exist in the customer warehouse.
*   **Daily Sync Lock Auditing**: Sets the Redis `sync_id` lock manually, triggers a scheduled cron run, and asserts that the worker immediately terminates the job with an explicit "Parallel run detected" log entry.
*   **Watermark Advancement**: Asserts that `data_cloud_checkpoints` update only upon a successful HTTP 200 response from the destination warehouse, preventing missing-data gaps.
*   **Multi-tenant Isolation**: Runs simultaneous export jobs for Tenant A and Tenant B, verifying that no Tenant A records reach Tenant B's credentials or target warehouses.
