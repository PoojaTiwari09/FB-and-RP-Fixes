# TDD: Workflow Automation

## Document Control

- Document ID: Doc #11d 
- Document Name: TDD: Workflow Automation 
- Product Module: M8 Sales Engagement 
- Architecture Owner Module: M-08 Execution and Automation 
- File Path: `docs/modules/m08/tdd-workflow-automation.md` 
- Version: v1.0-draft
- Status: Draft
- Owner: Product + Backend Engineering
- Reviewers: Tech Lead, Product Architect, Backend Lead, QA Lead
- Last Updated: 2026-05-04
- Source References: Product module mapping and System Architecture Document (SAD) 

## Boundary Note

Workflow Automation is part of the **M8 Sales Engagement** product grouping, but its architectural ownership belongs to **M-08 Execution and Automation**. This TDD covers only the event-driven automation engine for branching sales processes and must not absorb M-02 responsibilities such as Email Composer or Engage To-Do. 

Workflow Automation is also separate from Orchestrate even though both live in M-08. Orchestrate is about guided, trackable rep workflows and plays, while Workflow Automation is about automated branching logic that reacts to business signals and executes configured actions. 

## Purpose

Workflow Automation allows the platform to automate complex branching sales processes based on business signals, trigger conditions, and execution rules. The product mapping defines it as complex branching automation for sales processes, while the SAD positions M-08 as the module that reacts to upstream signals and executes next actions using rule-based logic. 

The goal is to reduce manual follow-up work, enforce consistent process responses to important signals, and support delayed or conditional execution paths in a safe, idempotent, event-driven manner. 

## Scope

### In Scope

- Creation and management of automation workflow definitions. 
- Trigger-event-based activation of workflow logic. 
- Branching condition evaluation on event payloads and workflow state. 
- Automated action execution such as notify, enroll play, or update field. 
- Delayed execution for future actions using BullMQ delayed jobs. 
- Workflow run tracking, including status and idempotency protection. 
- Retry handling and dead-letter behavior through the platform event/queue architecture. 
- Event-driven activation from upstream signals such as `tracker.detection.created` and `deal.stage.changed`. 

### Out of Scope

- Manual email drafting and sending, which belong to M-02. 
- Rep-owned centralized task list, which belongs to M-02. 
- Guided rep play execution as the primary concern; that belongs to Orchestrate, though a workflow may trigger play enrollment. 
- Direct cross-module database reads or writes. 
- Building a separate external workflow engine outside the approved platform stack. 

## Users

- RevOps/Admin: defines and activates automation workflows. 
- Sales Manager: monitors automation outcomes and operational consistency. 
- Sales Representative: receives the result of automation indirectly, such as alerts, updated execution states, or enrolled plays. 
- Tech Lead / Operations: monitors automation reliability, retries, and failures. 

## Goals

- Automate repeatable branching sales processes. 
- Trigger actions from trusted platform signals rather than manual intervention. 
- Keep all activation and execution event-driven. 
- Ensure retry-safe, idempotent workflow execution. 
- Support delayed actions using the standard BullMQ delayed-job pattern. 
- Maintain clear separation from Orchestrate and M-02 features. 

## Non-Goals

- Becoming a no-code workflow platform for arbitrary enterprise use cases.
- Owning CRM system-of-record logic. 
- Replacing Orchestrate’s guided rep workflow model. 
- Executing logic through direct internal module imports or hidden database dependencies. 
- Embedding AI inference logic inside TypeScript business services. 

## Functional Overview

Workflow Automation lets an admin define a workflow with a trigger event, one or more branching conditions, and one or more resulting actions. When the platform receives a matching upstream event, M-08 evaluates the configured workflow and creates a durable `workflowrun` that captures the payload, execution state, and idempotency key. 

Depending on workflow logic, the system may then execute actions immediately or schedule them for later execution through BullMQ delayed jobs. This aligns with the SAD, which explicitly says delayed jobs are used by M-08 Workflow Automation and that all event processing must handle retries and duplicates safely. 

