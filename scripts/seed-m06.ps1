# Seed M06 forecasting data (periods, boards, deals, AI snapshots)
# Usage: cd r-revenue-intelligence-monorepo; .\seed-m06.ps1

$Root = $PSScriptRoot
$BackendRoot = $Root
$dbUrl = "postgresql://revenue_user:revenue_pass@127.0.0.1:5432/revenue_intelligence?schema=public"

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
Write-Host "=== Seeding M06 forecast data ===" -ForegroundColor Cyan
Push-Location $BackendRoot
$env:DATABASE_URL = $dbUrl
pnpm run seed:m06
$code = $LASTEXITCODE
Pop-Location

if ($code -ne 0) {
  Write-Host "Seed failed (exit $code). Is Postgres running on port 5438?" -ForegroundColor Red
  exit $code
}

Write-Host ""
Write-Host "Done. Refresh AI Revenue Predictor in the browser." -ForegroundColor Green
Write-Host ""
