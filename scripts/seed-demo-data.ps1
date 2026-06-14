# Seed Postgres (M01 calls) + M09 in-memory training (on API boot)
# Usage: cd r-revenue-intelligence-monorepo; .\scripts\seed-demo-data.ps1

$Root = $PSScriptRoot | Split-Path -Parent
$BackendRoot = $Root
$dbUrl = "postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"

# Ensure global npm prefix (where pnpm is installed) is in PATH if pnpm is not recognized
if (-not (Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
  $npmPrefix = (npm config get prefix 2>$null)
  if ($npmPrefix) {
    $npmPrefix = $npmPrefix.Trim()
    if (Test-Path $npmPrefix) {
      $env:PATH = "$npmPrefix;$env:PATH"
    }
  }
}

Write-Host ""
Write-Host "=== Seeding demo data ===" -ForegroundColor Cyan
Write-Host ""

Push-Location $BackendRoot
$env:DATABASE_URL = $dbUrl

Write-Host "[1/5] Prisma schema sync (engage + tracker tables)..." -ForegroundColor Yellow
pnpm --filter @rri/database run db:push -- --accept-data-loss 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host '  db:push failed - trying db:migrate...' -ForegroundColor Yellow
  pnpm run db:migrate 2>$null | Out-Null
}

Write-Host "[2/5] Fix legacy GitHub audio URLs (AssemblyAI cannot download them)..." -ForegroundColor Yellow
$fixSql = Join-Path $Root "scripts\fix-github-audio-urls.sql"
if (Test-Path $fixSql) {
  Get-Content $fixSql | docker exec -i revenue_intel_db psql -U revenue_user -d revenue_intelligence 2>$null | Out-Null
}

$fixTenant = Join-Path $Root "scripts\fix-call-tenant.sql"
if (Test-Path $fixTenant) {
  Get-Content $fixTenant | docker exec -i revenue_intel_db psql -U revenue_user -d revenue_intelligence 2>$null | Out-Null
}

Write-Host "[3/6] Base Users & Tenant (seed:all)..." -ForegroundColor Yellow
pnpm run seed:all
$codeAll = $LASTEXITCODE

Write-Host "[4/6] M01 call records + transcripts..." -ForegroundColor Yellow
pnpm run seed:m01
$code = $LASTEXITCODE

Write-Host "[4/5] M08 engage tasks + activity..." -ForegroundColor Yellow
pnpm run seed:m08
if ($LASTEXITCODE -ne 0) {
  Write-Host "Seed warning: pnpm run seed:m08 exited $LASTEXITCODE" -ForegroundColor Yellow
}

Write-Host "[5/6] M02 keyword trackers (scan call transcripts)..." -ForegroundColor Yellow
pnpm run seed:m02-trackers
if ($LASTEXITCODE -ne 0) {
  Write-Host "Seed warning: pnpm run seed:m02-trackers exited $LASTEXITCODE" -ForegroundColor Yellow
}

Write-Host "[6/7] M06 forecasting + revenue predictor..." -ForegroundColor Yellow
pnpm run seed:m06
if ($LASTEXITCODE -ne 0) {
  Write-Host "Seed warning: pnpm run seed:m06 exited $LASTEXITCODE" -ForegroundColor Yellow
}

Write-Host "[7/8] Revenue manager accounts + coaching insights..." -ForegroundColor Yellow
pnpm run seed:revenue
if ($LASTEXITCODE -ne 0) {
  Write-Host "Seed warning: pnpm run seed:revenue exited $LASTEXITCODE" -ForegroundColor Yellow
}

Write-Host "[8/8] M04 Deal Drivers..." -ForegroundColor Yellow
pnpm run seed:m04
if ($LASTEXITCODE -ne 0) {
  Write-Host "Seed warning: pnpm run seed:m04 exited $LASTEXITCODE" -ForegroundColor Yellow
}

Write-Host "[9/9] M07 Revenue Dashboards demo deals (Q1 + Q2 2026)..." -ForegroundColor Yellow
pnpm run seed:m07
if ($LASTEXITCODE -ne 0) {
  Write-Host "Seed warning: pnpm run seed:m07 exited $LASTEXITCODE" -ForegroundColor Yellow
}
Pop-Location

if ($code -ne 0) {
  Write-Host "Seed warning: pnpm run seed:m01 exited $code (often data already exists)." -ForegroundColor Yellow
  Write-Host "If Docker Postgres is on 5438 and the API starts, you can ignore this." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host 'Done. M09 training users load when unified-api starts (M09_AUTO_SEED).' -ForegroundColor Green
Write-Host '  manager@example.com / rep@example.com - password: password123' -ForegroundColor DarkGray
Write-Host ""
