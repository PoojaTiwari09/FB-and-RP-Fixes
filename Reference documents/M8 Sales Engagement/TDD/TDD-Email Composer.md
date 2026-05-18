# TDD: Email Composer

## Document Control

- Document ID: Doc #11a 
- Document Name: TDD: Email Composer 
- Product Module: M8 Sales Engagement 
- Architecture Owner Module: M-02 Sales Engagement 
- File Path: `docs/modules/m08/tdd-email-composer.md` 
- Version: v1.0-draft
- Status: Draft
- Owner: Product + Backend Engineering
- Reviewers: Tech Lead, Product Architect, Frontend Lead, Security Lead
- Last Updated: 2026-05-04
- Source References: Product module mapping and System Architecture Document (SAD) 

## Boundary Note

Email Composer is part of the **M8 Sales Engagement** product grouping, but its implementation belongs to **M-02 Sales Engagement**, not M-08. The M8 product view is a documentation grouping for users and commercial packaging, while engineering ownership must follow the SAD module boundary to avoid TDD misrouting. 

This document covers only Email Composer capabilities implemented by M-02, including AI draft generation, template usage, deal context viewing, email scheduling, sending through delegated Gmail or Outlook accounts, and email history. It does not cover Orchestrate or Workflow Automation, which belong architecturally to M-08. 

## Purpose

Email Composer enables a sales rep to generate, edit, schedule, and send context-aware emails directly inside the platform without switching tools. The feature is intended to reduce manual writing effort, improve personalization quality, and maintain sales activity continuity using CRM, call, and deal context already captured in the platform. 

The design must preserve clear module boundaries. M-02 owns the email draft, email send, template, flow, enrollment, task, and LinkedIn activity objects, while other modules provide context through public APIs or events rather than internal table access. 

## Scope

### In Scope

- AI-generated email draft creation using available interaction and deal context. 
- Manual editing of generated drafts before send. 
- Template selection and template variable replacement. 
- Deal context panel shown beside the composer. 
- Email scheduling for future send. 
- Sending through the rep’s delegated Gmail or Outlook account. 
- Email history view for sent and scheduled emails. 
- Event emission after successful send using `email.sent`. 
- Optional use in email flows and enrollments owned by M-02. 

### Out of Scope

- Sending from a Relanto-managed SMTP or mail server. The SAD explicitly disallows this. 
- M-08 orchestration rules, branching automation, or next-best-action execution. 
- CRM direct-write logic outside published APIs and approved integration points. 
- Real-time in-call email generation. This feature is post-interaction or workspace-driven, not live call guidance. 

## Users

- Sales Representative: creates, edits, schedules, and sends emails. 
- Account Executive: uses deal and contact context to personalize emails. 
- SDR/BDR: uses templates and flows for repeatable outreach. 
- RevOps/Admin: manages templates and tenant-level configuration for supported sending integrations. 

## Goals

- Let reps compose and send contextual emails from one place. 
- Improve consistency through reusable templates and AI-assisted drafting. 
- Maintain trust and deliverability by sending only through user-delegated Gmail or Outlook accounts. 
- Keep module boundaries clean so future extraction of M-02 remains possible without architecture rework. 

## Non-Goals

- Replacing full marketing automation systems. 
- Building a general-purpose mailbox or inbox client. 
- Cross-module direct database reads from M-03, M-07, or M-08 internals. 
- Background automation logic owned by M-08. 

## Functional Overview

Email Composer allows a user to start from a blank draft, a template, a suggested follow-up, or an AI-generated draft. The draft can use contact, account, deal, recent activity, and call-derived context so the rep gets a relevant starting point instead of writing from scratch. 

The user can edit the subject and body, preview variable resolution, optionally schedule the send, and send through a delegated Gmail or Outlook account. On successful delivery submission, M-02 stores the send record and emits `email.sent` for downstream consumers such as Revenue Graph and Deal Management. 

