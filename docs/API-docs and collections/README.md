# API Testing & Documentation

Complete guide for testing your R-Revenue Intelligence Platform APIs using Postman.

## 📋 Contents

### 1. **QUICK_START_POSTMAN.md** ⚡ START HERE
   - **Time needed:** 5 minutes
   - **Best for:** First time using Postman
   - Step-by-step guide to login and test your first endpoint
   - Includes troubleshooting for common issues

### 2. **POSTMAN_TESTING_GUIDE.md** 📚 COMPREHENSIVE
   - **Time needed:** 20 minutes (read through)
   - **Best for:** Understanding the full testing workflow
   - Complete JWT authentication flow explained
   - All API endpoints documented
   - Testing different user roles
   - Error scenario testing
   - Variable management
   - Token storage and usage

### 3. **TOKEN_FLOW_DIAGRAM.md** 🔄 VISUAL GUIDE
   - **Time needed:** 10 minutes
   - **Best for:** Understanding how tokens work
   - Visual diagrams of complete token flow
   - What happens at each step
   - Common scenarios and error cases
   - JWT token structure explained
   - Backend validation process

### 4. **postman_collection_updated.json** 🔧 THE COLLECTION
   - Complete Postman collection ready to import
   - Contains all API endpoints pre-configured
   - Authentication, Sales Engagement, Conversation Intelligence, Forecasting modules
   - RBAC and Permission tests included
   - Test scripts for automatic token management
   - Environment variables pre-configured

---

## 🚀 Quick Start (2 Steps)

### Step 1: Import the Collection
1. Open Postman
2. Click **Import**
3. Select: `postman_collection_updated.json`

### Step 2: Login and Test
1. Find: **Collections → Authentication → 2. POST /auth/login - Sales Rep**
2. Click **Send**
3. Token is automatically stored ✅
4. Go to: **Collections → Sales Engagement → 1. GET /sales-engagement/tasks**
5. Click **Send** (uses stored token automatically) ✅

**That's it!** Read "QUICK_START_POSTMAN.md" for more details.

---

## 📊 What You Can Test

### Authentication Module
- ✅ User login (Manager & Sales Rep)
- ✅ User registration
- ✅ Get current user profile
- ✅ User logout

### Sales Engagement (M08)
- ✅ List tasks
- ✅ Get task summary
- ✅ View recent activity
- ✅ Create new tasks
- ✅ Get task details
- ✅ Update tasks
- ✅ Mark tasks as complete

### Conversation Intelligence (M02)
- ✅ Get filter options
- ✅ Search calls
- ✅ List call reviews
- ✅ View scorecards

### Forecasting (M06)
- ✅ List forecast periods
- ✅ View forecast boards

### RBAC & Permissions
- ✅ Test Manager permissions
- ✅ Test Sales Rep permissions
- ✅ Test invalid tokens
- ✅ Test missing authentication

---

## 🔑 Key Concepts

### JWT Token
- **What:** JSON Web Token - encrypted credentials
- **How it works:** Login gives you a token, you send token with each request
- **Lifetime:** 600 seconds (10 minutes)
- **Storage:** Automatically stored in Postman collection variables
- **Usage:** Automatically included in request headers via `{{variableName}}`

### Collection Variables
- **What:** Variables stored at collection level
- **Available to:** All requests in the collection
- **Examples:** `{{baseUrl}}`, `{{accessToken}}`, `{{repAccessToken}}`
- **Auto-populated:** Test scripts automatically extract and store tokens

### Token Variables Used
| Variable | Used For | Who Has |
|----------|----------|---------|
| `{{accessToken}}` | Manager requests | Manager (alex.morgan@relanto.com) |
| `{{repAccessToken}}` | Sales Rep requests | Sales Rep (sarah.chen@relanto.com) |

---

## 👥 Test Users (Seeded)

