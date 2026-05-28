# M02 smoke — start API on 3002 + run testm2.py
# Requires: Docker Desktop with final_product postgres (5433) + redis (6379)

$ErrorActionPreference = "Stop"
$root = "c:\Users\Relanto\Downloads\final_product"
$apiRoot = Join-Path $root "r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"

Write-Host "=== Port check ===" -ForegroundColor Cyan
$pg = Test-NetConnection 127.0.0.1 -Port 5433 -WarningAction SilentlyContinue
if (-not $pg.TcpTestSucceeded) {
    Write-Host "5433 not listening — starting Docker (final_product)..." -ForegroundColor Yellow
    Set-Location $root
    docker compose up -d postgres redis
    Start-Sleep -Seconds 5
} else {
    Write-Host "Postgres already on 5433" -ForegroundColor Green
}
netstat -ano | findstr ":5433 :6379 :3002"

$env:DATABASE_URL = "postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
$env:DIRECT_URL = $env:DATABASE_URL
$env:DISABLE_REDIS = "true"
$env:PORT = "3002"
$env:M02_API_URL = "http://localhost:3002/api/v1"

Set-Location $apiRoot
Write-Host "`n=== Starting API on port 3002 (background job) ===" -ForegroundColor Cyan
$job = Start-Job -ScriptBlock {
    param($dir, $db, $port)
    Set-Location $dir
    $env:DATABASE_URL = $db
    $env:DISABLE_REDIS = "true"
    $env:PORT = $port
    pnpm --filter api run start 2>&1
} -ArgumentList $apiRoot, $env:DATABASE_URL, $env:PORT

$ready = $false
for ($i = 0; $i -lt 90; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3002/api/v1/conversation-intelligence/conversations" `
            -Headers @{ "x-tenant-id" = "00000000-0000-0000-0000-000000000001" } `
            -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
    if ($i % 5 -eq 0) { Write-Host "  waiting for API... ($i)" }
}

if (-not $ready) {
    Write-Host "API failed to start. Job output:" -ForegroundColor Red
    Receive-Job $job | Select-Object -Last 40
    Stop-Job $job -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "API ready on http://localhost:3002" -ForegroundColor Green
Set-Location (Join-Path $apiRoot ".")
if (-not (Test-Path .)) { Set-Location "c:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\doc\test_result\test_case" }

Write-Host "`n=== M02 smoke test ===" -ForegroundColor Cyan
python testm2.py
$code = $LASTEXITCODE

Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -Force -ErrorAction SilentlyContinue
exit $code
