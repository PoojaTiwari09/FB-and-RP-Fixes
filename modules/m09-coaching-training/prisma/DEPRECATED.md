# DEPRECATED — module-local Prisma schema

This `prisma/schema.prisma` is **not** used at runtime.

M09 uses `@rri/database` via `database/prisma.service.ts`. Canonical models:

- `dashboards.trainerscenarios` → `trainerscenarios`
- `dashboards.trainersessions` → `trainersessions`

Do not run `prisma db push` in this folder. Use `packages/database` migrations instead.

Legacy model names (`TrainingScenario`, `User.org_id`) are mapped in `repositories/m09.repository.ts`.
