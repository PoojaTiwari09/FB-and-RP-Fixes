# Environment Variables Registry: M8

## Purpose

This document lists the environment variables required for the **M8 Sales Engagement** product area. In product terms, M8 includes **Email Composer**, **Engage To-Do**, **Orchestrate**, and **Workflow Automation**, but at the architecture level these features are split between **M-02 Sales Engagement** and **M-08 Execution and Automation**. 

The SAD says M8 is a product grouping only and that the actual backend ownership is divided across **M-02** and **M-08**, so this registry is organized the same way. It also follows the platform rule that secrets must be managed through **Doppler**, with no hardcoded credentials in code or images. 

## Boundary

- **M-02 Sales Engagement** owns:
  - Email Composer 
  - Engage To-Do 

- **M-08 Execution and Automation** owns:
  - Orchestrate 
  - Workflow Automation 

- Shared platform infrastructure such as **Supabase/PostgreSQL**, **Redis/BullMQ**, **JWT auth**, **AI Services**, and **Doppler secrets management** come from the platform architecture and are reused by both modules. 

## Naming rules

Use the following naming rules for M8 environment variables:
- Prefix module-owned variables with `M02_` or `M08_` where the variable is feature-specific.
- Use shared platform names only for truly shared dependencies such as `DATABASE_URL`, `REDIS_URL`, or `SUPABASE_JWT_SECRET`.
- Never create ambiguous names like `M8_API_KEY` because M8 is not a runtime backend module. 

## Shared variables

These variables are required because both M-02 and M-08 run inside the NestJS modular monolith, use PostgreSQL with tenant isolation, publish/consume BullMQ jobs, and depend on the shared platform runtime. 

| Variable | Required | Used By | Purpose | Example |
|---|---|---|---|---|
| `NODE_ENV` | Yes | M-02, M-08  | Standard runtime mode for NestJS service behavior.  | `production` |
| `PORT` | Yes | M-02, M-08  | HTTP port for the modular monolith API process.  | `3000` |
| `DATABASE_URL` | Yes | M-02, M-08  | Supabase PostgreSQL connection string used by Prisma and module schemas.  | `<secret>` |
| `DIRECT_URL` | Yes | M-02, M-08  | Direct DB connection for Prisma migrations/admin operations if separate from pooled URL. This is a practical platform convention aligned to Prisma deployments.  | `<secret>` |
| `REDIS_URL` | Yes | M-02, M-08  | Redis connection for BullMQ queues, retries, delayed jobs, and cache-backed event handling.  | `<secret>` |
| `SUPABASE_URL` | Yes | M-02, M-08  | Base URL for Supabase project services.  | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | Frontend + API integration  | Public Supabase key for client-auth flows where applicable.  | `<secret>` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | API only  | Service-role credential for privileged backend operations where allowed.  | `<secret>` |
| `SUPABASE_JWT_SECRET` | Yes | M-02, M-08  | JWT verification and platform auth guard support.  | `<secret>` |
| `APP_BASE_URL` | Yes | M-02, M-08 | Canonical application URL used in links, notifications, and callback generation. | `https://app.relanto.ai` |
| `INTERNAL_API_BASE_URL` | Yes | M-02, M-08  | Base URL for internal service-to-service or internal API routing inside the monolith boundary. | `http://localhost:3000` |
| `DOPPLER_ENV` | Yes | All modules  | Identifies current Doppler config/environment because the SAD mandates Doppler for secrets management.  | `prod` |
| `SENTRY_DSN` | Yes | M-02, M-08  | Error tracking for API/runtime failures.  | `<secret>` |
| `LOG_LEVEL` | Yes | M-02, M-08  | Structured logging verbosity for module runtime.  | `info` |

## AI and internal service variables

The SAD says product services must not call OpenAI directly from arbitrary frontend/runtime logic and that AI processing belongs in the Python AI Services Layer. M-02 still depends on AI-generated email drafts, and M-08 may depend on next-action style AI endpoints later, so internal AI routing variables are needed. 

