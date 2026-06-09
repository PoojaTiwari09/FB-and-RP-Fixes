# Deal Boards Feature

This module provides the Deal Boards functionality, allowing sales representatives and managers to view their pipelines in Kanban-like stages or table views, apply filters, and dig into individual deal details.

## Structure
- `components/`: React components specific to the Deal Boards feature (e.g. `DealBoardsList`, `DealBoardDetail`, `BoardCard`).
- `services/`: API layer interacting with backend endpoints via `apiFetch`, gracefully falling back to mocks if necessary.
- `mocks/`: Seed data used for local development or when the backend is unavailable.
- `types/`: Type definitions for Deal Boards models (Deal, BoardDetail, Playbook, etc.).

## Usage
The main entry points to the pages are rendered in `src/app/(dashboard)/deal-boards/page.tsx` and `[boardId]/page.tsx`, which directly use the `DealBoardsList` and `DealBoardDetail` components.
