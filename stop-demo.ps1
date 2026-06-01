# Stop unified demo (UI :3000, API :3001)
# Usage: cd r-revenue-intelligence-monorepo; .\stop-demo.ps1

$Root = $PSScriptRoot
$BackendRoot = Join-Path $Root "boilerplate code\r-revenue-intelligence"

Write-Host ""
Write-Host "=== Stopping unified demo ===" -ForegroundColor Cyan
Write-Host 'Note: API windows may show ERR_PNPM exit 4294967295 when stopped. That is normal.' -ForegroundColor DarkGray
Write-Host ""

Write-Host "[1/2] UI port 3000 (and legacy 3010-3014)..." -ForegroundColor Yellow
& (Join-Path $Root "free-ui-ports.ps1")

Write-Host '[2/2] API port 3001 (unified) and legacy ports...' -ForegroundColor Yellow
if (Test-Path (Join-Path $BackendRoot "scripts\free_ports_all.ps1")) {
  Push-Location $BackendRoot
  .\scripts\free_ports_all.ps1
  Pop-Location
} else {
  foreach ($port in 3001, 3002, 4009, 5174, 5175, 5176) {
    $lines = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
    foreach ($line in $lines) {
      $procId = ($line -split '\s+')[-1]
      if ($procId -match '^\d+$') {
        Write-Host "Stopping PID $procId on port $port"
        Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
      }
    }
  }
}

Write-Host ""
Write-Host "Done. Close any remaining PowerShell windows manually if needed." -ForegroundColor Green
Write-Host "Docker still running. To stop DB:" -ForegroundColor DarkGray
Write-Host "  docker stop revenue_intel_db revenue_intel_redis" -ForegroundColor DarkGray
Write-Host ""