| Variable | Required | Used By | Purpose | Example |
|---|---|---|---|---|
| `AI_SERVICES_BASE_URL` | Yes | M-02, M-08  | Internal base URL for Python AI Services Layer.  | `http://ai-services:8000` |
| `AI_SERVICES_TIMEOUT_MS` | Yes | M-02, M-08  | Timeout for internal AI service calls; should follow platform timeout rules.  | `30000` |
| `AI_SERVICES_API_KEY` | Recommended | M-02, M-08 | Shared internal auth token for API-to-AI service calls where implemented. | `<secret>` |
| `OPENAI_API_KEY` | Yes | AI Services used by M-02 email generation  | Primary LLM provider credential used via LiteLLM/OpenAI path.  | `<secret>` |
| `LITELLM_BASE_URL` | Recommended | AI Services  | LiteLLM gateway URL if used as the LLM routing layer.  | `http://litellm:4000` |
| `LITELLM_API_KEY` | Recommended | AI Services  | Auth token for LiteLLM gateway if enabled.  | `<secret>` |

## M-02 variables

These variables are for **Email Composer** and **Engage To-Do**, both owned by **M-02 Sales Engagement**. The SAD says M-02 owns `email_drafts`, `email_sends`, `email_templates`, `email_flows`, `email_flow_enrollments`, `tasks`, and `linkedin_activities` storage, and it emits `email.sent` while consuming `call.transcription.completed`. 

### Email provider variables

The product definition says Email Composer must compose, send, and schedule emails using Gmail and Outlook delegation rather than owning email infrastructure. The SAD explicitly says the platform uses **Gmail/Outlook OAuth2 only** and must not run its own email infrastructure. 

| Variable | Required | Used By | Purpose | Example |
|---|---|---|---|---|
| `M02_EMAIL_PROVIDER_MODE` | Yes | Email Composer | Select active provider mode or routing strategy. | `oauth` |
| `GOOGLE_CLIENT_ID` | Yes | M-02 Email Composer  | OAuth2 client ID for Gmail integration.  | `<secret>` |
| `GOOGLE_CLIENT_SECRET` | Yes | M-02 Email Composer  | OAuth2 client secret for Gmail integration.  | `<secret>` |
| `GOOGLE_OAUTH_REDIRECT_URI` | Yes | M-02 Email Composer  | Redirect URI for Gmail OAuth2 flow.  | `https://app.relanto.ai/api/auth/google/callback` |
| `MICROSOFT_CLIENT_ID` | Yes | M-02 Email Composer  | OAuth2 client ID for Outlook / Microsoft 365 integration.  | `<secret>` |
| `MICROSOFT_CLIENT_SECRET` | Yes | M-02 Email Composer  | OAuth2 client secret for Outlook / Microsoft 365 integration.  | `<secret>` |
| `MICROSOFT_TENANT_ID` | Recommended | M-02 Email Composer | Microsoft tenant configuration for app registration and delegated auth. | `<secret>` |
| `MICROSOFT_OAUTH_REDIRECT_URI` | Yes | M-02 Email Composer  | Redirect URI for Outlook OAuth2 flow.  | `https://app.relanto.ai/api/auth/microsoft/callback` |
| `M02_EMAIL_DEFAULT_PROVIDER` | Recommended | Email Composer | Default provider when multiple delegated accounts exist. | `gmail` |
| `M02_EMAIL_SEND_TIMEOUT_MS` | Recommended | Email Composer | Timeout for provider send requests. | `15000` |

### Email composition variables

Email Composer generates personalized drafts using interaction context and deal context. The SAD says M-02 may synchronously call the M-03 Revenue Graph public API for context lookup, and AI generation is a user-initiated acceptable-wait path. 

