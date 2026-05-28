# Doc #18 — M3 Environment Variables Registry

**Workspace Registry Path:** `modules/m03-ai-summaries-genai/env-registry.md` 
**Reference Doc Path:** `/doc/reference/M3 AI Summaries & GenAI/M3 Environment Variables Registry.md`

## 1. Document Control

- **Document Title:** M3 Environment Variables Registry
- **Module:** M3 AI Summaries & GenAI
- **Owner:** Tech Lead / AI Lead / Backend Lead
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18
- **Review Cadence:** Every 3 months, or immediately after any AI provider, retrieval, worker, security, or deployment change 

---

## 2. Purpose

This document serves as the Single Source of Truth (SSOT) module-level registry for environment variables used by **M3 AI Summaries & GenAI**. It ensures configuration clarity, security compliance, and consistency across local development, staging, and production environments.

For M3, this registry manages:
- Call summary and brief generation triggers.
- Ask Anything retrieval boundaries and hybrid search indexing.
- AI Deep Researcher async job configurations.
- BullMQ worker concurrency limits and timeout constraints.
- LiteLLM provider routing and fallback order.
- Token billing cost limits and Sentry logging.

---

## 3. Usage Rules

### Core Rules
- **Doppler for Secrets:** All secrets, keys, and credentials must be stored in Doppler and injected at runtime.
- **No Hardcoded Secrets:** Storing secrets in source repositories, committed `.env` files, or Docker images is strictly prohibited.
- **Python Separation:** TypeScript product services make zero direct calls to external AI providers (such as OpenAI or Deepgram). They route all inference requests through the private internal Python FastAPI AI services layer.

### Configuration Rules
- **Fail Fast:** Required variables must fail validation at startup if missing, preventing half-bootstrapped deployments.
- **Explicit Defaults:** Optional variables must have fully documented default fallbacks in the application config.
- **Naming Stability:** Variable names must remain identical across all environments, with only their values varying.

### Security Rules
- **Rotation Cadence:** Production secrets must be rotated every 90 days.
- **PII Redaction:** Diagnostic logs and telemetry must filter and redact all PII data and key values prior to sending to Better Stack or Sentry.

---

## 4. Variable Registry Table