| Name | Email | Password | Role | Token Variable |
|------|-------|----------|------|----------------|
| Alex Morgan | alex.morgan@relanto.com | Password123! | MANAGER | `{{accessToken}}` |
| Sarah Chen | sarah.chen@relanto.com | Password123! | SALES_REP | `{{repAccessToken}}` |
| Michael Rodriguez | michael.rod@relanto.com | Password123! | SALES_REP | (create new) |
| David Park | david.park@relanto.com | Password123! | SALES_REP | (create new) |
| Sujeevan | sujeevan@relanto.com | Password123! | SALES_REP | (create new) |

**Tenant:** relanto

---

## ⚙️ Configuration

### Backend URL
```
http://localhost:3002
```

### API Endpoints Base Path
```
/api/v1/
```

### Authentication
```
Method: Bearer Token (JWT)
Header: Authorization: Bearer {{tokenVariable}}
```

### Token Expiration
```
600 seconds (10 minutes)
```

---

## 🔄 Complete Testing Workflow

### Phase 1: Authentication ✅
1. Login as Sales Rep → Get token
2. Login as Manager → Get token
3. Get current user profile

### Phase 2: Sales Engagement ✅
1. List all tasks
2. Get task summary
3. Create a new task
4. Get task details
5. Update the task
6. Mark task as complete

### Phase 3: Conversation Intelligence ✅
1. Get filter options
2. Search calls
3. List call reviews
4. View scorecards

### Phase 4: Permissions Testing ✅
1. Test Manager access
2. Test Sales Rep access
3. Test invalid token (should fail)
4. Test missing auth header (should fail)

---

## 🛠️ How It All Works

### The Token Flow
```
1. Click "Send" on Login Request
   ↓
2. Postman sends credentials to backend
   ↓
3. Backend validates and returns JWT token
   ↓
4. Test script extracts token from response
   ↓
5. Token stored in collection variable ({{repAccessToken}})
   ↓
6. Next request uses: Authorization: Bearer {{repAccessToken}}
   ↓
7. Postman replaces {{repAccessToken}} with actual token
   ↓
8. Backend receives and validates token
   ↓
9. Request executes and returns data
```

### Variable Substitution
```
What you write:
  Authorization: Bearer {{repAccessToken}}

What Postman sends:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Result:
  ✅ Backend receives real token and processes request
```

---

## ❌ Common Issues & Solutions

### Issue: "401 Unauthorized"
**Cause:** Missing or invalid token
**Solution:**
1. Make sure you ran login first
2. Check Variables tab - token should be filled
3. If empty, run login again
4. Try the protected endpoint again

### Issue: "404 Not Found"
**Cause:** Backend not running or wrong URL
**Solution:**
1. Check backend is running: `pnpm --filter api run start`
2. Verify `baseUrl` in Variables is: `http://localhost:3002`
3. Check the endpoint path is correct

### Issue: "Token not in Variables"
**Cause:** Test script didn't run or login failed
**Solution:**
1. Go to Tests tab after login
2. Check test results
3. Look at Response body for errors
4. Try login again

### Issue: "Wrong token variable"
**Cause:** Using Manager token for Sales Rep endpoint or vice versa
**Solution:**
1. Check which role needs to access this endpoint
2. Use correct token: `{{accessToken}}` for Manager, `{{repAccessToken}}` for Sales Rep

---

## 📖 Documentation Files

### Before You Start
- **README.md** (this file) - Overview and quick reference

### First Time Users
- **QUICK_START_POSTMAN.md** - Get started in 5 minutes

### Detailed Learning
- **POSTMAN_TESTING_GUIDE.md** - Complete step-by-step guide
- **TOKEN_FLOW_DIAGRAM.md** - Visual guide to how tokens work

### Ready to Test
- **postman_collection_updated.json** - Import this into Postman

---

## ✅ Checklist Before You Start

