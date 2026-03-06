# Deploy Frontend no Cloudflare Pages

Data de referencia: 05/03/2026

## Objetivo
Hospedar o frontend no Cloudflare Pages, sem depender do GitHub Pages como host.

## Pre-requisitos
- Conta Cloudflare ativa.
- Projeto Pages criado (exemplo: `conciliar-dados-front`).
- API em producao ja publicada (ex.: Render).

## Secrets no GitHub
Configurar no repositorio (Settings > Secrets and variables > Actions):

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT` (nome exato do projeto Pages)

## Workflow configurado
Arquivo:
- `.github/workflows/deploy-cloudflare-pages.yml`

Fluxo:
1. Copia somente arquivos estaticos para `.cf-pages-dist`.
2. Publica no Cloudflare Pages com `wrangler pages deploy`.

## Sem downtime (roteiro recomendado)
1. Subir o projeto no subdominio `*.pages.dev`.
2. Validar login, listagem, import/export, websocket e atualizacao da API.
3. Ajustar dominio customizado no Cloudflare Pages.
4. Alterar DNS para apontar o dominio oficial ao projeto Pages.
5. Monitorar logs e erros por 24h.

## Validacao rapida
Checklist minimo:
1. Abrir `login.html` no dominio Cloudflare.
2. Entrar com usuario valido.
3. Abrir uma emenda no modal.
4. Confirmar atualizacao em tempo real e salvamento.
5. Confirmar que API continua respondendo em `/health`.

## Observacao
O GitHub continua sendo repositório de codigo e CI/CD, mas nao e mais host do frontend em producao.
