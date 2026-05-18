# TDD: Engage To-Do

## Document Control

- Document ID: Doc #11b 
- Document Name: TDD: Engage To-Do 
- Product Module: M8 Sales Engagement 
- Architecture Owner Module: M-02 Sales Engagement 
- File Path: `docs/modules/m08/tdd-engage-todo.md` 
- Version: v1.0-draft
- Status: Draft
- Owner: Product + Backend Engineering
- Reviewers: Tech Lead, Product Architect, Frontend Lead, QA Lead
- Last Updated: 2026-05-04
- Source References: Product module mapping and System Architecture Document (SAD) 

## Boundary Note

Engage To-Do is part of the **M8 Sales Engagement** product grouping, but its implementation belongs to **M-02 Sales Engagement**. This document covers only the centralized rep to-do capability owned by M-02 and does not include M-08 orchestration or workflow automation behavior. 

The M8 product view groups multiple execution features for documentation and packaging, but engineering ownership must still follow the architectural split defined in the SAD. That is why this TDD treats Engage To-Do as an M-02 feature with its own data ownership, API contracts, and event behavior. 

## Purpose

Engage To-Do gives each sales user a centralized, prioritized task list that brings together follow-ups from calls, manual tasks, flow-generated work, email actions, LinkedIn actions, and other approved sales activities into one working queue. The goal is to make it obvious what the rep should do next and when, without forcing them to jump between modules or tools. 

The design must support event-driven task creation, especially the required behavior where `call.transcription.completed` triggers automatic creation of a follow-up email task for the rep, protected by idempotency to avoid duplicate tasks for the same call. 

## Scope

### In Scope

- Centralized task list for the current user. 
- Task creation from multiple approved sources such as call completion, manual entry, and flow-driven actions. 
- Prioritized sorting logic for the task list. 
- Due dates, status updates, snoozing, and completion handling. 
- Auto-creation of follow-up tasks after `call.transcription.completed`. 
- Idempotent protection against duplicate task creation for the same source call. 
- API support for listing and updating tasks. 
- Optional linkage from tasks to email drafting, calls, LinkedIn activity logging, or related contact/deal context. 

### Out of Scope

- Orchestrate play execution, next-best-action engines, or event-driven workflow branching owned by M-08. 
- Full workflow automation across multiple modules. 
- CRM task sync unless separately approved in future scope.
- Lead routing or general-purpose operations workflow systems. 
- Real-time in-call guidance or live assistant actions. 

## Users

- Sales Representative: manages daily outreach and follow-up tasks. 
- SDR/BDR: works from a prioritized queue of email, call, and LinkedIn actions. 
- Account Executive: uses tasks to follow up after meetings and deal events. 
- Sales Manager: indirectly benefits from more consistent execution, though this TDD is focused on rep-facing task workflows. 

## Goals

- Give each rep a single place to see what action is due next. 
- Auto-create follow-up tasks from important signals such as completed call transcription. 
- Prevent duplicate tasks when events are retried or replayed. 
- Keep task data ownership clean inside M-02. 
- Allow tasks to launch the next action quickly, such as drafting an email or logging an activity. 

## Non-Goals

- Replacing a full project-management product.
- Running orchestration logic owned by M-08.
- Direct database reads from other modules.
- Building a manager workflow engine or SLA routing engine.
- Treating all tasks equally without prioritization logic. 

## Functional Overview

Engage To-Do acts as the rep’s working queue. It combines tasks from multiple approved sources and presents them in a prioritized order so the rep can see what needs action now, what is upcoming, and what is already done or snoozed. 

The core architecture lives in M-02 because the SAD defines M-02 as the owner of the `tasks` table and the centralized AI-generated task list. M-02 also consumes `call.transcription.completed` and creates a follow-up email task using an idempotency check keyed to the source call. 

## Key Capabilities

### 1. Centralized Rep Task List

