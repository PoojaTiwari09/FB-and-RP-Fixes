# Doc #18 — Environment Variables Registry: M6 Forecasting Prediction

## 1. Document Control

- **Document Title:** Environment Variables Registry — M6 Forecasting Prediction
- **Module Name:** M6 Forecasting Prediction
- **Architecture Module:** M-09 Forecasting and Prediction
- **Version:** 1.0
- **Status:** Draft
- **Owner:** Revenue Intelligence Engineering
- **Reviewers:** Tech Lead, Backend Lead, DevOps Lead, QA Lead
- **Last Updated:** 2026-04-30

### Naming Note
This document uses **M6 Forecasting Prediction** as the product naming layer and **M-09 Forecasting and Prediction** as the architecture naming layer. Both refer to the same forecasting module. 

---

## 2. Purpose

This document defines the environment-variable contract for M6 Forecasting Prediction. It exists so developers, DevOps engineers, QA, and SRE teams know which variables are required to run APIs, workers, board reads, forecast submissions, coverage refresh, and AI snapshot refresh safely across local, staging, and production environments. 

Because the architecture defines M-09 as an internal-data-driven module with **no external dependency beyond platform infrastructure**, this registry is intentionally lighter on third-party credentials and heavier on database, Redis, queue, module flags, timing controls, and observability configuration. 

---

## 3. Usage Rules

- All M-09 runtime config must come from environment variables or approved secret/config providers, not hardcoded values. 
- Secrets must never be committed to source control or embedded in code, tests, seed files, or frontend bundles. 
- Every environment must provide tenant-safe configuration because M-09 enforces tenant isolation, RBAC, and row-level security rules through Platform Core patterns. 
- Changes to debounce, refresh, or locking-related config must be reviewed carefully because they affect forecast freshness, worker load, and board behavior. 
- Module flags should support safe disablement of Forecast Boards, submission paths, and recalculation workers independently when needed. 

---

## 4. Runtime Groups

The M6 env registry is organized into these runtime groups:

- App basics and module flags. 
- PostgreSQL and Redis. 
- Recalc worker and debounce settings. 
- Forecast period and board configuration flags. 
- Prediction tuning flags and snapshot refresh controls. 
- Observability, logs, and alerts. 

This grouping matches the architecture shape of M-09, where most operational behavior depends on internal state, event-driven recalculation, and queue timing rather than on external SaaS credentials. 

---

## 5. Variable Registry Table

