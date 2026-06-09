# Revenue Intelligence Monorepo

Welcome to the **Revenue Intelligence Platform**—a modular monolith designed to capture, analyze, forecast, and optimize enterprise sales pipelines and rep performance. 

This repository consolidates 11 domain modules and a unified responsive Next.js frontend into a highly optimized, flat monorepo layout using `pnpm` workspaces and Turborepo.

---

## 📖 Directory & Codebase Architecture

The project has been cleaned and reorganized into a standard flat monorepo structure:

```text
r-revenue-intelligence-monorepo/
├── apps/
│   ├── unified-api/                # Central NestJS Monolithic API Bootstrap (:3001)
│   ├── web/                        # Unified Next.js Frontend Application (:3000)
│   └── ai-services/                # Optional Python FastAPI AI Microservice (:8000)
├── modules/                        # Modular backend domain logical packages
│   ├── m01-capture-transcription/  # Call recording upload, transcript mapping (AssemblyAI/pgvector)
│   ├── m02-conversation-intelligence/ # Keyword trackers, objection detection, highlights
│   ├── m03-ai-summaries-genai/     # LLM call summaries, sentiment analysis, action items
│   ├── m04-deal-intelligence/      # Deal risk drivers, pipeline health indicators
│   ├── m05-account-intelligence/   # Mutual plans, contact mapping, HubSpot deal syncing
│   ├── m06-forecasting-prediction/ # Versioned submissions, baseline projections, AI predictor
│   ├── m07-revenue-dashboards/     # Interactive dashboard builders, templates, widget catalog
│   ├── m08-sales-engagement/       # Task queue (Email, Calls, ToDo), AI templates, snooze engine
│   ├── m09-coaching-training/      # Manager audits, coaching feedback cards, training reports
│   ├── m10-data-compliance/        # PII scrubbing, compliance logs, visual Revenue Graph
│   ├── m11-ai-deep-researcher/     # Multi-agent competitor web scraping & briefs
│   └── platform-core/              # Shared NestJS middleware, exceptions, and helpers
├── packages/                       # Shared internal packages
│   ├── database/                   # Single source of truth for Prisma schemas and migrations
│   └── shared-types/               # Central TypeScript type definitions
├── docs/                           # Organized developer documentation catalog
│   ├── reference/                  # Architecture specs, diagram files, runbooks, and decisions
│   ├── execution/                  # Central execution playbooks and migration logs
│   └── testing/                    # Test plans, verification reports, and audits
├── scripts/                        # Database seeds, environment syncer, and ports cleaners
├── docker-compose.yml              # Local container setups (PostgreSQL, Redis, Meilisearch)
└── start-demo.ps1                  # Main developer dev-loop orchestrator
```

---

## 🛠️ Unified Port Mapping & Topologies

The codebase supports two dev topologies, with **Unified Monolith Mode** recommended for daily local development:

### 1. Unified Monolith Mode (Recommended)
* **Unified UI (`:3000`)**: Next.js client serving all modules concurrently under a single port.
* **Unified NestJS API (`:3001`)**: Single modular NestJS API bootstrap executing all modular backends and proxying database access.
* **Database & Caches**: Binds PostgreSQL (`:5433`), Redis (`:6379`), Meilisearch (`:7700`), and Python AI Services (`:8000`) inside Docker.

### 2. Standalone Modules Mode
* Allows developers to spin up specific modules (e.g. M01 API on `:3001` + Vite UI on `:5174`, M03 API on `:4010` + Vite UI on `:5177`) in absolute isolation.
* Accessible via `.\scripts\start-all.ps1`.

For a full breakdown of port distributions and a comparison with containerized setups, review the [Port Consolidation Report](file:///c:/Users/Relanto/OneDrive%20-%20Relanto/Downloads/INTEGRATION_112/r-revenue-intelligence-monorepo/docs/reference/port_consolidation_report.md).

---

## 🚀 Execution & Quick Start

For installation, dependency resolution, database migrations, seeding, and execution commands, **please refer directly to the central execution guide**:

👉 **[Execution Guide (Execution.md)](file:///c:/Users/Relanto/OneDrive%20-%20Relanto/Downloads/INTEGRATION_112/r-revenue-intelligence-monorepo/docs/execution/Execution.md)**

### Quick Commands Summary:
* **First-Time Installation**: Run `.\setup-first-time.ps1` from the repo root to prepare Docker, install packages, compile schemas, and seed demo records.
* **Daily Start**: Run `.\start-demo.ps1` to spin up Next.js on port `3000` and NestJS on port `3001`.
* **Daily Stop**: Run `.\stop-demo.ps1` to cleanly terminate native node processes and clear port locks.
* **Verify Health**: Run `.\verify-demo-apis.ps1` to smoke-test API endpoints.

---

## 📦 Domain Modules Breakdown

### 🎙️ M01 Capture & Transcription
Extracts speaker segments and logs transcripts. Handles audio file uploads, processes transcripts asynchronously (using AssemblyAI or mock engine), maps speaker turns, and utilizes the PostgreSQL `pgvector` extension to facilitate fast semantic queries over conversation history.

### 🔍 M02 Conversation Intelligence
Analyzes calls to extract business intelligence trackers. Detects objection patterns, competitor mentions, pricing comments, and key highlights using flexible keyword and regular expression matchers.

### 🤖 M03 AI Summaries & GenAI
Leverages generative AI models (OpenAI, Gemini, Groq) to generate call summaries, highlight action items, estimate buyer sentiment, and identify next steps directly from conversation transcripts.

### 📈 M04 Deal Intelligence
Aggregates pipeline health metrics, logs buyer sentiment indices, and identifies deal risk drivers to give sales managers and executives a real-time risk assessment of ongoing opportunities.

### 🏢 M05 Account Intelligence
Manages customer engagement records, constructs mutual plans, maps client stakeholders, and links directly with CRM systems (HubSpot) for automatic data synchronization.

### 🔮 M06 Forecasting & Prediction
Maintains an append-only versioned log of sales rep forecast submissions. Applies baseline mathematical trends (`avg_last_2`, `last_period`, etc.) and uses a Python-based machine learning microservice on port `8000` to deliver AI-driven prediction models with override impact calculations.

### 📊 M07 Revenue Dashboards
Empowers managers to build customized dashboard views using a widget catalog, templates, line/bar charts, and responsive layouts to monitor overall sales organization performance.

### ⚡ M08 Sales Engagement (Engage)
A high-velocity rep productivity console. Integrates task queues (Calls, Emails, LinkedIn actions, custom ToDos), provides AI-assisted email template compositions, supports task snoozing, and provides manager activity analytics.

### 🎓 M09 Coaching & Training
Enables managers to audit call recordings, attach feedback annotations directly to transcript timestamps, assign structured coaching cards, and generate AI-powered coaching reports.

### 🛡️ M10 Data & Compliance
Audits system data access events, registers masking rules for PII compliance, and visualizes transaction data structures dynamically via a multi-relationship visual **Revenue Graph**.

### 🕵️ M11 AI Deep Researcher
Deploys autonomous multi-agent web scraping tools (powered by Firecrawl) to perform real-time research and synthesize detailed briefs on prospects, target companies, and competitors.

### 🧩 Platform Core
Provides common cross-cutting utilities, generic NestJS abstractions, database connection logic, global error filters, audit logging interceptors, and authentication guards.
