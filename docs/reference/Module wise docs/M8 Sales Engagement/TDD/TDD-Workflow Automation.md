# Technical Design Document (TDD): Workflow Automation

## 1. Document Control

- **Document Title:** Technical Design Document — Workflow Automation
- **Feature Name:** Branching Sales Process Automations Engine (Workflow Automation)
- **Module Name:** M8 Sales Engagement
- **Workspace Directory:** `modules/m08-sales-engagement/`
- **Owner:** Product Engineering — M8
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### Business Problem
Outbound sales activities and administrative processes must react immediately to changing opportunity risks, competitor intrusions, or pipeline changes. Manual response is sluggish, leading to lost customer momentum and process deviations.

### What This Feature Does
**Workflow Automation** is an event-driven engine that automates complex branching sales processes based on business signals, evaluation rules, and scheduled executions.
- **Complex Branching rules:** Evaluates conditional branches from incoming event payloads.
- **Standardized Execution Steps:** Triggers actions like notifying channels, enrolling GTM plays, or updating status fields.
- **Platform Notifications Abstraction:** Decouples direct integrations with external systems (such as Slack) by publishing to a centralized Notification Service.
- **Durable Scheduling:** Uses BullMQ delayed jobs to schedule outreach sequences.

---

## 3. Scope & Dependencies

### In Scope
- Defining tenant branching process workflows.
- Tracking run histories inside `workflow_runs` to ensure replay safety.
- Consuming events to trigger rules:
  - **`tracker.detection.created`** from **M2 Conversation Intelligence**.
  - **`deal.stage.changed`** from **M10 Data & Compliance**.
- Publishing `notification.alert.requested` to let the Platform Notification Service route alerts, avoiding direct Slack token dependency inside M8.

### Out of Scope
- Interacting with Slack APIs directly; this is handled strictly by the Platform Notification Service.
- Resolving deal or contact databases; M8 reads deal metadata via REST APIs from **M10 Data & Compliance**.

---

## 4. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m08-sales-engagement`.

### GET /api/v1/m08-sales-engagement/workflows
- **Description:** Retrieve all automation workflows defined for the tenant.
- **Response Payload (`200 OK`):**
  ```json
  [
    {
      "workflowId": "uuid-workflow-1",
      "name": "Competitor mention escalation",
      "triggerEvent": "tracker.detection.created",
      "isActive": true
    }
  ]
  ```

### POST /api/v1/m08-sales-engagement/workflows
- **Description:** Register a new branching workflow automation.
- **Request Payload:**
  ```json
  {
    "name": "Late-stage risk escalation",
    "triggerEvent": "deal.stage.changed",
    "branches": [
      {
        "condition": {
          "field": "toStage",
          "operator": "equals",
          "value": "proposal"
        },
        "actions": [
          {
            "type": "notify",
            "params": {
              "channel": "slack",
              "severity": "high"
            }
          }
        ]
      }
    ],
    "isActive": true
  }
  ```

### GET /api/v1/m08-sales-engagement/workflows/:id/runs
- **Description:** Fetch execution history of a specific workflow.

---

## 5. Database Schema Design

All tables reside under the `m08_sales_engagement` PostgreSQL schema namespace.

```sql
-- 1. Workflows Definition Table
CREATE TABLE m08_sales_engagement.workflows (
  workflow_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  name                VARCHAR(255) NOT NULL,
  trigger_event       VARCHAR(100) NOT NULL, -- tracker.detection.created | deal.stage.changed
  branches            JSONB NOT NULL, -- Array: [{condition, actions: [{type, params}]}]
  actions             JSONB,
  created_by          UUID NOT NULL,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Workflow Runs Table
CREATE TABLE m08_sales_engagement.workflow_runs (
  run_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id         UUID REFERENCES m08_sales_engagement.workflows(workflow_id),
  tenant_id           UUID NOT NULL,
  payload             JSONB NOT NULL,
  status              VARCHAR(50) NOT NULL DEFAULT 'running', -- running | completed | failed
  idempotency_key     VARCHAR(255) UNIQUE NOT NULL, -- Unique hash to prevent duplicate run execution
  error_message       TEXT,
  started_at          TIMESTAMPTZ DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

-- Indexing for history queries
CREATE INDEX idx_workflow_runs_lookup ON m08_sales_engagement.workflow_runs (tenant_id, workflow_id, started_at DESC);
```

---

## 6. Functional & Governance Logic

### Platform Notification Service Triggering Rules
To isolate credentials and keep modules decoupled:
1. When a workflow branch fires a `notify` action:
   - **No Direct Slack Calls:** M8 does **not** store Slack tokens or connect with Slack APIs.
   - **Event Publication:** The runner structures and enqueues a standard `notification.alert.requested` event to the platform queue:
     ```json
     {
       "eventId": "uuid-event-99",
       "tenantId": "uuid-tenant-1",
       "userId": "uuid-rep-12",
       "channel": "slack",
       "template": "competitor_alert",
       "context": {
         "dealId": "uuid-deal-34",
         "message": "Competitor Acme detected in call transcription."
       }
     }
     ```
2. **Platform Handling:** The platform-level Notification Service consumes the event and executes delivery.

### Run Idempotency Guard
1. **Idempotency Hash:** Upon receiving a trigger event, the engine constructs a unique `idempotency_key` string (e.g., `tenant_id:workflow_id:trigger_event:event_id`).
2. **Duplicate Interception:** Before launching evaluation thread, a transaction checks `m08_sales_engagement.workflow_runs` for the unique `idempotency_key`.
3. **Execution Block:** If duplicate exists, processing halts, preventing duplicate notifications or playbooks enrollments from enqueued events retries.