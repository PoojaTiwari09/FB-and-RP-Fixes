# Doc #18 — M3 Environment Variables Registry

**Suggested file path:** `docs/modules/m03/env-registry.md` 

## 1. Document Control

- **Document title:** M3 Environment Variables Registry
- **Module:** M3 AI Summaries & GenAI
- **Architecture mapping:** M-06 Insight Generation
- **Owner:** Tech Lead / AI Lead / Backend Lead
- **Status:** Draft
- **Version:** v1.0
- **Last updated:** 2026-04-30
- **Review cadence:** Every 3 months, or immediately after any AI provider, retrieval, worker, security, or deployment change 

## 2. Purpose

This document is the single module-level registry for environment variables used by M3 AI Summaries & GenAI. It exists to keep configuration understandable, reviewable, and consistent across local, development, staging, and production environments. 

For M3 specifically, the registry focuses on:
- summary generation
- Ask Anything retrieval and answer generation
- AI Deep Researcher orchestration
- worker concurrency and queue safety
- AI provider routing and fallback
- retrieval limits and embedding behavior
- observability and cost control 

A simple way to explain this to a fresher is: code should describe **what the module does**, while env vars describe **how it runs safely in a given environment**. 

## 3. Usage Rules

### Core rules
- All secrets must be stored in **Doppler** and injected at runtime.
- No secrets are allowed in Git, Docker images, or hardcoded config files.
- M3 must use only approved stack components unless a new ADR is approved.
- TypeScript product services must never call external AI providers directly; they call internal Python AI services instead. 

### Configuration rules
- Every env var must have one clear owner and one clear purpose.
- Required vars must fail fast at startup if missing.
- Optional vars must have documented defaults in code and in this registry.
- Variable names should be stable across environments to reduce deployment drift. 

### Runtime consistency
The architecture requires version pinning, environment isolation, and runtime consistency across local, staging, and production. That means M3 config must not depend on undocumented machine-local assumptions, hidden shell exports, or one-off engineer overrides. 

### Security rules
- Production secrets must be rotated through approved secret workflows.
- AI provider keys, DB credentials, Redis URLs, and search keys are all high-sensitivity.
- Logs must never print secret values.
- Diagnostic endpoints must redact sensitive config. 

## 4. Runtime Groups

M3 env vars are easiest to manage in these runtime groups:

- App basics and feature flags
- PostgreSQL and Redis
- Internal AI service endpoints
- LLM provider and gateway routing
- Retrieval and embeddings
- Search engine settings
- Prompt and template controls
- Worker orchestration and timeouts
- Observability and cost controls
- Security and secret governance 

## 5. Variable Registry Table

