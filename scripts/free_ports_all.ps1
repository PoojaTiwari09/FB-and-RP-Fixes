# Free all standalone module dev ports (M01–M10)
$root = Split-Path $PSScriptRoot -Parent
& "$PSScriptRoot\free_ports_m01_m02.ps1"
& "$PSScriptRoot\free_ports_m03.ps1"
& "$PSScriptRoot\free_ports_m05.ps1"
& "$PSScriptRoot\free_ports_m07.ps1"
& "$PSScriptRoot\free_ports_m09.ps1"
& "$PSScriptRoot\free_ports_m10.ps1"
Write-Host "All module ports cleared: 3001,3002,5174,5175,4010,5177,4012,5179,4013,5180,4009,5176,4011,5178"