The product mapping defines Engage To-Do as a centralized task management system that brings together sales activities such as emails, calls, LinkedIn actions, and custom tasks into one actionable list. It is meant to help reps know exactly what to do next and when to do it. 

### 2. Prioritization Logic

The SAD describes M-02 as producing prioritized rep task queues, and the `tasks` table includes a `priority` field with values such as `1 = high`, `2 = medium`, and `3 = low`. This means the task list is not just a raw dump of tasks; it must support explicit prioritization rules. 

### 3. Event-Driven Task Creation

M-02 consumes `call.transcription.completed` and auto-creates a follow-up email task for the rep. This is one of the most important M8 flows and must be treated as a first-class design path, not a side case. 

### 4. Task Status Management

The M-02 APIs include task retrieval and task update operations. This supports the core lifecycle of a task moving through states such as pending, completed, or snoozed. 

### 5. Due Dates

The `tasks` table includes a due date column, so due-date-aware sorting and filtering are part of the feature design. Due date is an important signal for what appears first in the queue. 

### 6. Multi-Source Task Support

The `tasks` table includes a `source` and `sourceId`, which lets the system represent task origin such as `callcompletion`, `manual`, or `flow`. This is important because source-based deduplication, traceability, and UI deep links all depend on it. 

## User Stories

### Story 1: View my prioritized work queue

As a rep, I want to see my most important pending tasks first so I know what to do next without manually sorting everything. 

### Story 2: Get automatic follow-up after a call

As a rep, I want the platform to create a follow-up email task when a call finishes processing so I do not forget to act on it. 

### Story 3: Avoid duplicate tasks

As a rep, I do not want duplicate follow-up tasks for the same call even if background jobs retry. The SAD explicitly requires idempotent task creation for this path. 

### Story 4: Update task state

As a rep, I want to mark tasks as complete or snooze them so my list stays accurate and focused. 

### Story 5: Open next action from the task

As a rep, I want to click a task and directly continue the related action, such as drafting an email or logging outreach. 

## Assumptions

- The current user identity and tenant context come from Platform Core auth and interceptors. 
- Upstream call completion events are already being published by M-01. 
- Tasks are owned and persisted by M-02 only. 
- The task list is user-specific, tenant-scoped, and does not require direct reads from another module’s internal schema. 
- A later enhancement may add richer AI prioritization, but the base design must work with deterministic business rules first. This is a design recommendation consistent with the current source material. 

## Dependencies

### Upstream Dependencies

- Platform Core for auth, RBAC, tenant context, and audit services. 
- M-01 Data Ingestion for `call.transcription.completed` events. 
- Optional flow/task sources from M-02 owned email flows and enrollments. 
- Optional linked activity context from approved module APIs or event payloads where needed. 

### Downstream Dependencies

- Email Composer can be launched from an email-type task because both capabilities are inside M-02. 
- Reporting or downstream analytics may later consume task completion behavior, but no dedicated published event is explicitly defined in the available sources.

## Data Ownership

M-02 owns the task system and the `tasks` table. No other module is allowed to write directly into the M-02 task schema. 

Other modules may influence tasks only through public APIs or events. For example, M-01 publishes `call.transcription.completed`, and M-02 independently decides whether to create a task from that signal. 

## Data Model

### Primary Table: `tasks`

Purpose: store all rep-facing to-dos from approved sources in a centralized structure. 

Fields defined in the SAD include:
- `taskId UUID PRIMARY KEY`
- `tenantId UUID NOT NULL`
- `userId UUID NOT NULL`
- `type VARCHAR` — `email | call | linkedin | followup`
- `description TEXT`
- `dueDate DATE`
- `priority INTEGER` — `1 high | 2 medium | 3 low`
- `source VARCHAR` — `callcompletion | manual | flow`
- `sourceId UUID`
- `status VARCHAR` — `pending | completed | snoozed`
- `createdAt TIMESTAMPTZ DEFAULT NOW()` 

### Related M-02 Tables

