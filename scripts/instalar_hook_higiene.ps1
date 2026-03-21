param(
  [switch]$SkipTest
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

if (-not (Test-Path ".githooks/pre-commit")) {
  throw "Hook nao encontrado em .githooks/pre-commit"
}

git config --local core.hooksPath .githooks
Write-Host "[hook] core.hooksPath configurado para .githooks" -ForegroundColor Green

if (-not $SkipTest) {
  Write-Host "[hook] executando teste do check de higiene..." -ForegroundColor Cyan
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check_higiene_organizacao.ps1 -RepoRoot . -WarnOnly
}

Write-Host "[hook] pronto. O pre-commit de higiene esta ativo em modo warn-only." -ForegroundColor Green
