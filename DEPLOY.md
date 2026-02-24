# Deploy Profissional - SEC Emendas

Arquitetura alvo:
- Frontend: GitHub Pages
- Backend: FastAPI no Render
- Banco: Supabase Postgres

## 1) Supabase (Postgres)
1. Crie um projeto no Supabase.
2. Em `Settings > Database > Connection string`, copie a string de conexao.
3. Formato recomendado para SQLAlchemy:

```txt
postgresql+psycopg://postgres.<project-ref>:<senha>@aws-0-<regiao>.pooler.supabase.com:6543/postgres?sslmode=require
```

## 2) Variaveis de ambiente no Render
Defina no servico backend:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM=HS256`
- `JWT_EXPIRE_HOURS=12`
- `API_AUTH_ENABLED=true`
- `API_SHARED_KEY=<chave-tecnica-opcional>`
- `CORS_ORIGINS=https://SEUUSUARIO.github.io,http://localhost:5500,http://127.0.0.1:5500`

Observacao:
- Para GitHub Pages use somente o dominio no CORS (`https://SEUUSUARIO.github.io`).

## 3) Build e Start no Render
- Build Command:

```bash
pip install -r requirements.txt
```

- Start Command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## 4) Alembic no deploy
Opcao recomendada: rodar migration antes de subir trafego.

- Localmente (ou job separado):

```bash
alembic upgrade head
```

- Se o banco ja existir e nao tiver historico Alembic:

```bash
alembic stamp head
```

Depois disso, siga usando `alembic revision --autogenerate -m "..."` e `alembic upgrade head`.

## 5) Frontend (GitHub Pages)
No `app.js`, configure API base:

```js
const DEFAULT_API_BASE_URL = "https://SEU-SERVICO.onrender.com";
```

Publique o frontend no GitHub Pages.

## 6) Testes com curl
Substitua `API_URL` pelo endpoint do Render.

### 6.1 Health
```bash
curl -s "$API_URL/health"
```

### 6.2 Register
```bash
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Miguel","perfil":"PROGRAMADOR","senha":"1234"}'
```

### 6.3 Login
```bash
curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Miguel","senha":"1234"}'
```

Guarde o `token` retornado.

### 6.4 Criar emenda
```bash
curl -s -X POST "$API_URL/emendas" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"id_interno":"EPI-2026-000001","ano":2026,"identificacao":"Teste","status_oficial":"Recebido"}'
```

### 6.5 Postar evento
```bash
curl -s -X POST "$API_URL/emendas/1/eventos" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"tipo_evento":"NOTE","motivo":"teste de evento"}'
```

### 6.6 Versionar emenda
```bash
curl -s -X POST "$API_URL/emendas/1/versionar" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"motivo":"ajuste de versao"}'
```

## 7) Checklist de aceite (deploy)
- [ ] API sobe no Render
- [ ] `GET /health` retorna `ok=true`
- [ ] Login/Cadastro funcionando
- [ ] CRUD de emenda/evento/versionar funcionando
- [ ] WebSocket `/ws` enviando updates
- [ ] Front no GitHub Pages consumindo API do Render
- [ ] CORS sem erro no navegador