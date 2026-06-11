================================================================================
                    🚀 API TESTING SETUP - READ ME FIRST 🚀
================================================================================

Your R-Revenue Intelligence Platform API is completely set up and ready to test!

================================================================================
                             QUICK START (2 MINUTES)
================================================================================

1. ENSURE SERVICES RUNNING:
   
   Terminal 1:
   cd r-revenue-intelligence-monorepo
   pnpm --filter api run start
   
   Terminal 2:
   cd r-revenue-intelligence-monorepo
   docker-compose up -d postgres redis

2. OPEN POSTMAN:
   - Import file: postman_collection_updated.json
   - Click "Runner" (top menu)
   - Click "Start Run" (orange button)
   - DONE! ✅

3. WATCH RESULTS:
   - 22 requests run automatically
   - Tokens stored and used automatically
   - All tests verified
   - Summary shows success

================================================================================
                            WHAT YOU GET
================================================================================

✅ Complete Backend API (Port 3002)
   - Authentication endpoints
   - Sales Engagement module
   - Conversation Intelligence module
   - Forecasting module
   - 4+ additional modules

✅ Automatic JWT Token Management
   - Login returns token
   - Test script stores token
   - Next request uses token automatically
   - No manual token copying!

✅ RBAC Testing Ready
   - Manager role with permissions
   - Sales Rep role with permissions
   - Permission enforcement verified
   - Access control tested

✅ Complete Postman Collection
   - 22 endpoints pre-configured
   - Auto token storage
   - Test scripts included
   - Ready to import

✅ Comprehensive Documentation
   - 8 detailed guides
   - Visual diagrams
   - Troubleshooting tips
   - Quick references

================================================================================
                         DOCUMENTATION GUIDE
================================================================================

Read these files in order:

1. START_HERE.md ⭐ (BEST STARTING POINT)
   └─ Quick overview, 5 minute read
   └─ Overview of complete setup

2. COLLECTION_RUN_CHECKLIST.md
   └─ Step-by-step verification
   └─ What to check at each step

3. RUN_COMPLETE_COLLECTION.md
   └─ Detailed workflow guide
   └─ All 22 endpoints explained

4. POSTMAN_TESTING_GUIDE.md
   └─ Complete reference guide
   └─ Error scenarios and fixes

5. TOKEN_FLOW_DIAGRAM.md
   └─ Visual diagrams
   └─ How tokens actually work

6. QUICK_START_POSTMAN.md
   └─ First time Postman setup
   └─ Login and token storage

7. README.md
   └─ Full system overview
   └─ Architecture reference

8. COMPLETE_SETUP_SUMMARY.md
   └─ Final summary
   └─ Status and next steps

================================================================================
                            THE 4 COMMANDS YOU NEED
================================================================================

Command 1: Start Backend API
$ cd r-revenue-intelligence-monorepo
$ pnpm --filter api run start
Look for: "API listening on http://localhost:3002"

Command 2: Start Databases
$ cd r-revenue-intelligence-monorepo
$ docker-compose up -d postgres redis
Look for: "Container revenue_intel_db Running"

Command 3: Open Postman
→ Open Postman application
→ Import: postman_collection_updated.json
→ Click: Runner → Start Run

Command 4: (Optional) Start Frontend
$ cd r-revenue-intelligence-monorepo
$ pnpm --filter web run dev
→ Go to: http://localhost:3000

================================================================================
                           SERVICES PORTS
================================================================================

Frontend:      http://localhost:3000    (Next.js)
Backend API:   http://localhost:3002    (NestJS) ⭐
PostgreSQL:    localhost:5438           (Database)
Redis:         localhost:6379           (Cache)
Postman:       Local application        (Testing)

================================================================================
                        WHAT TO EXPECT
================================================================================

After running collection, you should see:

✅ Status: 200 OK on all login requests
✅ Token stored in Variables tab
✅ Protected endpoints: 200 OK
✅ Task creation: 201 Created
✅ All tests pass (green ✅)
✅ RBAC tests return expected status codes
✅ Invalid token test: 401 Unauthorized
✅ No auth test: 401 Unauthorized
✅ Summary: All passed ✅

