# Documentation layout

All product specs, audit reports, and runbooks live under **`doc/`**. Runnable code stays in **`boilerplate code/`** only.

| Folder | Contents |
|--------|----------|
| [`reference/`](reference/) | M1–M10 specs, TDDs, architecture (`docs/markdown documents/`) |
| [`execution/`](execution/) | Runbooks, seeds, SQL scripts, platform setup, **standalone module commands** |
| [`execution/standalone/`](execution/standalone/) | `STANDALONE-MODULE-COMMANDS.md`, `INTEGRATION-M*.md`, `M05-VERIFICATION.md` |
| [`execution/seeds/`](execution/seeds/) | `unified-seed.js` and related seed scripts |
| [`execution/database-tools/`](execution/database-tools/) | Unified schema utilities — see [README](execution/database-tools/README.md) |
| [`analysis/`](analysis/) | Module and platform analysis reports |
| [`fix/`](fix/) | Fix logs and remediation write-ups |
| [`test_result/`](test_result/) | Smoke reports, validation outputs, `doc/test_result/test_case/` runners |

**Start here:** [execution/README.md](execution/README.md) · **Run modules locally:** [execution/standalone/STANDALONE-MODULE-COMMANDS.md](execution/standalone/STANDALONE-MODULE-COMMANDS.md)
