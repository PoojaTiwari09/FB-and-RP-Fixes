# TDD — Data Cloud / Data Export

**Document ID:** Doc #11c  
**Module (Product-facing):** M10 Data Compliance  
**Feature:** Data Cloud / Data Export  
**Architecture Owner:** M-03 Revenue Graph / Data Platform  
**Status:** Draft  
**Primary Engineers:** Backend Platform, Data Platform, Integration Engineering, DevOps  
**Primary Consumers:** Customer data teams, BI teams, RevOps, implementation teams, downstream warehouse analytics users  
**Last Updated:** 2026-05-05

---

## Boundary Note

**Ownership boundary:** This feature appears inside the product-facing M10 Data Compliance module, but the real architecture owner is **M-03 Revenue Graph / Data Platform**. Data Cloud is the export layer that makes customer-owned platform data available in the customer’s own warehouse. It depends on Revenue Graph and other upstream platform modules for clean, tenant-scoped data, but it must not absorb warehouse analytics logic, BI dashboard logic, or downstream customer transformation logic.

**Shared dependencies:**  
- M-03 Revenue Graph for connected entity context and export-ready relationship data  
- Upstream modules that produce source records, including capture, conversation intelligence, insights, deal/account state, forecasting, and related activity records  
- Platform Core for auth, audit, queueing, feature flags, secret management, tenant enforcement, and observability  
- Client-owned warehouse destinations such as Snowflake, BigQuery, Databricks, S3, and Redshift  
- Shared PostgreSQL with strict tenant isolation and Row-Level Security (RLS)

---

## 1. Purpose

Data Cloud is the structured data export capability that allows each customer to send their R-Revenue Intelligence data into their own data warehouse for analytics, reporting, BI modeling, and external governance use cases. Its job is to make customer-owned data available outside the core application in a reliable, repeatable, tenant-safe, and automation-friendly way.

This feature is not an internal analytics dashboard. It is a customer data ownership mechanism. The architecture explicitly requires that each client can export all of their data, in full, without requiring manual action from Relanto.ai. Data Cloud exists to satisfy that requirement while ensuring export reliability, idempotency, deletion handling, tenant isolation, and connector-safe delivery.

---

## 2. Goals

The Data Cloud design must achieve the following goals:

- Allow customers to export platform data into client-owned warehouses.
- Support a structured, documented export dataset rather than ad hoc raw dumps.
- Run scheduled syncs automatically, with daily sync as the default baseline.
- Keep exports idempotent and safe to retry.
- Support replay and recovery when warehouse sync failures happen.
- Preserve tenant isolation and ensure no cross-tenant leakage.
- Respect customer ownership, consent, and deletion constraints.
- Make warehouse connectors extensible across supported destinations.
- Provide export run visibility, status, and auditability.
- Avoid requiring manual Relanto.ai intervention for normal export delivery.

---

## 3. Non-Goals

This TDD does not cover:

- BI dashboard creation inside the customer warehouse
- Customer-specific dbt or semantic modeling work
- Ad hoc one-time CSV exports by support teams
- Public API bulk file download products
- Full warehouse read-back analytics from customer systems
- Warehouse-native governance tooling implementation
- frontend chart/report logic

If a separate customer-facing raw download feature is later introduced, it should get its own document.

---

## 4. Feature Summary

Data Cloud is the feature that exports R-Revenue Intelligence data into customer-owned data warehouses for advanced analytics and reporting. The product mapping defines it as a structured dataset including conversations, deal insights, forecast data, user activity, and AI insights, with automatic daily sync to supported warehouses. The architecture further requires that exported data belong to the client and that the platform make full export possible without manual intervention from Relanto.ai.

The feature has six major responsibilities:

1. **Export dataset definition**  
   Define what data is included and how it is structured.

2. **Destination connector management**  
   Support secure sync to approved customer warehouse destinations.

3. **Scheduled sync execution**  
   Run exports on a reliable schedule, with safe incremental or full sync patterns.

4. **Idempotent delivery**  
   Ensure retries and repeated jobs do not corrupt destination data.

5. **Failure handling and replay**  
   Recover safely from connector, network, or destination failures.

6. **Ownership and deletion enforcement**  
   Ensure export behavior respects customer ownership, consent, and deletion requirements.

---

## 5. Business Value

