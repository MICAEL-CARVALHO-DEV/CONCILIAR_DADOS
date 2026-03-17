# MAPA DO BACKEND POR PAGINA - FRONT BETA

Goal: mapear quais endpoints do backend alimentam cada pagina do front beta.
Success: `Operacao`, `Governanca`, `Suporte` e `Power BI` conseguem consumir dados sem adivinhar contrato.

## Regra principal
- `index.html` continua sendo a pagina de `Operacao`.
- O shell visual pode mudar, mas os contratos HTTP continuam centralizados neste mapa.
- Cada pagina deve consumir primeiro os endpoints de resumo e depois, se precisar, as rotas detalhadas.

## Pagina 1 - Operacao
Responsabilidade:
- carregar a planilha oficial
- abrir modal da emenda
- aplicar filtros oficiais
- mostrar contexto da base e resumo de importacao

### Endpoints principais
- `POST /auth/login`
- `GET /auth/me`
- `GET /emendas`
- `GET /emendas/{emenda_id}`
- `GET /dashboard/resumo`
- `GET /dashboard/deputados/ajustes`
- `GET /dashboard/deputados/politica`
- `GET /imports/resumo`

### Endpoints operacionais complementares
- `GET /emendas/{emenda_id}/lock`
- `POST /emendas/{emenda_id}/lock/acquire`
- `POST /emendas/{emenda_id}/lock/renew`
- `POST /emendas/{emenda_id}/lock/release`
- `POST /emendas/{emenda_id}/status`
- `POST /emendas/{emenda_id}/eventos`
- `POST /emendas/{emenda_id}/versionar`
- `PUT /dashboard/deputados/ajustes` (ajuste manual global, `PROGRAMADOR`)
- `DELETE /dashboard/deputados/ajustes` (remover ajuste manual, `PROGRAMADOR`)

### Uso recomendado
- `GET /dashboard/resumo`: cards de topo, totalizadores, ultimo evento, top deputados
- `GET /dashboard/deputados/politica`: regra oficial da contagem de deputado (`BASE_ATUAL`) e governanca do ajuste manual
- `GET /dashboard/deputados/ajustes`: listar overrides manuais auditados da contagem
- `GET /imports/resumo`: resumo operacional da ultima importacao e contadores
- `GET /emendas`: tabela principal
- `GET /emendas/{id}`: modal detalhado

## Pagina 2 - Governanca
Responsabilidade:
- historico operacional
- governanca de imports
- auditoria e rastreabilidade
- aprovacoes e controle administrativo

### Endpoints principais
- `GET /audit`
- `GET /audit/resumo`
- `GET /imports/lotes`
- `GET /imports/resumo`
- `GET /imports/linhas?lote_id=...`
- `GET /imports/lotes/{lote_id}/governanca/logs`
- `PATCH /imports/lotes/{lote_id}/governanca`
- `GET /exports/logs`
- `GET /exports/resumo`

### Endpoints administrativos opcionais
- `GET /auth/audit`
- `GET /users`
- `PATCH /users/{user_id}/status`

### Uso recomendado
- `GET /audit/resumo`: cards e indicadores da governanca
- `GET /audit`: lista detalhada do historico operacional
- `GET /imports/resumo`: bloco geral de lotes/importacao
- `GET /imports/lotes`: tabela principal da governanca de imports
- `GET /imports/linhas`: detalhe de linhas do lote selecionado
- `PATCH /imports/lotes/{id}/governanca`: corrigir ou remover logicamente o lote
- `GET /exports/resumo`: indicadores de exportacao
- `GET /exports/logs`: trilha detalhada de export

## Pagina 3 - Suporte
Responsabilidade:
- abrir solicitacao
- mostrar fila administrativa para `PROGRAMADOR`
- concentrar ajuda e suporte sem competir com a operacao

### Endpoints principais
- `GET /support/resumo`
- `POST /support/threads`

### Endpoints administrativos
- `GET /support/threads`
- `GET /support/threads/{thread_id}/messages`
- `POST /support/threads/{thread_id}/messages`
- `PATCH /support/threads/{thread_id}/status`

### Regra de permissao
- usuario comum:
  - usa `POST /support/threads`
  - `GET /support/resumo` responde em modo `request_only`
  - listagens/mensagens retornam vazias ou 403 onde aplicavel
- `PROGRAMADOR`:
  - usa o fluxo completo de suporte

### Uso recomendado
- usuario comum: tela simples de solicitacao
- `PROGRAMADOR`: fila, resumo, mensagens, status e historico

## Pagina 4 - Power BI
Responsabilidade:
- leitura executiva
- paineis e indicadores
- acompanhamento analitico

### Endpoints principais
- `GET /dashboard/resumo`
- `GET /audit/resumo`
- `GET /imports/resumo`
- `GET /exports/resumo`
- `GET /support/resumo`

### Endpoints detalhados opcionais
- `GET /audit`
- `GET /exports/logs`
- `GET /imports/lotes`

### Uso recomendado
- `GET /dashboard/resumo`: cards centrais do painel
- `GET /audit/resumo`: comportamento operacional
- `GET /imports/resumo`: situacao da cadeia de importacao
- `GET /exports/resumo`: atividade de exportacao
- `GET /support/resumo`: panorama de suporte

## Rotas de plataforma
Estas rotas nao pertencem a uma pagina especifica, mas sustentam o sistema:

- `GET /health`
- `GET /roles`
- `GET /ai/providers/status`
- `POST /ai/workflows/review-loop`

Uso:
- `health`: monitoramento tecnico
- `roles`: bootstrap do front/autorizacao
- `ai/providers/status` e `review-loop`: uso administrativo/orquestrador

## Fluxo minimo por pagina
### Operacao
1. `POST /auth/login`
2. `GET /auth/me`
3. `GET /dashboard/resumo`
4. `GET /imports/resumo`
5. `GET /emendas`

### Governanca
1. `GET /audit/resumo`
2. `GET /imports/resumo`
3. `GET /imports/lotes`
4. `GET /audit`
5. `GET /exports/resumo`

### Suporte
1. `GET /support/resumo`
2. `POST /support/threads`
3. fluxo completo so se `PROGRAMADOR`

### Power BI
1. `GET /dashboard/resumo`
2. `GET /audit/resumo`
3. `GET /imports/resumo`
4. `GET /exports/resumo`

## Veredito
- `Operacao` consome `emendas + dashboard/resumo + imports/resumo`
- `Governanca` consome `audit + imports + exports`
- `Suporte` consome `support/*`
- `Power BI` consome os endpoints de resumo
