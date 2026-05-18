# Environment Variables Registry — M10

This document lists the environment variables used by the M10 product-facing grouping: **Revenue Graph**, **Configure Compliance Settings**, and **Data Cloud / Data Export**. M10 is grouped together for product understanding, but runtime ownership is split between **M-03 Revenue Graph / Data Platform** and **Platform Core governance**, so env variables are grouped by capability instead of pretending M10 is one single subsystem.

This registry is meant to answer four simple questions:

1. What config exists?
2. Which capability owns it?
3. Is it secret or non-secret?
4. Where is it used?

---

## How to use this file

### Rules for engineers

- Add every new M10-related env var here before merge.
- Do not put secrets directly in code, test fixtures, or `.env.example` with real values.
- Keep names consistent and capability-prefixed.
- If a variable affects tenant isolation, compliance, exports, queues, or audit behavior, document it clearly.
- If a variable belongs to Platform Core globally, reference it instead of redefining it here.

### Rules for freshers

A simple way to read this file:

- **Revenue Graph vars** help link interactions to accounts, deals, contacts, and activities.
- **Compliance vars** help decide whether the platform is allowed to email, call, or use data in certain ways.
- **Data Cloud vars** help move tenant-owned data safely into customer-owned warehouses.

---

## Naming convention

Use uppercase snake case with a clear prefix.

### Preferred prefixes

- `M03_` for Revenue Graph
- `CORE_COMPLIANCE_` for Configure Compliance Settings
- `M03_` for Data Cloud / Data Export
- `M10_` only for true shared module-level settings
- `PLATFORM_` only when the variable is owned by Platform Core and merely referenced here

### Example
- `M03_ENTITY_RESOLUTION_MIN_CONFIDENCE`
- `CORE_COMPLIANCE_FAIL_CLOSED_ON_MISSING_OPTOUT`
- `M03_DEFAULT_SYNC_CRON`

---

## Ownership map

| Prefix | Capability | Real owner |
|---|---|---|
| `M03_` | Revenue Graph | M-03 Revenue Graph / Data Platform |
| `CORE_COMPLIANCE_` | Configure Compliance Settings | Platform Core / Cross-cutting Governance |
| `M03_` | Data Cloud / Data Export | M-03 Revenue Graph / Data Platform |
| `M10_` | Shared M10 docs-only or coordination settings | Shared |
| `PLATFORM_` | Shared platform capabilities used by M10 | Platform Core |

---

## Environment categories

Each variable should be tagged mentally into one of these groups:

- **Required secret**: must be present in production and must live in secret manager
- **Required non-secret**: required config value, safe to expose internally
- **Optional non-secret**: has a safe default
- **Computed / inherited**: owned elsewhere and referenced here

---

## 1. Shared M10 variables

Use `M10_` only if the variable is genuinely shared across more than one M10 capability.

| Variable | Required | Secret | Example | Used by | Purpose |
|---|---|---|---|---|---|
| `M10_ENABLED` | No | No | `true` | All M10 capability entry points | Master feature flag for M10 product grouping. |
| `M10_DOCS_VERSION` | No | No | `2026-05-05` | Docs / diagnostics only | Helpful for support and environment verification. |
| `M10_AUDIT_TAG` | No | No | `m10-data-compliance` | Revenue Graph, Compliance, Data Cloud | Common audit tag for logs and events. |

### Notes
- In most real cases, capability-specific flags are better than shared M10 flags.
- Do not force unrelated services to depend on `M10_` unless there is a real operational need.

---

## 2. Revenue Graph variables

Revenue Graph connects captured interaction records to the correct revenue entities like accounts, contacts, deals, and teams. The architecture places it in the model layer, downstream of capture and upstream of conversation intelligence, summaries, forecasting, and export. 

