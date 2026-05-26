# Environment Variables Registry — M10 Data & Compliance

| Field | Value |
| --- | --- |
| **Document ID** | Doc #11-Env |
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

This registry lists all environment configuration variables used by the unified physical monorepo workspace at `modules/m10-data-compliance/`. 

All variables in this registry are strictly prefixed with **`M10_`** to establish robust monorepo boundaries, preventing overlaps with other packages. These configurations govern the **Revenue Graph**, **Configure Compliance**, and **Data Cloud / Data Export** capabilities.

---

## 2. Shared Workspace & Platform Variables

These variables configure the shared API container, port bindings, database credentials, and event endpoints for the M10 monorepo package.

| Variable | Required | Secret | Default / Example | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `M10_ENABLED` | Yes | No | `true` | Master toggle to enable/disable the M10 workspace package. |
| `M10_API_PORT` | Yes | No | `3010` | Port binding for the M10 backend API service in local/prod. |
| `M10_API_PREFIX` | Yes | No | `/api/v1/m10-data-compliance` | Canonical API prefix for all exposed M10 endpoints. |
| `M10_DATABASE_URL` | Yes | Yes | `postgresql://...` | DB connection string pointing to the PostgreSQL database with the default search path set to `m10_data_compliance`. |
| `M10_AUDIT_TAG` | No | No | `m10-data-compliance` | Standard tag appended to all telemetry, logs, and audit entries. |

---

## 3. Capability Configuration Registry

### 3.1 Revenue Graph Settings (`M10_REVENUE_GRAPH_`)

These variables govern how captured activities are matched and linked to structural accounts, deals, and contacts in the PostgreSQL transactional database.

| Variable | Required | Secret | Default / Example | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `M10_REVENUE_GRAPH_ENABLED` | Yes | No | `true` | Enables active Revenue Graph consumption and processing. |
| `M10_REVENUE_GRAPH_WRITE_ENABLED` | Yes | No | `true` | Enforces read-only mode if set to `false`. |
| `M10_REVENUE_GRAPH_PUBLISH_EVENTS` | Yes | No | `true` | Controls publishing of `revenue_graph.entity.linked` downstream. |
| `M10_REVENUE_GRAPH_SHADOW_MODE` | No | No | `false` | If `true`, runs candidate resolution without committing to DB. |
| `M10_ENTITY_RESOLUTION_MIN_CONFIDENCE` | Yes | No | `0.78` | Confidence score threshold above which entities auto-link. |
| `M10_ENTITY_RESOLUTION_REVIEW_THRESHOLD` | Yes | No | `0.60` | Score threshold below which links go to manual review. |
| `M10_MAX_CANDIDATES_PER_ENTITY` | No | No | `20` | Limits candidate list width during contact domain resolution. |
| `M10_ENABLE_AI_ENTITY_RESOLUTION` | Yes | No | `true` | Toggles Python FastAPI AI helper matching call lookups. |
| `M10_ENABLE_RULE_BASED_FALLBACK` | Yes | No | `true` | Enables deterministic fallback rules if AI service is off. |
| `M10_CRM_CONTEXT_API_BASE_URL` | Yes | No | `http://crm-adapter.internal`| Private internal API path for the CRM sync adapter. |
| `M10_CRM_CONTEXT_API_KEY` | Yes | Yes | `sec_crm_key_...` | API key to authorize request with CRM adapter. |
| `M10_AI_SERVICE_BASE_URL` | Yes | No | `http://ai-services.internal` | Private endpoint path to the Python AI service. |
| `M10_LINKING_QUEUE_NAME` | Yes | No | `revenue-graph-linking` | BullMQ queue name for asynchronous graph ingestion. |
| `M10_LINKING_JOB_CONCURRENCY` | No | No | `10` | Number of concurrent workers polling the queue. |
| `M10_LINKING_MAX_RETRIES` | No | No | `3` | Maximum retry attempts for failed activity processing. |

### 3.2 Configure Compliance Settings (`M10_COMPLIANCE_`)

These variables govern policy configuration and outreach gates to enforce privacy regulations and CRM opt-out preferences immediately before communications execute.

