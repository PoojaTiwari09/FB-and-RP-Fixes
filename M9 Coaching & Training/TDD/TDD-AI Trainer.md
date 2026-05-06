# TDD: AI Trainer

## 1. Document Control

| Field | Value |
|---|---|
| Document Title | TDD - AI Trainer |
| Product Module Name | M9 Coaching Training |
| Feature Name | AI Trainer |
| Architecture Owner Module | M-10 Coaching and Training |
| Lifecycle Stage | Optimize |
| Document Type | Technical Design Document |
| Version | v1.0 |
| Status | Draft for implementation |
| Primary Owners | Backend Lead, AI Lead, Tech Lead |
| Primary Consumers | Backend Engineers, AI/ML Engineers, Frontend Engineers, QA Engineers, Product Managers |
| Source References | System Architecture Document (SAD), Revenue Intelligence Modules and Feature Mapping |
| File Path | `docs/modules/m09/tdd-ai-trainer.md` |

## 2. Purpose

AI Trainer provides a simulated training environment where reps practice customer conversations with AI personas based on real R-Revenue Intelligence interactions.   
Within the architecture, AI Trainer belongs to M-10 Coaching and Training in the Optimize stage, where the system runs AI-simulated training conversations and produces scorecard-based feedback. 

This document explains how AI Trainer should be designed and implemented so the team can build it consistently, and so even a fresher can understand how scenarios are created, how sessions run, how each turn is processed, and how final feedback is produced. 

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
- Revenue Dashboards implementation.
- Raw call transcription or call scoring implementation inside M-04.
- Frontend UI visual design.
- Shared authentication internals. 

## 4. Feature Summary

AI Trainer is the practice and simulation feature inside M9 Coaching Training.   
Its goal is to let a rep rehearse realistic customer conversations using AI personas and then receive structured feedback using a linked scorecard. 

In simple terms:
1. An admin creates a trainer scenario.
2. A rep starts a session from that scenario.
3. The rep sends a message.
4. The AI replies as the persona.
5. The full conversation is saved turn by turn.
6. At session completion, the system evaluates the conversation and returns scorecard-based feedback. 

## 5. Users

Primary users:
- Sales reps practicing customer conversations.
- Managers reviewing training usage or results where allowed by product policy.
- Admins creating and maintaining trainer scenarios. 

Secondary users:
- QA engineers validating end-to-end trainer behavior.
- Frontend applications rendering session and result screens.
- RevOps or enablement users curating scenarios and scorecards.

## 6. Upstream Dependencies

AI Trainer is an Optimize-stage feature and depends on prior platform outputs. 

### 6.1 Module dependencies

| Upstream Module | What is used | Why it is needed |
|---|---|---|
| M-04 Conversation Intelligence | Scorecards | AI Trainer scenarios link to scorecards for automated evaluation.  |
| M-03 Revenue Graph | Real interaction context patterns and deal context where applicable | Helps ground realistic scenarios in actual revenue context.  |
| Platform Core / Auth | User identity, roles, tenant context | Required for RBAC and tenant isolation.  |
| AI Services Layer | `POST /v1/simulate-turn`, generation endpoints | Used for persona responses and optional feedback generation.  |

### 6.2 Architectural dependencies

The architecture requires:
- Product business logic in TypeScript. 
- AI inference in Python services exposed over internal APIs. 
- Internal AI service invocation instead of embedding model logic directly in product code. 

## 7. Downstream Consumers

AI Trainer is part of the terminal Optimize-stage module. The architecture states that M-10 is a terminal module and does not emit further lifecycle events for downstream product modules. 

Primary consumers are:
- Rep-facing training screens.
- Result and feedback views.
- Admin scenario management screens.
- Internal analytics views for training adoption and completion. 

## 8. Entry Points

AI Trainer can be entered through three paths:

### 8.1 Admin scenario entry points
- Create scenario.
- Update scenario.
- List scenarios by tenant and difficulty.

### 8.2 Rep session entry points
- Start session from scenario.
- Send turn during active session.
- Complete session.
- View session result.

### 8.3 Internal AI entry points
- Persona simulation call from product service to AI service.
- Optional result-generation or feedback-enrichment call from product service to AI service. 

