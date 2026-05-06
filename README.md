# R-Revenue Intelligence Technical Documentation

This repository contains the comprehensive technical documentation, architecture designs, and Technical Design Documents (TDDs) for the **R-Revenue Intelligence Platform**. The documentation is organized by product module and platform-level cross-cutting concerns.

## 🚀 Project Overview

R-Revenue Intelligence is an enterprise-grade platform designed to capture, analyze, and optimize the entire revenue lifecycle. It transforms raw customer interactions into actionable business context through a sophisticated AI-driven graph architecture.

## 📂 Repository Structure

The documentation is organized into functional modules following the Revenue Intelligence Lifecycle:

### Product Modules
- **[M1 Capture & Transcription](./M1%20Capture%20&%20Transcription/)**: Ingests audio, video, and text interactions across Zoom, Meet, Slack, and Email.
- **[M2 Conversation Intelligence](./M2%20Conversation%20Intelligence/)**: Performs NLP, theme detection, and sentiment analysis on captured interactions.
- **[M3 AI Summaries & GenAI](./M3%20AI%20Summaries%20&%20GenAI/)**: Generates deal briefs, meeting summaries, and executive reports using LLMs.
- **[M4 Deal Intelligence](./M4%20Deal%20Intelligence/)**: Tracks opportunity health, blockers, and progression through the sales pipeline.
- **[M5 Account Intelligence](./M5%20Account%20Intelligence/)**: Provides a 360-degree view of account health and relationship depth.
- **[M6 Forecasting & Prediction](./M6%20Forecasting%20&%20Prediction/)**: Predictive engine for revenue forecasting and quota attainment.
- **[M7 Revenue Dashboards](./M7%20Revenue%20Dashboards/)**: High-performance visualization layer built on ClickHouse and PostgreSQL.
- **[M8 Sales Engagement](./M8%20Sales%20Engagement/)**: Workflow automation, email composition, and sales play orchestration.
- **[M9 Coaching & Training](./M9%20Coaching%20&%20Training/)**: AI-simulated training scenarios and performance coaching insights.
- **[M10 Data & Compliance](./M10%20Data%20&%20Compliance/)**: Revenue Graph, regional compliance (GDPR/CCPA), and customer data exports.

### Core Documentation
- **[docs/](./docs/)**: Contains system-wide standards and architecture guides.
  - `System_architecture.md`: The "Single Source of Truth" for the platform's microservices and event flow.
  - `Coding standards.md`: Machine-enforceable rules and engineering guidance.
  - `Event Schema registry.md`: Definitions for all cross-module asynchronous events.
  - `API Design Standards.md`: REST and Internal API naming and behavior conventions.

## 🏗️ Architectural Principles

The platform adheres to several strict architectural boundaries enforced during documentation audits:

1.  **Tenant Isolation**: All data is strictly scoped by `tenant_id` at the database level (PostgreSQL RLS).
2.  **Product vs. Architecture Separation**: Frontend-facing "Product Modules" (e.g., M8) map to discrete backend "Architecture Modules" (e.g., M-02, M-08).
3.  **Event-Driven Communication**: Modules interact via a centralized event bus using a `noun.verb` naming convention.
4.  **AI/Business Separation**: AI inference (Python/GenAI) is strictly separated from business logic and persistence (TypeScript/Node.js).
5.  **Snake_Case Standard**: All PostgreSQL table and schema references follow the `snake_case` naming convention.

## 🛠️ Getting Started

For engineers and architects new to the project:
1.  Review the **[System Architecture](./docs/markdown%20documents/System_architecture.md)** to understand module boundaries.
2.  Consult the **[Local Development Setup Guide](./docs/markdown%20documents/Local-Dev-Setup-Guide.md)** to initialize the environment.
3.  Follow the **[Git Branching Strategy](./docs/markdown%20documents/git-branching-strategy.md)** for contributing changes.

---
*Last Updated: 2026-05-06*