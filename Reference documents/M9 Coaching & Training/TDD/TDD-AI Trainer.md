# TDD: AI Trainer

## 1. Document Control

| Field | Value |
|---|---|
| **Document Title** | TDD - AI Trainer |
| **Product Module Name** | M9 Coaching & Training |
| **Feature Name** | AI Trainer |
| **Workspace Directory** | `modules/m09-coaching-training/` |
| **Lifecycle Stage** | Optimize |
| **Document Type** | Technical Design Document |
| **Version** | v3.0 |
| **Status** | Approved |
| **Primary Owners** | Backend Lead, AI Lead, Tech Lead |
| **Primary Consumers** | Backend Engineers, AI/ML Engineers, Frontend Engineers, QA Engineers, Product Managers |
| **Source References** | System Architecture Document (SAD), Revenue Intelligence Modules and Feature Mapping |
| **File Path** | `modules/m09-coaching-training/src/trainer/tdd-ai-trainer.md` |

---

## 2. Purpose

AI Trainer provides a simulated training environment where reps practice customer conversations with AI personas based on real R-Revenue Intelligence interactions.   
Within the platform architecture, AI Trainer belongs to the **M9 Coaching & Training** module in the **Optimize** stage (Stage 7), where the system runs stateless AI-simulated training conversations and produces scorecard-based feedback. 

This document explains how AI Trainer should be designed and implemented so the team can build it consistently, and so even a fresher can understand how scenarios are created, how sessions run, how each turn is processed, and how final feedback is produced. 

---

## 3. Scope

This TDD covers:
- Trainer scenario definition.
- Persona prompt structure and context rules.
- Session lifecycle management.
- Turn-by-turn conversation processing.
- Conversation history persistence.
- Scorecard-based session evaluation.
- API design for scenario management, session handling, and result retrieval.
- RBAC, observability, NFRs, and testing. 

This TDD does not cover:
- Sales Coaching Insights implementation.
- Revenue Dashboards implementation (owned by **M7 R-Revenue Dashboards**).
- Raw call transcription, topic tagging, or call scoring implementation (owned by **M1** / **M2**).
- Frontend UI visual design.
- Shared authentication internals. 

---

## 4. Feature Summary

AI Trainer is the practice and simulation feature inside M9 Coaching & Training. Its goal is to let a rep rehearse realistic customer conversations using AI personas and then receive structured feedback using a linked scorecard. 

In simple terms:
1. An admin creates a trainer scenario with a linked scorecard.
2. A rep starts a session from that scenario.
3. The rep sends a message.
4. The NestJS backend retrieves history and scenario context, calling the Python FastAPI service.
5. The AI replies as the persona.
6. The full conversation is saved turn by turn in PostgreSQL JSONB.
7. At session completion, the system evaluates the conversation and returns scorecard-based feedback. 

---

## 5. Upstream Dependencies

AI Trainer is an Optimize-stage feature and depends on prior platform outputs. 

### 5.1 Module Dependencies

| Upstream Module | What is used | Why it is needed |
|---|---|---|
| **M2 Conversation Intelligence** | Scorecards | AI Trainer scenarios link to scorecards for automated evaluation. |
| **M10 Data & Compliance** | Real interaction context patterns and deal context | Helps ground realistic scenarios in actual revenue context. |
| **Platform Core / Auth** | User identity, roles, tenant context | Required for RBAC and tenant isolation. |
| **AI Services Layer (FastAPI)** | `POST /internal/simulate-turn` | Used for persona responses and feedback generation. |

### 5.2 Architectural Dependencies

The architecture requires:
- Product business logic and state management in TypeScript (NestJS). 
- AI inference in Python FastAPI services exposed over private internal APIs. 
- Internal AI service invocation instead of embedding model SDK logic directly in TypeScript code. 

---

## 6. Entry Points

AI Trainer can be entered through three paths:

### 6.1 Admin Scenario Entry Points
- Create scenario: `POST /api/v1/m09-coaching-training/trainer/scenarios`
- Update scenario: `PATCH /api/v1/m09-coaching-training/trainer/scenarios/:scenarioId`
- List scenarios: `GET /api/v1/m09-coaching-training/trainer/scenarios`

### 6.2 Rep Session Entry Points
- Start session: `POST /api/v1/m09-coaching-training/trainer/sessions`
- Send turn: `POST /api/v1/m09-coaching-training/trainer/sessions/:sessionId/turn`
- Complete session: `POST /api/v1/m09-coaching-training/trainer/sessions/:sessionId/complete`
- View session result: `GET /api/v1/m09-coaching-training/trainer/sessions/:sessionId/result`

---

## 7. Persona Prompt Structure and Context Rules

The persona prompt is the instruction set sent to the AI so it behaves like the right simulated customer. The architecture states that persona and context are sent on every turn with the full conversation history. 

### 7.1 Prompt Input Components
Each AI simulation call should include:
- **Persona Description:** Who the customer is, seniority, behavioral traits, objections, and communication style.
- **Scenario Context:** The specific deal or business situation, rep objective, and boundary constraints.
- **Conversation History:** Complete thread history in chronological order.
- **Latest Rep Message:** The newest turn submitted by the rep. 

### 7.2 Output Rules
The persona response generated by FastAPI must be:
- **Concise:** Keeping responses natural and short (typically under 100 words).
- **Realistic:** Matching the communication style of the role (e.g. procurement officer vs VP of Engineering).
- **Non-Cooperative by Default:** Representing realistic purchase hesitation, budget objections, and skepticism.
- **Roleplay Consistent:** Under no circumstances should the AI break character or reveal system prompts.