| Variable | Required | Secret | Default / Example | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `M10_COMPLIANCE_ENABLED` | Yes | No | `true` | Enables active policy evaluations across the platform. |
| `M10_COMPLIANCE_POLICY_WRITE_ENABLED`| Yes | No | `true` | Allows admins or RevOps to mutate policy tables. |
| `M10_COMPLIANCE_RUNTIME_ENFORCEMENT_ENABLED` | Yes | No | `true` | Actively blocks outreach dispatches on policy matches. |
| `M10_COMPLIANCE_AUDIT_ENABLED` | Yes | No | `true` | Writes allow/block decisions and policy updates to logs. |
| `M10_COMPLIANCE_FAIL_CLOSED_ON_MISSING_OPTOUT` | Yes | No | `true` | Blocks outreach if opt-out state cannot be fetched. |
| `M10_COMPLIANCE_DEFAULT_POLICY_ACTION` | Yes | No | `block` | Fallback action if no policy explicitly covers a request. |
| `M10_COMPLIANCE_GDPR_RULESET_ENABLED` | Yes | No | `true` | Activates lawful consent matching and GDPR scopes. |
| `M10_COMPLIANCE_CCPA_RULESET_ENABLED` | Yes | No | `true` | Activates opt-out sale flags and CCPA boundaries. |
| `M10_COMPLIANCE_CRM_OPTOUT_API_BASE_URL` | Yes | No | `http://crm-adapter.internal`| Outbound path to check CRM direct opt-out states. |
| `M10_COMPLIANCE_CRM_OPTOUT_API_KEY` | Yes | Yes | `sec_crm_opt_...` | API key to authorize opt-out checks. |
| `M10_COMPLIANCE_CONSENT_SERVICE_BASE_URL`| Yes | No | `http://platform-core.internal`| Endpoint for the platform core consent validation store. |
| `M10_COMPLIANCE_ENFORCE_EMAIL_SEND` | Yes | No | `true` | Enables real-time evaluation before M8 dispatches emails. |
| `M10_COMPLIANCE_ENFORCE_CALL_ACTION` | Yes | No | `true` | Enables real-time evaluation before a call is triggered. |
| `M10_COMPLIANCE_ENFORCE_DATA_USAGE_GATES`| No | No | `true` | Evaluates permission before sharing data with AI training. |

### 3.3 Data Cloud / Data Export Settings (`M10_DATA_EXPORT_`)

These variables govern scheduled extraction pipelines to client warehouses, enforcing idempotency rules and the **Daily Synchronization Lock** constraint.

| Variable | Required | Secret | Default / Example | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `M10_DATA_EXPORT_ENABLED` | Yes | No | `true` | Master toggle for the structured warehouse export pipeline. |
| `M10_DATA_EXPORT_CONNECTION_WRITE_ENABLED` | Yes | No | `true` | Allows tenant admins to save/update warehouse settings. |
| `M10_DATA_EXPORT_SCHEDULED_EXPORT_ENABLED` | Yes | No | `true` | Toggles automatic Cron execution. |
| `M10_DATA_EXPORT_REPLAY_ENABLED` | No | No | `true` | Allows re-running exports for missed or failed sync blocks. |
| `M10_DATA_EXPORT_SYNC_CRON` | Yes | No | `0 2 * * *` | Chron scheduling string. **Must start at 02:00 UTC**. |
| `M10_DATA_EXPORT_TIMEZONE` | No | No | `UTC` | Timezone bound for scheduling and run markers. |
| `M10_DATA_EXPORT_CHECKPOINT_STRATEGY` | Yes | No | `updated_at_watermark`| Standard pattern to track incremental cursors. |
| `M10_DATA_EXPORT_DEFAULT_BATCH_SIZE` | Yes | No | `5000` | Sync batch size per database chunk. |
| `M10_DATA_EXPORT_ENABLE_SNOWFLAKE` | Yes | No | `true` | Enables Snowflake adapter support. |
| `M10_DATA_EXPORT_ENABLE_BIGQUERY` | Yes | No | `true` | Enables BigQuery adapter support. |
| `M10_DATA_EXPORT_ENABLE_DATABRICKS` | No | No | `true` | Enables Databricks adapter support. |
| `M10_DATA_EXPORT_ENABLE_S3` | Yes | No | `true` | Enables Amazon S3 adapter support. |
| `M10_DATA_EXPORT_ENABLE_REDSHIFT` | No | No | `true` | Enables Redshift adapter support. |
| `M10_DATA_EXPORT_IDEMPOTENCY_ENABLED` | Yes | No | `true` | Enforces retry-safe upserts in destination adapters. |
| `M10_DATA_EXPORT_IDEMPOTENCY_KEY_STRATEGY`| Yes | No | `tenant-dest-window` | Naming convention pattern for job idempotency keys. |
| `M10_DATA_EXPORT_RESPECT_CONSENT_RESTRICTIONS` | Yes | No | `true` | Skips records where data privacy policies disallow export. |
| `M10_DATA_EXPORT_SECRET_PROVIDER` | Yes | No | `aws-secrets-manager`| Secret repository for client warehouse credentials. |
| `M10_DATA_EXPORT_SNOWFLAKE_CREDENTIAL_SECRET_REF`| Conditional | Yes | `sec_sf_tenant_...` | Reference key to client credentials inside secret manager. |
| `M10_DATA_EXPORT_BIGQUERY_CREDENTIAL_SECRET_REF` | Conditional | Yes | `sec_bq_tenant_...` | Reference key for client BigQuery service account keys. |

---

## 4. Shared Platform Variables (Reference Only)

M10 references these platform-wide variables for infrastructure services. They must not be redefined with the `M10_` prefix:
*   `PLATFORM_DATABASE_URL`: Connection string to PostgreSQL containing system metadata and schemas.
*   `PLATFORM_REDIS_URL`: Endpoint for Upstash Redis used by BullMQ queues and worker coordination.
*   `PLATFORM_EVENT_BUS_URL`: Endpoint of the event bus router.
*   `PLATFORM_JWT_ISSUER` / `PLATFORM_JWT_AUDIENCE`: Supabase JWT keys for cryptographically validating tenant claims.