| Variable | Required | Example | Scope | Used By | Description |
|---|---|---|---|---|---|
| `NODE_ENV` | Yes | `development` | All envs | API, workers | Standard runtime mode selector for behavior, logging, and safety rules.  |
| `APP_ENV` | Yes | `staging` | All envs | API, workers | Human-readable deployment environment name; useful for alerts and routing.  |
| `MODULE_M03_ENABLED` | Yes | `true` | All envs | API bootstrap | Master feature flag for M3 module enablement.  |
| `M03_SUMMARY_ENABLED` | Yes | `true` | All envs | Summary flow | Enables AI Smart Summaries flow.  |
| `M03_ASK_ENABLED` | Yes | `true` | All envs | Ask Anything | Enables Ask Anything endpoints and worker-safe retrieval flow.  |
| `M03_RESEARCH_ENABLED` | Yes | `true` | All envs | Deep Researcher | Enables AI Deep Researcher job creation and status APIs.  |
| `DATABASE_URL` | Yes | `postgresql://...` | All envs | API, workers | Primary PostgreSQL connection string for M3-owned tables such as `callsummaries`, `dealbriefs`, `accountbriefs`, `researchreports`, and `querysessions`.  |
| `DATABASE_POOL_MAX` | No | `20` | All envs | API, workers | Max DB connection pool size for M3 services.  |
| `REDIS_URL` | Yes | `redis://redis:6379` | All envs | BullMQ, cache | Redis connection string for queue/event processing and short-lived coordination.  |
| `BULLMQ_PREFIX` | Yes | `rri` | All envs | Workers | Queue namespace prefix to avoid collisions across environments or modules.  |
| `AI_SERVICE_URL` | Yes | `http://ai-service:8000` | All envs | API, workers | Base URL for the internal FastAPI AI Services Layer used by M3.  |
| `AI_RESEARCH_ENDPOINT` | Yes | `/v1/generate-report` | AI envs | Research worker | Canonical path for the AI research-generation endpoint. Separate from summary and answer endpoints due to model and context differences.  |
| `AI_SERVICE_TIMEOUT_MS_SYNC` | Yes | `30000` | All envs | Ask, summaries | Timeout for synchronous API-to-AI calls; architecture calls for 30s max user-facing timeout.  |
| `AI_SERVICE_TIMEOUT_MS_ASYNC` | Yes | `300000` | All envs | Research worker | Timeout for background AI tasks; architecture calls for up to 5 minutes for background operations.  |
| `AI_SERVICE_RETRY_MAX` | Yes | `3` | All envs | API, workers | Retry budget for internal AI service calls with backoff.  |
| `LITELLM_BASE_URL` | Yes | `http://litellm:4000` | AI envs | AI services | Base URL or route target for LiteLLM gateway if deployed separately. LiteLLM is the approved routing layer.  |
| `LITELLM_ROUTER_ENABLED` | Yes | `true` | AI envs | AI services | Enables centralized provider routing and fallback behavior.  |
| `OPENAI_API_KEY` | Yes | `***` | AI envs | AI services | Primary production LLM provider credential for summaries, QA, and research generation through LiteLLM-approved flows.  |
| `OPENAI_MODEL_SUMMARY` | Yes | `gpt-4o-mini` | AI envs | Summary generation | Model route for summary-style generation tasks where lighter latency and cost may be preferred.  |
| `OPENAI_MODEL_ASK` | Yes | `gpt-4o` | AI envs | Ask Anything | Model route for grounded answer generation.  |
| `OPENAI_MODEL_RESEARCH` | Yes | `gpt-4o` | AI envs | Deep Researcher | Model route for long multi-document analysis and structured report generation.  |
| `OPENAI_MODEL_EMBEDDINGS` | Yes | `text-embedding-3-small` | AI envs | Retrieval | Embedding model used for semantic retrieval in Ask Anything and research support.  |
| `ANTHROPIC_API_KEY` | No | `***` | AI envs | AI services | Fallback provider credential when LiteLLM routing activates secondary provider flows.  |
| `LLM_FALLBACK_ENABLED` | Yes | `true` | AI envs | AI services | Enables approved provider fallback behavior through LiteLLM.  |
| `LLM_FALLBACK_ORDER` | No | `openai,anthropic` | AI envs | AI services | Ordered fallback strategy for production provider routing.  |
| `LOCAL_LLM_FALLBACK_ENABLED` | No | `false` | Dev, staging | AI services | Enables local fallback experiments such as Ollama; useful for development, not default production path.  |
| `OLLAMA_BASE_URL` | No | `http://ollama:11434` | Dev, staging | AI services | Local runtime endpoint for offline testing or fallback experiments.  |
| `EMBEDDING_BATCH_SIZE` | No | `64` | All envs | Retrieval jobs | Batch size for embedding generation jobs.  |
| `EMBEDDING_MAX_TEXT_CHARS` | No | `8000` | All envs | Retrieval | Safety cap on text length sent for one embedding request.  |
| `PGVECTOR_TOP_K_ASK` | Yes | `20` | All envs | Ask Anything | Number of top semantic chunks retrieved for Ask Anything. The architecture example uses limit 20.  |
| `PGVECTOR_TOP_K_RESEARCH` | Yes | `100` | All envs | Deep Researcher | Broader retrieval budget for research-grade analysis over large datasets.  |
| `PGVECTOR_MIN_SCORE` | No | `0.72` | All envs | Retrieval | Minimum semantic match threshold before a chunk is considered relevant.  |
| `RETRIEVAL_ENABLE_HYBRID_SEARCH` | Yes | `true` | All envs | Ask, research | Enables combined semantic plus indexed search when supported.  |
| `RETRIEVAL_MAX_SOURCE_CHUNKS` | Yes | `20` | All envs | Prompt assembly | Hard cap on chunks passed into final prompt assembly for synchronous flows.  |
| `RETRIEVAL_MAX_RESEARCH_BATCHES` | Yes | `10` | All envs | Research worker | Limit on batch fan-out during deep research orchestration.  |
| `RETRIEVAL_DIVERSITY_ENFORCED` | No | `true` | All envs | Research flow | Encourages source diversity across calls, reps, accounts, or time windows.  |
| `MEILISEARCH_URL` | Yes | `http://meilisearch:7700` | All envs | Retrieval/search | Search engine URL if Ask or research uses indexed search support.  |
| `MEILISEARCH_API_KEY` | No* | `***` | All envs | Retrieval/search | Search credential for protected Meilisearch environments. (*Required in non-local envs) |
| `PROMPT_VERSION_SUMMARY` | Yes | `v1` | All envs | Prompt builders | Version pin for summary prompt contract.  |
| `PROMPT_VERSION_ASK` | Yes | `v1` | All envs | Prompt builders | Version pin for Ask Anything prompt contract.  |
| `PROMPT_VERSION_RESEARCH` | Yes | `v1` | All envs | Prompt builders | Version pin for Deep Researcher multi-step prompt contract.  |
| `PROMPT_STRICT_JSON` | Yes | `true` | All envs | AI generation | Forces structured output handling where required by the platform.  |
| `SUMMARY_QUEUE_CONCURRENCY` | Yes | `10` | All envs | Summary workers | Worker concurrency for summary jobs.  |
| `ASK_REQUEST_CONCURRENCY` | No | `25` | All envs | API layer | Soft application-level concurrency cap for Ask requests.  |
| `RESEARCH_QUEUE_CONCURRENCY` | Yes | `3` | All envs | Research workers | Low concurrency by design because research is heavy, retrieval-rich, and cost-sensitive.  |
| `RESEARCH_JOB_MAX_RUNTIME_MS` | Yes | `900000` | All envs | Research workers | Absolute max research job runtime before forced failure or safe termination.  |
| `RESEARCH_RETRY_MAX` | Yes | `3` | All envs | Research workers | Retry budget for long-running research jobs.  |
| `QUEUE_DLQ_ENABLED` | Yes | `true` | All envs | BullMQ | Enables dead-letter queue behavior for failed async jobs.  |
| `SUMMARY_CONFIDENCE_MIN` | No | `0.70` | All envs | Summary flow | Threshold aligned with architecture rule that outputs below 0.7 are flagged for review.  |
| `ASK_CONFIDENCE_MIN` | No | `0.70` | All envs | Ask flow | Minimum acceptable answer confidence before caution flags are applied.  |
| `RESEARCH_CONFIDENCE_MIN` | No | `0.70` | All envs | Research flow | Threshold for flagging low-confidence research findings or sections.  |
| `ENABLE_FLAGGED_FOR_REVIEW_WRITE_GUARD` | Yes | `true` | All envs | API, workers | Prevents unsafe downstream auto-write behavior for low-confidence AI outputs.  |
| `SENTRY_DSN` | Yes | `https://...` | All envs | API, workers, AI | Error tracking destination; architecture requires AI failures to emit structured Sentry events.  |
| `LOG_LEVEL` | Yes | `info` | All envs | API, workers | Standard runtime log level.  |
| `BETTER_STACK_SOURCE_TOKEN` | No | `***` | All envs | Logs/uptime | Token for Better Stack log or monitoring integration.  |
| `GRAFANA_METRICS_ENABLED` | No | `true` | All envs | Metrics | Enables metrics export for queue depth, latency, and AI cost signals.  |
| `AI_COST_BUDGET_DAILY_USD` | Yes | `250` | All envs | AI services, ops | Daily soft budget for M3 AI spend. Usage-based AI providers must be monitored from day one.  |
| `AI_COST_ALERT_THRESHOLD_PCT` | Yes | `80` | All envs | Ops | Alert threshold percentage for budget burn. Tooling docs explicitly call out 80 percent token budget review thresholds.  |
| `TOKEN_USAGE_LOGGING_ENABLED` | Yes | `true` | All envs | AI services | Enables token accounting per endpoint and provider.  |
| `TENANT_ISOLATION_ENFORCED` | Yes | `true` | All envs | API, workers | Hard guard that tenant-scoped execution must be active for M3.  |
| `SESSION_RETENTION_DEFAULT_DAYS` | Yes | `90` | All envs | API, workers | Default session retention days for query sessions and messages. |
| `DOPPLER_PROJECT` | Yes | `rri` | All envs | Runtime config | Identifies the approved Doppler project.  |
| `DOPPLER_CONFIG` | Yes | `staging` | All envs | Runtime config | Identifies the environment-specific Doppler config used at runtime.  |

