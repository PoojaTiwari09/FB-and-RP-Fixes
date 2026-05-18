# Doc #18 — Environment Variables Registry: M5 Account Intelligence

## Document Control

- **Document name:** Environment Variables Registry — M5 Account Intelligence 
- **Platform:** R-Revenue Intelligence 
- **Module name (product):** M5 Account Intelligence 
- **Implementation owner (engineering):** M-07 Deal and Account Management 
- **Document type:** Environment Variable Registry 
- **Version:** 0.1 
- **Status:** Draft 
- **Owner:** Tech Lead / Engineering Lead 
- **Last updated:** April 2026 
- **Next review date:** July 2026 
- **Review cadence:** Every 3 months, or immediately after any major architecture or infrastructure change. 

## Purpose

This document defines the environment variables required to run **M5 Account Intelligence** safely across local, staging, and production environments.   
It exists so backend engineers, DevOps engineers, QA engineers, and freshers can know exactly which runtime settings control Account Boards, account detail hydration, async refresh behavior, tenant isolation, upstream context access, and observability. 

This registry covers:
- App basics and feature flags. 
- PostgreSQL and Redis dependencies. 
- CRM-linked read configuration. 
- Account scoring and AI context service access. 
- Board cache and refresh settings. 
- Observability, logs, and alerts. 

## Usage Rules

- Environment variables are the **only approved way** to inject deployment-specific runtime configuration into M5 services. 
- Do not hardcode secrets, tokens, hostnames, queue credentials, or service URLs in source code, test fixtures, Dockerfiles, or frontend bundles. 
- Secrets must come from the platform-approved secret source, such as Doppler or equivalent centralized secret management. 
- M5 must follow platform tenancy rules, so any configuration that affects reads, writes, cache keys, or refresh jobs must remain tenant-safe and must not bypass RLS or RBAC enforcement. 
- If a variable changes runtime behavior for another module boundary, the change must be reviewed by the Tech Lead before production rollout. 
- Boolean values should be written consistently as `true` or `false`. 
- Duration values should use an explicit unit convention, either seconds as integers or ISO-like human-readable documented values; this registry uses **seconds** unless noted otherwise. 

## Runtime Groups

M5 variables are grouped by how the module works at runtime. 

### Group A — App basics and feature flags

These variables control whether Account Boards is enabled, how the module identifies itself, and whether M5-specific behaviors should run in the current environment. 

### Group B — PostgreSQL and Redis

These variables support M5’s main read models, saved board configuration, account engagement artifacts, renewal signals, and async refresh queue behavior. 

### Group C — CRM read configuration

These variables control how M5 reads approved CRM-linked account context through platform-approved boundaries. 

### Group D — Account scoring and context services

These variables define how M5 reaches upstream account context or AI-generated brief providers, especially M-06 and related internal service paths. 

### Group E — Board cache and refresh settings

These variables tune stale thresholds, refresh queue behavior, cache TTLs, refresh debouncing, and safe fallback behavior for fast Account Board reads. 

### Group F — Observability, logs, and alerts

These variables control structured logs, tracing, error reporting, and alert routing for stale boards, refresh failures, and degraded account detail hydration. 

## Variable Registry Table