## Key Capabilities

### 1. AI Draft Generation

The system can generate a draft using interaction context, likely including recent calls, linked deal state, contact details, and next-step cues. The SAD shows M-02 calling the AI Services Layer endpoint for email generation, and the product mapping explicitly lists AI-generated personalized email drafts as part of Email Composer. 

The generated draft is always editable by the user before send. If AI generation fails or returns a low-confidence result, the user must still be able to write or send a manual email. 

### 2. Templates and Variables

Users can pick reusable templates maintained at the tenant level. Templates include dynamic fields for personalization, such as contact name, company, deal name, owner name, or other approved merge values. 

Variable resolution must happen safely and predictably. Missing variables should not break sending; instead the UI should show unresolved placeholders clearly and block send only when required fields are empty. 

### 3. Deal Context Panel

The composer UI should show useful context beside the draft, such as linked contact, account, deal information, past activity, and possibly recent interaction notes. This aligns with the product mapping requirement for a deal context panel to support better personalization. 

M-02 may call an approved public API from M-03 for real-time CRM and deal context lookup because the SAD explicitly documents this as an exception for email personalization. It must not query M-03 tables directly. 

### 4. Email Scheduling

Users can choose immediate send or scheduled send. Delayed execution should use the platform event/job system because the SAD identifies BullMQ delayed jobs as the standard mechanism for email scheduling. 

Scheduled emails remain editable until execution time, subject to product policy. The system must persist schedule metadata and prevent duplicate sends if retry or worker restarts occur. 

### 5. Delegated Provider Send

Actual sending must happen through the rep’s own delegated Gmail or Outlook account. The SAD explicitly states that sending from a Relanto mail server is not allowed because of deliverability, trust, and compliance concerns. 

This means the platform acts as an orchestration layer for draft preparation and delegated send submission, not as the origin mail server. Provider choice is stored on the send record. 

### 6. Email History

Users can view prior sent emails and scheduled emails for their workspace context. The M-02 APIs include email history retrieval for the current user. 

History should support filtering by recipient, date range, provider, and status when implemented. The source of truth remains M-02 email draft and send records, with downstream systems consuming the emitted events. 

## User Stories

### Story 1: Generate follow-up email from context

As a sales rep, I want the system to generate a follow-up email draft using recent interaction and deal context so I can respond quickly with relevant content. 

### Story 2: Use a template with personalization

As a rep, I want to start from a template and automatically fill contact or deal variables so I can send consistent but personalized outreach. 

### Story 3: Schedule an email

As a rep, I want to schedule an email for a future time so I can contact the buyer at the right moment without staying online. 

### Story 4: Send using my connected mailbox

As a rep, I want my email to be sent from my own Gmail or Outlook account so the buyer sees it as coming from me directly. 

### Story 5: Review previous emails

As a rep, I want to see my sent and scheduled emails so I can track what has already gone out. 

## Assumptions

- Users are authenticated through Platform Core and all requests carry tenant and user identity. 
- Gmail and Outlook connections are already authorized through OAuth2 before send. 
- Revenue Graph can provide approved real-time deal/contact context through a public API where needed for personalization. 
- AI generation is provided by the Python AI Services Layer, not implemented inside TypeScript services. 

## Dependencies

### Upstream Dependencies

- Platform Core for auth, tenant context, RBAC, and audit services. 
- M-03 Revenue Graph public API for contact/deal/account context lookup used in personalization. This is a documented exception. 
- AI Services Layer `POST /v1/generate-email` for draft generation. 
- OAuth integrations for Gmail API and Outlook/Microsoft Graph API delegated sending. 

### Downstream Consumers

- M-03 Revenue Graph consumes `email.sent` to log the email as an activity. 
- M-05 Smart Tracking consumes `email.sent` for tracker detection on email body and intent signals. 
- M-07 Deal and Account Management consumes `email.sent` to update deal last-activity state. 

## Data Ownership

