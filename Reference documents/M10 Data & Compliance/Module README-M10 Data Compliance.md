# M10 Data Compliance

M10 Data Compliance is the product-facing module that groups three foundational capabilities: **Revenue Graph**, **Configure Compliance Settings**, and **Data Cloud / Data Export**. Together, these capabilities connect captured interactions to revenue entities, enforce compliant outreach and data-usage controls, and give customers reliable access to their own exported data for analytics and governance.

This README exists to help the team understand M10 at the product level **without** accidentally treating it as one single engineering-owned subsystem. That distinction matters because the three M10 features serve a shared business purpose, but they are not owned by one single architecture module.

---

## Ownership Map

| Product Feature in M10 | What it does | Real architecture owner |
|---|---|---|
| Revenue Graph | Connects captured interactions to accounts, contacts, deals, teams, and activity context. | M-03 Revenue Graph |
| Configure Compliance Settings | Enforces outreach and data-usage governance using CRM opt-outs, consent state, and regional policies. | Platform Core / Cross-cutting Governance |
| Data Cloud / Data Export | Exports customer-owned platform data into customer warehouses like Snowflake or BigQuery. | M-03 Revenue Graph / Data Platform |

### Important boundary rule

**Do not write one oversized “M10 TDD.”**  
M10 is a product grouping, not a single technical subsystem. The correct documentation approach is:

- one shared README for M10,
- one TDD for Revenue Graph,
- one TDD for Configure Compliance Settings,
- one TDD for Data Cloud / Data Export,
- plus sequence docs and environment registry docs where needed.

---

## Why M10 matters

M10 is foundational because many downstream features depend on these capabilities even when end users do not see them directly.

- **Revenue Graph** gives the platform a connected business context, so downstream AI and workflow features know which account, contact, deal, and activity an interaction belongs to.
- **Configure Compliance Settings** ensures the platform does not execute outreach or restricted data usage in ways that violate tenant policy, CRM opt-out data, regional privacy rules, or customer consent boundaries.
- **Data Cloud** ensures customers can access and export their own data into their own warehouse for reporting, analytics, portability, and governance.

In simple terms, M10 answers three critical platform questions:

1. What does this interaction belong to?
2. Are we allowed to use or act on this data?
3. Can the customer get their data out reliably?

---

## Product Scope

According to the product mapping, M10 Data & Compliance includes:

- data collection support,
- automatic data capture,
- data modelling,
- data sync,
- ML training governance,
- and compliance.

That broad wording is important because M10 is not only about legal policy settings. It also covers how captured data becomes structured business context and how that customer-owned data is made portable outside the platform.

### Included features

- Revenue Graph
- Configure Compliance Settings
- Data Cloud / Data Export

### Shared business value

The three features together support:
- trusted customer data handling,
- connected revenue context,
- compliant outreach,
- enterprise governance readiness,
- and customer-controlled data portability.

---

## Feature Overview

## Revenue Graph

Revenue Graph is the connected revenue data layer that links captured calls, meetings, emails, CRM records, and other interaction signals to the correct accounts, contacts, deals, teams, and activities.

It is built around three core design areas:

1. **Automated Data Capture Engine**  
   Collects revenue-related interaction signals across the customer lifecycle.

2. **Contextual Data Mapping**  
   Organizes and links captured records to the right business entities.

3. **AI Context Layer**  
   Makes that linked graph usable by downstream AI features, search, automation, summaries, forecasting, and analytics.

### Why it matters
Without Revenue Graph, downstream modules would only have disconnected transcripts, emails, and CRM fragments. Revenue Graph turns those raw records into business context.

---

## Configure Compliance Settings

Configure Compliance Settings is the cross-cutting governance layer that allows tenant admins to define and enforce communication and data-usage policies across the platform.

It is responsible for:
- CRM opt-out enforcement,
- regional communication policy handling,
- consent-aware behavior,
- policy evaluation at outreach time,
- and audit logging of policy changes and decisions.

### Why it matters
Without this feature, the platform could automate outreach or data usage in unsafe ways. This capability ensures that system actions follow tenant policy and privacy expectations before execution.

---

