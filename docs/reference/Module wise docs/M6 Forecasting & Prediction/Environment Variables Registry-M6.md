# Doc #18 — Environment Variables Registry: M6 Forecasting & Prediction

## 1. Document Control

- **Document Name:** Environment Variables Registry — M6 Forecasting & Prediction
- **Platform:** R-Revenue Intelligence
- **Module Name:** M6 Forecasting & Prediction
- **Workspace Directory:** `modules/m06-forecasting-prediction/`
- **Owner:** Product Engineering — M6
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Purpose

This document defines the environment variables required to run the **M6 Forecasting & Prediction** module safely across local, staging, and production environments. 

It provides an explicit reference for backend, DevOps, and QA teams regarding runtime configurations that control Forecast Boards, manual submission versioning, AI Revenue predictor models, Redis-backed BullMQ recalculations, tenant isolations, and upstream API boundaries.

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
These variables manage connection pools, timeouts, and transaction configurations for the `m06_forecasting_prediction` database schema.

### Group C — Redis & Queue Configuration
These variables control BullMQ-backed background workers processing debounced and rate-limited forecast recalculation tasks.

### Group D — Upstream Context API Scopes
These variables define secure connection endpoints for upstream services: **M10 Data & Compliance** (Revenue Graph CRM details and transaction states).

### Group E — Model & Recalculation Optimization
These variables tune prediction freshness thresholds, recalculation rate limits (60-minute maximums), sample sizes, and accuracy ranges.

### Group F — Observability, Logs, & Alerts
These variables configure structured logging verbosities, Sentry exception targets, and webhook notifications on service outages.

---

## 5. Variable Registry Table

| Variable | Required | Example | Group | Used By | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`APP_ENV`** | Yes | `production` | App Basics | API, Workers | Active environment name (`local`, `staging`, `production`). |
| **`NODE_ENV`** | Yes | `production` | App Basics | API, Workers | Standard Node runtime execution environment mode. |
| **`SERVICE_NAME`** | Yes | `m06-forecasting-prediction-service` | App Basics | API, Workers | Service identifier utilized in logs, traces, and metrics. |
| **`PORT`** | Yes | `8080` | App Basics | API | Listening HTTP port for the modular service instance. |
| **`M06_ENABLED`** | Yes | `true` | App Basics | API, Workers | Master enablement flag for the M6 module. |
| **`M06_BOARDS_ENABLED`** | Yes | `true` | App Basics | API | Enablement switch for Forecast and Quota Boards grid endpoints. |
| **`M06_PREDICTOR_ENABLED`** | Yes | `true` | App Basics | API, Workers | Enablement switch for AI Revenue Predictor computation endpoints. |
| **`M06_SUBMISSIONS_ENABLED`** | Yes | `true` | App Basics | API | Enables reps and managers forecast manual submission endpoints. |
| **`M06_RECALC_WORKER_ENABLED`** | Yes | `true` | App Basics | Workers | Enables the BullMQ background recalculation worker for pipeline coverage. |
| **`DATABASE_URL`** | Yes | `postgresql://...` | PostgreSQL | API, Workers | PostgreSQL connection string pointing to the tenant database. |
| **`DB_POOL_MIN`** | No | `5` | PostgreSQL | API, Workers | Minimum active DB connection pool capacity. |
| **`DB_POOL_MAX`** | No | `20` | PostgreSQL | API, Workers | Maximum active DB connection pool capacity to prevent connection starvation. |
| **`DB_STATEMENT_TIMEOUT_MS`** | No | `10000` | PostgreSQL | API, Workers | Hard statement execution timeout for relational queries. |
| **`REDIS_URL`** | Yes | `redis://...` | Redis | API, Workers | Redis connection string used for caching and BullMQ state storage. |
| **`REDIS_TLS_ENABLED`** | No | `true` | Redis | API, Workers | Enables secure TLS encryption for managed Redis instances. |
| **`BULLMQ_PREFIX`** | Yes | `ri` | Redis | Workers | Shared namespace prefix to keep queues isolated on Redis. |
| **`M06_RECALC_QUEUE_NAME`** | Yes | `m06-forecast-recalc` | Redis | Workers | Queue name for async recalculation and coverage jobs. |
| **`M06_RECALC_CONCURRENCY`** | No | `10` | Redis | Workers | Concurrency level for background recalculation execution threads. |
| **`M06_RECALC_MAX_RETRIES`** | No | `3` | Redis | Workers | Max retry attempts for transient worker failures. |
| **`M06_RECALC_BACKOFF_MS`** | No | `30000` | Redis | Workers | Exponential backoff delay base for failing jobs. |
| **`M06_RECALC_DELAY_MS`** | No | `5000` | Redis | Workers | Short batching delay (5000ms) used for burst event absorption. |
| **`M10_CRM_API_BASE_URL`** | Yes | `http://m10-compliance-internal` | Upstream API | API, Workers | Base URL of M10 Data & Compliance REST API for CRM entity reads. |
| **`M10_CRM_API_TOKEN`** | Yes | `secret` | Upstream API | API, Workers | Secure token authorizing M6 service requests to M10. |
| **`M06_BOARD_CACHE_ENABLED`** | No | `true` | Cache/Refresh | API | Enables read-side cache for board responses. |
| **`M06_BOARD_CACHE_TTL_SEC`** | No | `120` | Cache/Refresh | API | TTL for cached board responses. |
| **`M06_RECALC_LIMIT_MINUTES`** | Yes | `60` | Cache/Refresh | Workers | **Rate Limit Guard:** Maximum of one forecast recalculation per tenant/period per 60 mins. |
| **`M06_PREDICTION_MAX_STALENESS_MIN`**| No | `120` | Cache/Refresh | API | Staleness boundary after which warnings are flagged in the board metadata. |
| **`M06_PREDICTION_MIN_SAMPLE_SIZE`**| No | `50` | Model/Tuning | Workers | Minimum historical deals required to evaluate conversion rates. |
| **`M06_SUBMISSION_VERSION_STRICT`** | Yes | `true` | Model/Tuning | API | Enforces immutable append-only version increments for submissions. |
| **`M06_LOCK_ENFORCEMENT_STRICT`** | Yes | `true` | Model/Tuning | API | Enforces server-side rejection for submissions against locked periods. |
| **`LOG_LEVEL`** | Yes | `info` | Observability | API, Workers | Standard structured logging granularity switch (`info`, `debug`). |
| **`LOG_FORMAT`** | No | `json` | Observability | API, Workers | Output layout for downstream ingestion systems. |
| **`SENTRY_DSN`** | No | `https://...` | Observability | API, Workers | Destination URL for Sentry logging and exception monitoring. |
| **`SENTRY_ENVIRONMENT`** | No | `production` | Observability | API, Workers | Environment label tagged to all Sentry events. |
| **`ALERT_WEBHOOK_URL`** | No | `https://hooks...`| Observability | Workers | Channel webhook for critical queue spikes and database failures. |
| **`AUTH_JWT_ISSUER`** | Yes | `https://supabase...`| Security/Auth | API | Expected JWT token issuer validating authentications. |
| **`AUTH_JWT_AUDIENCE`** | Yes | `authenticated` | Security/Auth | API | Target audience verified in incoming token signatures. |
| **`AUTH_JWT_PUBLIC_KEY`** | Yes | `-----BEGIN PUBLIC KEY-----`| Security/Auth | API | RSA-256 public signature key or JWKS endpoints. |
| **`RLS_ENFORCEMENT_REQUIRED`**| Yes | `true` | Security/Auth | API, Workers | Startup guardrail blocking database queries without RLS contexts. |

