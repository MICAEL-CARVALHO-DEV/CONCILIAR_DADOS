# Deploy Gratis (Render + Supabase)

Objetivo: tirar o sistema do PC local e deixar online com custo zero para piloto.

## Arquitetura
- Front: Render Static Site (gratis)
- API: Render Web Service (free)
- Banco: Supabase Postgres (free)

## 1) Banco no Supabase
1. Crie projeto no Supabase.
2. Va em `Settings > Database > Connection string`.
3. Use formato SQLAlchemy (pooler):

```txt
postgresql+psycopg://postgres.<project-ref>:<senha>@aws-0-<regiao>.pooler.supabase.com:6543/postgres?sslmode=require
```

## 2) Subir API no Render
1. Render > New > Blueprint.
2. Conecte este repositorio.
3. O arquivo `render.yaml` vai criar o servico `sec-emendas-api`.
4. Configure variaveis no servico:
   - `DATABASE_URL` = string do Supabase
   - `JWT_SECRET_KEY` = chave forte
   - `API_SHARED_KEY` = chave tecnica
   - `CORS_ORIGINS` = URL do front + localhost para testes
5. Deploy.

## 3) Subir Front no Render
1. Render > New > Static Site.
2. Repo: este projeto.
3. Root Directory: `/`
4. Build Command: (vazio)
5. Publish Directory: `/`
6. Deploy.

## 4) Ligar front na API
Por padrao, `config.production.js` ja aponta para:

```txt
https://sec-emendas-api.onrender.com
```

Se a URL da API for diferente, ajuste `config.production.js`.

## 5) CORS correto
No `CORS_ORIGINS`, inclua:
- URL da API local para testes (opcional)
- URL do front no Render (obrigatorio)
- `http://localhost:5500` e `http://127.0.0.1:5500` (opcional)

Exemplo:

```txt
https://seu-front.onrender.com,http://localhost:5500,http://127.0.0.1:5500
```

## 6) Validacao final
1. `GET https://<api>/health` deve retornar `ok=true`.
2. Login/cadastro devem funcionar no front cloud.
3. Importacao XLSX e exportacao devem funcionar.
4. `scripts/regressao_p0.ps1` e `scripts/concorrencia_c34.ps1` continuam passando local.

## Observacoes importantes
- No free da Render, API pode "dormir" sem uso e acorda no primeiro acesso.
- Isso e normal para piloto.
- Quando virar operacao oficial, subir para plano pago minimo.