| Variable | Required | Secret | Default | Example | Used By | Description | Related Flow |
|---|---|---:|---|---|---|---|---|
| `NODE_ENV` | Yes | No | `development` | `production` | API, Worker | Standard runtime mode for environment-specific behavior.  | All |
| `APP_PORT` | Yes | No | `3000` | `3019` | API | Port for the M-09-serving backend process.  | All |
| `APP_BASE_URL` | Yes | No | None | `https://ri-api.company.com` | API | Canonical base URL used for service metadata, callbacks, and environment awareness.  | All |
| `MODULE_FORECASTING_ENABLED` | Yes | No | `false` | `true` | API, Worker | Master feature flag for M-09 Forecasting module enablement. Each module is expected to have its own feature-flag configuration.  | All |
| `FEATURE_AI_REVENUE_PREDICTOR_ENABLED` | Yes | No | `false` | `true` | API, Worker | Enables AI Revenue Predictor endpoints and snapshot refresh behavior.  | Prediction |
| `FEATURE_FORECAST_BOARDS_ENABLED` | Yes | No | `false` | `true` | API | Enables Forecast Boards endpoints and board assembly logic.  | Board reads |
| `FEATURE_FORECAST_SUBMISSION_ENABLED` | Yes | No | `false` | `true` | API | Enables forecast submission endpoint and submission workflow.  | Submission |
| `FEATURE_FORECAST_RECALC_WORKER_ENABLED` | Yes | No | `false` | `true` | Worker | Enables background recalculation from `deal.stage.changed`.  | Recalculation |
| `DATABASE_URL` | Yes | Yes | None | `postgresql://user:pass@host:5432/rri` | API, Worker | PostgreSQL connection string for M-09 tables such as `forecast_periods`, `forecast_submissions`, `ai_forecast_snapshots`, and `pipeline_coverage_metrics`.  | All |
| `DATABASE_POOL_MIN` | No | No | `2` | `5` | API, Worker | Minimum DB connection pool size.  | All |
| `DATABASE_POOL_MAX` | No | No | `20` | `30` | API, Worker | Maximum DB connection pool size sized for board reads and worker concurrency.  | All |
| `REDIS_URL` | Yes | Yes | None | `redis://user:pass@host:6379` | Worker, API | Redis connection string for BullMQ/event-driven processing. Redis is critical path for queue-backed module behavior.  | Recalculation |
| `REDIS_TLS_ENABLED` | No | No | `true` | `true` | API, Worker | Enables TLS for managed Redis connections.  | Recalculation |
| `QUEUE_PREFIX` | Yes | No | `ri` | `ri-prod` | API, Worker | Namespace prefix for queue isolation across environments.  | Recalculation |
| `FORECAST_RECALC_QUEUE_NAME` | No | No | `recalc-coverage` | `forecast-recalc` | API, Worker | Queue name for forecast recalculation jobs. The architecture shows recalc jobs added to a dedicated queue.  | Recalculation |
| `FORECAST_RECALC_DELAY_MS` | No | No | `5000` | `5000` | API | Short batching delay used before worker execution. The architecture explicitly shows a 5-second delay for burst absorption.  | Recalculation |
| `FORECAST_RECALC_WINDOW_MINUTES` | No | No | `60` | `60` | API, Worker | Debounce window used to ensure recalculation occurs at most once per tenant and period per hour slot.  | Recalculation |
| `FORECAST_RECALC_MAX_RETRIES` | No | No | `3` | `5` | Worker | Retry count for failed recalculation jobs. Platform queue patterns rely on retry-safe, idempotent processing.  | Recalculation |
| `FORECAST_RECALC_BACKOFF_MS` | No | No | `30000` | `60000` | Worker | Base backoff for failed recalculation jobs.  | Recalculation |
| `FORECAST_RECALC_CONCURRENCY` | No | No | `5` | `10` | Worker | Worker concurrency for processing recalculation jobs.  | Recalculation |
| `FORECAST_OPEN_PERIODS_ONLY_RECALC` | No | No | `true` | `true` | Worker | Restricts automatic recalculation to open periods, which matches the architecture’s open-period refresh rule.  | Recalculation |
| `FORECAST_DEFAULT_PERIOD_LOCK_ON_END` | No | No | `false` | `true` | API | Optional policy flag to auto-lock periods once end-date rules are met, if implemented by product logic. The architecture currently uses `islocked` as the source-of-truth state.  | Period lifecycle |
| `FORECAST_ALLOW_HISTORICAL_BOARD_READS` | No | No | `true` | `true` | API | Allows locked/historical boards to remain readable. This matches the board read expectations in the TDD-aligned design.  | Board reads |
| `FORECAST_MAX_PERIODS_PER_TENANT` | No | No | `100` | `250` | API | Safety guard to prevent runaway period creation in one tenant.  | Period creation |
| `FORECAST_BOARD_INCLUDE_TEAM_SUBMISSIONS` | No | No | `true` | `true` | API | Enables team-level submission view composition for manager-style board responses where applicable.  | Board reads |
| `FORECAST_BOARD_STALE_THRESHOLD_MINUTES` | No | No | `90` | `120` | API | Threshold after which coverage or prediction sections should be marked stale in the board UI/API metadata.  | Board reads |
| `FORECAST_BOARD_EMPTY_STATE_ENABLED` | No | No | `true` | `true` | API | Enables section-level empty-state responses when prediction or coverage data is missing.  | Board reads |
| `FORECAST_SUBMISSION_MAX_AMOUNT` | No | No | None | `1000000000` | API | Optional validation cap for submitted forecast amount.  | Submission |
| `FORECAST_SUBMISSION_MIN_AMOUNT` | No | No | `0` | `0` | API | Optional validation floor for submitted forecast amount.  | Submission |
| `FORECAST_SUBMISSION_VERSIONING_ENABLED` | Yes | No | `true` | `true` | API | Confirms append-only re-submission behavior with version bump instead of overwrite. This is core architecture behavior.  | Submission |
| `FORECAST_LOCK_ENFORCEMENT_STRICT` | Yes | No | `true` | `true` | API | Enforces server-side rejection for submissions against locked periods. The architecture explicitly defines this guard.  | Submission |
| `FORECAST_PREDICTION_REFRESH_ENABLED` | Yes | No | `true` | `true` | Worker, API | Enables creation of refreshed AI forecast snapshots.  | Prediction |
| `FORECAST_PREDICTION_REFRESH_ON_STAGE_CHANGE` | No | No | `true` | `true` | Worker | Enables prediction refresh in response to `deal.stage.changed`.  | Prediction |
| `FORECAST_PREDICTION_MAX_STALENESS_MINUTES` | No | No | `120` | `180` | API | Freshness threshold used to warn when the latest prediction snapshot is old.  | Prediction |
| `FORECAST_PREDICTION_REQUIRE_CONVERSION_RATES` | No | No | `true` | `true` | Worker | Prevents prediction writes when no historical conversion baseline is available, unless a fallback path is intentionally designed.  | Prediction |
| `FORECAST_PREDICTION_MIN_SAMPLE_SIZE` | No | No | `20` | `50` | Worker | Minimum sample size threshold for accepting historical conversion-rate inputs into forecast computation.  | Prediction |
| `FORECAST_CONFIDENCE_RANGE_ENABLED` | No | No | `true` | `true` | API, Worker | Enables confidence-range generation and return in `aiforecastsnapshots`.  | Prediction |
| `FORECAST_COVERAGE_REFRESH_ENABLED` | Yes | No | `true` | `true` | Worker, API | Enables refresh and serving of `pipelinecoveragemetrics`.  | Coverage |
| `FORECAST_COVERAGE_MIN_REFRESH_INTERVAL_MINUTES` | No | No | `60` | `60` | Worker | Minimum refresh interval aligned with the debounce window.  | Coverage |
| `FORECAST_COVERAGE_REQUIRE_TARGET` | No | No | `true` | `true` | API, Worker | Prevents coverage-ratio computation without period revenue target.  | Coverage |
| `FORECAST_COVERAGE_INCLUDE_OPEN_DEAL_COUNT` | No | No | `true` | `true` | API, Worker | Enables `opendealcount` inclusion in `pipelinecoveragemetrics`.  | Coverage |
| `JWT_PUBLIC_KEY` | Yes | Yes | None | `-----BEGIN PUBLIC KEY-----...` | API | JWT verification key for authenticated access to forecasting endpoints.  | All API calls |
| `JWT_ISSUER` | Yes | No | None | `https://auth.company.com` | API | Expected JWT issuer.  | All API calls |
| `JWT_AUDIENCE` | Yes | No | None | `rri-api` | API | Expected JWT audience.  | All API calls |
| `TENANT_HEADER_NAME` | No | No | `x-tenant-id` | `x-tenant-id` | API | Tenant context propagation header used by Platform Core patterns where applicable.  | All |
| `RBAC_ENFORCEMENT_ENABLED` | Yes | No | `true` | `true` | API | Enables role-based access checks for period creation, board access, and submissions.  | All |
| `LOG_LEVEL` | Yes | No | `info` | `debug` | API, Worker | Structured logging level for forecasting services and workers.  | All |
| `LOG_JSON_ENABLED` | No | No | `true` | `true` | API, Worker | Enables JSON logs for machine-readable observability pipelines.  | All |
| `SENTRY_DSN` | No | Yes | None | `https://key@o0.ingest.sentry.io/123` | API, Worker | Error monitoring destination for exceptions and worker failures. The architecture repeatedly references Sentry alerting patterns.  | Ops |
| `METRICS_ENABLED` | No | No | `true` | `true` | API, Worker | Enables metrics emission for latency, queue, stale snapshot, and submission-failure monitoring.  | Ops |
| `METRICS_NAMESPACE` | No | No | `rri_forecasting` | `rri_forecasting_prod` | API, Worker | Prefix/namespace for emitted forecasting metrics.  | Ops |
| `ALERT_FORECAST_STALE_MINUTES` | No | No | `180` | `240` | Worker, Ops | Alert threshold for stale prediction or coverage records.  | Ops |
| `ALERT_RECALC_QUEUE_DEPTH` | No | No | `100` | `250` | Worker, Ops | Alert threshold for recalculation queue backlog.  | Ops |
| `ALERT_SUBMISSION_FAILURE_RATE` | No | No | `0.05` | `0.1` | API, Ops | Alert threshold for submission failure ratio over rolling interval.  | Ops |