## 9. Functional Requirements

The feature shall:
- Allow admins to create AI Trainer scenarios. 
- Store scenarios in `trainer_scenarios`. 
- Allow reps to start sessions from a scenario and store them in `trainer_sessions`. 
- Persist turn-by-turn conversation history. 
- Send full conversation history plus persona and context to the AI service on each turn. 
- Append both the rep message and persona reply back into the session. 
- Support session states `active`, `completed`, and `abandoned`. 
- Generate scorecard-based feedback and persist the result. 
- Enforce tenant isolation and RBAC. 

## 10. High-Level Flow

### 10.1 End-to-end summary

1. Admin creates a scenario with persona definition, context, difficulty, and linked scorecard.
2. Rep chooses a scenario and starts a session.
3. M-10 creates a session row with `active` status.
4. For each rep turn, M-10 sends full history, persona, and context to the AI service.
5. AI service returns the persona reply.
6. M-10 appends both messages into the session.
7. When the session is completed, the system evaluates the full conversation against the linked scorecard.
8. Result and feedback are stored and exposed through read APIs. 

### 10.2 Plain-English explanation

Think of AI Trainer like a practice interview simulator:
- The scenario tells the system who the customer is and what situation they are in.
- The rep talks to that simulated customer.
- The system remembers the whole conversation.
- At the end, it grades the rep using a predefined scorecard. 

## 11. Scenario Definition Model

### 11.1 Purpose

A trainer scenario defines what kind of practice conversation the rep will have. The architecture stores scenarios in `trainer_scenarios` with persona description, context, difficulty, and scorecard link. 

### 11.2 Scenario schema

Recommended fields based on architecture:
- `scenarioid`
- `tenantid`
- `name`
- `personadescription`
- `context`
- `difficulty`
- `scorecardid`
- `createdby`
- `createdat`
- `updatedat` 

### 11.3 Scenario meaning of each field

- `name`: Human-readable scenario title.
- `personadescription`: Who the persona is, how they behave, and how they speak.
- `context`: Deal or business situation, rep objective, background facts, and boundaries.
- `difficulty`: Level such as beginner, intermediate, or advanced.
- `scorecardid`: Link to the scorecard used to evaluate session performance.
- `createdby`: Admin who created the scenario. 

### 11.4 Recommended extended fields for implementation

To make the system easier to use and safer to manage, add:
- `isactive`
- `tags`
- `objective`
- `industry`
- `personaType`
- `maxTurns`
- `promptVersion`

These are implementation-friendly additions and do not conflict with the architecture.

### 11.5 Scenario example

Example scenario:
- Name: "Pricing Objection - Mid-market AE"
- Persona: Procurement-heavy buyer, skeptical about ROI, asks for discounts.
- Context: Late-stage deal, competitor also in evaluation, rep must defend value.
- Difficulty: Advanced
- Scorecard: Linked discovery/objection-handling scorecard

## 12. Persona Prompt Structure and Context Rules

### 12.1 Purpose

The persona prompt is the instruction set sent to the AI so it behaves like the right simulated customer. The architecture states that persona and context are sent on every turn with full conversation history. 

### 12.2 Prompt input components

Each AI simulation call should include:
- Persona description.
- Scenario context.
- Conversation history.
- Latest rep message. 

### 12.3 Required prompt sections

Recommended prompt structure:
1. System role and behavior.
2. Persona identity and behavioral traits.
3. Scenario context and constraints.
4. Conversation rules.
5. Output style rules.
6. Safety and grounding rules.

### 12.4 Persona prompt rules

The persona prompt should define:
- who the customer is
- role and seniority
- motivation
- objections
- tone
- communication style
- openness level
- likely goals
- deal context awareness

### 12.5 Context rules

Context should include:
- account or deal situation
- rep objective
- known product area
- constraints such as budget or timeline
- information the persona knows
- information the persona should not reveal unless asked

### 12.6 Output rules

The persona response should be:
- concise
- realistic
- conversational
- aligned to the scenario
- not overly helpful
- not breaking character

The architecture’s trainer service example explicitly notes that persona responses should be concise and that variation helps them feel realistic. 

