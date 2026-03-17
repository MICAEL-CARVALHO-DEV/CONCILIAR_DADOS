param(
  [int]$ApiPort = 8000,
  [switch]$RunAuthSmoke
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$smokeLocal = Join-Path $PSScriptRoot "smoke_summary_local.ps1"
$smokeEndpoints = Join-Path $PSScriptRoot "smoke_summary_endpoints.ps1"

Write-Host ""
Write-Host "=== ALINHAMENTO RAPIDO BACKEND ===" -ForegroundColor Cyan
Write-Host "Projeto: $root" -ForegroundColor DarkCyan

Set-Location $root

Write-Host "[1/4] compilando backend..." -ForegroundColor White
py -3 -m py_compile backend/app/main.py backend/app/models.py backend/app/schemas.py backend/app/db.py backend/app/services/dashboard_service.py backend/app/services/audit_service.py backend/app/api/operations.py

Write-Host "[2/4] smoke local de contratos..." -ForegroundColor White
powershell -ExecutionPolicy Bypass -File $smokeLocal

Write-Host "[3/4] health da API publicada local..." -ForegroundColor White
try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:$ApiPort/health" -Method GET -TimeoutSec 6
  Write-Host "health ok: $($health.ok)" -ForegroundColor Green
} catch {
  Write-Host "health nao acessivel em http://127.0.0.1:$ApiPort/health (segue alinhamento local mesmo assim)." -ForegroundColor Yellow
}

if ($RunAuthSmoke) {
  Write-Host "[4/4] smoke autenticado..." -ForegroundColor White
  if (-not $env:SEC_OWNER_USER -or -not $env:SEC_OWNER_PASS) {
    throw "Defina SEC_OWNER_USER e SEC_OWNER_PASS para -RunAuthSmoke."
  }
  powershell -ExecutionPolicy Bypass -File $smokeEndpoints -BaseUrl "http://127.0.0.1:$ApiPort" -UserName $env:SEC_OWNER_USER -Password $env:SEC_OWNER_PASS
} else {
  Write-Host "[4/4] smoke autenticado (opcional) nao executado." -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "Backend alinhado com sucesso para beta (validacao rapida)." -ForegroundColor Green
Write-Host ""

