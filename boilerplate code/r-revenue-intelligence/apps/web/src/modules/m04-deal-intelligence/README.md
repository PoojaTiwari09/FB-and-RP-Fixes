# Deal Drivers Frontend

Complete frontend implementation covering **all 10 remaining user stories** (US-003, US-023 through US-032).

## Quick Start

```bash
cd deal-drivers-frontend
npm install
npm run dev
# Open http://localhost:5173
```

Backend must be running at `http://localhost:3000`.

---

## User Story Coverage

| US | Title | Status |
|----|-------|--------|
| US-003 | Searchable Team / Manager Dropdown | ✅ Complete |
| US-023 | Sales Manager Auto-Select on Page Load | ✅ Complete |
| US-024 | Manager Visually Identifies Coaching Needs (Heatmap) | ✅ Complete |
| US-025 | Drill-Down Drawer (Rep × Warning) | ✅ Complete |
| US-027 | Board-Scoped Analysis Tab (Sales Manager) | ✅ Complete |
| US-028 | Manager Insight in Coaching Effectiveness | ✅ Complete |
| US-029 | Admin / RevOps Board-Scoped Analysis View | ✅ Complete |
| US-030 | Matrix Fully Redraws When Board Changed | ✅ Complete |
| US-031 | Board Warning Configuration Panel (Admin/RevOps) | ✅ Complete |
| US-032 | Admin Board Comparison for Pipeline Reporting | ✅ Complete |

---

## Architecture

```
src/
├── main.jsx              # React entry point + fake JWT setup for demo
└── DealDriversApp.jsx    # Single-file full application (all components + hooks + API)
```

### Key Sections in DealDriversApp.jsx

| Section | Description |
|---------|-------------|
| `api` object | All API calls with Bearer token auth |
| `MOCK` object | Mock data fallback when backend not available |
| `SearchableManagerDropdown` | US-003: real-time client-side filter |
| `DealDriversMatrix` | US-024: heatmap, sort, team average pinned, training indicator |
| `DrillDownDrawer` | US-025: side panel with deal table, currency, stage pills, View deal link |
| `BoardComparisonTab` | US-019–022, US-032: side-by-side warning bars, CRO insight, Copy insight |
| `CoachingEffectivenessTab` | US-026, US-028: snapshot comparison, direction summary, insight text |
| `BoardScopedAnalysisTab` | US-027, US-029, US-030, US-031: board selector, info panel, live redraw |
| `DealDriversApp` (main) | Tabs, context banner, filters, role-based rendering |

---

## Role-Based Behaviour

| Role | Auto-select Team | Auto-select Board | Tabs visible |
|------|-----------------|------------------|-------------|
| Sales Manager | ✅ Own direct reports | ✅ Last used board | Executive Overview, Coaching Effectiveness, Board-Scoped Analysis |
| CRO / VP Sales | ❌ Manual required | System default | Executive Overview, Deal Board Comparison |
| Admin / RevOps | ❌ Manual required | ❌ Manual required | Executive Overview, Deal Board Comparison, Board-Scoped Analysis |

Use the **role switcher buttons** in the top-right to demo all personas without logging out.

---

## API Endpoints Used

| Method | Endpoint | Used by |
|--------|----------|---------|
| GET | `/deal-drivers/matrix` | Executive Overview, Board-Scoped Analysis |
| GET | `/deal-drivers/drill-down` | Drill-down drawer |
| GET | `/deal-drivers/board-comparison` | Board Comparison tab |
| GET | `/deal-drivers/coaching` | Coaching Effectiveness tab |
| GET | `/deal-drivers/boards` | Board dropdowns |
| GET | `/deal-drivers/managers` | Manager dropdown (CRO/Admin) |
| GET | `/deal-drivers/last-used-board` | Sales Manager auto-select |
| GET | `/deal-drivers/boards/:boardId/warnings` | Board info panel |

All requests include `Authorization: Bearer <token>` from `localStorage.authToken`.

---

## Heatmap Logic

Per warning column, cells are ranked:
- **HIGHEST** → brightest amber (`#F59E0B`)
- **SECOND** → medium yellow (`#FCD34D`)  
- **THIRD** → light yellow (`#FDE68A`)
- **NONE** → transparent

⚠ **Team training needed** appears under a column header when 4+ reps are highlighted in that column.

---

## Demo Without Backend

The app automatically falls back to mock data when API calls fail, so you can demo all screens without a running backend. The mock data includes:
- 5 reps, 5 warnings, realistic percentages
- Drill-down deals with currency/stage/date data
- Board comparison with overlapping warnings
- Coaching effectiveness with improving trend

---

## Integration with Existing Frontend

If you have an existing React app, import the component:

```jsx
import DealDriversApp from './deal-drivers-frontend/src/DealDriversApp.jsx';

// In your router:
<Route path="/deal-drivers" element={<DealDriversApp />} />
```

Make sure your auth store writes the JWT to `localStorage.authToken`, or modify the `getToken()` function at the top of the file to use your own auth mechanism.

---

## PROJECT STATUS: ✅ COMPLETE

All 10 user stories from the frontend prompt are implemented:
- US-003, US-023–US-032
- All global UI requirements met (tabs, context banner, role defaults, error states, loading indicators)