M-02 owns the engagement schema objects needed by Email Composer, especially `email_drafts`, `email_sends`, `email_templates`, `email_flows`, and `email_flow_enrollments`. Ownership means M-02 is the only module allowed to write these records directly. 

Other modules may consume M-02 outputs only through published APIs or events. No other module may directly update M-02 engagement tables. 

## Data Model

### Primary Tables

#### `email_drafts`
Purpose: stores generated, manual, scheduled, and sent drafts. 

Suggested fields from the SAD:
- `draftId UUID PRIMARY KEY`
- `tenantId UUID NOT NULL`
- `userId UUID NOT NULL`
- `recipientContactId UUID`
- `subject TEXT`
- `body TEXT`
- `status VARCHAR` — `draft | sent | scheduled | generated`
- `generatedFromCallId UUID`
- `aiConfidenceScore FLOAT`
- `flaggedForReview BOOLEAN`
- `createdAt TIMESTAMPTZ DEFAULT NOW()` 

#### `email_sends`
Purpose: stores actual send attempts/submissions and send outcomes at the platform layer. 

Suggested fields from the SAD:
- `sendId UUID PRIMARY KEY`
- `tenantId UUID NOT NULL`
- `userId UUID NOT NULL`
- `draftId UUID REFERENCES email_drafts(draftId)`
- `sentAt TIMESTAMPTZ`
- `openTracked BOOLEAN DEFAULT FALSE`
- `clickTracked BOOLEAN DEFAULT FALSE`
- `replyReceived BOOLEAN DEFAULT FALSE`
- `providerUsed VARCHAR` — `gmail | outlook` 

#### `email_templates`
Purpose: stores reusable tenant templates. 

Suggested fields:
- `templateId UUID PRIMARY KEY`
- `tenantId UUID NOT NULL`
- `name VARCHAR`
- `subjectTemplate TEXT`
- `bodyTemplate TEXT`
- `language VARCHAR`
- `createdBy UUID` 

#### `email_flows`
Purpose: stores multi-step flow definitions that can reference automated email steps. 

Fields include:
- `flowId UUID PRIMARY KEY`
- `tenantId UUID NOT NULL`
- `name VARCHAR`
- `steps JSONB`
- `triggerCondition VARCHAR`
- `createdBy UUID` 

#### `email_flow_enrollments`
Purpose: stores contact enrollment state inside flows. 

Fields include:
- `enrollmentId UUID PRIMARY KEY`
- `tenantId UUID NOT NULL`
- `flowId UUID REFERENCES email_flows(flowId)`
- `contactId UUID`
- `currentStep INTEGER`
- `status VARCHAR`
- `enrolledAt TIMESTAMPTZ` 

### Required Indexes

- `idx_email_drafts_tenant_user` on `(tenantId, userId, createdAt DESC)` for fast user history retrieval. This aligns with the SAD index pattern. 
- `idx_email_sends_tenant_user_sentat` on `(tenantId, userId, sentAt DESC)` for history and timeline views. This is a derived implementation recommendation consistent with module indexing rules. 
- `idx_email_templates_tenant_name` on `(tenantId, name)` for template lookup. 
- `idx_email_flow_enrollments_tenant_flow` on `(tenantId, flowId, status)` as described in the SAD. 

## API Design

### 1. Generate Draft

**Endpoint**
`POST /api/v1/engagement/emails/generate` 

**Purpose**
Generate a draft using AI Services and available context. 

**Caller**
Frontend application. 

**Auth**
JWT, tenant-scoped user. 

**Request Example**
```json
{
  "recipientContactId": "uuid",
  "dealId": "uuid",
  "accountId": "uuid",
  "sourceCallId": "uuid",
  "templateId": "uuid",
  "tone": "professional",
  "goal": "follow_up",
  "language": "en",
  "additionalInstructions": "Mention pricing recap and propose next meeting."
}
```