Enterprise customers often need platform data in their own warehouse so they can combine sales interaction data with finance, product, support, and CRM reporting. Without Data Cloud, the application becomes a data silo. With Data Cloud, customers can treat R-Revenue Intelligence as part of their broader data estate.

This creates value in several ways:
- Customer ownership and trust
- Better enterprise reporting
- Integration with existing BI and governance tools
- Reduced vendor lock-in concerns
- Stronger compliance and data portability posture
- Easier cross-functional analytics across revenue, support, and customer success

---

## 6. Users and Consumers

### Primary customer-side users
- Data engineers
- BI analysts
- RevOps analysts
- data governance teams
- implementation consultants

### Primary internal users
- Platform engineers
- support and implementation teams
- customer success technical leads

### External systems
- Snowflake
- BigQuery
- Databricks
- S3
- Redshift

---

## 7. Scope

### In scope
- Data export configuration and connector setup
- Tenant-scoped warehouse credentials and destination metadata
- Structured export dataset definition
- Daily scheduled export jobs
- Idempotent export execution
- Export run tracking and retry handling
- Replay support for failed or missed syncs
- Full-export and incremental-export design
- Data ownership and deletion rule handling
- export observability and admin diagnostics

### Out of scope
- Customer BI dashboards
- Customer warehouse schema transformations after landing
- one-off manual engineering dump requests
- reverse ETL from customer warehouse back into product
- customer-managed downstream permissions after data lands in their warehouse

---

## 8. Architecture Ownership

| Area | Owner | Notes |
|---|---|---|
| Export dataset model | M-03 Revenue Graph / Data Platform | Primary owner |
| Connector execution framework | Data Platform + Platform Core | Shared responsibility |
| Destination credential management | Platform Core / DevOps | Secret-managed |
| Source data production | Upstream modules | Export reads from stable public data model |
| Customer-owned warehouse destination | Customer | Relanto.ai writes, does not own warehouse |
| Deletion and consent control inputs | Platform Core / Compliance | Must influence export behavior |

---

## 9. Functional Requirements

### FR-1 Structured export dataset
The system shall expose a stable, documented dataset for customer warehouse export, including key entities and fact-like records required for analytics.

### FR-2 Supported destinations
The system shall support export to approved warehouse/storage destinations, including Snowflake, BigQuery, Databricks, S3, and Redshift.

### FR-3 Scheduled export
The system shall support automatic scheduled export, with daily sync as the default baseline behavior.

### FR-4 Idempotent jobs
Each export job shall be idempotent so reruns or retries do not create duplicate or corrupt data in the destination.

### FR-5 Tenant-scoped delivery
All export operations shall be executed strictly within one tenant boundary at a time.

### FR-6 Failure handling
If a sync fails, the system shall record failure details and support controlled retry or replay.

### FR-7 Full export capability
The design shall support exporting all client-owned data in full, not only partial or derived slices.

### FR-8 Deletion-aware behavior
If customer data is deleted or becomes non-exportable due to governance or consent constraints, the export system shall reflect that state according to approved deletion semantics.

### FR-9 Auditability
The system shall track export requests, scheduled runs, completion state, and error details.

### FR-10 No manual dependency
Normal customer data export flows shall not require manual intervention from Relanto.ai staff.

---

## 10. Non-Functional Requirements

### Performance
- Scheduled jobs must process tenant exports within the agreed sync window.
- Large tenants must be handled in chunked or partitioned batches.
- Warehouse write throughput must not overload source transactional systems.

### Reliability
- Retries must be safe.
- Partial failures must not silently mark exports as successful.
- Export checkpoints must survive worker restarts.

### Scalability
- The connector framework should support more destinations later without redesigning core scheduling logic.
- Data volume growth must be handled by batching, partitioning, and incremental sync strategy.

### Security
- Customer credentials must be stored securely through approved secret management.
- Exports must never mix tenant data.
- The platform must not require warehouse read access unless explicitly approved for connector validation workflows.

### Observability
- Export start, progress, success, retry, and failure states must be measurable.
- Alerting is required for failed scheduled exports and growing backlog.

---

## 11. Export Model Overview

Data Cloud should be designed as a repeatable export pipeline with clear stages:

