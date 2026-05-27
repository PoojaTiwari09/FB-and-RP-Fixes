# M08 Notification Architecture Report

**Date:** 2026-05-27  
**Decision:** Event-driven centralized notifications (ADR-002 aligned)

## Components

| Component | Path | Role |
|-----------|------|------|
| `PlatformNotificationService` | `platform-core/notifications/platform-notification.service.ts` | Dispatches email/slack |
| `NotificationEventConsumer` | `platform-core/notifications/notification-event.consumer.ts` | `@OnEvent('notification.alert.requested')` |
| `PlatformNotificationModule` | Registered in `apps/api/src/app.module.ts` | Global |

## M08 decoupling

**Before:** `triggerOutreachAlerts()` used `console.log` simulating Slack/email.

**After:** M08 publishes:

```typescript
await this.events.publish('notification.alert.requested', {
  tenantId,
  channel: 'slack' | 'email',
  body, subject?, recipient?, metadata?,
});
```

Workflow `email_compose` steps also emit `notification.alert.requested` (no direct SMTP).

## Channel behavior

| Channel | When unset | When configured |
|---------|------------|-----------------|
| email | Simulated log | Uses `SMTP_HOST` (stub dispatch) |
| slack | Simulated log | `SLACK_WEBHOOK_URL` or per-alert `slackWebhookUrl` |
| teams | Returns unsupported | — |

## Validation

- M08 contains **no** Slack token storage in service code
- M08 contains **no** direct `fetch` to webhooks (platform owns dispatch)
- Event envelope includes `eventId`, `occurredAt` via `EventPublisherService`

## Status

**PASS** — notification path decoupled; platform consumer wired.
