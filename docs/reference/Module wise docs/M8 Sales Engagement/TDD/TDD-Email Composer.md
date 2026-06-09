# Technical Design Document (TDD): Email Composer

## 1. Document Control

- **Document Title:** Technical Design Document — Email Composer
- **Feature Name:** Outbound Email Composition & Personalization Engine
- **Module Name:** M8 Sales Engagement
- **Workspace Directory:** `modules/m08-sales-engagement/`
- **Owner:** Product Engineering — M8
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Business & Feature Context

### Business Problem
Sales representatives spend up to 40% of their working hours manually composing outbound follow-ups and outreach emails. The lack of standard templates and context consolidation leads to generic emails, weak response rates, and fragmented tracking of customer engagement inside CRM platforms.

### What This Feature Does
**Email Composer** enables reps to generate, schedule, personalize, and dispatch context-aware outbound emails directly within the platform.
- **AI-Personalized Drafting:** Integrates with the Python AI Services Layer to parse deal context and meeting notes to formulate tailored outreach.
- **Delegated Delivery:** Outbound emails dispatch via user-delegated Gmail or Outlook OAuth2 accounts.
- **SendGrid Isolated Sandboxing:** Supports SendGrid relays with a strictly isolated sandbox mode (`M08_SENDGRID_SANDBOX_MODE = true`) to safeguard staging activities.
- **Event-Driven Lifecycle:** Dispatches `email.sent` to let downstream systems log timelines and parse intent.

---

## 3. Scope & Dependencies

### In Scope
- Generating AI email drafts via the AI Services Layer.
- Scheduling email dispatches using BullMQ delayed queues.
- Outbound sends utilizing delegated Gmail/Outlook OAuth2 accounts.
- SendGrid isolated sandboxing execution and token validation.
- Emitting standard `email.sent` event upon successful persistence of outbound emails.

### Out of Scope
- Operating private SMTP or email relays.
- Deciding playbook progressions; that belongs strictly to **Orchestrate**.
- Mutating CRM database records directly; stage updates must go through **M10 Data & Compliance**.

---

## 4. API Specification

All endpoints are hosted under the unified prefix: `/api/v1/m08-sales-engagement`.

### POST /api/v1/m08-sales-engagement/emails/generate
- **Description:** Generate personalized email drafts based on contact/deal details and meeting notes.
- **Request Payload:**
  ```json
  {
    "recipientContactId": "uuid",
    "dealId": "uuid",
    "tone": "professional",
    "goal": "follow_up",
    "additionalInstructions": "Highlight pricing adjustments mentioned in call"
  }
  ```
- **Response Payload (`200 OK`):**
  ```json
  {
    "draftId": "uuid-draft-1",
    "subject": "Proposal pricing adjustment follow-up",
    "body": "Hi John, following up on our conversation today...",
    "status": "generated",
    "aiConfidenceScore": 0.92
  }
  ```

### POST /api/v1/m08-sales-engagement/emails/send
- **Description:** Send a prepared draft immediately using userconnected mailbox.
- **Request Payload:**
  ```json
  {
    "draftId": "uuid-draft-1",
    "provider": "gmail",
    "to": ["buyer@company.com"],
    "subject": "Proposal pricing adjustment follow-up",
    "bodyHtml": "<p>Hi John, following up on our conversation...</p>"
  }
  ```
- **Response Payload (`200 OK`):**
  ```json
  {
    "sendId": "uuid-send-1",
    "draftId": "uuid-draft-1",
    "status": "sent",
    "sentAt": "2026-05-18T09:00:00Z"
  }
  ```

### POST /api/v1/m08-sales-engagement/emails/schedule
- **Description:** Schedule a prepared draft for future dispatch.
- **Request Payload:**
  ```json
  {
    "draftId": "uuid-draft-1",
    "provider": "outlook",
    "scheduledAt": "2026-05-19T10:00:00Z",
    "to": ["buyer@company.com"]
  }
  ```

---

## 5. Database Schema Design

All tables reside under the `m08_sales_engagement` PostgreSQL schema namespace.

```sql
-- 1. Outbound Email Drafts Table
CREATE TABLE m08_sales_engagement.email_drafts (
  draft_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  user_id             UUID NOT NULL,
  recipient_id        UUID,
  subject             TEXT,
  body                TEXT,
  status              VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft | sent | scheduled | generated
  source_call_id      UUID,
  ai_confidence       NUMERIC(3,2),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Outbound Email Sends Table
CREATE TABLE m08_sales_engagement.email_sends (
  send_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  user_id             UUID NOT NULL,
  draft_id            UUID REFERENCES m08_sales_engagement.email_drafts(draft_id),
  sent_at             TIMESTAMPTZ DEFAULT NOW(),
  open_tracked        BOOLEAN DEFAULT FALSE,
  click_tracked       BOOLEAN DEFAULT FALSE,
  provider_used       VARCHAR(50) NOT NULL -- gmail | outlook | sendgrid
);

-- 3. Email Templates Table
CREATE TABLE m08_sales_engagement.email_templates (
  template_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  name                VARCHAR(255) NOT NULL,
  subject_template    TEXT,
  body_template       TEXT,
  language            VARCHAR(10) DEFAULT 'en',
  created_by          UUID NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance & tenancy RLS
CREATE INDEX idx_email_drafts_lookup ON m08_sales_engagement.email_drafts (tenant_id, user_id, created_at DESC);
CREATE INDEX idx_email_sends_lookup ON m08_sales_engagement.email_sends (tenant_id, user_id, sent_at DESC);
```

---

## 6. Functional & Governance Logic

### SendGrid Sandboxing Rules
To prevent unauthorized or accidental mass email dispatching in non-production environments:
- **Sandbox Validation:** When `M08_EMAIL_PROVIDER_MODE` is set to `relay` (SendGrid), the system evaluates `M08_SENDGRID_SANDBOX_MODE`.
- **Enforced Headers:** If `M08_SENDGRID_SANDBOX_MODE = true`, the outbound parser enforces strict SendGrid sandbox headers, checking that outbound emails are validated without leaving the SendGrid sandbox.
- **Client Restrictions:** In sandbox mode, emails targeting addresses outside verified tenant test accounts are rejected with a `400 Bad Request` safety exception.

### Outbound Event Dispatch Heuristics
- **Durability Guarantee:** Outbound events (`email.sent`) must only be published **after** the PostgreSQL `email_sends` transaction successfully commits.
- **Payload Contract:** The `email.sent` event carries standard telemetry scopes (`eventId`, `sendId`, `tenantId`, `userId`, `recipientId`, `dealId`, `sentAt`, `providerUsed`).
- **Idempotent Retries:** Downstream consumers utilize the standard transaction `sendId` to prevent duplicate recording.
