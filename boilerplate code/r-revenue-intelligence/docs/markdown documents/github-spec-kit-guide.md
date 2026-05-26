# GitHub Spec Kit & Spec-Driven Development (SDD) Guide

## 1. OVERVIEW & PHILOSOPHY

GitHub Spec Kit is an open-source framework designed to ground **AI Coding Agents** and engineering teams in **Spec-Driven Development (SDD)**. Instead of traditional "vibe coding" (where developer prompts are chaotic, unstructured, and prone to breaking architectural guidelines), Spec Kit enforces a strict, documents-first workflow. 

Every design decision, database schema mutation, API route, and background worker is planned, validated against the platform's **Constitution**, and checked off on a phased task list before a single line of application code is written.

---

## 2. THE SPEC KIT STRUCTURE IN R-REVENUE INTELLIGENCE

The root directory of our codebase contains a `.specify/` configuration folder, which acts as the DNA and blueprint for the platform:

```
.specify/
├── memory/
│   └── constitution.md        # Non-negotiable architectural boundaries and safety guards
└── templates/
    ├── specify.md             # Blueprint for new feature specifications (requirements)
    ├── plan.md                # Blueprint for technical design plan
    └── tasks.md               # Blueprint for phased checklists
```

---

## 3. THE 4-PHASE SDD WORKFLOW

When adding a feature or refactoring existing modules, the team (and their AI assistant) must execute these four phases sequentially:

```
[Phase 1: SPECIFY] ──► [Phase 2: PLAN] ──► [Phase 3: TASKS] ──► [Phase 4: IMPLEMENT]
```

### Phase 1 — Feature Specification (Specify)
- **Action:** Define **what** the feature is and **why** it is needed. Do not list technical implementation details here.
- **Location:** `.specify/specs/spec-[feature-name].md` (created from `templates/specify.md`).
- **Command:** `/speckit.specify` (or ask your AI agent: *"Read this spec file and evaluate if it completely defines the business expectations and acceptance criteria."*).

### Phase 2 — Technical Design Plan (Plan)
- **Action:** Define **how** the feature will be implemented. The AI agent analyzes the Spec file against the **Constitution** to create a technical blueprint.
- **Location:** `.specify/plans/plan-[feature-name].md` (created from `templates/plan.md`).
- **Command:** `/speckit.plan` (or ask your AI agent: *"Analyze our specify file and write a comprehensive technical plan. Ensure complete alignment with memory/constitution.md rules."*).
- **Mandatory Review:** The engineering team must review and manually approve the plan before proceeding.

### Phase 3 — Implementation Checklist (Tasks)
- **Action:** Convert the approved plan into phased, actionable tasks.
- **Location:** `.specify/tasks/tasks-[feature-name].md` (created from `templates/tasks.md`).
- **Command:** `/speckit.tasks` (or ask your AI agent: *"Convert our approved technical plan into a step-by-step development task list."*).

### Phase 4 — Execution & Verification (Implement)
- **Action:** Point the AI agent (e.g. Claude Code, Copilot, Cursor) to the task list and let it implement the code files one step at a time.
- **Command:** `/speckit.implement` (or instruct the AI: *"Let's implement the tasks inside tasks-[feature-name].md sequentially. Check off each box and run our tests after each step to guarantee compilation readiness."*).

---

## 4. INTEGRATING SPEC KIT WITH MODULAR MONOLITH GUIDELINES

Every generated spec and plan is verified against `.specify/memory/constitution.md` to protect core architectural boundaries:

| Architectural Guardrail | Spec Kit Action / Verification |
|---|---|
| **Tenant Isolation** | AI validates that every database migration includes a raw SQL PostgreSQL RLS policy `tenant_id = current_setting(...)`. |
| **Language Boundaries** | Enforces that NestJS (TypeScript) services never call LLMs directly; AI must route all inferences through `/v1/` Python FastAPI endpoints. |
| **Secrets Safety** | Scans code to prevent hardcoded passwords/tokens; mandates the use of Doppler commands. |
| **BullMQ Idempotency** | AI worker checks the database for existing `eventId` to ignore duplicate deliveries before executing the job. |
| **Loose Coupling** | Forbids direct cross-module database imports; mandates BullMQ events or public API services. |

---

## 5. REAL-WORLD PRACTICE GUIDE FOR DEVELOPERS

### Scenario: Adding "AI-Generated Deal Health Scores" (M-04 / M-07)

1. **Write Spec:**
   Create `.specify/specs/spec-deal-health.md` describing that when a call is scored, a deal health score should update.
2. **AI Plans Database & Event Setup:**
   Run `/speckit.plan`. The AI will generate:
   - Schema mutation: Adds `health_score` to `m07_deal_boards`.
   - Event trigger: Listens to `call.scored` (M-04).
   - Validation: Exposes endpoint `/api/v1/deal-management/health` with `JwtAuthGuard` + `TenantGuard`.
3. **Generate Tasks:**
   Run `/speckit.tasks` to create `.specify/tasks/tasks-deal-health.md`.
4. **AI Implements Code:**
   Point your AI agent to the tasks checklist. The AI writes the Prisma migrations, enabling RLS, codes the event listener, exposes the endpoint, and writes Jest unit tests.
5. **Merge PR:**
   Submit a PR. Your PR description will automatically link to `tasks-deal-health.md` showing all completed boxes!

---

*For details on core architecture modules and registries, read [complete_codebase_knowledge_base.md](complete_codebase_knowledge_base.md).*
*Last compiled: 2026-05-17*
