# Revenue Intelligence Monorepo Execution Guide

This guide documents how to set up, execute, and verify the Revenue Intelligence Monorepo. The codebase supports two execution topologies: the default **Unified Monolith Mode** (recommended for low footprint) and the **Standalone Modules Mode** (which runs each module on independent host ports).

---

## 1. Monorepo Directory Architecture

After cleaning and restructuring the repository to standard enterprise layout, the monorepo has the following folder structure:

```text
r-revenue-intelligence-monorepo/
├── apps/
│   ├── unified-api/                # NestJS Unified Monolith API Server (:3001)
│   ├── web/                        # Next.js Unified Frontend UI (:3000)
│   └── ai-services/                # Python FastAPI Semantic AI Services (:8000)
├── modules/                        # Backend feature domain modules (imported by monolithic backend)
│   ├── m01-capture-transcription/  # Capture & Transcription Module
│   ├── m02-conversation-intelligence/ # Keyword Trackers & Insights Module
│   ├── m03-ai-summaries-genai/     # LLM Summaries Module
│   ├── m08-sales-engagement/       # Tasks & Email Outreach Monolith module
│   ├── platform-core/              # Shared NestJS core abstractions & integrations
│   └── ...
├── packages/
│   ├── database/                   # Shared Prisma ORM client & schema
│   └── shared-types/               # Shared TypeScript typings
├── docs/                           # Organized documentation catalogs
│   ├── reference/                  # General references (diagrams, designs, runbooks)
│   ├── execution/                  # This guide & implementation playbooks
│   └── testing/                    # Verification and audit reports
├── scripts/                        # Monorepo developer scripts & seed tools
└── start-demo.ps1                  # Main orchestrator dev loop launcher
```

---

## 2. Unified Monolith Mode (Recommended)

In Unified Mode, the entire application frontend runs under a single Next.js web service (port `3000`) and the monolithic backend API runs under a NestJS backend (port `3001`). Heavy dependency engines (PostgreSQL, Redis, Meilisearch, and Python AI services) run inside isolated Docker containers.

### A. First-Time Setup
Run this command once before starting the app to download Docker containers, install dependencies, link workspace packages, and generate schemas:
```powershell
.\setup-first-time.ps1
```
> [!NOTE]
> Seeding the database is handled **once** automatically during the execution of this setup script.

### B. Booting the Application
Launch NestJS and Next.js developer dev servers:
```powershell
.\start-demo.ps1
```
* **No Redundant Seeding**: To maintain maximum startup speed, `start-demo.ps1` **does not** re-seed the database on boot.
* **Port Clearing**: The script clears ports `3000` and `3001` before launching to prevent address conflict crashes.

### C. Verification
Verify that all unified API endpoints (Capture, Trackers, Coaching, Sales Engagement) are responding successfully:
```powershell
.\verify-demo-apis.ps1
```

### D. Stopping the App
Shut down native dev processes and release ports `3000` and `3001`:
```powershell
.\stop-demo.ps1
```

---

## 3. Host Port Allocation Reference

| Service | Port | Runner | Role |
| :--- | :---: | :---: | :--- |
| **Next.js UI Frontend** | `3000` | Native / Terminal | Serves client pages under `http://localhost:3000/engage` |
| **NestJS monolith API** | `3001` | Native / Terminal | Serves central backend endpoints under `http://localhost:3001` |
| **PostgreSQL Database** | `5438` | Docker Container | Host relational data. Binds host port `5438` to container `5432` |
| **Redis Queue / Cache** | `6379` | Docker Container | Binds BullMQ worker broker and caching queries |
| **Meilisearch Service** | `7700` | Docker Container | Serves fast full-text document searches |
| **FastAPI Python AI** | `8000` | Docker Container | Serves semantic processing & analytics snapshots |

---

## 4. Standalone Modules Mode (Optional)

If you need to test modules in complete isolation, each backend service and UI client can be run on separate standalone port allocations.

### A. Launching Standalone Modules
To run the interactive standalone launcher, run:
```powershell
.\scripts\start-all.ps1
```
Select option `1` from the menu to launch Vite dev servers and NestJS APIs for all modules simultaneously in independent PowerShell windows.

### B. Standalone Port Allocation Matrix

| Module | Name | Backend API Port | Frontend Vite Port |
| :--- | :--- | :---: | :---: |
| **M01** | Capture & Transcription | `3001` | `5174` |
| **M02** | Conversation Intelligence | `3002` | `5175` |
| **M03** | AI Summaries & GenAI | `4010` | `5177` |
| **M05** | Account Intelligence | `4012` | `5179` |
| **M07** | Revenue Dashboards | `4013` | `5180` |
| **M09** | Coaching & Training | `4009` | `5176` |
| **M10** | Data & Compliance | `4011` | `5178` |

### C. Freeing Standalone Ports
If any standalone ports remain locked or dev windows fail to close cleanly, run:
```powershell
.\scripts\free_ports_all.ps1
```

---

## 5. Seeding & Database Management

### A. Manual Reseeding
To manually reseed all demo records (transcripts, tasks, quotas, deals, and coaching sessions) from a clean state without reinstalling everything:
```powershell
.\scripts\seed-demo-data.ps1
```

### B. Prisma Operations
If you modify `packages/database/prisma/schema.prisma`, sync the database schema and regenerate client files:
```powershell
# Generate Prisma Client
pnpm run db:generate

# Sync schema state with Postgres
pnpm run db:migrate
```

### C. Docker Cleanup
To reset PostgreSQL and Meilisearch databases, wiping volume caches:
```powershell
# Shut down container services and remove local volumes
docker compose down -v

# Start infrastructure from scratch
docker compose up -d postgres redis meilisearch
```
