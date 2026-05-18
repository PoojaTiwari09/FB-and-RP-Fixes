# Sequence Diagrams: M9 Flows

## 1. Document Control

| Field | Value |
|---|---|
| **Document Title** | Sequence Diagrams - M9 Flows |
| **Product Module Name** | M9 Coaching & Training |
| **Workspace Directory** | `modules/m09-coaching-training/` |
| **Lifecycle Stage** | Optimize |
| **Document Type** | Sequence Diagram Document |
| **Version** | v3.0 |
| **Status** | Approved |
| **Last Updated** | 2026-05-18 |
| **File Path** | `modules/m09-coaching-training/Sequence Diagrams: M9 flows.md` |
| **Covered Features** | Sales Coaching Insights, AI Trainer |

---

## 2. Purpose

This document captures the main runtime flows for **M9 Coaching & Training**. It focuses on the most important sequences for Sales Coaching Insights and AI Trainer so engineers can implement event handling, APIs, RBAC, persistence, and AI interactions correctly. 

These sequence diagrams are written in Mermaid so they can be rendered directly in Markdown-friendly documentation tools.

---

## 3. Covered Flows

This document includes:
- **Flow 1:** `call.scored` event consumption, snapshot compilation, low-sample guard check, and coaching recommendation generation.
- **Flow 2:** Manager team coaching view query with strict server-side RBAC and org structure resolution.
- **Flow 3:** AI Trainer session execution: starts session, processes stateless turns (passing history), and executes end-of-session scorecard evaluation.
- **Flow 4:** Admin scenario creation with linked scorecard validation.

---

## 4. Flow 1: Call Scored to Coaching Snapshot Update

### 4.1 What this flow shows
This flow shows how M9 consumes the `call.scored` event from **M2 Conversation Intelligence**, updates the rep coaching snapshot in the `m09_coaching_training` schema namespace, applies the low-sample guard, and generates coaching recommendations when the sample is reliable.

### 4.2 Mermaid diagram

```mermaid
sequenceDiagram
    autonumber
    participant M02 as M2 Conversation Intelligence
    participant BUS as Event Bus / BullMQ
    participant M09 as M9 Coaching & Training
    participant DB as PostgreSQL (m09_coaching_training)
    participant API as M10 Data & Compliance API
    participant AI as AI Services Layer (FastAPI)
    participant LOG as Observability Logs

    M02->>BUS: Publish call.scored
    Note over M02,BUS: Payload: tenantId, userId, scorecardId, talkRatio, questionRate, longestMonologueSeconds, scoredAt

    BUS->>M09: Deliver call.scored event
    M09->>LOG: Log event receipt and trace context

    M09->>DB: Check event idempotency / existing snapshot
    M09->>API: Read supporting deal / account context
    M09->>DB: Load current snapshot for tenant_id + user_id + period

    alt Snapshot exists
        M09->>DB: Update existing coaching_snapshots metrics
    else Snapshot does not exist
        M09->>DB: Insert new coaching_snapshots row
    end

    M09->>DB: Recompute callCount, talkRatio, questionRate, interactivityScore, computedAt

    alt callCount < 5
        M09->>LOG: Log low-sample protection triggered (callCount < 5)
        M09->>DB: Mark snapshot islowsample = true
        Note over M09,DB: Suppress recommendation text generation to avoid LLM hallucinations
    else callCount >= 5
        M09->>DB: Load benchmark rows from coaching_benchmarks
        M09->>AI: POST /internal/recommendations (Async LLM enrichment)
        AI-->>M09: Return structured recommendation text & category
        M09->>DB: Upsert coaching_recommendations
        M09->>LOG: Log recommendation generation success
    end

    M09-->>BUS: Ack event processed (Idempotent success)
```

### 4.3 Implementation notes
- `call.scored` is published by **M2** and consumed by **M9**.
- Snapshot writes must be idempotent and update the existing period row instead of inserting duplicates.
- Recommendation generation must be skipped when `callCount < 5`. The UI will display a friendly suppression message.

---

## 5. Flow 2: Manager Opens Team Coaching View

### 5.1 What this flow shows
This flow shows how a manager opens the team coaching page, how server-side RBAC is enforced, and how M9 returns only the coaching snapshots for reps on that manager’s team.

### 5.2 Mermaid diagram

```mermaid
sequenceDiagram
    autonumber
    participant UI as Frontend Dashboard
    participant AUTH as JWT Guard / Auth Layer
    participant M09 as M9 Coaching & Training API
    participant M10 as M10 Data & Compliance API
    participant DB as PostgreSQL (m09_coaching_training)
    participant LOG as Audit Logs

    UI->>AUTH: Send GET /api/v1/m09-coaching-training/insights/team with JWT
    AUTH->>AUTH: Validate token and tenant_id context
    AUTH-->>M09: Forward authenticated manager request

    M09->>M09: Verify role == Manager
    alt User is not Manager / Admin / RevOps
        M09->>LOG: Write denied access audit log
        M09-->>UI: 403 Forbidden
    else User is Manager
        M09->>M10: GET /api/v1/m10-data-compliance/org/reports-to (Resolve team members)
        M10-->>M09: Return allowed rep user_ids
        alt No team members found
            M09->>LOG: Log empty team scope
            M09-->>UI: 200 OK with empty result
        else Team members found
            M09->>DB: Query coaching_snapshots where tenant_id matches AND user_id IN (team_members)
            M09->>DB: Query coaching_recommendations for team members
            M09->>LOG: Write allowed access audit log
            M09-->>UI: Return team coaching payload
        end
    end
```

