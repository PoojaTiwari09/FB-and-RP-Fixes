# Quick Testing Steps - 5 Minutes to Verify Everything Works

## Step 1: Verify Services Running (30 seconds)

Open a PowerShell terminal:

```powershell
# Check if API is running on 3002
netstat -ano | Select-String "3002"

# Check if Frontend is running on 3000
netstat -ano | Select-String "3000"
```

**Expected Output:**
```
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       ####
TCP    0.0.0.0:3002           0.0.0.0:0              LISTENING       ####
```

If not running:
- **Backend:** `pnpm --filter api run start` (in monorepo root)
- **Frontend:** `pnpm --filter web run dev` (in monorepo root)

---

## Step 2: Frontend Login Test (1 minute)

1. Open browser: `http://localhost:3000/login`
2. Enter credentials:
   - Email: `alex.morgan@relanto.com`
   - Password: `Password123!`
3. Click: **Sign In**

**Expected Result:**
- ✅ Page redirects to `/engage`
- ✅ "Welcome back, Alex Morgan!" toast appears
- ✅ Tasks list loads with data
- ✅ No error messages in console (F12 → Console)

**If Login Fails:**
- Check browser console for errors
- Should see error message, NOT "404"
- Check backend logs for detailed error

---

## Step 3: Postman Setup (1 minute)

1. Open Postman
2. Click: **Import**
3. Select: `r-revenue-intelligence-monorepo/docs/API-docs and collections/postman_collection_updated.json`
4. Create Environment:
   - Click: Environments → New
   - Name: "Local Development"
   - Add variable: `baseUrl = http://localhost:3002`
5. Select: Environment "Local Development"

---

## Step 4: API Login Test (1 minute)

In Postman:

1. Go to: **Authentication** → **1. POST /auth/login - Manager**
2. Click: **Send**

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "...",
    "expiresIn": 600,
    "tokenType": "Bearer",
    "user": {
      "id": "...",
      "email": "alex.morgan@relanto.com",
      "name": "Alex Morgan",
      "role": "MANAGER",
      "frontendRole": "sales_manager",
      "permissions": [...]
    }
  }
}
```

**Status:** 200 OK ✅

**If 404 or 500:**
- Check backend is running on 3002
- Check backend logs for errors

---

## Step 5: Test Engage Page API (1 minute)

In Postman:

1. Go to: **Sales Engagement** → **1. GET /sales-engagement/tasks - List Tasks**
2. Click: **Send**

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "...",
      "priority": "high",
      "status": "pending",
      ...
    }
  ]
}
```

**Status:** 200 OK ✅

---

## Step 6: Frontend Engage Page Test (30 seconds)

1. Go to: `http://localhost:3000/engage`
2. Verify:
   - ✅ Tasks list appears
   - ✅ Task count shows
   - ✅ Recent activity visible
   - ✅ No errors in console

---

## Quick Test Checklist

| Test | Status | Notes |
|------|--------|-------|
| Backend running (3002) | ⬜ | Check with netstat |
| Frontend running (3000) | ⬜ | Should be auto-running |
| Login page loads | ⬜ | http://localhost:3000/login |
| Frontend login works | ⬜ | No 404 error |
| Postman collection imported | ⬜ | Use postman_collection_updated.json |
| Postman login request (200) | ⬜ | Should return JWT tokens |
| Engage page loads | ⬜ | Tasks should appear |
| Engage API call works (200) | ⬜ | Tasks endpoint returns data |
| No console errors | ⬜ | Check F12 in browser |

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Manager | alex.morgan@relanto.com | Password123! |
| Sales Rep | sarah.chen@relanto.com | Password123! |
| Sales Rep | michael.rod@relanto.com | Password123! |

---

## Troubleshooting Quick Fixes

### Problem: Login returns 404
**Solution:** Backend API not running
```bash
pnpm --filter api run start
```

### Problem: Login works but pages don't load data
**Solution:** Check backend logs for errors
```bash
# Look for error messages in the terminal running the API
```

### Problem: Postman returns 401 Unauthorized
**Solution:** Incorrect or missing accessToken
```
1. Run: Authentication → 1. POST /auth/login - Manager
2. It should save accessToken automatically
3. Try request again
```

### Problem: Engage page shows 500 error
**Solution:** Check backend database connection
```
1. Ensure PostgreSQL running on 5438
2. Check .env DATABASE_URL is correct
3. Check backend logs
```

### Problem: Buttons don't work on frontend
**Solution:** Clear cache and restart
```bash
rm -r apps/web/.next
pnpm --filter web run dev
```

---

## Files to Reference

- **Testing Guide:** `r-revenue-intelligence-monorepo/TESTING_GUIDE.md`
- **Postman Collection:** `r-revenue-intelligence-monorepo/docs/API-docs and collections/postman_collection_updated.json`
- **Backend Port:** 3002
- **Frontend Port:** 3000
- **Database Port:** 5438 (PostgreSQL)

---

## Success = ✅

All tests pass when:
- ✅ Frontend login succeeds (no 404)
- ✅ Postman login returns JWT token (200 OK)
- ✅ Engage page shows real task data
- ✅ Engage API returns tasks list (200 OK)
- ✅ No error console messages
- ✅ All pages load without 500 errors

