# Environment Variables Registry: M9

## 1. Document Control

| Field | Value |
|---|---|
| Document Title | Environment Variables Registry - M9 Coaching Training |
| Product Module Name | M9 Coaching Training |
| Architecture Owner Module | M-10 Coaching and Training |
| Lifecycle Stage | Optimize |
| Version | v1.0 |
| Status | Draft |
| File Path | `docs/modules/m09/env-registry.md` |

## 2. Purpose

This document lists the environment variables required for **M9 Coaching Training**, which is the product-facing package for **Sales Coaching Insights** and **AI Trainer**.   
In the system architecture, these features belong to **M-10 Coaching and Training**, the terminal module in the **Optimize** stage. 

The purpose of this registry is simple:
- show what configuration M9 needs
- explain why each variable exists
- define safe defaults where possible
- reduce confusion for freshers and new engineers 

## 3. Scope

This registry covers environment variables needed by:
- M-10 Coaching and Training API handlers used by M9 features. 
- Coaching snapshot and recommendation processing. 
- AI Trainer session orchestration and persona simulation. 
- database, queue, observability, and security integration used by this module. 

This registry does **not** redefine shared platform variables already owned centrally unless M9 directly depends on them at runtime. 

## 4. Usage Rules

The architecture is very clear that all secrets must be managed through **Doppler**, and secrets must not be stored in source code, Docker images, or ad hoc environment files committed to the repository.   
This means the values below should be injected by environment and secret management, not hardcoded by developers. 

General rules:
- Use uppercase snake case for every variable.
- Keep one owner per variable.
- Prefix module-specific values with `M10_` because the architecture owner is M-10. 
- Mark secrets clearly.
- Never put production secrets in `.env.example`. 

## 5. Variable Table

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `NODE_ENV` | Yes | No | `development` | Standard runtime mode for NestJS application behavior.  |
| `SERVICE_NAME` | Yes | No | `m10-coaching-training` | Service identifier used in logs, metrics, and tracing labels.  |
| `API_PORT` | Yes | No | `3010` | Local or container port for the Coaching and Training API.  |
| `API_PREFIX` | Yes | No | `/api/v1/coaching` | Base route prefix for M-10 APIs exposed to frontend clients.  |
| `APP_ENV` | Yes | No | `local` | Environment label such as local, dev, staging, or prod for config branching.  |
| `LOG_LEVEL` | Yes | No | `info` | Controls structured logging verbosity for debugging and ops.  |

## 6. Database

M-10 owns its own schema and stores coaching snapshots, recommendations, trainer scenarios, sessions, and results in PostgreSQL.   
The platform also enforces tenant isolation through `tenantid`, RLS, and middleware-based tenant scoping. 

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `DATABASE_URL` | Yes | Yes | `<SECRET>` | Primary PostgreSQL connection string used by Prisma for M-10 reads and writes.  |
| `DIRECT_URL` | Yes | Yes | `<SECRET>` | Direct database connection, typically used for Prisma migrations or admin operations.  |
| `DB_POOL_MIN` | No | No | `2` | Minimum DB pool size for service stability in low traffic environments.  |
| `DB_POOL_MAX` | No | No | `20` | Maximum DB pool size to avoid exhausting connections under concurrent trainer traffic.  |
| `PRISMA_LOG_LEVEL` | No | No | `warn` | Controls Prisma query logging detail.  |
| `TENANT_ENFORCEMENT_ENABLED` | Yes | No | `true` | Ensures tenant scoping protections remain active in application logic.  |

## 7. Auth and RBAC

The platform uses **Supabase Auth**, JWT guards, RBAC, and tenant interceptors for protected APIs.   
For M9, this matters because coaching data is role-sensitive and trainer access must remain tenant-scoped. 

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `SUPABASE_URL` | Yes | Yes | `<SECRET>` | Supabase project URL used by auth integration.  |
| `SUPABASE_JWT_SECRET` | Yes | Yes | `<SECRET>` | Secret used to validate JWTs for protected API access.  |
| `AUTH_AUDIENCE` | No | No | `authenticated` | JWT audience validation setting.  |
| `AUTH_ISSUER` | No | No | `https://project.supabase.co/auth/v1` | JWT issuer validation setting for auth guard configuration.  |
| `RBAC_STRICT_MODE` | No | No | `true` | Enables fail-closed authorization behavior for protected M9 routes.  |
| `TEAM_SCOPE_CACHE_TTL_SEC` | No | No | `300` | Optional cache TTL for manager-to-team membership lookups in coaching views.  |

