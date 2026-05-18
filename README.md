# 🚀 R-Revenue Intelligence Platform

Welcome to the **R-Revenue Intelligence Platform** repository. The codebase and documentation have been streamlined to maintain a clean, standardized architectural layout consisting of two primary pillars: **Boilerplate Code** and **Reference Documents**.

---

## 📂 Repository Structure

The repository is organized into two main root directories and this primary `README.md`:

```text
├── 📦 boilerplate code/         # Complete runnable monorepo boilerplate & utility scripts
└── 📚 Reference documents/       # Technical specifications, standards, and module designs
    ├── M1 Capture & Transcription/
    ├── M2 Conversation Intelligence/
    ├── M3 AI Summaries & GenAI/
    ├── ...
    ├── docs/                     # Core system-wide specifications & architectures
    └── archives/                 # Historic documentation versions
```

---

## 📦 1. Boilerplate Code (`/boilerplate code`)

This directory contains the production-ready modular monolith skeleton and all supporting utility scripts:

*   **[boilerplate code/r-revenue-intelligence/](./boilerplate%20code/r-revenue-intelligence/)**: The core NestJS & FastAPI monorepo, including Docker configuration, DB seeding, and Turborepo setup.
*   **[boilerplate code/generate_boilerplate.py](./boilerplate%20code/generate_boilerplate.py)**: Python utility script to scaffold and regenerate the boilerplate code.
*   **[boilerplate code/syntax_validator.py](./boilerplate%20code/syntax_validator.py)**: Automated syntax and AST validator script to enforce compile-readiness.
*   **[boilerplate code/audit_boilerplate.py](./boilerplate%20code/audit_boilerplate.py)**: Verification suite for verifying all scaffolded files and paths.

---

## 📚 2. Reference Documents (`/Reference documents`)

The system design, product specifications, and standards are partitioned across individual module domains and general core standards:

### 🧩 Lifecycle Module Documents
*   **[M1 Capture & Transcription](./Reference%20documents/M1%20Capture%20&%20Transcription/)**: Ingests audio, video, and text interactions across Zoom, Meet, Slack, and Email.
*   **[M2 Conversation Intelligence](./Reference%20documents/M2%20Conversation%20Intelligence/)**: Performs NLP, theme detection, and sentiment analysis on captured interactions.
*   **[M3 AI Summaries & GenAI](./Reference%20documents/M3%20AI%20Summaries%20&%20GenAI/)**: Generates deal briefs, meeting summaries, and executive reports using LLMs.
*   **[M4 Deal Intelligence](./Reference%20documents/M4%20Deal%20Intelligence/)**: Tracks opportunity health, blockers, and progression through the sales pipeline.
*   **[M5 Account Intelligence](./Reference%20documents/M5%20Account%20Intelligence/)**: Provides a 360-degree view of account health and relationship depth.
*   **[M6 Forecasting & Prediction](./Reference%20documents/M6%20Forecasting%20&%20Prediction/)**: Predictive engine for revenue forecasting and quota attainment.
*   **[M7 Revenue Dashboards](./Reference%20documents/M7%20Revenue%20Dashboards/)**: High-performance visualization layer built on ClickHouse and PostgreSQL.
*   **[M8 Sales Engagement](./Reference%20documents/M8%20Sales%20Engagement/)**: Workflow automation, email composition, and sales play orchestration.
*   **[M9 Coaching & Training](./Reference%20documents/M9%20Coaching%20&%20Training/)**: AI-simulated training scenarios and performance coaching insights.
*   **[M10 Data & Compliance](./Reference%20documents/M10%20Data%20&%20Compliance/)**: Revenue Graph, regional compliance (GDPR/CCPA), and customer data exports.

### 📐 Core Platform Architecture & Standards
*   **[docs/](./Reference%20documents/docs/)**: Contains system-wide standards and architecture guides.
    *   `System_architecture.md`: The "Single Source of Truth" for the platform's microservices and event flow.
    *   `Coding standards.md`: Machine-enforceable rules and engineering guidance.
    *   `Event Schema registry.md`: Definitions for all cross-module asynchronous events.
    *   `API Design Standards.md`: REST and Internal API naming and behavior conventions.

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
1.  Review the **[System Architecture](./Reference%20documents/docs/markdown%20documents/System_architecture.md)** to understand platform-wide module boundaries.
2.  Consult the **[Local Development Setup Guide](./Reference%20documents/docs/markdown%20documents/Local-Dev-Setup-Guide.md)** to initialize your local dockerized environment.
3.  Follow the **[Git Branching Strategy](./Reference%20documents/docs/markdown%20documents/git-branching-strategy.md)** for contributing changes.
4.  Launch local validations by executing the custom validation suite:
    ```bash
    python "boilerplate code/syntax_validator.py"
    ```

---
*Last Updated: 2026-05-18*