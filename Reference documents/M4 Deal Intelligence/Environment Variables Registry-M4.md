# Doc #18 — Environment Variables Registry: M4

## 1. Document Control

Document Name: Environment Variables Registry — M4 Deal Intelligence 
Project: R-Revenue Intelligence 
Module Scope: M4 Deal Intelligence product scope, implemented across M-07 Deal and Account Management and M-05 Smart Tracking and Search where View Deal Drivers applies. 
Owner: Tech Lead / Engineering Lead 
Contributors: Backend Engineers, Frontend Engineers, DevOps Engineers, QA Engineers, Product Managers. 
Version: 0.1 Draft 
Status: Draft 
Last Updated: April 2026 
Next Review Date: July 2026 
Review Cadence: Every 3 months, or immediately after a major architecture, infra, security, integration, or feature-boundary change. 


Important boundary note
This registry documents the M4 product experience, but not all variables belong to one backend module. Deals Boards is implemented mainly in M-07, and View Deal Drivers is implemented mainly in M-05. Variable ownership must follow implementation ownership, even when release flags are described at the M4 product level.



## 2. Purpose

This document is the working registry of runtime configuration used by the M4 Deal Intelligence product experience. It exists so engineers can quickly see which environment variables are required, which service owns them, which flows depend on them, and whether they are secrets or plain configuration. 

This registry must be read together with the SAD because M4 is a product grouping, not a single runtime module. Deals Boards is served mainly by M-07 Deal and Account Management, while View Deal Drivers is currently served mainly by M-05 Smart Tracking and Search. 

The goal of this document is to reduce configuration drift, prevent random env naming, and make onboarding simple for freshers and interns. It is not a place to invent new configuration patterns that contradict the approved platform architecture. 

## 3. Usage Rules

Use these rules for every variable in this registry:
- All secrets must be managed through Doppler or the approved secret source for the environment. Secrets must not live in repositories, container images, or committed env files. 
- Every environment is isolated. Local, development, staging, and production each have their own database, Redis instance, auth setup, and secrets. Never reuse production secrets in lower environments. 
- Tenant identity must never come from env vars that pretend to select a tenant at runtime for user requests. Tenant scope comes from JWT context and request handling, not from static process config. 
- Do not create cross-module env shortcuts that encourage direct database reads or writes into another module’s private schema. Modules communicate through APIs and events, not private config hacks. 
- When a variable changes behavior materially, document the feature flag or operational effect here before merge. 
- Any new shared env convention requires Tech Lead review. 

Naming rules:
- Use uppercase snake case. 
- Prefix variables clearly by concern when possible, for example `M4_`, `M07_`, `M05_`, `CRM_`, `REDIS_`, `SENTRY_`. 
- Do not create ambiguous names like `TIMEOUT`, `URL`, or `ENABLED` without domain context. 

## 4. Runtime Groups

The M4 runtime configuration should be grouped like this:
- App basics and feature flags. 
- PostgreSQL and Redis. 
- CRM read configuration. 
- Risk and engagement scoring service endpoints. 
- Board cache and refresh settings. 
- Analytics query settings for deal drivers. 
- Observability, Sentry, logs, and alerts. 
- Internal auth and service-to-service protection. 

Important mapping rule:
- Variables for Deals Boards generally configure M-07 read paths, board state, risk flags, and refresh behavior. 
- Variables for View Deal Drivers generally configure M-05 analytics queries, snapshots, and derived rep-level driver computation. 

## 5. Variable Registry Table