**Response Example**
```json
{
  "draftId": "uuid",
  "subject": "Following up on our conversation",
  "body": "Hi {{contact.firstName}}, ...",
  "status": "generated",
  "aiConfidenceScore": 0.86,
  "flaggedForReview": false,
  "contextSummary": {
    "dealId": "uuid",
    "contactId": "uuid",
    "sourceCallId": "uuid"
  }
}
```

**Processing Notes**
- Validate request with runtime schema validation. 
- Fetch allowed context from M-03 public API if deal/contact context is requested. 
- Call AI Services `POST /v1/generate-email`. 
- Save draft in `email_drafts`. 
- Return draft payload to UI. 

### 2. Send Email

**Endpoint**
`POST /api/v1/engagement/emails/send` 

**Purpose**
Send a prepared draft using the rep’s delegated Gmail or Outlook account. 

**Caller**
Frontend application. 

**Auth**
JWT, tenant-scoped user, connected mailbox required. 

**Request Example**
```json
{
  "draftId": "uuid",
  "provider": "gmail",
  "to": ["buyer@company.com"],
  "cc": [],
  "bcc": [],
  "subject": "Following up on our conversation",
  "bodyHtml": "<p>Hi John, ...</p>",
  "sendMode": "now"
}
```

**Response Example**
```json
{
  "sendId": "uuid",
  "draftId": "uuid",
  "status": "sent",
  "providerUsed": "gmail",
  "sentAt": "2026-05-04T09:00:00Z"
}
```

**Rules**
- Must send via delegated Gmail or Outlook account only. 
- Must reject unsupported providers. 
- Must emit `email.sent` only after provider submission succeeds. 
- Must record provider used in `email_sends`. 

### 3. Schedule Email

**Endpoint**
`POST /api/v1/engagement/emails/schedule`

**Purpose**
Store a future send request and enqueue delayed execution via BullMQ delayed jobs, which the SAD identifies as the standard pattern for email scheduling. 

**Request Example**
```json
{
  "draftId": "uuid",
  "provider": "outlook",
  "scheduledAt": "2026-05-05T13:30:00Z",
  "to": ["buyer@company.com"]
}
```

**Response Example**
```json
{
  "draftId": "uuid",
  "status": "scheduled",
  "scheduledAt": "2026-05-05T13:30:00Z"
}
```

### 4. Get Email History

**Endpoint**
`GET /api/v1/engagement/emails` 

**Purpose**
Return paginated sent and scheduled email history for the current user. 

**Query Params**
- `status`
- `provider`
- `fromDate`
- `toDate`
- `contactId`
- `page`
- `pageSize`

### 5. Get Templates

**Endpoint**
`GET /api/v1/engagement/templates` 

**Purpose**
Return all tenant templates available to the user. 

### 6. Create Template

**Endpoint**
`POST /api/v1/engagement/templates` 

**Purpose**
Create a tenant-level reusable template. 

**Auth**
JWT with RevOps/Admin role. 

## UI Components

### Email Composer Panel

Main editing area for subject and body. It supports manual writing, generated content insertion, and template application. 

### Deal Context Panel

Displays linked account, deal, contact, and recent activity context to help the rep personalize the message. 

### Template Picker

Lets users choose a template and preview variable substitution before insertion. 

### Scheduling Drawer

Allows selection of provider, date, time, and timezone for delayed send. The backend persists this and enqueues the delayed job. 

### History View

Lists sent and scheduled emails for the user. This view is backed by M-02 records and may surface delivery submission status. 

## Functional Flow

### Flow A: Generate AI Draft

1. User opens Email Composer from a contact, deal, task, or general compose action. 
2. Frontend loads allowed context, including recipient and optional linked deal/account information. 
3. Frontend calls `POST /api/v1/engagement/emails/generate`. 
4. M-02 validates input and reads tenant/user identity from Platform Core context. 
5. If needed, M-02 fetches personalization context from the approved M-03 public API. This is a documented exception in the SAD. 
6. M-02 calls AI Services `POST /v1/generate-email`. 
7. AI Services returns subject/body draft plus confidence metadata. 
8. M-02 stores the draft in `email_drafts` with status `generated`. 
9. UI renders the generated draft for user editing. 

