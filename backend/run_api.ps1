$base = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $base

if (-not (Test-Path '.\.venv\Scripts\python.exe')) {
  Write-Host 'Criando venv...'
  py -3.13 -m venv .venv
}

Write-Host 'Instalando/atualizando dependencias...'
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -r requirements.txt

Write-Host 'Subindo API FastAPI em http://localhost:8000 ...'
.\.venv\Scripts\python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