### 2.1 Core flags

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_ENABLED` | Yes | No | `true` | Enables Revenue Graph service behavior. |
| `M03_WRITE_ENABLED` | Yes | No | `true` | Allows writes to Revenue Graph tables. |
| `M03_PUBLISH_EVENTS` | Yes | No | `true` | Enables publishing of `revenue_graph.entity.linked` and similar events. |
| `M03_SHADOW_MODE` | No | No | `false` | Runs graph linking without affecting production consumers. |

### 2.2 Entity resolution settings

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_ENTITY_RESOLUTION_MIN_CONFIDENCE` | Yes | No | `0.78` | Minimum confidence to auto-link entities. |
| `M03_ENTITY_RESOLUTION_REVIEW_THRESHOLD` | No | No | `0.60` | Lower threshold below which records remain unlinked or flagged. |
| `M03_MAX_CANDIDATES_PER_ENTITY` | No | No | `20` | Limits candidate search width for account/deal/contact matching. |
| `M03_ENABLE_AI_ENTITY_RESOLUTION` | Yes | No | `true` | Turns AI-assisted entity resolution on or off. |
| `M03_ENABLE_RULE_BASED_FALLBACK` | Yes | No | `true` | Enables deterministic fallback if AI result is missing or weak. |

### 2.3 Source and dependency config

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_CRM_CONTEXT_API_BASE_URL` | Yes | No | `http://crm-adapter.internal` | Base URL for CRM context lookup adapter. |
| `M03_AI_SERVICE_BASE_URL` | Yes | No | `http://ai-services.internal` | Internal AI service for entity resolution. |
| `M03_TRANSCRIPT_LOOKBACK_DAYS` | No | No | `180` | Limits some linking/search backfill windows if used operationally. |
| `M03_ENABLE_EMAIL_ACTIVITY_LINKING` | No | No | `true` | Enables email-to-entity linking. |
| `M03_ENABLE_MEETING_ACTIVITY_LINKING` | No | No | `true` | Enables meeting-to-entity linking. |

### 2.4 Queue and retry settings

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_LINKING_QUEUE_NAME` | Yes | No | `revenue-graph-linking` | Queue used for linking jobs. |
| `M03_LINKING_JOB_CONCURRENCY` | Yes | No | `10` | Number of concurrent linking workers. |
| `M03_LINKING_MAX_RETRIES` | Yes | No | `3` | Max retries for failed linking jobs. |
| `M03_LINKING_RETRY_BACKOFF_MS` | No | No | `30000` | Retry delay between attempts. |
| `M03_LINKING_DEAD_LETTER_QUEUE` | No | No | `revenue-graph-linking-dlq` | DLQ for failed linking jobs. |

### 2.5 Event settings

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_EVENT_ENTITY_LINKED` | Yes | No | `revenue_graph.entity.linked` | Published event name for linked entity records. |
| `M03_CONSUME_CALL_TRANSCRIPTION_EVENT` | Yes | No | `call.transcription.completed` | Event consumed from capture layer. |
| `M03_EVENT_PUBLISH_TIMEOUT_MS` | No | No | `5000` | Timeout for event publication attempt. |

### 2.6 Data safety and audit settings

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_REQUIRE_TENANT_ID` | Yes | No | `true` | Blocks processing without tenant context. |
| `M03_AUDIT_ENABLED` | Yes | No | `true` | Enables graph audit logs. |
| `M03_LOG_MATCH_EXPLANATIONS` | No | No | `true` | Stores or logs link reason metadata for debugging. |
| `M03_STRICT_RLS_VALIDATION` | No | No | `true` | Enables startup checks or health checks for RLS assumptions. |

### 2.7 Secrets

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_CRM_CONTEXT_API_KEY` | Yes | Yes | `<secret>` | Auth token for CRM adapter if required. |
| `M03_INTERNAL_SERVICE_TOKEN` | Yes | Yes | `<secret>` | Service-to-service auth for Revenue Graph calls. |

