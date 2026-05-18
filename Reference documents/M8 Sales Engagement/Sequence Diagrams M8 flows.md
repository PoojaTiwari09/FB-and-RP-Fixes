# Sequence Diagrams: M8 Flows

## Purpose

This document captures the main runtime flows for **M8 Sales Engagement** features using sequence diagrams. In product language, M8 includes **Email Composer**, **Engage To-Do**, **Orchestrate**, and **Workflow Automation**, but at the architecture level these features are split across **M-02 Sales Engagement** and **M-08 Execution and Automation**. 

The diagrams below focus on the most important end-to-end behaviors that a developer or fresher needs to understand before building inside this area. They follow the SAD event model and keep cross-module communication event-driven wherever the architecture requires it. 

## Boundary Reminder

- **M-02 Sales Engagement** owns:
  - Email Composer 
  - Engage To-Do 

- **M-08 Execution and Automation** owns:
  - Orchestrate 
  - Workflow Automation 

- **M8 Sales Engagement** is the product grouping only. It is **not** one backend module. 

## Flow List

This file includes the core flows:
1. Post-call follow-up task creation in Engage To-Do. 
2. Draft and send email using Email Composer. 
3. Auto-enroll a deal into Orchestrate from tracker detection. 
4. Trigger Workflow Automation from deal stage change. 
5. Orchestrate + Workflow Automation interaction boundary. 

---

## Flow 1: Post-call follow-up task creation

This is one of the most important M8 flows because the SAD explicitly states that **M-02 consumes `call.transcription.completed`** and creates an AI-suggested follow-up email task for the call owner, with an idempotency guard that skips duplicate task creation for the same `sourceId = callId`. 

```mermaid
sequenceDiagram
    autonumber
    participant M01 as M-01 Data Ingestion
    participant BUS as Event Bus / BullMQ
    participant M02 as M-02 Sales Engagement
    participant DB as engagement.tasks
    participant UI as Rep To-Do UI

    M01->>BUS: Publish call.transcription.completed
    BUS->>M02: Deliver call.transcription.completed
    M02->>DB: Check existing task by tenantId + source=callcompletion + sourceId=callId
    alt Task already exists
        DB-->>M02: Existing task found
        M02-->>M02: Skip duplicate creation
    else Task not found
        DB-->>M02: No existing task
        M02->>DB: Insert follow-up email task (pending, prioritized, dueDate)
    end
    UI->>M02: GET /api/v1/engagement/tasks
    M02->>DB: Fetch current user prioritized tasks
    DB-->>M02: Task list
    M02-->>UI: Return task list
```

### Notes

- Producer: `call.transcription.completed` comes from **M-01 Data Ingestion**. 
- Consumer: **M-02 Sales Engagement** consumes that event. 
- Required behavior: create follow-up task **idempotently** so retries do not create duplicates. 

---

## Flow 2: Draft and send email using Email Composer

Email Composer belongs to **M-02 Sales Engagement** and supports composing, sending, and scheduling AI-personalized emails. The SAD also allows **M-02** to call the **M-03 Revenue Graph public API** for real-time context lookup, which is one of the few documented synchronous cross-module exceptions. 

```mermaid
sequenceDiagram
    autonumber
    participant USER as Sales Rep
    participant UI as Email Composer UI
    participant M02 as M-02 Sales Engagement
    participant M03 as M-03 Revenue Graph API
    participant AI as AI Services Layer
    participant DB as engagement.email_drafts / email_sends
    participant MAIL as Gmail/Outlook
    participant BUS as Event Bus / BullMQ

    USER->>UI: Open composer for contact/deal
    UI->>M02: Request draft context
    M02->>M03: GET deal/contact context via public API
    M03-->>M02: Deal + contact + activity context
    M02->>AI: Request personalized email draft
    AI-->>M02: Draft subject + body
    M02->>DB: Save draft
    M02-->>UI: Return draft to user

    USER->>UI: Click Send
    UI->>M02: Send email
    M02->>MAIL: Send through Gmail/Outlook provider
    MAIL-->>M02: Provider accepted send
    M02->>DB: Save email send record
    M02->>BUS: Publish email.sent
    M02-->>UI: Send success response
```

### Notes

- **M-02 emits `email.sent`** after successful send persistence. 
- Downstream consumers of `email.sent` include **M-03**, **M-05**, and **M-07**. 
- This flow is primarily synchronous from the user’s point of view, but the downstream impact after `email.sent` is event-driven. 

---

## Flow 3: Auto-enroll Orchestrate play from tracker detection

Orchestrate belongs to **M-08 Execution and Automation** and reacts to event signals such as `tracker.detection.created`. The SAD says M-08 evaluates configured logic from these signals and uses them for play enrollment and next-best-action behavior. 

```mermaid
sequenceDiagram
    autonumber
    participant M05 as M-05 Smart Tracking
    participant BUS as Event Bus / BullMQ
    participant M08 as M-08 Execution and Automation
    participant DB1 as execution.sales_plays
    participant DB2 as execution.play_enrollments
    participant UI as Rep Play Panel

    M05->>BUS: Publish tracker.detection.created
    BUS->>M08: Deliver tracker.detection.created
    M08->>DB1: Find active plays for tenant triggered by tracker.detection.created
    DB1-->>M08: Matching play definitions
    M08->>DB2: Check idempotent enrollment for playId + dealId + trigger event
    alt Enrollment already exists
        DB2-->>M08: Existing enrollment found
        M08-->>M08: Skip duplicate enrollment
    else Enrollment missing
        DB2-->>M08: No enrollment found
        M08->>DB2: Create play enrollment with currentStep=1
    end
    UI->>M08: GET /api/v1/execution/plays/enrollments
    M08->>DB2: Fetch active enrollments for user
    DB2-->>M08: Enrollment list
    M08-->>UI: Return active play + next step
```

