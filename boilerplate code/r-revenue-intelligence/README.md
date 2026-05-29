# R-Revenue Intelligence (application)

NestJS backends + Vite/Next frontends per product module.

## Run locally

1. From **repo root** (parent of `boilerplate code/`): `docker compose up -d` (Postgres **5433**, Redis **6379**).
2. Here: `pnpm install` → `pnpm run db:generate`.
3. Set `DATABASE_URL` (see [.env.example](./.env.example)).
4. **[RUNBOOK.md](./RUNBOOK.md)** — `pnpm run dev:m01-api` + `dev:m01-web`, etc.

**[ARCHITECTURE.md](./ARCHITECTURE.md)** — ports, database per module, `/api/v1` vs new `/api` bridges.

## Layout

```text
apps/m01-api … m10-api     # Standalone Nest servers
apps/web/src/modules/      # Standalone UIs (@rri/m01-web, …)
modules/m01 … m10          # Domain logic
packages/database          # Prisma schema & migrations
apps/ai-services           # Optional Python AI (:8000)
```

Do not use `pnpm dev` (monolith) while running standalone `m01-api` on the same port.