| Variable | Required | Used By | Purpose | Example |
|---|---|---|---|---|
| `M02_EMAIL_DRAFT_MODEL` | Recommended | Email Composer | Logical model alias used by AI Services for email generation. | `gpt-4.1-mini` |
| `M02_EMAIL_MAX_TOKENS` | Recommended | Email Composer | Upper bound for generated email length. | `1200` |
| `M02_EMAIL_DEFAULT_LANGUAGE` | Recommended | Email Composer | Default language for draft generation when user/workspace preference is absent. | `en` |
| `M02_EMAIL_SCHEDULE_QUEUE` | Yes | Email Composer  | BullMQ queue name for scheduled email jobs; the SAD includes `email.schedule` as a command queue.  | `email.schedule` |
| `M02_EMAIL_SEND_ENABLED` | Yes | Email Composer | Feature flag to allow provider send operations in current environment. | `true` |
| `M02_EMAIL_TRACK_OPENS` | Optional | Email Composer | Controls open-tracking behavior if supported in product scope. | `false` |
| `M02_EMAIL_TRACK_CLICKS` | Optional | Email Composer | Controls click-tracking behavior if supported in product scope. | `false` |

### Task and to-do variables

Engage To-Do centralizes rep work and M-02 must create a post-call follow-up task when `call.transcription.completed` arrives, with duplicate prevention using `sourceId = callId`. The SAD explicitly describes this behavior. 

| Variable | Required | Used By | Purpose | Example |
|---|---|---|---|---|
| `M02_TASKS_ENABLED` | Yes | Engage To-Do | Master feature flag for tasks endpoints and consumers. | `true` |
| `M02_TASK_DEFAULT_PRIORITY` | Recommended | Engage To-Do | Default priority for manually created tasks. | `2` |
| `M02_TASK_POSTCALL_AUTOCREATE_ENABLED` | Yes | Engage To-Do  | Enables automatic follow-up task creation from `call.transcription.completed`.  | `true` |
| `M02_TASK_POSTCALL_DEFAULT_TYPE` | Recommended | Engage To-Do | Default task type for post-call follow-up. | `email` |
| `M02_TASK_POSTCALL_DEFAULT_DUE_OFFSET_DAYS` | Recommended | Engage To-Do | Days after event for due date generation. | `1` |
| `M02_TASK_DEDUP_SOURCE_MODE` | Yes | Engage To-Do  | Dedupe strategy for source/sourceId-based task creation.  | `source_sourceId` |
| `M02_TASK_LIST_PAGE_SIZE_DEFAULT` | Recommended | Engage To-Do | Default page size for task listing API. | `20` |
| `M02_TASK_LIST_PAGE_SIZE_MAX` | Recommended | Engage To-Do | Maximum task list page size. | `100` |

### Flow and sequence variables

The product mapping includes automated email flows as part of Email Composer scope, and the SAD shows M-02 owns `email_flows` and `email_flow_enrollments`. BullMQ delayed jobs are also used for email scheduling. 

| Variable | Required | Used By | Purpose | Example |
|---|---|---|---|---|
| `M02_FLOWS_ENABLED` | Recommended | Email flows | Enable flow enrollment and step execution logic. | `true` |
| `M02_FLOW_WORKER_CONCURRENCY` | Recommended | Email flows | Worker concurrency for flow execution jobs. | `5` |
| `M02_FLOW_RETRY_ATTEMPTS` | Recommended | Email flows | Retry count for transient provider failures. | `3` |
| `M02_FLOW_DELAY_GRANULARITY_MINUTES` | Recommended | Email flows | Minimum supported delay interval for scheduled flow actions. | `15` |

### LinkedIn activity variables

The SAD shows M-02 owns `linkedin_activities`, and the M8 product positioning includes LinkedIn-related sales actions within rep execution flows. Even if a first release only logs activity, environment readiness should be explicit. 

| Variable | Required | Used By | Purpose | Example |
|---|---|---|---|---|
| `M02_LINKEDIN_ACTIVITY_ENABLED` | Optional | M-02 activities | Feature flag for LinkedIn activity logging surfaces. | `false` |
| `LINKEDIN_CLIENT_ID` | Optional | Future LinkedIn integration | OAuth/app credential for LinkedIn integration if approved later. | `<secret>` |
| `LINKEDIN_CLIENT_SECRET` | Optional | Future LinkedIn integration | Secret for LinkedIn integration if approved later. | `<secret>` |
| `LINKEDIN_REDIRECT_URI` | Optional | Future LinkedIn integration | OAuth redirect URI for LinkedIn app. | `https://app.relanto.ai/api/auth/linkedin/callback` |

## M-08 variables