| Variable | Required | Example | Group | Used By | Description |
|---|---|---|---|---|---|
| `APP_ENV` | Yes | `local` | App basics | API, workers | Runtime environment name such as `local`, `staging`, or `production`.  |
| `NODE_ENV` | Yes | `production` | App basics | API, workers | Standard Node runtime mode for TypeScript product services.  |
| `SERVICE_NAME` | Yes | `m07-deal-account-service` | App basics | API, workers, logs | Service identity used in logs, metrics, and traces.  |
| `PORT` | Yes | `8080` | App basics | API | HTTP port for the M-07 service process.  |
| `M5_ACCOUNT_BOARDS_ENABLED` | Yes | `true` | App basics | API, UI integration | Master feature flag for Account Boards capability.  |
| `M5_ACCOUNT_DETAIL_ENABLED` | Yes | `true` | App basics | API, UI integration | Feature flag for account detail panel endpoints and hydration logic.  |
| `M5_REFRESH_WORKER_ENABLED` | Yes | `true` | App basics | Worker | Enables async stale refresh processing for accounts.  |
| `M5_ALLOW_PARTIAL_HYDRATION` | No | `true` | App basics | API | Allows board or detail responses to return partial data when some upstream context is unavailable.  |
| `M5_DEFAULT_PAGE_SIZE` | No | `50` | App basics | API | Default number of account rows returned when request does not specify page size.  |
| `M5_MAX_PAGE_SIZE` | No | `200` | App basics | API | Upper limit for account board pagination to protect performance.  |
| `DATABASE_URL` | Yes | `postgresql://...` | PostgreSQL | API, workers | Primary PostgreSQL connection string for M-07-owned tables and approved reads.  |
| `DB_POOL_MIN` | No | `5` | PostgreSQL | API, workers | Minimum DB connection pool size.  |
| `DB_POOL_MAX` | No | `20` | PostgreSQL | API, workers | Maximum DB connection pool size to protect shared database stability.  |
| `DB_STATEMENT_TIMEOUT_MS` | No | `15000` | PostgreSQL | API, workers | Statement timeout for board queries and refresh jobs.  |
| `REDIS_URL` | Yes | `redis://...` | Redis | API, workers, queue | Redis connection for BullMQ-backed refresh and cache support.  |
| `REDIS_TLS_ENABLED` | No | `true` | Redis | API, workers | Enables TLS for managed Redis environments.  |
| `BULLMQ_PREFIX` | Yes | `ri` | Redis | Workers, queue | Shared queue namespace prefix for the platform.  |
| `M5_REFRESH_QUEUE_NAME` | Yes | `m5-account-refresh` | Redis | Workers | Queue name for account refresh jobs.  |
| `M5_REFRESH_CONCURRENCY` | No | `10` | Redis | Workers | Worker concurrency for async account refresh jobs.  |
| `M5_REFRESH_MAX_RETRIES` | No | `3` | Redis | Workers | Maximum retry count for refresh jobs.  |
| `M5_REFRESH_BACKOFF_MS` | No | `30000` | Redis | Workers | Base retry backoff for failed refresh jobs.  |
| `M5_DEAD_LETTER_ENABLED` | No | `true` | Redis | Workers, ops | Enables dead-letter handling for exhausted refresh jobs.  |
| `CRM_READ_PROVIDER` | Yes | `salesforce` | CRM reads | API, workers | Active primary CRM context provider for the tenant or environment.  |
| `CRM_READ_TIMEOUT_MS` | No | `8000` | CRM reads | API, workers | Timeout for approved CRM-linked read operations.  |
| `CRM_READ_RETRY_COUNT` | No | `2` | CRM reads | API, workers | Retry count for transient CRM read failures when synchronous access is allowed by boundary rules.  |
| `CRM_CONTEXT_API_BASE_URL` | Yes | `http://platform-core-internal` | CRM reads | API, workers | Base URL for approved internal CRM-context or linked-entity read APIs.  |
| `CRM_CONTEXT_API_TOKEN` | Yes | `secret` | CRM reads | API, workers | Service-to-service auth token for approved internal CRM context reads.  |
| `M6_INSIGHTS_API_BASE_URL` | Yes | `http://insight-generation-internal` | Context services | API, workers | Base URL for M-06 account brief or related insight reads.  |
| `M6_INSIGHTS_API_TOKEN` | Yes | `secret` | Context services | API, workers | Service credential for calling approved M-06 public APIs.  |
| `M5_ACCOUNT_BRIEF_PATH` | No | `/api/v1/insights/accounts/:id/brief` | Context services | API | Relative path template for account brief reads.  |
| `M5_ENGAGEMENT_SCORE_SOURCE` | No | `internal_table` | Context services | API, workers | Indicates whether engagement score is read from M-07-owned table or another approved read layer.  |
| `M5_RENEWAL_SIGNAL_SOURCE` | No | `internal_table` | Context services | API, workers | Indicates source for renewal/account signal reads.  |
| `M5_CONTEXT_FETCH_TIMEOUT_MS` | No | `5000` | Context services | API, workers | Timeout for upstream account context or brief hydration calls.  |
| `M5_CONTEXT_FETCH_RETRY_COUNT` | No | `1` | Context services | API, workers | Retry count for transient upstream context failures.  |
| `M5_BOARD_CACHE_ENABLED` | No | `true` | Cache/refresh | API | Enables read-side caching for board listing responses where safe.  |
| `M5_BOARD_CACHE_TTL_SEC` | No | `120` | Cache/refresh | API | TTL for cached board responses.  |
| `M5_DETAIL_CACHE_TTL_SEC` | No | `60` | Cache/refresh | API | TTL for account detail hydration responses.  |
| `M5_STALE_AFTER_SEC` | Yes | `900` | Cache/refresh | API, workers | Age threshold after which board/account state is treated as stale.  |
| `M5_BRIEF_STALE_AFTER_SEC` | No | `1800` | Cache/refresh | API, workers | Age threshold for AI account brief freshness.  |
| `M5_REFRESH_DEBOUNCE_SEC` | No | `120` | Cache/refresh | Workers | Prevents repeated refresh jobs for the same account in a short period.  |
| `M5_FORCE_ASYNC_REFRESH_ONLY` | No | `true` | Cache/refresh | API, workers | Prevents expensive synchronous recomputation during user request flows.  |
| `M5_MANUAL_REFRESH_ENABLED` | No | `true` | Cache/refresh | API, UI integration | Enables user-triggered refresh action from Account Board or detail panel.  |
| `M5_PARTIAL_RESPONSE_ON_BRIEF_FAILURE` | No | `true` | Cache/refresh | API | Returns board/detail data even if M-06 brief fetch fails.  |
| `M5_APPLIED_FILTER_LIMIT` | No | `20` | Cache/refresh | API | Guardrail to prevent extreme saved-filter or request-filter combinations.  |
| `M5_SORT_FIELD_ALLOWLIST` | No | `name,health,lastActivityAt` | Cache/refresh | API | Explicit allowlist for supported board sort fields.  |
| `LOG_LEVEL` | Yes | `info` | Observability | API, workers | Structured log verbosity level.  |
| `LOG_FORMAT` | No | `json` | Observability | API, workers | Preferred log format for centralized ingestion.  |
| `SENTRY_DSN` | No | `https://...` | Observability | API, workers | Error tracking and exception reporting endpoint.  |
| `SENTRY_ENVIRONMENT` | No | `production` | Observability | API, workers | Sentry environment tag.  |
| `METRICS_ENABLED` | No | `true` | Observability | API, workers | Enables metrics export for queue depth, latency, and refresh failures.  |
| `METRICS_PORT` | No | `9090` | Observability | API, workers | Port for metrics endpoint if exposed separately.  |
| `TRACE_ENABLED` | No | `true` | Observability | API, workers | Enables distributed tracing across board read and refresh paths.  |
| `ALERT_WEBHOOK_URL` | No | `https://hooks...` | Observability | Workers, ops | Alert sink for repeated refresh failures, stale spikes, or dependency outages.  |
| `AUDIT_LOG_ENABLED` | No | `true` | Observability | API | Enables audit logging for config updates and manual refresh operations.  |
| `AUTH_JWT_ISSUER` | Yes | `https://supabase...` | Security/auth | API | Expected JWT issuer used by the platform auth model.  |
| `AUTH_JWT_AUDIENCE` | Yes | `authenticated` | Security/auth | API | Expected JWT audience.  |
| `AUTH_JWT_PUBLIC_KEY` | Yes | `-----BEGIN PUBLIC KEY-----` | Security/auth | API | Public key or JWKS-backed value for JWT verification.  |
| `TENANT_HEADER_NAME` | No | `x-tenant-id` | Security/auth | API | Header name used by trusted internal systems for tenant context propagation where allowed.  |
| `RLS_ENFORCEMENT_REQUIRED` | Yes | `true` | Security/auth | API, workers | Startup guardrail requiring tenant-safe DB access mode.  |

