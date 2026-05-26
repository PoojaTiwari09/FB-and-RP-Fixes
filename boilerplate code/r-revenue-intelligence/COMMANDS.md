# ============================================================
# EXECUTION COMMAND LIST — Revenue Intelligence Monorepo
# Feature: Revenue Graph (RIP-F-015) · M10 Data & Compliance
# ============================================================
# ⚠ THIS PROJECT USES pnpm — NOT npm
# packageManager: pnpm@10.14.0  (defined in package.json)
# ============================================================
# Working Directory for ALL commands:
#   "c:\Users\Relanto\Downloads\mypocrevenue\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"
# ============================================================


# ────────────────────────────────────────────────────────────
# STEP 1 — Navigate to project root
# ────────────────────────────────────────────────────────────

cd "c:\Users\Relanto\Downloads\mypocrevenue\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"


# ────────────────────────────────────────────────────────────
# STEP 2 — Install dependencies (run once)
# ────────────────────────────────────────────────────────────

pnpm install

# ✅ Expected output: "Done in Xs using pnpm v10.14.0"
# ❌ DO NOT use: npm install  ← causes "Cannot read properties of null" error


# ────────────────────────────────────────────────────────────
# STEP 3 — Run ONLY the frontend (all you need for the UI)
# ────────────────────────────────────────────────────────────

pnpm --filter web dev

# ⚠ Port is assigned automatically:
#   If 3000 is busy → tries 3001 → tries 3002, etc.
#   Check terminal output for the actual port e.g. "Local: http://localhost:3002"
#
# Revenue Graph page:  http://localhost:<PORT>/modules/m10-data-compliance/revenue-graph


# ────────────────────────────────────────────────────────────
# STEP 4 — Run the full monorepo (all 16 workspaces)
#           Optional — only if you want backend services too
# ────────────────────────────────────────────────────────────

pnpm dev


# ────────────────────────────────────────────────────────────
# STEP 5 — Set the database env variable (optional)
#           Only if you want real DB instead of mock data
# ────────────────────────────────────────────────────────────

# PowerShell:
$env:M10_DATABASE_URL="postgresql://revenue_user:revenue_pass@localhost:5433/revenue_graph_dev"


# ────────────────────────────────────────────────────────────
# REFERENCE — Useful diagnostic commands
# ────────────────────────────────────────────────────────────

# Check which ports are in use:
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :3002

# Kill a process on a port (replace <PID> with actual number from above):
taskkill /PID <PID> /F

# Check versions:
node --version       # needs v18+
pnpm --version       # needs v8+


# ────────────────────────────────────────────────────────────
# CURRENT STATUS
# ────────────────────────────────────────────────────────────
#
# ✅ pnpm install    → Done (all 16 workspace projects)
# ✅ Frontend        → Running (check port in terminal output)
# ⚠  Backend NestJS → Not started (mock data fallback active)
# ⚠  PostgreSQL      → Not required for UI demo
# ⚠  Redis / BullMQ → Not required for UI demo
#
# TL;DR — Run Steps 1→3 and open the browser link.
# ============================================================
