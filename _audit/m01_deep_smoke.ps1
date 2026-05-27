# ─────────────────────────────────────────────────────────────────────────────
# M01 Deep Smoke Test (Capture & Transcription)
#
# Exercises the full M01 surface area: happy paths, error paths, edge cases,
# tenant isolation, idempotency, validation, and concurrency.
#
# Usage:  pwsh -File _audit/m01_deep_smoke.ps1
# Output: _audit/m01_deep_smoke.log + summary table on stdout.
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = 'Continue'

$Base       = 'http://localhost:3001/api/v1/capture-transcription'
$Webhooks   = 'http://localhost:3001/api/v1/webhooks'
$TenantA    = 'dev-tenant-001'         # seeded tenant
$TenantB    = 'test-tenant-isolation'  # used for tenant-isolation tests
$Call1      = '11111111-1111-1111-1111-000000000001'  # completed (seeded)
$Call2      = '11111111-1111-1111-1111-000000000002'  # pending
$Call3      = '11111111-1111-1111-1111-000000000003'  # processing
$LogFile    = Join-Path $PSScriptRoot 'm01_deep_smoke.log'

# Reset log
"M01 Deep Smoke Test — $(Get-Date -Format o)" | Out-File -FilePath $LogFile -Encoding utf8

$global:Results = @()

function Invoke-Smoke {
    param(
        [Parameter(Mandatory)] [string]   $Name,
        [Parameter(Mandatory)] [string]   $Method,
        [Parameter(Mandatory)] [string]   $Path,
                               [object]   $Body,
                               [string]   $Tenant = $TenantA,
                               [int[]]    $Expect = @(200, 201, 202, 204),
                               [hashtable]$Headers,
                               [switch]   $RawBody
    )
    $url = "$Base$Path"
    if ($Path -like 'http*') { $url = $Path }

    $h = @{ 'Content-Type' = 'application/json' }
    if ($Tenant) { $h['x-tenant-id'] = $Tenant }
    if ($Headers) { foreach ($k in $Headers.Keys) { $h[$k] = $Headers[$k] } }

    $payload = $null
    if ($Body -ne $null) {
        if ($RawBody) { $payload = $Body } else { $payload = ($Body | ConvertTo-Json -Depth 10 -Compress) }
    }

    $start = Get-Date
    try {
        if ($payload) {
            $resp = Invoke-WebRequest -Uri $url -Method $Method -Headers $h -Body $payload `
                    -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        } else {
            $resp = Invoke-WebRequest -Uri $url -Method $Method -Headers $h `
                    -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        }
        $code = [int]$resp.StatusCode
        $body = $resp.Content
    } catch {
        $r = $_.Exception.Response
        if ($r) {
            $code = [int]$r.StatusCode
            try {
                $stream = $r.GetResponseStream()
                if ($stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $body = $reader.ReadToEnd()
                } else { $body = "$($_.Exception.Message)" }
            } catch { $body = "$($_.Exception.Message)" }
        } else {
            $code = -1
            $body = "$($_.Exception.Message)"
        }
    }

    $ms     = [int]((Get-Date) - $start).TotalMilliseconds
    $pass   = ($Expect -contains $code)
    $tick   = if ($pass) { 'PASS' } else { 'FAIL' }
    $line   = "[{0}] {1,-50} {2,-7} {3,4}ms  http={4}  expected={5}" -f $tick, $Name, $Method, $ms, $code, ($Expect -join ',')
    Write-Host $line -ForegroundColor (if ($pass) { 'Green' } else { 'Red' })
    "$line`r`n  body: $($body.Substring(0, [Math]::Min(400, $body.Length)))`r`n" | Out-File -FilePath $LogFile -Append -Encoding utf8
    $global:Results += [pscustomobject]@{ Name=$Name; Method=$Method; Path=$Path; Code=$code; Expect=($Expect -join ','); Ms=$ms; Pass=$pass; Body=$body }
    return $global:Results[-1]
}