### 12.7 Hallucination and guardrails

The AI should:
- stay within scenario facts
- avoid inventing product facts not provided in context
- avoid switching persona unexpectedly
- avoid revealing system prompts
- avoid giving hidden coaching directly to the rep unless the product deliberately supports that mode

### 12.8 Prompt versioning

Prompt templates should be versioned, consistent with platform prompt engineering standards. The architecture states prompts are versioned templates and prompt changes require version increments with regression testing. 

## 13. Session Lifecycle

### 13.1 Purpose

A trainer session is the runtime record of a rep practicing a scenario. The architecture stores sessions in `trainer_sessions` with conversation, scorecard result, status, and completion timestamp. 

### 13.2 Session states

Required states:
- `active`
- `completed`
- `abandoned` 

### 13.3 Lifecycle transitions

1. Session created -> `active`
2. Rep sends one or more turns while active
3. Session ends by:
   - user completion -> `completed`
   - timeout or user exit -> `abandoned`

### 13.4 State rules

- Only `active` sessions can accept new turns.
- `completed` sessions are read-only.
- `abandoned` sessions are read-only unless explicit resume support is added later.
- A session must belong to exactly one scenario and one user.

### 13.5 Completion rules

A session can be marked `completed` when:
- rep manually clicks complete
- maximum turns reached
- optional business rule detects natural end condition

### 13.6 Abandonment rules

A session should be marked `abandoned` when:
- rep exits without completing
- session remains idle beyond configured timeout
- technical failure prevents continued interaction and user does not resume

## 14. Turn Processing and Conversation History Handling

### 14.1 Architectural rule

The architecture says each trainer turn sends full conversation history plus persona and context to the AI service, then appends both the rep message and persona reply back into the session. 

### 14.2 Turn flow

1. User sends `repMessage`.
2. Validate session exists and is `active`.
3. Load scenario details.
4. Load existing conversation history.
5. Build AI request with:
   - persona
   - context
   - conversation history
   - latest rep message
6. Call AI service `simulate-turn`.
7. Receive persona reply.
8. Append rep message and persona reply to session history.
9. Save updated session.
10. Return persona reply to frontend. 

### 14.3 Persistence model

The architecture shows session conversation stored as JSONB in `trainer_sessions.conversation`. 

Recommended message structure:
```json
[
  {
    "role": "user",
    "content": "Can you share what is blocking your decision?",
    "timestamp": "2026-05-04T09:00:00Z"
  },
  {
    "role": "persona",
    "content": "Budget is the main concern right now.",
    "timestamp": "2026-05-04T09:00:02Z"
  }
]
```

### 14.4 Recommended normalization note

The architecture references `trainer_messages` in the broader coaching schema notes, while the implementation example stores conversation in session JSON.   
For version 1, use session-level JSONB conversation for simplicity because that is explicitly shown in the architecture table and turn-processing example.   
If detailed analytics on per-turn messages become important later, a normalized `trainer_messages` table can be added without changing the product behavior.

### 14.5 Session validation rules

Before processing a turn:
- verify tenant match
- verify session ownership or permitted reviewer scope
- verify session is active
- verify message is not empty
- enforce size limit on message length
- optionally enforce max turns

### 14.6 Idempotency and retries

If frontend retries the same turn request because of a network issue, the API should prevent duplicate append behavior using:
- request ID
- sequence number
- or last-message hash

## 15. Scorecard Evaluation and Feedback Generation

### 15.1 Purpose

AI Trainer sessions must produce scorecard-based feedback. The architecture explicitly ties scenarios to a scorecard and stores final evaluation in `scorecardresult` on the session. 

### 15.2 Evaluation timing

The architecture records an open product decision around when to score, but end-of-session scoring is the cleanest baseline for version 1 because it is simpler and avoids repeated LLM calls during every turn. 

Version 1 decision for this TDD:
- Score the full session at completion.
- Do not provide full per-turn scoring during the session.
- Optional future enhancement: live coaching indicators.

### 15.3 Evaluation inputs

At session completion, evaluation reads:
- linked scorecard
- full conversation history
- scenario objective
- persona and context
- session metadata such as difficulty

