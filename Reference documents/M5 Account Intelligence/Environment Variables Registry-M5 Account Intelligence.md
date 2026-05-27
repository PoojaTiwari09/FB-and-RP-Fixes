# Doc #18 — Environment Variables Registry: M5 Account Intelligence

## 1. Document Control

- **Document Name:** Environment Variables Registry — M5 Account Intelligence
- **Platform:** R-Revenue Intelligence
- **Module Name:** M5 Account Intelligence
- **Workspace Directory:** `modules/m05-account-intelligence/`
- **Owner:** Product Engineering — M5
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Purpose

This document defines the environment variables required to run the **M5 Account Intelligence** module safely across local, staging, and production environments. 

It provides an explicit reference for backend, DevOps, and QA teams regarding runtime configurations that control Account Boards, detail hydrated panels, asynchronous scoring engines, Redis-backed BullMQ workflows, tenant isolations, and upstream API boundaries.

---

## 3. Usage Rules

- **Zero Secrets in Git:** Under no circumstances should live API tokens, passwords, database URLs, or security keys reside in raw source files or committed environments. Doppler is the exclusive secret management orchestrator.
- **Strict Tenancy Safety:** No configuration flag or custom local variable may disable Row-Level Security (RLS) or bypass JWT signature validations in shared or production environments.
- **Uniform Casing:** Boolean flags must be written as `true` or `false`. Durations and timeouts must use **milliseconds** for API calls and **seconds** for cache TTLs, unless explicitly stated in the variable descriptions.

---

## 4. Runtime Groups

### Group A — App Basics & Feature Flags
These variables govern service identity, runtime environments, and selective module capability switches.

### Group B — PostgreSQL Schema Mappings
These variables manage connection pools, timeouts, and transaction configurations for the `m05_account_intelligence` database schema.

### Group C — Redis & Queue Configuration
These variables control BullMQ-backed background workers processing debounced engagement scoring and stale-state refresh tasks.

### Group D — Upstream Context API Scopes
These variables define secure connection endpoints for upstream services: **M10 Data & Compliance** (Revenue Graph CRM details) and **M3 AI Summaries & GenAI** (Account Brief recaps).

### Group E — Cache & Refresh Optimization
These variables tune time-to-live (TTL) thresholds, stale badges, and analytical scoring windows.

### Group F — Observability, Logs, & Alerts
These variables configure structured logging verbosities, Sentry exception targets, and webhook notifications on service outages.

---

## 5. Variable Registry Table

