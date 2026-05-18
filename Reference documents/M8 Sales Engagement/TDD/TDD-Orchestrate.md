# TDD: Orchestrate

## Document Control

- Document ID: Doc #11c 
- Document Name: TDD: Orchestrate 
- Product Module: M8 Sales Engagement 
- Architecture Owner Module: M-08 Execution and Automation 
- File Path: `docs/modules/m08/tdd-orchestrate.md` 
- Version: v1.0-draft
- Status: Draft
- Owner: Product + Backend Engineering
- Reviewers: Tech Lead, Product Architect, Backend Lead, QA Lead
- Last Updated: 2026-05-04
- Source References: Product module mapping and System Architecture Document (SAD) 

## Boundary Note

Orchestrate is part of the **M8 Sales Engagement** product grouping, but its architectural ownership belongs to **M-08 Execution and Automation**. This document covers only the guided play orchestration capability implemented in M-08 and must not absorb Email Composer or Engage To-Do responsibilities, which belong to M-02. 

The M8 product grouping is a documentation and packaging view, not a single engineering module. The SAD is explicit that M-08 owns orchestration, workflow automation, and next-best-action style execution logic, so the implementation boundary in this TDD must stay inside M-08. 

## Purpose

Orchestrate translates go-to-market sales strategy into guided, trackable execution flows that help reps follow consistent sales motions at the right time. The product mapping describes it as a revenue workflow orchestration capability that helps define, execute, and measure GTM plays in one platform, bridging the gap between strategy and execution. 

The feature is responsible for play definition, enrollment into plays, guided next-best-action steps, step completion tracking, and business-impact measurement. It should react to upstream business signals through events rather than reaching into other modules’ internal schemas or logic. 

## Scope

### In Scope

- Definition of reusable GTM sales plays. 
- Enrollment of deals or users into plays. 
- Guided next-best-action sequencing for active play participants. 
- Play step completion tracking. 
- Play progress and lifecycle states such as active, paused, completed, or exited. 
- Event-driven play enrollment or action triggering from upstream signals such as `deal.stage.changed` and `tracker.detection.created`. 
- Measurement of adoption and business impact for plays. 
- Rep-facing retrieval of active enrollments and step status. 

### Out of Scope

- Email draft generation or sending, which belongs to M-02. 
- Centralized rep task list ownership, which belongs to M-02. 
- General branching workflow automation definitions, which belong to the sibling M-08 feature Workflow Automation, though Orchestrate may interact with the same signal ecosystem. 
- Direct CRM writes outside approved platform boundaries. 
- Direct querying of other modules’ internals. The SAD requires event-driven and public-API-based boundaries. 

## Users

- Sales Representative: receives guided next steps as part of an active play. 
- Sales Manager: defines standard sales motions and monitors execution consistency. 
- RevOps/Admin: creates and activates GTM plays for teams or tenants. 
- Revenue Leader: reviews whether play adoption correlates with better outcomes. 

## Goals

- Convert strategy into repeatable guided execution. 
- Give reps clear next-best-action steps at the right time. 
- Track whether plays are actually followed, not just defined. 
- Measure play adoption and business impact in a structured way. 
- Keep Orchestrate event-driven and independent at the architecture layer. 

## Non-Goals

- Becoming a full CRM or sales pipeline owner.
- Replacing task systems owned by M-02.
- Replacing generalized branching automation owned by Workflow Automation.
- Allowing direct DB access into M-03, M-05, M-06, or M-07 internals. 
- Embedding AI model logic directly in TypeScript. 

## Functional Overview

Orchestrate lets admins or RevOps define a sales play as a sequence of actionable steps with trigger conditions and guidance. A deal or user can then be enrolled into that play either manually or automatically when upstream events indicate that the conditions are met. 

Once enrolled, the rep sees the active play, current step, expected action, and progress. M-08 tracks step completion, play status, and execution progress so teams can see both whether the play is being followed and whether it is creating measurable business value. 

## Key Capabilities

### 1. Play Definition

