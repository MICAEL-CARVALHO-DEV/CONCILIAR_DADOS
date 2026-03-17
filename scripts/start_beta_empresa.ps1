param(
  [int]$ApiPort = 8000,
  [int]$FrontPort = 5511,
  [switch]$NoOpenBrowser
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$startTudo = Join-Path $PSScriptRoot "start_tudo.ps1"

if (-not (Test-Path $startTudo)) {
  throw "Script base nao encontrado: $startTudo"
}

Write-Host ""
Write-Host "=== BETA EMPRESA - START ===" -ForegroundColor Cyan
Write-Host "Projeto: $root" -ForegroundColor DarkCyan
Write-Host "API:     http://127.0.0.1:$ApiPort" -ForegroundColor Green
Write-Host "Front:   http://127.0.0.1:$FrontPort/index.html" -ForegroundColor Green
Write-Host ""

& $startTudo -ApiPort $ApiPort -FrontPort $FrontPort

if (-not $NoOpenBrowser) {
  Start-Sleep -Milliseconds 600
  Start-Process "http://127.0.0.1:$FrontPort/index.html"
}

Write-Host ""
Write-Host "Pronto. Terminais de API e Front foram abertos." -ForegroundColor Cyan
Write-Host "Use o script de validacao para carimbo rapido:" -ForegroundColor White
Write-Host "powershell -ExecutionPolicy Bypass -File .\\scripts\\validar_beta_empresa.ps1 -FrontPort $FrontPort -ApiPort $ApiPort" -ForegroundColor White
Write-Host ""