## Data Cloud / Data Export

Data Cloud is the structured export capability that sends customer-owned R-Revenue Intelligence data into client-owned destinations such as Snowflake, BigQuery, Databricks, S3, or Redshift.

It is responsible for:
- export dataset definition,
- destination connector support,
- scheduled sync,
- idempotent export jobs,
- retry and replay handling,
- and ownership/deletion-aware export behavior.

### Why it matters
Without Data Cloud, the platform becomes a closed system. With Data Cloud, customers can combine R-Revenue Intelligence data with their broader data stack and maintain ownership of exported records.

---

## Architecture Positioning

M10 is easiest to understand when separated into two technical ownership zones.

### Zone 1: Model and data foundation
These features are primarily aligned to **M-03 Revenue Graph / Data Platform**:

- Revenue Graph
- Data Cloud / Data Export

These are both part of the model/data layer because they deal with how captured interactions become connected business records and how those records are later exported.

### Zone 2: Cross-cutting governance
This feature is primarily aligned to **Platform Core / Governance**:

- Configure Compliance Settings

This is not tied to one module’s internal logic. It is a shared enforcement layer that affects outreach, workflow execution, data usage, tenant isolation, and auditability across the platform.

---

## Dependency Summary

| Capability | Upstream dependencies | Downstream consumers |
|---|---|---|
| Revenue Graph | M-01 capture events, CRM context, connector metadata | Conversation intelligence, tracking, summaries, deal/account views, forecasting, dashboards |
| Configure Compliance Settings | CRM opt-out data, consent logs, tenant policy config, region rules, auth/RBAC | Email Composer, Workflow Automation, Orchestrate, call actions, data-usage controls |
| Data Cloud | Revenue Graph data, upstream module outputs, connector config, compliance/deletion state | Customer warehouses, BI tools, enterprise reporting, governance workflows |

### Simple rule for new team members

- If the feature is about **linking interaction data to business entities**, it belongs with Revenue Graph.
- If the feature is about **allowing or blocking outreach or governed data use**, it belongs with Configure Compliance Settings.
- If the feature is about **moving tenant-owned data to the customer’s warehouse**, it belongs with Data Cloud.

---

## What this module produces

At the product level, M10 produces three outcomes:

1. **Connected revenue context**  
   Every important interaction can be tied to the right account, contact, deal, and activity history.

2. **Governed platform behavior**  
   Outreach and certain data-usage actions can be checked against tenant policy, consent state, and regional communication rules.

3. **Customer-owned data portability**  
   Customers can export structured platform data to their own warehouses without depending on manual Relanto.ai action.

These outcomes are invisible infrastructure for many users, but they are essential for enterprise trust and downstream feature correctness.

---

## Core design principles

The M10 documentation and implementation should follow these principles:

### 1. Split by real ownership
Do not document or implement M10 as one monolith. Keep Revenue Graph, compliance governance, and Data Cloud separate where architecture ownership is different.

### 2. Tenant isolation first
Every data path in M10 must preserve tenant isolation. This includes graph linking, policy evaluation, export jobs, audit logs, and replay workflows.

### 3. Idempotent processing
Revenue Graph event handling and Data Cloud export jobs must be safe under retries and duplicate delivery.

### 4. Policy enforcement at runtime
Compliance is not only an admin configuration screen. Enforcement must happen at actual decision points such as email send, call action, workflow execution, and governed data usage.

### 5. Customer ownership of data
The platform must support customer data export, deletion-aware handling, and consent-aware restrictions without hidden manual dependencies.

---

## Recommended documentation structure

The correct M10 documentation structure is:

```text
docs/modules/m10/
├── README.md
├── tdd-revenue-graph.md
├── tdd-configure-compliance-settings.md
├── tdd-data-cloud.md
├── sequence-capture-to-entity-linking.md
├── sequence-compliance-policy-enforcement.md
├── sequence-data-cloud-export.md
├── sequence-consent-change-or-deletion-enforcement.md
└── env-registry.md
```

### Why this structure is recommended

This split keeps:
- product understanding in one place,
- feature-specific technical design in the right TDD,
- cross-feature runtime flows in sequence docs,
- and infrastructure config in the env registry.