## 6. Minimum Required Variables by Flow

### A. AI Smart Summaries
Minimum required:
- `MODULE_M03_ENABLED`
- `M03_SUMMARY_ENABLED`
- `DATABASE_URL`
- `REDIS_URL`
- `BULLMQ_PREFIX`
- `AI_SERVICE_URL`
- `AI_SERVICE_TIMEOUT_MS_SYNC`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_SUMMARY`
- `PROMPT_VERSION_SUMMARY`
- `SUMMARY_QUEUE_CONCURRENCY`
- `TENANT_ISOLATION_ENFORCED` 

### B. Ask Anything
Minimum required:
- `MODULE_M03_ENABLED`
- `M03_ASK_ENABLED`
- `DATABASE_URL`
- `AI_SERVICE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_ASK`
- `OPENAI_MODEL_EMBEDDINGS`
- `PGVECTOR_TOP_K_ASK`
- `RETRIEVAL_MAX_SOURCE_CHUNKS`
- `PROMPT_VERSION_ASK`
- `AI_SERVICE_TIMEOUT_MS_SYNC`
- `MEILISEARCH_URL`
- `MEILISEARCH_API_KEY`
- `TENANT_ISOLATION_ENFORCED` 

### C. AI Deep Researcher
Minimum required:
- `MODULE_M03_ENABLED`
- `M03_RESEARCH_ENABLED`
- `DATABASE_URL`
- `REDIS_URL`
- `BULLMQ_PREFIX`
- `AI_SERVICE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_RESEARCH`
- `PGVECTOR_TOP_K_RESEARCH`
- `RETRIEVAL_MAX_RESEARCH_BATCHES`
- `PROMPT_VERSION_RESEARCH`
- `RESEARCH_QUEUE_CONCURRENCY`
- `RESEARCH_JOB_MAX_RUNTIME_MS`
- `RESEARCH_RETRY_MAX`
- `QUEUE_DLQ_ENABLED`
- `MEILISEARCH_URL`
- `MEILISEARCH_API_KEY`
- `TENANT_ISOLATION_ENFORCED` 

### D. Observability and cost safety
Minimum required:
- `SENTRY_DSN`
- `LOG_LEVEL`
- `AI_COST_BUDGET_DAILY_USD`
- `AI_COST_ALERT_THRESHOLD_PCT`
- `TOKEN_USAGE_LOGGING_ENABLED` 

## 7. Rotation and Security Notes

### Secret governance
All secrets must come from **Doppler**, because the approved platform rule is that no secrets live in repos, images, or ad hoc local files as a source of truth. Doppler is the centralized secrets manager for environment-specific runtime injection. 

### Rotation policy
Recommended minimum rotation policy:
- OpenAI and fallback provider keys: rotate every 90 days or immediately after suspected exposure.
- Database credentials: rotate on role change, incident, or environment rebuild.
- Redis credentials: rotate on infra incident or scheduled quarterly review.
- Search keys and observability tokens: rotate with the same discipline as service credentials. 

### Redaction rules
- Never print secrets in startup logs.
- Never expose raw env values in health endpoints.
- Never copy production secrets into local `.env` files outside approved Doppler workflows.
- Never paste secret values into tickets, PR comments, or chat threads. 

### Production safety
Because M3 handles customer conversations, generated outputs, retrieval context, and research jobs, its config is high-sensitivity even when the variable itself is not a secret. Treat retrieval thresholds, provider routing, and model selection as controlled runtime policy, not casual developer preference. 

## 8. Validation Checklist

Before merging or deploying changes affecting M3 config, verify:

- Required env vars are defined in Doppler for the target environment. 
- Zod or equivalent config schema validates all required values at startup. 
- No env var introduces direct TypeScript-to-provider AI calls, which would violate architecture rules. 
- AI service endpoints still point to approved internal FastAPI services. 
- LiteLLM fallback behavior is documented and tested if enabled. 
- Worker concurrency values are safe for Redis capacity and AI budget. 
- Retrieval limits are bounded to avoid runaway research jobs. 
- Token usage logging and cost alerts are enabled in non-local environments. 
- Sentry and Better Stack wiring are active in staging and production. 
- Tenant isolation guard remains enabled. 
- Prompt version vars are updated together with prompt contract changes. 
- New variables have owner, default policy, and rollout note documented here. 

## 9. Recommended Defaults

These defaults are practical starting points for M3 and align with the architecture’s cost-aware, async-first design:

- `AI_SERVICE_TIMEOUT_MS_SYNC=30000`
- `AI_SERVICE_TIMEOUT_MS_ASYNC=300000`
- `AI_SERVICE_RETRY_MAX=3`
- `PGVECTOR_TOP_K_ASK=20`
- `PGVECTOR_TOP_K_RESEARCH=100`
- `RETRIEVAL_MAX_SOURCE_CHUNKS=20`
- `RETRIEVAL_MAX_RESEARCH_BATCHES=10`
- `SUMMARY_QUEUE_CONCURRENCY=10`
- `RESEARCH_QUEUE_CONCURRENCY=3`
- `SUMMARY_CONFIDENCE_MIN=0.70`
- `ASK_CONFIDENCE_MIN=0.70`
- `RESEARCH_CONFIDENCE_MIN=0.70`
- `AI_COST_ALERT_THRESHOLD_PCT=80` 

## 10. Ownership

| Config Area | Primary Owner | Secondary Owner |
|---|---|---|
| App and module flags | Backend Lead | Tech Lead |
| DB and Redis config | Backend Lead | DevOps Lead |
| AI service endpoint config | AI Lead | Backend Lead |
| LiteLLM and provider routing | AI Lead | Tech Lead |
| Retrieval and embedding config | AI Lead | Data Lead |
| Worker concurrency and timeouts | Backend Lead | AI Lead |
| Observability and alerts | DevOps Lead | Tech Lead |
| Secret governance and rotation | Security Owner / DevOps Lead | Tech Lead | 

## 11. Related Files

This env registry is meant to support the rest of the M3 docs set:

- `docs/modules/m03/README.md`
- `docs/modules/m03/tdd-ai-smart-summaries.md`
- `docs/modules/m03/tdd-ask-anything.md`
- `docs/modules/m03/tdd-ai-deep-researcher.md`
- `docs/modules/m03/sequence-summary-flow.md`
- `docs/modules/m03/sequence-ask-anything-flow.md`
- `docs/modules/m03/sequence-deep-research-flow.md`
- `docs/modules/m03/env-registry.md` 