# Deal Boards — Manager View

Self-contained module for the manager-facing Deal Boards page.

## Structure

```
src/features/revenue/components/manager/deal-board/
├── components/   # React sub-components (tables, cards, filters)
├── hooks/        # Custom React hooks
├── services/     # API service layer
├── mocks/        # Mock data for development
└── types/        # TypeScript type definitions
```

## Getting Started

1. Add sub-components to `components/`
2. Define API types in `types/`
3. Create service functions in `services/`
4. Add mock data in `mocks/`

## Import Convention

Use relative imports from within this folder, or `@revenue/` aliases for shared revenue helpers:

```tsx
import DealTable from './components/DealTable';
import { useDeals } from './hooks/useDeals';
```