| Variable | Required | Example | Group | Used By | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`APP_ENV`** | Yes | `production` | App Basics | API, Workers | Active environment name (`local`, `staging`, `production`). |
| **`NODE_ENV`** | Yes | `production` | App Basics | API, Workers | Standard Node runtime execution environment mode. |
| **`SERVICE_NAME`** | Yes | `m05-account-intelligence-service` | App Basics | API, Workers | Service identifier utilized in logs, traces, and metrics. |
| **`PORT`** | Yes | `8080` | App Basics | API | Listening HTTP port for the modular service instance. |
| **`M05_ENABLED`** | Yes | `true` | App Basics | API, Workers | Master enablement flag for the M5 module. |
| **`M05_BOARDS_ENABLED`** | Yes | `true` | App Basics | API | Enablement switch for Account Boards grid endpoints. |
| **`M05_DETAIL_ENABLED`** | Yes | `true` | App Basics | API | Enablement switch for detailed hydration panel endpoints. |
| **`M05_REFRESH_WORKER_ENABLED`** | Yes | `true` | App Basics | Workers | Enables the BullMQ background worker for scoring and stale updates. |
| **`M05_ALLOW_PARTIAL_HYDRATION`** | No | `true` | App Basics | API | Allows boards to render empty-state indicators if AI summaries fail. |
| **`M05_DEFAULT_PAGE_SIZE`** | No | `50` | App Basics | API | Fallback number of account rows returned on requests. |
| **`M05_MAX_PAGE_SIZE`** | No | `200` | App Basics | API | Maximum pagination limit to protect backend query performance. |
| **`DATABASE_URL`** | Yes | `postgresql://...` | PostgreSQL | API, Workers | PostgreSQL connection string pointing to the tenant database. |
| **`DB_POOL_MIN`** | No | `5` | PostgreSQL | API, Workers | Minimum active DB connection pool capacity. |
| **`DB_POOL_MAX`** | No | `20` | PostgreSQL | API, Workers | Maximum active DB connection pool capacity to prevent connection starvation. |
| **`DB_STATEMENT_TIMEOUT_MS`** | No | `10000` | PostgreSQL | API, Workers | Hard statement execution timeout for relational queries. |
| **`REDIS_URL`** | Yes | `redis://...` | Redis | API, Workers | Redis connection string used for caching and BullMQ state storage. |
| **`REDIS_TLS_ENABLED`** | No | `true` | Redis | API, Workers | Enables secure TLS encryption for managed Redis instances. |
| **`BULLMQ_PREFIX`** | Yes | `ri` | Redis | Workers | Shared namespace prefix to keep queues isolated on Redis. |
| **`M05_REFRESH_QUEUE_NAME`** | Yes | `m05-account-refresh` | Redis | Workers | Queue name for async scoring and refresh tasks. |
| **`M05_REFRESH_CONCURRENCY`** | No | `10` | Redis | Workers | Concurrency level for background scoring execution threads. |
| **`M05_REFRESH_MAX_RETRIES`** | No | `3` | Redis | Workers | Max retry attempts for transient worker failures. |
| **`M05_REFRESH_BACKOFF_MS`** | No | `30000` | Redis | Workers | Exponential backoff delay base for failing jobs. |
| **`M05_DEAD_LETTER_ENABLED`** | No | `true` | Redis | Workers | Routes permanently failing refresh jobs to a Dead-Letter Queue (DLQ). |
| **`M10_CRM_API_BASE_URL`** | Yes | `http://m10-compliance-internal` | Upstream API | API, Workers | Base URL of M10 Data & Compliance REST API for CRM entity reads. |
| **`M10_CRM_API_TOKEN`** | Yes | `secret` | Upstream API | API, Workers | Secure token authorizing M5 service requests to M10. |
| **`M03_SUMMARIES_API_BASE_URL`** | Yes | `http://m03-summaries-internal` | Upstream API | API | Base URL of M3 AI Summaries & GenAI REST API for AI briefs. |
| **`M03_SUMMARIES_API_TOKEN`** | Yes | `secret` | Upstream API | API | Secure token authorizing M5 service requests to M3. |
| **`M05_ACCOUNT_BRIEF_PATH`** | No | `/api/v1/m03-ai-summaries-genai/accounts/:id/brief` | Upstream API | API | Relative URI pattern matching M3's account brief endpoint. |
| **`M05_BOARD_CACHE_ENABLED`** | No | `true` | Cache/Refresh | API | Enables read-side cache for board rows. |
| **`M05_BOARD_CACHE_TTL_SEC`** | No | `120` | Cache/Refresh | API | TTL for cached board row responses. |
| **`M05_DETAIL_CACHE_TTL_SEC`** | No | `60` | Cache/Refresh | API | TTL for account detail panel queries. |
| **`M05_STALE_AFTER_SEC`** | Yes | `900` | Cache/Refresh | API, Workers | Age boundary after which account drivers must be refreshed. |
| **`M05_BRIEF_STALE_AFTER_SEC`** | No | `1800` | Cache/Refresh | API | Age boundary for AI summary briefs freshness markers. |
| **`M05_REFRESH_DEBOUNCE_SEC`** | No | `120` | Cache/Refresh | Workers | Minimum debounce window to merge consecutive scoring requests. |
| **`M05_FORCE_ASYNC_REFRESH_ONLY`** | No | `true` | Cache/Refresh | API | Blocks synchronous score calculations during HTTP requests. |
| **`LOG_LEVEL`** | Yes | `info` | Observability | API, Workers | Standard structured logging granularity switch (`info`, `debug`). |
| **`LOG_FORMAT`** | No | `json` | Observability | API, Workers | Output layout for downstream ingestion systems. |
| **`SENTRY_DSN`** | No | `https://...` | Observability | API, Workers | Destination URL for Sentry logging and exception monitoring. |
| **`SENTRY_ENVIRONMENT`** | No | `production` | Observability | API, Workers | Environment label tagged to all Sentry events. |
| **`ALERT_WEBHOOK_URL`** | No | `https://hooks...`| Observability | Workers | Channel webhook for critical queue spikes and database failures. |
| **`AUTH_JWT_ISSUER`** | Yes | `https://supabase...`| Security/Auth | API | Expected JWT token issuer validating authentications. |
| **`AUTH_JWT_AUDIENCE`** | Yes | `authenticated` | Security/Auth | API | Target audience verified in incoming token signatures. |
| **`AUTH_JWT_PUBLIC_KEY`** | Yes | `-----BEGIN PUBLIC KEY-----`| Security/Auth | API | RSA-256 public signature key or JWKS endpoints. |
| **`RLS_ENFORCEMENT_REQUIRED`**| Yes | `true` | Security/Auth | API, Workers | Startup guardrail blocking database queries without RLS contexts. |
| **`M05_HUBSPOT_WEBHOOK_SECRET`** | Yes (prod) | `replace-me` | Security/Auth | API | HMAC secret for HubSpot webhook signature (`x-hubspot-signature-v3`). Required in staging/production. Legacy alias `HUBSPOT_WEBHOOK_SECRET` supported locally only. |
| **`HUBSPOT_ACCESS_TOKEN`** | No | `pat-...` | Upstream API | API, Workers | HubSpot private app token for CRM sync (`sync.service`). |
| **`HUBSPOT_PORTAL_ID`** | No | `12345678` | Upstream API | API | HubSpot portal id for deep links. |
| **`SUPABASE_URL`** | Yes (boards runtime) | `https://xxx.supabase.co` | PostgreSQL | API | Supabase project URL for `crm_*` account board tables until full Prisma cutover. |
| **`SUPABASE_SERVICE_ROLE_KEY`** | Yes (boards runtime) | `eyJ...` | PostgreSQL | API | Service role key for server-side Supabase access. |