#### `linkedin_activities`
Useful when a LinkedIn-origin task results in a logged action. 

#### `email_flows`
Useful when tasks are created or influenced by sequence steps defined inside M-02. 

#### `email_flow_enrollments`
Useful when a task belongs to a contact currently enrolled in a flow. 

### Required Indexes

The SAD explicitly defines:
- `idx_tasks_tenant_user_status` on `(tenantId, userId, status, dueDate)` for prioritized current-user task retrieval. 

Recommended additional indexes aligned to the design:
- `idx_tasks_tenant_source_sourceid` on `(tenantId, source, sourceId)` for idempotency lookup on event-driven creation. This is an implementation recommendation directly supporting the SAD’s duplicate-prevention requirement. 
- `idx_tasks_tenant_user_priority_duedate` on `(tenantId, userId, priority, dueDate)` for fast sorted queue retrieval. This is a practical extension consistent with the prioritized queue requirement. 

## API Design

### 1. Get Current User Task List

**Endpoint**  
`GET /api/v1/engagement/tasks` 

**Purpose**  
Return the current user’s prioritized task list. 

**Caller**  
Frontend application. 

**Auth**  
JWT, tenant-scoped user. 

**Suggested Query Parameters**
- `status`
- `type`
- `dueBefore`
- `dueAfter`
- `priority`
- `source`
- `page`
- `pageSize`

**Response Example**
```json
{
  "items": [
    {
      "taskId": "uuid",
      "type": "email",
      "description": "Follow up with Priya after discovery call",
      "dueDate": "2026-05-05",
      "priority": 1,
      "source": "callcompletion",
      "sourceId": "call-uuid",
      "status": "pending",
      "createdAt": "2026-05-04T08:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

### 2. Update Task Status

**Endpoint**  
`PATCH /api/v1/engagement/tasks/:id` 

**Purpose**  
Update task state such as complete, snooze, or reopen. 

**Request Example**
```json
{
  "status": "completed",
  "completedAt": "2026-05-04T11:30:00Z"
}
```

**Alternate Request Example**
```json
{
  "status": "snoozed",
  "snoozedUntil": "2026-05-06T09:00:00Z"
}
```

**Rules**
- User can only update tasks in their own tenant scope. 
- Invalid state transitions should be rejected.
- Completed tasks should not reappear in the active queue unless reopened through an approved workflow.

### 3. Create Manual Task

**Endpoint**  
`POST /api/v1/engagement/tasks`

**Purpose**  
Allow users or approved internal services to create a manual task.

**Request Example**
```json
{
  "type": "call",
  "description": "Call the buyer after proposal review",
  "dueDate": "2026-05-06",
  "priority": 2,
  "source": "manual"
}
```

### 4. Bulk Task Update

**Endpoint**  
`PATCH /api/v1/engagement/tasks`

**Purpose**  
Optional batch update for complete/snooze actions on selected tasks. This is not explicitly listed in the SAD, so it should be considered optional future optimization rather than MVP scope. 

## UI Components

### Task List View

Main list of current tasks, ordered by priority and urgency. It should support quick scanning and direct action. 

### Task Filters

Filters by status, type, due date, and source so the user can narrow the queue. These are inferred from the task schema and expected UX behavior. 

### Task Action Panel

Shows details of a selected task and gives action buttons like mark complete, snooze, open composer, or open related record. 

### Empty State and Overdue State

The system should clearly show when there are no tasks and when tasks are overdue. This is important because due dates are part of the task data model. 

## Prioritization Logic

The product requirement says the to-do list should help reps know exactly what to do next and when. The SAD says M-02 produces prioritized rep task queues and includes both priority and due date in the task schema. 

### Recommended Base Ranking Rules

1. Pending tasks appear before snoozed and completed tasks.
2. High priority (`1`) appears before medium (`2`) and low (`3`). 
3. Overdue tasks appear before future due tasks.
4. Among same-priority tasks, earlier due dates appear first. 
5. Among same due date, older uncompleted tasks appear first.
6. Completed tasks are hidden from the default active queue unless specifically requested.

### Example Sort Formula

A simple deterministic approach for MVP:
- Status bucket: `pending` first, `snoozed` later, `completed` last.
- Priority bucket: `1`, then `2`, then `3`. 
- Due bucket: overdue first, today second, future third, no due date last.
- Tie-breaker: `createdAt ASC`.

This keeps the logic explainable to users and simple for freshers to implement.

## Task Sources

The product mapping and SAD together imply that Engage To-Do should consolidate multiple task origins. The `source` and `sourceId` fields are the key to making this traceable and deduplicated. 

### Supported Source Types

- `callcompletion` — created when `call.transcription.completed` is received. 
- `manual` — created directly by a user.
- `flow` — created in relation to an M-02 email flow step. 
- `linkedin` — optional source when LinkedIn activities are brought into the task queue through M-02 structures. 
- `custom` — optional extension point for later approved actions.

### Source Traceability

Every task should show:
- where it came from,
- what source record it points to,
- and what action is expected next.

This matters because the rep needs to trust the queue and understand why each task exists.

## Event Consumption

### Event Consumed: `call.transcription.completed`

**Producer**  
M-01 Data Ingestion. 

**Consumer**  
M-02 Sales Engagement. 

**Why It Matters**  
When a call finishes processing, M-02 must automatically create a follow-up email task for the rep. The SAD calls this out explicitly. 

**Required Behavior**
- Receive the event.
- Determine target rep/owner from available event and linked context.
- Check for existing task with `source = callcompletion` and `sourceId = callId`.
- If task exists, skip creation.
- If task does not exist, create a new follow-up task. 

### Idempotency Rule

The SAD provides the required logic pattern: before creating a task, M-02 must query whether a task already exists for the same `tenantId`, `source = callcompletion`, and `sourceId = callId`. If it exists, processing must stop successfully without creating another task. 

### Example Pseudocode

```ts
const exists = await db.tasks.findFirst({
  where: {
    tenantId: job.data.tenantId,
    source: "callcompletion",
    sourceId: job.data.callId
  }
});

