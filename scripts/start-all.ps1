# start-all.ps1
# Script to launch Standalone Modules (1, 2, 3, 5, 7, 9, 10) for the Revenue Intelligence Monorepo

# Ensure ANSI / ASCII-safe output
$OutputEncoding = [System.Text.Encoding]::ASCII

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  REVENUE INTELLIGENCE - STANDALONE MODULES LAUNCHER  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

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

# Set global environment variables
$env:DATABASE_URL = "postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
$env:M10_DATABASE_URL = "postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
Write-Host "[v] Set DATABASE_URL and M10_DATABASE_URL to port 5438" -ForegroundColor Green

# 1. Verify Docker containers are running
Write-Host "[i] Checking Docker database and redis services..." -ForegroundColor Yellow
$dockerCheck = docker ps --filter "name=r-revenue-intelligence" --format "{{.Names}}"
if ($dockerCheck -eq $null -or $dockerCheck -eq "") {
    Write-Host "[!] Warning: No active r-revenue-intelligence Docker containers found." -ForegroundColor Red
    Write-Host "    Starting Docker Compose services..." -ForegroundColor Yellow
    docker-compose up -d postgres redis meilisearch clickhouse
    Start-Sleep -Seconds 3
} else {
    Write-Host "[v] Docker database and redis services are running." -ForegroundColor Green
}

# Define modules to run
$modules = @(
    @{ Id = 1;  Name = "M01 - Capture & Transcription";     Api = "dev:m01-api"; Web = "dev:m01-web"; ApiPort = 3001; WebPort = 5174 }
    @{ Id = 2;  Name = "M02 - Conversation Intelligence";    Api = "dev:m02-api"; Web = "dev:m02-web"; ApiPort = 3002; WebPort = 5175 }
    @{ Id = 3;  Name = "M03 - AI Summaries & GenAI";        Api = "dev:m03-api"; Web = "dev:m03-web"; ApiPort = 4010; WebPort = 5177 }
    @{ Id = 5;  Name = "M05 - Account Intelligence";        Api = "dev:m05-api"; Web = "dev:m05-web"; ApiPort = 4012; WebPort = 5179 }
    @{ Id = 7;  Name = "M07 - Revenue Dashboards";          Api = "dev:m07-api"; Web = "dev:m07-web"; ApiPort = 4013; WebPort = 5180 }
    @{ Id = 9;  Name = "M09 - Coaching & Training";         Api = "dev:m09-api"; Web = "dev:m09-web"; ApiPort = 4009; WebPort = 5176 }
    @{ Id = 10; Name = "M10 - Data & Compliance";           Api = "dev:m10-api"; Web = "dev:m10-web"; ApiPort = 4011; WebPort = 5178 }
)

Write-Host ""
Write-Host "Select what you want to launch:" -ForegroundColor Yellow
Write-Host "1) Launch BOTH APIs and Web Frontends for all modules (1, 2, 3, 5, 7, 9, 10)" -ForegroundColor White
Write-Host "2) Launch ONLY Backend APIs (1, 2, 3, 5, 7, 9, 10)" -ForegroundColor White
Write-Host "3) Launch ONLY Web Frontends (1, 2, 3, 5, 7, 9, 10)" -ForegroundColor White
Write-Host "4) Launch custom selection of modules" -ForegroundColor White
Write-Host "Q) Quit" -ForegroundColor White

Write-Host ""
$choice = Read-Host "Enter selection (1-4, Q)"
if ($choice -eq 'Q' -or $choice -eq 'q') {
    Write-Host "Exited." -ForegroundColor Yellow
    exit
}

$startApis = $false
$startWebs = $false
$selectedModules = @()

if ($choice -eq '1') {
    $startApis = $true
    $startWebs = $true
    $selectedModules = $modules
} elseif ($choice -eq '2') {
    $startApis = $true
    $selectedModules = $modules
} elseif ($choice -eq '3') {
    $startWebs = $true
    $selectedModules = $modules
} elseif ($choice -eq '4') {
    Write-Host ""
    Write-Host "Enter comma-separated module numbers to start (e.g. 1,2,5,10):" -ForegroundColor Yellow
    $modInput = Read-Host "Module IDs"
    $modIds = $modInput.Split(",") | ForEach-Object { [int]$_.Trim() }
    
    foreach ($m in $modules) {
        if ($modIds -contains $m.Id) {
            $selectedModules += $m
        }
    }
    
    Write-Host ""
    Write-Host "Start both API and Frontend?" -ForegroundColor Yellow
    Write-Host "1) Both API and Frontend"
    Write-Host "2) API only"
    Write-Host "3) Frontend only"
    $typeChoice = Read-Host "Selection"
    if ($typeChoice -eq '1') { $startApis = $true; $startWebs = $true }
    elseif ($typeChoice -eq '2') { $startApis = $true }
    elseif ($typeChoice -eq '3') { $startWebs = $true }
} else {
    Write-Host "Invalid choice. Starting both APIs and Frontends..." -ForegroundColor Yellow
    $startApis = $true
    $startWebs = $true
    $selectedModules = $modules
}

if ($selectedModules.Count -eq 0) {
    Write-Host "[!] No modules selected. Exiting." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Launching selected services..." -ForegroundColor Cyan

# Launch function
function Launch-Service {
    param(
        [string]$Title,
        [string]$Command,
        [int]$Port
    )
    
    Write-Host "Launching $Title on port $Port..." -ForegroundColor Gray
    
    # Construct window launch script setting env variables and launching pnpm
    $cmdString = "$Host.UI.RawUI.WindowTitle = '$Title'; " +
                 "`$env:DATABASE_URL = 'postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public'; " +
                 "`$env:M10_DATABASE_URL = 'postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public'; " +
                 "pnpm run $Command"
                 
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmdString -WindowStyle Normal
}

foreach ($m in $selectedModules) {
    if ($startApis) {
        Launch-Service -Title "$($m.Name) [API]" -Command $m.Api -Port $m.ApiPort
        Start-Sleep -Milliseconds 400
    }
    if ($startWebs) {
        Launch-Service -Title "$($m.Name) [WEB]" -Command $m.Web -Port $m.WebPort
        Start-Sleep -Milliseconds 400
    }
}

Write-Host ""
Write-Host "[v] Spawned requested services in separate PowerShell windows!" -ForegroundColor Green
Write-Host "* Active logs are visible in each window." -ForegroundColor White
Write-Host "* To stop any service, close its terminal window." -ForegroundColor White
Write-Host "* To free all ports later, run: .\scripts\free_ports_all.ps1" -ForegroundColor Yellow
Write-Host ""
