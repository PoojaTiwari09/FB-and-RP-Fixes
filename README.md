# 🚀 R-Revenue Intelligence Platform

Welcome to the **R-Revenue Intelligence Platform** repository. The codebase and documentation are organized into **Boilerplate Code** (runnable monorepo) and **`doc/`** (all specifications, audits, and runbooks).

---

## 📂 Repository Structure

```text
├── 📦 boilerplate code/         # Runnable monorepo (unchanged — app source only)
└── 📚 doc/
    ├── reference/               # Product specs, TDDs, architecture (M1–M10)
    ├── execution/               # Runbooks, smoke plans, audit index, scripts
    ├── analysis/                # Module & platform analysis reports
    ├── fix/                     # Fix logs and remediation reports
    └── test_result/             # Smoke, validation, performance outputs + test_case/
```

---

## 📦 1. Boilerplate Code (`/boilerplate code`)

This directory contains the production-ready modular monolith skeleton and all supporting utility scripts:

*   **[boilerplate code/r-revenue-intelligence/](./boilerplate%20code/r-revenue-intelligence/)**: The core NestJS & FastAPI monorepo, including Docker configuration, DB seeding, and Turborepo setup.
*   **[boilerplate code/generate_boilerplate.py](./boilerplate%20code/generate_boilerplate.py)**: Python utility script to scaffold and regenerate the boilerplate code.
*   **[boilerplate code/syntax_validator.py](./boilerplate%20code/syntax_validator.py)**: Automated syntax and AST validator script to enforce compile-readiness.
*   **[boilerplate code/audit_boilerplate.py](./boilerplate%20code/audit_boilerplate.py)**: Verification suite for verifying all scaffolded files and paths.

---

## 📚 2. Documentation (`/doc`)

### `doc/reference/` — Product & platform specifications (M1–M10)

*   **[M1 Capture & Transcription](./doc/reference/M1%20Capture%20&%20Transcription/)**
*   **[M2 Conversation Intelligence](./doc/reference/M2%20Conversation%20Intelligence/)**
*   **[M3 AI Summaries & GenAI](./doc/reference/M3%20AI%20Summaries%20&%20GenAI/)**
*   **[M4 Deal Intelligence](./doc/reference/M4%20Deal%20Intelligence/)**
*   **[M5 Account Intelligence](./doc/reference/M5%20Account%20Intelligence/)**
*   **[M6 Forecasting & Prediction](./doc/reference/M6%20Forecasting%20&%20Prediction/)**
*   **[M7 Revenue Dashboards](./doc/reference/M7%20Revenue%20Dashboards/)**
*   **[M8 Sales Engagement](./doc/reference/M8%20Sales%20Engagement/)**
*   **[M9 Coaching & Training](./doc/reference/M9%20Coaching%20&%20Training/)**
*   **[M10 Data & Compliance](./doc/reference/M10%20Data%20&%20Compliance/)**

**Core platform standards:** [doc/reference/docs/markdown documents/](./doc/reference/docs/markdown%20documents/) — `System_architecture.md`, `Coding standards.md`, `Local-Dev-Setup-Guide.md`, etc.

### `doc/execution/` — How to run & audit

Start with [doc/execution/README.md](./doc/execution/README.md) (audit index), then `version_knowledge.md`, `smoke_test_plan.md`, `implementation_changes.md`.

**Standalone modules (M01–M10):** [doc/execution/standalone/STANDALONE-MODULE-COMMANDS.md](./doc/execution/standalone/STANDALONE-MODULE-COMMANDS.md)

**Cross-module data flow & integration plan:** [doc/execution/MODULE-DATA-FLOW.md](./doc/execution/MODULE-DATA-FLOW.md)

### `doc/analysis/` · `doc/fix/` · `doc/test_result/`

Audit deliverables: module analysis reports, fix logs, smoke/validation/performance results, and [doc/test_result/test_case/](./doc/test_result/test_case/) integration scripts.

---

## 🏗️ Architectural Principles

The platform adheres to several strict architectural boundaries enforced during automated linting and validations:

1.  **Tenant Isolation**: All data is strictly scoped by `tenant_id` at the database level (enforced via PostgreSQL RLS policies).
2.  **Product vs. Architecture Separation**: Frontend-facing "Product Modules" (e.g., M8) map to discrete backend "Architecture Modules" (e.g., M-02, M-08).
3.  **Event-Driven Communication**: Modules interact asynchronously via a centralized event bus using a `noun.verb` naming convention.
4.  **AI/Business Separation**: AI inference workloads (Python/FastAPI) are strictly separated from core business logic (TypeScript/NestJS).
5.  **Snake_Case Database Standard**: All PostgreSQL table and schema references follow the `snake_case` naming convention.

---

## 🛠️ Getting Started

For engineers and Tech Leads new to the repository:
1.  Review the **[System Architecture](./doc/reference/docs/markdown%20documents/System_architecture.md)** to understand platform-wide module boundaries.
2.  Consult the **[Local Development Setup Guide](./doc/reference/docs/markdown%20documents/Local-Dev-Setup-Guide.md)** to initialize your local dockerized environment.
3.  Follow the **[Git Branching Strategy](./doc/reference/docs/markdown%20documents/git-branching-strategy.md)** for contributing changes.
4.  Launch local validations by executing the custom validation suite:
    ```bash
    python "boilerplate code/syntax_validator.py"
    ```

---
*Last Updated: 2026-05-28*