## 8. AI Services

The architecture states that all AI and ML inference belongs in Python AI services, while TypeScript product services orchestrate business logic.   
For M9, the main AI dependency is the internal AI Services Layer endpoint for **AI Trainer** turn simulation, plus optional recommendation enrichment workflows. 

The architecture also says internal AI endpoints require the `X-Internal-Secret` header and that AI service calls should use timeouts, retries, and fallback handling. 

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `AI_SERVICES_BASE_URL` | Yes | Yes | `http://ai-services:8000` | Base URL for internal Python AI services used by M-10.  |
| `AI_INTERNAL_SECRET` | Yes | Yes | `<SECRET>` | Shared secret sent as `X-Internal-Secret` when calling internal AI endpoints.  |
| `AI_SIMULATE_TURN_PATH` | Yes | No | `/internal/simulate-turn` | Path for the AI Trainer turn simulation endpoint.  |
| `AI_REQUEST_TIMEOUT_MS` | No | No | `30000` | Max timeout for synchronous user-facing AI calls, aligned with architecture guardrails.  |
| `AI_RETRY_ATTEMPTS` | No | No | `3` | Retry count for recoverable internal AI failures.  |
| `AI_RETRY_BACKOFF_MS` | No | No | `500` | Base delay for retry backoff when AI calls fail transiently.  |
| `AI_CONFIDENCE_THRESHOLD` | No | No | `0.70` | Confidence threshold used when low-confidence AI outputs should be flagged for review logic.  |
| `M10_TRAINER_MODEL_NAME` | No | No | `gpt-4o` | Logical model name expected by the AI Trainer simulation flow.  |
| `M10_TRAINER_MAX_TOKENS` | No | No | `400` | Persona response output cap to keep replies concise and predictable.  |
| `M10_TRAINER_TEMPERATURE` | No | No | `0.7` | Sampling temperature used by AI Trainer persona simulation.  |

## 9. Queue and Events

The architecture uses **BullMQ on Redis** as the internal event bus and queueing layer, and it explicitly requires idempotent event processing.   
M-10 consumes upstream events such as `forecast.submitted`, and coaching-related background work should follow the same queue-driven pattern. 

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `REDIS_URL` | Yes | Yes | `<SECRET>` | Redis connection used by BullMQ for event and job processing.  |
| `BULLMQ_PREFIX` | No | No | `rri` | Queue namespace prefix to avoid key collisions across services.  |
| `M10_QUEUE_NAME` | No | No | `m10-coaching` | Default queue name for M-10 async jobs.  |
| `M10_CONSUMER_CONCURRENCY` | No | No | `10` | Worker concurrency for event and background job processing.  |
| `M10_EVENT_IDEMPOTENCY_TTL_SEC` | No | No | `86400` | TTL for cached event-processing keys used to suppress duplicates.  |
| `M10_JOB_REMOVE_ON_COMPLETE` | No | No | `true` | Removes completed jobs automatically to reduce queue storage growth.  |
| `M10_JOB_REMOVE_ON_FAIL_COUNT` | No | No | `1000` | Retains limited failed jobs for debugging without unbounded growth.  |

## 10. Coaching Configuration

Sales Coaching Insights depends on snapshot metrics, benchmark comparisons, and recommendation generation.   
The architecture explicitly includes a low-sample safeguard and says recommendations should not be generated when `callCount < 5`. 

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `M10_COACHING_PERIOD_DEFAULT` | No | No | `last_30_days` | Default period for coaching calculations or UI fetch behavior.  |
| `M10_MIN_CALL_COUNT_FOR_RECOMMENDATIONS` | Yes | No | `5` | Low-sample guard before coaching recommendations are generated.  |
| `M10_BENCHMARK_CACHE_TTL_SEC` | No | No | `1800` | Cache TTL for benchmark reference data to reduce repeated reads.  |
| `M10_RECOMMENDATION_MAX_ITEMS` | No | No | `5` | Limits surfaced coaching recommendations to a focused set.  |
| `M10_TEAM_VIEW_PAGE_SIZE` | No | No | `25` | Default page size for manager team coaching screens.  |
| `M10_FORECAST_ACCURACY_ENABLED` | No | No | `true` | Enables forecast-accuracy-based signals when forecast data is available from M-09.  |

