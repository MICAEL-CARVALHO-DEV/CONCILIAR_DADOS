$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "[front] iniciando servidor em http://127.0.0.1:5500"
python -m http.server 5500 --bind 127.0.0.1
