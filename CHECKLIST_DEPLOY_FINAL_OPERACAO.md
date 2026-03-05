# CHECKLIST FINAL - DEPLOY E CONTINUIDADE

Checklist objetivo para manter o fluxo sem retrabalho: local -> validacao -> nuvem.

## 1) Pre-requisitos (uma vez)
- [ ] `backend/.env` com variaveis minimas:
  - [ ] `APP_ENV=development` (local) / `APP_ENV=production` (nuvem)
  - [ ] `DATABASE_URL` correto
  - [ ] `API_AUTH_ENABLED=true`
  - [ ] `ALLOW_SHARED_KEY_AUTH=false` (producao)
  - [ ] `JWT_SECRET_KEY` forte
  - [ ] `GOOGLE_CLIENT_ID` (backend)
- [ ] Google OAuth configurado no projeto correto.
- [ ] Arquivos secretos fora do Git (`client_secret*.json`, `credentials*.json`, `token.json`).

## 2) Fluxo local diario (antes de qualquer deploy)
### API
```powershell
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Front
```powershell
cd ..
py -m http.server 5500 --bind 127.0.0.1
```

### Validacao local rapida
- [ ] `http://127.0.0.1:8000/health` retorna `ok=true`
- [ ] `http://127.0.0.1:5500/login.html?next=index.html` abre
- [ ] Login local funciona
- [ ] Cadastro funciona
- [ ] (Opcional) Google local funciona

## 3) Google OAuth - pontos que mais quebram
No cliente OAuth Web, em **Origens JavaScript autorizadas**:
- [ ] `https://micael-carvalho-dev.github.io`
- [ ] `http://localhost:5500`
- [ ] `http://127.0.0.1:5500`
- [ ] `http://localhost:5501` (se usar)
- [ ] `http://127.0.0.1:5501` (se usar)

Se erro `The given origin is not allowed for the given client ID`:
1. Verificar host/porta exatos da pagina aberta.
2. Confirmar `GOOGLE_CLIENT_ID` selecionado por host em `config.production.js`.
3. Aguardar 2-10 min apos salvar no Google Cloud.

## 4) Preparacao de producao (Render)
No servico API (`sec-emendas-api`) configurar:
- [ ] `APP_ENV=production`
- [ ] `DATABASE_URL` do Postgres/Supabase
- [ ] `JWT_SECRET_KEY` forte
- [ ] `API_AUTH_ENABLED=true`
- [ ] `ALLOW_SHARED_KEY_AUTH=false`
- [ ] `CORS_ORIGINS` com dominio real do front + localhost para testes
- [ ] `GOOGLE_CLIENT_ID` (producao)

No front:
- [ ] `config.production.js` com `API_BASE_URL` correto
- [ ] `GOOGLE_CLIENT_ID_BY_HOST` correto (`github.io` vs `localhost`)

## 5) Smoke test pos-deploy (nuvem)
Use o script:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_deploy_stack.ps1 `
  -ApiBaseUrl "https://sec-emendas-api.onrender.com" `
  -FrontOrigin "https://micael-carvalho-dev.github.io"
```

Com validacao de login real:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_deploy_stack.ps1 `
  -ApiBaseUrl "https://sec-emendas-api.onrender.com" `
  -FrontOrigin "https://micael-carvalho-dev.github.io" `
  -LoginUser "MICAEL_DEV" `
  -LoginPass "SUA_SENHA"
```

## 6) Criterio de aceite para avancar
- [ ] API health OK
- [ ] CORS preflight OK
- [ ] Login local OK
- [ ] Login Google OK
- [ ] Cadastro + pendencia/aprovacao funcionando
- [ ] Sem erro 500 no backend

## 7) Politica operacional (seguranca/LGPD)
- [ ] Nao usar dados sensiveis reais em teste local
- [ ] Nao expor segredo no frontend
- [ ] Nao versionar arquivos de segredo
- [ ] Auditoria ativa para eventos de autenticacao
