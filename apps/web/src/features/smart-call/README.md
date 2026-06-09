# Smart Call Feature

This module implements the **Smart Call** feature for sales reps — AI-powered call preparation, live scoring, and post-call intelligence.

## Structure

```
src/features/smart-call/
├── components/            # Sub-components used by pages
│   ├── SmartCallCard.tsx  # Renders a single call with AI metrics
│   └── SmartCallStatCard.tsx  # Stat summary card
├── pages/
│   └── SmartCallPage.tsx  # Top-level async server component — exported to app/
├── hooks/
│   └── useSmartCalls.ts   # Client-side data hook (for 'use client' components)
├── services/
│   └── smart-call.service.ts  # Data fetching — mock or real API
├── mocks/
│   └── smart-call.mock.ts # Realistic development mock data
└── types/
    └── smart-call.types.ts  # TypeScript definitions (SmartCall, CallStatus, etc.)
```

## Routes

| Route | Role | Description |
|:---|:---|:---|
| `/smart-call` | `sales_rep` | Smart Call dashboard |

## Import Convention

Use the `@smart-call/` path alias for all imports within this feature:

```tsx
import SmartCallPage from '@smart-call/pages/SmartCallPage';
import { fetchSmartCalls } from '@smart-call/services/smart-call.service';
import { useSmartCalls } from '@smart-call/hooks/useSmartCalls';
import type { SmartCall } from '@smart-call/types/smart-call.types';
```

For shared utilities, use `@shared/`:

```tsx
import { ENV } from '@shared/config/env';
import PageHeader from '@shared/components/PageHeader/PageHeader';
```

## Development

```bash
# Enable mock data — no backend required
NEXT_PUBLIC_USE_MOCK_DATA=true
```

## TODO — Backend Integration

- [ ] Implement `GET /api/smart-calls` endpoint returning `SmartCall[]`
- [ ] Add `Authorization: Bearer <token>` header to service fetch call
- [ ] Add pagination: `page` and `limit` query params
- [ ] Add filtering by `status`, `dateFrom`, `dateTo`
- [ ] Implement `POST /api/smart-calls/:id/score` to trigger AI scoring on demand
- [ ] Implement `GET /api/smart-calls/:id` for a call detail page