### Notes
- Revenue Graph owns the linked business context that downstream modules depend on.
- Every write must include `tenant_id`, and no cross-tenant reads or writes are allowed anywhere in the platform. 
- The architecture expects `call.transcription.completed` as an upstream event and `revenue_graph.entity.linked` as a key downstream event contract. 

---

## 3. Configure Compliance Settings variables

Configure Compliance Settings is the governance layer that enforces communication restrictions using CRM opt-out state, consent state, tenant policy config, and regional rules such as GDPR- and CCPA-oriented handling. It is not only an admin settings page; it is a runtime enforcement capability used before outreach or governed data actions execute. 

### 3.1 Core flags

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `CORE_COMPLIANCE_ENABLED` | Yes | No | `true` | Enables compliance policy evaluation. |
| `CORE_COMPLIANCE_POLICY_WRITE_ENABLED` | Yes | No | `true` | Allows policy create/update operations. |
| `CORE_COMPLIANCE_RUNTIME_ENFORCEMENT_ENABLED` | Yes | No | `true` | Enables allow/block decisions during runtime actions. |
| `CORE_COMPLIANCE_AUDIT_ENABLED` | Yes | No | `true` | Enables compliance audit logging. |

### 3.2 Default enforcement behavior

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `CORE_COMPLIANCE_FAIL_CLOSED_ON_MISSING_OPTOUT` | Yes | No | `true` | Blocks action if opt-out state cannot be resolved. |
| `CORE_COMPLIANCE_FAIL_CLOSED_ON_MISSING_CONSENT` | No | No | `true` | Blocks action if consent data is required but missing. |
| `CORE_COMPLIANCE_DEFAULT_POLICY_ACTION` | Yes | No | `block` | Default action when tenant policy does not define a path. |
| `CORE_COMPLIANCE_ALLOW_WITH_WARNING_ENABLED` | No | No | `false` | Enables warning outcome in addition to allow/block. |
| `CORE_COMPLIANCE_REQUIRE_REGION_RESOLUTION` | No | No | `true` | Requires region-aware policy resolution where configured. |

### 3.3 Regional policy settings

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `CORE_COMPLIANCE_GDPR_RULESET_ENABLED` | Yes | No | `true` | Enables GDPR-oriented rule family. |
| `CORE_COMPLIANCE_CCPA_RULESET_ENABLED` | Yes | No | `true` | Enables CCPA-oriented rule family. |
| `CORE_COMPLIANCE_DEFAULT_REGION_POLICY` | No | No | `GLOBAL` | Fallback policy region. |
| `CORE_COMPLIANCE_REGION_RESOLUTION_SOURCE_ORDER` | No | No | `contact,account,tenant_default` | Order for resolving legal/operational region. |

### 3.4 CRM and consent integration

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `CORE_COMPLIANCE_CRM_OPTOUT_API_BASE_URL` | Yes | No | `http://crm-adapter.internal` | CRM opt-out lookup source. |
| `CORE_COMPLIANCE_CONSENT_SERVICE_BASE_URL` | Yes | No | `http://platform-core.internal` | Consent state lookup source. |
| `CORE_COMPLIANCE_OPTOUT_CACHE_TTL_SECONDS` | No | No | `300` | Cache TTL for opt-out state. |
| `CORE_COMPLIANCE_CONSENT_CACHE_TTL_SECONDS` | No | No | `300` | Cache TTL for consent state. |
| `CORE_COMPLIANCE_USE_CRM_AS_PRIMARY_SOURCE` | Yes | No | `true` | Declares CRM opt-out source priority. |

### 3.5 Runtime action settings

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `CORE_COMPLIANCE_ENFORCE_EMAIL_SEND` | Yes | No | `true` | Evaluates policies before email send. |
| `CORE_COMPLIANCE_ENFORCE_CALL_ACTION` | Yes | No | `true` | Evaluates policies before call action. |
| `CORE_COMPLIANCE_ENFORCE_WORKFLOW_ACTIONS` | Yes | No | `true` | Evaluates policies before workflow-triggered outreach. |
| `CORE_COMPLIANCE_ENFORCE_DATA_USAGE_GATES` | No | No | `true` | Evaluates policies before governed data usage actions. |
| `CORE_COMPLIANCE_DECISION_TIMEOUT_MS` | No | No | `2000` | Timeout for policy evaluation request. |