### 15.4 Evaluation outputs

Recommended result structure:
- overall score
- score by scorecard section
- strengths
- improvement areas
- missed opportunities
- suggested next practice focus
- completion timestamp

### 15.5 Result storage

The architecture stores final result in `trainer_sessions.scorecardresult` JSONB. 

Recommended shape:
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

### 15.6 Scoring implementation split

- TypeScript decides when scoring runs, persists results, and exposes APIs. 
- Python AI service performs scoring inference if LLM-based scoring is used. 

### 15.7 Feedback quality rules

Feedback should be:
- specific
- tied to behavior in the session
- short enough to read quickly
- structured enough for UI rendering
- safe from hallucinated transcript claims

## 16. Data Model

The architecture defines the main AI Trainer schema within M-10. 

### 16.1 `trainer_scenarios`

Purpose: reusable scenario configuration for practice conversations. 

Recommended fields:
- `scenarioid`
- `tenantid`
- `name`
- `personadescription`
- `context`
- `difficulty`
- `scorecardid`
- `createdby`
- `isactive`
- `promptversion`
- `createdat`
- `updatedat`

### 16.2 `trainer_sessions`

Purpose: runtime session for one user practicing one scenario. 

Recommended fields:
- `sessionid`
- `scenarioid`
- `tenantid`
- `userid`
- `conversation`
- `scorecardresult`
- `status`
- `turncount`
- `startedat`
- `completedat`
- `abandonedat`
- `createdat`
- `updatedat`

### 16.3 Optional future `trainer_messages`

Purpose: normalized per-turn storage for advanced analytics.

Potential fields:
- `messageid`
- `sessionid`
- `tenantid`
- `role`
- `content`
- `seqno`
- `createdat`

Version 1 does not require this table if conversation JSONB is used.

### 16.4 Optional future `trainer_results`

Purpose: separate finalized results registry when analytics, exports, or audit history need dedicated storage.

Version 1 can keep the result embedded in session JSONB.

### 16.5 Keys and indexes

The architecture recommends indexes including:
- `idxsessionstenantuser` on `(tenantid, userid, completedat desc)`
- `idxscenariostenant` on `(tenantid, difficulty)` 

Additional useful indexes:
- `trainer_sessions (tenantid, status, updatedat desc)`
- `trainer_sessions (tenantid, scenarioid, startedat desc)`

## 17. Storage and Compute Design

### 17.1 Transactional store

PostgreSQL is the source of truth for trainer scenarios, sessions, and results. 

### 17.2 Product and AI split

- TypeScript/NestJS handles APIs, session orchestration, RBAC, persistence, and business rules. 
- Python AI services handle persona response generation and optional scoring inference. 

### 17.3 AI interaction pattern

The architecture says product services must call AI services through internal APIs rather than embedding AI logic in the product code. 

That means:
- no direct model SDK logic in the NestJS trainer service
- no business rules in Python scoring logic
- structured JSON responses expected back into TypeScript

## 18. API Design

The architecture defines the M-10 API prefix as `api/v1/performance` and lists AI Trainer endpoints. 

### 18.1 Scenario APIs

#### GET `/api/v1/coaching/trainer/scenarios`
Returns all AI Trainer scenarios available to current user. 

#### POST `/api/v1/coaching/trainer/scenarios`
Creates a new AI Trainer scenario with persona and scorecard.
- Admin only. 

#### PATCH `/api/v1/coaching/trainer/scenarios/:scenarioId`
Updates an existing scenario.
- Admin only.

### 18.2 Session APIs

#### POST `/api/v1/coaching/trainer/sessions`
Starts a new practice session. 

Request example:
```json
{
  "scenarioId": "scn_123"
}
```

Response example:
```json
{
  "sessionId": "ses_123",
  "status": "active"
}
```

#### POST `/api/v1/coaching/trainer/sessions/:sessionId/turn`
Sends rep message and returns persona reply. 

Request example:
```json
{
  "repMessage": "Can you help me understand why this deal is stuck?"
}
```

Response example:
```json
{
  "sessionId": "ses_123",
  "reply": "We are still unsure whether your solution will justify the price."
}
```