The product mapping says Orchestrate helps organizations define GTM sales plays in a single platform. The SAD also defines a `salesplays` table with play name, steps, trigger conditions, and active state, which makes play definition a core first-class object in M-08. 

### 2. Enrollment Rules

Deals or users can be enrolled into a play when relevant business signals occur. The architecture for M-08 is event-driven, and the module explicitly reacts to signals such as `deal.stage.changed` and `tracker.detection.created`, so enrollment should use those signals instead of tight coupling to upstream services. 

### 3. Next-Best-Action Guidance

The product mapping says Orchestrate bridges strategy and execution by guiding sellers with real-time recommendations. The SAD says M-08 determines next-best-action based on conversation signals and rule-based triggers. 

### 4. Play Execution Tracking

The SAD defines enrollment and step completion entities such as `playenrollments` and `playstepcompletions`, which means the system is designed to track not only who is enrolled but also which step is currently active and what has already been completed. 

### 5. Business Impact Measurement

The product mapping explicitly says Orchestrate should measure business impact. This means the feature must support at least a baseline measurement model, such as adoption rate, completion rate, and outcome correlation by play. 

## User Stories

### Story 1: Define a repeatable sales play

As a RevOps admin, I want to define a standard GTM play with clear steps and trigger conditions so teams execute a consistent motion. 

### Story 2: Auto-enroll when a signal happens

As a system admin, I want a deal to enter a play when an approved signal such as stage change or tracker detection occurs so the play begins at the right time. 

### Story 3: See my next step

As a rep, I want to see my current play step and recommended next action so I know what to do now. 

### Story 4: Mark a step complete

As a rep, I want to mark a guided play step complete so my progress is tracked and the next step becomes available. 

### Story 5: Measure play adoption

As a manager, I want to see whether reps are actually following a play and whether it improves outcomes so I can refine the motion over time. 

## Assumptions

- Upstream modules already emit the required business signals, especially `tracker.detection.created` from M-05 and `deal.stage.changed` from the platform event chain used by M-08. 
- Revenue Graph context may be fetched through approved public APIs where explicitly allowed, but orchestration logic should remain mostly event-driven. 
- Business logic for play evaluation lives in TypeScript inside M-08, while AI model inference, if used later, must remain in the Python AI Services Layer. 
- Plays are tenant-scoped and can be activated or deactivated independently. 

## Dependencies

### Upstream Dependencies

- Platform Core for auth, RBAC, tenant context, and audit services. 
- M-05 Smart Tracking for `tracker.detection.created` signals consumed by M-08. 
- M-03/M-07 event chain for `deal.stage.changed` signals used to trigger stage-based execution logic in M-08. 
- M-06 outputs as execution-stage inputs, because the feature table shows Orchestrate depends on M-06 outputs. 
- M-03 Revenue Graph public API for deal/account context lookup where needed. 

### Downstream Dependencies

- M-09 Forecasting may consume M-08 execution data for forecasting logic, because forecasting is described as using M-07 and M-08 events. 
- Reporting, dashboards, or coaching may later consume play adoption and completion metrics. 

## Data Ownership

M-08 owns the core orchestration tables required for plays, enrollments, and step tracking. The SAD explicitly defines `salesplays`, `playenrollments`, and `playstepcompletions` under the M-08 module boundary. 

No other module should write directly into these tables. Cross-module interaction must happen through events or approved public APIs only. 

## Data Model

### Primary Table: `sales_plays`

Purpose: store reusable GTM play definitions. 

Fields from the SAD:
- `playId UUID PRIMARY KEY`
- `tenantId UUID NOT NULL`
- `name VARCHAR`
- `steps JSONB` — `stepNum`, `actionType`, `description`, `dueOffsetDays`
- `triggerConditions JSONB` — `eventType`, `field`, `operator`, `value`
- `createdBy UUID`
- `isActive BOOLEAN DEFAULT TRUE` 

### Primary Table: `play_enrollments`

Purpose: store enrollment of a deal/user into a play. 