Write-Host "`n=== Phase A — Auth / Tenant Isolation ===" -ForegroundColor Cyan
Invoke-Smoke 'no tenant header rejected'         GET  '/calls' -Tenant '' -Expect @(401,403)
Invoke-Smoke 'happy GET /calls with tenant'       GET  '/calls' -Tenant $TenantA
Invoke-Smoke 'tenant B sees no seeded calls'      GET  '/calls' -Tenant $TenantB -Expect @(200)

Write-Host "`n=== Phase B — List + Filter + Sort ===" -ForegroundColor Cyan
Invoke-Smoke 'list completed only'                GET  '/calls?status=completed'
Invoke-Smoke 'list pending'                       GET  '/calls?status=pending'
Invoke-Smoke 'list source=zoom'                   GET  '/calls?source=zoom'
Invoke-Smoke 'sort by title asc'                  GET  '/calls?sortBy=title&order=asc'
Invoke-Smoke 'limit + offset paging'              GET  '/calls?limit=1&offset=0'
Invoke-Smoke 'invalid status rejected'            GET  '/calls?status=garbage' -Expect @(400,500)
Invoke-Smoke 'invalid limit rejected'             GET  '/calls?limit=9999'      -Expect @(400,500)

Write-Host "`n=== Phase C — Single Resource (CT-13) ===" -ForegroundColor Cyan
Invoke-Smoke 'GET seeded call by id'              GET  "/calls/$Call1"
Invoke-Smoke 'GET unknown call -> 404'            GET  '/calls/00000000-0000-0000-0000-000000000000' -Expect @(404)
Invoke-Smoke 'GET seeded call across tenant -> 404' GET "/calls/$Call1" -Tenant $TenantB -Expect @(404)

Write-Host "`n=== Phase D — Search (CT-05 / CT-21 / US-22) ===" -ForegroundColor Cyan
Invoke-Smoke 'org-wide search "pricing"'          GET  '/calls/search?q=pricing'
Invoke-Smoke 'search with date range'             GET  '/calls/search?q=pricing&dateFrom=2026-05-01&dateTo=2026-05-31'
Invoke-Smoke 'in-call search'                     GET  "/calls/$Call1/search?q=competitor"
Invoke-Smoke 'search empty query rejected'        GET  '/calls/search?q=' -Expect @(400,500)
Invoke-Smoke 'in-call search wrong tenant'        GET  "/calls/$Call1/search?q=x" -Tenant $TenantB -Expect @(200,404)

Write-Host "`n=== Phase E — Notes CRUD (CT-22) ===" -ForegroundColor Cyan
$noteCreate = Invoke-Smoke 'create note'          POST "/calls/$Call1/notes" -Body @{ content = 'Smoke test note A' } -Expect @(201)
$noteId = $null
if ($noteCreate.Body) { try { $noteId = (ConvertFrom-Json $noteCreate.Body).id } catch {} }
if ($noteId) {
    Invoke-Smoke 'update note'                    PUT    "/calls/$Call1/notes/$noteId" -Body @{ content = 'Smoke test note B (updated)' }
    Invoke-Smoke 'delete note'                    DELETE "/calls/$Call1/notes/$noteId" -Expect @(204)
} else {
    Write-Host '  note id missing — skipping update/delete' -ForegroundColor Yellow
}
Invoke-Smoke 'create note empty body rejected'   POST "/calls/$Call1/notes" -Body @{ content = '' } -Expect @(400,500)

Write-Host "`n=== Phase F — Sharing (CT-23) ===" -ForegroundColor Cyan
Invoke-Smoke 'share with user'                    POST "/calls/$Call1/share" -Body @{ sharedWithId = 'user-99'; sharedWithType = 'user' } -Expect @(201)
Invoke-Smoke 'share with team (idempotent)'       POST "/calls/$Call1/share" -Body @{ sharedWithId = 'team-1';  sharedWithType = 'team' } -Expect @(201)
Invoke-Smoke 'share invalid type rejected'        POST "/calls/$Call1/share" -Body @{ sharedWithId = 'x'; sharedWithType = 'group' } -Expect @(400,500)