#### POST `/api/v1/coaching/trainer/sessions/:sessionId/complete`
Marks session completed and triggers scorecard evaluation.

#### POST `/api/v1/coaching/trainer/sessions/:sessionId/abandon`
Marks session abandoned.

#### GET `/api/v1/coaching/trainer/sessions/:sessionId/result`
Returns completed session scorecard feedback. 

### 18.3 Error semantics

- `401` unauthenticated
- `403` forbidden
- `404` scenario or session not found in tenant scope
- `409` invalid session state transition
- `422` invalid request payload
- `504` AI service timeout

## 19. AI Flow

### 19.1 Architectural rule

The architecture describes AI Trainer as a stateless AI function that processes one turn at a time, while the product service manages conversation history. 

### 19.2 Turn simulation flow

1. NestJS loads session and scenario.
2. NestJS sends persona, context, conversation history, and rep message to internal AI endpoint.
3. AI service builds persona prompt.
4. AI service calls the LLM.
5. AI service returns the persona reply.
6. NestJS appends both turns and saves the session. 

### 19.3 Internal endpoints

Relevant AI endpoints:
- `POST /internal/simulate-turn` or equivalent `v1/simulate-turn` internal route for turn simulation. 
- optional generation endpoint for result feedback enrichment. 

### 19.4 Model behavior

The architecture uses `gpt-4o` for AI Trainer persona simulation and recommends higher temperature for generation-style tasks so responses feel natural instead of robotic. 

### 19.5 Timeout behavior

The architecture documents synchronous simulation timeout behavior and says product services should handle AI timeouts explicitly. 

If the AI call times out:
- log structured error
- return user-safe error response
- do not append partial turn state
- allow retry without duplicating messages

## 20. RBAC and Security

### 20.1 Scenario access

- Admins can create and update scenarios. 
- Tenant users can list and start allowed scenarios.
- Cross-tenant scenario access is forbidden.

### 20.2 Session access

- Reps can create and use their own sessions.
- Reps can view only their own session history and results unless product policy explicitly grants manager review access.
- Admins and authorized reviewers may view sessions within tenant if enabled by policy.

### 20.3 Tenant isolation

All scenario and session rows must include `tenantid`, aligned to the platform’s tenant isolation model. 

### 20.4 Prompt and secret protection

- Never expose system prompts in API responses.
- Internal AI endpoints must stay internal-only.
- Secret headers and service auth must follow platform internal service rules. 

## 21. Session State Machine

### 21.1 Allowed transitions

| Current State | Action | Next State |
|---|---|---|
| none | start session | active |
| active | send turn | active |
| active | complete session | completed |
| active | abandon session | abandoned |
| completed | send turn | invalid |
| abandoned | send turn | invalid |

### 21.2 Transition guard rules

- `complete` requires active session.
- `abandon` requires active session.
- `turn` requires active session.
- Completed or abandoned sessions are immutable except for admin repair workflows.

## 22. Observability

### 22.1 Logging

Structured logs should include:
- tenant ID
- user ID
- scenario ID
- session ID
- turn count
- AI endpoint used
- latency
- result status
- error category

### 22.2 Metrics

Recommended metrics:
- scenario creation count
- session start count
- session completion rate
- session abandonment rate
- average turns per session
- AI simulation latency
- AI timeout rate
- score generation latency

### 22.3 Tracing

Trace boundaries:
- session create
- turn request receive
- scenario load
- AI call
- session update
- completion scoring
- result fetch

### 22.4 Alerting

Alert on:
- rising AI timeout rates
- repeated simulation failures
- result generation failures
- unusual abandonment spikes
- stale active sessions not closing correctly

## 23. Non-Functional Requirements

### 23.1 Performance

- Turn response latency should feel interactive for the rep.
- Session creation must be lightweight.
- Result generation can be slightly slower than turn response, but must remain within acceptable user wait time.

### 23.2 Scalability

The design must support:
- many concurrent active sessions
- many tenants
- scenario reuse across large teams
- future extraction of M-10 into an independent service as planned in Phase 3. 

### 23.3 Reliability

