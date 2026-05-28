# M03 — AI Summaries & GenAI — Test Plan

## Prerequisites

- API running on `http://localhost:3001` with `DATABASE_URL` set
- Module path prefix: `/api/v1/ai-summaries-genai`

## Run

```bash
cd doc\test_result\test_case
python testm3.py
```

Optional:

```bash
M03_API_URL=http://localhost:3001/api/v1/ai-summaries-genai python testm3.py
```

## Coverage

| Phase | Tests |
|-------|--------|
| A | Health |
| B | Workspace CRM seed |
| C | Ask Anything (NestJS, no browser Gemini) |
| D | Research job create + status |
| E | Brief generate + fetch (`generatedSummary` as text) |
| F | Orchestrated `/test/smoke` |
| G | Tenant isolation (wrong org → no brief) |

## Pass criteria

All cases in `testm3.py` return PASS (target: 8/8).