## 11. AI Trainer Configuration

AI Trainer lets reps practice customer conversations against AI personas using stateful sessions managed by M-10 and stateless turn simulation handled by the AI service.   
The architecture says conversation history is stored in M-10 and passed back on every turn request. 

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `M10_TRAINER_SESSION_MAX_TURNS` | No | No | `30` | Safety limit to prevent unbounded trainer sessions.  |
| `M10_TRAINER_SESSION_TTL_MIN` | No | No | `120` | Expiry window for inactive sessions before cleanup or abandonment logic.  |
| `M10_TRAINER_AUTOCOMPLETE_ON_RESULT` | No | No | `true` | Marks session completed automatically after final scoring is stored.  |
| `M10_TRAINER_ALLOW_SCENARIO_EDIT` | No | No | `false` | Controls whether scenarios can be edited after creation in stricter environments.  |
| `M10_TRAINER_DEFAULT_DIFFICULTY` | No | No | `intermediate` | Default scenario difficulty when not explicitly provided.  |
| `M10_TRAINER_HISTORY_WINDOW_MESSAGES` | No | No | `100` | Soft guard for number of conversation messages passed into turn simulation.  |
| `M10_TRAINER_SCORE_ON_COMPLETE_ONLY` | No | No | `true` | Ensures final scorecard evaluation runs on session completion rather than every turn.  |

## 12. Feature Flags

The architecture requires every module to have its own feature flag configuration.   
This is useful because M9 contains user-facing AI behavior and should support gradual rollout and safe testing. 

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `FF_M10_COACHING_ENABLED` | Yes | No | `true` | Master feature flag for Sales Coaching Insights availability.  |
| `FF_M10_AI_TRAINER_ENABLED` | Yes | No | `true` | Master feature flag for AI Trainer availability.  |
| `FF_M10_TEAM_COACHING_VIEW_ENABLED` | No | No | `true` | Enables manager team coaching screen and endpoint exposure.  |
| `FF_M10_FORECAST_ACCURACY_WIDGET_ENABLED` | No | No | `false` | Enables forecast-accuracy-related metrics if product rollout wants staged exposure.  |
| `FF_M10_TRAINER_SCENARIO_ADMIN_ENABLED` | No | No | `true` | Enables admin scenario-management APIs and UI.  |
| `FF_M10_TRAINER_RESULT_DOWNLOAD_ENABLED` | No | No | `false` | Optional rollout control for exporting or downloading trainer results.  |

## 13. Observability

The architecture explicitly lists **Sentry**, **Better Stack**, and **Grafana** as core observability tools, and requires structured logging and health checks.   
M9 especially needs good observability because coaching pipelines, trainer turns, RBAC checks, and AI dependencies can fail in different ways. 

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `SENTRY_DSN` | Yes | Yes | `<SECRET>` | Sends backend runtime errors and traces to Sentry.  |
| `SENTRY_ENVIRONMENT` | Yes | No | `staging` | Labels events by deployment environment.  |
| `SENTRY_RELEASE` | No | No | `m10@1.0.0` | Links errors to a deploy or release version.  |
| `BETTER_STACK_SOURCE_TOKEN` | No | Yes | `<SECRET>` | Auth token for shipping structured logs to Better Stack.  |
| `METRICS_ENABLED` | No | No | `true` | Enables metrics collection for dashboards and alerts.  |
| `METRICS_PORT` | No | No | `9100` | Port used to expose metrics endpoint.  |
| `HEALTHCHECK_PATH` | No | No | `/health` | Health endpoint path used by hosting and uptime checks.  |
| `TRACE_SAMPLING_RATE` | No | No | `0.1` | Sampling rate for distributed tracing or request-level telemetry.  |

## 14. Analytics and Performance Dependencies

The architecture uses **ClickHouse** for dashboard and coaching metric aggregations, with fallback to PostgreSQL when ClickHouse is unavailable.   
Even if not every M9 endpoint reads ClickHouse directly on day one, the module should keep analytics connectivity configurable. 

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `CLICKHOUSE_URL` | No | Yes | `<SECRET>` | Connection string for analytics queries related to performance or dashboard workloads.  |
| `CLICKHOUSE_USERNAME` | No | Yes | `<SECRET>` | ClickHouse auth username.  |
| `CLICKHOUSE_PASSWORD` | No | Yes | `<SECRET>` | ClickHouse auth password.  |
| `CLICKHOUSE_DATABASE` | No | No | `analytics` | Logical database name for metric queries.  |
| `M10_CLICKHOUSE_FALLBACK_TO_POSTGRES` | No | No | `true` | Enables architecture-defined fallback behavior when analytics store is unavailable.  |

