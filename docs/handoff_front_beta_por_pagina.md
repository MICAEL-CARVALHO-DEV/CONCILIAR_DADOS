# HANDOFF CURTO - FRONT BETA POR PAGINA

Goal: entregar ao Desktop um guia curto de implementacao por pagina, com foco em encaixe seguro do front beta.
Success: o Desktop consegue construir `Operacao`, `Governanca`, `Suporte` e `Power BI` usando os blocos certos e consumindo as rotas certas.

## Regra geral
- nao quebrar `id` e classes congeladas
- manter `index.html` como pagina de `Operacao`
- shell visual pode evoluir, contrato funcional nao
- consumir primeiro endpoints de resumo
- abrir rotas detalhadas so quando a pagina pedir aprofundamento

## Pagina 1 - Operacao
Objetivo:
- transformar a tela principal em pagina operacional limpa, com foco total na planilha

Blocos visuais:
- `workspaceContextBar`
- `mainFiltersCard`
- `importReport`
- `mainTableCard`
- `modal`

Ordem visual recomendada:
1. `workspaceContextBar`
2. `mainFiltersCard`
3. `importReport`
4. `mainTableCard`
5. `modal` como sobreposicao

Contratos de backend:
- `GET /auth/me`
- `GET /dashboard/resumo`
- `GET /imports/resumo`
- `GET /emendas`
- `GET /emendas/{emenda_id}`

O que puxar de cada rota:
- `/dashboard/resumo`: cards de topo, ultimo evento, totais, top deputados
- `/imports/resumo`: bloco de resumo da importacao
- `/emendas`: tabela principal
- `/emendas/{id}`: detalhe do modal

Nao quebrar:
- `statusFilter`
- `yearFilter`
- `searchInput`
- `tbody`
- `workspaceContextBar`
- `mainFiltersCard`
- `importReport`
- `mainTableCard`
- `modal`

Implementacao minima:
- reorganizar a tela
- manter a tabela como centro
- deixar `importReport` acima da tabela
- manter filtros oficiais no card principal

## Pagina 2 - Governanca
Objetivo:
- separar historico e governanca da operacao principal

Blocos visuais:
- historico operacional
- governanca de imports
- auditoria
- export logs/resumo

Contratos de backend:
- `GET /audit/resumo`
- `GET /audit`
- `GET /imports/resumo`
- `GET /imports/lotes`
- `GET /imports/linhas?lote_id=...`
- `GET /imports/lotes/{lote_id}/governanca/logs`
- `PATCH /imports/lotes/{lote_id}/governanca`
- `GET /exports/resumo`
- `GET /exports/logs`

O que puxar de cada rota:
- `/audit/resumo`: cards e topo da pagina
- `/audit`: lista detalhada do historico
- `/imports/resumo`: panorama geral de governanca
- `/imports/lotes`: tabela principal de lotes
- `/imports/linhas`: detalhe do lote selecionado
- `/imports/lotes/{id}/governanca/logs`: trilha do lote
- `/exports/resumo`: panorama de exportacao
- `/exports/logs`: lista de exportacoes

Nao quebrar:
- filtros fortes do historico
- governanca de imports por lote
- trilha e logs

Implementacao minima:
- cards de resumo no topo
- historico em um painel
- lotes/imports em outro
- logs de export em area secundaria

## Pagina 3 - Suporte
Objetivo:
- deixar a pagina simples para usuario comum e completa para `PROGRAMADOR`

Blocos visuais:
- formulario de solicitacao
- cards de suporte
- fila de chamados para `PROGRAMADOR`
- mensagens e detalhes administrativos so para `PROGRAMADOR`

Contratos de backend:
- `GET /support/resumo`
- `POST /support/threads`
- `GET /support/threads`
- `GET /support/threads/{thread_id}/messages`
- `POST /support/threads/{thread_id}/messages`
- `PATCH /support/threads/{thread_id}/status`

O que puxar de cada rota:
- usuario comum:
  - `/support/resumo`
  - `/support/threads` nao deve virar foco visual
  - `/support/threads` e mensagens podem vir vazios
  - usar `POST /support/threads` para abrir solicitacao
- `PROGRAMADOR`:
  - usa fluxo completo
  - fila, historico, mensagens, status

Nao quebrar:
- regra `request_only` para usuario comum
- historico completo so para `PROGRAMADOR`

Implementacao minima:
- usuario comum ve so pedido de ajuda/solicitacao
- `PROGRAMADOR` ve painel completo

## Pagina 4 - Power BI
Objetivo:
- criar uma pagina executiva, de leitura, sem competir com a operacao

Blocos visuais:
- cards principais
- graficos
- resumo executivo
- paineis comparativos

Contratos de backend:
- `GET /dashboard/resumo`
- `GET /audit/resumo`
- `GET /imports/resumo`
- `GET /exports/resumo`
- `GET /support/resumo`

Rotas detalhadas opcionais:
- `GET /audit`
- `GET /exports/logs`
- `GET /imports/lotes`

O que puxar de cada rota:
- `/dashboard/resumo`: cards centrais
- `/audit/resumo`: comportamento operacional
- `/imports/resumo`: situacao da importacao
- `/exports/resumo`: atividade de exportacao
- `/support/resumo`: panorama de suporte

Nao quebrar:
- pagina em modo leitura
- sem edicao operacional aqui

Implementacao minima:
- cards no topo
- graficos no centro
- leitura institucional

## Handoff padrao entre irmaos
Sempre que o Desktop fechar uma pagina, devolver neste formato:

```txt
Pagina:
Objetivo:
Arquivos tocados:
Contrato backend usado:
IDs preservados:
Classes preservadas:
Pontos de risco:
Proximo passo:
```

## Ordem recomendada
1. `Operacao`
2. `Governanca`
3. `Suporte`
4. `Power BI`

## Veredito
- o Desktop ja pode implementar por pagina
- o backend ja entregou os resumos necessarios
- o foco agora e encaixe visual e consumo de contrato, nao invencao de API
