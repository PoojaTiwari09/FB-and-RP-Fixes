# M05 Webhook Env Validation Report

**Date:** 2026-05-27

## Before

- Code used `HUBSPOT_WEBHOOK_SECRET` (undocumented in M5 registry)
- HMAC validation optional always; invalid signature returned `{ rejected: true }` with HTTP 200

## After

| Item | Value |
|------|-------|
| **Canonical env** | `M05_HUBSPOT_WEBHOOK_SECRET` |
| **Legacy alias** | `HUBSPOT_WEBHOOK_SECRET` (local migration only) |
| **Accessor** | `config/m05-env.ts` → `getM05HubspotWebhookSecret()` |
| **Production guard** | `assertM05WebhookSecretConfigured()` on module boot |
| **Invalid HMAC** | HTTP 401 `UnauthorizedException` |
| **Missing secret (prod)** | HTTP 400 on webhook POST |
| **Dev (no secret)** | Warn + accept (smoke verified) |

## Documentation updated

- `Reference documents/M5 Account Intelligence/Environment Variables Registry-M5 Account Intelligence.md` — new rows for webhook, HubSpot, Supabase
- `boilerplate code/r-revenue-intelligence/.env` — M05 vars template

## Smoke

- `testm5.py` — dev path without secret (200); with secret tests 401 invalid / 200 valid HMAC

## HubSpot setup note

Endpoint: `POST /api/v1/account-intelligence/webhooks/hubspot`  
Header: `x-hubspot-signature-v3`