These variables are for **Orchestrate** and **Workflow Automation**, both owned by **M-08 Execution and Automation**. The SAD says M-08 owns `sales_plays`, `play_enrollments`, `play_step_completions`, `workflows`, `workflow_runs`, and competitor alert tables, and it consumes `tracker.detection.created` and `deal.stage.changed`. 

### Orchestrate variables

The product mapping defines Orchestrate as GTM play definition, execution, and measurement, while the SAD says M-08 determines next-best-action based on conversation signals and rule-based triggers. 

| Variable | Required | Used By | Purpose | Example |
|---|---|---|---|---|
| `M08_ORCHESTRATE_ENABLED` | Yes | Orchestrate | Master feature flag for play APIs and event consumers. | `true` |
| `M08_ORCHESTRATE_AUTO_ENROLL_ENABLED` | Yes | Orchestrate | Enables event-driven play enrollment. | `true` |
| `M08_ORCHESTRATE_MAX_ACTIVE_PLAYS_PER_DEAL` | Recommended | Orchestrate | Guardrail to avoid noisy over-enrollment. | `3` |
| `M08_ORCHESTRATE_DEFAULT_STEP_DUE_OFFSET_DAYS` | Recommended | Orchestrate | Default due offset when a step does not specify one. | `1` |
| `M08_ORCHESTRATE_EVALUATION_BATCH_SIZE` | Recommended | Orchestrate | Number of active plays checked per event batch. | `100` |
| `M08_ORCHESTRATE_ENROLLMENT_DEDUPE_MODE` | Yes | Orchestrate  | Dedupe strategy for event-triggered enrollments.  | `tenant_play_deal_event` |
| `M08_NEXT_ACTION_ENABLED` | Recommended | Orchestrate  | Enables next-best-action derivation for active enrollments.  | `true` |

### Workflow Automation variables

Workflow Automation is described as complex branching automation for sales processes, and the SAD explicitly says M-08 uses delayed jobs for workflow automation and stores durable runs with `idempotencyKey` protection. 

| Variable | Required | Used By | Purpose | Example |
|---|---|---|---|---|
| `M08_WORKFLOW_AUTOMATION_ENABLED` | Yes | Workflow Automation | Master feature flag for workflow processing. | `true` |
| `M08_WORKFLOW_WORKER_CONCURRENCY` | Recommended | Workflow Automation  | Worker concurrency for trigger evaluation and action execution.  | `10` |
| `M08_WORKFLOW_MAX_RETRIES` | Recommended | Workflow Automation  | Retry attempts for transient failures.  | `3` |
| `M08_WORKFLOW_BACKOFF_MS` | Recommended | Workflow Automation | Base backoff duration for retries. | `30000` |
| `M08_WORKFLOW_DELAY_QUEUE` | Yes | Workflow Automation  | Queue name for delayed workflow actions; the SAD says delayed jobs are used by M-08 workflow automation.  | `workflow.delay` |
| `M08_WORKFLOW_RUN_TIMEOUT_MS` | Recommended | Workflow Automation | Max runtime before the run is marked failed by worker policy. | `60000` |
| `M08_WORKFLOW_FIRST_MATCH_ONLY` | Recommended | Workflow Automation | If true, stop after first matching branch. | `true` |
| `M08_WORKFLOW_IDEMPOTENCY_TTL_HOURS` | Optional | Workflow Automation | Optional TTL policy for run dedupe cache if a cache layer supplements DB uniqueness. | `72` |

### Alerting and notification variables

The SAD says M-08 evaluates competitor alert rules and may send Slack notifications and in-app alerts. That makes notification credentials and channel configuration part of M-08 runtime readiness. 

| Variable | Required | Used By | Purpose | Example |
|---|---|---|---|---|
| `M08_ALERTS_ENABLED` | Recommended | M-08 alerts | Master flag for real-time alert execution. | `true` |
| `SLACK_BOT_TOKEN` | Optional / Required if Slack enabled | M-08 alerts  | Slack API token for notification delivery.  | `<secret>` |
| `SLACK_SIGNING_SECRET` | Optional | M-08 alerts | Slack request verification secret for interactive flows if added later. | `<secret>` |
| `M08_SLACK_DEFAULT_CHANNEL` | Optional | M-08 alerts | Default Slack channel for competitor/risk alerts. | `#sales-alerts` |
| `M08_INAPP_ALERTS_ENABLED` | Recommended | M-08 alerts | Enable WebSocket/in-app notification publishing path. | `true` |
| `M08_ALERT_SEVERITY_THRESHOLD` | Optional | M-08 alerts | Minimum severity/confidence threshold for sending alerts. | `high` |