1. Resolve tenant and export configuration
2. Resolve destination connector and credentials
3. Determine export scope and mode
4. Build export batch plan
5. Read source data in tenant-safe partitions
6. Transform into stable export schema
7. Write to destination
8. Record checkpoint and outcome
9. Retry or replay if needed

This model avoids ad hoc scripts and supports operational consistency.

---

## 12. Export Scope and Dataset Definition

The product mapping describes Data Cloud as a structured dataset containing conversations, deal insights, forecast data, user activity, and AI insights. The architecture also positions Data Cloud as downstream of the connected Revenue Graph and broader platform data model.

### 12.1 Core export domains
The export dataset should support at least these logical domains:

- Accounts
- Contacts
- Deals / opportunities
- Activities / engagement events
- Calls / meetings metadata
- email interactions
- conversation intelligence outputs
- summaries / brief metadata
- forecast-related records
- user and team activity metadata
- compliance-relevant export metadata where appropriate

### 12.2 Dataset principles
- Tenant-scoped only
- Stable table names and documented columns
- Prefer analytics-friendly denormalized exports where useful, but preserve joinable IDs
- Include source timestamps and sync metadata
- Support incremental extraction with `updated_at` or equivalent checkpoints
- Avoid leaking internal-only operational secrets

### 12.3 Example export tables
- `accounts`
- `contacts`
- `deals`
- `activities`
- `calls`
- `emails`
- `call_scores`
- `topic_tags`
- `trackers`
- `deal_briefs`
- `forecast_submissions`
- `users`
- `teams`
- `export_runs`

### 12.4 Example exported row shape
```json
{
  "tenant_id": "tenant_001",
  "deal_id": "deal_001",
  "account_id": "acct_001",
  "owner_user_id": "user_001",
  "stage": "Negotiation",
  "amount": 25000,
  "currency": "USD",
  "updated_at": "2026-05-05T09:00:00Z",
  "source_system": "salesforce"
}
```

---

## 13. Source-of-Truth and Data Read Rules

Data Cloud is an export feature, not a second business logic owner. It should export from stable, owned module data models rather than inventing shadow logic.

### Rules
- Export should read from approved, stable source entities.
- Export does not redefine deal health, AI scoring, or CRM semantics.
- If a source module owns a field, Data Cloud exports that field as produced by the owner.
- If a derived export view is needed, it must be documented and versioned.
- Export reads must remain tenant-scoped and respect allowed cross-schema access rules.

### Important note
Data Cloud should not become a hidden integration layer that bypasses module ownership boundaries.

---

## 14. Destination Warehouse Support and Connector Rules

The architecture explicitly supports client-owned destinations such as Snowflake, BigQuery, Databricks, S3, and Redshift.

### 14.1 Supported destinations
- Snowflake
- BigQuery
- Databricks
- S3
- Redshift

### 14.2 Connector principles
- One connector abstraction, multiple destination adapters
- Customer provides credentials
- Relanto.ai writes export data; it does not own customer warehouse analytics logic
- Prefer append/upsert-friendly patterns depending on destination
- Support per-tenant destination configuration
- Validate configuration before activation

### 14.3 Example connector metadata
```json
{
  "tenantId": "tenant_001",
  "destinationType": "snowflake",
  "destinationName": "customer_primary_wh",
  "isActive": true,
  "syncMode": "daily_incremental"
}
```

### 14.4 Connector rules
- Connector credentials must be stored in managed secrets, not plain database text.
- Destination schema/table naming conventions must be documented.
- Any connector-specific limitation must be isolated in adapter code, not leaked into core orchestration logic.
- Connector write operations must support retry-safe behavior.

---

## 15. Scheduling and Sync Modes

### 15.1 Default scheduling
Daily export is the default baseline behavior for Data Cloud.

### 15.2 Supported sync modes
- Full initial sync
- Incremental daily sync
- Manual replay of failed windows
- selective backfill if approved for operational use

### 15.3 Scheduling rules
- Each tenant should have a predictable export window.
- Jobs should be queue-based, not cron-only in application memory.
- Long-running tenants should be chunked or partitioned.
- Schedule drift and missed runs must be detectable.

### 15.4 Checkpointing
Each export domain should persist checkpoint metadata such as:
- last successful sync timestamp
- last exported source version or watermark
- run ID
- destination status
- retry count

---

## 16. Idempotency Design

The architecture explicitly requires Data Cloud jobs to be idempotent. This means the same export for the same tenant, destination, and time window must be safe to run multiple times.