Fields from the SAD:
- `enrollmentId UUID PRIMARY KEY`
- `playId UUID REFERENCES sales_plays(playId)`
- `dealId UUID NOT NULL`
- `tenantId UUID NOT NULL`
- `userId UUID NOT NULL`
- `currentStep INTEGER DEFAULT 0`
- `status VARCHAR` — `active | completed | paused | exited`
- `enrolledAt TIMESTAMPTZ` 

### Primary Table: `play_step_completions`

Purpose: store completion records for individual play steps. 

Fields from the SAD:
- `completionId UUID PRIMARY KEY`
- `enrollmentId UUID REFERENCES play_enrollments(enrollmentId)`
- `tenantId UUID NOT NULL`
- `stepId INTEGER`
- `completedBy UUID`
- `completedAt TIMESTAMPTZ`
- `notes TEXT` 

### Required Indexes

The SAD explicitly defines:
- `idx_enrollments_tenant_deal` on `(tenantId, dealId, status)` 
- `idx_enrollments_tenant_user` on `(tenantId, userId, status)` 

Recommended additional indexes:
- `idx_salesplays_tenant_active` on `(tenantId, isActive)` for active play selection.
- `idx_stepcompletions_tenant_enrollment` on `(tenantId, enrollmentId, stepId)` for efficient progress reconstruction.

These are practical implementation recommendations consistent with the M-08 schema design. 

## API Design

### 1. Get Plays

**Endpoint**  
`GET /api/v1/execution/plays` 

**Purpose**  
Return all sales plays for the tenant. 

**Caller**  
Frontend application. 

**Auth**  
JWT. 

### 2. Create Play

**Endpoint**  
`POST /api/v1/execution/plays` 

**Purpose**  
Create a new Orchestrate sales play. 

**Caller**  
Admin frontend. 

**Auth**  
JWT with Admin/RevOps role. 

**Request Example**
```json
{
  "name": "Late-stage competitive defense play",
  "steps": [
    {
      "stepNum": 1,
      "actionType": "review_signal",
      "description": "Review detected competitor mentions and deal context",
      "dueOffsetDays": 0
    },
    {
      "stepNum": 2,
      "actionType": "customer_follow_up",
      "description": "Send tailored follow-up to buyer champion",
      "dueOffsetDays": 1
    },
    {
      "stepNum": 3,
      "actionType": "manager_review",
      "description": "Review opportunity risk with manager",
      "dueOffsetDays": 2
    }
  ],
  "triggerConditions": [
    {
      "eventType": "tracker.detection.created",
      "field": "trackerType",
      "operator": "equals",
      "value": "competitor_mention"
    }
  ],
  "isActive": true
}
```

**Response Example**
```json
{
  "playId": "uuid",
  "name": "Late-stage competitive defense play",
  "isActive": true
}
```

### 3. Enroll in Play

**Endpoint**  
`POST /api/v1/execution/plays/:id/enroll` 

**Purpose**  
Enroll a deal in a sales play manually or as the final API surface used after event-driven rule evaluation. 

**Request Example**
```json
{
  "dealId": "uuid",
  "userId": "uuid",
  "enrollmentSource": "auto",
  "triggerEvent": "deal.stage.changed"
}
```

### 4. Get Active Enrollments for Current User

**Endpoint**  
`GET /api/v1/execution/plays/enrollments` 

**Purpose**  
Return active play enrollments for the current user. 

### 5. Mark Play Step Completed

**Endpoint**  
`PATCH /api/v1/execution/plays/enrollments/:id/step` 

**Purpose**  
Mark the current play step as completed. 

**Request Example**
```json
{
  "stepId": 2,
  "notes": "Buyer champion acknowledged competitor concern and requested pricing comparison."
}
```

**Response Example**
```json
{
  "enrollmentId": "uuid",
  "currentStep": 3,
  "status": "active"
}
```

## UI Components

### Play Library

Admin-facing view showing all available plays for the tenant, status, and trigger overview. 

### Play Builder

Admin-facing builder for defining steps and trigger conditions. The product mapping emphasizes play definition as a core part of Orchestrate. 

