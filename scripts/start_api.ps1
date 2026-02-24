$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"

if (-not (Test-Path $backend)) {
  throw "Pasta backend nao encontrada em: $backend"
}

Set-Location $backend

if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
  Write-Host "[api] criando venv..."
  py -3.13 -m venv .venv
}

Write-Host "[api] instalando dependencias..."
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -r requirements.txt

if (-not (Test-Path ".\.env")) {
  Write-Host "[api] .env nao encontrado, aplicando SQLite local..."
  powershell -ExecutionPolicy Bypass -File .\switch_to_sqlite.ps1
}

Write-Host "[api] iniciando FastAPI em http://127.0.0.1:8000"
.\.venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