### 16.1 Why idempotency matters
- Jobs may retry after transient failures
- workers may restart
- schedules may overlap
- support may replay a failed date range
- connector writes may partially complete

### 16.2 Idempotency key pattern
A run-level idempotency key should be derived from:
- tenant
- destination
- dataset or export domain
- window start / end
- run mode

### 16.3 Example key
```text
tenant_001:snowflake:deals:2026-05-05:daily_incremental
```

### 16.4 Expected behavior
- If a successful run already exists for the same key, rerun should no-op unless forced replay is requested.
- If a partial failure exists, rerun should resume or safely rewrite without duplicates.
- Destination merge/upsert behavior should be deterministic.

---

## 17. Export Write Patterns

Different destinations may require different physical write strategies, but the logical behavior must remain consistent.

### Supported logical patterns
- Append-only for immutable event-style records
- Upsert/merge for current-state dimension-like tables
- Partitioned overwrite for bounded time windows where appropriate
- Manifest-based file delivery for object storage targets like S3

### Design guidance
- Choose write pattern per exported domain, not one pattern for everything.
- Preserve timestamps and source IDs so downstream deduplication is possible.
- Keep schema evolution backward-compatible wherever feasible.

---

## 18. Failure Handling and Replay Strategy

A robust replay strategy is essential because warehouse syncs can fail due to network errors, credential changes, quota issues, schema mismatch, or destination outages.

### 18.1 Failure categories
- invalid credentials
- destination unavailable
- rate limit or quota exceeded
- schema mismatch
- network interruption
- partial batch failure
- checkpoint corruption
- source read failure

### 18.2 Required behavior
- Mark failed runs explicitly
- Record error category and message
- Preserve partial progress safely
- Retry transient failures with backoff
- Route unrecoverable failures to support-visible diagnostics
- Support replay by tenant, destination, dataset, and time window

### 18.3 Replay scenarios
- Missed daily sync
- Partial destination write
- Connector fix deployed
- customer credential rotation
- schema migration issue resolved
- backfill after onboarding

### 18.4 Replay rules
- Replay must remain tenant-scoped
- Replay must respect idempotency
- Replay should not require raw database intervention
- Replay actions must be logged

---

## 19. Data Ownership Rules

The architecture clearly states that every client owns their own data and can export it at any time, in full, without requiring action from Relanto.ai.

### Ownership principles
- Exported data belongs to the client
- Relanto.ai is responsible for reliable delivery, not post-export governance inside the client warehouse
- Data Cloud should not hide or withhold exportable tenant data without a defined governance reason
- Normal export operations should be self-service once configured

### Important restriction
The platform must not use exported client data for shared AI training unless explicit written consent exists through approved governance records.

---

## 20. Data Deletion and Consent Rules

Data Cloud must respect customer deletion requests, consent changes, and governance restrictions.

### 20.1 Deletion handling principles
- If a customer requests deletion inside the platform, source records must be deleted or tombstoned according to approved retention policy.
- Data Cloud must reflect deletion semantics in future exports.
- The exact mechanism may be hard delete, soft delete flag, tombstone export, or replacement snapshot, but it must be documented and consistent.

### 20.2 Consent-sensitive data usage
If tenant policy or consent state restricts certain data usage categories, Data Cloud must not export prohibited datasets or fields if governance policy says they are restricted.

### 20.3 Customer expectation
Customers should be able to understand:
- what gets exported
- what stops being exported after deletion or consent revocation
- whether destination cleanup is customer-managed or supported through export tombstones

### 20.4 Recommended baseline
- Future exports should include deletion markers or exclude deleted records according to destination contract.
- The platform should log when deletion-related export adjustments happen.
- Customer-facing documentation should clarify that data already landed in the customer warehouse may require customer-side handling unless a supported delete propagation mode is configured.

---

## 21. Security and Tenant Isolation

This feature moves large volumes of customer data and therefore has strict isolation requirements.

### Requirements
- Every export run is scoped to exactly one tenant.
- Source reads must be tenant-filtered through application and database enforcement.
- Destination credentials are tenant-specific and secret-managed.
- No cross-tenant combined export jobs.
- Export logs and run metadata must not leak payload data from other tenants.
- Background workers must propagate tenant context through all read and write steps.

