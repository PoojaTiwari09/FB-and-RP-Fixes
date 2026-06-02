# M06 Validation Checklist (Integrated Monorepo)

Use this before demos or PR review. Check each item and note pass/fail.

## Environment

- [ ] Docker Postgres running on port **5433**
- [ ] Docker Redis running on port **6379** (or `DISABLE_REDIS=true` in `.env`)
- [ ] `DATABASE_URL` / `DIRECT_URL` point to local Postgres
- [ ] `pnpm install` completed at repo root without errors

## Backend startup

- [ ] `pnpm --filter api dev` starts without bootstrap errors
- [ ] Log shows `API listening on http://localhost:3001`
- [ ] Log shows `Swagger UI: http://localhost:3001/api/docs`
- [ ] `M06ForecastingPredictionModule` loaded (no Nest DI errors)

## Frontend startup

- [ ] `pnpm --filter web dev` starts on port **3005**
- [ ] [http://localhost:3005/forecasting](http://localhost:3005/forecasting) loads after login
- [ ] Tailwind styles visible (cards, spacing, blue buttons — not raw HTML)

## Forecast Boards (TDD API)

- [ ] `GET /api/v1/m06-forecasting-prediction/periods` + `X-Tenant-ID: demo-tenant-01` → **200** array
- [ ] `GET .../periods/current/board` + `X-User-ID: rep-01` → **200** with `periodId`, `coverageMetrics`, `submissions`
- [ ] `POST .../periods/{id}/submit` → **201** with incremented `version`
- [ ] Locked period returns **403** with message: `Forecast period is locked. No new submissions accepted.`
- [ ] Missing `X-User-ID` on submit → **400**

## AI Revenue Predictor (legacy API)

- [ ] `GET /api/v1/forecasting/periods/current/ai-prediction` → **200** (or structured 404 if no snapshot + hint)
- [ ] `POST /api/v1/forecasting/periods/{id}/ai-prediction/run` → accepts job (Redis optional)
- [ ] `GET /api/v1/forecasting/team/board` → **200** for manager flow

## Swagger

- [ ] [http://localhost:3001/api/docs](http://localhost:3001/api/docs) opens Swagger UI
- [ ] Tag **M6 — Forecast Boards (TDD)** lists 3 endpoints
- [ ] Tag **M6 — AI Revenue Predictor** lists forecasting routes
- [ ] Can execute `GET /periods` with `X-Tenant-ID` from Swagger

## Frontend — Forecast Boards UI

- [ ] **Forecast Board** section shows period name, target, AI projection
- [ ] **Pipeline coverage** card shows metrics or amber empty-state (not a crash)
- [ ] Submissions table renders
- [ ] Submit button disabled when `isLocked: true`
- [ ] Successful submit refreshes board / version increments

## Frontend — AI dashboard (rep)

- [ ] AI projection hero card styled correctly
- [ ] Pipeline table loads deals (after seed)
- [ ] Forecast entry form works (draft/submit via legacy API)
- [ ] Period toggle loads periods from TDD `GET /periods`

## Role routes

- [ ] `sales_rep` → rep page (`page.tsx`)
- [ ] `manager` → `ManagerDashboard`
- [ ] `executive` → `CroDashboard`

## Automated tests

- [ ] `pnpm run test:m06` — backend unit/integration pass
- [ ] `pnpm run test:m06:web` — frontend Vitest pass
- [ ] Optional: `pnpm run test:m06:all`

## Runtime / console

- [ ] No repeated React hydration errors on `/forecasting`
- [ ] No CORS errors when using integrated web (relative API paths)
- [ ] Browser console free of 500s on board load (with DB seeded)

## Sign-off

| Role | Name | Date | Pass? |
|------|------|------|-------|
| Dev | | | |
| QA | | | |