| Variable Name | Group | Used By | Secret | Required | Example | Purpose | Notes |
|---|---|---|---|---|---|---|---|
| NODE_ENV | App basics | M-05, M-07 | No | Yes | production | Standard runtime mode selector.  | Must match deployed environment.  |
| APP_ENV | App basics | M-05, M-07 | No | Yes | staging | Logical environment name for config branching and observability tagging.  | Keep values aligned across services.  |
| API_BASE_URL | App basics | Frontend / BFF | No | Yes | https://app.r-ri.com/api | Base API URL used by UI to reach platform APIs.  | Do not hardcode per page.  |
| M4_DEAL_INTELLIGENCE_ENABLED | Feature flags | Frontend, M-05, M-07 | No | Yes | true | Master feature flag for the M4 product experience.  | Product-level gate only; not a substitute for RBAC.  |
| M4_DEALS_BOARD_ENABLED | Feature flags | Frontend, M-07 | No | Yes | true | Enables Deals Board UI and M-07 board-serving endpoints.  | Can be enabled separately from drivers.  |
| M4_DEAL_DRIVERS_ENABLED | Feature flags | Frontend, M-05 | No | Yes | true | Enables View Deal Drivers and driver endpoints.  | Must reflect current M-05 ownership.  |
| M4_BOARD_WARNINGS_ENABLED | Feature flags | M-07 | No | Yes | true | Controls board warning presentation and warning-derived UI behavior.  | Warning generation logic remains architecture-owned by M-07.  |
| M4_SAVED_VIEWS_ENABLED | Feature flags | Frontend, M-07 | No | No | true | Enables saved board-view configuration support.  | Backed by `dealboardconfigs`.  |
| M4_DRIVER_ANALYTICS_ENABLED | Feature flags | Frontend, M-05 | No | No | true | Enables rep-level driver analytics panels and API responses.  | Use with board-scoped analytics only.  |
| M4_REFRESH_MODE | Feature flags | M-05, M-07 | No | No | async | Controls whether UI shows snapshot-based or near-live refresh mode messaging.  | Recommended value is `async`.  |
| DATABASE_URL | PostgreSQL | M-05, M-07 | Yes | Yes | postgres://... | Primary PostgreSQL connection string.  | Separate per environment.  |
| POSTGRES_POOL_MIN | PostgreSQL | M-05, M-07 | No | No | 2 | Minimum DB pool size.  | Tune by environment size.  |
| POSTGRES_POOL_MAX | PostgreSQL | M-05, M-07 | No | No | 20 | Maximum DB pool size.  | Watch query latency and worker concurrency.  |
| REDIS_URL | Redis | M-05, M-07 | Yes | Yes | redis://redis:6379 | Redis connection for BullMQ, cache, and async coordination.  | If Redis fails, async refresh and queue-driven updates stall.  |
| BULLMQ_PREFIX | Redis | M-05, M-07 | No | No | rri | Shared queue prefix to avoid collisions.  | Keep environment-specific where needed.  |
| CRM_PROVIDER | CRM read config | M-07, M-05 | No | Yes | salesforce | Active CRM provider for deal and account reads.  | Supported providers include Salesforce, HubSpot, Dynamics 365.  |
| CRM_BASE_URL | CRM read config | M-07, M-05 | Yes | Yes | https://your-instance.salesforce.com | Base URL for CRM reads where connector requires it.  | Tenant-specific in real integration layers.  |
| CRM_CLIENT_ID | CRM read config | Integration layer | Yes | Yes | ******** | OAuth client ID for CRM integration.  | Must be managed in Doppler.  |
| CRM_CLIENT_SECRET | CRM read config | Integration layer | Yes | Yes | ******** | OAuth client secret for CRM integration.  | Secret rotation required.  |
| CRM_REFRESH_TOKEN | CRM read config | Integration layer | Yes | Conditional | ******** | Refresh token for CRM API access.  | Required when tenant integration is active.  |
| REVENUE_GRAPH_API_URL | CRM / context | M-05, M-07 | No | Yes | http://api:3000/api/v1/revenue-graph | Public API path for Revenue Graph reads.  | Use public API only, not direct schema access.  |
| INSIGHTS_API_URL | Scoring / insight inputs | M-07 | No | No | http://api:3000/api/v1/insights | Endpoint base used when M-07 enriches boards with summary or brief context.  | Keep as API dependency, not DB shortcut.  |
| SMART_TRACKING_API_URL | Driver analytics | M-07, Frontend | No | No | http://api:3000/api/v1/smart-tracking | Base URL for tracker and deal-driver reads.  | Needed for M4 split architecture.  |
| DEAL_MANAGEMENT_API_URL | Board reads | Frontend | No | Yes | http://api:3000/api/v1/deal-management | Base URL for Deals Board APIs.  | Canonical prefix comes from API standards section.  |
| M07_RISK_SCORE_RECOMPUTE_ENABLED | Scoring | M-07 | No | Yes | true | Enables event-driven risk score recomputation.  | Should stay enabled in non-demo environments.  |
| M07_HEALTH_THRESHOLD_CRITICAL | Scoring | M-07 | No | Yes | 30 | Score threshold below which a deal health is marked critical. | Configurable by tenant. |
| M07_HEALTH_THRESHOLD_WARNING | Scoring | M-07 | No | Yes | 60 | Score threshold below which a deal health is marked warning. | Configurable by tenant. |
| M07_ENGAGEMENT_WINDOW_DAYS | Scoring | M-07 | No | No | 14 | Window used for engagement inputs in health score logic.  | SAD example uses last 14 days.  |
| M07_HEALTH_SCORE_REFRESH_ON_SUMMARY | Scoring | M-07 | No | No | true | Recompute health score when `call.summary.generated` is consumed.  | Aligns with deal health update flow.  |
| M07_HEALTH_SCORE_REFRESH_ON_TRACKER | Scoring | M-07 | No | No | true | Recompute health score when `tracker.detection.created` is consumed.  | Core board freshness path.  |
| M07_HEALTH_SCORE_REFRESH_ON_STAGE_CHANGE | Scoring | M-07 | No | No | true | Recompute health score on stage changes.  | Supports stage-driven risk cleanup.  |
| M4_BOARD_CACHE_ENABLED | Cache / refresh | M-07, Frontend | No | No | false | Enables board-response caching if introduced.  | Default should remain false if board reads live from PostgreSQL.  |
| M4_BOARD_CACHE_TTL_SECONDS | Cache / refresh | M-07 | No | No | 30 | TTL for board response cache.  | Use carefully; stale data risk is high.  |
| M4_BOARD_REFRESH_POLL_SECONDS | Cache / refresh | Frontend | No | No | 15 | UI polling interval for board refresh.  | Keep moderate to avoid noisy reads.  |
| M4_BOARD_STALE_WARNING_MINUTES | Cache / refresh | Frontend, M-07 | No | No | 10 | Threshold after which UI may show stale-data indicator.  | Helpful because recompute and reads fail differently.  |
| M05_DRIVER_SNAPSHOT_TTL_SECONDS | Driver analytics | M-05 | No | No | 300 | Maximum age before a deal-driver snapshot is considered stale.  | Used for board-scoped analytics freshness.  |
| M05_DRIVER_MAX_DEALS_PER_SCOPE | Driver analytics | M-05 | No | No | 1000 | Safety cap for scoped driver computation.  | Prevents expensive wide scans.  |
| M05_DRIVER_DEFAULT_WINDOW_DAYS | Driver analytics | M-05 | No | No | 30 | Default time window for driver analytics queries.  | Must align with TDD rules if changed.  |
| M05_DRIVER_COMPARISON_ENABLED | Driver analytics | M-05 | No | No | true | Enables previous-period comparison logic for drivers.  | Disable only for emergency simplification.  |
| M05_DRIVER_INCLUDE_LOW_CONFIDENCE | Driver analytics | M-05 | No | No | false | Determines whether low-confidence detections can contribute to displayed drivers.  | SAD notes low-confidence detections may be filtered.  |
| M05_DRIVER_QUERY_TIMEOUT_MS | Driver analytics | M-05 | No | No | 5000 | Timeout for heavy analytics query paths.  | Tune with monitoring.  |
| M05_DRIVER_RECOMPUTE_DEBOUNCE_MS | Driver analytics | M-05 | No | No | 60000 | Debounce window before recomputing certain derived analytics snapshots.  | Pattern aligned with event batching approach.  |
| JWT_AUDIENCE | Auth | Frontend, M-05, M-07 | No | Yes | rri-api | Expected JWT audience.  | Must match auth service config.  |
| SUPABASE_JWT_SECRET | Auth | API layer | Yes | Yes | ******** | JWT validation secret or equivalent verifier config.  | Never commit locally.  |
| INTERNAL_SECRET | Internal auth | M-05, M-07, AI services | Yes | Yes | ******** | Shared secret for authorised internal service-to-service calls.  | Required for internal HTTP trust boundary.  |
| SENTRY_DSN | Observability | Frontend, M-05, M-07 | Yes | Yes | https://... | Sends exceptions and performance issues to Sentry.  | Required for runtime visibility.  |
| BETTER_STACK_SOURCE_TOKEN | Observability | M-05, M-07 | Yes | No | ******** | Token for structured logs and uptime-linked visibility.  | Use where Better Stack logging is wired.  |
| LOG_LEVEL | Observability | M-05, M-07 | No | Yes | info | Default process log level.  | Use `debug` only in local/dev.  |
| ENABLE_STRUCTURED_LOGGING | Observability | M-05, M-07 | No | Yes | true | Enables structured JSON logs for search and correlation.  | Strongly recommended in all non-local envs.  |
| ALERT_WEBHOOK_URL | Observability | M-05, M-07 | Yes | No | https://hooks... | Optional alert destination for ops or support routing.  | Keep team-owned, not personal.  |

