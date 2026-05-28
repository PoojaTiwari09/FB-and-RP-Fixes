# M05 Runtime Risk Report

**Date:** 2026-05-27  
**Overall:** Medium (production-ready contracts; Supabase dependency)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Dual storage (Supabase + Prisma) | High | Documented cutover plan; single source of truth target |
| Supabase unset → 500 on boards/accounts | High | Require env in deploy; health check |
| Webhook without secret in prod | High | `assertM05WebhookSecretConfigured()` |
| assigned_rep overwritten on sync | Low | Fixed: preserve existing assigned_rep_id |
| Prisma generate EPERM on Windows | Low | Stop API before generate |
| No Jest tests in M05 module | Medium | `testm5.py` + expand |

## Resolved this pass

- Duplicate-purpose owner fields
- Undocumented webhook secret
- Mock/list route conflict
- Frontend API path mismatch
