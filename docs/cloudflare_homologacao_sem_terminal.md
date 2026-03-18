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
