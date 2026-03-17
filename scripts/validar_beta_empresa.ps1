param(
  [int]$ApiPort = 8000,
  [int]$FrontPort = 5511,
  [switch]$RequireAuthSmoke
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$appJs = Join-Path $root "app.js"
$indexHtml = Join-Path $root "index.html"
$smokeLocal = Join-Path $PSScriptRoot "smoke_summary_local.ps1"
$smokeEndpoints = Join-Path $PSScriptRoot "smoke_summary_endpoints.ps1"

$failed = $false
$results = New-Object System.Collections.ArrayList

function Add-Result([string]$step, [string]$status, [string]$detail) {
  $null = $results.Add([pscustomobject]@{
    Step = $step
    Status = $status
    Detail = $detail
  })
}

function Run-Step([string]$step, [scriptblock]$action) {
  try {
    & $action
    Add-Result $step "PASSOU" ""
  } catch {
    $script:failed = $true
    Add-Result $step "FALHOU" $_.Exception.Message
  }
}

Write-Host ""
Write-Host "=== BETA EMPRESA - VALIDACAO ===" -ForegroundColor Cyan
Write-Host "Projeto: $root" -ForegroundColor DarkCyan
Write-Host "Front alvo: http://127.0.0.1:$FrontPort/index.html" -ForegroundColor Green
Write-Host "API alvo:   http://127.0.0.1:$ApiPort/health" -ForegroundColor Green
Write-Host ""

Run-Step "Sintaxe JS (app.js)" {
  if (-not (Test-Path $appJs)) { throw "Arquivo nao encontrado: $appJs" }
  node --check $appJs | Out-Null
}

Run-Step "Compilacao Python (backend)" {
  $files = @(
    "backend/app/main.py",
    "backend/app/models.py",
    "backend/app/schemas.py",
    "backend/app/db.py"
  ) | ForEach-Object { Join-Path $root $_ }
  foreach ($f in $files) {
    if (-not (Test-Path $f)) { throw "Arquivo nao encontrado: $f" }
  }
  py -3 -m py_compile $files | Out-Null
}

Run-Step "Front online + IDs criticos" {
  if (-not (Test-Path $indexHtml)) { throw "Arquivo nao encontrado: $indexHtml" }
  $res = Invoke-WebRequest -Uri "http://127.0.0.1:$FrontPort/index.html" -UseBasicParsing -TimeoutSec 8
  if ([int]$res.StatusCode -lt 200 -or [int]$res.StatusCode -ge 400) {
    throw "Front sem resposta valida. Status: $($res.StatusCode)"
  }
  $html = [string]$res.Content
  $criticalIds = @(
    "workspaceContextBar",
    "mainFiltersCard",
    "importReport",
    "mainTableCard",
    "tbody",
    "statusFilter",
    "yearFilter",
    "searchInput",
    "betaWorkspace",
    "modal",
    "btnExportAtuais",
    "btnExportHistorico",
    "btnProfile",
    "btnLogout"
  )
  foreach ($id in $criticalIds) {
    if ($html -notmatch ('id="' + [Regex]::Escape($id) + '"')) {
      throw "ID critico ausente no front: $id"
    }
  }
}

Run-Step "API health" {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:$ApiPort/health" -Method GET -TimeoutSec 8
  if ($null -eq $health) { throw "Health retornou vazio." }
}

Run-Step "Smoke local (resumos e regras-chave)" {
  if (-not (Test-Path $smokeLocal)) { throw "Script nao encontrado: $smokeLocal" }
  powershell -ExecutionPolicy Bypass -File $smokeLocal | Out-Null
}

$ownerUser = [string]($env:SEC_OWNER_USER)
$ownerPass = [string]($env:SEC_OWNER_PASS)
$canRunAuthSmoke = (-not [string]::IsNullOrWhiteSpace($ownerUser)) -and (-not [string]::IsNullOrWhiteSpace($ownerPass))

if ($canRunAuthSmoke) {
  Run-Step "Smoke autenticado (endpoints publicados)" {
    if (-not (Test-Path $smokeEndpoints)) { throw "Script nao encontrado: $smokeEndpoints" }
    powershell -ExecutionPolicy Bypass -File $smokeEndpoints -BaseUrl "http://127.0.0.1:$ApiPort" -UserName $ownerUser -Password $ownerPass | Out-Null
  }
} elseif ($RequireAuthSmoke) {
  $failed = $true
  Add-Result "Smoke autenticado (endpoints publicados)" "FALHOU" "Defina SEC_OWNER_USER e SEC_OWNER_PASS para executar."
} else {
  Add-Result "Smoke autenticado (endpoints publicados)" "SKIP" "Credenciais SEC_OWNER_* nao definidas; validacao opcional ignorada."
}

Write-Host ""
Write-Host "Resumo da validacao beta:" -ForegroundColor Cyan
$results | Format-Table -AutoSize

if ($failed) {
  Write-Host ""
  Write-Host "BETA AINDA NAO PRONTA: existe(m) falha(s) bloqueadora(s)." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "BETA PRONTA PARA HOMOLOGACAO: validacao automatica passou." -ForegroundColor Green
exit 0

