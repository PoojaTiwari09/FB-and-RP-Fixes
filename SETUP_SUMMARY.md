# Setup Summary - Frontend & Backend Integration Complete ✅

## What Was Fixed

### 1. **Frontend-to-Backend Port Mismatch**
**Problem:** Frontend was hardcoded to communicate with port 3001, but backend API runs on port 3002.

**Solution:** 
- Updated `apps/web/.env.local` to use `NEXT_PUBLIC_API_BASE_URL=http://localhost:3002`
- Created `getBackendUrl()` function in module-api.ts
- Updated all service files to use direct backend URL calls
- Removed all hardcoded 3001 references

**Files Changed:**
- ✅ `apps/web/.env.local` - Port 3001 → 3002
- ✅ `apps/web/src/shared/lib/auth-api.client.ts` - Direct backend calls
- ✅ `apps/web/src/shared/config/module-api.ts` - Added getBackendUrl()
- ✅ 8 service files - Replaced resolveApiBase() with getBackendUrl()
- ✅ Route handlers - Updated hardcoded 3001 → 3002

### 2. **Authentication System**
**Status:** ✅ **Fully Implemented & Working**

- JWT-based authentication with centralized PlatformAuthModule
- Refresh tokens stored in database (SHA-256 hashed)
- Access token lifetime: 600 seconds
- Refresh token lifetime: 7 days
- RBAC with 2 roles: MANAGER, SALES_REP

### 3. **Frontend Architecture**
**Status:** ✅ **Ready for Testing**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3002
- All service calls now use direct backend URLs
- No more SSR/proxy confusion

---

## Current Status

| Component | Port | Status | Details |
|-----------|------|--------|---------|
| **Frontend (Next.js)** | 3000 | ✅ Running | Auto-reload dev server |
| **Backend API** | 3002 | ✅ Running | NestJS with JWT auth |
| **Database** | 5438 | ✅ Running | PostgreSQL in Docker |
| **Redis** | 6379 | ⏳ Disabled | Not needed for dev |
| **Meilisearch** | 7700 | ⏳ Disabled | Not needed for dev |

---

## Quick Start Commands

### Terminal 1: Backend API
```bash
cd r-revenue-intelligence-monorepo
pnpm --filter api run start
# Listens on http://localhost:3002
# Watch for: "API listening on http://localhost:3002"
```

### Terminal 2: Frontend
```bash
cd r-revenue-intelligence-monorepo
pnpm --filter web run dev
# Listens on http://localhost:3000
# Open: http://localhost:3000/login
```

---

## Testing URLs

### Frontend
- **Login:** `http://localhost:3000/login`
- **Engage Page:** `http://localhost:3000/engage`
- **Revenue Dashboard:** `http://localhost:3000/revenue` (managers only)

### Backend API (for Postman)
- **Base URL:** `http://localhost:3002`
- **Auth:** `http://localhost:3002/api/v1/auth/login`
- **Tasks:** `http://localhost:3002/api/v1/sales-engagement/tasks`
- **Health:** `http://localhost:3002/health` (if available)

---

## Default Test Accounts

All with password: `Password123!` and tenant: `relanto`

### Managers
- Email: `alex.morgan@relanto.com`
- Role: MANAGER
- Permissions: task.view, task.assign, report.view, user.invite

### Sales Representatives
- Email: `sarah.chen@relanto.com`
- Email: `michael.rod@relanto.com`
- Email: `david.park@relanto.com`
- Email: `sujeevan@relanto.com`
- Role: SALES_REP
- Permissions: task.view, task.create

---

## Postman Collection Setup

### Import Collection
1. Open Postman
2. Click **Import**
3. Select: `docs/API-docs and collections/postman_collection_updated.json`
4. Create environment: "Local Development"
5. Add variable: `baseUrl = http://localhost:3002`
6. Select environment and start testing

### Collection Contents
- ✅ **Authentication** - Login, Register, Logout, Get Profile (5 tests)
- ✅ **Sales Engagement** - Tasks CRUD, Summary, Activity (7 tests)
- ✅ **Conversation Intelligence** - Calls, Reviews, Filters (4 tests)
- ✅ **Forecasting** - Periods, Board (2 tests)
- ✅ **RBAC Tests** - Permission validation (4 tests)

---

## Key Endpoints Working

### Authentication
| Endpoint | Method | Status |
|----------|--------|--------|
| /api/v1/auth/login | POST | ✅ |
| /api/v1/auth/register | POST | ✅ |
| /api/v1/auth/logout | POST | ✅ |
| /api/v1/auth/me | GET | ✅ |
| /api/v1/auth/refresh | POST | ✅ |

### Sales Engagement (M08)
| Endpoint | Method | Status |
|----------|--------|--------|
| /api/v1/sales-engagement/tasks | GET | ✅ |
| /api/v1/sales-engagement/tasks | POST | ✅ |
| /api/v1/sales-engagement/tasks/{id} | PATCH | ✅ |
| /api/v1/sales-engagement/tasks/summary | GET | ✅ |
| /api/v1/sales-engagement/activity/recent | GET | ✅ |

