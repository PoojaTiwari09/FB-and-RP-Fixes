# Module deep smoke tests (`doc/test_result/test_case/`)

Runnable copies of the M01/M02 (and future module) deep smoke suites from `doc/test_result/`.

| Module | Test runner | How to run |
|--------|-------------|------------|
| M01 Capture & Transcription | `testm1.py` | [test1.md](./test1.md) |
| M02 Conversation Intelligence | `testm2.py` | [test2.md](./test2.md) |
| M09 Coaching & Training | `testm9.py` | [test9.md](./test9.md) |
| M03+ (upcoming) | `testmN.py` + `testN.md` | Same pattern |

## Adding a new module (M03–M10)

1. Copy `test_template.py` → `testm3.py` (replace constants and `TEST_CASES`).
2. Copy `test_template.md` → `test3.md`.
3. Mirror cases from `doc/test_result/m0N_deep_smoke.*` when that audit script exists.
4. List every case in the markdown table so runs are reproducible.

## Prerequisites (all modules)

- API listening on **http://localhost:3001** (`pnpm --filter api run start` from monorepo root).
- Database seeded (M01 tenant `dev-tenant-001`, M02 tenant `00000000-0000-0000-0000-000000000001`).
- Python **3.9+** on PATH.

```bash
cd r-revenue-intelligence-monorepo/doc/test_result/test_case
python testm1.py   # or testm2.py
```

Exit code **0** = all passed; **1** = at least one failure.
