# Sequence Diagrams — M8 Sales Engagement Flows

## 1. Document Control

- **Document Title:** Sequence Diagrams — M8 Sales Engagement Flows
- **Module Name:** M8 Sales Engagement
- **Technical Workspace:** `modules/m08-sales-engagement/`
- **Owner:** Product Engineering — M8
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Purpose & Module Boundaries

This document defines the runtime flows for the core capabilities of **M8 Sales Engagement** in Mermaid sequence diagram notation.

Under the **v3.0 Codebase SSOT**, all four features (**Email Composer**, **Engage To-Do**, **Orchestrate**, and **Workflow Automation**) are physically unified within a single independent package located at `modules/m08-sales-engagement/`. They utilize a shared PostgreSQL schema namespace `m08_sales_engagement` and a canonical API prefix `/api/v1/m08-sales-engagement`.

All diagrams below have been aligned to standard decoupled modules:
- **M1 Capture & Transcription:** Publishes transcriptions.
- **M2 Conversation Intelligence:** Publishes tracker detections.
- **M8 Sales Engagement:** Owns outreach, tasks, playbooks, and automations.
- **M10 Data & Compliance:** Owns opportunity stages and CRM transactional context.

---

## 3. Core Sequence Diagrams

### Flow 1: Post-call prioritized follow-up task creation
This flow illustrates how M8 consumes a call completion signal to idempotently create a rep follow-up task in Engage To-Do.

```mermaid
sequenceDiagram
    autonumber
    participant M1 as M1 Capture & Transcription
    participant BUS as Event Bus / BullMQ
    participant M8 as M8 Sales Engagement
    participant DB as m08_sales_engagement.tasks
    participant UI as Rep To-Do UI

    M1->>BUS: Publish call.transcription.completed
    BUS->>M8: Deliver call.transcription.completed
    M8->>DB: Check existing task by (tenant_id, source='callcompletion', source_id=callId)
    alt Task already exists (Queue Redelivery)
        DB-->>M8: Existing task record found
        M8-->>M8: Skip duplicate creation (Idempotent success)
    else Task does not exist
        DB-->>M8: No matching task found
        M8->>DB: Insert follow-up email task (status='pending', priority=1, due_date=next_business_day)
    end
    UI->>M8: GET /api/v1/m08-sales-engagement/tasks
    M8->>DB: Fetch rep prioritized tasks (pending -> priority -> due_date)
    DB-->>M8: Sorted tasks list
    M8-->>UI: Return task queue payload
```

---

### Flow 2: AI email draft generation and delegated send
This flow shows the delegated email composing and immediate dispatch path, calling M10 for context.

```mermaid
sequenceDiagram
    autonumber
    participant USER as Sales Representative
    participant UI as Email Composer UI
    participant M8 as M8 Sales Engagement
    participant M10 as M10 Data & Compliance API
    participant AI as AI Services Layer
    participant DB as m08_sales_engagement.email_drafts
    participant MAIL as Gmail / Outlook API
    participant BUS as Event Bus / BullMQ

    USER->>UI: Open composer beside opportunity context
    UI->>M8: Request personalized draft
    M8->>M10: GET opportunity/contact metadata via public REST API
    M10-->>M8: Return contact name, deal stage, company info
    M8->>AI: POST /v1/generate-email (payload with context)
    AI-->>M8: Return subject + body draft
    M8->>DB: Save draft inside m08_sales_engagement.email_drafts (status='generated')
    M8-->>UI: Render email draft in workspace
    
    USER->>UI: Click Send
    UI->>M8: Send email immediately
    M8->>MAIL: Dispatch via delegated OAuth2 connections
    MAIL-->>M8: Provider accepted send
    M8->>DB: Update draft status to 'sent' & save send log in m08_sales_engagement.email_sends
    M8->>BUS: Publish email.sent (containing metadata)
    M8-->>UI: Render sending success confirmation
```

---

### Flow 3: Auto-enroll deal in GTM Playbook from Tracker Detection
This flow shows how GTM playbooks are automatically activated when meeting trackers detect risk.