### Flow B: Send Immediately

1. User edits the draft and clicks Send. 
2. Frontend calls `POST /api/v1/engagement/emails/send`. 
3. M-02 verifies provider connection and scopes for the current user. 
4. M-02 sends through Gmail API or Outlook Graph API using delegated OAuth2 credentials. 
5. On success, M-02 writes `email_sends`, updates draft status, and emits `email.sent`. 
6. M-03, M-05, and M-07 consume the event independently. 

### Flow C: Schedule Email

1. User selects a future send time. 
2. Frontend calls schedule endpoint. 
3. M-02 stores draft status `scheduled` and creates a BullMQ delayed job for execution time. 
4. At scheduled time, the worker checks current validity and mailbox authorization. 
5. The worker sends the email through delegated provider APIs. 
6. On success, M-02 writes `email_sends` and emits `email.sent`. 

## Provider Integration Rules

### Gmail

Use Gmail API with user-delegated OAuth2 tokens. Tokens must be stored securely through approved secret and integration handling patterns. 

### Outlook

Use Microsoft Graph / Outlook API with user-delegated OAuth2 tokens. Same tenant and user isolation rules apply. 

### Hard Rule

Do not send from a Relanto-controlled SMTP account or generic mail server. The SAD explicitly marks this as wrong and disallowed. 

## Template Variable Rules

Allowed variables should be drawn from approved context domains only. Recommended categories include:
- User: rep name, rep title, rep email.
- Contact: first name, last name, job title, email.
- Account: company name.
- Deal: deal name, stage, close date if available.
- Activity: recent meeting/call summary references where allowed. 

Variable rendering rules:
- Unknown variables render as unresolved placeholders in preview.
- Required variables may block send if unresolved.
- Optional variables may render blank or fallback text.
- Escaping rules must protect HTML output and prevent template injection.

## AI Design

The AI drafting capability belongs to the Python AI Services Layer. The SAD explicitly prohibits embedding AI inference logic inside TypeScript product services. 

### AI Inputs

- Contact context
- Deal context
- Recent interaction summary
- Selected tone or intent
- Template prompt, if any
- Language preference 

### AI Outputs

- Draft subject
- Draft body
- Confidence score
- Optional flags for human review 

### AI Fallback Behavior

If the AI service times out, fails, or returns low confidence, M-02 should return a graceful failure response so the user can continue with manual composition. The user must not be blocked from sending a manual email. 

## Events

### Event Emitted: `email.sent`

**Producer**
M-02 Sales Engagement. 

**Consumers**
M-03 Revenue Graph, M-05 Smart Tracking, M-07 Deal and Account Management. 

**Queue**
`email.sent` 

**Payload**
- `eventId`
- `sendId`
- `tenantId`
- `userId`
- `contactId`
- `dealId`
- `accountId`
- `subject`
- `sentAt`
- `providerUsed`
- `flowEnrollmentId` 

**Rules**
- Emit only once the provider confirms send acceptance. 
- Payload schema is owned by M-02 as publisher. 
- Consumers must tolerate retries and duplicates using idempotency practices. 

## Error Handling

### AI Generation Failures

If AI draft generation fails, return a user-friendly error and allow manual composition. Do not crash the compose session. 

### Provider Authorization Errors

If Gmail/Outlook tokens are missing, expired, or revoked, the send should fail clearly with reconnect instructions. The system must not silently drop the email. 

### Scheduling Execution Failures

If a scheduled send fails temporarily, retry according to queue policy. If retries are exhausted, mark the scheduled send as failed and alert monitoring. 

### Event Publish Failures