## Event and queue variables

Both M-02 and M-08 are heavily event-driven. The SAD defines BullMQ queue naming conventions, event queues, command queues, DLQs, retries, and delayed jobs, so queue names and worker tuning should be explicitly configurable. 

| Variable | Required | Used By | Purpose | Example |
|---|---|---|---|---|
| `QUEUE_CALL_TRANSCRIPTION_COMPLETED` | Yes | M-02 consumer  | Queue name for post-call follow-up event consumption.  | `call.transcription.completed` |
| `QUEUE_EMAIL_SENT` | Yes | M-02 producer / downstream consumers  | Queue name for outbound email sent event.  | `email.sent` |
| `QUEUE_TRACKER_DETECTION_CREATED` | Yes | M-08 consumer  | Queue name for tracker-driven orchestration and workflow triggers.  | `tracker.detection.created` |
| `QUEUE_DEAL_STAGE_CHANGED` | Yes | M-08 consumer  | Queue name for stage-driven play/workflow triggers.  | `deal.stage.changed` |
| `QUEUE_EMAIL_SCHEDULE` | Yes | M-02 scheduler  | Command queue for scheduled email execution.  | `email.schedule` |
| `QUEUE_WORKFLOW_DELAY` | Recommended | M-08 workflow | Delayed command queue for future workflow actions. | `workflow.delay` |
| `BULLMQ_PREFIX` | Recommended | Shared runtime | Shared queue prefix per environment/tenant scope where needed. | `ri-prod` |
| `BULLMQ_REMOVE_ON_COMPLETE` | Recommended | Shared runtime | Control queue cleanup for completed jobs. | `1000` |
| `BULLMQ_REMOVE_ON_FAIL` | Recommended | Shared runtime | Control queue cleanup for failed jobs. | `5000` |

## Security and compliance variables

The product area handles outreach and customer interaction workflows, so compliance and tenant safety matter. The SAD says CRM opt-out preferences and communication policies are enforced by platform compliance settings, and all writes must remain tenant-scoped. 

| Variable | Required | Used By | Purpose | Example |
|---|---|---|---|---|
| `ENCRYPTION_KEY` | Yes | M-02, M-08 | Secret for encrypting stored provider tokens or sensitive integration metadata if app-level encryption is used. | `<secret>` |
| `JWT_AUDIENCE` | Recommended | API auth | Audience validation for JWT checks. | `authenticated` |
| `JWT_ISSUER` | Recommended | API auth | Issuer validation for JWT checks. | `https://xyz.supabase.co/auth/v1` |
| `CORS_ALLOWED_ORIGINS` | Yes | API layer | Allowed frontend origins for browser calls. | `https://app.relanto.ai` |
| `RATE_LIMIT_ENABLED` | Recommended | API layer | Enable request throttling on sensitive endpoints. | `true` |
| `M02_COMPLIANCE_ENFORCEMENT_ENABLED` | Recommended | Email Composer / tasks | Prevent send or automation actions when outreach is blocked by policy. | `true` |
| `M08_AUTOMATION_COMPLIANCE_ENFORCEMENT_ENABLED` | Recommended | Workflow Automation | Prevent automations from executing disallowed outreach actions. | `true` |

## Suggested `.env` examples

### Minimal local development

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=<secret>
DIRECT_URL=<secret>
REDIS_URL=<secret>
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<secret>
SUPABASE_SERVICE_ROLE_KEY=<secret>
SUPABASE_JWT_SECRET=<secret>
APP_BASE_URL=http://localhost:3000
INTERNAL_API_BASE_URL=http://localhost:3000
AI_SERVICES_BASE_URL=http://localhost:8000
AI_SERVICES_TIMEOUT_MS=30000
OPENAI_API_KEY=<secret>
SENTRY_DSN=<secret>
LOG_LEVEL=debug