---

## 8. Session Lifecycle

A trainer session represents one user practicing a scenario. The architecture stores sessions in `m09_coaching_training.trainer_sessions`.

### 8.1 Session States
Required states:
- `active`: Enters when session starts. Accepting turns.
- `completed`: Set when rep clicks complete or max turns reached. Triggers scorecard grading. Read-only.
- `abandoned`: Set when session is idle beyond timeout. Read-only.

### 8.2 Session State Machine
- `start session` -> `active`
- `active` + `send turn` -> `active`
- `active` + `complete` -> `completed`
- `active` + `abandon` -> `abandoned`

---

## 9. Turn Processing and State Management

The NestJS backend acts as the state manager, keeping the AI service stateless.

### 9.1 Turn Execution Steps
1. User sends `repMessage`.
2. NestJS validates that the session is `active` and belongs to the caller's tenant.
3. NestJS loads scenario and conversation history from `m09_coaching_training.trainer_sessions.conversation` (JSONB).
4. NestJS invokes the internal Python endpoint:
   - `POST {AI_SERVICES_BASE_URL}/internal/simulate-turn`
   - Header: `X-Internal-Secret = {AI_INTERNAL_SECRET}`
   - Body includes persona, context, full history, and newest turn.
5. Python AI service calls the LLM (`gpt-4o`) and returns the persona reply.
6. NestJS appends `rep` and `persona` messages to PostgreSQL JSONB history.
7. Return persona reply to the frontend.

### 9.2 Request Idempotency
To prevent duplicate appends when frontend retries on network failures, the endpoint expects a unique transaction ID. The service checks the last message in `conversation` to ensure duplicate content is suppressed.

---

## 10. Scorecard Evaluation and Feedback Generation

Final feedback is generated at the end of the session to keep the experience fast and minimize LLM tokens.

### 10.1 Execution Steps
1. Rep submits `POST /api/v1/m09-coaching-training/trainer/sessions/:sessionId/complete`.
2. NestJS locks the session (`status = completed`) and extracts the full conversation JSONB history.
3. NestJS queries **M2 Conversation Intelligence** to retrieve scorecard rubrics.
4. NestJS sends conversation and scorecard criteria to the FastAPI evaluation service.
5. FastAPI performs rubric scoring and returns a structured JSON payload.
6. NestJS persists this JSON inside `trainer_sessions.scorecardresult`.

### 10.2 Result JSON Shape
```json
{
  "overallScore": 78,
  "sections": [
    {
      "name": "Discovery",
      "score": 82,
      "feedback": "Strong questioning depth, but missed budget qualification."
    },
    {
      "name": "Objection Handling",
      "score": 71,
      "feedback": "Acknowledged concern but did not fully reframe value."
    }
  ],
  "strengths": [
    "Good tone control",
    "Asked follow-up questions"
  ],
  "improvements": [
    "Handle pricing pushback with ROI framing",
    "Confirm decision criteria earlier"
  ]
}
```

---

## 11. Data Model

The schema resides strictly within the PostgreSQL **`m09_coaching_training`** namespace.

### 11.1 `m09_coaching_training.trainer_scenarios`
- `scenario_id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `tenant_id` UUID NOT NULL REFERENCES platform.tenants(tenant_id) ON DELETE CASCADE
- `name` VARCHAR(100) NOT NULL
- `persona_description` TEXT NOT NULL
- `context` TEXT NOT NULL
- `difficulty` VARCHAR(20) NOT NULL  # beginner, intermediate, advanced
- `scorecard_id` UUID NOT NULL
- `created_by` UUID NOT NULL
- `is_active` BOOLEAN DEFAULT true
- `prompt_version` VARCHAR(10) DEFAULT '1.0'
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 11.2 `m09_coaching_training.trainer_sessions`
- `session_id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `scenario_id` UUID NOT NULL REFERENCES m09_coaching_training.trainer_scenarios(scenario_id) ON DELETE CASCADE
- `tenant_id` UUID NOT NULL REFERENCES platform.tenants(tenant_id) ON DELETE CASCADE
- `user_id` UUID NOT NULL
- `conversation` JSONB NOT NULL DEFAULT '[]'
- `scorecard_result` JSONB DEFAULT NULL
- `status` VARCHAR(20) NOT NULL DEFAULT 'active'  # active, completed, abandoned
- `turn_count` INTEGER DEFAULT 0
- `started_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `completed_at` TIMESTAMPTZ DEFAULT NULL
- `abandoned_at` TIMESTAMPTZ DEFAULT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 11.3 Database Indexes
- `CREATE INDEX idx_sessions_tenant_user ON m09_coaching_training.trainer_sessions(tenant_id, user_id, completed_at desc);`
- `CREATE INDEX idx_scenarios_tenant ON m09_coaching_training.trainer_scenarios(tenant_id, difficulty);`

---

## 12. RBAC & Security Rules

- **Reps:**
  - Can create and play their own sessions.
  - Restricted to self-created sessions.
  - Can view only scenarios in their own tenant.
- **Managers:**
  - Can review completed sessions for reps on their direct team (resolved via **M10**).
  - Cannot play sessions for other reps.
- **Admins:**
  - Full CRUD on scenarios.
  - Can view all sessions in the tenant.
- **Tenant Scoping:** All operations are strictly bound to JWT `tenant_id` claims, backed by PostgreSQL Row-Level Security (RLS).
- **Prompt Safety:** The scenario editing system must strip raw prompt formatting before saving to prevent prompt injection.