if (exists) {
  return;
}

await createFollowUpTask(job.data);
```

This is one of the most important implementation guards in the entire TDD because retries are expected in the event bus architecture. 

## Task Creation Logic for Call Completion

When `call.transcription.completed` arrives, the system should create a default follow-up task for the call owner. The SAD explicitly says this is an AI-suggested follow-up email task. 

### Recommended Default Values

- `type = email`
- `source = callcompletion`
- `sourceId = <callId>`
- `status = pending`
- `priority = 1` or `2` depending on product policy
- `description = Follow up with contact after completed call`
- `dueDate = next business day` or another approved default rule

The existence of the task is required by the SAD, while exact default priority and due-date policy should be finalized by product and RevOps. 

## Manual Task Creation Logic

Users should be able to create their own tasks for work that is not event-generated. These should still use the same centralized `tasks` table and status workflow so the task list remains unified. 

Manual tasks must still be tenant-scoped, user-owned, and auditable. They should support type, description, due date, and priority. 

## Status Lifecycle

The SAD explicitly includes `pending`, `completed`, and `snoozed` as task status values. These should form the base task state model. 

### Suggested State Transitions

- `pending -> completed`
- `pending -> snoozed`
- `snoozed -> pending`
- `completed -> pending` only if reopen is explicitly supported
- `completed -> snoozed` should generally be invalid

### Behavioral Rules

- Pending tasks show in the active queue.
- Snoozed tasks are hidden until snooze expiry or shown under a separate filter.
- Completed tasks are hidden by default but remain queryable for history and audit.

## Due Date Rules

Due dates are part of the task schema and directly affect prioritization. The system should clearly distinguish:
- overdue tasks,
- due today,
- upcoming tasks,
- and tasks with no due date. 

Recommended UX behavior:
- Overdue tasks show warning styling.
- Due today tasks are promoted visually.
- No due date tasks sort below dated tasks unless priority is extremely high.

## Linked Actions

A task should not be a dead end. It should open the correct next action based on task type and source. 

### Examples

- `email` task -> open Email Composer with related contact/deal context. 
- `call` task -> open contact/deal record and call instructions.
- `linkedin` task -> open LinkedIn activity logging surface if enabled by product scope. 
- `followup` task -> open task details plus suggested next action.

## Security

### Authentication

All task APIs require JWT-based authentication through Platform Core. 

### Authorization

Users may only view and update tasks that belong to their tenant and are assigned to them, unless future manager-visibility rules are introduced through explicit RBAC policy. 

### Tenant Isolation

Every query and write must be scoped by `tenantId`. The architecture requires strict tenant-aware isolation across modules and schemas. 

### Auditability

Status changes, bulk updates, and administrative corrections should be auditable through Platform Core audit patterns rather than ad hoc table writes. 

## Observability

The task feature should expose logs, metrics, and traces so operations teams can detect queue problems and duplicate-prevention failures quickly. The platform architecture expects structured monitoring across modules and event consumers. 

### Metrics

- task list fetch count
- task list fetch latency
- task creation count by source
- task completion count
- task snooze count
- duplicate task prevention count
- call-completion-to-task creation latency
- task update failure count 

### Logs

Log these safely with tenant-aware metadata:
- task created
- task updated
- task completed
- task snoozed
- task reopened
- duplicate task skipped
- event consumed
- event handling failed 

### Tracing

Trace path should cover:
Frontend request -> M-02 API -> task DB read/write -> optional event consumer path from M-01 -> idempotency check -> task create. 

### Alerts

Alert on:
- sharp spike in task creation failures
- repeated event-consumer failures on `call.transcription.completed`
- duplicate creation attempts above threshold
- task list query latency degradation 

## Error Handling

### Event Retry Safety

If the event bus retries the same `call.transcription.completed` message, the idempotency check must prevent duplicate task creation. This is required by the SAD and is not optional. 

### Invalid Task Updates

If a task update refers to a task outside tenant scope, return an authorization error. If the status value is invalid, return a validation error. 

### Missing Source Context

If a task references a source record that no longer exists or cannot be loaded, the task should still remain visible with a degraded but understandable UI state instead of disappearing silently.

### Partial Failure

If task creation succeeds but an optional secondary action fails, the task record must still persist because it is the source of truth for the rep queue. This is a design rule aligned with general event-driven durability principles in the SAD. 

## Non-Functional Requirements

### Performance

- Current user task list should load quickly enough for daily working use.
- Active queue queries should use indexed tenant/user/status/due-date access patterns defined in the SAD. 

### Reliability

- Event-driven task creation must survive retries and restarts.
- Duplicate prevention must be deterministic.
- Task status updates must be atomic. 

### Scalability

- Task volume grows with activity, so reads should be scoped to current user and indexed accordingly. 
- M-02 remains logically independent so it can be extracted later as an independent service if needed. 

### Maintainability

- Keep logic inside M-02.
- Use events and public APIs only.
- Avoid hidden dependencies on other module schemas.
- Keep prioritization rules simple and testable. 

## Risks

- Duplicate tasks if idempotency is implemented incorrectly. 
- Poor rep trust if prioritization is confusing or unstable. 
- Too many low-value auto-generated tasks can create noise and reduce action quality.
- Missing tenant or ownership checks can leak task visibility across users. 

## Open Decisions

- Final default due-date rule for follow-up tasks created from call completion.
- Final default priority value for auto-generated follow-up email tasks.
- Whether snooze expiry automatically returns status to pending or is recalculated at query time.
- Whether manager role can view subordinate task lists in MVP.
- Whether task completion should emit a platform event in a future phase.

## Testing Strategy

### Unit Tests

- Validate get-tasks query parsing.
- Validate task update schema.
- Validate status transition rules.
- Validate prioritization sort logic.
- Validate source/sourceId dedupe lookup.
- Validate due-date bucket behavior.
- Validate snooze behavior. 

### Integration Tests

- M-01 `call.transcription.completed` -> M-02 task creation. 
- Duplicate event replay -> no duplicate task created. 
- GET tasks returns correct tenant/user scoped list. 
- PATCH task updates correct status.
- Email task opens associated Email Composer handoff flow. 

### End-to-End Tests

- Completed call creates one follow-up task for the rep. 
- Replay of same event creates zero additional tasks. 
- Rep sees pending task in prioritized list. 
- Rep marks task completed and it leaves active queue.
- Rep snoozes task and it stops appearing in active pending list.
- Rep filters tasks by type and due date.

### Negative Tests

- User tries to update another user’s task.
- Invalid status value.
- Missing tenant context.
- Duplicate source/sourceId insertion attempt.
- Event payload missing required call identifier. 

## Acceptance Criteria

- User can retrieve their current prioritized task list through `GET /api/v1/engagement/tasks`. 
- User can update task status through `PATCH /api/v1/engagement/tasks/:id`. 
- System stores tasks in the M-02 `tasks` table only. 
- `call.transcription.completed` creates a follow-up email task for the rep. 
- Duplicate `call.transcription.completed` deliveries do not create duplicate tasks. 
- Task list ordering reflects status, priority, and due date in a deterministic way. 
- Engage To-Do supports multiple task sources through `source` and `sourceId`. 
- The feature remains inside M-02 and does not mix M-08 workflow logic. 

## Example API Contracts

### Get Tasks Response
```json
{
  "items": [
    {
      "taskId": "2e3ab9d1-1111-2222-3333-444444444444",
      "type": "email",
      "description": "Follow up with Priya after discovery call",
      "dueDate": "2026-05-05",
      "priority": 1,
      "source": "callcompletion",
      "sourceId": "7f4cd8aa-1111-2222-3333-444444444444",
      "status": "pending",
      "createdAt": "2026-05-04T10:00:00Z"
    },
    {
      "taskId": "8e4ab9d1-1111-2222-3333-444444444444",
      "type": "linkedin",
      "description": "Send LinkedIn follow-up to buyer champion",
      "dueDate": "2026-05-06",
      "priority": 2,
      "source": "manual",
      "sourceId": null,
      "status": "pending",
      "createdAt": "2026-05-04T10:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 2
}
```

### Update Task Request
```json
{
  "status": "completed"
}
```

### Example Auto-Created Task
```json
{
  "taskId": "a93ab9d1-1111-2222-3333-444444444444",
  "tenantId": "b13ab9d1-1111-2222-3333-444444444444",
  "userId": "c23ab9d1-1111-2222-3333-444444444444",
  "type": "email",
  "description": "Send follow-up email after completed call",
  "dueDate": "2026-05-05",
  "priority": 1,
  "source": "callcompletion",
  "sourceId": "call-uuid",
  "status": "pending"
}
```

## Implementation Notes for Engineers

- Keep all task business logic inside the NestJS M-02 module. 
- Do not read other module tables directly; consume events or public APIs only. 
- Treat `source + sourceId + tenantId` as the main dedupe identity for event-generated tasks.
- Make prioritization deterministic and easy to explain.
- Do not let the queue become noisy; quality of task creation matters as much as quantity.
- Build the default `call.transcription.completed` task path first because it is explicitly required in the SAD. 

## References

- Product mapping: M8 Sales Engagement includes Engage To-Do as part of the product scope. 
- Product description: To-dos centralize sales activities into one actionable list. 
- Architecture ownership: task capability belongs to M-02 Sales Engagement. 
- M-02 owns the `tasks` table, task APIs, and call-completion-driven task creation behavior. 
- The SAD requires idempotent task creation for `call.transcription.completed`. 