| Variable | Required | Example | Scope | Used By | Description |
|---|---|---|---|---|---|
| `NODE_ENV` | Yes | `development` | All Envs | API, Workers | Standard runtime mode selector (`development`, `staging`, `production`). |
| `APP_ENV` | Yes | `staging` | All Envs | API, Workers | Human-readable deployment environment name for telemetry and Slack alerts. |
| `M03_ENABLED` | Yes | `true` | All Envs | API Bootstrap | Master feature flag for M3 module enablement. |
| `M03_SUMMARY_ENABLED` | Yes | `true` | All Envs | Summary Flow | Enables background workers for AI Smart Summaries. |
| `M03_ASK_ENABLED` | Yes | `true` | All Envs | Ask Anything | Enables Ask Anything endpoints and RAG search pipelines. |
| `M03_RESEARCH_ENABLED` | Yes | `true` | All Envs | Deep Researcher | Enables long-running Deep Researcher async queues and REST APIs. |
| `DATABASE_URL` | Yes | `postgresql://...` | All Envs | API, Workers | PostgreSQL connection string for M3-owned tables under schema `m03_ai_summaries_genai` (e.g. `call_summaries`, `deal_briefs`, `account_briefs`, `research_reports`, `query_sessions`, `query_messages`, `summary_evidence_links`, `summary_history`). |
| `DATABASE_POOL_MAX` | No | `20` | All Envs | API, Workers | Max database connection pool size for M3 Prisma instances (Default: `20`). |
| `REDIS_URL` | Yes | `redis://redis:6379` | All Envs | BullMQ, Cache | Redis connection string for BullMQ queue state persistence. |
| `BULLMQ_PREFIX` | Yes | `rri` | All Envs | Workers | Queue namespace prefix to avoid multi-module or environment collisions. |
| `AI_SERVICE_URL` | Yes | `http://ai-service:8000` | All Envs | API, Workers | Base URL for the internal private FastAPI AI Services layer. |
| `AI_RESEARCH_ENDPOINT` | Yes | `/v1/generate-report` | AI Envs | Research Worker | Canonical endpoint on the FastAPI layer for Deep Researcher analysis. |
| `AI_SERVICE_TIMEOUT_MS_SYNC` | Yes | `30000` | All Envs | Ask, Summaries | Absolute timeout for synchronous AI calls (e.g. Ask Anything) to protect HTTP threads (Default: `30000`ms / 30s). |
| `AI_SERVICE_TIMEOUT_MS_ASYNC` | Yes | `300000` | All Envs | Research Worker | Timeout for async background worker tasks (Default: `300000`ms / 5 minutes). |
| `AI_SERVICE_RETRY_MAX` | Yes | `3` | All Envs | API, Workers | Maximum retry budget with backoff for transient AI layer errors (Default: `3`). |
| `LITELLM_BASE_URL` | Yes | `http://litellm:4000` | AI Envs | AI Services | URL for LiteLLM gateway if deployed separately. LiteLLM handles model abstraction. |
| `LITELLM_ROUTER_ENABLED` | Yes | `true` | AI Envs | AI Services | Enables model-routing, priority queuing, and failover behavior. |
| `OPENAI_API_KEY` | Yes | `***` | AI Envs | AI Services | Primary production LLM provider credential injected via Doppler. |
| `OPENAI_MODEL_SUMMARY` | Yes | `gpt-4o-mini` | AI Envs | Summary Worker | Lightweight, fast model for call summary and next-step extraction. |
| `OPENAI_MODEL_ASK` | Yes | `gpt-4o` | AI Envs | Ask Anything | Standard high-fidelity model for contextual RAG answers. |
| `OPENAI_MODEL_RESEARCH` | Yes | `gpt-4o` | AI Envs | Deep Researcher | High-reasoning model for complex cross-call synthesis. |
| `OPENAI_MODEL_EMBEDDINGS` | Yes | `text-embedding-3-small` | AI Envs | Retrieval Layer | Embedding model for generating vector representations. |
| `ANTHROPIC_API_KEY` | No | `***` | AI Envs | AI Services | Fallback provider credential managed through LiteLLM. |
| `LLM_FALLBACK_ENABLED` | Yes | `true` | AI Envs | AI Services | Enables automatic routing to secondary providers if primary model rate-limits. |
| `LLM_FALLBACK_ORDER` | No | `openai,anthropic` | AI Envs | AI Services | Priority list for model provider fallbacks. |
| `EMBEDDING_BATCH_SIZE` | No | `64` | All Envs | Retrieval Jobs | Batch size for indexing embedding requests (Default: `64`). |
| `EMBEDDING_MAX_TEXT_CHARS` | No | `8000` | All Envs | Retrieval Layer | Maximum character cap sent to embedding endpoint to prevent token errors. |
| `PGVECTOR_TOP_K_ASK` | Yes | `20` | All Envs | Ask Anything | Number of top semantic passages retrieved for Ask Anything (Default: `20`). |
| `PGVECTOR_TOP_K_RESEARCH` | Yes | `100` | All Envs | Deep Researcher | Extended semantic lookup budget for deep cross-interaction reports (Default: `100`). |
| `PGVECTOR_MIN_SCORE` | No | `0.72` | All Envs | Retrieval Layer | Minimum semantic similarity match threshold (Default: `0.72`). |
| `RETRIEVAL_ENABLE_HYBRID_SEARCH` | Yes | `true` | All Envs | Ask, Research | Master toggle to merge pgvector semantic search with Meilisearch keyword results. |
| `RETRIEVAL_MAX_SOURCE_CHUNKS` | Yes | `20` | All Envs | Prompt Assembly | Hard cap on evidence chunks injected into LLM prompt context (Default: `20`). |
| `RETRIEVAL_MAX_RESEARCH_BATCHES` | Yes | `10` | All Envs | Research Worker | Maximum parallel processing batches during research orchestration (Default: `10`). |
| `RETRIEVAL_DIVERSITY_ENFORCED` | No | `true` | All Envs | Research Flow | Ensures evidence selection is balanced across accounts, reps, and calls. |
| `MEILISEARCH_URL` | Yes | `http://meilisearch:7700` | All Envs | Retrieval/Search | Canonical URL for the Meilisearch server (Required for hybrid search). |
| `MEILISEARCH_API_KEY` | Yes | `***` | Non-local Envs| Retrieval/Search | Search API credential. (Required in production/staging; empty string locally). |
| `PROMPT_VERSION_SUMMARY` | Yes | `v1` | All Envs | Prompt Builders | Active version pin for call summary prompt templates. |
| `PROMPT_VERSION_ASK` | Yes | `v1` | All Envs | Prompt Builders | Active version pin for Ask Anything prompt templates. |
| `PROMPT_VERSION_RESEARCH` | Yes | `v1` | All Envs | Prompt Builders | Active version pin for Deep Researcher prompt templates. |
| `PROMPT_STRICT_JSON` | Yes | `true` | All Envs | AI Generation | Forces LLM structured JSON response validation. |
| `SUMMARY_QUEUE_CONCURRENCY` | Yes | `10` | All Envs | Summary Workers | BullMQ concurrency for call summary generations (Default: `10`). |
| `ASK_REQUEST_CONCURRENCY` | No | `25` | All Envs | API Layer | Soft API request throttling cap for Ask Anything (Default: `25`). |
| `RESEARCH_QUEUE_CONCURRENCY` | Yes | `3` | All Envs | Research Workers | Safe, low concurrency ceiling to manage GPU tokens and costs (Default: `3`). |
| `RESEARCH_JOB_MAX_RUNTIME_MS` | Yes | `900000` | All Envs | Research Workers | Maximum timeout before terminating runaway research jobs (Default: `900000`ms / 15m). |
| `RESEARCH_RETRY_MAX` | Yes | `3` | All Envs | Research Workers | Max worker-level retry budget for failed reports (Default: `3`). |
| `QUEUE_DLQ_ENABLED` | Yes | `true` | All Envs | BullMQ | Automatically routes exhausted failed jobs to the Dead-Letter Queue. |
| `SUMMARY_CONFIDENCE_MIN` | No | `0.70` | All Envs | Summary Flow | Threshold below which call summaries are flagged for review (Default: `0.70`). |
| `ASK_CONFIDENCE_MIN` | No | `0.70` | All Envs | Ask Flow | Threshold below which Ask Anything adds warning flags to answers (Default: `0.70`). |
| `RESEARCH_CONFIDENCE_MIN` | No | `0.70` | All Envs | Research Flow | Threshold below which research findings require caution warnings (Default: `0.70`). |
| `ENABLE_FLAGGED_FOR_REVIEW_WRITE_GUARD` | Yes | `true` | All Envs | API, Workers | Blocks CRM auto-sync for any generated summaries with confidence `< 0.70`. |
| `SENTRY_DSN` | Yes | `https://...` | All Envs | API, Workers | Global error tracking platform URL. |
| `LOG_LEVEL` | Yes | `info` | All Envs | API, Workers | Application logging level (`debug`, `info`, `warn`, `error`). |
| `BETTER_STACK_SOURCE_TOKEN` | No | `***` | All Envs | Log Collectors | Telemetry destination token for structured logging. |
| `GRAFANA_METRICS_ENABLED` | No | `true` | All Envs | Metrics | Toggles collection of BullMQ queue depths and latency metrics. |
| `AI_COST_BUDGET_DAILY_USD` | Yes | `250` | All Envs | AI services, Ops | Daily soft dollar ceiling per tenant for model token burn (Default: `250`). |
| `AI_COST_ALERT_THRESHOLD_PCT` | Yes | `80` | All Envs | Ops | Triggers email alerts to Ops when cost burn hits `80%` of daily budget. |
| `TOKEN_USAGE_LOGGING_ENABLED` | Yes | `true` | All Envs | AI Services | Logs exact prompt and response tokens consumed per request. |
| `TENANT_ISOLATION_ENFORCED` | Yes | `true` | All Envs | API, Workers | Forces strict application-level multi-tenant context validation. |
| `SESSION_RETENTION_DEFAULT_DAYS` | Yes | `90` | All Envs | API, Workers | Default deletion retention sweep limit for chat query sessions (Default: `90` days). |
| `DOPPLER_PROJECT` | Yes | `rri` | All Envs | Runtime Config | Identifies the targeted Doppler project. |
| `DOPPLER_CONFIG` | Yes | `staging` | All Envs | Runtime Config | Identifies the environment config folder in Doppler. |

