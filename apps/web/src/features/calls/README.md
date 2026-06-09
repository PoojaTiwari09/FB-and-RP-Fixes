# Calls Feature

This module is a placeholder for the **Calls** feature (Calls List, AI Call Reviewer, AI Theme Spotter).

## Structure

```
src/features/calls/
├── components/   # React components for Calls pages
├── hooks/        # Custom React hooks
├── services/     # API service layer
├── mocks/        # Mock data for development
└── types/        # TypeScript type definitions
```

## Routes

| Route | Description |
|:---|:---|
| `/calls/list` | Calls List page |
| `/calls/reviewer` | AI Call Reviewer page |
| `/calls/theme-spotter` | AI Theme Spotter page |

## Getting Started

1. Add your components to `components/`
2. Define API types in `types/`
3. Create service functions in `services/`
4. Add mock data in `mocks/` (use `@shared/config/env` to check `ENV.USE_MOCK_DATA`)
5. Wire up routes in `src/app/(dashboard)/calls/`

## Import Convention

Use the `@calls/` path alias:

```tsx
import { MyComponent } from '@calls/components/MyComponent';
import { myService } from '@calls/services/myService';
```
