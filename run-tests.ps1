$env:PORT=4011
$env:M10_STANDALONE_AUTH='true'
$env:ALLOW_DEV_HEADER_AUTH='true'
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"

Write-Host "Starting API on port 4011..."
$apiJob = Start-Process powershell -ArgumentList "-NoProfile", "-Command", "pnpm --filter api run start" -PassThru -WindowStyle Hidden

Write-Host "Waiting for API to start..."
Start-Sleep -Seconds 15

Write-Host "Running Newman tests..."
npx newman run m10-postman-collection.json

Write-Host "Stopping API..."
Stop-Process -Id $apiJob.Id -Force -ErrorAction SilentlyContinue