## Minimum Required Variables by Flow

### 1. Account Board listing flow

Minimum variables:
- `APP_ENV` 
- `NODE_ENV` 
- `PORT` 
- `M5_ACCOUNT_BOARDS_ENABLED` 
- `DATABASE_URL` 
- `AUTH_JWT_ISSUER` 
- `AUTH_JWT_AUDIENCE` 
- `AUTH_JWT_PUBLIC_KEY` 
- `RLS_ENFORCEMENT_REQUIRED` 

Needed because board listing is a protected, tenant-scoped read path over M-07-owned records and approved account context reads. 

### 2. Account Board listing with saved view restoration

Minimum variables:
- All Account Board listing variables. 
- `M5_DEFAULT_PAGE_SIZE` 
- `M5_MAX_PAGE_SIZE` 
- `M5_SORT_FIELD_ALLOWLIST` 
- `M5_APPLIED_FILTER_LIMIT` 

Needed because saved config, filters, columns, and sort behavior must be guarded and predictable. 

### 3. Account detail hydration flow

Minimum variables:
- `M5_ACCOUNT_DETAIL_ENABLED` 
- `DATABASE_URL` 
- `M6_INSIGHTS_API_BASE_URL` 
- `M6_INSIGHTS_API_TOKEN` 
- `M5_CONTEXT_FETCH_TIMEOUT_MS` 
- `M5_PARTIAL_RESPONSE_ON_BRIEF_FAILURE` 