### Notes

- Producer: **M-05 Smart Tracking** emits `tracker.detection.created`. 
- Consumer: **M-08 Execution and Automation** consumes it. 
- This flow belongs to **Orchestrate**, not Workflow Automation, because the main output is **guided play enrollment** rather than generalized branch execution. 

---

## Flow 4: Trigger Workflow Automation from deal stage change

Workflow Automation also belongs to **M-08**, but unlike Orchestrate, it focuses on **complex branching automation**. The SAD says `deal.stage.changed` is consumed by M-08, and workflow runs should be tracked using `workflowruns` with a unique `idempotencyKey` to prevent duplicate trigger execution. 

```mermaid
sequenceDiagram
    autonumber
    participant M03 as M-03 Revenue Graph
    participant BUS as Event Bus / BullMQ
    participant M08 as M-08 Execution and Automation
    participant WF as execution.workflows
    participant RUN as execution.workflow_runs
    participant JOB as BullMQ Delayed Jobs
    participant OUT as Notification / Action Target

    M03->>BUS: Publish deal.stage.changed
    BUS->>M08: Deliver deal.stage.changed
    M08->>WF: Find active workflows by triggerEvent=deal.stage.changed
    WF-->>M08: Matching workflows
    M08->>RUN: Check idempotencyKey
    alt Duplicate trigger
        RUN-->>M08: Existing workflow run found
        M08-->>M08: Skip duplicate processing
    else New trigger
        RUN-->>M08: No matching run
        M08->>RUN: Insert workflowrun status=running
        M08->>M08: Evaluate branches and conditions
        alt Immediate action path
            M08->>OUT: Execute notify / enrollplay / updatefield action
        else Delayed action path
            M08->>JOB: Schedule delayed action
        end
        M08->>RUN: Mark workflowrun completed
    end
```

### Notes

- Producer: `deal.stage.changed` is published by **M-03 Revenue Graph** in the event registry. 
- Consumers: **M-08** and **M-09** consume it. 
- Workflow Automation must remain **retry-safe** and **idempotent** because BullMQ retries can redeliver events. 

---

## Flow 5: Orchestrate and Workflow Automation boundary

Freshers often confuse these two because both live in **M-08** and both can react to the same signal family. This sequence shows the correct separation: **Workflow Automation** can trigger an `enrollplay` action, but the actual **play enrollment** still belongs to the Orchestrate side of M-08. 

```mermaid
sequenceDiagram
    autonumber
    participant EVT as Upstream Event
    participant WF as Workflow Automation Engine
    participant RUN as workflow_runs
    participant ORCH as Orchestrate Engine
    participant ENR as play_enrollments
    participant UI as Rep Play UI

    EVT->>WF: Trigger workflow evaluation
    WF->>RUN: Create workflow run
    WF->>WF: Evaluate matching branch
    WF->>ORCH: Execute action type = enrollplay
    ORCH->>ENR: Create or verify play enrollment
    ENR-->>ORCH: Enrollment active
    ORCH-->>WF: enrollplay action success
    WF->>RUN: Mark workflow run completed
    UI->>ORCH: Request active play enrollments
    ORCH-->>UI: Return guided next step
```

### Notes

- **Workflow Automation** decides whether an action should happen. 
- **Orchestrate** owns the play model and enrollment records. 
- Keeping these concerns separate avoids turning Workflow Automation into a duplicate play engine. 

---

## Ownership cheat sheet

| Flow | Primary Feature | Owner Module | Main Trigger |
|---|---|---|---|
| Post-call follow-up task creation | Engage To-Do  | M-02  | `call.transcription.completed`  |
| Draft and send email | Email Composer  | M-02  | User action, then `email.sent` emitted  |
| Play enrollment from tracker signal | Orchestrate  | M-08  | `tracker.detection.created`  |
| Branching automation from stage change | Workflow Automation  | M-08  | `deal.stage.changed`  |
| Workflow triggers play enrollment | Workflow Automation + Orchestrate  | M-08  | Branch action `enrollplay`  |

## Event cheat sheet

The most relevant event names for M8 flows are:
- `call.transcription.completed` 
- `email.sent` 
- `tracker.detection.created` 
- `deal.stage.changed` 
- `call.summary.generated` 
- `insight.summary.ready` was added during architecture review as a missing event that M-08 may depend on in future or extended flows. 

## Developer rules

- Never treat **M8** as one backend code module. Map each flow to **M-02** or **M-08** first. 
- Use **events or approved public APIs**, not direct cross-schema reads. 
- Make all event consumers **idempotent**. 
- Keep **business logic in TypeScript** product services and **AI inference in Python** AI services. 
- If you add a new event to any sequence diagram, first ensure it exists in the formal event registry. The SAD is explicit that unregistered queue names should not be introduced casually. 