- [ ] Backend API is running: `pnpm --filter api run start`
- [ ] Backend is on port 3002: `http://localhost:3002`
- [ ] Postman is installed and open
- [ ] Collection is imported: `postman_collection_updated.json`
- [ ] You can see collection variables (click collection name → Variables tab)

---

## 🎯 Next Steps

1. **Read:** `QUICK_START_POSTMAN.md` (5 min)
2. **Do:** Import collection and test login (2 min)
3. **Explore:** Run other endpoints in order (10 min)
4. **Reference:** Use `POSTMAN_TESTING_GUIDE.md` if you get stuck
5. **Understand:** Read `TOKEN_FLOW_DIAGRAM.md` to learn how it works

---

## 🆘 Need Help?

### Postman Test Fails?
1. Click the **Tests** tab after sending
2. Look for which test failed ❌
3. Check the Response body for error message
4. Read "Troubleshooting" section in `POSTMAN_TESTING_GUIDE.md`

### Can't Find a Request?
1. Collections in left sidebar
2. Look for folder (Authentication, Sales Engagement, etc.)
3. Look for request inside folder
4. See `QUICK_START_POSTMAN.md` for exact paths

### Still Not Working?
1. Make sure backend is running
2. Check `baseUrl` = `http://localhost:3002`
3. Clear browser cache / restart Postman
4. Run login again to get fresh token
5. Check the API logs: `pnpm --filter api run start`

---

## 📞 Backend Requirements

### Running the Backend
```bash
cd r-revenue-intelligence-monorepo
pnpm --filter api run start
```

### Expected Output
```
[Nest] ... LOG [Bootstrap] API listening on http://localhost:3002
[Nest] ... LOG [Bootstrap] Auth routes:
[Nest] ... LOG [Bootstrap]   POST   /api/v1/auth/register
[Nest] ... LOG [Bootstrap]   POST   /api/v1/auth/login
[Nest] ... LOG [Bootstrap]   POST   /api/v1/auth/refresh
[Nest] ... LOG [Bootstrap]   POST   /api/v1/auth/logout
[Nest] ... LOG [Bootstrap]   GET    /api/v1/auth/me
```

If you don't see this, check:
- Port 3002 is not in use by another process
- All dependencies are installed: `pnpm install`
- Database is running (Postgres on port 5438)

---

## 🎓 Understanding the Architecture

### Components
- **Frontend:** http://localhost:3000 (Next.js)
- **Backend API:** http://localhost:3002 (NestJS)
- **Database:** PostgreSQL on port 5438
- **Postman:** Testing tool (your computer)

### Request Flow
```
Postman
   ↓ HTTP Request with token
Backend API
   ↓ Validates token & executes
Database
   ↓ Returns data
Backend API
   ↓ Returns JSON response
Postman
   ↓ Shows response
```

---

## 💡 Tips & Tricks

### Tip 1: Clear Variables
If tokens get messed up:
1. Click collection name
2. Go to Variables tab
3. Edit the token variables manually if needed
4. Or just run login again

### Tip 2: View Raw Request
To see exactly what Postman sends:
1. Go to any request
2. Scroll down to **Pre-request Script** (advanced)
3. Or click the `code` icon to see request details

### Tip 3: Copy Token to Clipboard
1. Go to Variables tab
2. Find your token row
3. Click the "copy" icon
4. Use in another tool if needed

### Tip 4: Test Multiple Roles
1. Keep Manager token in `{{accessToken}}`
2. Keep Sales Rep token in `{{repAccessToken}}`
3. Switch by using different token variable
4. Easy to test role-based access control

---

## 🚀 You're Ready!

You now have everything you need:
1. ✅ Collection with all endpoints
2. ✅ Automatic token management
3. ✅ Test scripts for validation
4. ✅ Complete documentation
5. ✅ Multiple user accounts to test

**Start with:** `QUICK_START_POSTMAN.md` for a 5-minute walkthrough!

Happy testing! 🎉