### Active Play Panel

Rep-facing panel showing currently enrolled plays, current step, next-best-action guidance, due timing, and progress. 

### Step Completion View

Lets the user complete the current step, add notes, and move the enrollment forward. 

### Adoption and Impact Dashboard

Manager-facing summary of play enrollment count, completion rate, and performance correlation. The product mapping explicitly calls out business-impact measurement. 

## Play Definition Design

A play is a reusable execution pattern that defines:
- when it should start,
- who it applies to,
- what steps must be followed,
- and how progress is tracked. 

### Play Fields

Recommended logical fields for the TDD:
- name
- description
- audience/team scope
- activation status
- trigger conditions
- steps
- owner
- success metrics
- effective date/version

The SAD explicitly provides `name`, `steps`, `triggerConditions`, `createdBy`, and `isActive`. Additional operational metadata can be added in later design revisions if needed. 

### Step Definition

Each step should at minimum define:
- step number
- action type
- instruction text
- due offset
- completion requirement
- optional evidence/notes requirement

This aligns with the SAD’s `steps JSONB` structure and the goal of trackable guided execution. 

## Enrollment Rules

Orchestrate should support both manual and automatic enrollment. Automatic enrollment is especially important because the module is intended to react to upstream business signals. 

### Manual Enrollment

A user or admin explicitly enrolls a deal into a play through the frontend using the enroll endpoint. 

### Automatic Enrollment

An upstream event arrives, M-08 evaluates active play rules, and if conditions match, it creates a play enrollment. The key signals documented for M-08 are:
- `tracker.detection.created` 
- `deal.stage.changed` 

### Enrollment Idempotency

If the same trigger event is processed more than once, the system must avoid duplicate enrollments for the same play/deal/event combination. The SAD states all events must be idempotent because BullMQ retries can deliver duplicates. 

Recommended dedupe identity:
- `tenantId`
- `playId`
- `dealId`
- `triggerEventId` or derived idempotency key

## Event-Driven Trigger Handling

The SAD explicitly says M-08 should react to upstream signals like tracker detections and deal-stage changes, and should stay event-driven rather than directly querying internals of other modules. 

### Event Consumed: `tracker.detection.created`

**Producer**  
M-05 Smart Tracking. 

**Usage in Orchestrate**  
Evaluate whether the detection should enroll or advance a play, especially for risk-based or competitor-based GTM motions. 

### Event Consumed: `deal.stage.changed`

**Producer path**  
Published as part of the platform event chain consumed by M-08 when deal stages change. 

**Usage in Orchestrate**  
Evaluate stage-based play activation, such as entering negotiation or proposal defense motions. 

### Trigger Evaluation Rule

M-08 should:
1. Receive the event.
2. Resolve the set of active plays for the tenant.
3. Compare event payload against each play’s trigger conditions.
4. If matched, create or update enrollment.
5. Store enough context to explain why the play started.
6. Avoid duplicate processing with an idempotency key. 

## Next-Best-Action Logic

The product mapping says Orchestrate provides real-time recommendations, and the SAD says M-08 determines next-best-action based on conversation signals and rule-based triggers. 

### MVP Approach

For MVP, next-best-action should be deterministic and step-based:
- If enrollment is active, current step drives the next action.
- If a required upstream signal has occurred, suggest the next defined step.
- If the step is overdue, surface urgency.
- If the play is paused or exited, do not suggest new steps. 

### Future AI-Assisted Approach

A later version may enrich recommendations using AI summaries and signal weighting, but AI model logic must remain in the Python AI Services Layer and not be embedded directly in TypeScript. 

## Play Execution Tracking

Execution tracking is central to Orchestrate because the feature is about turning strategy into measurable action, not just static playbooks. The SAD’s `playenrollments` and `playstepcompletions` tables are the core tracking model. 

### Enrollment Status Values

- `active`
- `completed`
- `paused`
- `exited` 

### Completion Behavior

When a rep completes a step:
1. validate current enrollment ownership and status,
2. write a `playstepcompletion`,
3. increment or update the enrollment’s current step,
4. mark the play completed if the final step is done. 

