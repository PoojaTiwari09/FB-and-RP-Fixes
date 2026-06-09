# R-Revenue Intelligence: Boilerplate Architecture & Contribution Guide
**Version:** 1.0
**Status:** 🟢 Active

---

## 1. Overview of the Boilerplate Structure

The R-Revenue Intelligence platform is built as a **Decoupled Modular Monorepo**. It uses **Turborepo** and **PNPM Workspaces** to manage the entire codebase in a single repository while keeping the 10 product modules strictly isolated.

The boilerplate is divided into 3 main zones:
1. **`apps/`**: The runnable applications (Frontend UI, Gateway API, Python AI layer).
2. **`modules/`**: The isolated backend NestJS workspaces for Teams M1–M10.
3. **`packages/`**: The shared centralized tools (e.g., the global Prisma Database schema).

### Complete Directory Map
```text
boilerplate code/r-revenue-intelligence/
├── apps/
│   ├── web/                     # Next.js Frontend SPA (React)
│   ├── api/                     # NestJS Core API Gateway
│   └── ai-services/             # FastAPI Python Inference Engine
│
├── modules/                     # 10 Isolated Backend Team Workspaces
│   ├── platform-core/           # Global Auth, Events, Guards
│   ├── m01-capture-transcription/
│   ├── m02-conversation-intelligence/
│   ├── ... (M3 to M9)
│   └── m10-data-compliance/
│
└── packages/                    # Centralized Shared Packages
    ├── database/                # The SINGLE Source of Truth for Database (schema.prisma)
    └── shared-types/            # Global Types and Event Bus schemas
```

---

## 2. Where to Make Changes (By Engineering Role)

To prevent "spaghetti code", teams must **never** dump all their files into a shared root folder. Every team has a strict isolation boundary. Find your role below to see exactly where you should be writing code.

### 🎨 Frontend UI Developers (React / Next.js)
Your work happens inside `apps/web/`.
- **Where to put your UI components:** `apps/web/src/modules/mXX-<your-module-name>/`
- **Where to put global shared UI (like buttons):** `apps/web/src/components/`
- **How to route:** Build your views inside your dedicated module folder, then import the final compiled page component into `apps/web/src/app/` to expose it to the browser.
- ❌ **Do not** write heavy business logic directly inside `src/app/page.tsx`.

### ⚙️ Backend API Developers (Node.js / NestJS)
Your work happens inside `modules/mXX-<your-module-name>/`.
- **Where to put REST APIs:** `controllers/mXX.controller.ts`
- **Where to put Business Logic:** `services/mXX.service.ts`
- **Where to put Database Queries:** `repositories/mXX.repository.ts`
- **Where to put Background Jobs:** `workers/mXX.worker.ts`
- ❌ **Do not** write code inside `apps/api/` unless you are on the Platform Core team configuring the global gateway.

### 🤖 AI / ML Engineers (Python / FastAPI)
Your work happens inside `apps/ai-services/`.
- **Where to put your endpoints:** `apps/ai-services/app/routers/`
  - Create a dedicated file for your module (e.g., `m03_genai.py`).
- **Where to put global AI config:** `apps/ai-services/app/main.py` (Import your router here).

### 🗄️ Database Engineers (PostgreSQL / Prisma)
Your work happens inside `packages/database/`.
- **Where to add new Database Tables:** `packages/database/prisma/schema.prisma`
- ❌ **Do not** create rogue `.prisma` files inside your individual module folders. All tables must be declared in the centralized schema to ensure relational integrity.

---

## 3. Step-by-Step Example: Building a Feature for Team M4 (Deal Intelligence)

If Team M4 is tasked with building the **"Deals Board"** feature, here is exactly how they move through the codebase:

### Step 1: Database (Add the Tables)
- Open `packages/database/prisma/schema.prisma`
- Add the `model DealBoard { ... }` configuration.
- Run `pnpm db:generate` to generate the updated TypeScript client.

### Step 2: AI Inference (Score the Deal)
- Open `apps/ai-services/app/routers/m04_deals.py`
- Write a FastAPI endpoint `@router.post("/score")` that passes transcripts to the LLM.

### Step 3: Backend API (Serve the Data)
- Open `modules/m04-deal-intelligence/controllers/m04.controller.ts`
- Create a NestJS route `@Get('/boards')` that fetches the deals.
- Inside `services/m04.service.ts`, write the logic to combine DB data with the Python AI service data.

### Step 4: Frontend UI (Display the Board)
- Open `apps/web/src/modules/m04-deal-intelligence/`
- Create a React component: `DealBoardView.tsx`.
- Import `DealBoardView` into the Next.js router at `apps/web/src/app/deals/page.tsx`.

---

## 4. Golden Rules for the Boilerplate

1. **Isolation is King:** Never import a service directly from another module. If M1 needs to talk to M3, emit an event through the Event Bus.
2. **One Database Source:** All database schema changes go to `packages/database`.
3. **Run from the Root:** Use Turborepo commands at the root (e.g., `pnpm dev`) to start all services simultaneously.