## 6. Minimum Required Variables by Flow

### 6.1 Deals Board read flow
Minimum variables:
- `NODE_ENV` 
- `APP_ENV` 
- `DATABASE_URL` 
- `DEAL_MANAGEMENT_API_URL` 
- `JWT_AUDIENCE` 
- `SUPABASE_JWT_SECRET` 
- `M4_DEALS_BOARD_ENABLED` 

These are the minimum needed to authenticate, read tenant-scoped board state, and serve Deals Board responses. If board enrichment depends on additional summary or context composition, `INSIGHTS_API_URL` and `REVENUE_GRAPH_API_URL` are also required. 

### 6.2 Board recompute and risk refresh flow
Minimum variables:
- `DATABASE_URL` 
- `REDIS_URL` 
- `M07_RISK_SCORE_RECOMPUTE_ENABLED` 
- `M07_HEALTH_SCORE_REFRESH_ON_SUMMARY` 
- `M07_HEALTH_SCORE_REFRESH_ON_TRACKER` 
- `M07_HEALTH_SCORE_REFRESH_ON_STAGE_CHANGE` 
- `SENTRY_DSN` 

These are needed because M-07 recompute paths are event-driven and depend on database writes, queue health, and error visibility. A healthy board GET endpoint does not prove these variables are configured correctly. 

