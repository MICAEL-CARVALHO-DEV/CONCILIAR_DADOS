Backend de teste - FastAPI + PostgreSQL/SQLite

1) Criar venv e instalar dependencias
   py -3.11 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install --upgrade pip
   pip install -r requirements.txt

2) Escolher banco
   - SQLite local:   powershell -ExecutionPolicy Bypass -File .\switch_to_sqlite.ps1
   - PostgreSQL:     powershell -ExecutionPolicy Bypass -File .\switch_to_postgres.ps1

3) Rodar API
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

4) Fluxo de acesso
   - Cadastro: POST /auth/register { nome, perfil, senha }
   - Login:    POST /auth/login { nome, senha }
   - Perfil:   GET /auth/me com header X-Session-Token

5) Headers de sessao (apos login)
   X-Session-Token: <token>
   X-User-Name: <nome>
   X-User-Role: APG|SUPERVISAO|CONTABIL|POWERBI|PROGRAMADOR

6) Teste rapido
   Invoke-RestMethod http://127.0.0.1:8000/health
