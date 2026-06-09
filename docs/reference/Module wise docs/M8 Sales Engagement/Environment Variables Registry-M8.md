# Environment Variables Registry — M8 Sales Engagement

## 1. Document Control

- **Document Title:** Environment Variables Registry — M8 Sales Engagement
- **Module Name:** M8 Sales Engagement
- **Technical Workspace:** `modules/m08-sales-engagement/`
- **Owner:** Product Engineering — M8
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Core Module Enablement

These variables govern overall module activation and identity inside the platform service registry.

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| **`M08_ENABLED`** | **Yes** | `true` | Master enablement flag for the M8 Sales Engagement module. When `false`, all M8 API endpoints return `503 Service Unavailable` and queue consumers are suspended. |
| `SERVICE_NAME` | Yes | `m08-sales-engagement` | Logical service name for logs and trace exporter correlation. |
| `PORT` | Yes | `3000` | HTTP port where the M8 API server listens. |
| `M08_EMAIL_COMPOSER_ENABLED` | No | `true` | Enables or disables Email Composer endpoints and scheduling jobs. |
| `M08_ENGAGE_TODO_ENABLED` | No | `true` | Enables or disables Engage To-Do task endpoints and post-call task generation. |
| `M08_ORCHESTRATE_ENABLED` | No | `true` | Enables or disables GTM playbook definitions, steps completions, and play enrollments. |
| `M08_WORKFLOW_AUTOMATION_ENABLED` | No | `true` | Enables or disables branching event automation workflows and triggers evaluation. |

---

## 3. Database & Cache Connection Parameters

M8 uses PostgreSQL for operational configurations and task state storage, and Redis/BullMQ for scheduling cadences and background automation jobs.

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | | Standard PostgreSQL connection string used by Prisma. Resides under the schema namespace **`m08_sales_engagement`**. |
| `M08_PG_POOL_MAX` | No | `10` | Maximum connections allowed in the Postgres connection pool. |
| `REDIS_URL` | Yes | | Redis connection string used by BullMQ for task scheduling and delayed jobs. |
| `BULLMQ_PREFIX` | No | `ri-prod` | Shared queue namespace prefix to prevent cross-tenant/cross-environment conflicts. |

---

## 4. Email Composer & Sandboxing Settings

M8 Email Composer dispatches emails via delegated Gmail/Outlook OAuth2 accounts, or via SendGrid API.

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `M08_EMAIL_PROVIDER_MODE` | Yes | `oauth` | Outbound email routing mode (`oauth` for delegated accounts, `relay` for SendGrid API). |
| **`M08_SENDGRID_SANDBOX_MODE`** | **Yes** | `true` | **SendGrid Integration Sandboxing Rule:** If `true`, all outbound dispatches must use strictly isolated sandbox mode to prevent production outreach in non-prod. |
| `SENDGRID_API_KEY` | No | | SendGrid API key when provider mode is configured as `relay`. |
| `GOOGLE_CLIENT_ID` | No | | OAuth2 Client ID for Gmail delegated email integrations. |
| `GOOGLE_CLIENT_SECRET` | No | | OAuth2 Client Secret for Gmail delegated email integrations. |
| `MICROSOFT_CLIENT_ID` | No | | OAuth2 Client ID for Outlook / Microsoft Graph delegated email integrations. |
| `MICROSOFT_CLIENT_SECRET` | No | | OAuth2 Client Secret for Microsoft Graph delegated email integrations. |
| `M08_EMAIL_DRAFT_MODEL` | No | `gpt-4.1-mini` | Logical model alias utilized by the AI Services Layer for drafting emails. |
| `M08_EMAIL_MAX_TOKENS` | No | `1200` | Maximum length constraints for AI-generated outreach drafts. |

---

## 5. Task & Playbook Customization Controls

Governs task priority thresholds and GTM playbook settings.

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `M08_TASK_DEFAULT_PRIORITY` | No | `2` | Default priority (1 = High, 2 = Medium, 3 = Low) for manually generated rep tasks. |
| `M08_TASK_POSTCALL_AUTOCREATE_ENABLED` | Yes | `true` | Enables automatic follow-up tasks creation from `call.transcription.completed` events. |
| `M08_ORCHESTRATE_MAX_ACTIVE_PLAYS_PER_DEAL` | No | `3` | Maximum active playbooks allowed per deal simultaneously to avoid rep noise. |
| `M08_WORKFLOW_RUN_TIMEOUT_MS` | No | `60000` | Timeout threshold for branching workflow runner steps execution. |

---

## 6. Telemetry & Platform Notifications

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `AI_SERVICES_BASE_URL` | Yes | `http://ai-services:8000` | Base endpoint URL for synchronous AI generation queries. |
| `M08_INAPP_ALERTS_ENABLED` | No | `true` | Enables WebSocket alerts dispatch to seller frontends. |
| `LOG_LEVEL` | No | `info` | Structured logging verbosity level for M8 execution threads. |

---

## 7. Recommended local `.env` Example

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/revenue_intel?schema=m08_sales_engagement
REDIS_URL=redis://localhost:6379/0
AI_SERVICES_BASE_URL=http://localhost:8000
LOG_LEVEL=debug

M08_ENABLED=true
M08_EMAIL_COMPOSER_ENABLED=true
M08_ENGAGE_TODO_ENABLED=true
M08_ORCHESTRATE_ENABLED=true
M08_WORKFLOW_AUTOMATION_ENABLED=true
M08_SENDGRID_SANDBOX_MODE=true

GOOGLE_CLIENT_ID=google-oauth-client-id
GOOGLE_CLIENT_SECRET=google-oauth-client-secret
MICROSOFT_CLIENT_ID=ms-graph-client-id
MICROSOFT_CLIENT_SECRET=ms-graph-client-secret
```