## Key Capabilities

### 1. Trigger Rules

Workflow definitions include a `triggerEvent`, such as `tracker.detection.created` or `deal.stage.changed`. This tells M-08 which incoming signals should be evaluated against the workflow’s conditions. 

### 2. Branching Logic

The product mapping explicitly calls out complex branching automation, and the SAD defines `branches JSONB` for workflows. This means workflows are not simple one-path automations; they can choose different actions based on evaluated conditions. 

### 3. Action Execution

The SAD defines actions in the `actions JSONB` structure and gives examples such as `notify`, `enrollplay`, and `updatefield`. This makes action execution the core unit of work for the automation engine. 

### 4. Workflow Run Tracking

Every execution attempt should be recorded in `workflow_runs` with status, timestamps, payload, and an idempotency key. This is critical because the workflow engine must explain what ran, why it ran, and whether it succeeded. 

### 5. Retry and Delayed Execution

The architecture uses BullMQ for durable jobs, retries, backoff, delayed jobs, and DLQ handling. Workflow Automation specifically uses delayed jobs according to the SAD, so time-based follow-up is part of the intended design. 

## User Stories

### Story 1: Create a trigger-based workflow

As a RevOps admin, I want to define an automation workflow that starts when a known event occurs so the platform reacts consistently. 

### Story 2: Branch based on signal details

As a RevOps admin, I want the workflow to choose different actions depending on event fields such as stage, confidence, or tracker type so automation matches business context. 

### Story 3: Run actions automatically

As a manager, I want the system to execute configured actions like notifying users or enrolling a deal in a play so teams do not miss critical steps. 

### Story 4: Avoid duplicate runs

As an engineer, I want duplicate event deliveries to be safely ignored so the same workflow does not run twice for the same signal. The SAD explicitly provides an `idempotencyKey` for this. 

### Story 5: Track failures and retries

As an operations lead, I want to see whether a workflow ran, failed, retried, or completed so issues can be debugged and corrected. 

## Assumptions

- Upstream business events already exist in the event registry and are published consistently. 
- The workflow engine runs inside the NestJS M-08 product service, not in Python. 
- Any AI-enriched evaluation added later would still use the Python AI Services Layer, while business action decisions remain in TypeScript. 
- Delayed and retryable work should use BullMQ because that is the standard platform mechanism for asynchronous execution. 
- Workflow execution must remain tenant-scoped and replay-safe. 

## Dependencies

### Upstream Dependencies

- Platform Core for auth, tenant context, RBAC, audit, and event bus infrastructure. 
- M-05 Smart Tracking for `tracker.detection.created`. 
- M-03/M-07 deal event chain for `deal.stage.changed`. 
- M-06 outputs as part of the Stage 4 to Stage 5 execution dependency path for M-08. 

### Downstream Dependencies

- Orchestrate may receive an `enrollplay` action from workflow execution. 
- Downstream monitoring, warehouse analytics, or forecasting may later depend on workflow execution data because M-09 uses M-08 execution data. 

## Data Ownership

M-08 owns the workflow automation data model, especially `workflows` and `workflow_runs`. The SAD explicitly assigns these to M-08. 

Other modules may influence automation only through events or approved public APIs. They must not write directly to M-08 workflow tables. 

## Data Model

### Primary Table: `workflows`

Purpose: store tenant-defined automation workflow definitions. 

Fields from the SAD:
- `workflowId UUID PRIMARY KEY`
- `tenantId UUID NOT NULL`
- `name VARCHAR`
- `triggerEvent VARCHAR` — examples: `tracker.detection.created`, `deal.stage.changed`
- `branches JSONB` — `condition`, `actions`
- `actions JSONB` — `type`, `params` such as `notify`, `enrollplay`, `updatefield`
- `createdBy UUID`
- `isActive BOOLEAN DEFAULT TRUE` 

### Primary Table: `workflow_runs`

Purpose: store each workflow execution attempt and its final state. 

