# Start M01+M02 decentralised stack (requires Docker Postgres on 5433)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$ri = Join-Path $root "boilerplate code\r-revenue-intelligence"

$env:DATABASE_URL = "postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
$env:M02_API_URL = "http://localhost:3002"
$env:M01_API_PORT = "3001"
$env:M02_API_PORT = "3002"

Write-Host "Starting m01-api (3001), m02-api (3002), m01-web (5174), m02-web (5175)..."
Push-Location $ri
try {
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ri'; `$env:DATABASE_URL='$($env:DATABASE_URL)'; `$env:M02_API_URL='$($env:M02_API_URL)'; pnpm --filter m01-api run dev"
  Start-Sleep -Seconds 2
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ri'; `$env:DATABASE_URL='$($env:DATABASE_URL)'; pnpm --filter m02-api run dev"
  Start-Sleep -Seconds 2
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ri'; pnpm --dir 'apps/web/src/modules/m01-capture-transcription' run dev"
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ri'; pnpm --dir 'apps/web/src/modules/m02-conversation-intelligence' run dev"
  Write-Host "Done. M01: http://localhost:5174  M02: http://localhost:5175"
} finally {
  Pop-Location
}
