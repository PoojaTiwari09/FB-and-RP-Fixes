# Free new Figma UI ports (3000, 3010-3014) when EADDRINUSE after a previous demo run
# Usage: .\free-ui-ports.ps1

$Ports = @(3000, 3010, 3011, 3012, 3013, 3014)

foreach ($port in $Ports) {
  $lines = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
  foreach ($line in $lines) {
    $procId = ($line -split '\s+')[-1]
    if ($procId -match '^\d+$') {
      Write-Host "Stopping PID $procId on port $port"
      Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
    }
  }
}

Write-Host "UI ports cleared: $($Ports -join ', ')"
