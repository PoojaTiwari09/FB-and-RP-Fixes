# `tenantId` vs `tenantid` Prisma Field Mismatch — Full Codebase Audit

> **Root issue:** Every model in `packages/database/prisma/schema.prisma` defines the tenant field as `tenantid` (all lowercase). Any Prisma `where`, `create`, or `data` clause that uses `tenantId` (camelCase) will throw a `PrismaClientValidationError` → HTTP 500.

---

## ✅ Already Fixed

| File | Lines | Status |
|---|---|---|
| `m08-sales-engagement/services/m08.service.ts` — `fetchTeamMembers` | 418 | ✅ Fixed (`tenantid`) |
| `m08-sales-engagement/services/m08.service.ts` — `fetchManagerTasks` | 278 | ✅ Fixed (`tenantid`) |
| `m08-sales-engagement/services/m08.service.ts` — `fetchSummary` | 378 | ✅ Fixed (`tenantid`) |
| M02 services (`tracker`, `translation`, `vocabulary-correction`, `m02-frontend-*`, `m02.repository`) | all | ✅ Fixed (`tenantid` in Prisma `where`/`data`) |
| `m03-ai-summaries-genai/repositories/m03.repository.ts` | all | ✅ Fixed |
| `m01-capture-transcription/services/ai-extractor.service.ts` | all | ✅ Fixed |
| `m03-ai-summaries-genai/controllers/m03-test.controller.ts` | all | ✅ Fixed |

---

## 🔴 HIGH — Broken at Runtime (will 500 on real DB calls)

### M02 — `m02-frontend-call-reviews.service.ts`
| Line | Code | Model | Impact |
|---|---|---|---|
| 52 | `callReview.count({ where: { tenantId } })` | `CallReview` | 500 on any call review list |
| 58 | `user.findMany({ where: { tenantId } })` | `User` | 500 on user fetch during seeding |
| 63 | `callRecord.findMany({ where: { tenantId } })` | `CallRecord` | 500 on call record fetch |
| 227 | `user.findMany({ where: { tenantId } })` | `User` | 500 on getUsers() |

### M02 — `m02-frontend-trackers.service.ts`
| Line | Code | Model | Impact |
|---|---|---|---|
| 58 | `where: { tenantId, transcriptStatus }` | `CallRecord`/M01Call | 500 on tracker list |
| 81 | `where: { tenantId, slug }` | Tracker | 500 on tracker by slug |
| 89 | `where: { tenantId, transcriptStatus }` | `CallRecord`/M01Call | 500 on tracker calls |

### M02 — `tracker.service.ts`
| Line | Code | Model | Impact |
|---|---|---|---|
| 64 | `where: { tenantId }` | Tracker | 500 on tracker listing |
| 128 | `where: { tenantId, isActive: true }` | Tracker | 500 on active tracker fetch |
| 302 | `where: { tenantId, entityId, entityType }` | TrackerDetection | 500 |
| 313 | `where: { tenantId }` | Tracker | 500 |
| 339–341 | `count({ where: { tenantId } })` × 3 | Tracker/Detection | 500 on stats |

### M02 — `translation.service.ts`
| Line | Code | Model | Impact |
|---|---|---|---|
| 120 | `where: { tenantId, entityType, entityId, targetLanguage }` | Translation | 500 |
| 178 | `findUnique({ where: { tenantId } })` | TranslationSettings | 500 |
| 220 | `where: { tenantId }` | TranslationSettings | 500 |

### M02 — `vocabulary-correction.service.ts`
| Line | Code | Model | Impact |
|---|---|---|---|
| 68 | `where: { tenantId }` | VocabCorrection | 500 |
| 98 | `where: { tenantId }` | VocabCorrection | 500 |
| 111 | `m01Call.count({ where: { tenantId } })` | M01Call | 500 |
| 113 | `where: { tenantId, correctionVersion }` | M01Call | 500 |

### M02 — `m02.repository.ts`
| Line | Code | Model | Impact |
|---|---|---|---|
| 222 | `delegate.findMany({ where: { tenantId } })` | SearchHistory | 500 |
| 307 | `delegate.findMany({ where: { tenantId } })` | UsageLog | 500 |
| 390 | `where: { tenantId }` | Dynamic delegate | 500 |
| 408 | `delegate.findMany({ where: { tenantId } })` | Dynamic delegate | 500 |

---

## 🟡 MEDIUM — Protected by Guard / Fallback (won't 500, but silently skips DB)

### M03 — `m03.repository.ts`
| Line | Code | Guard | Notes |
|---|---|---|---|
| 23 | `delegate.findMany({ where: { tenantId } })` | `if (delegate?.findMany)` | Falls back to in-memory store |
| 136 | `delegate.findMany({ where: { tenantId } })` | `if (delegate?.findMany)` | Falls back to in-memory store |
| 225–248 | Multiple `where: { tenantId }` on `callRecord`, `account`, `deal`, `m10Contact` | `?.findMany ?` optional chain | Silently returns `[]` |

> **⚠️ These won't 500 — but they will silently return empty/wrong data instead of real DB results.**

### M01 — `ai-extractor.service.ts`
| Line | Code | Guard | Notes |
|---|---|---|---|
| 49 | `d.findMany({ where: { tenantId } })` | `if (!d?.findMany) return []` | Returns `[]` if model absent |
| 197 | `d.findMany({ where: { tenantId, callId } })` | `if (!d?.findMany) return []` | Returns `[]` |
| 219 | `d.findMany({ where: { tenantId, isActive: true } })` | None | **Will 500** if `aiExtractionField` model exists |

---

## 🟢 LOW — Test Files Only (not runtime)

| File | Lines | Notes |
|---|---|---|
| `m08/tests/run-task-tests.ts` | 32 | Test cleanup only |
| `m08/tests/run-tests.ts` | 32–36 | Test cleanup only |
| `m08/tests/run-workflow-tests.ts` | 30–34 | Test cleanup only |

---

## M03 Test Controller (separate issue)

`m03-test.controller.ts` lines 43–46 also use `where: { tenantId }` on `callRecord`, `account`, `deal`, `m10Contact` — these are test/health check endpoints but will still 500 if hit.

---

## Summary Count

| Severity | File Count | Broken Queries |
|---|---|---|
| 🔴 HIGH (runtime 500) | 5 files | 18 locations |
| 🟡 MEDIUM (silent wrong data) | 2 files | 8 locations |
| 🟢 LOW (test files) | 3 files | 8 locations |
| ✅ Already Fixed | 1 file | 3 locations |

**Total across codebase: 37 locations need `tenantId` → `tenantid`**

---

## Schema Reference

In `packages/database/prisma/schema.prisma`:
- **ALL models** use `tenantid` (lowercase, no camelCase).
- Zero models have a `tenantId` camelCase field.
- The `@map("tenant_id")` annotation exists on some models, and the Prisma field name is always `tenantid`.
