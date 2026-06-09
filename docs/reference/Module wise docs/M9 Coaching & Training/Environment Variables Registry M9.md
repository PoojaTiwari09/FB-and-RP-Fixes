# Environment Variables Registry: M9 Coaching & Training

## 1. Document Control

| Field | Value |
|---|---|
| **Document Title** | Environment Variables Registry - M9 Coaching & Training |
| **Product Module Name** | M9 Coaching & Training |
| **Workspace Directory** | `modules/m09-coaching-training/` |
| **Lifecycle Stage** | Optimize |
| **Version** | v3.0 |
| **Status** | Approved |
| **Last Updated** | 2026-05-18 |
| **File Path** | `modules/m09-coaching-training/env-registry.md` |

---

## 2. Purpose

This document lists the environment variables required for **M9 Coaching & Training**, which is the unified codebase workspace for **Sales Coaching Insights** and **AI Trainer**. 

The purpose of this registry is to:
- Show what configuration M9 needs.
- Explain why each variable exists.
- Define safe defaults where possible.
- Avoid runtime failures by standardizing naming prefixes.

---

## 3. Usage Rules

The platform architecture mandates that all secrets must be managed through **Doppler**, and secrets must never be stored in source code, Docker images, or ad hoc environment files committed to the repository.

General rules:
- Use **UPPERCASE_SNAKE_CASE** for every variable.
- Keep one owner per variable.
- Prefix module-specific values with **`M09_`**.
- Mark secrets clearly.
- Never put production secrets in `.env.example`.

---

## 4. General Core Variables

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `NODE_ENV` | Yes | No | `development` | Standard runtime mode for NestJS application behavior. |
| `SERVICE_NAME` | Yes | No | `m09-coaching-training` | Service identifier used in logs, metrics, and tracing labels. |
| `API_PORT` | Yes | No | `3009` | Local or container port for the Coaching and Training API. |
| `API_PREFIX` | Yes | No | `/api/v1/m09-coaching-training` | Base route prefix for M9 APIs exposed to frontend clients. |
| `APP_ENV` | Yes | No | `local` | Environment label such as local, dev, staging, or prod for config branching. |
| `LOG_LEVEL` | Yes | No | `info` | Controls structured logging verbosity for debugging and ops. |

---

## 5. Database Variables

M9 owns its own PostgreSQL schema and stores coaching snapshots, benchmarks, recommendations, trainer scenarios, sessions, and results under the **`m09_coaching_training`** schema namespace.

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `DATABASE_URL` | Yes | Yes | `postgresql://user:pass@host:port/db?schema=m09_coaching_training` | PostgreSQL connection string used by Prisma for M9 reads and writes. |
| `DIRECT_URL` | Yes | Yes | `postgresql://user:pass@host:port/db?schema=m09_coaching_training` | Direct database connection, typically used for Prisma migrations. |
| `DB_POOL_MIN` | No | No | `2` | Minimum DB pool size. |
| `DB_POOL_MAX` | No | No | `20` | Maximum DB pool size to avoid exhausting connections. |
| `PRISMA_LOG_LEVEL` | No | No | `warn` | Controls Prisma query logging detail. |
| `TENANT_ENFORCEMENT_ENABLED` | Yes | No | `true` | Ensures tenant scoping protections remain active in application logic. |

---

## 6. Auth and RBAC

The platform uses **Supabase Auth**, JWT guards, RBAC, and tenant query interceptors for protected APIs.

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `SUPABASE_URL` | Yes | Yes | `<SECRET>` | Supabase project URL used by auth integration. |
| `SUPABASE_JWT_SECRET` | Yes | Yes | `<SECRET>` | Secret used to validate JWTs for protected API access. |
| `AUTH_AUDIENCE` | No | No | `authenticated` | JWT audience validation setting. |
| `AUTH_ISSUER` | No | No | `https://project.supabase.co/auth/v1` | JWT issuer validation setting for auth guard configuration. |
| `RBAC_STRICT_MODE` | No | No | `true` | Enables fail-closed authorization behavior for protected M9 routes. |
| `TEAM_SCOPE_CACHE_TTL_SEC` | No | No | `300` | Optional cache TTL for manager-to-team membership lookups. |

---

## 7. AI Services Layer

