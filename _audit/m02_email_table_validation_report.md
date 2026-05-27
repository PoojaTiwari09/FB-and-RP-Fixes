# M02 — `m02_emails` Table Ownership Validation

**Module:** `modules/m02-conversation-intelligence`
**Status:** ✅ Ownership clarified. No dead Prisma reference remains in M02 hot paths.
**Date:** 2026‑05‑27

---

## 1. Problem

> **MEDIUM — No code path reads `m02_emails` table.**
> Table exists; no service/repository/API actually reads it; likely dead schema or incomplete implementation.

## 2. Investigation

### 2.1 Schema location

`m02_emails` was originally defined in `modules/m02-conversation-intelligence/prisma/schema.prisma` as the *module‑local* Prisma model `M02Email` mapping the email side of the searchable archive. When the M02 schema was rolled into the **unified** Prisma client (`packages/database/prisma/schema.prisma`) during the global reconciliation, the table itself was retained but the model definition lives only inside the older module‑local schema (which is no longer used by runtime code).

### 2.2 Code reachability

```bash
$ rg -n 'm02_emails|m02Email|M02Email|@@map\("m02_emails"\)' --glob '!**/_audit/**' --glob '!**/features/**'

# Hits found only in:
modules/m02-conversation-intelligence/prisma/schema.prisma   (model definition — module‑local schema)
_audit/db_tables.txt                                          (db snapshot — informational)
```

No service, repository, controller, worker, or test imports `M02Email`. The unified Prisma client (`@rri/database`) does *not* expose an `m02Email` delegate — so any future call like `prisma.m02Email.findMany()` would throw at runtime instead of silently using a stale schema.

### 2.3 Intended use case (per the original M02 docs)

The email archive was intended to live alongside `call_records` so that hybrid search could blend voice transcripts and email threads under a single `ConversationRecord` interface. In the unified schema the equivalent role is filled by the *channel‑neutral* mapping inside the repository, which surfaces records as `channel: 'call' | 'email'` regardless of underlying physical table.

## 3. Resolution applied

We chose to **safely deprecate** the dead table reference at the runtime layer rather than re‑implement an in‑progress feature.

### 3.1 Repository — delegate‑safe access

`modules/m02-conversation-intelligence/repositories/m02.repository.ts` no longer assumes the M02‑specific Prisma models exist. Each delegate is probed before use:

```ts
private get callRecordDelegate(): any | null {
  const p = this.prisma as any;
  return p?.callRecord ?? p?.m01Call ?? null;
}

private get transcriptDelegate(): any | null {
  return (this.prisma as any)?.transcript ?? null;
}

private get emailDelegate(): any | null {
  return (this.prisma as any)?.m02Email ?? null;          // expected to be null today
}

private get savedSearchDelegate(): any | null {
  return (this.prisma as any)?.m02SavedSearch ?? null;
}

private get syncLogDelegate(): any | null {
  return (this.prisma as any)?.m02SearchIndexSyncLog ?? null;
}
```

When `emailDelegate` is `null` (the unified client doesn't expose the model), the repository:

* Skips the email side of the corpus build silently.
* Returns demo email records ONLY for the seed tenant (in‑memory factory in `seedDemoCorpus()`).
* Logs nothing at INFO level — the AI / UI consumer is unaware of the absence.

This makes the behaviour **schema‑drift safe**: the M02 runtime can boot against the current unified DB (no `m02_emails`), against an older snapshot that still has it, or in mock mode without a DB, without changing a line of code.

### 3.2 Documentation in code

The repository carries an explicit comment explaining the contract:

```ts
// The unified `@rri/database` PrismaClient exposes M01 models as `callRecord`,
// `transcript`, `utterance`, etc. Older module schemas referenced `m01Call`,
// `m02Email`, `m02Tracker`, `m02SavedSearch` — those don't exist on the
// unified client. We probe each delegate before use to stay crash‑safe.
```

### 3.3 Schema cleanup posture

`modules/m02-conversation-intelligence/prisma/schema.prisma` is **left untouched** — deleting it is risky (the file documents the historical intent and is referenced from architecture docs). It is not loaded by the runtime because:

* The M02 `PrismaService` extends the **unified** `@rri/database::PrismaClient`, not the module‑local generated one.
* The unified Prisma migration set (under `packages/database/prisma/migrations`) is the only one applied to the running database.

## 4. Validation matrix

| Behaviour                                                                            | Result |
|--------------------------------------------------------------------------------------|--------|
| API boot with unified Prisma client (no `m02_emails` table) → no crash               | ✅ |
| `GET /conversations` returns only call‑typed records for tenants without seeded mails | ✅ |
| Demo corpus for seed tenant still returns mixed call/email records (in‑memory)        | ✅ |
| `m02.repository.ts` never throws "Cannot read properties of undefined (reading 'findMany')" | ✅ |
| `pnpm typecheck` clean — no broken Prisma model reference                            | ✅ |

## 5. Files changed

* `modules/m02-conversation-intelligence/repositories/m02.repository.ts`
  * Introduced 5 delegate‑safe getters.
  * Refactored `findAllConversations` / `findConversationById` / `findSavedSearches` / `createSavedSearch` / `findSyncLogs` / `createSyncLog` to use them.
  * Per‑tenant in‑memory map keys (no more global static).

* No new migrations, no schema changes.

## 6. Recommendation

If/when the email ingestion pipeline is implemented, this is the trivial activation path:

1. Add the `M02Email` model to `packages/database/prisma/schema.prisma`.
2. Run `prisma migrate dev`.
3. The repository's `emailDelegate` getter starts returning a real delegate — *no code changes required*.

That keeps M02 forward‑compatible without leaving a dead `prisma.m02Email.findMany()` call in main code paths.
