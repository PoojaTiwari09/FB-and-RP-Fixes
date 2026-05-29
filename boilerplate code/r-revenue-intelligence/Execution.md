# Standalone Modules Execution Guide

This guide documents how to execute the Revenue Intelligence Standalone Modules (Modules 1, 2, 3, 5, 7, 9, 10) in development mode using a single, unified launcher command.

---

## Quick Start (One Command)

To run the standalone modules, navigate to the project directory and run the launcher script:

```powershell


$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"


cd "c:\Users\Relanto\Downloads\BACKEND_INTEGRATE\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"
.\start-all.ps1
```

---

## Prerequisites

1. **Docker Desktop**: Make sure Docker Desktop is launched and running.
2. **Node.js & pnpm**: The project is a monorepo that uses `pnpm` (run `pnpm install` once beforehand if packages are not installed).
3. **Local Port Availability**: 
   * Ports `3001-3005`, `4009-4013` (API services)
   * Ports `5174-5180` (Vite dev servers)
   * Port `6379` (Redis)
   * Port `5433` (PostgreSQL)

> [!NOTE]
> If you have a native PostgreSQL server running on your system (listening on default port `5432`), **this setup will not conflict with it**. The Docker container runs PostgreSQL on port `5433`, allowing both to coexist peacefully.

---

## How the Interactive Launcher Works

When you run `.\start-all.ps1`, you are presented with an interactive console menu:

```text
==========================================================
  REVENUE INTELLIGENCE - STANDALONE MODULES LAUNCHER  
==========================================================
[v] Set DATABASE_URL and M10_DATABASE_URL to port 5433
[i] Checking Docker database and redis services...
[v] Docker database and redis services are running.

Select what you want to launch:
1) Launch BOTH APIs and Web Frontends for all modules (1, 2, 3, 5, 7, 9, 10)
2) Launch ONLY Backend APIs (1, 2, 3, 5, 7, 9, 10)
3) Launch ONLY Web Frontends (1, 2, 3, 5, 7, 9, 10)
4) Launch custom selection of modules
Q) Quit

Enter selection (1-4, Q):
```

### Menu Options Detail

* **Option 1 (Full Suite)**: Launches the backend APIs and frontend dev servers for all 7 modules. This is the standard choice for integrated local testing.
* **Option 2 (APIs Only)**: Launches only the NestJS backend APIs. Perfect if you are testing endpoints or using an external client (like Postman or a custom frontend).
* **Option 3 (Web Frontends Only)**: Launches only the Vite web dev servers. Ideal if you are focusing entirely on UI/UX changes.
* **Option 4 (Custom Selection)**: Prompts you to enter a comma-separated list of module IDs (e.g., `1,2,5`). You then choose whether to start both APIs and webs, APIs only, or frontends only for that specific subset of modules.
* **Option Q (Quit)**: Safely exits the launcher script.

---

## Standalone Modules Reference Matrix

Each service is launched in its own **titled PowerShell window** so that you can easily monitor live terminal outputs, watch hot-reload events, and view logs. 

| Module | Name | Backend Port (NestJS) | Frontend Port (Vite) | Backend Target Endpoint |
|---|---|---|---|---|
| **M01** | Capture & Transcription | `3001` | `5174` | `http://localhost:3001/api/v1/capture-transcription` |
| **M02** | Conversation Intelligence | `3002` | `5175` | `http://localhost:3002/api/v1` |
| **M03** | AI Summaries & GenAI | `4010` | `5177` | `http://localhost:4010/api/v1/ai-summaries-genai` |
| **M05** | Account Intelligence | `4012` | `5179` | `http://localhost:4012/api/v1/account-intelligence` |
| **M07** | Revenue Dashboards | `4013` | `5180` | `http://localhost:4013/api/v1/revenue-dashboards` |
| **M09** | Coaching & Training | `4009` | `5176` | `http://localhost:4009/api/v1/coaching-training` |
| **M10** | Data & Compliance | `4011` | `5178` | `http://localhost:4011/api/v1/m10-data-compliance` |

---

## Behind the Scenes

The launcher automates multiple manual developer tasks under the hood:

1. **Docker Check**: It scans active containers. If your Postgres (`5433`) or Redis (`6379`) containers are down, it automatically executes a silent background `docker-compose up` to boot them.
2. **Session Environment Isolation**: It injects `$env:DATABASE_URL` and `$env:M10_DATABASE_URL` directly into the environment block of each spawned window, ensuring that the services bind correctly to port `5433` without permanently dirtying your global system paths.
3. **PowerShell Window Tiling**: It spins up independent lightweight instances using `Start-Process powershell` and dynamically updates each window's title to match the service (e.g. `[M01 - Capture & Transcription] [API]`), making terminal window management simple.

---

## Management and Troubleshooting

### 1. Stopping Services
To shut down any individual service, **simply close its designated terminal window**.

### 2. Freeing Ports (Port Cleanup)
If you close terminal windows but a port remains locked (or you encounter an `EADDRINUSE` error), you can free all module ports at once using the provided cleanup script:
```powershell
.\scripts\free_ports_all.ps1
```

### 3. Re-Syncing / Resetting the Database
If you need to push fresh schema definitions or completely reset the PostgreSQL tables in your container:
```powershell
# Set database target environment variable
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"

# Push schema directly
pnpm --filter @rri/database exec prisma db push
```

If you wish to wipe the database and re-initialize the Docker containers cleanly:
```powershell
docker-compose down -v
docker-compose up -d postgres redis meilisearch clickhouse
```
