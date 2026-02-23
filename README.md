# CONCILIAR_DADOS

Sistema para conciliação e governança de dados de emendas, com rastreabilidade de alterações por usuário.

## Objetivo

Reduzir dependência de planilhas como fonte principal e centralizar o fluxo em aplicação web + API + banco de dados.

## Stack

- Frontend: HTML, CSS e JavaScript
- Backend: Python + FastAPI
- Banco: PostgreSQL (produção) ou SQLite (teste local)

## Estrutura

- `index.html`, `cadastro.html`, `login.html`: telas principais
- `app.js`, `style.css`: lógica e estilos do frontend
- `backend/`: API, modelos e scripts de execução

## Execução rápida do backend

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
powershell -ExecutionPolicy Bypass -File .\switch_to_sqlite.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

## Perfis de acesso

`APG`, `SUPERVISAO`, `CONTABIL`, `POWERBI`, `PROGRAMADOR`

## Licença

Este projeto está licenciado sob a licença MIT. Veja `LICENSE`.