### Governance rules
- No export job should run without valid tenant context.
- No manual SQL export scripts in normal operations.
- Secret rotation must be supported without code changes.
- Support tooling must expose metadata, not raw cross-tenant payloads.

---

## 22. Data Model

Data Cloud needs operational tables to track connector configuration and export runs.

### 22.1 Suggested tables
- `data_cloud_connections`
- `data_cloud_exports`
- `data_cloud_export_runs`
- `data_cloud_checkpoints`
- `data_cloud_failures`
- optional `data_cloud_schema_versions`

### 22.2 Table purposes

#### `data_cloud_connections`
Stores tenant-specific destination configuration and activation status.

#### `data_cloud_exports`
Stores export definitions per tenant and destination.

#### `data_cloud_export_runs`
Stores every run, its status, timing, and summary metrics.

#### `data_cloud_checkpoints`
Stores per-domain sync watermarks and resume points.

#### `data_cloud_failures`
Stores structured failure details for troubleshooting and replay.

### 22.3 Example columns

#### `data_cloud_connections`
- `connection_id`
- `tenant_id`
- `destination_type`
- `destination_name`
- `status`
- `created_at`
- `updated_at`

#### `data_cloud_export_runs`
- `run_id`
- `tenant_id`
- `connection_id`
- `dataset`
- `sync_mode`
- `idempotency_key`
- `status`
- `started_at`
- `completed_at`
- `row_count`
- `error_code`

#### `data_cloud_checkpoints`
- `checkpoint_id`
- `tenant_id`
- `connection_id`
- `dataset`
- `last_successful_cursor`
- `last_successful_at`

All tables must have tenant-safe indexing and RLS where applicable.

---

## 23. API Design

Representative APIs for admin and operational use:

### 23.1 Connection management
- `GET /api/v1/data-cloud/connections`
- `POST /api/v1/data-cloud/connections`
- `PATCH /api/v1/data-cloud/connections/:id`
- `POST /api/v1/data-cloud/connections/:id/test`
- `POST /api/v1/data-cloud/connections/:id/activate`

### 23.2 Export operations
- `GET /api/v1/data-cloud/exports`
- `POST /api/v1/data-cloud/exports/run`
- `POST /api/v1/data-cloud/exports/replay`
- `GET /api/v1/data-cloud/runs`
- `GET /api/v1/data-cloud/runs/:id`

### 23.3 API rules
- Only authorized admin or implementation roles may manage connections.
- All requests require tenant context.
- Replay endpoints must be permission-guarded and audited.
- Test actions must not perform destructive writes.
- API responses should expose status and diagnostics, not secrets.

---

## 24. Event Contracts

### 24.1 Events consumed
Representative inbound triggers may include:
- `revenue_graph.entity.linked`
- `crm.sync.completed`
- `forecast.submitted`
- `policy.changed`
- `deletion.request.completed`
- scheduled export trigger event

### 24.2 Events emitted
Representative outbound events may include:
- `data_cloud.export.started`
- `data_cloud.export.completed`
- `data_cloud.export.failed`
- `data_cloud.replay.started`
- `data_cloud.replay.completed`

### 24.3 Example export-completed event
```json
{
  "eventId": "evt_dc_001",
  "tenantId": "tenant_001",
  "connectionId": "conn_001",
  "dataset": "deals",
  "syncMode": "daily_incremental",
  "rowsExported": 1250,
  "status": "success",
  "completedAt": "2026-05-05T10:30:00Z"
}
```

### 24.4 Event rules
- Events must be idempotent and versioned.
- Success event is emitted only after the export run is durably recorded.
- Failure event must include enough metadata for diagnosis without leaking secrets.

---

## 25. Operational Controls

Data Cloud should provide safe admin and support controls.

### Recommended controls
- Test connection
- Activate/deactivate destination
- Trigger one tenant export
- Replay failed run
- Replay date range
- inspect last successful checkpoint
- view row counts and failure reasons
- disable noisy failing connector
- rotate credentials safely

All operational controls must be permission-guarded and audit logged.

---

## 26. Observability

### Metrics
- export run count
- success rate
- failure rate
- retry count
- rows exported by dataset
- average run duration
- destination-specific failure rate
- backlog size
- checkpoint lag
- stale tenant export count

