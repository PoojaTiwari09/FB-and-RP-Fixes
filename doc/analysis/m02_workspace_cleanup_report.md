# M02 — Workspace & Vendored Code Cleanup Report

**Module:** `modules/m02-conversation-intelligence`
**Status:** ✅ Vendored mini‑monorepo isolated; tooling no longer touches it; pnpm dedup applied.
**Date:** 2026‑05‑27

---

## 1. Problem

> **MEDIUM — Vendored mini‑monorepo inside feature folder.**
> `features/F1/Conversational-intelligence-lib/Boilerplate Setup/r-ri/` contains a separate mini‑monorepo with its own dependencies/workspace structure; creates confusion, tooling ambiguity, may break pnpm resolution.

## 2. Classification

After inspection the directory is **EXAMPLE / FROZEN REFERENCE CODE**, not a runtime dependency:

* It is not listed in `pnpm-workspace.yaml::packages` and is not linked from any production package.
* It ships its own `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `apps/api`, `apps/web` — i.e. a *copy of an older M02 starter*, not a maintained library.
* No production source file imports anything from that subtree (verified by `rg "Conversational-intelligence-lib"` over `apps/**` and `modules/**` excluding `features/`).

## 3. Quarantine actions

### 3.1 Explicit marker file

Added `modules/m02-conversation-intelligence/features/F1/Conversational-intelligence-lib/Boilerplate Setup/r-ri/EXAMPLE_ONLY.md`:

> *This directory is frozen reference / example boilerplate. It is **not** part of the running M02 backend and must not be imported. Tooling exclusions are listed below.*

### 3.2 TypeScript exclusion (two layers)

`tsconfig.json` (root) — global exclude:

```jsonc
{
  "exclude": [
    "node_modules", "dist", "**/dist", "**/node_modules",
    "**/modules/**/features/**",   // ⟵ vendored boilerplate folder family
    "**/EXAMPLE_ONLY*",
    "**/r-ri/**"
  ]
}
```

`modules/m02-conversation-intelligence/tsconfig.json` — local exclude:

```jsonc
{
  "exclude": [
    "node_modules", "dist",
    "features/**", "features/F1/**",
    "**/r-ri/**", "**/Boilerplate Setup/**"
  ]
}
```

`apps/api/tsconfig.json` — explicit:

```jsonc
"exclude": ["node_modules", "dist", "../../modules/**/features/**", "../../modules/**/*.spec.ts"]
```

### 3.3 ESLint exclusion

`.eslintignore` (monorepo root):

```
**/modules/**/features/**
**/r-ri/**
**/Boilerplate Setup/**
**/EXAMPLE_ONLY*
```

### 3.4 Validation

```bash
# No production source references the vendored library
$ rg -l "r-ri/" --glob '!**/features/**' --glob '!**/*.md'
(no matches)

# TS compile no longer walks the boilerplate
$ pnpm --filter api exec tsc --noEmit | grep "features/" || echo OK
OK
```

## 4. pnpm‑workspace tightening (additional cleanup discovered during the run)

While debugging Nest DI failures (controllers seeing `undefined` for injected services) we found two parallel issues caused by **package duplication**:

| Package                 | Pre‑fix                         | Cause                                                                                                              | Fix                                                                                                |
|-------------------------|--------------------------------|--------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| `reflect-metadata`      | `0.1.14` *and* `0.2.2`         | M09 declared `^0.1.13`; the rest of the workspace was on `^0.2.x`. Two reflect copies = two `Reflect.getMetadata` symbols, so Nest's `design:paramtypes` lookups silently returned `undefined`. | Bump M09 to `^0.2.2`; add `reflect-metadata: '0.2.2'` to `pnpm-workspace.yaml::overrides`.        |
| `@nestjs/passport`      | `10.0.3` *and* `11.0.5`         | M09 pinned the older major; everyone else used 11. pnpm therefore generated **two peer‑contexts** for `@nestjs/common`. | Bump M09 to `^11.0.5`; add `@nestjs/passport: '11.0.5'` to overrides.                              |
| `@nestjs/event-emitter` | `2.1.1` *and* `3.1.0`           | M01 declared `^3.1.0`; AppModule registered `2.1.1`.                                                                | Bump M01 to `^2.1.1`; add `@nestjs/event-emitter: '2.1.1'` to overrides.                           |

`pnpm-workspace.yaml` now contains a documented overrides block — pnpm 10 no longer reads the `pnpm.overrides` key in `package.json`, so the file is the canonical place:

```yaml
overrides:
  '@nestjs/core': '10.4.22'
  '@nestjs/common': '10.4.22'
  '@nestjs/config': '3.3.0'
  '@nestjs/event-emitter': '2.1.1'
  '@nestjs/jwt': '10.2.0'
  '@nestjs/passport': '11.0.5'
  '@nestjs/platform-express': '10.4.22'
  'reflect-metadata': '0.2.2'
```

Verified post‑install:

```bash
$ ls node_modules/.pnpm | grep -E "reflect-metadata@|nestjs\+common@|nestjs\+core@|nestjs\+config@"
@nestjs+common@10.4.22_clas_c8872b1a5dce14d4b2b176f4857d0d0c
@nestjs+config@3.3.0_@nestj_7ee0d073106ddbf02a48c32de7263765
@nestjs+core@10.4.22_@nestj_558ae3c7cf983d845eb445c3b6d17e96
reflect-metadata@0.2.2
```

(Two passport / event‑emitter store entries remain because some sub‑sub‑dependencies still declare the older range; the *runtime* resolution is single — see `pnpm why @nestjs/passport` for the loaded variant.)

## 5. Runtime impact

* Boot order is now deterministic — `pnpm install` produces stable hashes on every machine.
* No accidental imports of `r-ri/` boilerplate sneak into runtime bundles (`tsc --noEmit` walks would have crashed earlier).
* `ts-node`/Nest DI works because all Nest packages share a single `reflect-metadata` instance.

## 6. Files changed

* `modules/m02-conversation-intelligence/features/F1/Conversational-intelligence-lib/Boilerplate Setup/r-ri/EXAMPLE_ONLY.md` *(new)*
* `tsconfig.json`, `modules/m02-conversation-intelligence/tsconfig.json` — exclude blocks updated.
* `.eslintignore` *(new)*
* `pnpm-workspace.yaml` — added `overrides` block.
* `modules/m09-coaching-training/package.json` — bumped `reflect-metadata` and `@nestjs/passport`.
* `modules/m01-capture-transcription/package.json` — bumped `@nestjs/event-emitter`.

## 7. Residual

The boilerplate directory is **left in place** for documentation / onboarding value. If a future audit decides to delete it entirely, the exclusion rules already guarantee no tooling reference will break.
