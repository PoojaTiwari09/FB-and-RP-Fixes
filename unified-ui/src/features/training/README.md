# Training Feature

This module is a placeholder for the **Coaching / AI Trainer** feature.

## Structure

```
src/features/training/
├── components/   # React components, organized by page/domain
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
5. Wire up routes in `src/app/(dashboard)/training/`

## Import Convention

Use the `@training/` path alias:

```tsx
import { MyComponent } from '@training/components/MyComponent';
import { myService } from '@training/services/myService';
```

For shared utilities, use `@shared/`:

```tsx
import { ENV } from '@shared/config/env';
```
