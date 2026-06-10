# Backend Integration & Architecture Migration Reference

> **Purpose:** This document serves as the canonical reference for migrating all frontend modules from a prototype BFF (Backend-for-Frontend) mock layer to the real Core NestJS Backend Engine. It is intended to be used as context by AI coding assistants, engineers, and automated tooling working across any module in this monorepo.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Architecture: Before vs After](#2-architecture-before-vs-after)
3. [Universal Migration Workflow](#3-universal-migration-workflow)
4. [File & Folder Conventions](#4-file--folder-conventions)
5. [Edge Cases & Gotchas](#5-edge-cases--gotchas)
6. [Full Request Trace — M08 Example](#6-full-request-trace--m08-example)
7. [Module-Specific Notes](#7-module-specific-notes)
8. [Rules for AI Assistants](#8-rules-for-ai-assistants)

---

## 1. Problem Statement

The application was originally built with a "Bridge" or "Mock" layer sitting between the Next.js frontend and the real NestJS backend. This allowed the UI to be developed quickly, but it means:

- The frontend talks to **fake controllers** in a `frontend-api/` folder, not real business logic.
- Data is sourced from **simplified mock Prisma models** (e.g., `EngageTask`) instead of real core tables (e.g., `Task`, `SalesPlay`).
- **Next.js proxy rewrites** in `next.config.ts` silently redirect frontend API calls to these mock controllers, hiding the indirection from developers.
- The real Core Backend (with its correct aggregations, relationships, and calculations) is **entirely bypassed**.

**The goal of this migration is to:**
- Remove all mock controllers and their services from `frontend-api/` folders.
- Remove all associated proxy rewrite rules from `unified-ui/next.config.ts`.
- Update frontend service files to call the real `/api/v1/…` endpoints directly.
- Upgrade the core backend schema and logic wherever data gaps exist.

---

## 2. Architecture: Before vs After

### 2.1 Before — The Prototype Facade

```
┌─────────────────────────────────────────────┐
│           Frontend (React / Next.js)         │
│                                             │
│  [UI Components]                            │
│       │                                     │
│       ▼ calls e.g. /api/tasks               │
│  [engage.service.ts]  ◄──── frontend svc    │
└──────────────┬──────────────────────────────┘
               │
               ▼  (intercepted by Next.js)
┌─────────────────────────────────────────────┐
│       Mock / BFF Layer  ⚠ BEING REMOVED     │
│                                             │
│  [next.config.ts]  →  rewrites /api/tasks   │
│       │                to localhost:3008     │
│       ▼                                     │
│  [M08FrontendEngageManagerController]       │
│       │   lives in frontend-api/ folder     │
│       ▼                                     │
│  [M08FrontendEngageManagerService]          │
│       │   queries EngageTask (fake model)   │
└──────────────┬──────────────────────────────┘
               │
               ✗  Core backend NOT reached
               │
┌─────────────────────────────────────────────┐
│         Core Backend  (disconnected)         │
│  [m08.controller.ts]                        │
│  [Real Business Logic & Aggregations]       │
│  [DB: Task, SalesPlay tables]               │
└─────────────────────────────────────────────┘
```

### 2.2 After — The Integrated Production Engine

```
┌─────────────────────────────────────────────┐
│           Frontend (React / Next.js)         │
│                                             │
│  [UI Components]                            │
│       │                                     │
│       ▼ calls /api/v1/sales-engagement/…    │
│  [engage.service.ts]                        │
└──────────────┬──────────────────────────────┘
               │
               │  Direct HTTP — no proxy, no mock
               │
               ▼
┌─────────────────────────────────────────────┐
│             Core NestJS Backend              │
│                                             │
│  [/api/v1/sales-engagement controller]      │
│       │                                     │
│       ▼                                     │
│  [Real Business Logic & Aggregations]       │
│       │                                     │
│       ▼                                     │
│  [DB: Task, SalesPlay — real tables]        │
└─────────────────────────────────────────────┘
```

**Key change:** The Next.js proxy and mock controller are eliminated entirely. The frontend service calls `resolveApiBase() + '/api/v1/[module]'` directly.

---

## 3. Universal Migration Workflow

> ⚠️ Always follow this workflow in order. It is **Backend-First** — never rewire the frontend before the core backend is ready.

### Step 1 — Identify the Data Gap

Before writing any code:
- List every field the React UI reads from the API response (check the frontend service file and the components that consume it).
- Cross-reference with what the real Core Controller/Service currently returns.
- Document the delta — fields that exist in the mock but are missing from the core (e.g., `adoptionScore`, `meddpiccScore`, `conversionRate`).

### Step 2 — Upgrade the Core Backend

Address the data gap entirely within the core engine. Do **not** patch it in the frontend or in a new proxy.

#### 2a. Database — Update `schema.prisma`
If new fields are needed, add them to the appropriate core model:

```prisma
// Example: adding a field to the core M04 Deal model
model M04Deal {
  id             String   @id @default(cuid())
  title          String
  value          Float
  meddpiccScore  Int?     // ← new field added to core, not a fake table
  createdAt      DateTime @default(now())
}
```

After editing, run:
```bash
npx prisma migrate dev --name add_meddpicc_score
npx prisma generate
```

#### 2b. Logic — Update Core Service & Repositories
Replace any hardcoded or missing aggregation with real SQL/Prisma logic:

```typescript
// modules/m04-deal-intelligence/core/services/deals.service.ts
async getDealsWithScores(userId: string) {
  return this.prisma.m04Deal.findMany({
    where: { assignedTo: userId },
    include: { activities: true },
    // Run real aggregation instead of returning a hardcoded value
  });
}
```

#### 2c. Mappers — Transform Core Models for the Frontend
If the database model shape differs from what the frontend components expect, add a mapping function inside the core service. **Do not put mapping logic in the frontend.**

```typescript
// Inside the core service
private mapDealToFrontendShape(deal: M04Deal & { activities: Activity[] }) {
  return {
    id: deal.id,
    title: deal.title,
    meddpiccScore: deal.meddpiccScore ?? 0,
    activityCount: deal.activities.length,
    // ...other fields the UI needs
  };
}
```

### Step 3 — Standardize the Core Controller

Ensure the Core Controller exposes endpoints under the `/api/v1/[module-name]` convention:

```typescript
// modules/m08-sales-engagement/core/m08.controller.ts
@Controller('api/v1/sales-engagement')
export class M08Controller {

  @Get('tasks')
  getTasks(@Query('assigneeId') assigneeId: string) {
    return this.m08Service.getTasks(assigneeId);
  }

  @Get('summary')
  getSummary(@Query('managerId') managerId: string) {
    return this.m08Service.getManagerSummary(managerId);
  }
}
```

### Step 4 — Rewire the Frontend & Remove Proxies

Only do this after Steps 1–3 are complete and tested.

#### 4a. Update the Frontend Service File

```typescript
// unified-ui/src/features/engage/components/manager/services/engage.service.ts

// BEFORE (pointing to mock via relative path)
const endpoint = `/api/tasks?assigneeId=me`;

// AFTER (pointing to real core API)
const endpoint = `${resolveApiBase()}/api/v1/sales-engagement/tasks?assigneeId=me`;
```

#### 4b. Remove the Proxy Rewrite from `next.config.ts`

```typescript
// unified-ui/next.config.ts
async rewrites() {
  return [
    // ❌ DELETE THIS BLOCK when migrating M08:
    // {
    //   source: '/api/tasks/:path*',
    //   destination: 'http://localhost:3008/api/tasks/:path*',
    // },

    // ✅ Leave rewrites for other unmigrated modules untouched
    {
      source: '/api/deals/:path*',
      destination: 'http://localhost:3004/api/deals/:path*',
    },
  ];
}
```

#### 4c. Delete the Mock Controller and Service

```bash
# Safe to delete after frontend is rewired and tested
rm modules/m08-sales-engagement/frontend-api/manager/m08-frontend-engage-manager.controller.ts
rm modules/m08-sales-engagement/frontend-api/manager/m08-frontend-engage-manager.service.ts

# Also remove the mock module registration if it exists
# Check: modules/m08-sales-engagement/m08.module.ts
# Remove M08FrontendEngageManagerController from the controllers array
```

---

## 4. File & Folder Conventions

### 4.1 Monorepo Structure (Relevant Paths)

```
monorepo/
├── unified-ui/                          # Next.js frontend
│   ├── next.config.ts                   # ← Proxy rewrites live here
│   └── src/
│       └── features/
│           ├── engage/                  # M08 frontend feature
│           │   └── components/
│           │       ├── manager/
│           │       │   └── services/
│           │       │       └── engage.service.ts   # ← Rewire this
│           │       └── rep/
│           │           └── services/
│           │               └── engage.service.ts   # ← And this
│           ├── deals/                   # M04 frontend feature
│           │   └── services/
│           │       └── dealBoardsService.ts
│           └── call-reviews/            # M02 frontend feature
│               └── services/
│                   └── call-reviews.service.ts
│
└── modules/
    ├── m02-conversation-intelligence/
    │   ├── core/                        # ✅ Real backend logic lives here
    │   └── frontend-api/                # ❌ Mock layer — delete after migration
    ├── m04-deal-intelligence/
    │   ├── core/
    │   └── frontend-api/
    └── m08-sales-engagement/
        ├── core/
        │   ├── m08.controller.ts        # ✅ Real controller
        │   └── m08.service.ts           # ✅ Real service
        └── frontend-api/               # ❌ Delete entire folder after migration
            ├── manager/
            │   ├── m08-frontend-engage-manager.controller.ts
            │   └── m08-frontend-engage-manager.service.ts
            └── rep/
                ├── m08-frontend-engage-rep.controller.ts
                └── m08-frontend-engage-rep.service.ts
```

### 4.2 Frontend Service Naming — Known Variations

| Module | Frontend Service File | Old API Path |
|--------|-----------------------|--------------|
| M02 | `call-reviews.service.ts` | `/api/call-reviews/…` |
| M04 | `dealBoardsService.ts` | `/api/deals/…` |
| M08 | `engage.service.ts` | `/api/tasks/…` |
| M09 | TBD — search for `/api/coaching` | `/api/coaching/…` |

> **Tip for AI tools:** To find the correct frontend service file for any module, search the entire `unified-ui/src/features/` directory for the old `/api/` route string (e.g., grep for `'/api/tasks'`). Do not assume the filename.

### 4.3 Core API URL Convention

All migrated endpoints must follow this pattern:

```
/api/v1/{module-slug}/{resource}

Examples:
  /api/v1/sales-engagement/tasks
  /api/v1/sales-engagement/summary
  /api/v1/deal-intelligence/boards
  /api/v1/conversation-intelligence/call-reviews
```

Use `resolveApiBase()` in the frontend to get the correct base URL per environment:

```typescript
import { resolveApiBase } from '@/lib/api';

const url = `${resolveApiBase()}/api/v1/sales-engagement/tasks`;
```

---

## 5. Edge Cases & Gotchas

### Edge Case A — Proxy Rewrite Scope Collisions

**Problem:** Some proxy rules in `next.config.ts` use broad wildcard paths (e.g., `/api/deals/:path*`) that could accidentally intercept routes intended for other modules or the real core backend.

**Rule:** When removing a proxy rule, check whether any *other* frontend service or component is also calling a path that matches that rewrite pattern. Use a full-text search before deleting.

```bash
# Check for all usages of the old path before removing the proxy rule
grep -r "/api/tasks" unified-ui/src/
```

---

### Edge Case B — Frontend Service File Naming is Inconsistent

**Problem:** There is no enforced naming convention for frontend service files. The correct file to rewire varies per module.

**Rule:** Always locate the file by searching for the route string, not by guessing the filename.

```bash
grep -r "'/api/tasks" unified-ui/src/features/
grep -r '"/api/tasks' unified-ui/src/features/
```

---

### Edge Case C — Rep vs. Manager Persona Bifurcation

**Problem:** Many modules maintain completely separate service files and components for the Sales Rep view and the Sales Manager view. Rewiring only one will leave the other still pointing at the mock.

**Rule:** For every module you migrate, explicitly check whether both a `manager/` and a `rep/` (or equivalent) subdirectory exist under `features/[module]/components/`. If both exist, both service files **must** be updated.

```
features/engage/components/
  ├── manager/services/engage.service.ts   ← rewire
  └── rep/services/engage.service.ts       ← also rewire
```

---

### Edge Case D — "Fake" Table vs. "Missing" Table

**Problem:** The mock layer sometimes queries a Prisma model that was purpose-built for the BFF layer (e.g., `EngageTask`). This model may actually exist in `schema.prisma` with real data in it — it is not just an in-memory mock.

**Rule:**
1. Before deleting any Prisma model, check if it contains production data that doesn't exist anywhere else.
2. Determine whether the real core tables (`Task`, `SalesPlay`, etc.) can fully satisfy the same data requirements.
3. If yes: migrate the logic to the core tables and then deprecate the fake model.
4. If no: the fake model must be formally integrated into the core engine (added to a core module with its own controller and service) before removal.

**Never** blindly delete a Prisma model just because it was used by the mock layer.

---

### Edge Case E — Module Registration Cleanup

**Problem:** After deleting a mock controller file, the NestJS module that registered it will fail to compile.

**Rule:** After deleting mock controller/service files, always check the module's `*.module.ts` file and remove the deleted classes from the `controllers` and `providers` arrays.

```typescript
// modules/m08-sales-engagement/m08.module.ts
@Module({
  controllers: [
    M08Controller,
    // ❌ Remove this line after deleting the file:
    // M08FrontendEngageManagerController,
  ],
  providers: [
    M08Service,
    // ❌ Remove this line after deleting the file:
    // M08FrontendEngageManagerService,
  ],
})
export class M08Module {}
```

---

## 6. Full Request Trace — M08 Example

This is a precise, step-by-step trace of how a single API request flows through the **old** mock architecture. Use this as a reference to understand exactly what you are dismantling when you migrate a module.

### Request: Fetch manager task list

---

**Step 1 — React UI calls its service**

File: `unified-ui/src/features/engage/components/manager/services/engage.service.ts`

```typescript
// The component calls this function to load tasks
export async function fetchManagerTasks(assigneeId: string) {
  const endpoint = `/api/tasks?assigneeId=${assigneeId}`;
  const res = await apiFetch('GET', endpoint);
  return res.json();
}
```

The request goes to `/api/tasks` — a relative path, so it hits the Next.js server itself.

---

**Step 2 — Next.js proxy rewrites the URL**

File: `unified-ui/next.config.ts`

```typescript
async rewrites() {
  return [
    {
      source: '/api/tasks/:path*',
      // The frontend never knows this redirect is happening
      destination: 'http://localhost:3008/api/tasks/:path*',
    },
  ];
}
```

The request is silently forwarded to port `3008` where the M08 NestJS microservice is running.

---

**Step 3 — Mock Controller handles the request**

File: `modules/m08-sales-engagement/frontend-api/manager/m08-frontend-engage-manager.controller.ts`

```typescript
@Controller()
export class M08FrontendEngageManagerController {

  constructor(private readonly svc: M08FrontendEngageManagerService) {}

  @Get('api/tasks')
  async getTasks(@Query('assigneeId') assigneeId: string) {
    // Delegates to the mock service — real core logic is never called
    return this.svc.fetchTasks(assigneeId);
  }
}
```

Note: this controller lives inside `frontend-api/` — a folder that exists solely for this BFF pattern.

---

**Step 4 — Mock Service queries the fake Prisma model**

File: `modules/m08-sales-engagement/frontend-api/manager/m08-frontend-engage-manager.service.ts`

```typescript
@Injectable()
export class M08FrontendEngageManagerService {

  constructor(private readonly prisma: PrismaService) {}

  async fetchTasks(assigneeId: string) {
    // ❌ Queries 'engageTask' — a simplified model built for the UI mock
    // ❌ The real 'task' and 'salesPlay' tables are completely ignored
    return this.prisma.engageTask.findMany({
      where: { assigneeId },
      orderBy: { dueDate: 'asc' },
    });
  }
}
```

---

**After Migration — What the same flow looks like**

File: `unified-ui/src/features/engage/components/manager/services/engage.service.ts`

```typescript
export async function fetchManagerTasks(assigneeId: string) {
  // ✅ Calls the real core API directly
  const endpoint = `${resolveApiBase()}/api/v1/sales-engagement/tasks?assigneeId=${assigneeId}`;
  const res = await apiFetch('GET', endpoint);
  return res.json();
}
```

File: `modules/m08-sales-engagement/core/m08.controller.ts`

```typescript
@Controller('api/v1/sales-engagement')
export class M08Controller {

  @Get('tasks')
  async getTasks(@Query('assigneeId') assigneeId: string) {
    // ✅ Calls real service with real aggregation logic
    return this.m08Service.getTasksForAssignee(assigneeId);
  }
}
```

---

## 7. Module-Specific Notes

| Module | Mock Controller Location | Real Controller | Status |
|--------|--------------------------|-----------------|--------|
| M02 — Conversation Intelligence | `frontend-api/call-reviews/` | `core/m02.controller.ts` | Pending |
| M04 — Deal Intelligence | `frontend-api/deals/` | `core/deals.controller.ts` | Pending |
| M08 — Sales Engagement | `frontend-api/manager/`, `frontend-api/rep/` | `core/m08.controller.ts` | Pending |
| M09 — Coaching | TBD | TBD | Not started |

---

## 8. Rules for AI Assistants

> This section exists to give AI coding tools clear, unambiguous constraints when working in this codebase.

1. **Never add new logic to a `frontend-api/` folder.** If you need to add or fix backend logic, it goes in the `core/` folder of the relevant module.

2. **Never add new proxy rewrites to `next.config.ts`.** If a frontend service needs to reach a new endpoint, the core backend must expose it under `/api/v1/…` and the frontend must call it directly.

3. **Never create new Prisma models just for frontend convenience.** If the UI needs a field that doesn't exist, add it to the appropriate core model and compute it with real logic.

4. **When rewiring a frontend service, always check for both `manager/` and `rep/` variants.** Updating one without the other is an incomplete migration.

5. **When deleting a mock controller, always update the corresponding `*.module.ts`** to remove the class from `controllers` and `providers`.

6. **Endpoint convention is non-negotiable:** all core API routes must be `/api/v1/{module-slug}/{resource}`.

7. **Use `resolveApiBase()`** for all frontend API calls — never hardcode `localhost` or port numbers in the frontend code.

8. **Do not delete a Prisma model without first confirming** that the core tables can absorb all data requirements and that no other module depends on the model.
