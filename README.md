# CONCILIAR_DADOS

Sistema de governanca de emendas com trilha de auditoria por usuario.

## Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Python + FastAPI
- Banco: SQLite (local) ou PostgreSQL (rede/producao)

## Execucao padrao (Etapa 0)
Use sempre estes 3 comandos para evitar oscilacao de ambiente.

### Terminal 1 - API
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_api.ps1
```

### Terminal 2 - Front
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_front.ps1
```

### Terminal 3 - Smoke test E2E
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_e2e.ps1
```

## URLs
- Front: http://127.0.0.1:5500/login.html
- API: http://127.0.0.1:8000
- Health: http://127.0.0.1:8000/health

## Perfis
- APG
- SUPERVISAO
- CONTABIL
- POWERBI
- PROGRAMADOR

## Observacao
- O script de smoke detecta automaticamente se a API esta usando `Bearer` ou `X-Session-Token`.
- Se houver banco legado sem historico Alembic, use: `alembic stamp head`.


## Configuracao de ambiente (API)
- `config.js`: base local/desenvolvimento.
- `config.production.js`: override para producao (Render + Pages).

Ajuste `API_BASE_URL` e `API_BASE_URL_BY_HOST` em `config.production.js` para nao depender de comando no console do navegador.
