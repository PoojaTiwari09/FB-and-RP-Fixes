# Module README — M8 Sales Engagement

## 1. Document Control

- **Document Title:** Module Specification README — M8 Sales Engagement
- **Module Name:** M8 Sales Engagement
- **Technical Workspace:** `modules/m08-sales-engagement/`
- **Platform Lifecycle Stage:** Stage 5 — `Execute`
- **Owner:** Product Engineering — M8
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### What This Module Is
M8 **Sales Engagement** is the execution-facing productivity engine of the R-Revenue Intelligence platform. It provides role-based workspaces and automation triggers to streamline outbound communications, rep task management, guided GTM playbooks, and event-driven sales automations. 

By unifying day-to-day seller workflows, M8 ensures sales teams execute consistent follow-up motions, maintain outreach continuity, and reduce manual administrative burdens. M8 contains four key core product features:
1. **Email Composer:** Composing, personalizing, and scheduling outbound emails based on deal context.
2. **Engage To-Do:** Centralized, prioritized rep working task list.
3. **Orchestrate:** Defining, executing, and measuring structured GTM playbooks.
4. **Workflow Automation:** Complex branching event-driven automation rules.

---

## 3. What This Module Owns

### 3.1 Responsibilities
M8 is the execution and transactional hub for day-to-day outreach. It owns:
1. **Outbound Task & Queue Services:** Orchestrating task priority queues for rep workspaces.
2. **AI Email Personalization Pipelines:** Preparation, composition, scheduling, and delegated delivery of sales emails.
3. **Playbooks and Sequences Engine:** Enforcing and tracking state progressions of active deal plays.
4. **Event-Driven Branching Evaluator:** Executing automated workflow actions (notifications, enrollments, state requests) in response to platform signals.

### 3.2 Database Schema Ownership
M8 owns all tables under the `m08_sales_engagement` PostgreSQL schema namespace in **`snake_case`**:

- **Email Composer Tables:**
  - `m08_sales_engagement.email_drafts`: Stores AI-generated or manual outbound email drafts.
  - `m08_sales_engagement.email_sends`: Stores logs of outbound dispatch attempts.
  - `m08_sales_engagement.email_templates`: Stores reusable outreach template definitions.
  - `m08_sales_engagement.email_flows`: Stores sequenced email cadences.
  - `m08_sales_engagement.email_flow_enrollments`: Tracks deal/contact state inside cadences.
- **Engage To-Do Tables:**
  - `m08_sales_engagement.tasks`: Stores rep prioritized follow-up and outbound action items.
- **Orchestrate Tables:**
  - `m08_sales_engagement.sales_plays`: Stores GTM playbook structures, steps, and triggers.
  - `m08_sales_engagement.play_enrollments`: Tracks active deal progress inside sales plays.
  - `m08_sales_engagement.play_step_completions`: Logs rep completions of specific playbook steps.
- **Workflow Automation Tables:**
  - `m08_sales_engagement.workflows`: Stores tenant branching automation definitions.
  - `m08_sales_engagement.workflow_runs`: Logs run attempts and results with idempotency protections.

---

## 4. Upstream & Downstream Module Boundaries

M8 relies strictly on event-driven queues to execute actions and maintain boundaries:

### 4.1 Events Consumed (Upstream Signals)
- **`call.transcription.completed` (from M1 Capture & Transcription):**
  - Evaluates transcribed text to idempotently create AI-suggested email follow-up tasks inside `m08_sales_engagement.tasks`.
- **`tracker.detection.created` (from M2 Conversation Intelligence):**
  - Triggers competitor risk plays, automated alerts, and playbook enrollments.
- **`call.summary.generated` (from M2 Conversation Intelligence):**
  - Resolves active meeting items and play steps.
- **`deal.stage.changed` (from M10 Data & Compliance):**
  - Triggers stage-based play enrollments and automated branching workflows.

### 4.2 Events Emitted (Outbound Signals)
- **`email.sent`:**
  - Published to the platform event bus upon successful outbound email dispatch, notifying downstream modules like **M10 Data & Compliance** (to log activity history) and **M2 Conversation Intelligence** (for tracking).

---

## 5. Standard REST API Endpoints

All M8 endpoints reside under the unified prefix: `/api/v1/m08-sales-engagement`.

### 5.1 Email Composer
- `POST /api/v1/m08-sales-engagement/emails/generate` — Generate AI email drafts.
- `POST /api/v1/m08-sales-engagement/emails/send` — Dispatch outbound email immediately.
- `POST /api/v1/m08-sales-engagement/emails/schedule` — Enqueue delayed email sending via BullMQ.
- `GET /api/v1/m08-sales-engagement/emails` — Retrieve paginated sending history.
- `GET /api/v1/m08-sales-engagement/templates` — Fetch reusable templates.
- `POST /api/v1/m08-sales-engagement/templates` — Create custom email templates.

### 5.2 Engage To-Do
- `GET /api/v1/m08-sales-engagement/tasks` — Retrieve sorted prioritized tasks list.
- `POST /api/v1/m08-sales-engagement/tasks` — Create manual to-do actions.
- `PATCH /api/v1/m08-sales-engagement/tasks/:id` — Complete, snooze, or edit tasks.

### 5.3 Orchestrate
- `GET /api/v1/m08-sales-engagement/plays` — Retrieve active sales plays catalog.
- `POST /api/v1/m08-sales-engagement/plays` — Create new sales play definitions.
- `POST /api/v1/m08-sales-engagement/plays/:id/enroll` — Enroll a deal inside a playbook.
- `GET /api/v1/m08-sales-engagement/plays/enrollments` — Fetch rep active playbooks progress.
- `PATCH /api/v1/m08-sales-engagement/plays/enrollments/:id/step` — Complete active step in a play.

### 5.4 Workflow Automation
- `GET /api/v1/m08-sales-engagement/workflows` — Fetch all branching workflows.
- `POST /api/v1/m08-sales-engagement/workflows` — Register branching automation trigger rules.
- `GET /api/v1/m08-sales-engagement/workflows/:id/runs` — Fetch executions log.
- `PATCH /api/v1/m08-sales-engagement/workflows/:id` — Enable/disable active automation rules.

---

## 6. Critical Domain Rules

### 6.1 SendGrid Integration Sandboxing Rule
Outbound emails sent via M8 must strictly integrate with user connected Gmail or Outlook OAuth2 delegations. In other scenarios or when utilizing SendGrid API relays, all dispatches are **automatically validated and must use a strictly isolated sandbox mode** (`M08_SENDGRID_SANDBOX_MODE = true`) unless explicitly toggled for production by the organizational tenant settings.

### 6.2 Centralized Platform Notification Service Abstraction
To avoid direct Slack API coupling, M8 **does not interact with the Slack API directly**. Instead, all automation actions that request a notification dispatch publish a standardized `notification.alert.requested` event. This is consumed by a dedicated platform-level Notification Service, keeping M8 decoupled from external messaging networks.

### 6.3 Task Idempotency Guards
To prevent duplicate task creation from retried BullMQ events, any event consumer creating tasks (such as post-call follow-ups) must perform a deterministic check in `m08_sales_engagement.tasks` against the unique composite key `(tenant_id, source, source_id)`.