- Do not lose conversation history on retry or timeout.
- State transitions must be consistent.
- Duplicate turn requests must not duplicate saved messages.

### 23.4 Maintainability

- Persona prompt templates must be versioned. 
- Scenario structure should be explicit and easy to extend.
- Scoring pipeline should be modular so live scoring can be added later.

### 23.5 Auditability

- Admin scenario changes should be auditable.
- Session completion and score generation should be traceable.
- User access to training results should be logged where required.

## 24. Failure Modes and Recovery

| Failure | Impact | Recovery |
|---|---|---|
| AI simulation timeout | No persona reply returned | Return retryable error; do not append partial messages.  |
| Duplicate turn submission | Duplicate session messages | Use request idempotency key or sequence check. |
| Session completed but scoring fails | Conversation exists without result | Mark result pending and retry scoring job. |
| Scenario deleted while session active | Session cannot resolve scenario context | Prevent deletion of scenarios with active sessions, or soft-delete only. |
| Invalid scorecard link | Session completion cannot be scored | Block scenario activation until scorecard link is valid. |
| Session idle too long | Orphan active session | Mark abandoned by scheduled cleanup job. |

## 25. Implementation Notes

### 25.1 Suggested internal components

- `TrainerScenarioService`
- `TrainerSessionService`
- `TrainerTurnService`
- `TrainerScoringService`
- `TrainerAccessService`
- `TrainerQueryService`

### 25.2 Service split

TypeScript services:
- scenario CRUD
- session lifecycle
- turn orchestration
- result persistence
- RBAC
- REST APIs

Python services:
- persona simulation
- optional result narrative generation
- optional rubric scoring inference

### 25.3 Suggested configuration knobs

- max turns per scenario
- session idle timeout
- AI timeout
- scoring mode
- feedback detail level
- prompt version
- scenario difficulty enablement

## 26. Test Strategy

### 26.1 Unit tests

Test:
- scenario validation
- session state transitions
- turn append logic
- duplicate request protection
- completion and abandonment rules
- RBAC checks

### 26.2 Integration tests

Test:
- admin creates scenario
- rep starts session
- rep sends turn and receives persona reply
- full conversation history is included in later turns
- complete session triggers score generation
- abandoned session rejects further turns

### 26.3 API tests

Test:
- non-admin cannot create scenario
- rep can start valid tenant scenario
- rep cannot access another rep’s session
- completed session result endpoint returns final scorecard data
- invalid session state returns correct error code

### 26.4 AI contract tests

Test:
- AI simulation response shape
- timeout handling
- empty or malformed response handling
- prompt version compatibility
- scoring output validation

### 26.5 Performance tests

Test:
- turn latency under concurrent session load
- session completion scoring under burst traffic
- large conversation history performance near max turn limit

### 26.6 QA sample scenarios

1. Beginner discovery scenario:
   - rep starts session
   - AI replies in a cooperative persona style
   - result generated on completion

2. Advanced pricing objection scenario:
   - persona pushes back repeatedly
   - rep handles objections
   - scorecard reflects objection-handling performance

3. Session abandonment:
   - rep starts but leaves
   - system marks abandoned after timeout

4. Duplicate turn retry:
   - frontend resubmits same request
   - conversation history stores only one copy

## 27. Open Decisions

The architecture notes an open decision around scoring timing.   
For this TDD, version 1 assumes end-of-session scoring only, but the following items should still be confirmed during implementation:
- whether managers can review rep training sessions in v1
- exact max turn limits by difficulty
- whether abandoned sessions can be resumed later
- whether score feedback includes example rewritten answers
- whether scenario templates can be cloned across tenants by admins

## 28. Final Build Rules

- Treat M9 as the product-facing package name and M-10 as the architecture owner module. 
- Keep product business logic in TypeScript. 
- Keep AI persona simulation and optional scoring inference in Python AI services. 
- Send full conversation history plus persona and context on every turn. 
- Append both rep message and persona reply into the session after every successful turn. 
- Support `active`, `completed`, and `abandoned` session states. 
- Use linked scorecards for end-of-session feedback generation. 
- Treat M-10 as a terminal Optimize-stage module with no downstream lifecycle events. 