### 6.3 View Deal Drivers flow
Minimum variables:
- `M4_DEAL_DRIVERS_ENABLED` 
- `SMART_TRACKING_API_URL` 
- `DATABASE_URL` 
- `REDIS_URL` 
- `M05_DRIVER_SNAPSHOT_TTL_SECONDS` 
- `M05_DRIVER_DEFAULT_WINDOW_DAYS` 
- `M05_DRIVER_QUERY_TIMEOUT_MS` 
- `JWT_AUDIENCE` 
- `SUPABASE_JWT_SECRET` 

These variables support the current M-05 ownership model for driver snapshots, scoped analytics queries, and authenticated access. If board-scoped inputs are restored from the UI or M-07 APIs, `DEAL_MANAGEMENT_API_URL` may also be required by the application layer. 

### 6.4 CRM-backed deal context flow
Minimum variables:
- `CRM_PROVIDER` 
- `CRM_BASE_URL` 
- `CRM_CLIENT_ID` 
- `CRM_CLIENT_SECRET` 
- `CRM_REFRESH_TOKEN` when connector auth requires it. 
- `REVENUE_GRAPH_API_URL` 

These variables support reading deal and account context from approved integration paths without violating module boundaries. Do not replace these with direct schema shortcuts. 

### 6.5 Observability and support flow
Minimum variables:
- `SENTRY_DSN` 
- `LOG_LEVEL` 
- `ENABLE_STRUCTURED_LOGGING` 
- `BETTER_STACK_SOURCE_TOKEN` when Better Stack log shipping is enabled. 
- `ALERT_WEBHOOK_URL` when operational routing is enabled. 

These are needed so failures in board reads, recompute jobs, tracker-driven updates, and stale snapshot paths can be diagnosed quickly. Silent failure is worse than visible failure in an event-driven architecture. 

## 7. Rotation and Security Notes

Secrets rotation rules:
- CRM client secrets, refresh tokens, internal shared secrets, DB credentials, Redis credentials, and observability tokens must be rotated through Doppler or the approved central secret system. 
- When rotating secrets, update lower environments first, then staging, then production after validation. Never rotate directly in production without proving the change in earlier environments. 
- No secret may be embedded in Docker images, source code, frontend bundles, or committed `.env` files. 

Security notes:
- Internal service calls must use the approved internal secret header pattern, not open unauthenticated calls. 
- Webhook secrets and customer integration secrets must remain tenant-safe and environment-isolated. 
- Access tokens belong in runtime auth flow, not static env files used to fake user scope. 
- Sentry and logs must avoid leaking raw secrets or sensitive customer payloads. 

## 8. Validation Checklist

Before merge or deployment, validate the following:
- All required variables exist in Doppler for the target environment. 
- No variable is documented here without a real owning service or flow. 
- No secret is stored in the repo, container image, or committed local env file. 
- `DATABASE_URL` points to the correct environment-specific database. 
- `REDIS_URL` points to the correct environment-specific Redis instance. 
- Board feature flags and driver feature flags match the intended release state. 
- M-07 board reads work with tenant-scoped auth. 
- M-07 event-driven recompute works when tracker and summary events arrive. 
- M-05 driver analytics can read scoped data and return fresh or correctly marked snapshot results. 
- Sentry events appear correctly for forced test failures in non-production environments. 
- Structured logs include request and tenant-safe correlation metadata. 
- No variable in this registry encourages cross-module private schema access. 

## 9. Notes for Engineers

Remember the product vs architecture split:
- M4 is the product grouping. 
- M-07 owns Deals Board runtime behavior. 
- M-05 currently owns View Deal Drivers runtime behavior. 

So this registry should stay practical:
- Board-serving env vars mostly belong to M-07. 
- Driver analytics env vars mostly belong to M-05. 
- Shared labels may still use “M4” when the variable controls the product experience rather than one implementation service. 

