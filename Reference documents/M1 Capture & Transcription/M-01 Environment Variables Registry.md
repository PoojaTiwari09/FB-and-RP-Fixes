# Doc #18 — M-01 Environment Variables Registry

## 1. Document Control

- **Document Title:** Environment Variables Registry — M-01 Capture & Transcription
- **Module Name:** M-01 Capture & Transcription
- **Document ID:** DOC-18-M01-ENV-REGISTRY
- **Version:** v0.1
- **Status:** Draft
- **Owner:** Backend Lead
- **Security Reviewer:** Security Owner
- **Deployment / Secrets Owner:** DevOps Lead
- **Approver for env var changes:** Tech Lead + Security Owner for secrets, DevOps Lead for runtime and deployment changes.
- **Last Updated:** 2026-04-29
- **Related Secret Management System:** Doppler.
- **Related Deployment Platform:** Railway for current Phase 1–2 hosting, AWS ECS/Fargate later if scale triggers are met.

## 2. Purpose

- This registry is the single approved reference for all environment variables used by **M-01 Capture & Transcription**.
- It exists to prevent random env var creation, naming drift, hidden secrets, and undocumented runtime dependencies.
- M-01 covers call/audio ingestion, webhook handling, connector registration, transcription flow, transcript persistence, and AI CRM field extraction orchestration.
- Use this file before:
  - adding a new env var
  - changing an env var name
  - introducing a new secret
  - modifying deployment config
  - reviewing startup or infra failures.
- If a variable is used in code but missing from this registry, that is a documentation and governance bug and must be fixed in the same PR.

## 3. Usage Rules

### 3.1 Naming convention

- Use uppercase snake case only, for example `M01_TRANSCRIPTION_TIMEOUT_MS`.
- Prefer clear prefixes by domain:
  - `APP_` for shared app basics
  - `DB_` for database
  - `REDIS_` or `BULLMQ_` for queue config
  - `STORAGE_` or `SUPABASE_` for object storage
  - `WEBHOOK_` or provider-specific names for webhook secrets
  - `AI_`, `ASR_`, `WHISPER_`, `ASSEMBLYAI_` for transcription / extraction services
  - `CRM_`, `SALESFORCE_`, `HUBSPOT_`, `DYNAMICS_` for CRM-related config
  - `SENTRY_`, `GRAFANA_`, `BETTERSTACK_` for observability
  - `FF_` or `FEATURE_` for feature flags.

### 3.2 Secret vs non-secret classification

- **Secret:** API keys, OAuth secrets, webhook secrets, service-role keys, database passwords, signed internal service tokens.
- **Non-secret:** service names, URLs, timeouts, bucket names, retry counts, boolean feature flags.
- Secrets must live in Doppler or approved secret storage only, never in source control, container images, or pasted into README files.

### 3.3 Required vs optional

- **Required** means startup or critical flow fails without it.
- **Optional** means the system can run with a documented default or with the related feature disabled.
- Optional variables must still be documented here if referenced by code.

### 3.4 Default value policy

- Avoid silent defaults for security-sensitive variables.
- Defaults are acceptable for:
  - local development convenience
  - retry counts
  - timeouts
  - feature flags defaulting to `false`
  - log formatting controls.
- If a default exists in code, it must match this file exactly.

### 3.5 Change approval rule

- No undocumented env vars may be introduced in code.
- Any new secret requires review by Security Owner or DevOps Lead.
- Any new provider config requires Tech Lead approval if it changes architecture or approved tooling.
- Any env var name change must include:
  - code update
  - deployment config update
  - registry update
  - migration / rollout note.

## 4. Runtime Groups

### 4.1 Core app config

- Service identity and runtime mode.
- Public/internal base URLs.
- Request timeout and startup controls.

### 4.2 Database and queue

- PostgreSQL connection values.
- Redis / BullMQ connection and queue behavior settings.

### 4.3 Storage

- Supabase or object storage URL, bucket, access key, service role, retention controls.

### 4.4 Webhook security

- HMAC secrets for Zoom, Teams, Google Meet, and dialer integrations.

### 4.5 Connector providers

- Source onboarding and provider auth values required for meeting / telephony integrations.

### 4.6 AI services

- Internal transcription-service endpoint.
- Internal CRM extraction endpoint.
- Timeout, retry, and fallback controls.

### 4.7 ASR provider config

- Whisper primary config.
- AssemblyAI fallback config.
- Diarization-related toggles if needed.

### 4.8 CRM integrations

- Salesforce / HubSpot / Dynamics auth and enablement config, only if M-01 participates in approved AI field push path.

### 4.9 Observability

- Sentry, logging, metrics, uptime hooks, and correlation IDs.

### 4.10 Feature flags

- Provider enablement.
- Fallback enablement.
- Auto-push or review gating behavior.