---

## 6. Minimum Required Variables by Flow

### A. API startup
Minimum variables:
- `NODE_ENV` 
- `APP_PORT` 
- `MODULE_FORECASTING_ENABLED` 
- `DATABASE_URL` 
- `JWT_PUBLIC_KEY` 
- `JWT_ISSUER` 
- `JWT_AUDIENCE` 
- `RBAC_ENFORCEMENT_ENABLED` 

### B. Forecast Board read flow
Minimum variables:
- all API startup variables, 
- `FEATURE_FORECAST_BOARDS_ENABLED`, 
- `FORECAST_ALLOW_HISTORICAL_BOARD_READS`, 
- `FORECAST_BOARD_STALE_THRESHOLD_MINUTES`, 
- `FORECAST_BOARD_EMPTY_STATE_ENABLED`. 

### C. Forecast period creation flow
Minimum variables:
- all API startup variables, 
- `FEATURE_FORECAST_BOARDS_ENABLED`, 
- `FORECAST_MAX_PERIODS_PER_TENANT`. 

### D. Forecast submission flow
Minimum variables:
- all API startup variables, 
- `FEATURE_FORECAST_SUBMISSION_ENABLED`, 
- `FORECAST_SUBMISSION_VERSIONING_ENABLED`, 
- `FORECAST_LOCK_ENFORCEMENT_STRICT`, 
- optional validation limits such as `FORECAST_SUBMISSION_MIN_AMOUNT` and `FORECAST_SUBMISSION_MAX_AMOUNT`. 

