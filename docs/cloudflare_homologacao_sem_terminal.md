# CLOUDFLARE HOMOLOGACAO (SEM TERMINAL)

Goal: Publicar uma versao de teste no Cloudflare Pages sem derrubar o front atual no GitHub Pages.
Success: Usuarios testam a URL `*.pages.dev` enquanto a producao continua no GitHub.

## Visao rapida
- Producao atual: GitHub Pages (continua igual)
- Homologacao: Cloudflare Pages (projeto separado)
- Sem migracao de dominio oficial neste passo

## Passo 1 - Preparar branch de homologacao no GitHub (web)
1. Abrir o repositorio no GitHub.
2. Criar branch nova a partir de `main`:
   - sugestao: `homolog-cloudflare`
3. Nao precisa alterar codigo para o primeiro deploy de teste.

## Passo 2 - Criar projeto no Cloudflare Pages (web)
1. Cloudflare Dashboard -> `Workers & Pages` -> `Create application` -> `Pages`.
2. `Connect to Git`.
3. Selecionar o repositorio `CONCILIAR_DADOS`.
4. Branch de deploy: `homolog-cloudflare`.

## Passo 3 - Configurar build do projeto
- Framework preset: `None`
- Build command:
```txt
node ./scripts/build_cloudflare_dist.mjs
```
- Build output directory:
```txt
.cf-pages-dist
```

Motivo: esse build publica apenas o pacote estatico do front (evita expor backend/checks).

## Passo 4 - Deploy e validacao
1. Clicar `Save and Deploy`.
2. Ao finalizar, abrir a URL gerada (`https://<projeto>.pages.dev`).
3. Validar:
   - login
   - tabela principal
   - modal e salvamento
   - exportacoes
   - visao Power BI (incluindo export enxuto e mapa)

## Troubleshooting rapido (Cloudflare + Render + Google)
### 1) Login local retorna "Failed to fetch" (CORS)
Sintoma no console:
- `blocked by CORS policy`
- `No 'Access-Control-Allow-Origin' header`

Acao:
1. No Render (API), ajustar variaveis:
   - `CORS_ORIGINS=https://micael-carvalho-dev.github.io,https://conciliar-dados.pages.dev,https://homolog-cloudflare.conciliar-dados.pages.dev`
   - `CORS_ALLOW_ORIGIN_REGEX=^https://([a-z0-9-]+\.)?conciliar-dados\.pages\.dev$|^https://micael-carvalho-dev\.github\.io$|^http://(localhost|127\.0\.0\.1)(:\d+)?$`
2. Redeploy da API.

### 2) Google Sign-In "origin not allowed for the given client ID"
Acao:
1. Google Cloud Console -> Credentials -> OAuth Client.
2. Em `Authorized JavaScript origins`, incluir:
   - `https://conciliar-dados.pages.dev`
   - `https://homolog-cloudflare.conciliar-dados.pages.dev`
   - `https://micael-carvalho-dev.github.io`
3. Salvar e aguardar propagacao (alguns minutos).

### 3) URL da homolog mostra "Ainda nao ha nada aqui"
Acao:
1. Cloudflare Pages -> Deployments -> confirmar deploy da branch `homolog-cloudflare`.
2. Se nao houver deploy da branch, fazer:
   - `Create deployment` com `homolog-cloudflare`, ou
   - novo push na branch `homolog-cloudflare`.

## Passo 5 - Operar em paralelo sem risco
- GitHub Pages continua como URL oficial.
- Cloudflare Pages fica como homologacao.
- Migrar dominio oficial so depois de aceite da empresa.

## Checklist de chamada para TI (proxy)
Se a empresa bloquear o acesso, solicitar liberacao de:
1. `*.pages.dev`
2. URL especifica do projeto Cloudflare (`https://<projeto>.pages.dev`)
3. `https://sec-emendas-api.onrender.com`
4. Host do projeto Supabase (`*.supabase.co` usado pelo projeto)

## Rollback simples
- Se algo falhar, manter usuarios na URL atual do GitHub Pages.
- Nenhuma mudanca de DNS e feita nesta etapa.
