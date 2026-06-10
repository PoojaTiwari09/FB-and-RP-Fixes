# INTEGRATION 112 — Clone → Run (Windows)

Monorepo folder: **`r-revenue-intelligence-monorepo`**

| Service | Port / Address |
| :--- | :--- |
| **Next.js UI Frontend** | `http://localhost:3000` |
| **NestJS Monolith API** | `http://localhost:3001` |
| **PostgreSQL Database** | `127.0.0.1:5438` |
| **Redis Cache / Queue** | `127.0.0.1:6379` |
| **Meilisearch Service** | `127.0.0.1:7700` |
| **FastAPI Python AI** | `127.0.0.1:8000` |

---

## Prerequisites

Install and verify your local runtime tools:
```powershell
node -v          # 20+ recommended
pnpm -v          # 10.14.x recommended
docker -v        # Docker Desktop running
```

---

## 1. Clone & Initialize

```powershell
git clone <your-repo-url>
cd r-revenue-intelligence-monorepo
```

---

## 2. Environment Configurations

Create and sync local configuration files:

### Root `.env` Setup
```powershell
copy .env.example .env
```

Edit **`r-revenue-intelligence-monorepo\.env`** to configure local keys and database links:
```env
DATABASE_URL=postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public
DIRECT_URL=postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public
M10_DATABASE_URL=postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public

REDIS_URL=redis://localhost:6379
DISABLE_REDIS=false
DISABLE_MEILI=true
DISABLE_AI=true

AI_SERVICES_URL=http://localhost:8000
JWT_SECRET=local-dev-secret-change-me

# Optional API keys
GROQ_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
ASSEMBLYAI_API_KEY=
OPENROUTER_API_KEY=
```

### Sync Environment variables
Distribute configurations to workspaces:
```powershell
.\scripts\sync-env.ps1
```
This script populates/syncs:
* `apps/web/.env.local`

---

## 3. First-Time Setup

Run the bootstrapper script to configure local containers, install dependencies, compile databases, and run migrations:
```powershell
.\setup-first-time.ps1
```
This script handles:
1. Docker Compose setup for Postgres and Redis.
2. Root `pnpm install` and packages linking.
3. Database seeding (M01 Call Records, M08 Engage, M02 Trackers, M06 Forecasting).

---

## 4. Running the Dev Loop

Start the developer loop orchestrator:
```powershell
.\start-demo.ps1
```
This launches two native developer environments:
* **Next.js UI** (:3000)
* **NestJS Modular API** (:3001)

### Verify Connection Health
```powershell
.\verify-demo-apis.ps1
```

### Stopping Dev Services
```powershell
.\stop-demo.ps1
```

---

## 5. Manual CLI Operations

All commands should run directly from the monorepo root:

### Docker Container Control
```powershell
docker compose up -d              # Start PostgreSQL + Redis
docker compose ps                 # Check container status
docker compose down               # Stop containers (keep volumes)
docker compose down -v            # Stop and wipe database volumes
```

### Prisma ORM Commands
```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"

pnpm run db:generate              # Regenerate client types (stop API first to prevent EPERM locks)
pnpm run db:migrate               # Execute pending migrations
```

### Manual Reseeding
```powershell
# Complete system data seeding (recommended)
.\scripts\seed-demo-data.ps1

# M06 Forecasting and AI Prediction models seed only
.\seed-m06.ps1
```

### Launch Individual Apps manually
```powershell
# Start central api only
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
$env:UNIFIED_API_PORT="3001"
pnpm run dev:unified-api

# Start Next.js client only
cd apps/web
npm run dev
```

---

## 6. Login Personas & Cooked Switching

Switch between roles by entering cookies directly into the browser console:

* **Manager Persona**:
  ```javascript
  document.cookie = "user_role=sales_manager; path=/"; location.reload();
  ```
* **Sales Rep Persona**:
  ```javascript
  document.cookie = "user_role=sales_rep; path=/"; location.reload();
  ```

| Profile Persona | Login Email | Password | Role Dashboard Route |
| :--- | :--- | :--- | :--- |
| **Sales Manager** | `manager@example.com` | `password123` | `/ai-revenue-predictor`, `/calls/reviews` |
| **Sales Representative**| `rep@example.com` | `password123` | `/forecast-boards`, `/engage` |

---

## 7. Troubleshooting Matrix

| Issue Scenario | Actionable Fix |
| :--- | :--- |
| **Predictor/Forecast Boards Empty** | Execute `.\seed-m06.ps1` and refresh the browser tab. |
| **Prisma query engine locked (EPERM)**| Run `.\stop-demo.ps1` to stop active Node executors before generating schemas. |
| **Docker Connection Refused** | Ensure Docker Desktop is active and verify containers via `docker ps`. |
| **Next.js Turbopack template parsing errors** | Inspect modified components (like `results/page.tsx`) for incomplete tags. |