## 5. Variable Registry Table

> Fill every row. Every M-01 env var should appear here exactly once.

| Variable Name | Purpose | Used By | Required | Secret | Default | Example Format | Environment Scope | Source of Truth | Owner |
|---|---|---|---|---|---|---|---|---|---|
| `APP_SERVICE_NAME` | Service identifier for logs, metrics, and runtime labeling. | NestJS M-01 API, workers | Yes | No | `m01-capture-transcription` | `m01-capture-transcription` | local, dev, staging, prod | Doppler config + app bootstrap | Backend Lead |
| `NODE_ENV` | Runtime mode for local / test / production behavior. | NestJS runtime | Yes | No | `development` locally | `development`, `test`, `production` | all | deployment env | Backend Lead |
| `APP_BASE_URL` | Base URL for externally reachable M-01 service routes. | Webhook callbacks, logs, docs, ops | Yes | No | none | `https://api.example.com` | dev, staging, prod | deployment config | DevOps Lead |
| `INTERNAL_API_BASE_URL` | Internal service URL used for internal callbacks and service-to-service calls. | NestJS, workers | Yes | No | none | `http://api:3000` | local, dev, staging, prod | deployment config | DevOps Lead |
| `DB_URL` | Primary PostgreSQL connection string for M-01 tables. | NestJS API, workers, Prisma | Yes | Yes | none | `postgresql://user:pass@host:5432/db` | all | Doppler | DevOps Lead |
| `REDIS_URL` | Redis connection string used by BullMQ and related queue flows. | Workers, event bus, queue publishers | Yes | Yes | none | `redis://user:pass@host:6379` | all | Doppler | DevOps Lead |
| `BULLMQ_PREFIX` | Queue namespace prefix to separate environments safely. | Queue publishers / consumers | Yes | No | `ri` | `ri-dev` | all | app config | Backend Lead |
| `BULLMQ_DEFAULT_JOB_ATTEMPTS` | Default retry count for M-01 async jobs. | Queue workers | No | No | `3` | `3` | all | code + registry | Backend Lead |
| `BULLMQ_DEFAULT_BACKOFF_MS` | Default queue backoff base for retries. | Queue workers | No | No | `5000` | `5000` | all | code + registry | Backend Lead |
| `SUPABASE_URL` | Supabase project URL used for storage and managed services. | Storage client | Yes | No | none | `https://xyz.supabase.co` | all | Doppler / platform config | DevOps Lead |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for storage operations and trusted backend access. | M-01 storage service | Yes | Yes | none | `<secret>` | all | Doppler | Security Owner |
| `STORAGE_BUCKET_RECORDINGS` | Bucket name for captured call recordings before transcript completion. | Storage service, workers | Yes | No | `recordings` | `recordings` | all | app config | Backend Lead |
| `M01_AUDIO_RETENTION_DAYS` | Auto-delete retention for raw audio after transcript is safely stored. | Cleanup jobs | No | No | `7` | `7` | all | code + registry | Backend Lead |
| `ZOOM_WEBHOOK_SECRET` | HMAC secret for Zoom webhook verification. | `/api/v1/ingestion/webhook/zoom` | Yes if Zoom enabled | Yes | none | `<secret>` | dev, staging, prod | Doppler | Security Owner |
| `TEAMS_WEBHOOK_SECRET` | HMAC secret for Microsoft Teams webhook verification. | `/api/v1/ingestion/webhook/teams` | Yes if Teams enabled | Yes | none | `<secret>` | dev, staging, prod | Doppler | Security Owner |
| `MEET_WEBHOOK_SECRET` | HMAC secret for Google Meet webhook verification. | `/api/v1/ingestion/webhook/meet` | Yes if Meet enabled | Yes | none | `<secret>` | dev, staging, prod | Doppler | Security Owner |
| `DIALER_WEBHOOK_SECRET` | HMAC secret for telephony / dialer webhook verification. | `/api/v1/ingestion/webhook/dialer` | Yes if dialer enabled | Yes | none | `<secret>` | dev, staging, prod | Doppler | Security Owner |
| `CLOUDFLARE_WEBHOOK_RATE_LIMIT_ENABLED` | Enables hardened rate limiting assumptions for public webhook paths. | Edge-aware app config / ops docs | No | No | `true` | `true` / `false` | staging, prod | deployment config | DevOps Lead |
| `TRANSCRIPTION_SERVICE_URL` | Internal FastAPI transcription service base URL. | M-01 transcription worker | Yes | No | none | `http://transcription-service:8000` | all | deployment config | AI Lead |
| `TRANSCRIPTION_SERVICE_TIMEOUT_MS` | Request timeout for transcription-service calls. | Transcription worker | No | No | `300000` | `300000` | all | code + registry | AI Lead |
| `TRANSCRIPTION_SERVICE_AUTH_TOKEN` | Internal shared token or service auth secret for transcription API calls. | NestJS -> FastAPI internal auth | Yes | Yes | none | `<secret>` | all | Doppler | Security Owner |
| `AI_EXTRACTOR_SERVICE_URL` | Internal FastAPI endpoint base URL for CRM field extraction. | Extraction worker | Yes if extractor enabled | No | none | `http://ai-services:8001` | all | deployment config | AI Lead |
| `AI_EXTRACTOR_TIMEOUT_MS` | Timeout for extraction requests. | Extraction worker | No | No | `30000` | `30000` | all | code + registry | AI Lead |
| `AI_EXTRACTOR_AUTH_TOKEN` | Internal auth token for extraction endpoint. | NestJS -> AI services auth | Yes if extractor enabled | Yes | none | `<secret>` | all | Doppler | Security Owner |
| `WHISPER_PROVIDER_ENABLED` | Enables Whisper as primary ASR route. | Transcription service config | No | No | `true` | `true` / `false` | all | AI service config | AI Lead |
| `OPENAI_API_KEY` | Whisper / OpenAI provider key routed from Python service side. | Transcription service or AI service | Yes if OpenAI-backed ASR / LLM path used | Yes | none | `<secret>` | all | Doppler | AI Lead |
| `ASSEMBLYAI_API_KEY` | Fallback ASR provider key. | Transcription service | Yes if fallback enabled | Yes | none | `<secret>` | all | Doppler | AI Lead |
| `ASSEMBLYAI_FALLBACK_ENABLED` | Enables AssemblyAI fallback when Whisper fails or is degraded. | Transcription service / worker policy | No | No | `true` | `true` / `false` | all | AI service config | AI Lead |
| `M01_EXTRACTION_CONFIDENCE_REVIEW_THRESHOLD` | Threshold below which extracted CRM fields are flagged for review. | Extraction worker | No | No | `0.80` | `0.80` | all | code + registry | AI Lead |
| `M01_EXTRACTION_CONFIDENCE_EXCLUDE_THRESHOLD` | Threshold below which extracted CRM fields are excluded from push. | Extraction worker | No | No | `0.70` | `0.70` | all | code + registry | AI Lead |
| `M01_AUTO_PUSH_CRM_FIELDS_ENABLED` | Controls whether approved extracted fields can continue into downstream CRM push path. | Extraction orchestration / downstream integration gate | No | No | `false` | `true` / `false` | staging, prod | feature flag config | Tech Lead |
| `SALESFORCE_CLIENT_ID` | Salesforce connector client ID for CRM-related writeback flows. | CRM integration layer | Yes if Salesforce enabled | Yes | none | `<secret>` | staging, prod | Doppler | Integrations Owner |
| `SALESFORCE_CLIENT_SECRET` | Salesforce connector client secret. | CRM integration layer | Yes if Salesforce enabled | Yes | none | `<secret>` | staging, prod | Doppler | Integrations Owner |
| `HUBSPOT_CLIENT_ID` | HubSpot connector client ID. | CRM integration layer | Yes if HubSpot enabled | Yes | none | `<secret>` | staging, prod | Doppler | Integrations Owner |
| `HUBSPOT_CLIENT_SECRET` | HubSpot connector client secret. | CRM integration layer | Yes if HubSpot enabled | Yes | none | `<secret>` | staging, prod | Doppler | Integrations Owner |
| `DYNAMICS_CLIENT_ID` | Microsoft Dynamics 365 connector client ID. | CRM integration layer | Yes if Dynamics enabled | Yes | none | `<secret>` | staging, prod | Doppler | Integrations Owner |
| `DYNAMICS_CLIENT_SECRET` | Microsoft Dynamics 365 connector client secret. | CRM integration layer | Yes if Dynamics enabled | Yes | none | `<secret>` | staging, prod | Doppler | Integrations Owner |
| `SENTRY_DSN` | Sentry connection string for exception monitoring. | NestJS API, workers, Python services | Yes in staging/prod | Yes | none | `https://...@sentry.io/...` | staging, prod | Doppler | DevOps Lead |
| `BETTERSTACK_SOURCE_TOKEN` | Token for log shipping / uptime integration where applicable. | Logging pipeline | No | Yes | none | `<secret>` | staging, prod | Doppler | DevOps Lead |
| `GRAFANA_METRICS_ENABLED` | Enables metrics export / dashboard integration. | Metrics middleware / workers | No | No | `true` | `true` / `false` | staging, prod | deployment config | DevOps Lead |
| `FF_M01_CONNECTORS_ENABLED` | Feature flag to enable connector onboarding UI/API. | API routes / frontend integration | No | No | `true` | `true` / `false` | all | feature flag config | Product + Tech Lead |
| `FF_M01_EXTRACTION_ENABLED` | Feature flag to enable AI Data Extractor flow. | Event consumers / workers | No | No | `true` | `true` / `false` | all | feature flag config | Product + AI Lead |
| `FF_M01_ASSEMBLYAI_FALLBACK_ENABLED` | Feature flag for fallback ASR route. | Transcription orchestration | No | No | `true` | `true` / `false` | all | feature flag config | AI Lead |

