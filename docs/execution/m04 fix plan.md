# M04 (Deal Intelligence) Backend Audit and Fix Plan

This document details a comprehensive backend audit of the M04 (Deal Intelligence) module, identifying key architectural, database, routing, and security issues. It outlines root causes and provides a detailed plan to standardize and fix the backend.

---

## 1. Executive Summary

During the backend audit of the `m04-deal-intelligence` module, we identified a split architecture. The module was originally developed as a standalone feature using an in-memory mock store and TypeORM-style local repository patterns, but was later partially migrated into the unified monorepo. 

Consequently, the codebase currently runs two completely separate database and controller layers:
1. **Mock In-Memory Store (`M04MemoryStore`):** Used by the majority of core services and controllers (e.g., `DealBoardController`, `DealController`, `AIScoreService`) to store and update states.
2. **PostgreSQL Database (`PrismaService`):** Used by a separate set of "Deal Drivers" and replication controllers (e.g., `DealsController`, `DealBoardsRepController`) that query the shared database's `revenuegraph` schema.

This dual-architecture structure causes sync failures, duplicate routes, cache-loss bugs on server restart, and database integrity failures.

---

## 2. Key Issues & Root Causes

### Issue 1: Diverged Database Architectures (In-Memory Fallback vs. PostgreSQL/Prisma) [RESOLVED - Phase 2]
* **Root Cause:** The core controllers and services in M04 inject `M04EntityRepository` (a custom mock wrapper) which writes directly to an in-memory map store (`M04MemoryStore`). Conversely, the `DealsController` (which handles the main `/api/v1/deal-management` prefix) directly queries the PostgreSQL DB using `PrismaService`.
* **Impact:** 
  * Any boards created or updated via `DealBoardController` (`POST /boards`) only exist in the volatile memory of the Node process. 
  * Any boards fetched or queries executed via the main application frontend paths (which route to `DealsController` at `/api/v1/deal-management/boards`) query Postgres. This results in the database and frontend views being completely out-of-sync.
* **Remediation:** Port all services (`DealBoardService`, `DealService`, etc.) to use the global database using `PrismaService` or a standardized database repository, and completely deprecate the `M04MemoryStore`.

---

### Issue 2: Hardcoded Mock Boards & In-Memory State Loss [RESOLVED - Phase 2 & 3]
* **Root Cause:** 
  * The `DealsController` contains a hardcoded list of boards (with IDs `board-1` through `board-4`) returned from the private helper `getBoardsFromDb`.
  * The `AIScoreService` caches score history in an in-memory javascript `Map` (`scoreHistory`).
* **Impact:**
  * Users cannot view dynamically created deal boards via the main deal-management endpoints; they only see the four hardcoded boards.
  * All generated AI score histories, target trackers, and session states are lost every time the server restarts or hot-reloads.
