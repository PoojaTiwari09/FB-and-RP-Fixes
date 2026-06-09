# Contributing Guide

This is a mono-repo with a **feature-based modular architecture**. Each sidebar feature (Engage, Calls, Coaching/AI Trainer, Topics, Trackers, Forecast Boards) is developed independently within the same codebase.

---

## Project Structure

```
src/
├── app/                       # Next.js App Router (routing layer only)
│   ├── layout.tsx             # Root layout: global sidebar + fonts
│   ├── globals.css            # Global styles & design tokens
│   └── (dashboard)/           # Route group (no URL impact)
│       ├── training/          # /training, /training/:id/setup, etc.
│       ├── engage/            # /engage
│       ├── calls/             # /calls/list, /calls/reviewer, /calls/theme-spotter
│       ├── topics/            # /topics
│       ├── trackers/          # /trackers
│       └── forecast-boards/   # /forecast-boards
│
├── features/                  # Feature modules (one per team)
│   ├── training/              # AI Trainer (implemented)
│   ├── engage/                # Engage (stub)
│   ├── calls/                 # Calls (stub)
│   ├── topics/                # Topics (stub)
│   ├── trackers/              # Trackers (stub)
│   └── forecast-boards/       # Forecast Boards (stub)
│
└── shared/                    # Cross-feature shared code
    ├── components/            # Sidebar, future shared UI components
    ├── config/                # env.ts, constants
    ├── types/                 # shared.types.ts
    ├── hooks/                 # Shared hooks (useDebounce, etc.)
    └── lib/                   # Utility functions, API helpers
```

---

## Feature Module Structure

Each feature in `src/features/<name>/` follows this layout:

```
src/features/<feature-name>/
├── components/    # React components, organized by page/domain
├── hooks/         # Custom React hooks
├── services/      # API service layer (fetch, POST, etc.)
├── mocks/         # Mock data for local development
├── types/         # TypeScript type definitions
└── README.md      # Feature-specific docs
```

---

## Path Aliases

| Alias | Maps to | Use for |
|:---|:---|:---|
| `@/*` | `src/*` | Fallback (prefer feature aliases) |
| `@shared/*` | `src/shared/*` | Shared config, types, components |
| `@training/*` | `src/features/training/*` | AI Trainer feature |
| `@engage/*` | `src/features/engage/*` | Engage feature |
| `@calls/*` | `src/features/calls/*` | Calls feature |
| `@topics/*` | `src/features/topics/*` | Topics feature |
| `@trackers/*` | `src/features/trackers/*` | Trackers feature |
| `@forecast/*` | `src/features/forecast-boards/*` | Forecast Boards feature |

### Examples

```tsx
// Import from your own feature
import { MyComponent } from '@calls/components/MyComponent';
import { myService } from '@calls/services/myService';

// Import shared utilities
import { ENV } from '@shared/config/env';
import { ContactPersona } from '@shared/types/shared.types';
```

---

## Rules

### 1. Never import across features

❌ **Don't do this:**
```tsx
// In a Calls component
import { TrainingTable } from '@training/components/Dashboard/TrainingTable';
```

✅ **Instead:** Move the shared component to `@shared/components/`.

### 2. Keep `src/app/` pages thin

Page files in `src/app/(dashboard)/...` should only import and render feature components. All logic, hooks, and services belong in the feature module.

```tsx
// src/app/(dashboard)/calls/list/page.tsx
import CallsList from '@calls/components/CallsList';

export default function CallsListPage() {
  return <CallsList />;
}
```

###3.Every service should first attempt the real backend API call using `ENV.API_BASE_URL`.

If the API request fails (backend unavailable, API not implemented, network error, non-2xx response, etc.), the service must gracefully fall back to mock data instead of throwing errors.

Do not return mock data immediately based on `ENV.USE_MOCK_DATA`.

Expected approach:

* Make the real `fetch()` request
* Wrap API logic inside `try/catch`
* If request fails or response is not OK:

  * log a warning using `console.warn`
  * return the corresponding mock response

This ensures:

* API calls are visible in the browser Network tab
* frontend integration remains aligned with backend contracts
* UI continues functioning even when backend APIs are incomplete

Example pattern:

```ts
export async function fetchCalls() {
  try {
    const res = await fetch(`${ENV.API_BASE_URL}/api/calls`);

    if (!res.ok) {
      throw new Error(`Failed to fetch calls: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.warn('Using mock calls data:', error);

    return MY_MOCK_DATA;
  }
}
```


### 4. Shared code goes in `src/shared/`

If multiple features need the same component, hook, or utility:
1. Move it to the appropriate folder in `src/shared/`
2. Import using the `@shared/` alias

### 5. Add sidebar entries in the shared Sidebar component

The sidebar lives at `src/shared/components/Sidebar/Sidebar.tsx`. To add a new nav item, update the `navItems` array.

---

## Adding a New Route

1. Create the route file: `src/app/(dashboard)/<route>/page.tsx`
2. Create feature components in `src/features/<name>/components/`
3. Import and render from the page file
4. If needed, add the route to the sidebar nav in `src/shared/components/Sidebar/Sidebar.tsx`

---

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npx next build

# Enable mock data (no backend needed)
# Set NEXT_PUBLIC_USE_MOCK_DATA=true in .env.local
```

---

## Reference: Building a Feature

Each feature module follows the same pattern. Here's an example for a hypothetical "Calls" feature:

1. Create components in `src/features/calls/components/`
2. Define types in `src/features/calls/types/`
3. Create services in `src/features/calls/services/` (with mock fallback)
4. Wire routes in `src/app/(dashboard)/calls/`
5. Import using `@calls/` alias

Refer to each feature's `README.md` for specific guidance.

