# Health check for unified API on :3001 (run after start-demo.ps1)
$h = @{
  "x-tenant-id" = "00000000-0000-0000-0000-000000000001"
  "x-user-id"   = "00000000-0000-0000-0000-000000000003"
}

$base = "http://localhost:3001"
$checks = @(
  @{ Name = "M01 calls"; Url = "$base/api/calls?page=1&size=1" }
  @{ Name = "M02 search"; Url = "$base/api/search/calls?tab=calls&page=1&size=1" }
  @{ Name = "M09 trainings"; Url = "$base/api/trainings" }
)

Write-Host ""
Write-Host "=== Unified API health check (:3001) ===" -ForegroundColor Cyan
$ok = 0
foreach ($c in $checks) {
  try {
    $r = Invoke-WebRequest -Uri $c.Url -Headers $h -UseBasicParsing -TimeoutSec 8
    Write-Host "  OK   $($c.Name) -> $($r.StatusCode)" -ForegroundColor Green
    $ok++
  } catch {
    Write-Host "  FAIL $($c.Name) $($c.Url)" -ForegroundColor Red
    Write-Host "       $($_.Exception.Message)" -ForegroundColor DarkRed
  }
}
Write-Host ""
if ($ok -eq 3) {
  Write-Host "API is up. Open http://localhost:3000/engage" -ForegroundColor Green
} else {
  Write-Host "API not ready. Wait 10s and run again, or restart:" -ForegroundColor Yellow
  Write-Host '  .\stop-demo.ps1' -ForegroundColor Gray
  Write-Host '  .\start-demo.ps1' -ForegroundColor Gray
}
Write-Host ""