### Logs
- correlation ID
- tenant ID
- connection ID
- destination type
- dataset
- sync mode
- idempotency key
- checkpoint before/after
- failure category

### Alerts
- repeated failed exports for same tenant
- connector credential failure spike
- schedule lag beyond threshold
- no successful export in expected window
- excessive replay attempts
- unusual drop in exported row counts

---

## 27. Testing Strategy

### Unit tests
- idempotency key generation
- connector selection logic
- checkpoint update rules
- failure classification
- replay window validation
- destination configuration validation

### Integration tests
- successful daily sync to mocked destination
- duplicate run safely no-ops or upserts
- failed run can replay successfully
- tenant isolation on export source reads
- secret lookup and credential validation
- deletion-aware export behavior

### End-to-end tests
- tenant configures Snowflake destination and receives successful scheduled sync
- incremental run exports only changed rows
- partial failure retried without duplicates
- replay after credential rotation succeeds
- deletion request changes export output semantics
- export metadata visible in admin APIs

### Test data requirements
- multi-tenant fixtures
- large-volume activity records
- schema evolution example
- connector failure simulation
- replay of missed windows
- delete/tombstone scenarios

---

## 28. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Duplicate export writes | Corrupt customer warehouse tables | Idempotency keys, merge/upsert logic, checkpoint-safe replay |
| Cross-tenant leakage | Severe data breach | Tenant-scoped execution, RLS, secret isolation, automated tests |
| Connector failures | Missed customer syncs | Retry with backoff, alerts, replay tooling |
| Source schema drift | Broken exports | Versioned export schema, connector contract tests |
| Large tenant performance issues | Missed export windows | Batching, partitioning, async queues |
| Deletion not reflected in export | Governance and trust risk | Deletion-aware semantics, audit logs, documented destination behavior |
| Hidden manual dependency | Operational bottleneck | Self-service config, scheduled jobs, admin replay controls |

---

## 29. Open Decisions

The following points may require Tech Lead and PM review:

1. Exact export schema versioning strategy
2. Whether every domain supports both full and incremental sync from day one
3. Whether delete propagation uses tombstones, soft-delete flags, or periodic full snapshots
4. Which role set can trigger manual replay
5. Whether S3 is treated as raw file landing only or also as structured table export target
6. Whether export metadata is visible to customer admins only or also internal support
7. Whether destination-specific transforms are supported or deferred

---

## 30. Implementation Notes

- Product orchestration, scheduling, connector management, and export control logic remain in TypeScript.
- Data Cloud must not embed customer-specific business logic into core orchestration.
- Warehouse adapters should remain isolated behind a clean connector interface.
- Export jobs should run asynchronously through queue workers.
- Credentials must be read from approved secret management tooling, not stored in raw plaintext configuration fields.
- Normal operations must not rely on engineers manually dumping or transferring data.

---

## 31. Example Runtime Scenario

A customer configures a Snowflake destination and activates daily incremental sync. At the scheduled time, the export orchestrator loads the tenant’s destination configuration, resolves the current checkpoint for each dataset, and begins exporting updated accounts, deals, activities, and related conversation-derived records. One batch for activities fails due to a temporary warehouse connectivity issue, so the run is marked partial failure and queued for retry. On retry, the same idempotency key is reused, previously successful batches are not duplicated, the failed batch completes, checkpoints advance, and the run is marked successful.

---

## 32. Acceptance Criteria

The feature is considered complete when all of the following are true:

- Customers can configure a supported warehouse destination using tenant-scoped credentials.
- Data Cloud exports a documented structured dataset including core platform entities and analytics-relevant records.
- Scheduled daily sync works without manual intervention from Relanto.ai.
- Export runs are idempotent and safe to retry.
- Failures are visible, diagnosable, and replayable.
- Tenant isolation is enforced for all source reads, run metadata, and destination delivery.
- Full data export capability exists in line with customer ownership requirements.
- Deletion and consent-related governance rules are reflected in export behavior.

---

## 33. References

- Product mapping for M10 Data & Compliance, including Data Export / Data Cloud
- Data Cloud feature definition as a structured data export and sharing capability to customer warehouses with daily sync
- System architecture guidance placing Data Cloud under M-03 and requiring full client-owned data export, idempotent jobs, tenant isolation, and supported destinations such as Snowflake, BigQuery, Databricks, S3, and Redshift
