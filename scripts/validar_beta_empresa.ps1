param(
  [int]$ApiPort = 8000,
  [int]$FrontPort = 5511,
  [switch]$RequireAuthSmoke,
  [switch]$NoAutoStartFront
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$appJs = Join-Path $root "app.js"
$indexHtml = Join-Path $root "index.html"
$smokeLocal = Join-Path $PSScriptRoot "smoke_summary_local.ps1"
$smokeEndpoints = Join-Path $PSScriptRoot "smoke_summary_endpoints.ps1"

$failed = $false
$results = New-Object System.Collections.ArrayList
$autoStartedFrontProcess = $null
$frontUrl = "http://127.0.0.1:$FrontPort/index.html"

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

function Test-FrontOnline([string]$url) {
  try {
    $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
    $status = [int]$res.StatusCode
    return ($status -ge 200 -and $status -lt 400)
  } catch {
    return $false
  }
}

function Ensure-FrontOnline() {
  if (Test-FrontOnline $frontUrl) { return }
  if ($NoAutoStartFront) {
    throw "Front offline em $frontUrl. Inicie o front antes de validar."
  }

  Write-Host "[validacao] front offline; iniciando servidor local temporario na porta $FrontPort..." -ForegroundColor Yellow
  $script:autoStartedFrontProcess = Start-Process -FilePath "py" -ArgumentList @("-3", "-m", "http.server", "$FrontPort", "--bind", "127.0.0.1") -WorkingDirectory $root -PassThru -WindowStyle Hidden

  $attempts = 20
  for ($i = 0; $i -lt $attempts; $i++) {
    Start-Sleep -Milliseconds 350
    if (Test-FrontOnline $frontUrl) { return }
  }

  throw "Nao foi possivel subir o front temporario em $frontUrl."
}

function Cleanup-AutoStartedFront() {
  if (-not $script:autoStartedFrontProcess) { return }
  try {
    if (-not $script:autoStartedFrontProcess.HasExited) {
      Stop-Process -Id $script:autoStartedFrontProcess.Id -Force -ErrorAction SilentlyContinue
    }
  } catch {
    # no-op
  }
}

Write-Host ""
Write-Host "=== BETA EMPRESA - VALIDACAO ===" -ForegroundColor Cyan
Write-Host "Projeto: $root" -ForegroundColor DarkCyan
Write-Host "Front alvo: $frontUrl" -ForegroundColor Green
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
  Ensure-FrontOnline
  $res = Invoke-WebRequest -Uri $frontUrl -UseBasicParsing -TimeoutSec 8
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
  Cleanup-AutoStartedFront
  Write-Host ""
  Write-Host "BETA AINDA NAO PRONTA: existe(m) falha(s) bloqueadora(s)." -ForegroundColor Red
  exit 1
}

Cleanup-AutoStartedFront
Write-Host ""
Write-Host "BETA PRONTA PARA HOMOLOGACAO: validacao automatica passou." -ForegroundColor Green
exit 0