```mermaid
sequenceDiagram
    autonumber
    participant M2 as M2 Conversation Intelligence
    participant BUS as Event Bus / BullMQ
    participant M8 as M8 Sales Engagement
    participant SP as m08_sales_engagement.sales_plays
    participant PE as m08_sales_engagement.play_enrollments
    participant UI as Rep Playbook UI

    M2->>BUS: Publish tracker.detection.created
    BUS->>M8: Deliver tracker.detection.created (e.g., competitor_mention)
    M8->>SP: Find active plays triggered by tracker_detection
    SP-->>M8: Return play definition (steps array)
    M8->>PE: Check existing enrollment by (tenant_id, play_id, deal_id, trigger_event_id)
    alt Play already active
        PE-->>M8: Active enrollment found
        M8-->>M8: Skip duplicate enrollment
    else Play not active
        PE-->>M8: No enrollment found
        M8->>PE: Create play_enrollment (current_step=1, status='active')
    end
    UI->>M8: GET /api/v1/m08-sales-engagement/plays/enrollments
    M8->>PE: Fetch active GTM playbooks
    PE-->>M8: Enrollments details
    M8-->>UI: Render guided steps and playbook progress
```

---

### Flow 4: Branching Workflow triggers notification alert (decoupled Slack)
This flow highlights how branching automations trigger Slack alerts safely using the Platform Notification Service.

```mermaid
sequenceDiagram
    autonumber
    participant M10 as M10 Data & Compliance
    participant BUS as Event Bus / BullMQ
    participant M8 as M8 Sales Engagement
    participant WF as m08_sales_engagement.workflows
    participant WR as m08_sales_engagement.workflow_runs
    participant PNS as Platform Notification Service

    M10->>BUS: Publish deal.stage.changed
    BUS->>M8: Deliver deal.stage.changed (e.g., proposal phase entered)
    M8->>WF: Find active workflows triggered by deal.stage.changed
    WF-->>M8: Return workflow branches and actions array
    M8->>WR: Check idempotency_key (tenant:workflow:event_id)
    alt Duplicate trigger detected
        WR-->>M8: Active run already recorded
        M8-->>M8: Skip duplicate processing
    else New trigger run
        WR-->>M8: No run found
        M8->>WR: Insert workflow_run record (status='running')
        M8->>M8: Evaluate branches & conditions (toStage == 'proposal')
        alt Match Found - Notify Action
            M8->>BUS: Publish notification.alert.requested (Slack channel & template context)
            BUS->>PNS: Deliver notification request to Platform Notification Service
            PNS-->>PNS: Dispatch message to Slack channel (Safe Decoupled Token)
        end
        M8->>WR: Update workflow_run record (status='completed')
    end
```

---

### Flow 5: Branching Workflow Auto-Enrollment Handoff
Shows the interaction boundary between Workflow Automation and GTM Playbook Orchestration.

```mermaid
sequenceDiagram
    autonumber
    participant EVT as Upstream Event (e.g., deal.stage.changed)
    participant WF as Workflow Automation Engine
    participant WR as m08_sales_engagement.workflow_runs
    participant ORCH as Playbook Orchestration Engine
    participant PE as m08_sales_engagement.play_enrollments

    EVT->>WF: Trigger workflow evaluation
    WF->>WR: Create workflow_run (status='running')
    WF->>WF: Evaluate branch matching (Action: enrollplay)
    WF->>ORCH: Trigger play enrollment (dealId, playId)
    ORCH->>PE: Insert or verify play_enrollment
    PE-->>ORCH: Playbook enrollment active
    ORCH-->>WF: Return enrollment success
    WF->>WR: Update workflow_run (status='completed')
```

---

## 4. Key Ownership & Events Telemetry

### Developer Cheat Sheet

| Feature | Data Namespace | Primary API prefix | Primary Queue Trigger |
| :--- | :--- | :--- | :--- |
| **Email Composer** | `m08_sales_engagement.email_*` | `/api/v1/m08-sales-engagement/emails` | `email.sent` (Emitted) |
| **Engage To-Do** | `m08_sales_engagement.tasks` | `/api/v1/m08-sales-engagement/tasks` | `call.transcription.completed` (Consumed) |
| **Orchestrate** | `m08_sales_engagement.sales_plays` | `/api/v1/m08-sales-engagement/plays` | `tracker.detection.created` (Consumed) |
| **Workflow Automation** | `m08_sales_engagement.workflows` | `/api/v1/m08-sales-engagement/workflows` | `deal.stage.changed` (Consumed) |
| **Platform Notification** | N/A (Platform Layer) | N/A (Platform Layer) | `notification.alert.requested` (Emitted) |