### 3.6 Policy store and versioning

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `CORE_COMPLIANCE_POLICY_SCHEMA_NAME` | Yes | No | `compliance` | Schema or namespace for compliance records. |
| `CORE_COMPLIANCE_POLICY_VERSIONING_ENABLED` | No | No | `true` | Enables policy version snapshots. |
| `CORE_COMPLIANCE_REASON_CODE_PREFIX` | No | No | `CORE_COMPLIANCE_` | Prefix used in structured reason codes. |
| `CORE_COMPLIANCE_INCLUDE_DECISION_EXPLANATION` | No | No | `true` | Includes human-readable explanation in decision payload. |

### 3.7 Queue and events

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `CORE_COMPLIANCE_POLICY_CHANGE_EVENT` | No | No | `compliance.policy.updated` | Event emitted on policy changes. |
| `CORE_COMPLIANCE_BLOCKED_ACTION_EVENT` | No | No | `outreach.blocked.compliance` | Event emitted for blocked outreach. |
| `CORE_COMPLIANCE_DECISION_LOG_QUEUE` | No | No | `compliance-decision-log` | Queue for async decision logging or downstream reactions. |

### 3.8 Secrets

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `CORE_COMPLIANCE_CRM_OPTOUT_API_KEY` | Yes | Yes | `<secret>` | Auth token for CRM opt-out source. |
| `CORE_COMPLIANCE_INTERNAL_SERVICE_TOKEN` | Yes | Yes | `<secret>` | Internal service auth for policy APIs. |

### Notes
- Compliance decisions must be enforced at runtime, not only saved in configuration. 
- The architecture explicitly ties compliance to CRM opt-outs, GDPR/CCPA-style rules, consent control, and client-controlled data usage. 
- This capability is cross-cutting and should be callable from outreach, workflow, and governed data-usage paths. 

---

## 4. Data Cloud / Data Export variables

Data Cloud is the structured export capability that sends customer-owned R-Revenue Intelligence data into customer-owned destinations such as Snowflake, BigQuery, Databricks, S3, and Redshift. The architecture requires daily sync, idempotent export jobs, tenant isolation, and full client export without manual Relanto.ai action. 

### 4.1 Core flags

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_ENABLED` | Yes | No | `true` | Enables Data Cloud export subsystem. |
| `M03_CONNECTION_WRITE_ENABLED` | Yes | No | `true` | Allows destination connection management. |
| `M03_SCHEDULED_EXPORT_ENABLED` | Yes | No | `true` | Enables scheduled export jobs. |
| `M03_REPLAY_ENABLED` | No | No | `true` | Enables replay of failed or missed exports. |

### 4.2 Scheduling and checkpointing

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_DEFAULT_SYNC_CRON` | Yes | No | `0 2 * * *` | Default daily sync schedule. |
| `M03_EXPORT_TIMEZONE` | No | No | `UTC` | Timezone for scheduling and run labeling. |
| `M03_CHECKPOINT_STRATEGY` | Yes | No | `updated_at_watermark` | Checkpoint method for incremental sync. |
| `M03_MAX_BACKFILL_DAYS` | No | No | `90` | Maximum allowed replay/backfill range. |
| `M03_RUN_TIMEOUT_MINUTES` | No | No | `120` | Timeout per export run. |

