# EXAMPLE ONLY — NOT PART OF THE BUILD

This directory is a **frozen reference implementation** of an earlier draft of
M02 (Conversation Intelligence) that the engineering team used while writing the
TDD. It ships its own `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`,
`docker-compose.yml`, and `turbo.json` — these are all **scoped to this folder
only**.

## Rules of engagement

1. **Do not import** anything from this directory in production code under
   `apps/` or `modules/`. The TypeScript compiler is configured to exclude this
   tree from the build (see `tsconfig.base.json` `exclude`).
2. **Do not run** `pnpm install` from inside this folder — it creates a nested
   workspace and breaks resolution at the repo root.
3. The contents are intentionally orphaned. Treat them like a `*.example.md`
   bundle that happens to compile in isolation.

## Why is it still here?

- The TDDs reference specific files inside this folder.
- The Sequence Diagrams and `Environment Variables Registry-M2.md` documents are
  the canonical specs for M02. Removing the folder would orphan the cross-links.

## How is it excluded?

| Tool | Mechanism |
| ---- | --------- |
| TypeScript | Root `tsconfig.json` `exclude: ["**/features/F1/**"]` |
| pnpm | Root `pnpm-workspace.yaml` does NOT include `**/features/**` |
| ESLint | Root `.eslintignore` adds `**/features/F1/**` |
| Nest CLI / Jest | Both inherit the tsconfig excludes |

## Promotion path

If a future iteration of M02 wants to re-use any module from this folder, move
the file into `modules/m02-conversation-intelligence/<sub-folder>/` and rewrite
its imports to use `@rri/database` and `@nestjs/*`. Do **not** symlink.