If the provider send succeeds but event publish fails, retry event publication without re-sending the actual email. Send submission and event publication must be separated carefully to avoid duplicate emails. This is a design requirement derived from the event-driven architecture and idempotency rules. 

## Idempotency

Idempotency is mandatory because BullMQ retries can deliver the same job more than once. The SAD states that event handling and asynchronous processing must be idempotent. 

Recommended idempotency protections:
- Use a send request id or deterministic dedupe key for scheduled send execution.
- Before provider submission, verify the draft has not already been sent for the same execution attempt.
- Emit `email.sent` using the persisted `sendId` as the stable identity. 

## Security

### Authentication

All endpoints require JWT-based authentication through Platform Core. 

### Authorization

- Only the authenticated tenant user may compose/send with their own delegated mailbox unless an approved delegated-send policy exists.
- Template creation requires elevated role such as RevOps/Admin. 

### Tenant Isolation

All email draft, send, and template reads/writes must be tenant-scoped. The architecture requires tenant-aware isolation using the common platform patterns. 

### Secret Management

OAuth secrets, refresh tokens, client secrets, and provider credentials must be stored via approved secret management, not in code or repos. The SAD standard is Doppler for secrets management. 

### Content Safety

- Sanitize HTML before display and before provider submission.
- Prevent template injection.
- Prevent access to cross-tenant context data.
- Respect compliance restrictions and contact opt-out logic if enforced by shared compliance policies. 

## Observability

The feature should expose metrics, logs, tracing, and health-relevant signals so issues are easy to debug. The SAD requires structured monitoring across modules and queue-based flows. 

### Metrics

- Draft generation request count
- Draft generation latency
- AI generation success rate
- AI flagged-for-review rate
- Send success rate by provider
- Scheduled send success rate
- Provider auth failure count
- Event publish success/failure count 

### Logs

Log these with tenant-safe metadata:
- draft generated
- draft generation failed
- email scheduled
- email send submitted
- provider send failed
- event published
- event publish retry 

### Tracing

Trace path should cover:
Frontend request -> M-02 API -> M-03 context lookup if used -> AI Services call -> DB write -> provider API -> event publish. 

### Alerts

Alert on:
- repeated Gmail/Outlook send failures
- rising scheduled send failure rate
- `email.sent` queue publish failures
- unusual AI timeout spikes 

## Non-Functional Requirements

### Performance

- Draft generation should feel interactive for the user and return within acceptable user-facing latency. The SAD sets synchronous AI calls to maximum 30 seconds for user-facing paths, though a much lower practical target should be used. 
- Send submission should return quickly after provider acceptance. 

### Reliability

- Scheduled sends must survive worker restarts because BullMQ provides durable delayed jobs. 
- Provider transient failures must retry safely. 

### Scalability

- M-02 remains part of the modular monolith in Phase 1-2, but boundaries must support later extraction. 
- Queue-based delayed sends should scale horizontally with workers when needed. 

### Maintainability

- No direct cross-module imports.
- No AI logic inside TypeScript.
- Public API and event contracts only. 

## Compliance Considerations

Email sending is user-delegated, which helps align sender identity with the actual rep. Compliance restrictions such as opt-out handling and regional policies must be respected through shared platform compliance rules where applicable. 

The feature must maintain auditable records of send actions and configuration changes where required by platform policy. Audit logging should use Platform Core facilities rather than ad hoc custom audit tables. 

## Open Decisions

- Confirm the final approved provider abstraction model: direct Gmail/Outlook integration only, or whether a unified abstraction layer is allowed in future. The SAD notes this as an open question. 
- Confirm whether scheduled emails remain editable until execution time or are snapshotted at schedule creation.
- Confirm whether open/click tracking is enabled in MVP or only placeholder schema fields exist first. The SAD includes `openTracked` and `clickTracked` fields, but product rollout detail still needs confirmation. 
- Confirm exact allowed merge-variable catalog and fallback rules.