M02_EMAIL_SEND_ENABLED=false
M02_TASKS_ENABLED=true
M02_TASK_POSTCALL_AUTOCREATE_ENABLED=true
M08_ORCHESTRATE_ENABLED=true
M08_WORKFLOW_AUTOMATION_ENABLED=true

QUEUE_CALL_TRANSCRIPTION_COMPLETED=call.transcription.completed
QUEUE_EMAIL_SENT=email.sent
QUEUE_TRACKER_DETECTION_CREATED=tracker.detection.created
QUEUE_DEAL_STAGE_CHANGED=deal.stage.changed
QUEUE_EMAIL_SCHEDULE=email.schedule
```

### Production baseline

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<secret>
DIRECT_URL=<secret>
REDIS_URL=<secret>
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<secret>
SUPABASE_SERVICE_ROLE_KEY=<secret>
SUPABASE_JWT_SECRET=<secret>
APP_BASE_URL=https://app.relanto.ai
INTERNAL_API_BASE_URL=http://api:3000
AI_SERVICES_BASE_URL=http://ai-services:8000
AI_SERVICES_TIMEOUT_MS=30000
OPENAI_API_KEY=<secret>
DOPPLER_ENV=prod
SENTRY_DSN=<secret>
LOG_LEVEL=info

GOOGLE_CLIENT_ID=<secret>
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_OAUTH_REDIRECT_URI=https://app.relanto.ai/api/auth/google/callback
MICROSOFT_CLIENT_ID=<secret>
MICROSOFT_CLIENT_SECRET=<secret>
MICROSOFT_OAUTH_REDIRECT_URI=https://app.relanto.ai/api/auth/microsoft/callback

M02_EMAIL_SEND_ENABLED=true
M02_TASKS_ENABLED=true
M02_TASK_POSTCALL_AUTOCREATE_ENABLED=true
M02_EMAIL_SCHEDULE_QUEUE=email.schedule

M08_ORCHESTRATE_ENABLED=true
M08_ORCHESTRATE_AUTO_ENROLL_ENABLED=true
M08_WORKFLOW_AUTOMATION_ENABLED=true
M08_WORKFLOW_DELAY_QUEUE=workflow.delay

QUEUE_CALL_TRANSCRIPTION_COMPLETED=call.transcription.completed
QUEUE_EMAIL_SENT=email.sent
QUEUE_TRACKER_DETECTION_CREATED=tracker.detection.created
QUEUE_DEAL_STAGE_CHANGED=deal.stage.changed
QUEUE_EMAIL_SCHEDULE=email.schedule

M08_INAPP_ALERTS_ENABLED=true
SLACK_BOT_TOKEN=<secret>
M08_SLACK_DEFAULT_CHANNEL=#sales-alerts
```

## Rules for engineers

- Do not create env vars with the prefix `M8_` for runtime ownership because **M8 is a product grouping, not an implementation module**. Use `M02_` or `M08_` instead. 
- Keep secrets in **Doppler**, because the SAD explicitly says all env vars and secrets are managed there. 
- Do not add direct SMTP variables for Relanto-owned sending because the architecture explicitly says the platform does **not** own email infrastructure and must use **Gmail/Outlook OAuth2 delegation**. 
- Keep AI credentials routed through the approved AI Services architecture. The SAD is clear that product services must not embed AI model logic directly in TypeScript. 
- Any newly introduced external dependency should be backed by an ADR before it becomes part of the official environment registry. The SAD requires ADR approval before new technology enters the codebase. 

## Open items

The source documents define the architecture, integrations, and boundaries clearly, but they do **not** publish a finalized M8-specific env registry. Because of that, the following values should be confirmed during implementation review:
- final provider callback URLs per environment,
- final Slack/in-app alert transport strategy (Pending approval in [ADR-002: Platform Notification Service Abstraction](ADR-002-Platform-Notification-Service.md)),
- final queue names for workflow delayed execution,
- final model alias names used by Email Composer,
- and whether LinkedIn integration is enabled in the initial M-02 scope. 