> Add more rows here as needed. Do not create a second registry table elsewhere in the module docs.

## 6. Minimum Required Variables by Flow

### 6.1 Local development

Minimum to boot M-01 locally:
- `APP_SERVICE_NAME`
- `NODE_ENV`
- `DB_URL`
- `REDIS_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STORAGE_BUCKET_RECORDINGS`
- `TRANSCRIPTION_SERVICE_URL`
- `TRANSCRIPTION_SERVICE_AUTH_TOKEN`.

### 6.2 Webhook ingestion

Minimum to test provider webhook to queued job:
- local development set above
- one provider secret such as `ZOOM_WEBHOOK_SECRET`
- `APP_BASE_URL`
- `BULLMQ_PREFIX`.

### 6.3 Transcription processing

Minimum to run webhook to transcript path end to end:
- webhook ingestion set above
- `TRANSCRIPTION_SERVICE_TIMEOUT_MS`
- `WHISPER_PROVIDER_ENABLED`
- `OPENAI_API_KEY`
- optionally `ASSEMBLYAI_API_KEY`
- optionally `ASSEMBLYAI_FALLBACK_ENABLED`.

### 6.4 CRM extraction push

Minimum to run transcript to extracted fields path:
- transcription processing set above
- `AI_EXTRACTOR_SERVICE_URL`
- `AI_EXTRACTOR_AUTH_TOKEN`
- `AI_EXTRACTOR_TIMEOUT_MS`
- `M01_EXTRACTION_CONFIDENCE_THRESHOLD`
- `FF_M01_EXTRACTION_ENABLED`
- if downstream auto-push is enabled, relevant CRM client credentials too.