Needed because account detail requires linked CRM context, engagement state, renewal signals, and AI brief hydration or fallback. 

### 4. Async account refresh flow

Minimum variables:
- `M5_REFRESH_WORKER_ENABLED` 
- `REDIS_URL` 
- `BULLMQ_PREFIX` 
- `M5_REFRESH_QUEUE_NAME` 
- `M5_REFRESH_CONCURRENCY` 
- `M5_REFRESH_MAX_RETRIES` 
- `M5_REFRESH_BACKOFF_MS` 
- `M5_STALE_AFTER_SEC` 
- `M5_REFRESH_DEBOUNCE_SEC` 
- `DATABASE_URL` 

Needed because async refresh is the preferred runtime behavior for stale account rows and account brief updates. 

### 5. Observability and support flow

Minimum variables:
- `LOG_LEVEL` 
- `LOG_FORMAT` 
- `SENTRY_DSN` 
- `METRICS_ENABLED` 
- `ALERT_WEBHOOK_URL` 
- `AUDIT_LOG_ENABLED` 

Needed because stale boards, failed refreshes, tenant mismatches, and upstream dependency issues must be visible to engineering and support teams. 

## Rotation and Security Notes

- All secrets must be stored in centralized secret management, not in `.env.example` with live values, Git history, CI logs, screenshots, or chat threads. 
- JWT verification keys and service-to-service tokens must be rotated through the approved secrets workflow with rollback support. 
- Redis and database credentials must be rotated on suspected leakage, role changes, or environment cloning events. 
- Any variable containing a token, DSN, secret, password, private key, or signed webhook credential must be masked in logs and debugging output. 
- Environment-specific variables must remain separated between local, staging, and production; production secrets must never be copied into personal local machines unless explicitly approved. 
- M5 does not weaken tenant isolation through configuration; no environment variable may disable tenant scoping, RLS expectations, or JWT validation in shared environments. 
- Feature flags may disable M5 behavior, but they must not create hidden bypasses around auth, audit, or data ownership rules. 
- Service tokens used to call upstream modules such as M-06 must be scoped narrowly to approved public endpoints. 

## Validation Checklist

Use this checklist before merging env changes or promoting M5 to staging/production. 

### Startup validation
- `APP_ENV` and `NODE_ENV` are set correctly. 
- `DATABASE_URL` connects successfully. 
- `REDIS_URL` connects successfully if refresh worker is enabled. 
- JWT issuer, audience, and key settings validate correctly. 
- Required feature flags are present and intentional. 

### Security validation
- No secret is hardcoded in repo files or Docker image layers. 
- Tenant-safe mode is enabled and `RLS_ENFORCEMENT_REQUIRED=true`. 
- Service tokens are scoped and masked in logs. 
- Production secrets differ from local and staging secrets. 