## 15. Security and Rate Controls

The architecture treats secrets management, tenant isolation, and protected internal endpoints as non-negotiable.   
For M9, security is especially important because coaching data can be sensitive and AI services are reachable only through internal authenticated paths. 

| Variable | Required | Secret | Example | Purpose |
|---|---|---:|---|---|
| `INTERNAL_REQUEST_TIMEOUT_MS` | No | No | `30000` | Shared timeout for internal service-to-service calls.  |
| `INTERNAL_RATE_LIMIT_ENABLED` | No | No | `true` | Enables defensive throttling for internal or admin-heavy endpoints.  |
| `INTERNAL_RATE_LIMIT_RPM` | No | No | `300` | Requests-per-minute limit for protected internal flows where applicable.  |
| `AUDIT_LOGGING_ENABLED` | Yes | No | `true` | Ensures sensitive writes like scenario creation are audit logged.  |
| `PII_REDACTION_IN_LOGS` | No | No | `true` | Redacts sensitive user or conversation fields from logs where configured.  |

## 16. Local Development Defaults

For local development, keep setup simple:
- use local PostgreSQL and Redis containers
- point to non-production Supabase auth only if needed
- use a local or shared dev AI services URL
- enable feature flags explicitly
- use dummy secrets only in private local development files, never in committed files 

Example local `.env.local` values:

```env
NODE_ENV=development
SERVICE_NAME=m10-coaching-training
API_PORT=3010
API_PREFIX=/api/v1/coaching
APP_ENV=local
LOG_LEVEL=debug

DATABASE_URL=<SECRET>
DIRECT_URL=<SECRET>
TENANT_ENFORCEMENT_ENABLED=true

SUPABASE_URL=<SECRET>
SUPABASE_JWT_SECRET=<SECRET>
RBAC_STRICT_MODE=true

REDIS_URL=<SECRET>
BULLMQ_PREFIX=rri
M10_QUEUE_NAME=m10-coaching

AI_SERVICES_BASE_URL=http://localhost:8000
AI_INTERNAL_SECRET=<SECRET>
AI_SIMULATE_TURN_PATH=/internal/simulate-turn
AI_REQUEST_TIMEOUT_MS=30000
AI_RETRY_ATTEMPTS=3
AI_RETRY_BACKOFF_MS=500
AI_CONFIDENCE_THRESHOLD=0.70

M10_MIN_CALL_COUNT_FOR_RECOMMENDATIONS=5
M10_TRAINER_SESSION_MAX_TURNS=30
M10_TRAINER_SCORE_ON_COMPLETE_ONLY=true

FF_M10_COACHING_ENABLED=true
FF_M10_AI_TRAINER_ENABLED=true

SENTRY_DSN=<SECRET>
SENTRY_ENVIRONMENT=local
HEALTHCHECK_PATH=/health
```

## 17. Variable Ownership

| Area | Owner |
|---|---|
| Database connectivity | Backend Lead / DevOps Lead  |
| Auth and RBAC config | Backend Lead / Security Owner  |
| AI service endpoints and secrets | AI Lead / Tech Lead  |
| Queue and worker settings | Backend Lead  |
| Feature flags | Product Manager / Tech Lead  |
| Observability config | DevOps Lead  |
| Security controls | Security Owner / Tech Lead  |

## 18. Freshers Notes

If you are new, remember these simple points:

- `DATABASE_URL` connects M9 backend logic to PostgreSQL storage. 
- `REDIS_URL` is needed because BullMQ uses Redis for jobs and events. 
- `AI_SERVICES_BASE_URL` and `AI_INTERNAL_SECRET` are how M9 talks safely to Python AI services. 
- `M10_MIN_CALL_COUNT_FOR_RECOMMENDATIONS=5` is important because the architecture says coaching recommendations should not be generated from too little data. 
- `FF_M10_COACHING_ENABLED` and `FF_M10_AI_TRAINER_ENABLED` are the easiest way to turn features on or off safely. 
- Never hardcode secrets; use Doppler or approved secret injection. 