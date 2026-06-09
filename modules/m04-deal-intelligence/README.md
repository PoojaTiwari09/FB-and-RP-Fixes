# Dealboards Backend

NestJS + PostgreSQL backend for the Dealboards CRM platform, including the **Deal Drivers** (m04-deal-intelligence) feature.

## Quick Start

### 1. Prerequisites
- Node.js 20+
- Docker & Docker Compose (or a running PostgreSQL 14+ instance)

### 2. Environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.
```

### 3. Database

```bash
# Option A: Docker (recommended)
docker-compose up -d postgres

# Option B: Run migrations manually against your own Postgres
npm run db:migrate
```

### 4. Install & Start

```bash
npm install
npm run start:dev        # dev with hot-reload
# or
npm run build && npm start   # production
```

### 5. Seed Deal Drivers test data

```bash
npm run db:seed
```

---

## Architecture

```
src/
├── main.ts                     # Bootstrap, CORS, validation pipe
├── app.module.ts               # Root module wiring all feature modules
├── health.controller.ts        # GET /health
├── logger.ts                   # Pino logger config
├── common/
│   └── audit-sanitize.interceptor.ts
└── modules/
    ├── database/               # Global DatabaseService (pg Pool wrapper)
    ├── auth/                   # JWT auth, JwtAuthGuard, Roles decorator
    ├── users/                  # User management
    ├── boards/                 # Deal board CRUD
    ├── deals/                  # Deal CRUD & lifecycle
    ├── activities/             # Call/email/meeting activities
    ├── warnings/               # Deal warning engine
    ├── next-steps/             # Next step tracking
    ├── comments/               # Deal comments
    ├── tasks/                  # Task management
    ├── teams/                  # Team management
    ├── targets/                # Sales targets
    ├── escalations/            # Deal escalations
    ├── playbook/               # Sales playbooks
    ├── ai/                     # AI/LLM integration
    ├── crm-sync/               # CRM webhook sync
    ├── dataset-upload/         # Bulk data import
    ├── export/                 # Data export
    ├── notifications/          # In-app notifications
    ├── audit/                  # Audit log service
    └── deal-drivers/           # ★ Deal Drivers feature (m04)
```

## Deal Drivers API (m04-deal-intelligence)

All endpoints require `Authorization: Bearer <token>` with role `sales_manager`, `cro`, `revops`, or `admin`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/deal-drivers/matrix` | Team warning matrix |
| GET | `/deal-drivers/drill-down` | Deals behind a matrix cell |
| GET | `/deal-drivers/board-comparison` | Side-by-side board risk comparison |
| GET | `/deal-drivers/coaching` | Coaching effectiveness (last 30d vs now) |
| GET | `/deal-drivers/boards` | Boards accessible to user |
| GET | `/deal-drivers/managers` | All managers (for CRO selector) |
| GET | `/deal-drivers/warning-definitions` | Warning catalog |
| GET | `/deal-drivers/board-warning-config/:boardId` | Warnings enabled on a board |
| PATCH | `/deal-drivers/board-warning-config/:boardId/warning/:warningId` | Toggle warning |
| POST | `/deal-drivers/board-warning-config/:boardId/warning` | Add warning to board |
| POST | `/deal-drivers/webhook/warning-event` | Ingest warning event (HMAC-signed) |
| POST | `/deal-drivers/webhook/deal-lifecycle/open` | Open deal lifecycle |
| POST | `/deal-drivers/webhook/deal-lifecycle/close` | Close deal lifecycle |
| POST | `/deal-drivers/webhook/deal-reassignment` | Record reassignment |
| POST | `/deal-drivers/webhook/warning-events/bulk` | Bulk ingest warning events |
| DELETE | `/deal-drivers/cache` | Invalidate matrix cache |

## Database Migrations

Migrations run in filename order:

| File | Contents |
|------|----------|
| `001_core_schema.sql` | users, boards, deals, activities, next_steps, comments, tasks, teams, targets, escalations, notifications, playbooks, crm_sync_log |
| `002_warnings_and_ai.sql` | deal_warnings, ai_call_log, dataset_uploads |
| `007_deal_drivers.sql` | deal_warning_definitions, board_warning_config, deal_lifecycle, deal_reassignments, deal_warning_events, user_last_used_board |
| `008_audit_logs.sql` | audit_logs |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | `changeme-secret` | JWT signing secret |
| `JWT_EXPIRES_IN` | `8h` | Token lifetime |
| `WEBHOOK_SECRET` | — | HMAC secret for webhook guard |
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | Environment |
| `LOG_LEVEL` | `info` | Pino log level |
| `ALLOWED_ORIGINS` | `http://localhost:3001` | CORS origins (comma-separated) |

## Tests

```bash
npm test           # Unit tests (deal-drivers.spec.ts)
npm run test:e2e   # E2E tests (deal-drivers.e2e.spec.ts)
```