### 4.3 Dataset and batching settings

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_DEFAULT_BATCH_SIZE` | Yes | No | `5000` | Default batch size for export records. |
| `M03_MAX_BATCH_SIZE` | No | No | `20000` | Upper cap on batch size. |
| `M03_ENABLE_INCREMENTAL_EXPORT` | Yes | No | `true` | Enables incremental export mode. |
| `M03_ENABLE_FULL_EXPORT` | Yes | No | `true` | Enables full export mode. |
| `M03_DATASET_VERSION` | Yes | No | `v1` | Version tag for export schema set. |

### 4.4 Destination support flags

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_ENABLE_SNOWFLAKE` | Yes | No | `true` | Enables Snowflake adapter. |
| `M03_ENABLE_BIGQUERY` | Yes | No | `true` | Enables BigQuery adapter. |
| `M03_ENABLE_DATABRICKS` | No | No | `true` | Enables Databricks adapter. |
| `M03_ENABLE_S3` | Yes | No | `true` | Enables S3/file landing adapter. |
| `M03_ENABLE_REDSHIFT` | No | No | `true` | Enables Redshift adapter. |

### 4.5 Queue and retry settings

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_EXPORT_QUEUE_NAME` | Yes | No | `data-cloud-export` | Queue for export jobs. |
| `M03_EXPORT_CONCURRENCY` | Yes | No | `5` | Number of concurrent export workers. |
| `M03_MAX_RETRIES` | Yes | No | `3` | Maximum retry attempts for failed export jobs. |
| `M03_RETRY_BACKOFF_MS` | No | No | `60000` | Backoff between export retries. |
| `M03_DEAD_LETTER_QUEUE` | No | No | `data-cloud-export-dlq` | Queue for failed jobs that exceeded retries. |

### 4.6 Idempotency and safety settings

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_IDEMPOTENCY_ENABLED` | Yes | No | `true` | Enables duplicate-safe export behavior. |
| `M03_IDEMPOTENCY_KEY_STRATEGY` | Yes | No | `tenant-destination-dataset-window` | Strategy for generating run-level idempotency keys. |
| `M03_REQUIRE_TENANT_ID` | Yes | No | `true` | Blocks export without tenant context. |
| `M03_FAIL_EXPORT_ON_SCHEMA_DRIFT` | No | No | `true` | Stops export if destination contract is incompatible. |
| `M03_EXPORT_AUDIT_ENABLED` | Yes | No | `true` | Enables export run and replay audit logs. |

### 4.7 Governance-aware export behavior

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_RESPECT_CONSENT_RESTRICTIONS` | Yes | No | `true` | Applies consent-sensitive restrictions to export behavior if policy requires it. |
| `M03_ENABLE_DELETE_TOMBSTONES` | No | No | `true` | Emits tombstone or delete markers when supported. |
| `M03_EXCLUDE_RESTRICTED_DATASETS` | No | No | `true` | Skips datasets blocked by governance policy. |
| `M03_DELETION_PROPAGATION_MODE` | No | No | `tombstone` | Strategy for handling deleted records in exports. |

### 4.8 Destination connection metadata

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_CONNECTION_SCHEMA_NAME` | No | No | `data_cloud` | Schema or namespace for connection metadata. |
| `M03_TEST_CONNECTION_TIMEOUT_MS` | No | No | `10000` | Timeout for connection validation. |
| `M03_DESTINATION_NAME_MAX_LENGTH` | No | No | `100` | Validation limit for UI/API. |

### 4.9 Secrets

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `M03_SECRET_PROVIDER` | Yes | No | `aws-secrets-manager` | Secret backend for connection credentials. |
| `M03_INTERNAL_SERVICE_TOKEN` | Yes | Yes | `<secret>` | Internal auth token for Data Cloud control paths. |
| `M03_SNOWFLAKE_CREDENTIAL_SECRET_REF` | Conditional | Yes | `secret/data-cloud/snowflake/acme` | Secret reference for Snowflake connection. |
| `M03_BIGQUERY_CREDENTIAL_SECRET_REF` | Conditional | Yes | `secret/data-cloud/bigquery/acme` | Secret reference for BigQuery connection. |
| `M03_DATABRICKS_CREDENTIAL_SECRET_REF` | Conditional | Yes | `secret/data-cloud/databricks/acme` | Secret reference for Databricks connection. |
| `M03_S3_CREDENTIAL_SECRET_REF` | Conditional | Yes | `secret/data-cloud/s3/acme` | Secret reference for S3 destination. |
| `M03_REDSHIFT_CREDENTIAL_SECRET_REF` | Conditional | Yes | `secret/data-cloud/redshift/acme` | Secret reference for Redshift destination. |

