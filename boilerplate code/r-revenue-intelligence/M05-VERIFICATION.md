# M05 Account Intelligence — seed data & verification table

Use this doc to reload demo data and verify each M05 feature against known seed entities.

## Quick start

```powershell
# Terminal 1
pnpm run dev:m05-api

# Terminal 2
pnpm run dev:m05-web

# Reload seed (API must be running)
Invoke-RestMethod -Method POST -Uri "http://localhost:4012/api/v1/account-intelligence/test/seed"

# Full verification matrix (JSON)
Invoke-RestMethod -Uri "http://localhost:4012/api/v1/account-intelligence/test/verification"
```

| URL | Purpose |
|-----|---------|
| http://localhost:5179/board/demo | 4 accounts, 3 tabs |
| http://localhost:5179/board/commercial | Stark Industries only |
| http://localhost:4012/api/v1/account-intelligence/test/verification | Machine-readable matrix + manifest |

## Seed manifest (after POST /test/seed)

| Board | Accounts | Purpose |
|-------|----------|---------|
| **demo** | Acme, Globex, Initech, Umbrella | Tabs, engagement gap, at-risk, sparklines |
| **commercial** | Stark | High ARR enterprise row |

| Account | HubSpot ID | Exit ARR | Rep | AI risk | Seed role |
|---------|------------|----------|-----|---------|-----------|
| Acme Corp | `hs-demo-acme` | $285k | rep_01 | 28 Low | High ARR tab, renewal deal, 8 activities, todos |
| Globex Corporation | `hs-demo-globex` | $150k | rep_02 | 41 Medium | Open proposal deal |
| Initech Systems | `hs-demo-initech` | $65k | rep_03 | 62 High | **At Risk** tab |
| Umbrella Corp | `hs-demo-umbrella` | $95k | rep_01 | 78 High | **Engagement gap** (no activity in 21d) |
| Stark Industries | `hs-demo-stark` | $420k | rep_01 | 22 Low | Commercial board |

**Tabs (demo board):**

| Tab | Filter | Expected accounts |
|-----|--------|-------------------|
| All Accounts | (none) | 4 |
| High ARR | exit_arr ≥ $200k | Acme only |
| At Risk | ai_risk_score ≥ 50 | Initech, Umbrella |

## Verification table

| Area | Functionality | Seed entity | Verify in UI | Verify via API | Expected |
|------|---------------|-------------|--------------|----------------|----------|
| Ops | API health | — | — | `GET /test/health` | `success: true` |
| Ops | Reload seed | `POST /test/seed` | Refresh board | `POST /test/seed` | `stats.companies` = 5 |
| Boards | Board list | demo, commercial | Sidebar | `GET /boards` | 2 boards |
| Boards | Board config | 5 columns, 3 tabs | `/board/demo` headers | `GET /boards/demo` | tabs + columns |
| Boards | Tab: All | tab_id=1 | Summary count 4 | `GET /accounts?board_slug=demo&tab_id=1` | 4 rows |
| Boards | Tab: High ARR | tab_id=2 | Only Acme | `...&tab_id=2` | `hs-demo-acme` |
| Boards | Tab: At Risk | tab_id=3 | Initech + Umbrella | `...&tab_id=3` | 2 rows |
| Accounts | Account grid | 4 on demo | Sort Exit ARR | `GET /accounts?board_slug=demo` | 4 accounts |
| Accounts | Rep filter | rep_01 → Acme, Umbrella | Manager → Rep filter | `...&rep_id=rep_01` | 2 accounts |
| Accounts | Period 7d | Umbrella excluded | Period dropdown | `...&period=7` | 3 accounts |
| Accounts | Sparkline column | Acme 8 activities | Activity dots on Acme | accounts[].activities_21d | ≥ 5 dots |
| Accounts | Sparklines API | Acme, Umbrella | — | `GET /accounts/sparklines?board_slug=demo` | umbrella `zero_activity_flag` |
| Accounts | Engagement gap | Umbrella 25d idle | — (no UI yet) | `GET /accounts/engagement-gap?board_slug=demo` | count = 1 |
| Accounts | Renewal date | deal-acme-1 Renewal | Acme Overview | `GET /accounts/hs-demo-acme` | renewal_date set |
| Accounts | Account detail | contacts + deals | Click Globex panel | `GET /accounts/hs-demo-globex` | populated |
| Activities | Timeline + filter | act-acme-* | Acme → Timeline → CALL | `GET /activities/hs-demo-acme?type=CALL` | calls with talk % |
| Edits | Manager note | supplementary Acme | Manager edits column | `PATCH /edits/supplementary/hs-demo-acme` | persists |
| Todos | To-dos CRUD | todo-acme-open/done | Acme → To-dos | `GET /todos/hs-demo-acme` | type `todo`, `content` |
| Todos | Notes | note-acme-1 | Acme → Notes | filter type=note | ROI deck note |
| AI | Brief | activities + deals | Acme → AI Briefs | `POST /ai/summary` | needs `GROQ_API_KEY` |
| AI | Chat | same | Ask AI in panel | `POST /ai/chat` | needs `GROQ_API_KEY` |
| Sync | Status | — | Admin sync bar | `GET /sync/status` | last_sync metadata |
| Sync | Trigger | HubSpot token | Sync Now | `POST /sync/trigger` | live HubSpot pull |
| Boards | Permissions | rep/manager/admin | Rep vs Admin UI | `GET /boards/permissions/manager` | edit flags |
| Boards | Team | rep_01–03 | Rep dropdown | `GET /boards/team` | 3 reps |
| Preferences | Last board | rep → demo | — | `GET /preferences/rep/last-board` | slug demo |
| Boards | Commercial | Stark | `/board/commercial` | `GET /accounts?board_slug=commercial` | 1 account |
| Integration | M10 link | VITE_M10_WEB_URL | Data & Compliance | — | localhost:5178 |
| Integration | Revenue Graph | M10 | Revenue Graph button | — | M10 graph view |
| Webhooks | HubSpot | webhook secret | — | `POST /webhooks/hubspot` | signed upsert |

## Sample API checks (PowerShell)

```powershell
$base = 'http://localhost:4012/api/v1/account-intelligence'

# Engagement gap — Umbrella only
(Invoke-RestMethod "$base/accounts/engagement-gap?board_slug=demo").accounts.name

# High ARR tab
(Invoke-RestMethod "$base/accounts?board_slug=demo&tab_id=2").accounts | ForEach-Object name

# At Risk tab
(Invoke-RestMethod "$base/accounts?board_slug=demo&tab_id=3").accounts | ForEach-Object name

# Todos
(Invoke-RestMethod "$base/todos/hs-demo-acme").todos | Select-Object type, content, completed
```

## Optional: AI & HubSpot

| Variable | Feature |
|----------|---------|
| `GROQ_API_KEY` | AI Briefs + Ask AI |
| `HUBSPOT_ACCESS_TOKEN`, `HUBSPOT_PORTAL_ID` | Sync Now (admin) |

See `INTEGRATION-M05.md` for ports and startup.