* **Remediation:** Create a `DealBoard` schema mapping in the central Postgres database (already outlined in M04's local schema but not migrated or integrated) and query the database table dynamically instead of hardcoding lists or using maps.

---

### Issue 3: Duplicate Controllers and Route Mappings [RESOLVED - Phase 3]
* **Root Cause:** There are multiple controllers handling overlapping routes. Specifically:
  * `DealBoardController` `@Controller('boards')` vs. `DealBoardsRepController` `@Controller('api/v1/deal-management/deal-boards')` vs. `DealsController` `@Controller('api/v1/deal-management')` (which also defines `boards` routes).
  * `DealController` `@Controller('deals')` vs. `DealsController` `@Controller('api/v1/deal-management')` (which also defines deal query and update routes).
  * There are also 12 completely empty stub controllers (e.g., `activities.controller.ts`, `boards.controller.ts`, `escalations.controller.ts`, etc.) registered in `m04-deal-intelligence.module.ts`.
* **Impact:**
  * Massive routing pollution. Routes like `/api/v1/deal-management/boards/:boardId` and `/api/v1/deal-management/deal-boards/:boardId` perform separate, slightly different calculations on different stores.
  * Increased maintenance overhead and confusion regarding which endpoint is canonical for the frontend.
* **Remediation:** Consolidate routes under a single prefix `/api/v1/deal-management` (or `/api/v1/deal-intelligence`). Deprecate the duplicate controllers and delete the 12 unused stub controllers.

---

### Issue 4: Local vs. Global Guards & Role Mismatches [RESOLVED - Phase 4]
* **Root Cause:** 
  * M04 controllers still apply local guards like `@UseGuards(AuthGuard, RolesGuard)` from `modules/m04-deal-intelligence/guards`. 
  * Concurrently, the unified API bootstrap (`main.ts`) registers the global `JwtAuthGuard` and `PermissionsGuard` from `platform-core`.
  * The M04 local role mapping uses the role `USER` to denote a sales rep, whereas the global database enum role is `SALES_REP` (which `SessionUserMiddleware` manually attempts to patch).
* **Impact:**
  * Redundant guards execute on every request, adding processing overhead.
  * Inconsistencies in role definitions (`USER` vs. `SALES_REP`) can lead to unintended authorization denials (`403 Forbidden`) if standard token properties are not correctly processed by the local guards.
* **Remediation:** Remove local guards from M04 controllers. Align M04 controllers to use the global `JwtAuthGuard`, `TenantGuard`, and standard roles (`SALES_REP`, `MANAGER`, `ADMIN`).

---

### Issue 5: Schema Namespace Mismatches in Raw SQL Migrations [RESOLVED - Phase 1]
* **Root Cause:** 
  * The SQL migration script `007_deal_drivers.sql` references base tables without schema namespaces: e.g., `REFERENCES deals(id)` and `REFERENCES users(id)`.
  * In the shared database schema, the `Deal` table belongs to the `revenuegraph` schema, and the `User` table belongs to the `public` schema.
* **Impact:**
  * When executing this migration in a multi-schema PostgreSQL database, PostgreSQL fails with `relation "deals" does not exist` because it defaults to searching the `public` schema search path, where no `deals` table is defined.
* **Remediation:** Update all local migrations to prefix tables with their correct schema names: e.g., `revenuegraph.deals` and `public.users`. Better yet, merge all M04 specific models into the main `packages/database/prisma/schema.prisma` file to let Prisma manage the schemas and database generation cleanly.

---

### Issue 6: Path Aliasing Conflict in Monorepo [RESOLVED - Phase 5]
* **Root Cause:** 
  * `modules/m04-deal-intelligence/tsconfig.json` defines path mapping `@/*` pointing to `./*`.
  * `apps/unified-api/tsconfig.json` hardcodes `@/*` pointing to `../../modules/m04-deal-intelligence/*`.
* **Impact:**
  * This configuration prevents any other module in the monorepo from using the standard `@/*` alias for their own internal paths.
* **Remediation:** Change the path alias in M04 to a scoped alias like `@m04/*` to prevent namespace pollution and avoid breaking path resolutions in other monorepo packages.

---

### Issue 7: Event Pattern Violation of ADR-005 (UI Stage-Change Request Pattern) [DEFERRED]
* **Root Cause:** 
  * Under **ADR-005** (defined in `complete_codebase_knowledge_base.md`), the M04 module is strictly prohibited from writing directly to the CRM or publishing the public platform event `deal.stage.changed` upon user drag-and-drop.
  * Currently, the backend implementation in `M04DealIntelligenceService.create` (`m04.service.ts`) directly publishes `deal.stage.changed` to the event bus.
* **Impact:**
  * This bypasses the unified CRM synchronization and compliance pathway managed by M10 (Data & Compliance / Revenue Graph), which can lead to out-of-sync states between the CRM and the platform database.
* **Remediation:** Refactor the service to save stage-changes optimistically to the local database, and publish the internal event `deal.stage.update.requested` instead of `deal.stage.changed`. Allow M10 to listen to `deal.stage.update.requested`, perform the outbound sync to HubSpot/CRM, and broadcast the public `deal.stage.changed` event. M04 must consume `deal.stage.changed` to refresh position states on the Deals Board.

---

### Issue 8: Database Schema Namespace Mismatch (Logical vs. Physical) [DEFERRED]
* **Root Cause:**
  * The `Module boundary document.md` and `Database Schema.md` define that M4/M5 (Deal & Account Management) owns database schema objects under the `m07` or `dealmanagement` schema namespace.
  * In the actual codebase (`schema.prisma`), all M4 tables (`Deal`, `Account`, `DealWarning`, `DealPlaybook`, `M04DealDriver`, `DealComment`, `DealTask`, `DealActivityEvent`, `DealNotification`) are physically mapped to the `revenuegraph` schema.
* **Impact:**
  * Mismatch between the architectural specification and the physical database namespace setup. This increases extraction complexity.
* **Remediation:** Document the physical mapping to the `revenuegraph` schema as a current state constraint. Flag these tables to be migrated to the `dealmanagement` schema namespace in a future database migration when the module extraction trigger is met.

---

### Issue 9: Route Collisions and Unused Duplicate Controllers [RESOLVED - Phase 3]
* **Root Cause:**
  * The codebase defines duplicate controllers targeting the same logical endpoints: `DealsController` (handling `/api/v1/deal-management`) and `DealBoardsRepController` (handling `/api/v1/deal-management/deal-boards`) both handle deal board retrieval.
  * In the frontend (`dealBoardsService.ts`), all fetch requests are directed to `BASE_URL = '/api/v1/deal-management'` and expect subpaths like `/boards`, `/boards/:boardId`, and `/boards/:boardId/deals`.
  * The `NotificationsApiController` (handling `/api/v1/deal-management/notifications`) overlaps and collides with notification endpoints defined in `DealsController`.
* **Impact:**
  * Duplicate routing and logic causing route collisions and code pollution. Unused controllers like `DealBoardsRepController` and `NotificationsApiController` add code maintenance overhead.
* **Remediation:** Completely delete `DealBoardsRepController` and `NotificationsApiController`. Align all active routes within `DealsController` to match the exact `/api/v1/deal-management` paths requested by the frontend.

---

## 3. Specific Endpoint Diagnosis: `/api/v1/deal-management/boards/:boardId`

The user reported that the endpoint `/api/v1/deal-management/boards/:boardId` is not fetching the deal board from the requested ID correctly. 

### Code Analysis:
Looking at `DealsController.getBoardDetail` in [deals.controller.ts](file:///C:/Users/Relanto/Desktop/RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts#L82-L137):

```typescript
@Get('boards/:boardId')
async getBoardDetail(
  @Param('boardId') boardId: string,
  @Req() req: any,
  @Query('owner') owner?: string,
): Promise<ApiResponse<any>> {
  try {
    const boards = await this.getBoardsFromDb(req.tenantId);
    const board = boards.find((b) => b.boardId === boardId);
    if (!board) throw new Error('Board not found');

    const userRole = req.userRole || 'SALES_REP';
    const userId = req.userId;

    const whereClause: any = { tenantid: req.tenantid, pipeline: boardId };
    ...
```

### Analysis of the Bug:
1. **Invalid Board ID Lookup:** The helper `getBoardsFromDb` returns a hardcoded list of boards with IDs: `board-1`, `board-2`, `board-3`, `board-4`. If the frontend requests a board using a database UUID (such as the one created in `DealBoardController` or a synced board), it will not be found in the hardcoded list, throwing a `"Board not found"` error.
2. **Prisma Query Field Mismatch:** In the database, the `pipeline` field of the `Deal` table might be null or default to `'default'`. But the controller queries:
   `whereClause: any = { tenantid: req.tenantid, pipeline: boardId }`
   If `boardId` is a UUID, but the deals in PostgreSQL have `pipeline = 'default'` (or no matching pipeline value), the query returns zero deals.
3. **Parameter Type Inconsistencies:** The frontend might be passing a deal ID as the parameter instead of a board ID due to incorrect route structures, or the controller's route ordering in NestJS might be routing a deal lookup (`GET /api/v1/deal-management/:dealId`) to the board endpoint or vice versa.

---

## 3.1 Frontend-Backend Routing Mapping & Manager Endpoints Audit

To ensure the backend works seamlessly with the active frontend (`deal-boards` feature, specifically `dealBoardsService.ts` and the manager's `deal.service.ts`), the backend must support the `/api/deals` and `/api/manager` routes requested by the UI. 

Below is the audit of the required frontend endpoints, their current status in the M04 NestJS codebase, and how they will be resolved:

### 📊 Dashboard & Summary
1. **`GET /api/deals/all`**
   * *Status:* **Partially Present** (Registered as `GET /all` under `@Controller('api/v1/deal-management')` in `DealsController`).
   * *Fix:* Re-route to `@Get('all')` under `@Controller('api/deals')`.
2. **`GET /api/deals/pipeline-summary`**
   * *Status:* **Partially Present** (Registered as `GET /pipeline-summary` under `@Controller('api/v1/deal-management')` in `DealsController`).
   * *Fix:* Re-route to `@Get('pipeline-summary')` under `@Controller('api/deals')`.

### 🔍 Deal Details
3. **`GET /api/deals/:dealId/brief`**
   * *Status:* **Partially Present** (Registered as `GET /:dealId/brief` under `DealsController`).
   * *Fix:* Re-route to `@Get(':dealId/brief')` under `@Controller('api/deals')`.
4. **`GET /api/deals/:dealId/warnings`**
   * *Status:* **Partially Present** (Registered as `GET /:dealId/warnings` under `DealsController`).
   * *Fix:* Re-route to `@Get(':dealId/warnings')` under `@Controller('api/deals')`.
5. **`GET /api/deals/:dealId/playbook`**
   * *Status:* **Partially Present** (Registered as `GET /:dealId/playbook` under `DealsController`).
   * *Fix:* Re-route to `@Get(':dealId/playbook')` under `@Controller('api/deals')`.
6. **`GET /api/deals/:dealId/activity`**
   * *Status:* **Partially Present** (Registered as `GET /:dealId/activity` under `DealsController`).
   * *Fix:* Re-route to `@Get(':dealId/activity')` under `@Controller('api/deals')`.
7. **`GET /api/deals/:dealId/crm-fields`**
   * *Status:* **Partially Present** (Registered as `GET /:dealId/crm-fields` under `DealsController`).
   * *Fix:* Re-route to `@Get(':dealId/crm-fields')` under `@Controller('api/deals')`.

### ✏️ Deal Updates
8. **`PATCH /api/deals/:dealId`**
   * *Status:* **Partially Present** (Registered as `PATCH /:dealId` under `DealsController`).
   * *Fix:* Re-route to `@Patch(':dealId')` under `@Controller('api/deals')`.

### 📋 MEDDIC Playbook
9. **`PATCH /api/deals/:dealId/playbook/criteria/:criterionId`**
   * *Status:* **Partially Present** (Registered as `PATCH /:dealId/playbook/criteria/:criterionId` under `DealsController`).
   * *Fix:* Re-route to `@Patch(':dealId/playbook/criteria/:criterionId')` under `@Controller('api/deals')`.
10. **`PATCH /api/manager/deals/:dealId/playbook/next-steps/:stepId`**
    * *Status:* ❌ **MISSING**.
    * *Fix:* Add a handler in the new `ManagerController` (`@Controller('api/manager')`) to update manager-defined next steps in the database.

### 💬 Comments
11. **`POST /api/deals/:dealId/comments`**
    * *Status:* **Partially Present** (Registered as `POST /:dealId/comments` under `DealsController`).
    * *Fix:* Re-route to `@Post(':dealId/comments')` under `@Controller('api/deals')`.

### 📅 Tasks
12. **`POST /api/deals/tasks`**
    * *Status:* **Partially Present** (Registered as `POST /tasks` under `DealsController` which resolves to `/api/v1/deal-management/tasks`).
    * *Fix:* Re-route to `@Post('tasks')` under `@Controller('api/deals')`.
13. **`GET /api/deals/:dealId/tasks`**
    * *Status:* ❌ **MISSING**.
    * *Fix:* Add handler `@Get(':dealId/tasks')` under `@Controller('api/deals')` to fetch tasks scoped to a single deal.
14. **`GET /api/manager/tasks`**
    * *Status:* ❌ **MISSING**.
    * *Fix:* Add handler `@Get('tasks')` under `@Controller('api/manager')` to retrieve all tasks assigned across active rep deals for the manager.

### 🚨 Escalation
15. **`POST /api/deals/:dealId/escalation`**
    * *Status:* **Partially Present** (Registered as `POST /:dealId/escalation` under `DealsController`).
    * *Fix:* Re-route to `@Post(':dealId/escalation')` under `@Controller('api/deals')`.
16. **`DELETE /api/deals/:dealId/escalation`**
    * *Status:* **Partially Present** (Registered as `DELETE /:dealId/escalation` under `DealsController`).
    * *Fix:* Re-route to `@Delete(':dealId/escalation')` under `@Controller('api/deals')`.

### ⚠️ AI Warning Management
17. **`PATCH /api/deals/:dealId/warnings/:warningId`**
    * *Status:* **Partially Present** (Registered as `PATCH /:dealId/warnings/:warningId` under `DealsController`).
    * *Fix:* Re-route to `@Patch(':dealId/warnings/:warningId')` under `@Controller('api/deals')`.
18. **`POST /api/deals/:dealId/warnings/:warningId/action`**
    * *Status:* **Partially Present** (Registered as `POST /:dealId/warnings/:warningId/action` under `DealsController`).
    * *Fix:* Re-route to `@Post(':dealId/warnings/:warningId/action')` under `@Controller('api/deals')`.

### 🔔 Notifications
19. **`GET /api/deals/notifications`**
    * *Status:* **Partially Present** (Registered as `GET /notifications` under `DealsController`).
    * *Fix:* Re-route to `@Get('notifications')` under `@Controller('api/deals')`.
20. **`POST /api/deals/notifications`**
    * *Status:* **Partially Present** (Registered as `POST /notifications` under `DealsController`).
    * *Fix:* Re-route to `@Post('notifications')` under `@Controller('api/deals')`.
21. **`PATCH /api/deals/notifications/read-all`**
    * *Status:* **Partially Present** (Registered as `PATCH /notifications/read-all` under `DealsController`).
    * *Fix:* Re-route to `@Patch('notifications/read-all')` under `@Controller('api/deals')`.

### 🛠️ Manager Utilities
22. **`GET /api/manager/team-members`**
    * *Status:* ❌ **MISSING**.
    * *Fix:* Add handler `@Get('team-members')` under `@Controller('api/manager')` querying the database for direct report users/reps.
23. **`GET /api/manager/deal-stages`**
    * *Status:* ❌ **MISSING**.
    * *Fix:* Add handler `@Get('deal-stages')` under `@Controller('api/manager')` returning the standard pipeline stages list.
24. **`GET /api/manager/deals/export`**
    * *Status:* ❌ **MISSING**.
    * *Fix:* Add handler `@Get('deals/export')` under `@Controller('api/manager')` returning the raw deals database snapshot (complements the frontend's offline CSV generator).

### ⚙️ Setup & Options
25. **`GET /api/deals/stage-options`**
    * *Status:* **Partially Present** (Registered as `GET /stage-options` under `DealsController`).
    * *Fix:* Re-route to `@Get('stage-options')` under `@Controller('api/deals')`.

---

## 4. Proposed Phase-by-Phase Fix Plan

### Phase 1: Database Schema Integration (Prisma) [COMPLETED]
1. **[COMPLETED]** Port all relevant local models from `modules/m04-deal-intelligence/prisma/schema.prisma` into the global `packages/database/prisma/schema.prisma`.
   * *Status:* Ported the remaining models: `M04UserPreference`, `M04SyncLog`, `M04DealSummary`, `M04AnalyticsSnapshot`, and `M04Session`.
2. **[COMPLETED]** Map these models to the `revenuegraph` schema namespace to align with the physical database structure (with an architectural note that these should eventually migrate to the logical `dealmanagement` schema namespace during modular service extraction).
   * *Status:* Mapped all models to the `revenuegraph` schema namespace in the global `schema.prisma`.
3. **[COMPLETED]** Ensure every table includes a `tenantid UUID NOT NULL` column and an index on `(tenantid, primary_lookup_column)` to satisfy multi-tenancy requirements.
   * *Status:* Ensured that all models have `tenantid String @db.Uuid` and composite indexes such as `@@index([tenantid, <primary_lookup_column>])` for tenant separation.
4. **[COMPLETED]** Run `pnpm db:generate` and `pnpm db:push` to generate the updated Prisma Client.
   * *Status:* Successfully generated updated Prisma Client and synced the database schema using `pnpm db:generate` and `pnpm db:push` with active local database connection. Verified clean TypeScript build on `unified-api`.

### Phase 2: Deprecate In-Memory Fallbacks [COMPLETED]
1. **[COMPLETED]** Refactor M04 services and repositories to inject `PrismaService` instead of the local custom `M04EntityRepository` or `M04MemoryStore`.
   * *Status:* Created a generic `M04PrismaRepository` adapter class in [m04-prisma.repository.ts](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/modules/m04-deal-intelligence/database/m04-prisma.repository.ts) that mirrors the TypeORM `Repository` interface but routes queries to `PrismaService`. Refactored `M04DatabaseModule` providers to inject `PrismaService` and instantiate this Prisma-backed adapter.
2. **[COMPLETED]** Rewrite repository methods to perform standard Prisma queries against the PostgreSQL database.
   * *Status:* Reimplemented all CRUD, relation fetching, and query building operations in `M04PrismaRepository` and `M04PrismaQueryBuilder` to query Postgres using Prisma client accessors. Custom properties like `tenantId` (camelCase) are mapped to `tenantid` (lowercase UUID) for multi-tenancy.
3. **[COMPLETED]** Delete `m04-memory.store.ts` and `m04-entity.repository.ts`.
   * *Status:* Updated all 18 service and repository imports to target the new `m04-prisma.repository` and deleted the deprecated `m04-memory.store.ts` and `m04-entity.repository.ts` files. Verified clean compilation and successful NestJS bootstrap connecting to live Postgres.

### Phase 3: Route Consolidation & Controller Cleanup
1. **[COMPLETED]** Delete the 12 stub controllers in `modules/m04-deal-intelligence/controllers`.
   * *Status:* Deleted 13 unused stub controller files and 26 unused stub NestJS modules & services from `modules/m04-deal-intelligence` to clean up dead code.
2. **[COMPLETED]** Delete `DealBoardsRepController` and `NotificationsApiController` to resolve routing overlaps and collisions.
   * *Status:* Removed overlapping controllers from the codebase.
3. **[COMPLETED]** Register the consolidated deal controllers under `@Controller('api/deals')` (for deal details, updates, comments, and options) and `@Controller('api/deal-boards')` (for board metadata and deal lists per board) to match frontend routing exactly.
   * *Status:* Created new [deal-boards.controller.ts](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-boards.controller.ts) under `api/deal-boards`, refactored [deals.controller.ts](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts) under `api/deals`, and registered both in [m04-deal-intelligence.module.ts](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/modules/m04-deal-intelligence/m04-deal-intelligence.module.ts).
4. **[COMPLETED]** Create a dedicated `ManagerController` registered under `@Controller('api/manager')` to implement all missing manager endpoints.
   * *Status:* Created new [manager.controller.ts](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/modules/m04-deal-intelligence/controllers/manager.controller.ts) implementing playbook next steps, manager tasks, team-members, deal-stages, and export endpoints.
5. **[COMPLETED]** Ensure the backend implements all 25 active endpoints outlined in Section 3.1:
   * **Under `DealsController` (`@Controller('api/deals')`):**
     * `GET /all` -> returns all deals
     * `GET /pipeline-summary` -> returns pipeline summary
     * `GET /:dealId/brief` -> returns AI brief
     * `GET /:dealId/warnings` -> returns AI warnings
     * `GET /:dealId/playbook` -> returns playbook data
     * `GET /:dealId/activity` -> returns activity timeline
     * `GET /:dealId/crm-fields` -> returns CRM fields
     * `PATCH /:dealId` -> updates deal fields
     * `PATCH /:dealId/playbook/criteria/:criterionId` -> updates playbook criterion
     * `POST /:dealId/comments` -> posts a comment
     * `POST /tasks` -> creates a deal task
     * `GET /:dealId/tasks` **[NEW]** -> gets tasks for a single deal
     * `POST /:dealId/escalation` -> escalates a deal
     * `DELETE /:dealId/escalation` -> removes escalation
     * `PATCH /:dealId/warnings/:warningId` -> resolves a warning
     * `POST /:dealId/warnings/:warningId/action` -> triggers warning action
     * `GET /notifications` -> gets notifications
     * `POST /notifications` -> creates notification
     * `PATCH /notifications/read-all` -> marks notifications read
     * `GET /stage-options` -> gets stage options
   * **Under `DealBoardsController` (`@Controller('api/deal-boards')`):**
     * `GET /` -> returns all boards
     * `GET /:boardId` -> returns board details
     * `GET /:boardId/deals` -> returns deals for a board
   * **Under `ManagerController` (`@Controller('api/manager')`):**
     * `PATCH /deals/:dealId/playbook/next-steps/:stepId` **[NEW]** -> updates manager's next step
     * `GET /tasks` **[NEW]** -> retrieves manager's overview tasks
     * `GET /team-members` **[NEW]** -> retrieves list of reporting reps
     * `GET /deal-stages` **[NEW]** -> retrieves stages list
     * `GET /deals/export` **[NEW]** -> retrieves CSV/JSON deals export data
6. **[COMPLETED]** Standardize route ordering and parameter names to prevent parameter collision (e.g. ensuring `/stage-options`, `/all`, `/pipeline-summary`, and `/notifications` are placed before parameter-based routes like `/:dealId`).
   * *Status:* Optimized route order inside `DealsController` to place static endpoints before parameter-based endpoints. Tested and verified clean TypeScript compilation without errors.

### Phase 4: Authentication and RBAC Consolidation
1. **[COMPLETED]** Remove M04's local `AuthGuard` and `RolesGuard`.
   * *Status:* Deleted obsolete local guard files (`auth.guard.ts`, `auth.guard.spec.ts`, `roles.guard.ts`) and the local decorator (`roles.decorator.ts`).
2. **[COMPLETED]** Replace them with global platform guards: `@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)` imported from `platform-core`.
   * *Status:* Replaced all local guard annotations across all 17 M04 controllers to use global `JwtAuthGuard`, `TenantGuard`, and `RolesGuard` from `platform-core`.
3. **[COMPLETED]** Standardize roles used in controllers to use the global `UserRole` enum values (`SALES_REP`, `MANAGER`, `ADMIN`).
   * *Status:* Standardized controller roles mapping to import the global `UserRole` enum from `@rri/database` and mapped the obsolete local `'USER'` role references to `'SALES_REP'`. Verified clean compilation.

### Phase 5: Path Aliasing Correction
1. **[COMPLETED]** Rename the path alias `@/*` in M04's `tsconfig.json` and the main `tsconfig.json` mapping to a scoped namespace, e.g. `@m04/*`.
   * *Status:* Renamed path alias configuration keys and target mappings to `@m04/*` inside [tsconfig.json](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/modules/m04-deal-intelligence/tsconfig.json) and [apps/unified-api/tsconfig.json](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/apps/unified-api/tsconfig.json).
2. **[COMPLETED]** Refactor imports within M04 to use `@m04/` paths.
   * *Status:* Updated all path alias imports and requires across all files in `modules/m04-deal-intelligence` to import from `@m04/` instead of `@/`. Verified clean TypeScript compilation.

### Phase 6: UUID Parameter Validation & Missing Endpoints [COMPLETED]
This phase addresses specific issues with UUID validation and missing routes identified from testing logs:

1. **[COMPLETED] UUID Parameter Validation:**
   * **Issue:** PostgreSQL queries fail with a 500 error when an invalid UUID (like a string `'deal-1'`) is passed to path parameters that query database fields typed as UUID.
   * **Remediation:** Implement standard NestJS `ParseUUIDPipe` or inline regular expression validations on all parameters (e.g. `:dealId`, `:boardId`) in `DealsController`, `DealBoardsController`, and `ManagerController`. If a parameter is not a valid UUID format, return a clean `400 Bad Request` instead of letting PostgreSQL throw a 500 error.
   * *Status:* Successfully implemented `isUuid` validation in `DealsController`, `DealBoardsController`, and `ManagerController` and corrected error handling (re-throwing `BadRequestException`) so invalid UUIDs properly return HTTP 400.

2. **[COMPLETED] Missing Endpoints Implementation:**
   * **`GET /api/deals/:dealId/activity/:activityId` [MISSING]:** Fetch a single activity event by its database ID under the specified deal.
   * **`GET /api/deals/forecast-category-options` [MISSING]:** Separate endpoint returning the forecast categories list, complementing the existing `GET /api/deals/stage-options` which returns both stages and categories.
   * **`GET /api/notifications/all` [MISSING]:** Expose a global/unscoped endpoint for admin/system views to retrieve notifications across reps.
   * *Status:* Added missing endpoints and verified their functionality via PowerShell test scripts. All endpoints properly return data according to specification.

---

## 5. Architectural Notes & Future Phases

> [!IMPORTANT]
> **Revenue Graph Dependency:** Since the **Revenue Graph (M10)** module is currently pending and not fully implemented, the event-driven patterns under ADR-005 and physical database schema namespace migrations cannot be finalized immediately.
> 
> We will proceed with the immediate implementation of **Phases 1 to 5** (database integration, in-memory deprecation, route consolidation, guard updates, and path aliasing). The following actions are deferred to a subsequent execution phase:

### Future Phase: Event Flow & ADR-005 Realignment
*This phase must be executed as soon as the M10 (Revenue Graph) module is fully deployed:*
1. **Remove Public Event Emission from M04:** Modify `M04DealIntelligenceService` (`m04.service.ts`) to remove the publication of the public platform event `deal.stage.changed`.
2. **Publish Internal Request Event:** Implement the publication of the internal `deal.stage.update.requested` event when a stage change is requested via the UI.
3. **M10 Sync Handler:** Configure the M10 event listener to consume `deal.stage.update.requested`, perform the outbound CRM synchronization, and broadcast the public `deal.stage.changed` event.
4. **M04 Event Consumption:** Configure M04 to consume the public `deal.stage.changed` event to update deal positions on the active boards.

### Future Phase: Schema Namespace Migration
*This phase will align physical database schemas with architectural namespaces:*
1. **Migration to `dealmanagement`:** Run database migrations to move all M4/M5 tables from the `revenuegraph` schema namespace to the `dealmanagement` schema namespace.
2. **Prisma Mapping:** Update `schema.prisma` mapping from `@@schema("revenuegraph")` to `@@schema("dealmanagement")` for models `Deal`, `Account`, `DealWarning`, `DealPlaybook`, `M04DealDriver`, `DealComment`, `DealTask`, `DealActivityEvent`, and `DealNotification`.