Fields from the SAD:
- `runId UUID PRIMARY KEY`
- `workflowId UUID REFERENCES workflows(workflowId)`
- `tenantId UUID NOT NULL`
- `triggerEventPayload JSONB`
- `status VARCHAR` — `running | completed | failed`
- `startedAt TIMESTAMPTZ`
- `completedAt TIMESTAMPTZ`
- `idempotencyKey VARCHAR UNIQUE` — prevents duplicate workflow triggers 

### Recommended Extended Fields

These are implementation recommendations to make runtime operations easier:
- `errorMessage TEXT NULL`
- `retryCount INTEGER DEFAULT 0`
- `currentBranch VARCHAR NULL`
- `scheduledFor TIMESTAMPTZ NULL`

These are not explicitly listed in the SAD but fit the workflow run semantics and observability needs. 

### Required Indexes

The SAD explicitly defines:
- `idx_workflow_runs_tenant` on `(tenantId, workflowId, startedAt DESC)` 

Recommended additional indexes:
- `idx_workflows_tenant_trigger_active` on `(tenantId, triggerEvent, isActive)` for active workflow lookup on event receipt.
- `idx_workflow_runs_tenant_status` on `(tenantId, status, startedAt DESC)` for operations visibility.

## API Design

### 1. Get Workflows

**Endpoint**  
`GET /api/v1/execution/workflows` 

**Purpose**  
Return all automation workflows for the tenant. 

**Caller**  
Admin frontend. 

**Auth**  
JWT. 

### 2. Create Workflow

**Endpoint**  
`POST /api/v1/execution/workflows` 

**Purpose**  
Create a branching workflow automation definition. 

**Auth**  
JWT with Admin/RevOps role. 

**Request Example**
```json
{
  "name": "Competitor mention escalation",
  "triggerEvent": "tracker.detection.created",
  "branches": [
    {
      "condition": {
        "field": "trackerType",
        "operator": "equals",
        "value": "competitor_mention"
      },
      "actions": [
        {
          "type": "notify",
          "params": {
            "channel": "inapp",
            "severity": "high"
          }
        },
        {
          "type": "enrollplay",
          "params": {
            "playId": "uuid"
          }
        }
      ]
    }
  ],
  "actions": [],
  "isActive": true
}
```

**Response Example**
```json
{
  "workflowId": "uuid",
  "name": "Competitor mention escalation",
  "triggerEvent": "tracker.detection.created",
  "isActive": true
}
```

### 3. Get Workflow Runs

**Endpoint**  
`GET /api/v1/execution/workflows/:id/runs`

**Purpose**  
Return recent execution history for a workflow. This endpoint is a practical addition for operations visibility, though not explicitly listed in the SAD. It is a reasonable companion to the `workflow_runs` model. 

### 4. Activate / Deactivate Workflow

**Endpoint**  
`PATCH /api/v1/execution/workflows/:id`

**Purpose**  
Allow admin to enable or disable a workflow definition.

**Request Example**
```json
{
  "isActive": false
}
```

## UI Components

### Workflow Library

Shows all tenant workflows, trigger events, active state, and last-run summary. 

### Workflow Builder

Admin-facing configuration screen for trigger event selection, condition authoring, branch definition, and action configuration. The product mapping’s “complex branching automation” requirement makes this a key UI surface. 

### Workflow Run History

Shows recent runs, status, timestamps, dedupe outcome, and errors. This aligns with the workflow run model in the SAD. 

### Action Preview Panel

Helps admins understand what will happen when a branch matches, such as sending a notification, enrolling a play, or updating a field.

## Trigger Design

Workflow Automation begins with a known upstream signal. The available platform signals documented for M-08 include:
- `tracker.detection.created` 
- `deal.stage.changed` 

### Trigger Requirements

A trigger must specify:
- event name
- payload fields needed for condition evaluation
- tenant context
- idempotency source
- action execution policy

### Example Trigger Scenarios