---

## 6. Local Development Environment Example

Create a local `.env` inside `modules/m05-account-intelligence/` using this template:

```bash
APP_ENV=local
NODE_ENV=development
SERVICE_NAME=m05-account-intelligence-service
PORT=8080

M05_ENABLED=true
M05_BOARDS_ENABLED=true
M05_DETAIL_ENABLED=true
M05_REFRESH_WORKER_ENABLED=true
M05_ALLOW_PARTIAL_HYDRATION=true
M05_DEFAULT_PAGE_SIZE=50
M05_MAX_PAGE_SIZE=200

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/revenue_intelligence
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_STATEMENT_TIMEOUT_MS=10000

REDIS_URL=redis://localhost:6379
REDIS_TLS_ENABLED=false
BULLMQ_PREFIX=ri
M05_REFRESH_QUEUE_NAME=m05-account-refresh
M05_REFRESH_CONCURRENCY=5
M05_REFRESH_MAX_RETRIES=3
M05_REFRESH_BACKOFF_MS=30000
M05_DEAD_LETTER_ENABLED=true

M10_CRM_API_BASE_URL=http://localhost:8081
M10_CRM_API_TOKEN=replace-me-with-trusted-m10-token

M03_SUMMARIES_API_BASE_URL=http://localhost:8082
M03_SUMMARIES_API_TOKEN=replace-me-with-trusted-m03-token
M05_ACCOUNT_BRIEF_PATH=/api/v1/m03-ai-summaries-genai/accounts/:id/brief

M05_BOARD_CACHE_ENABLED=true
M05_BOARD_CACHE_TTL_SEC=120
M05_DETAIL_CACHE_TTL_SEC=60
M05_STALE_AFTER_SEC=900
M05_BRIEF_STALE_AFTER_SEC=1800
M05_REFRESH_DEBOUNCE_SEC=120
M05_FORCE_ASYNC_REFRESH_ONLY=true

LOG_LEVEL=debug
LOG_FORMAT=json
SENTRY_DSN=
SENTRY_ENVIRONMENT=local
ALERT_WEBHOOK_URL=

AUTH_JWT_ISSUER=https://example.supabase.co/auth/v1
AUTH_JWT_AUDIENCE=authenticated
AUTH_JWT_PUBLIC_KEY=replace-me-with-rsa-key
RLS_ENFORCEMENT_REQUIRED=true

# HubSpot + webhooks (M05 runtime)
M05_HUBSPOT_WEBHOOK_SECRET=replace-me-local-dev
HUBSPOT_ACCESS_TOKEN=
HUBSPOT_PORTAL_ID=

# Supabase CRM store (account boards until unified Prisma)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```