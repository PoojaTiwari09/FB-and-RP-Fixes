# Module Analysis — `platform-core`

> Read this **first** when starting on any other module. `platform-core` is the only shared backend module — everything else depends on it.

---

## 1. Purpose

Provides cross-module primitives that should never duplicate per-module:

* Guards: `TenantGuard`, `JwtGuard`, `HmacWebhookGuard`.
* Event publishing: `EventPublisherService` (+ matching `EventPublisherModule`).

The package is published into the monorepo as `@r-revenue/platform-core` (workspace).

---

## 2. Layout

```
modules/platform-core/
├── package.json
├── events/
│   ├── event-publisher.module.ts
│   ├── event-publisher.service.ts
│   └── *.d.ts / *.js (committed build artifacts — see §6)
└── guards/
    ├── hmac-webhook.guard.ts
    ├── jwt.guard.ts
    └── tenant.guard.ts (+ .d.ts/.js)
```

---

## 3. Key files

### `guards/tenant.guard.ts`

```ts
// excerpt
if (!tenantId) return false;
request.tenantId = tenantId;
return true;
```

* Reads `x-tenant-id` header **or** `request.user?.tenantId`.
* Returns `false` when neither is present → Nest will respond `403`.
* Every controller in every M0X module decorates itself with `@UseGuards(TenantGuard)`.

### `guards/jwt.guard.ts`

* `passport-jwt`-style guard. **Not registered** as a Passport strategy anywhere in `apps/api`. To use it you must add a `JwtStrategy` class in `apps/api/src` and import it via `PassportModule.register({ defaultStrategy: 'jwt' })`.

### `guards/hmac-webhook.guard.ts`

* Verifies inbound webhook HMAC. Each module that exposes a `/webhooks/...` endpoint imports it.
* Reads the shared secret from env (`HUBSPOT_WEBHOOK_SECRET`, `ASSEMBLYAI_WEBHOOK_SECRET`, etc.). Each module is expected to set the appropriate signing header.

### `events/event-publisher.service.ts`

```ts
@Injectable()
export class EventPublisherService {
  async publish(eventName: string, payload: Record<string, any>) {
    console.log(`[MOCK EventPublisher] Publishing event "${eventName}":`, {
      eventId: randomUUID(), version: '1.0', occurredAt: new Date().toISOString(), ...payload,
    });
  }
}
```

> ⚠ **This is a MOCK.** The Reference SAD and Event Schema Registry promise a real cross-module bus (Kafka/Redis Streams). `EventPublisherService.publish()` currently *only* writes to stdout. See `implementation_changes.md` §D for the migration plan.

---

## 4. Consumers

`EventPublisherModule` is imported by:

| Module | File | Events published |
| ------ | ---- | ---------------- |
| M01 | `m01-capture-transcription.module.ts` | `call.transcription.completed`, `call.uploaded` |
| M02 | `m02-conversation-intelligence.module.ts` | `theme.detected`, `tracker.detection.created` |
| M03 | `m03-ai-summaries-genai.module.ts` | `call.summary.generated`, `account.brief.refreshed` |
| M05 | `m05-account-intelligence.module.ts` | `account.health.updated` |
| M06 | (declared) | `forecast.submitted` |
| M07 | (declared) | `dashboard.published` |
| M08 | (declared) | `workflow.run.started`, `workflow.run.completed` |
| M09 | (declared) | `coaching.recommendation.created` |
| M10 | (declared) | `compliance.policy.changed`, `data.cloud.export.completed` |

Per the order chart you gave in the task ("m01 → m10 → m02 → m05 → m03 → m04 → m08 → m06 → m07 → m09"), platform-core sits underneath this graph. Every event listed above is the contract that the next downstream module subscribes to.

---

## 5. Backend ↔ frontend interaction

No direct frontend usage. The web app does not import any `platform-core` artifact. Auth on the frontend goes through `apps/web/src/middleware.ts` (role gating only).

---

## 6. Concerns / debts

| Severity | Issue |
| -------- | ----- |
| HIGH | Mock event publisher; downstream subscribers in other modules are wired via Nest DI rather than real subscription. |
| LOW | Committed build artifacts (`*.d.ts`, `*.js`) live next to `.ts` sources. Add `dist/` to `.gitignore` and rebuild on install. |
| LOW | `package.json` declares both `@nestjs/common@^10` and `@nestjs/passport@^10` — passport peer is fine but `@nestjs/passport@^11` (matching `apps/api`) would be safer. |

---

## 7. Smoke checklist

* `import { TenantGuard } from '../../platform-core/guards/tenant.guard';` from any other module compiles.
* Any controller with `@UseGuards(TenantGuard)` returns `403` when called without `x-tenant-id`.
* `EventPublisherService.publish('test.event', { foo: 1 })` prints a `[MOCK EventPublisher]` line.
