# Unified demo: Docker + API :3001 + UI :3000
# Usage: cd r-revenue-intelligence-monorepo; .\start-demo.ps1

$Root = $PSScriptRoot
$BackendRoot = Join-Path $Root "boilerplate code\r-revenue-intelligence"
$UnifiedUi = Join-Path $Root "unified-ui"
$dbUrl = "postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"

Write-Host ""
Write-Host "=== Unified Demo (UI :3000, API :3001) ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path (Join-Path $UnifiedUi "package.json"))) {
  Write-Host "Missing unified-ui. Run .\setup-first-time.ps1 first." -ForegroundColor Red
  exit 1
}

Write-Host "[Env] Syncing API keys from .env..." -ForegroundColor Yellow
& (Join-Path $Root "scripts\sync-env.ps1") 2>$null | Out-Null

Write-Host "[Ports] Clearing 3000 and 3001..." -ForegroundColor Yellow
& (Join-Path $Root "free-ui-ports.ps1") 2>$null | Out-Null
if (Test-Path (Join-Path $BackendRoot "scripts\free_ports_all.ps1")) {
  Push-Location $BackendRoot
  .\scripts\free_ports_all.ps1 2>$null | Out-Null
  Pop-Location
}
foreach ($port in 3000, 3001) {
  $lines = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
  foreach ($line in $lines) {
    $procId = ($line -split '\s+')[-1]
    if ($procId -match '^\d+$') {
      Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
    }
  }
}
Start-Sleep -Seconds 2

Write-Host "[DB] Postgres + Redis..." -ForegroundColor Yellow
if ((docker ps -a --filter "name=revenue_intel_db" --format "{{.Names}}" 2>$null) -eq "revenue_intel_db") {
  docker start revenue_intel_db revenue_intel_redis 2>$null | Out-Null
} else {
  Push-Location $Root
  docker compose up -d postgres redis
  Pop-Location
  Start-Sleep -Seconds 3
}

Write-Host "[Seed] M01 Postgres demo calls..." -ForegroundColor Yellow
& (Join-Path $Root "scripts\seed-demo-data.ps1")

function Start-DevWindow {
  param([string]$Title, [string]$Command)
  Start-Process powershell -ArgumentList "-NoExit", "-Command", $Command
  Start-Sleep -Milliseconds 500
}

Write-Host "[API] Unified M01+M02+M09 on :3001..." -ForegroundColor Yellow
$apiCmd = @"
`$Host.UI.RawUI.WindowTitle = 'Unified API :3001'
Set-Location '$BackendRoot'
if (Test-Path '.env') { Get-Content '.env' | ForEach-Object { if (`$_ -match '^\s*([^#=]+)=(.*)$') { [System.Environment]::SetEnvironmentVariable(`$matches[1].Trim(), `$matches[2].Trim(), 'Process') } } }
`$env:DATABASE_URL='$dbUrl'
`$env:UNIFIED_API_PORT='3001'
`$env:CORS_ORIGINS='http://localhost:3000,http://127.0.0.1:3000'
pnpm run dev:unified-api
"@
Start-DevWindow -Title "Unified API :3001" -Command $apiCmd
Start-Sleep -Seconds 8

Write-Host "[UI] Unified app :3000..." -ForegroundColor Yellow
$uiCmd = @"
`$Host.UI.RawUI.WindowTitle = 'Unified UI :3000'
Set-Location '$UnifiedUi'
if (-not (Test-Path '.env.local')) { & '$Root\scripts\sync-env.ps1' | Out-Null }
if (-not (Test-Path 'node_modules')) { npm install }
Write-Host 'Open -> http://localhost:3000/engage' -ForegroundColor Cyan
Write-Host 'API  -> http://localhost:3001' -ForegroundColor Cyan
npm run dev
"@
Start-DevWindow -Title "Unified UI :3000" -Command $uiCmd

Write-Host ""
Write-Host "OPEN: http://localhost:3000/engage" -ForegroundColor Green
Write-Host "API:  http://localhost:3001" -ForegroundColor Green
Write-Host "Switch role in browser console:" -ForegroundColor DarkGray
Write-Host '  document.cookie = "user_role=sales_manager; path=/"; location.reload();' -ForegroundColor DarkGray
Write-Host ""
Write-Host "Verify: .\verify-demo-apis.ps1" -ForegroundColor DarkGray
Write-Host "Stop:   .\stop-demo.ps1" -ForegroundColor DarkGray
Write-Host ""
