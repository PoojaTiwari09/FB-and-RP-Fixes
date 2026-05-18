# M8 Sales Engagement

## Overview

M8 Sales Engagement is the **product grouping** for execution-facing seller workflows such as email drafting, rep task management, guided plays, and workflow automation. In the product mapping, M8 includes **Email Composer**, **Engage To-Do**, **Orchestrate**, and **Workflow Automation**. 

At the architecture level, however, these features do **not** belong to a single engineering module. The SAD explicitly identifies a conflict because the product-facing M8 grouping spans both **M-02 Sales Engagement** and **M-08 Execution and Automation**, which creates TDD misrouting risk if the boundary is not made explicit. 

## Boundary

This folder groups the product documentation for M8 Sales Engagement, but engineering ownership is split across two architecture modules. **Email Composer** and **Engage To-Do** belong to **M-02 Sales Engagement**, while **Orchestrate** and **Workflow Automation** belong to **M-08 Execution and Automation**. 

The SAD requires this ambiguity to be resolved through a formal architectural decision. Until the naming is fully cleaned up in the canonical module map, every TDD and PR under this product area must state which architecture module owns the feature implementation. 

## Feature Map

| Feature | Product Group | Architecture Owner | Purpose |
|---|---|---|---|
| Email Composer | M8 Sales Engagement  | M-02 Sales Engagement  | Compose, send, and schedule AI-personalized sales emails using interaction and deal context.  |
| Engage To-Do | M8 Sales Engagement  | M-02 Sales Engagement  | Centralized rep task list that prioritizes emails, calls, LinkedIn actions, and follow-ups.  |
| Orchestrate | M8 Sales Engagement  | M-08 Execution and Automation  | Define, execute, and measure GTM sales plays with guided next-best-action steps.  |
| Workflow Automation | M8 Sales Engagement  | M-08 Execution and Automation  | Automate complex branching sales processes using event-driven trigger rules and actions.  |

## Why split ownership

The split exists because the product view is optimized for customer understanding, while the system architecture is optimized for clean service boundaries, schema ownership, and future independent deployment. The SAD says modules must communicate through events or approved public APIs, never by directly querying another module’s schema or importing internal logic. 

This means M8 should be treated as a **documentation umbrella**, not as a single backend module. If a fresher starts coding from the product list alone, they can easily put Orchestrate logic inside M-02 or put task logic inside M-08, which is exactly the kind of boundary mistake this README is meant to prevent. 

## Architecture mapping

### M-02 Sales Engagement

M-02 owns the sales engagement data and APIs for rep-facing email and task execution. The SAD says M-02 produces prioritized rep task queues, AI-generated emails, automated email sequences, and CRM activity logs, and its schema includes tables such as `email_drafts`, `email_sends`, `email_templates`, `email_flows`, `email_flow_enrollments`, and `tasks`. 

Features implemented in M-02 for this product group:
- Email Composer. 
- Engage To-Do. 

### M-08 Execution and Automation

M-08 owns execution logic that reacts to signals and drives guided or automated follow-through. The SAD says M-08 produces activated sales plays with guided next steps, automated branching workflows, and real-time competitor mention alerts, and its schema includes `sales_plays`, `play_enrollments`, `play_step_completions`, `workflows`, and `workflow_runs`. 

Features implemented in M-08 for this product group:
- Orchestrate. 
- Workflow Automation. 

## Documents in this folder

- `tdd-email-composer.md` — TDD for Email Composer, owned by M-02. 
- `tdd-engage-todo.md` — TDD for Engage To-Do, owned by M-02. 
- `tdd-orchestrate.md` — TDD for Orchestrate, owned by M-08. 
- `tdd-workflow-automation.md` — TDD for Workflow Automation, owned by M-08. 

If a new feature is added under the M8 product grouping, the first question must be: **does it belong to M-02 or M-08?** That decision should be made before code, migration, or API work begins. 

## Event model

M8 product features depend heavily on the platform event bus. The SAD defines key events used across these features, including `call.transcription.completed`, `email.sent`, `tracker.detection.created`, `deal.stage.changed`, and `insight.summary.ready`. 

These events are consumed differently depending on ownership:
- M-02 uses `call.transcription.completed` to create follow-up email tasks and uses `email.sent` as its own outbound event for downstream consumers. 
- M-08 uses `tracker.detection.created`, `deal.stage.changed`, and `insight.summary.ready` to trigger play enrollment, workflow automation evaluation, and next-best-action behavior. 

## Rules for engineers

- Do not use the product label **M8** as the code ownership answer by itself. Always map the feature to **M-02** or **M-08** first. 
- Do not query another module’s schema directly. Use events or approved public APIs only. 
- Keep business logic in TypeScript product services, and keep AI inference in Python AI services. 
- Make all event consumers idempotent because the SAD explicitly says duplicate event delivery is possible through BullMQ retries. 
- Every new TDD, migration, queue consumer, and PR in this area must state the architecture owner module clearly. 

## Suggested folder note

A simple rule for this folder is:

- If the feature is about **email drafting, scheduling, sending, templates, flows, or rep tasks**, it likely belongs to **M-02**. 
- If the feature is about **guided plays, branching automation, trigger rules, next-best-action orchestration, or signal-driven execution**, it likely belongs to **M-08**. 

This shortcut is not a replacement for architecture review, but it is a very useful first filter for interns and freshers. 

## Open architecture note

The SAD explicitly says this M-02 versus M-08 overlap is a **critical conflict** and requires:
- exact feature boundary definition,
- canonical naming updates,
- an ADR documenting the decision (Drafted: [ADR-001: M8 Product vs Architecture Boundary](ADR-001-M8-Product-vs-Architecture-Boundary.md)),
- and updates to the module descriptions after resolution. 

Until that ADR is finalized, this README should remain at the top of the M8 docs folder so nobody assumes M8 is one backend module. 

