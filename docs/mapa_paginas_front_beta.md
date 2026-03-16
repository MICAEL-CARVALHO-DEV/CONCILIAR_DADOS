# MAPA DE PAGINAS - FRONT BETA

Goal: separar o front beta em paginas por contexto sem quebrar o contrato atual do sistema.
Success: `Operacao`, `Governanca`, `Suporte` e `Power BI` ficam com destino oficial de blocos, responsabilidade e contrato congelado.

## Regra principal
- `index.html` continua como pagina de `Operacao`.
- Novas paginas entram por contexto:
  - `governanca.html`
  - `suporte.html`
  - `powerbi.html`
- O shell visual (sidebar, header, identidade SEC) deve ser compartilhado.
- Nao duplicar ou renomear `id` e classes criticas sem camada de compatibilidade.

## Pagina 1 - Operacao
Responsabilidade:
- operacao diaria da planilha oficial
- filtros oficiais
- resumo de importacao ligado a planilha
- acesso ao modal da emenda

Blocos que entram:
- `workspaceContextBar`
- `workspaceModeNotice`
- `workspaceStage`
- `roleNotice`
- `supervisorQuickPanel`
- `mainFiltersCard`
- `importReport`
- `mainTableCard`
- `modal`

Regras:
- a tabela principal continua sendo o centro visual da pagina
- `statusFilter`, `yearFilter` e `searchInput` continuam sendo filtros oficiais
- `importReport` fica acima da tabela ou logo antes dela, com hierarquia operacional

## Pagina 2 - Governanca
Responsabilidade:
- historico operacional
- governanca de imports
- trilha de auditoria
- aprovacoes e controle administrativo

Blocos que entram:
- conteudo hoje renderizado na rota/tab de `history`
- conteudo hoje renderizado na rota/tab de `imports`
- cards de resumo de auditoria/imports vindos da API

Regras:
- nao competir visualmente com a planilha oficial
- foco em leitura, filtro e rastreabilidade
- tratar `betaWorkspace` como container de apoio ou separar em subblocos especificos

## Pagina 3 - Suporte
Responsabilidade:
- ajuda e suporte
- abertura de solicitacao para usuarios comuns
- historico e gestao completa apenas para `PROGRAMADOR`

Blocos que entram:
- conteudo hoje renderizado na rota/tab de `support`
- formulario de solicitacao
- historico administrativo condicionado por permissao

Regras:
- usuario comum: apenas solicitar
- `PROGRAMADOR`: ver historico, responder, fechar e administrar
- evitar duas telas concorrentes de suporte na mesma pagina

## Pagina 4 - Power BI
Responsabilidade:
- leitura executiva
- dashboard analitico
- visao de supervisao e acompanhamento

Blocos que entram:
- conteudo hoje renderizado na rota/tab de `powerbi`
- cards, graficos e indicadores

Regras:
- modo leitura
- sem competir com a tela operacional
- dados vindos de resumos/consultas prontos do backend

## Contrato congelado
Estes pontos nao devem sumir na migracao.

### IDs criticos
- `workspaceContextBar`
- `mainFiltersCard`
- `importReport`
- `mainTableCard`
- `tbody`
- `statusFilter`
- `yearFilter`
- `searchInput`
- `modal`
- `modalTitle`
- `modalSub`
- `kv`
- `history`
- `markStatus`
- `markReason`
- `btnMarkStatus`
- `btnKvSave`
- `btnExportAtuais`
- `btnExportHistorico`
- `fileCsv`
- `btnProfile`
- `btnPendingApprovals`
- `btnLogout`

### Classes estruturais que devem continuar
- `card`
- `workspace-bar`
- `workspace-bar-main`
- `workspace-bar-meta`
- `workspace-badge`
- `filters`
- `field`
- `table-wrap`
- `table`
- `modal`
- `modal-card`
- `modal-head`
- `modal-body`
- `modal-foot`
- `btn`
- `hidden`

## Regra de migracao
1. primeiro separar arquitetura por pagina
2. depois mover blocos visuais
3. depois ajustar navegacao
4. so depois refinar detalhes e micro-layout

## Ordem segura
1. fechar `Operacao`
2. fechar `Governanca`
3. fechar `Suporte`
4. fechar `Power BI`

## Veredito
- `Resumo da importacao` fica em `Operacao`
- `Historico operacional` fica em `Governanca`
- `Ajuda e suporte` fica em `Suporte`
- `Power BI` fica em pagina propria de leitura
