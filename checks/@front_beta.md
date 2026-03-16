# @FRONT BETA - EXECUCAO DO NOVO FRONT

CHECKLIST
Goal: Trocar o visual do front usando a base `C:/Users/micae/OneDrive/Área de Trabalho/front/index.html` sem perder nenhuma classe, id, evento ou fluxo funcional ja existente no sistema.
Success: O layout novo entra no projeto principal com a identidade visual nova, mantendo o contrato atual com `app.js`, `frontend/js/*`, modais, filtros, tabela e rotas publicadas.

## Regra oficial deste check
- Este arquivo controla somente a evolucao do front visual.
- Regra funcional continua em `@deve_de_casa_beta.md`.
- Regra de negocio continua em `check62.md` e `checkuser.md`.
- Uma tarefa `DOING` por vez.
- Nao remover `id` nem classe usada pelo JS sem criar compatibilidade.
- O front da pasta externa `front/` e referencia visual, nao substituicao direta do sistema.

## Entradas oficiais
- Front atual do sistema: `index.html`, `style.css`, `app.js`, `frontend/js/*`
- Base visual externa: `C:/Users/micae/OneDrive/Área de Trabalho/front/index.html`
- Plano visual: `checks/plano_leyout_beta.md`

## Contrato congelado (nao quebrar)
### IDs criticos
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
- `importReport`
- `betaWorkspace`
- `workspaceContextBar`
- `mainFiltersCard`
- `mainTableCard`
- `btnProfile`
- `btnPendingApprovals`
- `btnLogout`

### Classes estruturais criticas
- `wrap`
- `topbar`
- `actions`
- `card`
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
- `primary`
- `danger`
- `hidden`

## Fases do front beta

### FASE 1 - Leitura e mapeamento
- [DONE] `FB-01` Mapear o shell visual da base externa.
  Pronto quando: sidebar, header, tabs, cards e containers estiverem separados como blocos reaproveitaveis.
- [DONE] `FB-02` Mapear o contrato do front atual que nao pode quebrar.
  Pronto quando: ids, classes e pontos de montagem do JS estiverem listados e congelados.
- [DONE] `FB-03` Definir o plano de encaixe.
  Pronto quando: cada bloco atual tiver um destino no layout novo (toolbar, filtros, tabela, blocos secundarios, modais).

### FASE 2 - Casca visual nova
- [DONE] `FB-04` Criar o shell do novo layout no `index.html`.
  Pronto quando: sidebar, header principal e area central nova existirem sem quebrar a tela atual.
- [DONE] `FB-05` Adaptar a toolbar atual para o novo header.
  Pronto quando: botoes existentes forem reposicionados sem perder `id`, classes e eventos.
- [DONE] `FB-06` Adaptar a linha de contexto/base e filtros.
  Pronto quando: `workspaceContextBar`, `mainFiltersCard` e avisos de contexto entrarem no novo desenho.

### FASE 3 - Centro operacional
- [DONE] `FB-07` Reencaixar a planilha principal como foco da tela.
  Pronto quando: `mainTableCard` virar o bloco visual dominante do sistema.
- [DONE] `FB-08` Reencaixar os blocos secundarios.
  Pronto quando: `importReport`, `betaWorkspace`, resumo e paineis ficarem em hierarquia menor que a tabela.
- [DONE] `FB-09` Organizar navegacao por abas do beta.
  Pronto quando: Historico, Governanca, Power BI e Ajuda tiverem area clara de navegacao sem duplicar logica.

### FASE 4 - Modal e experiencia
- [DONE] `FB-10` Aplicar o novo visual ao modal da emenda.
  Pronto quando: o modal mantiver todos os ids e fluxos, mas com hierarquia visual melhor.
- [BLOCKED] `FB-11` Harmonizar login e cadastro com a nova identidade.
  Pronto quando: visual ficar coerente com o sistema principal sem quebrar o auth.
  Bloqueio atual: fora do escopo por decisao do usuario nesta fase.
- [DONE] `FB-12` Revisao final desktop.
  Pronto quando: tela principal, modal, login e cadastro estiverem consistentes visualmente e sem regressao funcional.

### FASE 5 - Arquitetura por pagina
- [DONE] `FB-13` Mapear a separacao por paginas do front beta.
  Pronto quando: `Operacao`, `Governanca`, `Suporte` e `Power BI` tiverem destino oficial de blocos, responsabilidade e contrato congelado.
  Referencia: `docs/mapa_paginas_front_beta.md`

## Ordem recomendada
1. `FB-01`
2. `FB-02`
3. `FB-03`
4. `FB-04`
5. `FB-05`
6. `FB-06`
7. `FB-07`
8. `FB-08`
9. `FB-09`
10. `FB-10`
11. `FB-11`
12. `FB-12`
13. `FB-13`

## Criterio de aceite
- O layout novo precisa manter todos os fluxos atuais.
- A tabela precisa continuar sendo o centro da operacao.
- Nenhum `id` critico pode sumir.
- Nenhuma classe critica pode ser removida sem camada de compatibilidade.
- O front novo precisa parecer sistema institucional real da SEC, nao tema solto.
- O shell novo deve aceitar futuras melhorias sem reabrir `app.js` inteiro.
- A separacao por paginas nao pode duplicar contrato sensivel sem necessidade.

## Checkpoint
Active: nenhum.
Blocked: `FB-11` fora do escopo por decisao do usuario nesta fase.
Resume from: se quiser reabrir a trilha visual, o proximo ponto seguro e implementar o shell compartilhado das paginas `Operacao`, `Governanca`, `Suporte` e `Power BI` em cima do mapa oficial.