The architecture states that all AI and ML inference belongs in Python AI services, while TypeScript product services orchestrate business logic. M9 calls the private Python AI services for **AI Trainer** turn simulation and scorecard-based evaluations.

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `AI_SERVICES_BASE_URL` | Yes | Yes | `http://ai-services:8000` | Base URL for internal Python AI services. |
| `AI_INTERNAL_SECRET` | Yes | Yes | `<SECRET>` | Shared secret sent as `X-Internal-Secret` when calling internal AI endpoints. |
| `AI_SIMULATE_TURN_PATH` | Yes | No | `/internal/simulate-turn` | Path for the AI Trainer turn simulation endpoint. |
| `AI_REQUEST_TIMEOUT_MS` | No | No | `30000` | Max timeout for synchronous user-facing AI calls. |
| `AI_RETRY_ATTEMPTS` | No | No | `3` | Retry count for recoverable internal AI failures. |
| `AI_RETRY_BACKOFF_MS` | No | No | `500` | Base delay for retry backoff when AI calls fail transiently. |
| `AI_CONFIDENCE_THRESHOLD` | No | No | `0.70` | Confidence threshold used for AI-based recommendations. |
| `M09_TRAINER_MODEL_NAME` | No | No | `gpt-4o` | Logical model name expected by the AI Trainer simulation flow. |
| `M09_TRAINER_MAX_TOKENS` | No | No | `400` | Persona response output cap to keep replies concise. |
| `M09_TRAINER_TEMPERATURE` | No | No | `0.7` | Sampling temperature used by AI Trainer persona simulation. |

---

## 8. Queue and Events (BullMQ)

The architecture uses **BullMQ on Redis** as the internal event bus. M9 consumes upstream events such as `call.scored` (M2) and `forecast.submitted` (M6).

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `REDIS_URL` | Yes | Yes | `<SECRET>` | Redis connection string used by BullMQ. |
| `BULLMQ_PREFIX` | No | No | `rri` | Queue namespace prefix to avoid key collisions. |
| `M09_QUEUE_NAME` | No | No | `m09-coaching-training-queue` | Default queue name for M9 async jobs. |
| `M09_CONSUMER_CONCURRENCY` | No | No | `10` | Worker concurrency for event and background job processing. |
| `M09_EVENT_IDEMPOTENCY_TTL_SEC` | No | No | `86400` | TTL for cached event-processing keys used to suppress duplicates. |
| `M09_JOB_REMOVE_ON_COMPLETE` | No | No | `true` | Removes completed jobs automatically to reduce queue storage growth. |
| `M09_JOB_REMOVE_ON_FAIL_COUNT` | No | No | `1000` | Retains limited failed jobs for debugging. |

---

## 9. Sales Coaching Insights Config

Sales Coaching Insights depends on snapshot metrics, benchmark comparisons, and recommendation generation. The architecture explicitly includes a low-sample safeguard: recommendations must not be generated when `callCount < 5`.

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `M09_COACHING_PERIOD_DEFAULT` | No | No | `last_30_days` | Default period for coaching calculations. |
| `M09_MIN_CALL_COUNT_FOR_RECOMMENDATIONS` | Yes | No | `5` | Low-sample guard before coaching recommendations are generated. |
| `M09_BENCHMARK_CACHE_TTL_SEC` | No | No | `1800` | Cache TTL for benchmark reference data. |
| `M09_RECOMMENDATION_MAX_ITEMS` | No | No | `5` | Limits surfaced coaching recommendations to a focused set. |
| `M09_TEAM_VIEW_PAGE_SIZE` | No | No | `25` | Default page size for manager team coaching screens. |
| `M09_FORECAST_ACCURACY_ENABLED` | No | No | `true` | Enables forecast-accuracy-based signals derived from M6. |

---

## 10. AI Trainer Config

