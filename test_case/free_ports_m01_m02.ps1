# Free ports used by decentralised M01/M02 stack (stop monolith api on 3002 first)
param([int[]]$Ports = @(3001, 3002))

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
Write-Host "Ports $($Ports -join ', ') cleared (if anything was listening)."
