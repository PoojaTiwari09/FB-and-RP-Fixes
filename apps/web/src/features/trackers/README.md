# Trackers Feature

This module is a placeholder for the **Trackers** feature.

## Structure

```
src/features/trackers/
├── components/   # React components
├── hooks/        # Custom React hooks
├── services/     # API service layer
├── mocks/        # Mock data for development
└── types/        # TypeScript type definitions
```

## Getting Started

1. Add your components to `components/`
2. Define API types in `types/`
3. Create service functions in `services/`
4. Add mock data in `mocks/`
5. Wire up routes in `src/app/(dashboard)/trackers/`

## Import Convention

Use the `@trackers/` path alias:

```tsx
import { MyComponent } from '@trackers/components/MyComponent';
```