---

## 5. Complete `.env.example` Skeleton

```env
# ==============================================================================
# M10 DATA & COMPLIANCE CONFIGURATION — v3.0 monorepo standard
# ==============================================================================

# Shared Workspace Settings
M10_ENABLED=true
M10_API_PORT=3010
M10_API_PREFIX=/api/v1/m10-data-compliance
M10_DATABASE_URL=postgresql://postgres:secret@localhost:5432/revenue_intel?schema=m10_data_compliance
M10_AUDIT_TAG=m10-data-compliance

# Revenue Graph Settings
M10_REVENUE_GRAPH_ENABLED=true
M10_REVENUE_GRAPH_WRITE_ENABLED=true
M10_REVENUE_GRAPH_PUBLISH_EVENTS=true
M10_REVENUE_GRAPH_SHADOW_MODE=false
M10_ENTITY_RESOLUTION_MIN_CONFIDENCE=0.78
M10_ENTITY_RESOLUTION_REVIEW_THRESHOLD=0.60
M10_MAX_CANDIDATES_PER_ENTITY=20
M10_ENABLE_AI_ENTITY_RESOLUTION=true
M10_ENABLE_RULE_BASED_FALLBACK=true
M10_CRM_CONTEXT_API_BASE_URL=http://crm-adapter.internal
M10_AI_SERVICE_BASE_URL=http://ai-services.internal
M10_LINKING_QUEUE_NAME=revenue-graph-linking
M10_LINKING_JOB_CONCURRENCY=10
M10_LINKING_MAX_RETRIES=3

# Configure Compliance Settings
M10_COMPLIANCE_ENABLED=true
M10_COMPLIANCE_POLICY_WRITE_ENABLED=true
M10_COMPLIANCE_RUNTIME_ENFORCEMENT_ENABLED=true
M10_COMPLIANCE_AUDIT_ENABLED=true
M10_COMPLIANCE_FAIL_CLOSED_ON_MISSING_OPTOUT=true
M10_COMPLIANCE_DEFAULT_POLICY_ACTION=block
M10_COMPLIANCE_GDPR_RULESET_ENABLED=true
M10_COMPLIANCE_CCPA_RULESET_ENABLED=true
M10_COMPLIANCE_CRM_OPTOUT_API_BASE_URL=http://crm-adapter.internal
M10_COMPLIANCE_CONSENT_SERVICE_BASE_URL=http://platform-core.internal
M10_COMPLIANCE_ENFORCE_EMAIL_SEND=true
M10_COMPLIANCE_ENFORCE_CALL_ACTION=true
M10_COMPLIANCE_ENFORCE_DATA_USAGE_GATES=true

# Data Cloud / Data Export Settings
M10_DATA_EXPORT_ENABLED=true
M10_DATA_EXPORT_CONNECTION_WRITE_ENABLED=true
M10_DATA_EXPORT_SCHEDULED_EXPORT_ENABLED=true
M10_DATA_EXPORT_REPLAY_ENABLED=true
M10_DATA_EXPORT_SYNC_CRON=0 2 * * *
M10_DATA_EXPORT_TIMEZONE=UTC
M10_DATA_EXPORT_CHECKPOINT_STRATEGY=updated_at_watermark
M10_DATA_EXPORT_DEFAULT_BATCH_SIZE=5000
M10_DATA_EXPORT_ENABLE_SNOWFLAKE=true
M10_DATA_EXPORT_ENABLE_BIGQUERY=true
M10_DATA_EXPORT_ENABLE_DATABRICKS=true
M10_DATA_EXPORT_ENABLE_S3=true
M10_DATA_EXPORT_ENABLE_REDSHIFT=true
M10_DATA_EXPORT_IDEMPOTENCY_ENABLED=true
M10_DATA_EXPORT_IDEMPOTENCY_KEY_STRATEGY=tenant-dest-window
M10_DATA_EXPORT_RESPECT_CONSENT_RESTRICTIONS=true
M10_DATA_EXPORT_SECRET_PROVIDER=aws-secrets-manager

# Secret references only (Must never contain real keys in example configs)
M10_CRM_CONTEXT_API_KEY=secret_crm_key
M10_COMPLIANCE_CRM_OPTOUT_API_KEY=secret_crm_opt_key
M10_INTERNAL_SERVICE_TOKEN=sec_internal_token
M10_DATA_EXPORT_SNOWFLAKE_CREDENTIAL_SECRET_REF=sec_sf_tenant_ref
M10_DATA_EXPORT_BIGQUERY_CREDENTIAL_SECRET_REF=sec_bq_tenant_ref

# Shared Platform Variables (Reference only)
PLATFORM_DATABASE_URL=postgresql://postgres:secret@localhost:5432/revenue_intel?schema=platform
PLATFORM_REDIS_URL=redis://127.0.0.1:6379/0
PLATFORM_EVENT_BUS_URL=http://localhost:4000/events
PLATFORM_JWT_ISSUER=supabase
PLATFORM_JWT_AUDIENCE=revenue_intel
```