### Notes
- Data Cloud jobs must be idempotent and safe to retry. 
- Customers must be able to export their data in full, to client-owned destinations, without manual Relanto.ai action. 
- Destination credentials should be referenced from secret management, not stored as plaintext env values where possible. 

---

## 5. Shared Platform Core variables referenced by M10

These variables are often owned outside M10, but M10 capabilities depend on them heavily. Reference them instead of redefining them locally.

| Variable | Owner | Why M10 needs it |
|---|---|---|
| `PLATFORM_DATABASE_URL` | Platform Core | Shared PostgreSQL connection with tenant isolation and RLS. |
| `PLATFORM_REDIS_URL` | Platform Core | BullMQ queues, checkpoints, retries, and worker coordination. |
| `PLATFORM_EVENT_BUS_URL` | Platform Core | Event-driven module communication. |
| `PLATFORM_JWT_ISSUER` | Platform Core | Service and user auth validation. |
| `PLATFORM_JWT_AUDIENCE` | Platform Core | API auth checks. |
| `PLATFORM_SERVICE_AUTH_MODE` | Platform Core | Internal service-to-service auth pattern. |
| `PLATFORM_AUDIT_LOG_ENABLED` | Platform Core | Common audit log infrastructure. |
| `PLATFORM_TENANT_CONTEXT_REQUIRED` | Platform Core | Enforces tenant-safe execution. |
| `PLATFORM_RLS_ENFORCEMENT_MODE` | Platform Core | Health checks and safety validation. |
| `PLATFORM_ENVIRONMENT` | Platform Core | Environment labeling for logs, alerts, and support. |

### Notes
- The architecture requires shared PostgreSQL with RLS, event-driven module communication, and tenant-scoped data ownership across the platform. 
- M10 features should use these platform contracts rather than inventing separate auth, queue, or tenancy patterns. 

---

## 6. Environment-specific guidance

### Local development
Use safe defaults, mock adapters, and non-production queues wherever possible.

Suggested examples:
- `M03_SHADOW_MODE=true`
- `CORE_COMPLIANCE_RUNTIME_ENFORCEMENT_ENABLED=true`
- `M03_SCHEDULED_EXPORT_ENABLED=false`
- `M03_REPLAY_ENABLED=true`

### QA / staging
Use realistic async behavior and fake but production-like secret references.

Suggested focus:
- event delivery,
- retry behavior,
- blocked compliance decisions,
- export replay,
- tenant isolation tests.

### Production
Production should always enforce:
- tenant-required execution,
- audit logging,
- runtime compliance evaluation,
- idempotent export jobs,
- secret-managed credentials,
- queue retries with DLQ,
- and observability on failures.

---

## 7. Example `.env.example` skeleton