### Notes and Evidence

The step completion record includes a `notes` field in the SAD, so notes should be supported in the step-completion UI and API. 

## Business Impact Measurement

The product mapping says Orchestrate should measure business impact, not just activity. This means the system should support adoption and outcome measurement for each play. 

### Minimum Metrics

- play enrollment count
- active enrollment count
- step completion rate
- play completion rate
- average time to completion
- rep adoption rate
- deal progression after enrollment
- signal-to-enrollment conversion rate

The first five are directly aligned to play execution tracking, while the latter metrics support the product goal of measuring business impact. 

### Example Questions the Feature Should Answer

- Which plays are most adopted?
- Which plays are abandoned halfway?
- Do enrolled deals progress faster than non-enrolled deals?
- Which trigger conditions are producing useful enrollments?

## Security

### Authentication

All Orchestrate endpoints require JWT-based authentication via Platform Core. 

### Authorization

- Admin/RevOps role required for create/update play operations. 
- Standard user role can view only their own active enrollments unless broader access is granted by RBAC policy. 
- Step completion requires the current user to own or be authorized for the enrollment.

### Tenant Isolation

Every play, enrollment, step completion, and evaluation must be tenant-scoped. The architecture requires `tenantId` on all rows and strict tenant isolation. 

### Auditability

Play creation, activation, pause, exit, and step completion should be audit logged using Platform Core audit patterns. 

## Observability

M-08 is event-driven, so observability must cover both synchronous APIs and asynchronous trigger handling. The SAD expects structured logs, queue visibility, and monitoring for retries and failures. 

### Metrics

- play creation count
- active play count
- enrollment count by play
- event-to-enrollment conversion rate
- duplicate enrollment prevention count
- step completion count
- play completion rate
- average step completion latency
- trigger evaluation failure count 

### Logs

Log safely with tenant-aware metadata:
- play created
- play activated/deactivated
- trigger event received
- trigger matched
- enrollment created
- duplicate enrollment skipped
- step completed
- play completed
- trigger evaluation failed 

### Tracing

Trace path should cover:
event received -> trigger evaluation -> context fetch if needed -> enrollment create/update -> rep-facing retrieval -> step completion write. 

### Alerts

Alert on:
- rising trigger evaluation failures
- repeated duplicate enrollment attempts
- abnormal drop in event-to-enrollment conversion
- high latency on active enrollment queries 

## Error Handling

### Event Delivery Duplicates

Duplicate events must not create duplicate enrollments or repeated step actions. The architecture explicitly requires idempotent event handling. 

### Missing Context

If an event arrives without enough context to evaluate a play, the system should log the failure and skip safely rather than creating a broken enrollment.

### Invalid Step Completion

If a user attempts to complete a step out of order or on a closed enrollment, the API should reject the action with a validation error.

### Partial Failure

If enrollment creation succeeds but a follow-up notification fails, the enrollment should remain persisted. The core execution state must be durable even if secondary UX signals fail. This is aligned with the event-driven durability principles in the SAD. 

## Non-Functional Requirements

### Performance

- Trigger evaluation should happen fast enough to support near-real-time rep guidance after upstream events. 
- Active enrollment retrieval should use tenant/user/deal indexes defined in the M-08 data model. 

### Reliability

- Event processing must tolerate retries and duplicate delivery. 
- Enrollment state must remain consistent under concurrent updates.
- Step completion writes must be atomic.

### Scalability

- The M-08 boundary must support later extraction into an independent service in Phase 3. 
- Play definitions and enrollments should scale by tenant without cross-tenant contention. 

### Maintainability

- Keep rule evaluation in TypeScript business logic inside M-08. 
- Keep AI inference out of the product service layer. 
- Use events and public APIs only. 
- Avoid coupling Orchestrate logic to Workflow Automation internals even though both live in M-08.

## Risks

