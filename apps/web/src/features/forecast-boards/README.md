# Forecast Boards Feature

This module is a placeholder for the **Forecast Boards** feature.

## Structure

```
src/features/forecast-boards/
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
5. Wire up routes in `src/app/(dashboard)/forecast-boards/`

## Import Convention

Use the `@forecast/` path alias:

```tsx
import { MyComponent } from '@forecast/components/MyComponent';
```
