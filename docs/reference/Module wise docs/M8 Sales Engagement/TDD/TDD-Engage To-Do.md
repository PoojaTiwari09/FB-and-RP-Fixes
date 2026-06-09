# Technical Design Document (TDD): Engage To-Do

## 1. Document Control

- **Document Title:** Technical Design Document — Engage To-Do
- **Feature Name:** Centralized Representative Task Queue (Engage To-Do)
- **Module Name:** M8 Sales Engagement
- **Workspace Directory:** `modules/m08-sales-engagement/`
- **Owner:** Product Engineering — M8
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### Business Problem
Sales representatives manage their workflows across disparate task pads, calendar events, call follow-ups, and CRM checklists. The lack of a centralized, prioritized queue causes reps to lose visibility on high-priority items and delayed actions.

### What This Feature Does
**Engage To-Do** consolidates all seller activities (follow-ups, emails, calls, LinkedIn outreaches, play actions) into a single, prioritized workspace.
- **Auto-Generated Follow-ups:** Consumes `call.transcription.completed` events to automatically create AI-driven follow-up tasks.
- **Idempotency Safeguard:** Guarantees that duplicate queue messages or worker retries do not result in duplicate tasks for the same call interaction.
- **Deterministic Prioritization:** Ranks tasks dynamically using priority weights (High, Medium, Low) combined with due-date urgency and status buckets.

---

## 3. Scope & Dependencies

### In Scope
- Retrieving and managing prioritized task lists for the authenticated seller.
- Consuming the `call.transcription.completed` event from **M1 Capture & Transcription**.
- Performing composite idempotency verification on `(tenant_id, source, source_id)` to filter retried calls.
- Completing, snoozing, and creating tasks via REST API.

### Out of Scope
- Scheduling actual emails; that is handled by **Email Composer**.
- Storing CRM deals/contacts; M8 queries these via REST APIs from **M10 Data & Compliance**.

---

## 4. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m08-sales-engagement`.

### GET /api/v1/m08-sales-engagement/tasks
- **Description:** Retrieve the current authenticated rep's prioritized task list.
- **Query Params:**
  - `status` (string, optional): `pending | completed | snoozed`
  - `priority` (int, optional): `1 | 2 | 3`
- **Response Payload (`200 OK`):**
  ```json
  {
    "items": [
      {
        "taskId": "uuid-task-1",
        "type": "email",
        "description": "Follow up with Priya after discovery call",
        "dueDate": "2026-05-19",
        "priority": 1,
        "source": "callcompletion",
        "sourceId": "uuid-call-45",
        "status": "pending",
        "createdAt": "2026-05-18T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
  ```

### PATCH /api/v1/m08-sales-engagement/tasks/:id
- **Description:** Update status of a specific task (e.g., mark completed or snooze).
- **Request Payload:**
  ```json
  {
    "status": "completed"
  }
  ```
- **Response Payload (`200 OK`):**
  ```json
  {
    "taskId": "uuid-task-1",
    "status": "completed",
    "updatedAt": "2026-05-18T12:00:00Z"
  }
  ```

### POST /api/v1/m08-sales-engagement/tasks
- **Description:** Create a manual rep task.

---

## 5. Database Schema Design

All tables reside under the `m08_sales_engagement` PostgreSQL schema namespace.

```sql
-- 1. Tasks Table
CREATE TABLE m08_sales_engagement.tasks (
  task_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  user_id             UUID NOT NULL,
  type                VARCHAR(50) NOT NULL, -- email | call | linkedin | followup
  description         TEXT NOT NULL,
  due_date            DATE NOT NULL,
  priority            INTEGER DEFAULT 2, -- 1 = High, 2 = Medium, 3 = Low
  source              VARCHAR(100) NOT NULL, -- callcompletion | manual | flow
  source_id           UUID,
  status              VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending | completed | snoozed
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for event idempotency safety
ALTER TABLE m08_sales_engagement.tasks 
  ADD CONSTRAINT uq_tasks_idempotency UNIQUE (tenant_id, source, source_id);

-- Performance Indexes for rep queues
CREATE INDEX idx_tasks_rep_queue ON m08_sales_engagement.tasks (tenant_id, user_id, status, due_date);
```

---

## 6. Functional & Governance Logic

### Asynchronous Event Consumer Rules
Upon receipt of the `call.transcription.completed` event from **M1 Capture & Transcription**:
1. **Idempotency Guard:** The system executes a quick database search against the composite uniqueness constraint:
   ```ts
   const exists = await prisma.tasks.findUnique({
     where: {
       tenant_id_source_source_id: {
         tenant_id: event.tenantId,
         source: 'callcompletion',
         source_id: event.callId
       }
     }
   });
   ```
2. **Duplicate Prevention:** If `exists` evaluates as true, processing terminates immediately with success, logging a duplicate event check to ensure BullMQ queue replays do not leak multiple tasks to the rep workspace.
3. **Execution Delivery:** If no duplicate task is detected, the system creates a new high-priority follow-up task targeting the call host, setting the `dueDate` to the next business day.

### Dynamic Prioritization Heuristics
Sellers are served tasks based on a strict sorting index:
- **Primary:** `status = 'pending'` first.
- **Secondary:** `priority ASC` (High `1` before Medium `2` before Low `3`).
- **Tertiary:** `due_date ASC` (Overdue items promoted to the top).
- **Quaternary:** `created_at ASC` (Tie-breaker for matching priorities).