That prevents the common mistake of mixing entity linking logic, governance enforcement, and warehouse sync details into one document that becomes hard to build, review, and maintain.

---

## Recommended TDD boundaries

## TDD — Revenue Graph
Use this doc for:
- Automated Data Capture Engine
- Contextual Data Mapping
- AI Context Layer
- entity linking for accounts, deals, contacts, and activities
- Revenue Graph APIs
- Revenue Graph event publication

Do **not** put policy enforcement logic or warehouse connector logic here.

## TDD — Configure Compliance Settings
Use this doc for:
- CRM opt-out enforcement
- GDPR/CCPA-style regional rules
- admin configuration model
- policy evaluation service
- outreach-time email and call restriction enforcement
- audit and policy-change logging

Do **not** put entity linking logic or warehouse sync internals here.

## TDD — Data Cloud / Data Export
Use this doc for:
- export scope and schema
- destination connector support
- scheduling and checkpoints
- idempotency
- retry and replay
- ownership, deletion, and consent-aware export behavior

Do **not** put graph entity resolution or runtime outreach policy logic here.

---

## Sequence diagrams to maintain

The best sequence docs for M10 are:

1. Captured interaction to Revenue Graph entity linking
2. Admin updates compliance settings to outreach policy enforcement
3. Scheduled Data Cloud export to warehouse sync and retry path
4. Customer deletion request or consent change to governance and export enforcement

These sequence docs are useful because the feature boundaries cross module lines, and flow diagrams make ownership and control points easier to understand.

---

## Environment and configuration areas

The M10 environment registry should group variables by capability:

### Revenue Graph
- graph processing workers
- event subscriptions
- CRM mapping and sync settings
- confidence thresholds if configurable
- queue names and retry settings

### Configure Compliance Settings
- policy evaluation flags
- region-policy feature flags
- CRM opt-out sync settings
- audit logging controls
- consent-enforcement toggles

### Data Cloud
- destination connector settings
- export schedules
- batch sizes
- checkpoint controls
- retry policy
- secret references for warehouse credentials

A shared env registry is useful, but ownership should still be marked per capability.

---

## Who should read what

| Role | Read first | Why |
|---|---|---|
| Backend engineer | README → relevant TDD | Understand ownership before implementation |
| Frontend engineer | README → compliance TDD if building admin UI | Understand what is configuration vs runtime enforcement |
| Data engineer | README → Revenue Graph TDD → Data Cloud TDD | Understand source model and export pipeline |
| Security / governance reviewer | README → compliance TDD | Understand policy boundaries and enforcement points |
| QA engineer | README → sequence docs → all 3 TDDs | Validate end-to-end cross-feature flows |
| PM / new team member | README | Fast understanding of M10 scope and split ownership |

---

## Common mistakes to avoid

- Treating M10 as one engineering subsystem
- Writing one giant TDD that mixes graph, policy, and export concerns
- Assuming Configure Compliance Settings is only a UI screen
- Assuming Data Cloud is only a one-time export tool
- Adding direct cross-module database writes instead of using the correct boundaries
- Forgetting that Revenue Graph and Data Cloud mainly belong to M-03 ownership
- Forgetting that compliance decisions must be enforced at runtime, not only saved in config

---

## Working rule for implementation

When a new M10-related requirement appears, ask these three questions in order:

1. Is this about linking interaction data to the right business entity?  
   If yes, it belongs to **Revenue Graph**.

2. Is this about whether the platform is allowed to communicate or use data in a certain way?  
   If yes, it belongs to **Configure Compliance Settings**.

3. Is this about moving customer-owned data out to a client-owned warehouse or destination?  
   If yes, it belongs to **Data Cloud**.

If a requirement touches more than one of those questions, document the shared flow in a sequence diagram and keep implementation ownership separate.

---

## Summary for new team members

M10 Data Compliance is a **product grouping of foundational trust and data capabilities**. It exists so the platform can:

- understand the business context of captured interactions,
- enforce compliant usage and outreach rules,
- and let customers reliably access their own data outside the application.

That is why M10 is critical even though it is not one single technical subsystem.