---

## 6. Local Development Environment Example

Create a local `.env` inside `modules/m06-forecasting-prediction/` using this template:

```bash
APP_ENV=local
NODE_ENV=development
SERVICE_NAME=m06-forecasting-prediction-service
PORT=8080

M06_ENABLED=true
M06_BOARDS_ENABLED=true
M06_PREDICTOR_ENABLED=true
M06_SUBMISSIONS_ENABLED=true
M06_RECALC_WORKER_ENABLED=true

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/revenue_intelligence
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_STATEMENT_TIMEOUT_MS=10000

REDIS_URL=redis://localhost:6379
REDIS_TLS_ENABLED=false
BULLMQ_PREFIX=ri
M06_RECALC_QUEUE_NAME=m06-forecast-recalc
M06_RECALC_CONCURRENCY=5
M06_RECALC_MAX_RETRIES=3
M06_RECALC_BACKOFF_MS=30000
M06_RECALC_DELAY_MS=5000

M10_CRM_API_BASE_URL=http://localhost:8081
M10_CRM_API_TOKEN=replace-me-with-trusted-m10-token

M06_BOARD_CACHE_ENABLED=true
M06_BOARD_CACHE_TTL_SEC=120
M06_RECALC_LIMIT_MINUTES=60
M06_PREDICTION_MAX_STALENESS_MIN=120
M06_PREDICTION_MIN_SAMPLE_SIZE=50
M06_SUBMISSION_VERSION_STRICT=true
M06_LOCK_ENFORCEMENT_STRICT=true

LOG_LEVEL=debug
LOG_FORMAT=json
SENTRY_DSN=
SENTRY_ENVIRONMENT=local
ALERT_WEBHOOK_URL=

AUTH_JWT_ISSUER=https://example.supabase.co/auth/v1
AUTH_JWT_AUDIENCE=authenticated
AUTH_JWT_PUBLIC_KEY=replace-me-with-rsa-key
RLS_ENFORCEMENT_REQUIRED=true
```
