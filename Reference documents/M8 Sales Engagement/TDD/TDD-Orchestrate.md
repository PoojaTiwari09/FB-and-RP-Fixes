# Technical Design Document (TDD): Orchestrate

## 1. Document Control

- **Document Title:** Technical Design Document — Orchestrate
- **Feature Name:** Revenue Workflow & Playbook Orchestrator (Orchestrate)
- **Module Name:** M8 Sales Engagement
- **Workspace Directory:** `modules/m08-sales-engagement/`
- **Owner:** Product Engineering — M8
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### Business Problem
Sales leaders define complex go-to-market strategies (GTM plays) to navigate competitive threats and late-stage deal risks. However, converting these static strategies into structured, actionable rep steps is highly manual, leading to poor play adoption and unmeasured business impacts.

### What This Feature Does
**Orchestrate** translates organizational sales strategies into interactive, guided execution steps inside the rep workspace.
- **Structured GTM Playbooks:** Defines standard step arrays, timing offsets, and trigger configurations.
- **Event-Driven Auto-Enrollments:** Monitors platform business signals to dynamically enroll opportunities.
- **Adoptability Dashboards:** Measures step completion cycles and progress outcomes to map play adoption and outcome progression.

---

## 3. Scope & Dependencies

### In Scope
- Defining tenant GTM sales plays.
- Enrolling opportunities manually or via automated triggers.
- Consuming events to activate playbooks:
  - **`tracker.detection.created`** from **M2 Conversation Intelligence** (e.g., competitor mentions).
  - **`deal.stage.changed`** from **M10 Data & Compliance** (e.g., deal entering proposal phase).
- Idempotently managing enrollment events to safeguard against duplicate active playbooks.

### Out of Scope
- Creating outbound rep tasks; that belongs to **Engage To-Do**.
- Storing CRM deals/opportunities; M8 reads deal metadata via public APIs from **M10 Data & Compliance**.

---

## 4. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m08-sales-engagement`.

### GET /api/v1/m08-sales-engagement/plays
- **Description:** Retrieve all GTM playbooks defined for the tenant.
- **Response Payload (`200 OK`):**
  ```json
  [
    {
      "playId": "uuid-play-1",
      "name": "Late-stage competitive defense play",
      "isActive": true,
      "steps": [
        {
          "stepNum": 1,
          "actionType": "review_signal",
          "description": "Review detected competitor mentions and deal context",
          "dueOffsetDays": 0
        }
      ]
    }
  ]
  ```

### POST /api/v1/m08-sales-engagement/plays
- **Description:** Register a new sales playbook with trigger criteria.
- **Request Payload:**
  ```json
  {
    "name": "Proposal-stage executive alignment play",
    "steps": [
      {
        "stepNum": 1,
        "actionType": "exec_outreach",
        "description": "Engage executive sponsor before proposal review",
        "dueOffsetDays": 1
      }
    ],
    "triggerConditions": [
      {
        "eventType": "deal.stage.changed",
        "field": "toStage",
        "operator": "equals",
        "value": "proposal"
      }
    ],
    "isActive": true
  }
  ```

### PATCH /api/v1/m08-sales-engagement/plays/enrollments/:id/step
- **Description:** Mark active playbook step as completed by the rep.
- **Request Payload:**
  ```json
  {
    "stepId": 1,
    "notes": "Completed outreach. Executive confirmed review schedule."
  }
  ```

---

## 5. Database Schema Design

All tables reside under the `m08_sales_engagement` PostgreSQL schema namespace.

```sql
-- 1. Sales Plays Definitions Table
CREATE TABLE m08_sales_engagement.sales_plays (
  play_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  name                VARCHAR(255) NOT NULL,
  steps               JSONB NOT NULL, -- Array: [{stepNum, actionType, description, dueOffsetDays}]
  trigger_conditions  JSONB NOT NULL, -- Array: [{eventType, field, operator, value}]
  created_by          UUID NOT NULL,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Play Enrollments Table
CREATE TABLE m08_sales_engagement.play_enrollments (
  enrollment_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  play_id             UUID REFERENCES m08_sales_engagement.sales_plays(play_id),
  deal_id             UUID NOT NULL,
  user_id             UUID NOT NULL,
  current_step        INTEGER DEFAULT 1,
  status              VARCHAR(50) NOT NULL DEFAULT 'active', -- active | completed | paused | exited
  trigger_event_id    UUID, -- Links to the exact event ID causing enrollment
  enrolled_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Play Step Completions Table
CREATE TABLE m08_sales_engagement.play_step_completions (
  completion_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  enrollment_id       UUID REFERENCES m08_sales_engagement.play_enrollments(enrollment_id),
  step_id             INTEGER NOT NULL,
  completed_by        UUID NOT NULL,
  completed_at        TIMESTAMPTZ DEFAULT NOW(),
  notes               TEXT
);

-- Unique constraint for enrollment idempotency safety
ALTER TABLE m08_sales_engagement.play_enrollments
  ADD CONSTRAINT uq_play_enrollments_idempotency UNIQUE (tenant_id, play_id, deal_id, trigger_event_id);

-- Indexes for search speed
CREATE INDEX idx_play_enrollments_lookup ON m08_sales_engagement.play_enrollments (tenant_id, deal_id, status);
CREATE INDEX idx_play_enrollments_user ON m08_sales_engagement.play_enrollments (tenant_id, user_id, status);
```

---

## 6. Functional & Governance Logic

### Event-Driven Evaluation Heuristics
When a `tracker.detection.created` or `deal.stage.changed` event is consumed by the M8 engine:
1. **Play Evaluation:** The handler queries `m08_sales_engagement.sales_plays` for active plays where `trigger_conditions` match the incoming payload attributes.
2. **Idempotency Verification:** If a play matches, a safety check searches `m08_sales_engagement.play_enrollments` for the composite key `(tenant_id, play_id, deal_id, trigger_event_id)`.
3. **Preventing Dual Enrollments:** If a record matches, execution halts, logging a duplicate skip event to ensure BullMQ queue replays do not trigger double-enrollments.
4. **Enrollment Creation:** If unique, a transaction creates a `play_enrollment` record, mapping the `current_step` to `1` and alerting the deal owner workspace.