### Runtime validation
- Account Board listing endpoint loads successfully with saved view restoration. 
- Account detail endpoint loads with CRM context and AI context hydration or safe fallback. 
- Async refresh jobs enqueue and complete successfully. 
- Stale account state refreshes without forcing synchronous recomputation in request handlers. 
- Partial hydration behavior is tested for upstream brief failure or timeout. 

### Observability validation
- Logs are structured and searchable. 
- Sentry receives test exception events in non-local environments. 
- Metrics expose board latency, refresh failures, and queue depth. 
- Alert routing works for repeated refresh failures or stale spikes. 

## Example `.env.example` for local development

```bash
APP_ENV=local
NODE_ENV=development
SERVICE_NAME=m07-deal-account-service
PORT=8080

M5_ACCOUNT_BOARDS_ENABLED=true
M5_ACCOUNT_DETAIL_ENABLED=true
M5_REFRESH_WORKER_ENABLED=true
M5_ALLOW_PARTIAL_HYDRATION=true
M5_DEFAULT_PAGE_SIZE=50
M5_MAX_PAGE_SIZE=200

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/revenue_intelligence
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_STATEMENT_TIMEOUT_MS=15000

REDIS_URL=redis://localhost:6379
REDIS_TLS_ENABLED=false
BULLMQ_PREFIX=ri
M5_REFRESH_QUEUE_NAME=m5-account-refresh
M5_REFRESH_CONCURRENCY=5
M5_REFRESH_MAX_RETRIES=3
M5_REFRESH_BACKOFF_MS=30000
M5_DEAD_LETTER_ENABLED=true

CRM_READ_PROVIDER=salesforce
CRM_READ_TIMEOUT_MS=8000
CRM_READ_RETRY_COUNT=2
CRM_CONTEXT_API_BASE_URL=http://localhost:8081
CRM_CONTEXT_API_TOKEN=replace-me

M6_INSIGHTS_API_BASE_URL=http://localhost:8082
M6_INSIGHTS_API_TOKEN=replace-me
M5_ACCOUNT_BRIEF_PATH=/api/v1/insights/accounts/:id/brief
M5_ENGAGEMENT_SCORE_SOURCE=internal_table
M5_RENEWAL_SIGNAL_SOURCE=internal_table
M5_CONTEXT_FETCH_TIMEOUT_MS=5000
M5_CONTEXT_FETCH_RETRY_COUNT=1

M5_BOARD_CACHE_ENABLED=true
M5_BOARD_CACHE_TTL_SEC=120
M5_DETAIL_CACHE_TTL_SEC=60
M5_STALE_AFTER_SEC=900
M5_BRIEF_STALE_AFTER_SEC=1800
M5_REFRESH_DEBOUNCE_SEC=120
M5_FORCE_ASYNC_REFRESH_ONLY=true
M5_MANUAL_REFRESH_ENABLED=true
M5_PARTIAL_RESPONSE_ON_BRIEF_FAILURE=true
M5_APPLIED_FILTER_LIMIT=20
M5_SORT_FIELD_ALLOWLIST=name,health,lastActivityAt

LOG_LEVEL=debug
LOG_FORMAT=json
SENTRY_DSN=
SENTRY_ENVIRONMENT=local
METRICS_ENABLED=true
METRICS_PORT=9090
TRACE_ENABLED=false
ALERT_WEBHOOK_URL=
AUDIT_LOG_ENABLED=true

AUTH_JWT_ISSUER=https://example.supabase.co/auth/v1
AUTH_JWT_AUDIENCE=authenticated
AUTH_JWT_PUBLIC_KEY=replace-me
TENANT_HEADER_NAME=x-tenant-id
RLS_ENFORCEMENT_REQUIRED=true
```

## Notes for freshers

- If you do not know whether a variable is secret, treat it as secret first. 
- If you are adding a new variable, add it here before using it in code. 
- If your new variable affects another module boundary, queue behavior, or tenant safety, get Tech Lead review before merge. 
- For M5, the most important rule is simple: **fast reads, async refresh, strict tenant safety**. 