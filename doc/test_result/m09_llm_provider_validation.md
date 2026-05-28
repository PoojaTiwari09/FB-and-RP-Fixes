# M09 — LLM Provider Validation

**Date:** 2026-05-27

## Architecture

| File | Purpose |
|------|---------|
| `providers/llm-provider.interface.ts` | `ILlmProvider` contract |
| `providers/mock-llm.provider.ts` | Mock buyer + evaluation |
| `providers/llm-provider.factory.ts` | `resolveLlmProviderKind()` from env |
| `services/m09.service.ts` (`LlmService`) | Groq + ElevenLabs + mock paths (production logic) |

## Provider resolution

| Env | Provider |
|-----|----------|
| `AI_MOCK_MODE=true` | `mock` |
| `M09_LLM_PROVIDER=mock` | `mock` |
| `M09_LLM_PROVIDER=groq` + `GROQ_API_KEY` | `groq` |
| `M09_LLM_PROVIDER=openai` + `OPENAI_API_KEY` | `openai` (selection only; full adapter TBD) |
| `M09_LLM_PROVIDER=gemini` + `GEMINI_API_KEY` | `gemini` (selection only; full adapter TBD) |
| No `GROQ_API_KEY` | `mock` (automatic) |

`LlmService.getActiveProviderName()` and `getProviderSelectionReason()` exposed on `/test/health`.

## Validated behaviors

| Behavior | Result |
|----------|--------|
| Mock mode session message | PASS (smoke) |
| Mock mode end-session evaluation | PASS (smoke) |
| `getRuntimeMode()` | Returns `mock` or `live` |
| Provider failure does not crash API | PASS (try/catch on unified DB writes; mock LLM always returns) |

## Gap

Full `ILlmProvider` implementations for OpenAI and Gemini are **not** split into separate classes yet — Groq logic remains in `LlmService`. Factory documents selection policy for smoke/ops.
