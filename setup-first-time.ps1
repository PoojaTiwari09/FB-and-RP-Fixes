# First-time setup — run ONCE before start-demo.ps1
# Usage: cd r-revenue-intelligence-monorepo; .\setup-first-time.ps1

$ErrorActionPreference = "Continue"
$Root = $PSScriptRoot
$BackendRoot = $Root
$UnifiedUi = Join-Path $Root "apps\web"
$dbUrl = "postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"

Write-Host ""
Write-Host "=== FIRST-TIME SETUP ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Docker Postgres + Redis..." -ForegroundColor Yellow
if ((docker ps -a --filter "name=revenue_intel_db" --format "{{.Names}}" 2>$null) -eq "revenue_intel_db") {
  docker start revenue_intel_db revenue_intel_redis 2>$null | Out-Null
  Write-Host "      Started existing containers." -ForegroundColor Green
} else {
  Push-Location $Root
  docker compose up -d postgres redis
  Pop-Location
  Start-Sleep -Seconds 3
  Write-Host "      Created containers via docker compose." -ForegroundColor Green
}

Write-Host "[2/5] Monorepo pnpm install + db:generate..." -ForegroundColor Yellow
Push-Location $Root
$env:DATABASE_URL = $dbUrl
pnpm install
if ($LASTEXITCODE -ne 0) { Write-Host "      pnpm install failed." -ForegroundColor Red; Pop-Location; exit 1 }
pnpm run db:generate
Pop-Location
Write-Host "      Monorepo workspaces ready." -ForegroundColor Green

Write-Host "[3/5] Next.js frontend - npm install + .env.local..." -ForegroundColor Yellow
if (Test-Path $UnifiedUi) {
  Push-Location $UnifiedUi
  if (-not (Test-Path ".env.local") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env.local"
  }
  if (-not (Test-Path "node_modules")) { npm install }
  Pop-Location
  Write-Host "      Frontend ready." -ForegroundColor Green
} else {
  Write-Host "      Missing apps/web folder." -ForegroundColor Red
  exit 1
}

Write-Host "[4/5] Database migrate + M01 seed..." -ForegroundColor Yellow
& (Join-Path $Root "scripts\seed-demo-data.ps1")

Write-Host "[5/5] Done." -ForegroundColor Green
Write-Host ""
Write-Host "Next: .\start-demo.ps1" -ForegroundColor Cyan
Write-Host "Open:  http://localhost:3000/engage" -ForegroundColor Cyan
Write-Host ""