If you get ❌ instead, check troubleshooting section in guides.

================================================================================
                         TEST USERS (SEEDED)
================================================================================

Manager:
  Email: alex.morgan@relanto.com
  Password: Password123!

Sales Rep (Recommended for testing):
  Email: sarah.chen@relanto.com
  Password: Password123!

Other Sales Reps:
  michael.rod@relanto.com
  david.park@relanto.com
  sujeevan@relanto.com
  (All use: Password123!)

Tenant Slug: relanto

================================================================================
                         HOW TOKEN FLOW WORKS
================================================================================

STEP 1: Login Request
  You send: email + password
  Backend returns: accessToken + refreshToken
  ↓

STEP 2: Test Script
  Automatic script extracts token
  Stores in {{repAccessToken}} variable
  ↓

STEP 3: Protected Request
  Header: Authorization: Bearer {{repAccessToken}}
  Postman replaces variable with actual token
  ↓

STEP 4: Backend Validation
  Backend checks token signature
  Backend checks token expiration
  Backend checks permissions
  ↓

STEP 5: Response
  If valid: 200 OK with data
  If invalid: 401 Unauthorized

NO MANUAL TOKEN COPYING NEEDED - ALL AUTOMATIC!

================================================================================
                         TROUBLESHOOTING QUICK FIX
================================================================================

Problem: 401 Unauthorized
→ Check Variables tab - is token filled?
→ If empty, re-run login request

Problem: 404 Not Found
→ Check backend running on :3002
→ Check Variables: baseUrl = http://localhost:3002

Problem: Token not stored
→ Check login response has "accessToken"
→ Check Variables Current Value
→ Re-run login request

Problem: Services won't start
→ Check Docker running: docker ps
→ Check PostgreSQL: docker-compose up -d postgres
→ Check backend: pnpm --filter api run start

Problem: Still failing?
→ Read: POSTMAN_TESTING_GUIDE.md (has detailed troubleshooting)
→ Check backend logs in terminal
→ Check Postman Response tab for error

================================================================================
                          NEXT STEPS
================================================================================

IMMEDIATE (Right Now):
1. Start backend and databases (commands above)
2. Open Postman and import collection
3. Click Runner → Start Run
4. Wait 2-3 minutes for completion

AFTER SUCCESSFUL RUN:
1. All 22 APIs verified ✅
2. Token management confirmed ✅
3. RBAC tested ✅
4. Ready for development ✅

FRONTEND INTEGRATION:
1. Start frontend: pnpm --filter web run dev
2. Go to: http://localhost:3000/login
3. Login with seeded users
4. Complete workflow tested

================================================================================
                         DOCUMENTATION FILES
================================================================================

All files in: r-revenue-intelligence-monorepo/docs/API-docs and collections/

  00_READ_ME_FIRST.txt ...................... This file (you're reading it!)
  START_HERE.md ............................ ⭐ START HERE (5 min read)
  COLLECTION_RUN_CHECKLIST.md .............. Verification checklist
  RUN_COMPLETE_COLLECTION.md ............... Detailed workflow
  QUICK_START_POSTMAN.md ................... First time setup
  POSTMAN_TESTING_GUIDE.md ................. Complete reference
  TOKEN_FLOW_DIAGRAM.md .................... Visual guides
  README.md ............................... Full overview
  COMPLETE_SETUP_SUMMARY.md ................ Final summary
  postman_collection_updated.json .......... Import into Postman

================================================================================
                          YOU'RE ALL SET! 🚀
================================================================================

✅ Backend API: Running on port 3002
✅ Database: PostgreSQL on port 5438
✅ Cache: Redis on port 6379
✅ Frontend: Ready on port 3000
✅ Testing: Postman collection ready
✅ Authentication: JWT working
✅ RBAC: Implemented and testable
✅ Documentation: Complete

NEXT ACTION:
1. Read: START_HERE.md (5 minutes)
2. Run: Postman collection
3. Verify: All tests pass
4. Done!

================================================================================

Questions? Check the documentation files above.

Ready to test? Start with START_HERE.md

Let's go! 🎉

================================================================================