- Overlapping responsibility between Orchestrate and Workflow Automation may confuse implementation if boundaries are not documented clearly. 
- Weak trigger definitions may create noisy or low-value enrollments.
- Duplicate events may create repeated enrollments if idempotency is not enforced. 
- Poorly designed step guidance may reduce rep adoption even if the engine works technically.

## Open Decisions

- Final admin UX for play builder and trigger authoring.
- Exact allowed trigger condition operators for MVP.
- Whether a play may enroll by account as well as by deal in a future phase.
- Whether next-best-action recommendations in MVP are purely deterministic or partially AI-enriched.
- Whether play completion should emit a dedicated platform event for downstream analytics in a later phase.

## Testing Strategy

### Unit Tests

- Validate play creation schema.
- Validate step structure and ordering.
- Validate trigger condition evaluation.
- Validate duplicate enrollment prevention.
- Validate next-best-action derivation from current step.
- Validate step completion state transitions. 

### Integration Tests

- `tracker.detection.created` -> play evaluation -> enrollment created. 
- `deal.stage.changed` -> play evaluation -> enrollment created. 
- Duplicate trigger event -> no duplicate enrollment. 
- GET plays returns tenant-scoped play library. 
- PATCH step completion updates enrollment progress. 

### End-to-End Tests

- Admin creates a competitive-defense play and activates it. 
- Tracker detection event triggers play enrollment for the correct deal. 
- Rep sees active play and current next step. 
- Rep completes step 1 and step 2 becomes current.
- Final step completion marks enrollment completed.
- Manager sees adoption and completion metrics for the play. 

### Negative Tests

- User without admin role attempts to create a play.
- Duplicate trigger event delivered twice.
- Enrollment request for invalid deal.
- Step completion attempt for wrong user or closed enrollment.
- Trigger payload missing required fields. 

## Acceptance Criteria

- Admin can create and activate a sales play through M-08 APIs. 
- System stores play definitions in `sales_plays`.
- System can enroll a deal into a play manually or through event-driven trigger logic. 
- `tracker.detection.created` and `deal.stage.changed` can be used as orchestration signals. 
- Rep can retrieve active play enrollments and see the current guided step. 
- Rep can complete a play step and progress is persisted in `play_step_completions`.
- Duplicate events do not create duplicate enrollments. 
- Orchestrate remains inside M-08 and does not absorb M-02 task/email responsibilities. 
- Feature supports baseline business-impact measurement for plays. 

## Example API Contracts

### Create Play Request
```json
{
  "name": "Proposal-stage executive alignment play",
  "steps": [
    {
      "stepNum": 1,
      "actionType": "stakeholder_review",
      "description": "Review open stakeholders and confirm decision committee",
      "dueOffsetDays": 0
    },
    {
      "stepNum": 2,
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

### Enrollment Response
```json
{
  "enrollmentId": "uuid",
  "playId": "uuid",
  "dealId": "uuid",
  "userId": "uuid",
  "currentStep": 1,
  "status": "active",
  "enrolledAt": "2026-05-04T10:00:00Z"
}
```

### Step Completion Request
```json
{
  "stepId": 1,
  "notes": "Reviewed opportunity stakeholders and identified missing finance approver."
}
```

## Implementation Notes for Engineers

- Keep all orchestration business logic inside the NestJS M-08 module. 
- Use event-driven trigger evaluation as the default design path. 
- Do not read upstream module tables directly. 
- Use explicit idempotency keys for event-driven enrollment.
- Make next-best-action guidance deterministic first, then enrich later if needed.
- Keep Orchestrate and Workflow Automation separate even though both are in M-08; Orchestrate is guided play execution, while Workflow Automation is branching process automation. 

## References

- Product mapping: M8 Sales Engagement includes Orchestrate in the product scope. 
- Product definition: Orchestrate defines, executes, and measures GTM sales plays, bridging strategy and execution. 
- Architecture ownership: Orchestrate belongs to M-08 Execution and Automation. 
- M-08 owns `sales_plays`, `play_enrollments`, and `play_step_completions`.
- M-08 reacts to upstream signals such as `tracker.detection.created` and `deal.stage.changed` using event-driven logic. 