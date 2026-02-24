Backend SEC Emendas - FastAPI + PostgreSQL/SQLite

1) Criar venv e instalar dependencias
   py -3.11 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install --upgrade pip
   pip install -r requirements.txt

2) Configurar ambiente
   - Copie `.env.example` para `.env` e ajuste valores.
   - SQLite local:   powershell -ExecutionPolicy Bypass -File .\switch_to_sqlite.ps1
   - PostgreSQL:     powershell -ExecutionPolicy Bypass -File .\switch_to_postgres.ps1

3) Alembic (schema oficial)
   alembic upgrade head

   Dica:
   - Em banco existente sem historico Alembic, use `alembic stamp head` uma vez.

4) Rodar API
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

5) Fluxo de acesso
   - Cadastro: POST /auth/register { nome, perfil, senha }
   - Login:    POST /auth/login { nome, senha }
   - Perfil:   GET /auth/me com header Authorization: Bearer <token>

6) Headers recomendados
   Authorization: Bearer <token>
   X-User-Name: <nome>
   X-User-Role: APG|SUPERVISAO|CONTABIL|POWERBI|PROGRAMADOR

7) WebSocket em tempo real
   GET /ws?token=<JWT>
   Eventos de update emitidos quando cria/edita/versiona emenda.

8) Teste rapido
   Invoke-RestMethod http://127.0.0.1:8000/health

9) Logs operacionais (import/export)
   - POST /imports/lotes
   - GET  /imports/lotes
   - POST /exports/logs
   - GET  /exports/logs

   Objetivo:
   - Registrar lote de importacao (arquivo/hash/resumo)
   - Registrar log de exportacao (formato/filtros/quantidades)
