$srcRoot = "c:\Users\Relanto\OneDrive\INTEGRATION-105\r-revenue-intelligence-monorepo"
$destRoot = "C:\Users\Relanto\OneDrive - Relanto\Downloads\Integration-107\r-revenue-intelligence-monorepo"

# Get modified and untracked files from git
Push-Location $srcRoot
$files = git status --porcelain | ForEach-Object {
    $line = $_.trim()
    $parts = $line -split '\s+', 2
    $file = $parts[1]
    # Remove surrounding quotes if they exist
    if ($file -like '"*"') {
        $file = $file.Substring(1, $file.Length - 2)
    }
    $file
}
Pop-Location

foreach ($file in $files) {
    if ([string]::IsNullOrEmpty($file)) { continue }
    $srcFile = Join-Path $srcRoot $file
    $destFile = Join-Path $destRoot $file
    
    if (Test-Path $srcFile) {
        $parentDir = Split-Path $destFile -Parent
        if (-not (Test-Path $parentDir)) {
            New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
        }
        Copy-Item -Path $srcFile -Destination $destFile -Force
        Write-Host "Copied: $file" -ForegroundColor Green
    } else {
        Write-Host "Not found: $srcFile" -ForegroundColor Yellow
    }
}
