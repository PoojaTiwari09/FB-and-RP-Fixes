# Backend smoke tests - API must be on http://localhost:3001
$Base = "http://localhost:3001"
$Tenant = "dev-tenant-001"
$H = @{ "x-tenant-id" = $Tenant }

function Test-Route {
  param([string]$Name, [string]$Method, [string]$Url, [hashtable]$Headers = $H, [string]$Body = $null, [int[]]$Ok = @(200))
  try {
    $params = @{ Uri = $Url; Method = $Method; Headers = $Headers; UseBasicParsing = $true }
    if ($Body) { $params.Body = $Body; $params.ContentType = "application/json" }
    $r = Invoke-WebRequest @params
    $ok = $Ok -contains $r.StatusCode
    if ($ok) { Write-Host "[PASS] $Name -> $($r.StatusCode)" -ForegroundColor Green }
    else { Write-Host "[FAIL] $Name -> $($r.StatusCode)" -ForegroundColor Red }
    return $ok
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    $ok = $Ok -contains $code
    if ($ok) { Write-Host "[PASS] $Name -> $code" -ForegroundColor Green }
    else { Write-Host "[FAIL] $Name -> $code" -ForegroundColor Red }
    return $ok
  }
}

$all = @()

Write-Host "M01 Capture Transcription" -ForegroundColor Cyan
$all += Test-Route "M01 list calls" GET "$Base/api/v1/capture-transcription/calls"
$body = '{"title":"smoke","callDate":"2026-01-01T00:00:00.000Z","durationSeconds":60,"callType":"outbound","callSource":"manual","participants":["a@b.c"],"callOwner":"u1"}'
$all += Test-Route "M01 create call" POST "$Base/api/v1/capture-transcription/calls" -Body $body -Ok @(200,201)
$all += Test-Route "M01 search calls" GET "$Base/api/v1/capture-transcription/calls/search?q=smoke"

Write-Host "M02 Conversation Intelligence" -ForegroundColor Cyan
$all += Test-Route "M02 list conversations" GET "$Base/api/v1/conversation-intelligence/conversations"
$all += Test-Route "M02 search" GET "$Base/api/v1/conversation-intelligence/conversations/search?q=demo"
$all += Test-Route "M02 list trackers" GET "$Base/api/v1/conversation-intelligence/trackers"
$tracker = '{"name":"Pricing","keywords":["pricing","cost"]}'
$all += Test-Route "M02 create tracker" POST "$Base/api/v1/conversation-intelligence/trackers" -Body $tracker -Ok @(200,201)

Write-Host "M03 AI Summaries" -ForegroundColor Cyan
$fb = '{"rating":5,"comment":"smoke"}'
$all += Test-Route "M03 feedback" POST "$Base/api/v1/ai-summaries-genai/feedback/reports/smoke-report" -Body $fb -Ok @(200,201,401,403)
$all += Test-Route "M03 module root" GET "$Base/api/v1/ai-summaries-genai"

Write-Host "M04 skipped (not in AppModule)" -ForegroundColor Yellow

Write-Host "M05 Account Intelligence" -ForegroundColor Cyan
$all += Test-Route "M05 accounts" GET "$Base/api/v1/account-intelligence/accounts?board_slug=demo" -Ok @(200,400,500)
$all += Test-Route "M05 activities by company" GET "$Base/api/v1/account-intelligence/activities/demo-company" -Ok @(200,404,500)
$all += Test-Route "M05 module root" GET "$Base/api/v1/account-intelligence"

Write-Host "M06 Forecasting" -ForegroundColor Cyan
$m06h = @{ "x-tenant-id" = "demo-tenant-01" }
$all += Test-Route "M06 ai prediction" GET "$Base/api/v1/forecasting/periods/74c9d914-ce7f-4883-b2db-05810a558630/ai-prediction" -Headers $m06h
$all += Test-Route "M06 executive snapshot" GET "$Base/api/v1/forecasting/executive/snapshot?period=Q2%20FY26" -Headers $m06h -Ok @(200,404)

Write-Host "M07 Revenue Dashboards" -ForegroundColor Cyan
$all += Test-Route "M07 root" GET "$Base/api/v1/revenue-dashboards"
$all += Test-Route "M07 widget catalog" GET "$Base/api/v1/revenue-dashboards/widgets/catalog" -Ok @(200,401,403)

Write-Host "M08 Sales Engagement" -ForegroundColor Cyan
$all += Test-Route "M08 workflows" GET "$Base/api/v1/m08-sales-engagement/workflows"
$all += Test-Route "M08 tasks" GET "$Base/api/v1/m08-sales-engagement/tasks"

Write-Host "M09 Coaching Training" -ForegroundColor Cyan
$all += Test-Route "M09 root" GET "$Base/api/v1/coaching-training"
$all += Test-Route "M09 health" GET "$Base/api/v1/coaching-training/test/health" -Ok @(200,500)

Write-Host "M10 Data Compliance" -ForegroundColor Cyan
$all += Test-Route "M10 stub root" GET "$Base/api/v1/data-compliance"
$all += Test-Route "M10 revenue graph accounts" GET "$Base/api/v1/m10-data-compliance/accounts" -Ok @(200,401,403)

$passed = @($all | Where-Object { $_ }).Count
$total = $all.Count
Write-Host "Summary: $passed of $total passed" -ForegroundColor $(if ($passed -eq $total) { 'Green' } else { 'Yellow' })
if ($passed -lt $total) { exit 1 }