### 6.5 Production observability

Minimum for safe production operations:
- `SENTRY_DSN`
- `BETTERSTACK_SOURCE_TOKEN` if logging pipeline uses it
- `GRAFANA_METRICS_ENABLED`
- all required provider secrets
- all required internal service auth tokens.

## 7. Rotation and Security Notes

### 7.1 Secret rotation

- Rotate webhook secrets on provider-side schedule or immediately after suspected leak.
- Rotate CRM OAuth secrets per provider policy and after security incidents.
- Rotate storage service-role keys and internal auth tokens through Doppler-controlled rollout, not manual ad hoc replacement.

### 7.2 Access control

- Only approved owners should access production secrets in Doppler.
- Developers should use least-privilege access and environment-specific scopes.
- Production secrets must not be copied into local `.env` files unless explicitly approved for incident debugging.

### 7.3 Incident handling

- If a secret is exposed:
  - revoke or rotate immediately
  - audit recent usage
  - review affected logs and webhook traffic
  - document incident and remediation owner.
- If webhook verification starts failing unexpectedly:
  - verify provider-side secret
  - verify recent rotation
  - verify raw body handling
  - verify no accidental env mismatch between app and deployment.

### 7.4 Expired key process

- Mark the affected integration degraded.
- Disable related feature flag if needed.
- Re-auth or reissue credentials.
- Confirm recovery in staging before production re-enable.

## 8. Validation Checklist

Use this checklist during PR review, release review, and incident review.

- [ ] Variable exists in this registry.
- [ ] Variable name follows approved naming convention.
- [ ] Secret / non-secret classification is correct.
- [ ] Required / optional classification is correct.
- [ ] Default value is documented or intentionally absent.
- [ ] Variable is loaded and validated at startup where applicable.
- [ ] No secret is hardcoded in repo, tests, images, or docs.
- [ ] No unused env vars remain in code or deployment config.
- [ ] Any new provider variable has approved owner and source of truth.
- [ ] Any env var change includes deployment and Doppler update plan.
- [ ] Feature-flagged variables default safely when missing.
- [ ] Local, staging, and production scope are explicitly understood.

## 9. Related Files

- `m1-readme.md`
- `TDD/TDD-Call-Transcription.md`
- `TDD/Native Connectors.md`
- `TDD/AI Data Extractor.md`
- `m1-sequence diagram.md`
- `M-01 Environment Variables Registry.md`.

## 10. Notes for Maintainers

- This file is the registry, not the place to explain business logic.
- Keep each variable documented once here and referenced elsewhere if needed.
- If a variable is shared across modules, define the owning shared registry separately and link it here instead of duplicating conflicting definitions.
- Freshers should be able to answer three questions from this file quickly:
  - what variables are needed
  - which ones are secrets
  - who owns each one.
...
