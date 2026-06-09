# Engage Feature

This module is a placeholder for the **Engage** feature.

## Structure

```
src/features/engage/
├── components/   # React components for Engage pages
├── hooks/        # Custom React hooks
├── services/     # API service layer
├── mocks/        # Mock data for development
└── types/        # TypeScript type definitions
```

## Getting Started

1. Add your components to `components/`
2. Define API types in `types/`
3. Create service functions in `services/`
4. Add mock data in `mocks/` (use `@shared/config/env` to check `ENV.USE_MOCK_DATA`)
5. Wire up routes in `src/app/(dashboard)/engage/`

## Import Convention

Use the `@engage/` path alias:

```tsx
import { MyComponent } from '@engage/components/MyComponent';
import { myService } from '@engage/services/myService';
```

For shared utilities, use `@shared/`:

```tsx
import { ENV } from '@shared/config/env';
```