## Risks

- Ambiguous product vs architecture ownership may cause engineers to place automation logic in the wrong module. This TDD explicitly keeps Email Composer in M-02. 
- Provider token expiry may create failed sends at execution time for scheduled emails. 
- Over-reliance on AI may produce low-quality drafts if context retrieval is weak. 
- Duplicate send risk exists if scheduling and retry paths are not idempotent. 

## Testing Strategy

### Unit Tests

- Validate input schemas for generate, send, schedule, and template operations.
- Test template variable resolution.
- Test unresolved variable handling.
- Test provider selection rules.
- Test idempotency logic for scheduled sends.
- Test fallback behavior when AI service fails. 

### Integration Tests

- M-02 -> AI Services `generate-email` integration. 
- M-02 -> M-03 public API context lookup path. 
- M-02 -> Gmail API delegated send. 
- M-02 -> Outlook API delegated send. 
- M-02 -> BullMQ delayed job execution for scheduled send. 
- M-02 -> `email.sent` event publish and downstream contract validation. 

### End-to-End Tests

- User generates AI draft from deal context and sends immediately. 
- User selects template, edits draft, and sends through Gmail. 
- User schedules an Outlook email and send occurs at the correct time. 
- Failed provider auth prompts reconnect flow. 
- Sent email appears in history after successful send. 

### Negative Tests

- Attempt send without mailbox connection.
- Attempt send with invalid tenant ownership.
- AI service timeout during draft generation.
- Duplicate scheduled job execution.
- Event publish retry after DB write success. 

## Acceptance Criteria

- User can generate an AI draft from approved context. 
- User can choose a template and see variables resolved clearly. 
- User can manually edit subject and body before send. 
- User can send through delegated Gmail or Outlook only. 
- User can schedule an email for future delivery using platform job infrastructure. 
- Successful send creates `email_sends` record and emits `email.sent`. 
- Sent and scheduled emails are visible in user history. 
- No direct cross-module DB access is used. 
- AI failure does not block manual compose and send. 

## Example API Contracts

### Generate Draft Response
```json
{
  "draftId": "2e3ab9d1-1111-2222-3333-444444444444",
  "subject": "Next steps from our pricing discussion",
  "body": "Hi Priya,\n\nThanks again for the conversation today. Based on what we discussed around timeline, pricing, and rollout needs, I wanted to share the next steps...\n",
  "status": "generated",
  "aiConfidenceScore": 0.88,
  "flaggedForReview": false
}
```

### Email Sent Event
```json
{
  "eventId": "f39b2e77-1111-2222-3333-444444444444",
  "sendId": "b82f6e4f-1111-2222-3333-444444444444",
  "tenantId": "a1f0c111-1111-2222-3333-444444444444",
  "userId": "c3d0a222-1111-2222-3333-444444444444",
  "contactId": "d4e0b333-1111-2222-3333-444444444444",
  "dealId": "e5f0c444-1111-2222-3333-444444444444",
  "accountId": "f6a0d555-1111-2222-3333-444444444444",
  "subject": "Next steps from our pricing discussion",
  "sentAt": "2026-05-04T09:00:00Z",
  "providerUsed": "gmail",
  "flowEnrollmentId": null
}
```

## Implementation Notes for Engineers

- Keep all business logic in the NestJS M-02 module. 
- Use AI Services only for inference; do not place prompt logic in frontend. 
- Use public APIs or events for cross-module communication; never import or query another module’s internals directly. 
- Treat scheduled sends as durable jobs with idempotent execution. 
- Keep the code boundary clean so future extraction of M-02 remains easy. 

## References

- Product mapping: M8 Sales Engagement includes Email Composer, Engage To-Do, Orchestrate, and Workflow Automation. 
- Architecture ownership: Email Composer belongs to M-02 Sales Engagement. 
- M-02 owned data model, APIs, delegated send rule, and `email.sent` event contract come from the SAD. 