### E. Recalculation worker flow
Minimum variables:
- `NODE_ENV`, 
- `MODULE_FORECASTING_ENABLED`, 
- `FEATURE_FORECAST_RECALC_WORKER_ENABLED`, 
- `DATABASE_URL`, 
- `REDIS_URL`, 
- `QUEUE_PREFIX`, 
- `FORECAST_RECALC_QUEUE_NAME`, 
- `FORECAST_RECALC_DELAY_MS`, 
- `FORECAST_RECALC_WINDOW_MINUTES`. 

### F. Prediction snapshot refresh flow
Minimum variables:
- all recalculation-worker variables, 
- `FEATURE_AI_REVENUE_PREDICTOR_ENABLED`, 
- `FORECAST_PREDICTION_REFRESH_ENABLED`, 
- `FORECAST_PREDICTION_REFRESH_ON_STAGE_CHANGE`, 
- `FORECAST_PREDICTION_REQUIRE_CONVERSION_RATES`. 

### G. Coverage refresh flow
Minimum variables:
- all recalculation-worker variables, 
- `FORECAST_COVERAGE_REFRESH_ENABLED`, 
- `FORECAST_COVERAGE_REQUIRE_TARGET`, 
- `FORECAST_COVERAGE_MIN_REFRESH_INTERVAL_MINUTES`. 

---

## 7. Rotation and Security Notes

- `DATABASE_URL`, `REDIS_URL`, `JWT_PUBLIC_KEY` material where applicable, and `SENTRY_DSN` must be managed through the organization’s approved secret manager, not local plaintext sharing. 
- Even though M-09 has no direct third-party SaaS dependency of its own, infrastructure secrets still require rotation discipline because Redis and PostgreSQL are critical path dependencies. 
- Redis outage is especially important operationally because queue-backed recalculation and event-driven processing depend on it. The architecture explicitly notes Redis as critical path for queue-driven platform behavior. 
- Secret rotation must be coordinated with worker restart policies so recalculation jobs do not fail silently after credential changes. 
- Avoid exposing module feature flags to untrusted frontend runtime sources unless the value is intended to be public and read-only. Server-side feature enforcement remains the source of truth. 

---

## 8. Validation Checklist

Before deploying M6 to any environment, validate the following:

### Basic validation
- `MODULE_FORECASTING_ENABLED=true` only where M-09 should be active. 
- API can connect to PostgreSQL successfully. 
- Worker can connect to Redis successfully. 
- JWT verification settings match the environment auth provider. 

### Feature validation
- Forecast Boards endpoints are disabled when `FEATURE_FORECAST_BOARDS_ENABLED=false`. 
- Submit endpoint is disabled or blocked when `FEATURE_FORECAST_SUBMISSION_ENABLED=false`. 
- Recalc worker does not process jobs when `FEATURE_FORECAST_RECALC_WORKER_ENABLED=false`. 
- Locked-period submit attempts are rejected when `FORECAST_LOCK_ENFORCEMENT_STRICT=true`. 

### Timing validation
- `FORECAST_RECALC_DELAY_MS` matches expected batching behavior. 
- `FORECAST_RECALC_WINDOW_MINUTES` is not set below safe debounce expectations unless load testing proves it is safe. 
- prediction and coverage stale thresholds are greater than or equal to recompute frequency expectations. 

### Data validation
- board responses can tolerate missing `ai_forecast_snapshots` and `pipeline_coverage_metrics` without full endpoint failure. 
- submissions append new version rows instead of overwriting previous records. 
- open-period-only refresh behavior is correct if `FORECAST_OPEN_PERIODS_ONLY_RECALC=true`. 

### Observability validation
- logs contain enough structured fields to identify tenant, period, job, and submission failures safely. 
- Sentry or equivalent error reporting is active where required. 
- queue backlog and stale snapshot alerts are wired to on-call notifications in production. 

---

## 9. Implementation Notes

- This registry intentionally includes some **recommended operational variables** that are not listed one by one in the architecture but are directly implied by the architecture’s runtime model, such as queue names, stale thresholds, module flags, and submission validation toggles. These should be treated as the implementation contract for productionizing M-09 safely. 
- If the repo already has a platform-wide naming convention, rename these variables to match that convention, but keep the same semantic coverage. 
- Keep all defaults conservative in production because M-09 deals with forecast integrity, submission auditability, and executive-facing numbers. 

