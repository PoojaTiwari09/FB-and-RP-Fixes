# M06 HubSpot Consolidation Report

**Date:** 2026-05-27

## Shared client

**New:** `modules/platform-core/integrations/hubspot-client.service.ts`  
**Module:** `HubSpotIntegrationModule` (global export)

Features:
- Env token: `HUBSPOT_ACCESS_TOKEN` / `HUBSPOT_API_KEY`
- Per-request OAuth bearer override
- Rate limiting (100 / 10s window)
- `getCrmDealsPage()` helper

## M06 integration

- `HubSpotService.syncDeals()` uses `hubspotClient.getCrmDealsPage(accessToken, ...)`
- OAuth token exchange remains in M06 (tenant-specific Map store)

## M04 / M05 status

| Module | Status |
|--------|--------|
| M04 | `hubspot-client.service.ts` — migrate import to platform-core (follow-up) |
| M05 | `@hubspot/api-client` SDK — keep for account sync; can wrap client later |

## Backward compatibility

- M06 routes unchanged: `/api/v1/hubspot/*`
- OAuth flow unchanged
