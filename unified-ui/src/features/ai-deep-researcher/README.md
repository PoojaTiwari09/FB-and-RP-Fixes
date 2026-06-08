# AI Deep Researcher

AI-powered analytical research feature for the Revenue Intelligence platform. Sales managers can ask complex business questions and receive structured, evidence-backed reports from across their team's call and email data.

---

## Feature Structure

```
src/features/ai-deep-researcher/
├── components/
│   ├── manager/
│   │   └── AIDeepResearcherManagerView.tsx   # Main page component (sales_manager role)
│   └── ai-deep-researcher.css               # Scoped feature styles (adr-* prefix)
├── hooks/                                   # (reserved for custom hooks)
├── services/
│   └── aiDeepResearcher.ts                  # API service layer with mock fallback
├── mocks/
│   └── aiDeepResearcher.ts                  # Figma-derived mock data
├── types/
│   └── index.ts                             # TypeScript type definitions
└── README.md
```

---

## Roles

| Role | View |
|---|---|
| `sales_manager` | Full page — query input, progress tracker, report tabs |

Role gating is handled at the route level in `src/app/(dashboard)/ai-deep-researcher/page.tsx`.

---

## API Endpoints

All endpoints are defined in [`services/aiDeepResearcher.ts`](./services/aiDeepResearcher.ts). Each one:

1. Makes a real `fetch()` to `ENV.API_BASE_URL`
2. On failure, logs a warning and returns mock data

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/ai-deep-researcher/filters/defaults` | Load filter dropdowns and rep cohort |
| `GET` | `/api/ai-deep-researcher/example-questions` | Load example question chips |
| `POST` | `/api/ai-deep-researcher/run` | Start an analysis job |
| `GET` | `/api/ai-deep-researcher/progress/:jobId` | Poll job progress (every 2s) |
| `GET` | `/api/ai-deep-researcher/report/:jobId` | Fetch the full generated report |
| `GET` | `/api/ai-deep-researcher/evidence/:jobId` | Fetch paginated citation evidence |
| `POST` | `/api/ai-deep-researcher/escalation` | Submit follow-up / chatbot question |
| `POST` | `/api/ai-deep-researcher/recommendation/share` | Share a recommendation to Slack |

---

## UI Phases

The component renders in three sequential phases:

1. **Input** — Query textarea, filter pills, example questions, Run Analysis button
2. **Running** — Progress bar with live-updating step list (polled every 2 seconds)
3. **Report** — Tabbed report view:
   - **Exec Summary** — Key stats and narrative
   - **Key Findings** — Objections table, low-resolution alert, rep performance bars
   - **Evidence** — Paginated citation cards with filter chips
   - **Trends** — Trend narrative
   - **Risks & Opps** — Risk/opportunity blocks
   - **Recommendations** — Priority-coded cards with Slack share action
   - **Escalation** — Follow-up chatbot with deep analysis CTA

---

## Local Development

```bash
# From the repo root
npm run dev
```

The feature falls back to mock data automatically when the backend is unavailable. No `.env` changes are needed for local development.

To connect a real backend:
1. Set `NEXT_PUBLIC_API_BASE_URL=http://your-backend` in `.env.local`
2. Remove the `catch` blocks from any service functions whose endpoints are ready

---

## Path Alias

```ts
import { ... } from '@ai-deep-researcher/services/aiDeepResearcher';
import { ... } from '@ai-deep-researcher/types';
```

Alias configured in [`tsconfig.json`](../../../../tsconfig.json):
```json
"@ai-deep-researcher/*": ["./src/features/ai-deep-researcher/*"]
```