### 5.3 Implementation notes
- The canonical endpoint is `GET /api/v1/m09-coaching-training/insights/team`.
- RBAC is enforced on the server. M9 calls the **M10** REST API to resolve organizational hierarchies.
- All database queries must remain tenant-scoped.

---

## 6. Flow 3: AI Trainer Session

### 6.1 What this flow shows
This flow shows a rep starting a trainer session, sending multiple turns, receiving persona replies, and completing the session for scorecard-based feedback.

### 6.2 Mermaid diagram

```mermaid
sequenceDiagram
    autonumber
    participant UI as Frontend
    participant AUTH as JWT Guard / Auth Layer
    participant M09 as M9 Coaching & Training API
    participant DB as PostgreSQL (m09_coaching_training)
    participant AI as AI Services Layer (FastAPI)
    participant LOG as Observability Logs

    UI->>AUTH: POST /api/v1/m09-coaching-training/trainer/sessions
    AUTH->>AUTH: Validate JWT and tenant context
    AUTH-->>M09: Forward authenticated request

    M09->>DB: Validate scenario exists in tenant
    M09->>DB: Create trainer_sessions (status=active, conversation=[])
    M09-->>UI: Return sessionId and active status

    loop Each rep turn
        UI->>AUTH: POST /api/v1/m09-coaching-training/trainer/sessions/{id}/turn
        AUTH-->>M09: Forward authenticated request
        M09->>DB: Load session + scenario
        M09->>M09: Validate session status == active

        alt Session not active
            M09-->>UI: 409 Conflict / 400 Invalid Session State
        else Session active
            M09->>AI: POST /internal/simulate-turn with persona, context, history, repMessage
            AI-->>M09: Persona reply
            M09->>DB: Append rep message and persona reply to JSONB conversation history
            M09->>LOG: Log turn latency and token usage metadata
            M09-->>UI: Return persona reply
        end
    end

    UI->>AUTH: POST /api/v1/m09-coaching-training/trainer/sessions/{id}/complete
    AUTH-->>M09: Forward authenticated request
    M09->>DB: Load full conversation + linked scorecard
    M09->>AI: POST /internal/evaluate-scorecard (stateless prompt scoring)
    AI-->>M09: Structured score, strengths, improvements JSON
    M09->>DB: Update trainer_sessions (status=completed, scorecardresult, completedat)
    M09->>LOG: Log session completion

    UI->>AUTH: GET /api/v1/m09-coaching-training/trainer/sessions/{id}/result
    AUTH-->>M09: Forward authenticated request
    M09->>DB: Read completed session result
    M09-->>UI: Return scorecard feedback
```

### 6.3 Implementation notes
- Endpoints are `/api/v1/m09-coaching-training/trainer/sessions`, `/api/v1/m09-coaching-training/trainer/sessions/:id/turn`, and `/api/v1/m09-coaching-training/trainer/sessions/:id/result`.
- The product service manages conversational state in PostgreSQL JSONB and sends the full thread history to the AI service on each turn to keep the AI stateless.

---

## 7. Flow 4: Admin Creates Trainer Scenario

### 7.1 What this flow shows
This flow shows how an admin creates a trainer scenario with a persona definition, context, difficulty, and a linked scorecard.

### 7.2 Mermaid diagram

```mermaid
sequenceDiagram
    autonumber
    participant UI as Admin Frontend
    participant AUTH as JWT Guard / Auth Layer
    participant M09 as M9 Coaching & Training API
    participant M02 as M2 Scorecard API
    participant DB as PostgreSQL (m09_coaching_training)
    participant LOG as Audit Logs

    UI->>AUTH: POST /api/v1/m09-coaching-training/trainer/scenarios
    AUTH->>AUTH: Validate JWT and tenant context
    AUTH-->>M09: Forward authenticated request

    M09->>M09: Verify role == Admin
    alt User is not Admin
        M09->>LOG: Write denied scenario-create audit log
        M09-->>UI: 403 Forbidden
    else User is Admin
        M09->>M02: GET /api/v1/m02-conversation-intelligence/scorecards/:id (Validate)
        M02-->>M09: Scorecard valid and belongs to tenant
        alt Invalid or cross-tenant scorecard
            M09->>LOG: Log invalid scorecard reference
            M09-->>UI: 422 Unprocessable Entity
        else Scorecard valid
            M09->>DB: Insert trainer_scenarios (name, personadescription, context, difficulty, scorecardid, createdby)
            M09->>LOG: Write scenario-create audit log
            M09-->>UI: 201 Created with scenarioId
        end
    end
```

### 7.3 Implementation notes
- The endpoint is `POST /api/v1/m09-coaching-training/trainer/scenarios` (Admin only).
- M9 validates that the linked scorecard exists in the same tenant by calling the **M2 Conversation Intelligence** REST API.
