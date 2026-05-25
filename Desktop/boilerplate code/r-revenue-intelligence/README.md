# R-Revenue Intelligence Monorepo Boilerplate

Welcome to the **R-Revenue Intelligence Platform**—an enterprise-grade AI-powered revenue intelligence platform built to capture customer interactions across the full sales lifecycle and convert them into structured business insights.

This repository uses a high-performance **pnpm workspaces** and **Turborepo** monorepo layout, integrating NestJS, Python FastAPI, and Next.js SPA clients into a single, unified codebase.

---

## 🛠️ Repository Quick-Start

1. **Initialize Git**:
   ```bash
   git init
   git remote add origin <your-github-repo-url>
   git checkout -b develop
   ```

2. **Commit & Push Initial Scaffold**:
   ```bash
   git add .
   git commit -m "chore: scaffold modular monolith boilerplate with platform core and 10 modules"
   git push -u origin develop
   ```

---

## 💻 Local Development Setup (Dual-Approach Options)

You can run the entire platform locally utilizing one of the two following approaches, depending on your system resources and configuration preferences:

### 🐳 Option A: With Docker (Recommended)
This approach leverages containerized services to run the entire backend and database infrastructure out-of-the-box with a single command.

1. **Spin up local infrastructure and application containers**:
   ```bash
   # In the repository root
   docker-compose up -d
   ```
   *This starts Postgres (with `pgvector` on port 5432), Redis (on port 6379), Meilisearch (on port 7700), ClickHouse (on port 8123/9000), and all backend microservices.*

2. **Sync the Database Schema**:
   Prisma compiles database queries at the runtime layer. Generate the client typings and push the master schema to your local Postgres container:
   ```bash
   # Compile schemas and types globally
   pnpm --workspace-concurrency=1 -r db:generate
   
   # Push master schema to local DB
   npx prisma db push --schema=packages/database/prisma/schema.prisma
   ```

3. **Access Services locally**:
   * **Frontend PanelSPA**: `http://localhost:3000`
   * **NestJS Gateway API**: `http://localhost:3001`
   * **FastAPI AI Server**: `http://localhost:8000`

---

### 🔌 Option B: Without Docker (Native Host Setup)
If you prefer not to run Docker or want to avoid local container virtualization overhead, you can run all services natively on your host machine.

#### **Prerequisites**:
- Install **Node.js 20 LTS** and **pnpm** globally.
- Install **Python 3.11** globally (required for AI and transcription services).
- Install and start **PostgreSQL** natively (or point to a free remote DB like Supabase/Neon).
- Install and start **Redis** natively (or point to a cloud service like Upstash).

#### **Setup & Run Steps**:

1. **Configure local environment variables**:
   Create a `.env` file in your repository root directory and define the native connection strings:
   ```env
   # Local or Cloud Postgres Connection
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/revenue_intel?schema=public"

   # Local or Cloud Redis Host configuration
   REDIS_HOST="localhost"
   REDIS_PORT="6379"

   # FastAPI Endpoint
   AI_SERVICE_URL="http://localhost:8000"
   ```

2. **Initialize Database Typings & Tables**:
   Push the global shared schema models directly to your native/cloud PostgreSQL instance:
   ```bash
   # Run sequential generator typings
   pnpm --workspace-concurrency=1 -r db:generate
   
   # Synchronize models with your target DB instance
   npx prisma db push --schema=packages/database/prisma/schema.prisma
   ```

3. **Launch the Node applications**:
   ```bash
   # Install monorepo dependencies
   pnpm install
   
   # Launch Next.js and NestJS API in parallel
   pnpm dev
   ```

4. **Launch the Python FastAPI AI Service**:
   Open a separate terminal window and run:
   ```bash
   cd apps/ai-services
   python -m venv venv
   source venv/bin/activate  # (On Windows: venv\Scripts\activate)
   pip install -r requirements.txt
   uvicorn app.main:app --port 8000 --reload
   ```

---

## 📦 Monorepo Workspace Directory Layout

```text
r-revenue-intelligence/
├── apps/
│   ├── web/               # Next.js 14 SPA Dashboard
│   ├── api/               # NestJS Core Gateway Orchestrator
│   └── ai-services/       # FastAPI Python AI/ML Inference engine
├── modules/               # Root-level Decoupled Monorepo Workspaces
│   ├── platform-core/     # Global Core Auth, JWT guards, Central Prisma services
│   └── m01-m10/           # Features code workspaces (M1 Capture through M10 Compliance)
└── packages/
    ├── database/          # Central database base models and migrations
    └── shared-types/      # Centralized Event schemas & DTO bindings
```

---

## 🎯 Modular Sprint Development Workflow

To prevent workspace conflicts during parallel development across our module teams, adhere strictly to the following Git branching guidelines:

1. **Base branches**:
   * `main`: Reflects the production state. Never commit directly to `main`.
   * `develop`: Active monorepo integration target.
2. **Module Integration Branches (`module/mX-*`)**:
   * Each team works within one persistent sprint staging branch (e.g. `module/m04-deal-intelligence`).
3. **Feature branches**:
   * Cut individual feature branches directly from your parent `module/mX-*` branch (e.g. `feature/m4-RRI-401-deals-board-ui`).
   * When complete, open a PR to merge back into `module/mX-*`.
   * Once fully integrated and stable, the Tech Lead merges `module/mX-*` into the main `develop` branch.
