# Port Consolidation & Architecture Mapping Report

This document explains how the **14 standalone application ports** were consolidated into a unified development setup running on **6 active ports**, and why this approach compares favorably to the layout described in [System_architecture.docx](file:///c:/Users/Relanto/OneDrive%20-%20Relanto/Downloads/INTEGRATION_112/System_architecture.docx).

---

## 1. Standalone vs. Unified Port Mapping

In Standalone Mode, every feature module runs its own client and server. In Unified Mode, these are consolidated:

| Module | Standalone Backend Port | Standalone Frontend Port | Unified Mapping (Monorepo Setup) |
| :--- | :---: | :---: | :--- |
| **M01 — Capture & Transcription** | `3001` | `5174` | Unified UI: `3000` / Unified NestJS API: `3001` |
| **M02 — Conversation Intelligence** | `3002` | `5175` | Unified UI: `3000` / Unified NestJS API: `3001` |
| **M03 — AI Summaries & GenAI** | `4010` | `5177` | Unified UI: `3000` / Unified NestJS API: `3001` |
| **M05 — Account Intelligence** | `4012` | `5179` | Unified UI: `3000` / Unified NestJS API: `3001` |
| **M07 — Revenue Dashboards** | `4013` | `5180` | Unified UI: `3000` / Unified NestJS API: `3001` (Redirected from `4013`) |
| **M09 — Coaching & Training** | `4009` | `5176` | Unified UI: `3000` / Unified NestJS API: `3001` |
| **M10 — Data & Compliance** | `4011` | `5178` | Unified UI: `3000` / Unified NestJS API: `3001` |

---

## 2. Technical Implementation: How Port Consolidation Was Achieved

### A. Frontend Consolidation (Port `3000`)
Instead of launching 7 separate Vite dev servers, all page modules (Engage, Calls, Coaching, Revenue Dashboards, Forecast, Deal Drivers, AI Researcher, Data Cloud) are bundled inside `unified-ui`. 
*   **Active Port:** `3000` serves the entire client bundle under a single web process.

### B. Backend API Consolidation (Port `3001`)
The modular monolith server (`apps/api`) imports the backend NestJS modules for all features (including `M07RevenueDashboardsModule`) into its root `AppModule`.
*   **Active Port:** `3001` serves all features concurrently.

### C. M07 Routing Redirection (Port `4013` $\rightarrow$ `3001`)
Previously, the Next.js client attempted to proxy dashboard requests (under `/api/manager/revenue-dashboards/*`) to port `4013` (where `m07-api` ran standalone). We changed this by:
1.  Setting `$env:M07_API_PORT='3001'` in the UI launch script.
2.  Updating fallback ports in `next.config.ts` and `src/app/api/manager/revenue-dashboards/[...path]/route.ts` to default to `3001`.
*   This removes the need to launch an independent process on port `4013`, funneling all calls through the unified backend on port `3001`.

### D. Infrastructure & AI Docker Containers
Heavy database and background processing services run inside isolated Docker containers:
*   **Port `5433`:** PostgreSQL database with `pgvector` extension.
*   **Port `6379`:** Redis caching and BullMQ queue broker.
*   **Port `7700`:** Meilisearch container serving fast full-text search queries.
*   **Port `8000`:** Python FastAPI AI services for semantic processing.

---

## 3. Comparison with the `System_architecture.docx` Document

The system architecture document describes a fully containerized staging/production topology. The Unified Port Monolith approach is the **best development workflow** for several key reasons:

1.  **Low Local Memory Footprint:** Running 14 separate web and backend Node/Python processes natively on a developer's computer requires up to 16GB of RAM just for development servers. The unified monolith uses only **two native Node processes** (one Next.js frontend, one NestJS backend), drastically saving memory and CPU.
2.  **Simplified Boot and Orchestration:** Rather than managing multiple startup scripts and terminals, developers run a single command (`.\start-demo.ps1`) to get the entire project up.
3.  **Zero Database/Prisma Lock Contention:** Multiple independent backend modules trying to generate Prisma clients or run migrations against the same DB engine can cause query engine lockups (`EPERM` / file locks). Having one unified API server on port `3001` eliminates concurrent DB client generation issues.
4.  **Flexible Service Routing:** The frontend proxies all traffic through port `3001`, acting as an API gateway. This simplifies local proxy configurations and prevents CORS issues.
