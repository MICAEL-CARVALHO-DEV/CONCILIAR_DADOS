param(
  [int]$ApiPort = 8000,
  [int]$FrontPort = 5500,
  [switch]$NoOpenBrowser
)

$ErrorActionPreference = "Stop"

$startTudo = Join-Path $PSScriptRoot "start_tudo.ps1"

if (-not (Test-Path $startTudo)) {
  throw "Script base nao encontrado: $startTudo"
}

Write-Host ""
Write-Host "=== START LOCAL TOTAL ===" -ForegroundColor Cyan
Write-Host "API   : http://127.0.0.1:$ApiPort" -ForegroundColor Green
Write-Host "Front : http://127.0.0.1:$FrontPort/login.html" -ForegroundColor Green
Write-Host ""
Write-Host "Pre-requisito para Google local:" -ForegroundColor Yellow
Write-Host "- Autorizar no Google Cloud as origens da porta $FrontPort" -ForegroundColor Yellow
Write-Host "  http://localhost:$FrontPort" -ForegroundColor Yellow
Write-Host "  http://127.0.0.1:$FrontPort" -ForegroundColor Yellow
Write-Host ""

& $startTudo -ApiPort $ApiPort -FrontPort $FrontPort

if ($NoOpenBrowser) {
  Write-Host "Observacao: o navegador foi aberto pelo start_tudo.ps1. Use -NoOpenBrowser apenas como lembrete operacional." -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "Validacao rapida:" -ForegroundColor Cyan
Write-Host "1. API:   http://localhost:$ApiPort/health" -ForegroundColor White
Write-Host "2. Login: http://127.0.0.1:$FrontPort/login.html" -ForegroundColor White
Write-Host "3. Cadastro: http://127.0.0.1:$FrontPort/cadastro.html?next=index.html" -ForegroundColor White
Write-Host ""