```env
# Shared
M10_ENABLED=true
M10_AUDIT_TAG=m10-data-compliance

# Revenue Graph
M03_ENABLED=true
M03_WRITE_ENABLED=true
M03_PUBLISH_EVENTS=true
M03_ENTITY_RESOLUTION_MIN_CONFIDENCE=0.78
M03_ENABLE_AI_ENTITY_RESOLUTION=true
M03_ENABLE_RULE_BASED_FALLBACK=true
M03_CRM_CONTEXT_API_BASE_URL=http://crm-adapter.internal
M03_AI_SERVICE_BASE_URL=http://ai-services.internal
M03_LINKING_QUEUE_NAME=revenue-graph-linking
M03_LINKING_JOB_CONCURRENCY=10
M03_LINKING_MAX_RETRIES=3
M03_REQUIRE_TENANT_ID=true
M03_AUDIT_ENABLED=true

# Compliance
CORE_COMPLIANCE_ENABLED=true
CORE_COMPLIANCE_POLICY_WRITE_ENABLED=true
CORE_COMPLIANCE_RUNTIME_ENFORCEMENT_ENABLED=true
CORE_COMPLIANCE_AUDIT_ENABLED=true
CORE_COMPLIANCE_FAIL_CLOSED_ON_MISSING_OPTOUT=true
CORE_COMPLIANCE_DEFAULT_POLICY_ACTION=block
CORE_COMPLIANCE_GDPR_RULESET_ENABLED=true
CORE_COMPLIANCE_CCPA_RULESET_ENABLED=true
CORE_COMPLIANCE_CRM_OPTOUT_API_BASE_URL=http://crm-adapter.internal
CORE_COMPLIANCE_CONSENT_SERVICE_BASE_URL=http://platform-core.internal
CORE_COMPLIANCE_ENFORCE_EMAIL_SEND=true
CORE_COMPLIANCE_ENFORCE_CALL_ACTION=true
CORE_COMPLIANCE_ENFORCE_WORKFLOW_ACTIONS=true

# Data Cloud
M03_ENABLED=true
M03_CONNECTION_WRITE_ENABLED=true
M03_SCHEDULED_EXPORT_ENABLED=true
M03_REPLAY_ENABLED=true
M03_DEFAULT_SYNC_CRON=0 2 * * *
M03_EXPORT_TIMEZONE=UTC
M03_CHECKPOINT_STRATEGY=updated_at_watermark
M03_DEFAULT_BATCH_SIZE=5000
M03_ENABLE_INCREMENTAL_EXPORT=true
M03_ENABLE_FULL_EXPORT=true
M03_DATASET_VERSION=v1
M03_ENABLE_SNOWFLAKE=true
M03_ENABLE_BIGQUERY=true
M03_ENABLE_DATABRICKS=true
M03_ENABLE_S3=true
M03_ENABLE_REDSHIFT=true
M03_EXPORT_QUEUE_NAME=data-cloud-export
M03_EXPORT_CONCURRENCY=5
M03_MAX_RETRIES=3
M03_IDEMPOTENCY_ENABLED=true
M03_REQUIRE_TENANT_ID=true
M03_EXPORT_AUDIT_ENABLED=true
```

### Warning
This `.env.example` must never contain real secrets. Secret references are allowed, but secret values are not.

---

## 8. Validation checklist

Before merging any M10 env change, verify:

- Variable name follows the correct prefix.
- Capability ownership is clear.
- Secret vs non-secret is marked correctly.
- Default behavior is safe.
- Tenant isolation is not weakened.
- Runtime compliance behavior is not accidentally disabled.
- Export idempotency and replay behavior remain safe.
- Supporting docs are updated if new behavior is introduced.

---

## 9. Common mistakes to avoid

- Using `M10_` for variables that really belong to one capability
- Putting secret credentials directly into generic env vars instead of secret references
- Adding feature flags without documenting default-safe behavior
- Creating duplicate Platform Core vars inside M10 docs
- Forgetting that compliance settings affect runtime actions, not only admin screens
- Forgetting that Data Cloud must be retry-safe and idempotent
- Forgetting that Revenue Graph outputs are upstream dependencies for many other modules

---

## 10. Quick lookup by use case

| If you are working on... | Start with these prefixes |
|---|---|
| Entity linking and graph building | `M03_` |
| CRM opt-out and policy enforcement | `CORE_COMPLIANCE_` |
| Warehouse exports, replay, checkpoints | `M03_` |
| Shared auth, queues, RLS, audit infra | `PLATFORM_` |

---

## 11. Final rule

If a new setting changes how the platform:

- links interactions to business entities,
- allows or blocks communication or governed data use,
- or exports tenant-owned data to customer destinations,

then it belongs in this registry and must be documented before the PR is approved.
