# CHECKLIST FINAL - DEPLOY E CONTINUIDADE

Checklist objetivo para manter o fluxo sem retrabalho: local -> validação -> nuvem.

## 1) Pré-requisitos (uma vez)
- [ ] `backend/.env` com variáveis mínimas:
  - [ ] `APP_ENV=development` (local) / `APP_ENV=production` (nuvem)
  - [ ] `DATABASE_URL` correto
  - [ ] `API_AUTH_ENABLED=true`
  - [ ] `ALLOW_SHARED_KEY_AUTH=false` (produção)
  - [ ] `JWT_SECRET_KEY` forte
  - [ ] `GOOGLE_CLIENT_ID` (backend)
- [ ] Google OAuth configurado no projeto correto.
- [ ] Arquivos secretos fora do Git (`client_secret*.json`, `credentials*.json`, `token.json`).

## 2) Fluxo local diário (antes de qualquer deploy)
### API
```powershell
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Front
```powershell
cd ..
py -m http.server 5501 --bind 127.0.0.1
```

### Validação local rápida
- [ ] `http://127.0.0.1:8000/health` retorna `ok=true`
- [ ] `http://127.0.0.1:5501/login.html?next=index.html` abre
- [ ] Login local funciona
- [ ] Cadastro funciona
- [ ] (Opcional) Google local funciona

## 3) Google OAuth - pontos que mais quebram
No cliente OAuth Web, em **Origens JavaScript autorizadas**:
- [ ] `https://micael-carvalho-dev.github.io`
- [ ] `http://localhost:5501`
- [ ] `http://127.0.0.1:5501`
- [ ] `http://localhost:5500` (se usar)
- [ ] `http://127.0.0.1:5500` (se usar)

Se erro `The given origin is not allowed for the given client ID`:
1. Verificar host/porta exatos da página aberta.
2. Confirmar `GOOGLE_CLIENT_ID` selecionado por host em `config.production.js`.
3. Aguardar 2-10 min após salvar no Google Cloud.

## 4) Preparação de produção (Render)
No serviço API (`sec-emendas-api`) configurar:
- [ ] `APP_ENV=production`
- [ ] `DATABASE_URL` do Postgres/Supabase
- [ ] `JWT_SECRET_KEY` forte
- [ ] `API_AUTH_ENABLED=true`
- [ ] `ALLOW_SHARED_KEY_AUTH=false`
- [ ] `CORS_ORIGINS` com domínio real do front + localhost para testes
- [ ] `GOOGLE_CLIENT_ID` (produção)

No front:
- [ ] `config.production.js` com `API_BASE_URL` correto
- [ ] `GOOGLE_CLIENT_ID_BY_HOST` correto (`github.io` vs `localhost`)

## 5) Smoke test pós-deploy (nuvem)
Use o script:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_deploy_stack.ps1 `
  -ApiBaseUrl "https://sec-emendas-api.onrender.com" `
  -FrontOrigin "https://micael-carvalho-dev.github.io"
```

Com validação de login real:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_deploy_stack.ps1 `
  -ApiBaseUrl "https://sec-emendas-api.onrender.com" `
  -FrontOrigin "https://micael-carvalho-dev.github.io" `
  -LoginUser "MICAEL_DEV" `
  -LoginPass "SUA_SENHA"
```

## 6) Critério de aceite para avançar
- [ ] API health OK
- [ ] CORS preflight OK
- [ ] Login local OK
- [ ] Login Google OK
- [ ] Cadastro + pendência/aprovação funcionando
- [ ] Sem erro 500 no backend

## 7) Política operacional (segurança/LGPD)
- [ ] Não usar dados sensíveis reais em teste local
- [ ] Não expor segredo no frontend
- [ ] Não versionar arquivos de segredo
- [ ] Auditoria ativa para eventos de autenticação