- Competitor mention detected in a call -> notify manager and enroll defensive play. 
- Deal moved to proposal stage -> execute stage-based workflow. 
- High-confidence risk signal detected -> create escalation chain using approved actions.

## Branching Logic

The product mapping defines this feature as complex branching automation, and the SAD stores branch logic in `branches JSONB`. That means workflows must support multiple conditional paths, not only a single “if matched then act” rule. 

### Branch Structure

Each branch should contain:
- condition object
- one or more actions
- execution order
- optional delay
- optional fallback behavior

### Condition Operators

Recommended MVP operators:
- `equals`
- `not_equals`
- `greater_than`
- `less_than`
- `contains`
- `in`
- `exists`

These operators are a design recommendation for the workflow engine and should be finalized in implementation ADR/API design if needed.

### Branch Evaluation Rule

Suggested deterministic evaluation order:
1. Evaluate branches top to bottom.
2. Execute the first matching branch by default.
3. Optionally support multi-match execution only if explicitly enabled per workflow.

This keeps the initial engine simple and predictable for freshers.

## Action Execution

The SAD explicitly gives example action types such as `notify`, `enrollplay`, and `updatefield`. These should be the initial action catalog for MVP. 

### Action Type: `notify`

Purpose: send an in-app or Slack-style notification when a high-value signal occurs. M-08 also owns competitor alerting behavior, so notifications are a natural workflow action. 

### Action Type: `enrollplay`

Purpose: enroll a deal into an Orchestrate play when conditions match. This is the clean bridge between Workflow Automation and Orchestrate without collapsing their responsibilities. 

### Action Type: `updatefield`

Purpose: request an approved field/state update through the proper boundary instead of directly mutating another module’s internal schema. This action should follow platform ownership rules and may publish a request event or call an approved public API depending on the governed boundary. 

### Delayed Actions

If an action should happen later, the workflow engine must schedule it using BullMQ delayed jobs. The SAD explicitly calls out delayed jobs for M-08 Workflow Automation. 

## Event-Driven Activation

The SAD explicitly says M-08 should react to upstream signals such as tracker detections and deal-stage changes, and that these TDDs should stay event-driven rather than directly querying other modules’ internals. 

### Event Consumed: `tracker.detection.created`

**Producer**  
M-05 Smart Tracking. 

**Action in Workflow Automation**  
Evaluate all active workflows whose `triggerEvent` is `tracker.detection.created`, then create matching `workflow_runs` and execute actions. 

### Event Consumed: `deal.stage.changed`

**Producer / Event path**  
Published in the platform event chain and consumed by M-08. 

**Action in Workflow Automation**  
Evaluate stage-based workflow rules and run matching actions such as field updates or play enrollment. 

## Workflow Run Lifecycle

The `workflow_runs` table is the runtime source of truth for execution state. It should be written before actions are executed so failures still leave an auditable run record. 

### Status Values

The SAD explicitly includes:
- `running`
- `completed`
- `failed` 

Recommended additional operational sub-states can be represented in logs or optional fields if needed, but the stored base states should remain simple.

### Standard Lifecycle

1. Receive trigger event.
2. Build idempotency key.
3. Check if run already exists.
4. If duplicate, skip safely.
5. Create `workflowrun` with `running`.
6. Evaluate branches.
7. Execute actions immediately or schedule delayed jobs.
8. Mark run `completed` if successful.
9. Mark run `failed` if terminal error occurs. 

## Idempotency

Idempotency is mandatory because the event architecture uses BullMQ retries and duplicate delivery is expected. The SAD explicitly says all events must be idempotent and defines `workflow_runs.idempotencyKey` as unique to prevent duplicate workflow triggers. 

### Recommended Idempotency Key

A practical key can be built from:
- `tenantId`
- `workflowId`
- `eventName`
- `eventId` or source entity identifier

### Duplicate Handling Rule

If a run already exists for the same idempotency key:
- do not create another run,
- do not re-execute actions,
- log duplicate skip outcome,
- return success from the worker so retries stop.

## Retry Handling

