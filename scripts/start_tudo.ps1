
param(
  [int]$ApiPort = 8000,
  [int]$FrontPort = 8081
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"

if (-not (Test-Path $backend)) {
  throw "Pasta backend nao encontrada: $backend"
}

function Get-LocalIPv4 {
  try {
    $ip = Get-NetIPAddress -AddressFamily IPv4 |
      Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
      Select-Object -First 1 -ExpandProperty IPAddress
    if ($ip) { return $ip }
  } catch {
    # fallback abaixo
  }
  return "127.0.0.1"
}

$lanIp = Get-LocalIPv4
$cors = "http://127.0.0.1:${FrontPort},http://localhost:${FrontPort},http://${lanIp}:${FrontPort}"

$apiCmd = @"
Set-Location '$backend'
`$env:CORS_ORIGINS = '$cors'
powershell -ExecutionPolicy Bypass -File '.\\run_api.ps1'
"@

$frontCmd = @"
Set-Location '$root'
py -3 -m http.server $FrontPort --bind 0.0.0.0
"@

Write-Host ""
Write-Host "Iniciando stack local..." -ForegroundColor Cyan
Write-Host "API   : http://127.0.0.1:$ApiPort" -ForegroundColor Green
Write-Host "Front : http://127.0.0.1:$FrontPort/login.html" -ForegroundColor Green
Write-Host "LAN   : http://${lanIp}:${FrontPort}/login.html" -ForegroundColor Yellow
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiCmd | Out-Null
Start-Sleep -Milliseconds 700
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontCmd | Out-Null
Start-Sleep -Milliseconds 700

Start-Process "http://127.0.0.1:$FrontPort/login.html"

Write-Host "Pronto. Dois terminais foram abertos (API + Front)." -ForegroundColor Cyan
Write-Host "Deixe os dois terminais abertos durante o uso."