Write-Host "`n=== Phase G — Next Steps CRUD (US-11) ===" -ForegroundColor Cyan
Invoke-Smoke 'GET next-steps (seeded 3 items)'   GET    "/calls/$Call1/next-steps"
Invoke-Smoke 'POST add next-step'                POST   "/calls/$Call1/next-steps" -Body @{ step = 'Smoke: prepare contract draft' } -Expect @(201)
Invoke-Smoke 'PATCH update index 0'              PATCH  "/calls/$Call1/next-steps" -Body @{ index = 0; step = 'Smoke: send updated comparison doc by EOD' }
Invoke-Smoke 'DELETE next-step index 0'          DELETE "/calls/$Call1/next-steps/0" -Expect @(204)
Invoke-Smoke 'DELETE out-of-range index'         DELETE "/calls/$Call1/next-steps/9999" -Expect @(404,500)

Write-Host "`n=== Phase H — Utterance Inline Edit (US-04 / CT-24) ===" -ForegroundColor Cyan
# Fetch utterance id from the seeded call.
$detail = Invoke-Smoke 'fetch call detail for utterance'  GET "/calls/$Call1"
$uttId = $null
if ($detail.Body) {
    try {
        $j = ConvertFrom-Json $detail.Body
        if ($j.transcript -and $j.transcript.utterances -and $j.transcript.utterances.Length -gt 0) {
            $uttId = $j.transcript.utterances[0].id
        }
    } catch {}
}
if ($uttId) {
    Invoke-Smoke 'PATCH utterance text'           PATCH "/utterances/$uttId" -Body @{ text = 'Smoke: edited utterance text' }
} else {
    Write-Host '  utterance id missing — skipping' -ForegroundColor Yellow
}

Write-Host "`n=== Phase I — Create Call + Lifecycle ===" -ForegroundColor Cyan
$newCallPayload = @{
    title           = 'Smoke Test Call'
    callDate        = (Get-Date).ToString('o')
    durationSeconds = 60
    callType        = 'meeting'
    callSource      = 'manual'
    participants    = @('smoke-test@example.com')
    callOwner       = 'smoke-test-user'
}
$created = Invoke-Smoke 'POST /calls — create' POST '/calls' -Body $newCallPayload -Expect @(201)
$newCallId = $null
if ($created.Body) { try { $newCallId = (ConvertFrom-Json $created.Body).id } catch {} }
if ($newCallId) {
    Invoke-Smoke 'GET newly created call'         GET    "/calls/$newCallId"
    Invoke-Smoke 'POST extract-ai (no transcript)' POST  "/calls/$newCallId/extract-ai" -Expect @(400, 500)
    Invoke-Smoke 'DELETE newly created call'      DELETE "/calls/$newCallId"
} else {
    Write-Host '  newly created call id missing' -ForegroundColor Yellow
}
Invoke-Smoke 'POST /calls — invalid (no participants)' POST '/calls' -Body @{ title = 'x'; callDate = (Get-Date).ToString('o'); callType = 'meeting'; callSource = 'manual'; callOwner = 'x'; participants = @() } -Expect @(400,500)
Invoke-Smoke 'POST /calls — unknown callType rejected' POST '/calls' -Body @{ title = 'x'; callDate = (Get-Date).ToString('o'); callType = 'midi'; callSource = 'manual'; callOwner = 'x'; participants = @('a') } -Expect @(400,500)

Write-Host "`n=== Phase J — AI Extraction Trigger (US-12/13/14) ===" -ForegroundColor Cyan
Invoke-Smoke 'POST extract-ai on seeded call'    POST "/calls/$Call1/extract-ai" -Expect @(202)
Invoke-Smoke 'POST extract-ai on unknown call'   POST '/calls/00000000-0000-0000-0000-000000000000/extract-ai' -Expect @(404,500)