BullMQ provides retries, backoff, delayed jobs, and DLQ handling. Workflow Automation should rely on this standard platform behavior rather than inventing a separate retry engine. 

### Retry Rules

- Transient failures should retry according to queue policy.
- Terminal validation failures should fail fast.
- Action execution should be designed so that retrying a failed run does not produce duplicate side effects. 

### Dead-Letter Handling

Jobs that exhaust retries move to the DLQ per platform standards. Operations must be able to inspect failed runs using workflow run history plus queue monitoring. 

## Security

### Authentication

All workflow management APIs require JWT-based authentication via Platform Core. 

### Authorization

- Only Admin/RevOps users can create, activate, deactivate, or edit workflows. 
- Read access to run history may be restricted to admins and support roles.
- Action execution must respect tenant and role boundaries.

### Tenant Isolation

Every workflow definition and workflow run must be tenant-scoped. All queries and writes must include tenant filtering. 

### Safe Action Boundaries

Workflow actions must never bypass module ownership rules. For example, an `updatefield` action must use an approved API or event path and must not write directly to another module’s tables. 

## Observability

Workflow Automation is a runtime engine, so observability is essential. The SAD expects structured logging, queue state visibility, DLQ monitoring, and tenant-safe telemetry. 

### Metrics

- workflow count by tenant
- active workflow count
- trigger event count by type
- workflow run count
- run completion rate
- run failure rate
- duplicate run prevention count
- delayed action count
- retry count
- DLQ count 

### Logs

Log these safely with tenant-aware metadata:
- workflow created
- workflow activated/deactivated
- trigger received
- branch matched
- action executed
- action scheduled
- run completed
- run failed
- duplicate run skipped 

### Tracing

Trace path should cover:
event receipt -> active workflow lookup -> idempotency check -> run write -> branch evaluation -> action execution or delayed schedule -> run completion/failure. 

### Alerts

Alert on:
- increasing workflow run failures
- unusual DLQ growth
- repeated duplicate run attempts
- branch evaluation latency spikes
- delayed action backlog growth 

## Error Handling

### Invalid Workflow Definitions

A workflow with invalid trigger event, malformed branches, or unsupported actions should be rejected at creation time, not at runtime.

### Missing Event Fields

If the incoming event lacks fields required by the workflow condition, the engine should fail the run safely or mark it as skipped based on configured policy, and log the reason.

### Action Failure

If one action in a branch fails:
- mark the run failed unless compensation or partial-success semantics are explicitly supported,
- record the error,
- rely on retry policy if the failure is transient.

### Duplicate Trigger Delivery

If the same trigger is delivered again, the engine should detect the same idempotency key and skip re-execution. The SAD explicitly mandates this protection. 

## Non-Functional Requirements

### Performance

- Trigger evaluation should happen fast enough to support operationally useful automation after the event arrives. 
- Workflow lookup should use tenant/trigger/active indexes for speed. 

### Reliability

- Workflow execution must survive service restarts through BullMQ durability. 
- Idempotency must prevent repeated side effects. 
- Delayed jobs must fire exactly once from the business point of view, even if underlying job retries occur. 

### Scalability

- Workflow definitions and runs must scale by tenant with index-backed retrieval. 
- M-08 should remain extractable into an independent service in Phase 3. 

### Maintainability

- Business rule evaluation stays in TypeScript inside M-08. 
- No AI model logic in TypeScript. 
- No cross-module schema access. 
- Action catalog should remain explicit and versioned.

## Risks

- Overlap with Orchestrate may cause teams to misuse workflow automation for guided rep workflows instead of automated branching. 
- Poorly designed workflow definitions can create noisy or conflicting automations.
- Duplicate event processing can cause repeated actions if idempotency is weak. 
- Update actions may accidentally violate module boundaries if not carefully governed. 

## Open Decisions

- Final allowed action catalog for MVP.
- Whether multiple branches may execute on one trigger or only the first match.
- Whether failed runs can be manually replayed from admin UI.
- Whether `workflow_runs` should include richer status states beyond `running`, `completed`, and `failed`.
- Whether workflow execution should emit a dedicated downstream analytics event in future.

