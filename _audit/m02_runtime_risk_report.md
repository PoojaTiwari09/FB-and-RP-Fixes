# M02 — Runtime Risk Report

**Module:** `modules/m02-conversation-intelligence`
**As of:** 2026‑05‑27, after the stabilization pass.

The smoke suite is green and the architecture is correct, but production runtime carries a small number of *known residual risks*. They are listed here with severity, blast radius, mitigations already in place, and the explicit follow‑up that would close them.

---

## 1. Risk register

| #  | Risk                                                                                                                          | Severity | Blast radius                                                                 | Mitigation in place                                                                                                                                       | Suggested follow‑up                                                                  |
|----|--------------------------------------------------------------------------------------------------------------------------------|----------|------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| R1 | The unified `@rri/database` client does **not** expose `m02Email`, `m02Tracker`, `m02SavedSearch`, `m02WorkspaceLanguageSettings` delegates. M02 still works because it falls back to in‑memory maps. | Medium  | Per‑pod in‑memory store → data lost on restart, not cross‑pod.               | Delegate‑safe getters; per‑tenant maps prevent cross‑tenant leakage; demo corpus generated only for the seed tenant.                                       | Add the missing models to `packages/database/prisma/schema.prisma` + a migration.    |
| R2 | API dev script uses `ts-node --transpile-only`. If a new module ships truly incorrect TS, it won't be caught at boot.          | Low     | A bad module would still throw at first call, but boot succeeds.            | Build pipeline still runs `tsc --noEmit` and Jest type checks.                                                                                            | Add a CI job that runs `pnpm tsc -b` before deploy.                                  |
| R3 | `M02_SEMANTIC_BACKEND=postgres-fts` requires the M01 `transcripts.tsv` GIN index to be present. Currently it is.                | Low      | If the migration is rolled back, FTS queries become sequential scans → slow. | Backend selector is environment‑driven; falls back to `simulated` if not configured.                                                                       | Lock the migration into the canonical seed/migrate flow.                            |
| R4 | The simulated semantic search uses a fixed concept dictionary inside `hybrid-search.service.ts`. Domain coverage is limited.   | Low      | Imperfect ranking for queries outside the dictionary.                       | Lexical / FTS still handle exact matches; pagination, filters, and tenant isolation are unaffected.                                                       | Move dictionary to the DB or a JSON config; or upgrade to pgvector when AI svc lands. |
| R5 | The AI tagging pipeline depends on external providers (Groq, Gemini). They can rate‑limit or 5xx.                              | Low      | One transcript fails to tag.                                                | `AiTopicTaggerService` already cascades Groq → Gemini → keyword heuristic; orchestrator persists whatever the pipeline returned.                          | Add per‑provider circuit breaker + metrics (rate of fallback used).                  |
| R6 | `TenantGuard` extracts tenant from the JWT claim **or** `x-tenant-id` header. A trusted gateway must strip the header.         | Medium  | If a hostile client can set `x-tenant-id` directly to bypass the gateway, they impersonate another tenant. | The gateway in front of `apps/api` is configured to drop `x-tenant-id` from inbound requests; only internal services may set it.                              | Promote to JWT‑only on the public edge once SSO ships; keep header for internal calls. |
| R7 | The vendored mini‑monorepo at `features/F1/.../r-ri/` is excluded from TypeScript, ESLint, and pnpm. It is not loaded at runtime. | Very low | A future contributor could `import` from it.                                | TS path exclusion + `.eslintignore` + `EXAMPLE_ONLY.md` marker + frozen, no install scripts.                                                              | Either delete or move to `examples/` outside the monorepo root.                       |
| R8 | The hybrid search blend filter is `score >= 0.1`. Nonsense queries return 0 results, but extremely sparse legitimate queries (rare jargon) could also drop below the floor. | Low      | A real query returns zero results instead of low‑confidence matches.        | Threshold is empirically calibrated against the demo corpus; smoke covers nonsense → 0 and keyword → ≥1.                                                  | Expose the threshold via env var (`M02_SEARCH_MIN_SCORE`) for tenant‑level tuning.    |
| R9 | All current in‑memory fallbacks are *unbounded*. A pathological client could fill memory by creating thousands of saved searches. | Low      | OOM on a single pod; recovers on restart.                                   | Per‑tenant maps cap blast radius; the demo dataset never grows past ~200 records.                                                                          | Add a max‑items cap (e.g. 10k per tenant) and an eviction policy when delegates are missing. |
| R10 | Two NestJS event‑emitter versions could re‑surface if a new module installs `@nestjs/event-emitter@3.x` without overriding.   | Low      | Events emitted in one version may not be heard in another → silent drop.    | Workspace `overrides` pin to 2.1.1.                                                                                                                       | Pre‑commit lint that fails if any `package.json` re‑declares a pinned override locally. |

## 2. Heat map (rendered in plain text)

```
HIGH    │
MEDIUM  │  R1   R6
LOW     │  R2  R3  R4  R5  R8  R9  R10
V LOW   │  R7
        └──────────────────────────────
          (severity vs. likelihood)
```

## 3. Recovery / runbook hooks

* **Database outage** — repository's delegate‑safe path returns in‑memory results so the UI doesn't 500. Operators should still treat this as a sev‑1 because writes are lost on restart.
* **AI provider outage** — `AiTopicTaggerService` automatic fallback (Groq → Gemini → keyword) means tagging always returns *something*. Watch the rate of `keyword-fallback` log lines as an early warning.
* **High latency (> 500 ms p99 on `/search`)** — first check is the backend selector log line (`[hybrid] backend=postgres-fts query="…"`). If `simulated` is unexpected, env var was reset; if `postgres-fts` is slow, check that the GIN index is healthy (`SELECT * FROM pg_stat_user_indexes WHERE relname='transcripts'`).
* **Tenant leak alarm** — there is none. The repository requires a tenant ID in every read/write and the controllers throw 401 if missing. Re‑run the smoke if a regression is suspected.

## 4. Conclusion

There are **no HIGH risks** outstanding. Two MEDIUM items (R1 — schema completion, R6 — header trust boundary) are deliberate design choices for the current stabilization scope and are tracked for the next stabilization wave. None are blocking downstream M03+ integration.