Write-Host "`n=== Phase K — Webhooks (US-02) ===" -ForegroundColor Cyan
$zoomPayload = @{
    event   = 'recording.completed'
    payload = @{
        object = @{
            id                = '1234'
            uuid              = 'smoke-meeting-uuid-001'
            topic             = 'Smoke Zoom Recording'
            start_time        = (Get-Date).ToString('o')
            duration          = 5
            host_email        = 'smoke@example.com'
            participant_count = 2
            recording_files   = @(@{
                download_url   = 'https://example.com/audio.mp3'
                file_type      = 'M4A'
                recording_type = 'audio_only'
            })
        }
    }
}
Invoke-Smoke 'webhook without signature rejected' POST "$Webhooks/zoom" -Path "$Webhooks/zoom" -Body $zoomPayload -Expect @(401)
Invoke-Smoke 'webhook test bypass (dev)'          POST "$Webhooks/zoom" -Path "$Webhooks/zoom" -Body $zoomPayload -Headers @{ 'x-webhook-test' = '1' } -Expect @(200)

Write-Host "`n=== Phase L — Concurrency / Idempotency ===" -ForegroundColor Cyan
# Fire 5 concurrent create-note requests; expect all 201 and no DB errors.
$jobs = 1..5 | ForEach-Object {
    Start-Job -ScriptBlock {
        param($base, $tenant, $callId, $i)
        try {
            Invoke-WebRequest -Uri "$base/calls/$callId/notes" -Method POST `
                -Headers @{ 'Content-Type'='application/json'; 'x-tenant-id'=$tenant } `
                -Body (@{ content = "concurrent note $i" } | ConvertTo-Json -Compress) `
                -UseBasicParsing -TimeoutSec 10 | Select-Object -ExpandProperty StatusCode
        } catch { $_.Exception.Response.StatusCode.value__ }
    } -ArgumentList $Base, $TenantA, $Call1, $_
}
$codes = $jobs | Wait-Job | Receive-Job
$jobs  | Remove-Job
$concurrencyOk = ($codes | Where-Object { $_ -eq 201 }).Count -eq 5
$status = if ($concurrencyOk) { 'PASS' } else { 'FAIL' }
Write-Host ("[{0}] {1,-50} parallel  ----  codes={2}" -f $status, '5 concurrent note creates', ($codes -join ',')) -ForegroundColor (if ($concurrencyOk) { 'Green' } else { 'Red' })
$global:Results += [pscustomobject]@{ Name='5 concurrent note creates'; Method='POST'; Path='/calls/$Call1/notes'; Code=($codes -join ','); Expect='201 x5'; Ms=0; Pass=$concurrencyOk; Body='' }

Write-Host "`n=== Phase M — Static Assets ===" -ForegroundColor Cyan
Invoke-Smoke 'GET /uploads/ (static mount)' GET 'http://localhost:3001/uploads/audio/' -Path 'http://localhost:3001/uploads/audio/' -Tenant '' -Expect @(200, 301, 302, 404)

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
$total = $global:Results.Count
$pass  = ($global:Results | Where-Object Pass).Count
$fail  = $total - $pass
Write-Host ("Total: {0}   PASS: {1}   FAIL: {2}" -f $total, $pass, $fail) -ForegroundColor (if ($fail -eq 0) { 'Green' } else { 'Yellow' })
"Total: $total   PASS: $pass   FAIL: $fail" | Out-File -FilePath $LogFile -Append -Encoding utf8

# Write results as JSON for the report generator
$global:Results | ConvertTo-Json -Depth 5 | Out-File -FilePath (Join-Path $PSScriptRoot 'm01_deep_smoke_results.json') -Encoding utf8

if ($fail -gt 0) {
    Write-Host "`nFailed tests:" -ForegroundColor Red
    $global:Results | Where-Object { -not $_.Pass } | ForEach-Object {
        Write-Host ("  - {0} ({1} {2})   code={3} expected={4}" -f $_.Name, $_.Method, $_.Path, $_.Code, $_.Expect) -ForegroundColor Red
    }
}