AI Trainer lets reps practice customer conversations against AI personas using stateful sessions managed by M9 and stateless turn simulation handled by the AI service.

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `M09_TRAINER_SESSION_MAX_TURNS` | No | No | `30` | Safety limit to prevent unbounded trainer sessions. |
| `M09_TRAINER_SESSION_TTL_MIN` | No | No | `120` | Expiry window for inactive sessions before cleanup or abandonment. |
| `M09_TRAINER_AUTOCOMPLETE_ON_RESULT` | No | No | `true` | Marks session completed automatically after final scoring is stored. |
| `M09_TRAINER_ALLOW_SCENARIO_EDIT` | No | No | `false` | Controls whether scenarios can be edited after creation. |
| `M09_TRAINER_DEFAULT_DIFFICULTY` | No | No | `intermediate` | Default scenario difficulty when not explicitly provided. |
| `M09_TRAINER_HISTORY_WINDOW_MESSAGES` | No | No | `100` | Soft guard for number of conversation messages passed into turn simulation. |
| `M09_TRAINER_SCORE_ON_COMPLETE_ONLY` | No | No | `true` | Ensures final scorecard evaluation runs on session completion rather than every turn. |

---

## 11. Global Enablement & Feature Flags

The platform requires standard `M0X_ENABLED` prefixes for central service enablement.

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `M09_ENABLED` | Yes | No | `true` | Master flag to register and enable M9 Coaching & Training package in the platform. |
| `FF_M09_COACHING_INSIGHTS_ENABLED` | Yes | No | `true` | Enables Sales Coaching Insights endpoints and background calculators. |
| `FF_M09_AI_TRAINER_ENABLED` | Yes | No | `true` | Enables AI Trainer endpoints and session handlers. |
| `FF_M09_TEAM_COACHING_VIEW_ENABLED` | No | No | `true` | Enables manager team coaching screen and endpoint exposure. |
| `FF_M09_FORECAST_ACCURACY_WIDGET_ENABLED` | No | No | `false` | Staged rollout flag for forecasting widgets. |
| `FF_M09_TRAINER_SCENARIO_ADMIN_ENABLED` | No | No | `true` | Enables admin scenario-management APIs and UI. |
| `FF_M09_TRAINER_RESULT_DOWNLOAD_ENABLED` | No | No | `false` | Staged rollout control for exporting trainer results. |

---

## 12. Observability & Security

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `SENTRY_DSN` | Yes | Yes | `<SECRET>` | Sends backend runtime errors and traces to Sentry. |
| `SENTRY_ENVIRONMENT` | Yes | No | `staging` | Labels events by deployment environment. |
| `SENTRY_RELEASE` | No | No | `m09@3.0.0` | Links errors to a deploy or release version. |
| `BETTER_STACK_SOURCE_TOKEN` | No | Yes | `<SECRET>` | Auth token for shipping structured logs to Better Stack. |
| `HEALTHCHECK_PATH` | No | No | `/health` | Health endpoint path used by hosting and uptime checks. |
| `TRACE_SAMPLING_RATE` | No | No | `0.1` | Sampling rate for request-level telemetry. |
| `AUDIT_LOGGING_ENABLED` | Yes | No | `true` | Ensures sensitive actions (e.g. creating scenarios) are audit logged. |
| `PII_REDACTION_IN_LOGS` | No | No | `true` | Redacts sensitive conversation content before sending logs. |

---

## 13. Local Development Example (`.env.local`)

```env
NODE_ENV=development
SERVICE_NAME=m09-coaching-training
API_PORT=3009
API_PREFIX=/api/v1/m09-coaching-training
APP_ENV=local
LOG_LEVEL=debug

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rri?schema=m09_coaching_training
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/rri?schema=m09_coaching_training
TENANT_ENFORCEMENT_ENABLED=true

SUPABASE_URL=http://localhost:54321
SUPABASE_JWT_SECRET=super-secret-jwt-key
RBAC_STRICT_MODE=true

REDIS_URL=redis://localhost:6379/0
BULLMQ_PREFIX=rri
M09_QUEUE_NAME=m09-coaching-training-queue

AI_SERVICES_BASE_URL=http://localhost:8000
AI_INTERNAL_SECRET=ai-private-shared-token
AI_SIMULATE_TURN_PATH=/internal/simulate-turn
AI_REQUEST_TIMEOUT_MS=30000

M09_MIN_CALL_COUNT_FOR_RECOMMENDATIONS=5
M09_TRAINER_SESSION_MAX_TURNS=30
M09_TRAINER_SCORE_ON_COMPLETE_ONLY=true

M09_ENABLED=true
FF_M09_COACHING_INSIGHTS_ENABLED=true
FF_M09_AI_TRAINER_ENABLED=true

SENTRY_DSN=http://sentry-mock-dsn
SENTRY_ENVIRONMENT=local
HEALTHCHECK_PATH=/health
```