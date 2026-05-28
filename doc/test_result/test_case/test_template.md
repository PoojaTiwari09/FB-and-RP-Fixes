# M0N — Test execution guide (template)

Copy to `testN.md` when adding module **M0N**.

| Item | Value |
|------|-------|
| Runner | `testmN.py` |
| Audit source | `_audit/m0N_deep_smoke.*` |

## Prerequisites

1. API on `http://localhost:3001`
2. Database seeded for module tenant
3. Python 3.9+

## Run

```powershell
cd r-revenue-intelligence-monorepo\test_case
python testmN.py
```

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `M0N_API_URL` | (set per module) | REST base |
| `M0N_TENANT_A` | (seed tenant UUID) | Primary tenant |

## Test case table

| # | Phase | Test name | Method | Path | Expected HTTP |
|---|-------|-----------|--------|------|---------------|
| 1 | A | (example) | GET | `/...` | 200 |

Add one row per `run_case(...)` in `testmN.py`.
