# Seed Postgres (M01 calls) + M09 in-memory training (on API boot)
# Usage: cd r-revenue-intelligence-monorepo; .\scripts\seed-demo-data.ps1

$Root = $PSScriptRoot | Split-Path -Parent
$BackendRoot = Join-Path $Root "boilerplate code\r-revenue-intelligence"
$dbUrl = "postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"

Write-Host ""
Write-Host "=== Seeding demo data ===" -ForegroundColor Cyan
Write-Host ""

Push-Location $BackendRoot
$env:DATABASE_URL = $dbUrl

Write-Host "[1/3] Prisma migrate (if needed)..." -ForegroundColor Yellow
pnpm run db:migrate 2>$null | Out-Null

Write-Host "[2/3] Fix legacy GitHub audio URLs (AssemblyAI cannot download them)..." -ForegroundColor Yellow
$fixSql = Join-Path $Root "scripts\fix-github-audio-urls.sql"
if (Test-Path $fixSql) {
  Get-Content $fixSql | docker exec -i revenue_intel_db psql -U revenue_user -d revenue_intelligence 2>$null | Out-Null
}

$fixTenant = Join-Path $Root "scripts\fix-call-tenant.sql"
if (Test-Path $fixTenant) {
  Get-Content $fixTenant | docker exec -i revenue_intel_db psql -U revenue_user -d revenue_intelligence 2>$null | Out-Null
}

Write-Host "[3/3] M01 call records + transcripts..." -ForegroundColor Yellow
pnpm run seed:m01
$code = $LASTEXITCODE
Pop-Location

if ($code -ne 0) {
  Write-Host "Seed warning: pnpm run seed:m01 exited $code (often data already exists)." -ForegroundColor Yellow
  Write-Host "If Docker Postgres is on 5433 and the API starts, you can ignore this." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Done. M09 training users load when unified-api starts (M09_AUTO_SEED)." -ForegroundColor Green
Write-Host "  manager@example.com / rep@example.com - password: password123" -ForegroundColor DarkGray
Write-Host ""