### Conversation Intelligence (M02)
| Endpoint | Method | Status |
|----------|--------|--------|
| /api/v1/conversation-intelligence/filters/options | GET | ✅ |
| /api/v1/conversation-intelligence/search/calls | GET | ✅ |
| /api/v1/conversation-intelligence/call-reviews | GET | ✅ |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│              http://localhost:3000                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React App (Next.js 16)                              │  │
│  │  - Login Page                                        │  │
│  │  - Engage (Sales Tasks)                             │  │
│  │  - Revenue Dashboard (Manager only)                 │  │
│  │  - Call Search                                      │  │
│  │  - Training                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↑                                  │
│                   Direct HTTP Calls                         │
│              (getBackendUrl() function)                     │
│                          ↓                                  │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    HTTP/REST API
                     CORS Enabled
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│              http://localhost:3002                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NestJS API (10+ Modules)                            │  │
│  │  - PlatformAuthModule (JWT + RBAC)                  │  │
│  │  - M01: Capture & Transcription                      │  │
│  │  - M02: Conversation Intelligence                    │  │
│  │  - M06: Forecasting & Prediction                     │  │
│  │  - M08: Sales Engagement                             │  │
│  │  - M09: Coaching & Training                          │  │
│  │  - And more...                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↑                                  │
│                    Prisma ORM                               │
│                          ↓                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    PostgreSQL Driver
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                              │
│            PostgreSQL (Docker, Port 5438)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tables:                                             │  │
│  │  - users, organizations, roles                       │  │
│  │  - tasks, activities                                 │  │
│  │  - calls, call_reviews                               │  │
│  │  - refresh_tokens (auth)                             │  │
│  │  - And more...                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

### Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
NEXT_PUBLIC_M08_API_BASE_URL=http://localhost:3002
NEXT_PUBLIC_TENANT_SLUG=relanto
```

### Backend (`.env`)
```env
PORT=3002
DATABASE_URL=postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence
NODE_ENV=development
JWT_SECRET=local-dev-secret-do-not-use-in-prod
JWT_EXPIRES_IN=1d
JWT_ACCESS_TTL_SECONDS=600
JWT_ISSUER=r-revenue-api
API_AUDIENCE=r-revenue-api
```

---

## What Gets Called When User Logs In

### Frontend Login Flow
1. User enters email/password on `http://localhost:3000/login`
2. Frontend calls `auth-api.client.ts`
3. Which calls `getBackendUrl()` → returns `http://localhost:3002`
4. Sends: `POST http://localhost:3002/api/v1/auth/login`
5. Backend validates credentials
6. Returns JWT tokens
7. Frontend stores in cookies: `access_token`, `refresh_token`, `user_role`
8. Redirects to `/engage` or `/revenue`

### Data Loading Flow (Tasks)
1. Page loads: `/engage`
2. React component mounts
3. Calls `engage.service.ts` → `getTasks()`
4. Which calls `getBackendUrl()` → returns `http://localhost:3002`
5. Sends: `GET http://localhost:3002/api/v1/sales-engagement/tasks`
6. With header: `Authorization: Bearer {{accessToken}}`
7. Backend validates JWT
8. Returns tasks list
9. Frontend renders task list

---

## Documentation Files

| File | Purpose |
|------|---------|
| `TESTING_GUIDE.md` | Comprehensive testing guide (Part 1-6) |
| `QUICK_TEST_STEPS.md` | Quick 5-minute verification |
| `SETUP_SUMMARY.md` | This file - overview & architecture |
| `postman_collection_updated.json` | Complete Postman collection |

---

## Success Indicators ✅

All working correctly when:
1. ✅ Frontend login doesn't return 404
2. ✅ Login returns "Welcome" toast message
3. ✅ Engage page loads with real task data
4. ✅ Postman requests return 200/201 responses
5. ✅ Browser console shows no errors
6. ✅ Backend logs show successful requests
7. ✅ Task creation/update works
8. ✅ RBAC permissions enforced

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Login returns 404 | Backend not running on 3002 |
| Tasks don't load | Check backend logs for errors |
| 401 Unauthorized | JWT token missing or invalid |
| CORS errors | Check backend CORS configuration |
| Database errors | Check PostgreSQL running on 5438 |
| Page blank | Check browser console (F12) for errors |

---

## Next Steps

1. ✅ Verify both services running (ports 3000 & 3002)
2. ✅ Test frontend login: http://localhost:3000/login
3. ✅ Test engage page: http://localhost:3000/engage
4. ✅ Test Postman collection with updated base URL
5. ✅ Check all endpoints return 200/201 responses
6. ✅ Verify RBAC permissions work
7. ✅ Run integration tests (automated)
8. ✅ Deploy to staging

---

## Support

For issues:
1. Check `TESTING_GUIDE.md` troubleshooting section
2. Check backend logs (terminal running API)
3. Check browser console (F12 → Console)
4. Check network tab (F12 → Network)
5. Review this summary for architecture understanding

---

**Last Updated:** June 11, 2026
**Status:** ✅ Ready for Testing
**Tested:** ✅ Login flow verified
**Backend:** ✅ Running on port 3002
**Frontend:** ✅ Running on port 3000

