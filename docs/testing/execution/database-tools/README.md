# Database tools (unified schema)

Schema tooling for M01–M10. Runtime Prisma lives under `boilerplate code/r-revenue-intelligence/packages/database/`.

| File | Purpose |
|------|---------|
| `schema.prisma` | Unified ~170-model schema (`prisma validate` / `format`) |
| `schema.prisma.bak` | Pre-normalization backup |
| `normalize_root_schema.py` | Idempotent schema normalizer (`--check`) |
| `patch-rri-schema.js` · `unify-module-prisma.js` | Schema merge/patch helpers |
| `probe.sql` · `test-pg.js` | DB connectivity probes |
| `model_names.txt` | Model inventory |
| `README-docker.md` | Docker notes for local Postgres |
| `Final_Clean_Global_Database_Schema_M01_M10.docx` | Source Word spec |

```powershell
cd r-revenue-intelligence-monorepo
npx --yes prisma@5 validate --schema=./doc/execution/database-tools/schema.prisma
```