---

## 5. Minimum Required Variables by Flow

### A. AI Smart Summaries
To successfully run post-call summaries, these variables must be present:
- `M03_ENABLED`
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

### B. Ask Anything (Hybrid RAG)
To run grounded question answering, these variables must be present:
- `M03_ENABLED`
- `M03_ASK_ENABLED`
- `DATABASE_URL`
- `AI_SERVICE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_ASK`
- `OPENAI_MODEL_EMBEDDINGS`
- `PGVECTOR_TOP_K_ASK`
- `RETRIEVAL_ENABLE_HYBRID_SEARCH`
- `MEILISEARCH_URL`
- `MEILISEARCH_API_KEY`
- `RETRIEVAL_MAX_SOURCE_CHUNKS`
- `PROMPT_VERSION_ASK`
- `AI_SERVICE_TIMEOUT_MS_SYNC`
- `TENANT_ISOLATION_ENFORCED` 

### C. AI Deep Researcher (Async Multi-Call Reports)
To execute async research reports, these variables must be present:
- `M03_ENABLED`
- `M03_RESEARCH_ENABLED`
- `DATABASE_URL`
- `REDIS_URL`
- `BULLMQ_PREFIX`
- `AI_SERVICE_URL`
- `AI_RESEARCH_ENDPOINT`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_RESEARCH`
- `PGVECTOR_TOP_K_RESEARCH`
- `RETRIEVAL_ENABLE_HYBRID_SEARCH`
- `MEILISEARCH_URL`
- `MEILISEARCH_API_KEY`
- `RETRIEVAL_MAX_RESEARCH_BATCHES`
- `PROMPT_VERSION_RESEARCH`
- `RESEARCH_QUEUE_CONCURRENCY`
- `RESEARCH_JOB_MAX_RUNTIME_MS`
- `RESEARCH_RETRY_MAX`
- `QUEUE_DLQ_ENABLED`
- `TENANT_ISOLATION_ENFORCED` 

### D. Cost & Observability
- `SENTRY_DSN`
- `LOG_LEVEL`
- `AI_COST_BUDGET_DAILY_USD`
- `AI_COST_ALERT_THRESHOLD_PCT`
- `TOKEN_USAGE_LOGGING_ENABLED` 

---

## 6. Verification Checklist

Before deploying environment variables, check the following:
- [ ] Variables are created in Doppler under the matching tenant/environment configuration.
- [ ] The Zod schema in `modules/m03-ai-summaries-genai/src/dto/` is updated to validate new variables.
- [ ] `M03_ENABLED` is checked during system bootstrap.
- [ ] `MEILISEARCH_URL` is set to the valid tenant endpoint.
- [ ] No raw credentials or keys are committed to repositories or Docker images.