## Testing Strategy

### Unit Tests

- Validate workflow creation schema.
- Validate supported trigger event names.
- Validate branch condition operators.
- Validate first-match branch evaluation.
- Validate delayed action scheduling.
- Validate idempotency-key generation and duplicate skip.
- Validate action-type routing. 

### Integration Tests

- `tracker.detection.created` -> matching workflow run created. 
- `deal.stage.changed` -> matching workflow run created. 
- duplicate event -> no duplicate run. 
- delayed action scheduled through BullMQ.
- action failure causes run failure and retry path.
- `enrollplay` action correctly bridges into Orchestrate through approved boundaries. 

### End-to-End Tests

- Admin creates competitor mention escalation workflow. 
- Tracker event arrives and branch matches.
- Notification action runs.
- Play enrollment action runs.
- Workflow run appears in history as completed.
- Duplicate event replay does not create another run. 

### Negative Tests

- Invalid workflow definition at create time.
- Unsupported action type.
- Missing trigger payload field.
- User without admin role attempts workflow creation.
- Retry path after transient action failure.
- Duplicate delayed job execution attempt. 

## Acceptance Criteria

- Admin can create and activate a workflow through M-08 APIs. 
- Workflow definitions are stored in `workflows`. 
- Trigger events such as `tracker.detection.created` and `deal.stage.changed` can activate workflow evaluation. 
- Matching workflows create durable `workflow_runs` with idempotency protection. 
- Branch logic can select actions based on event conditions. 
- Action types such as `notify`, `enrollplay`, and `updatefield` can execute through approved boundaries. 
- Delayed actions use BullMQ delayed jobs. 
- Retries and DLQ behavior follow platform queue standards. 
- Workflow Automation remains separate from Orchestrate and M-02 features. 

## Example API Contracts

### Create Workflow Request
```json
{
  "name": "Proposal stage risk escalation",
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
            "channel": "inapp",
            "audience": "manager"
          }
        },
        {
          "type": "enrollplay",
          "params": {
            "playId": "proposal-defense-play-uuid"
          }
        }
      ]
    }
  ],
  "actions": [],
  "isActive": true
}
```

### Workflow Run Record
```json
{
  "runId": "uuid",
  "workflowId": "uuid",
  "tenantId": "uuid",
  "triggerEventPayload": {
    "eventId": "uuid",
    "dealId": "uuid",
    "fromStage": "discovery",
    "toStage": "proposal"
  },
  "status": "running",
  "startedAt": "2026-05-04T10:00:00Z",
  "completedAt": null,
  "idempotencyKey": "tenant-workflow-event"
}
```

### Completed Workflow Run
```json
{
  "runId": "uuid",
  "workflowId": "uuid",
  "status": "completed",
  "startedAt": "2026-05-04T10:00:00Z",
  "completedAt": "2026-05-04T10:00:03Z"
}
```

## Implementation Notes for Engineers

- Keep all workflow rule evaluation inside the NestJS M-08 module. 
- Start with deterministic branch logic and explicit action types.
- Use `workflow_runs.idempotencyKey` as a hard duplicate barrier. 
- Use BullMQ delayed jobs for scheduled actions because the SAD explicitly calls this out for Workflow Automation. 
- Never update another module’s tables directly from workflow actions. 
- Keep Workflow Automation focused on automated branching processes, not guided rep execution playbooks. 

## References

- Product mapping: M8 Sales Engagement includes Workflow Automation in product scope. 
- Product definition: Workflow Automation is complex branching automation for sales processes. 
- Architecture ownership: Workflow Automation belongs to M-08 Execution and Automation. 
- M-08 owns `workflows` and `workflow_runs`. 
- M-08 reacts to upstream events like `tracker.detection.created` and `deal.stage.changed`. 
- BullMQ delayed jobs are explicitly used by M-08 Workflow Automation. 