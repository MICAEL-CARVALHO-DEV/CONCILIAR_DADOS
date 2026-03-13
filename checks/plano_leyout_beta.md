# PLANO LEYOUT BETA - EXECUCAO GUIADA

CHECKLIST
Goal: Organizar a evolucao visual da beta (sem codar no impulso), com ordem clara de execucao e checkpoints para nao perder contexto.
Success: Todo ajuste de layout passa por este plano, com status rastreavel por ID e criterio de pronto por etapa.

## Escopo deste plano
- Foco principal: `Planilha Controle de EPI` e `Planilha1`.
- Foco secundario: navegacao (`toolbar`, `filtros`, `blocos`, `tabela`, `modais`, `dashboard`).
- Fora do escopo agora: mudanca de regra de negocio e migracao de infraestrutura.

## Regra anti-perda
- Uma tarefa `DOING` por vez.
- Cada tarefa tem ID unico (`LB-01`, `LB-02`, ...).
- Mudou status? atualizar aqui e no maximo 1 linha em `CHECKUSER.md`.
- Pendencia funcional continua em `checks/@DEVE_DE_CASA_BETA.md`.
- Evidencia obrigatoria por entrega: imagem, link figma ou nota curta.

## Estado atual (baseline visual)
- Layout funcional, mas com hierarquia fraca entre operacao e analise.
- Toolbar com muitos botoes no mesmo peso visual.
- Filtros e tabela sem bloco de prioridade visual forte.
- Dashboard com potencial alto, mas ainda sem padrao unico de composicao com a operacao.

## Fases e IDs

### FASE 1 - Arquitetura de tela (antes de codar)
- [TODO] `LB-01` Definir mapa de navegacao final.
  Pronto quando: existir mapa com menu lateral + areas (Operacao, Historico, Governanca, Visao Power BI).
- [TODO] `LB-02` Definir hierarquia da home operacional.
  Pronto quando: ordem fixa validada (`toolbar > filtros > resumo > tabela > acoes`).
- [TODO] `LB-03` Definir estados de contexto (`LOA OFICIAL`, `PLANILHA TESTE`, `futuro FEDERAL`).
  Pronto quando: cada estado tiver badge visual e comportamento esperado descrito.

### FASE 2 - Design exploratorio (figma/imagem)
- [TODO] `LB-04` Wireframe low-fi desktop.
  Pronto quando: existir 1 tela base com estrutura completa sem detalhe visual final.
- [TODO] `LB-05` Versao high-fi da tela operacional.
  Pronto quando: componentes principais fechados (sidebar, toolbar, filtros, tabela).
- [TODO] `LB-06` Versao high-fi do modal de emenda.
  Pronto quando: dados principais, status por usuario e timeline com rolagem interna estiverem definidos.
- [TODO] `LB-07` Versao high-fi do dashboard Power BI integrado.
  Pronto quando: KPIs + graficos + filtros globais estiverem harmonizados com o layout principal.

### FASE 3 - Sistema visual (padrao unico)
- [TODO] `LB-08` Definir tokens visuais.
  Pronto quando: paleta, tipografia, espacamento, borda, sombra e estados de botao estiverem listados.
- [TODO] `LB-09` Definir biblioteca de componentes beta.
  Pronto quando: tabela, card, modal, chip de status, badge de workspace e botoes estiverem padronizados.
- [TODO] `LB-10` Definir regras de responsividade.
  Pronto quando: breakpoints e comportamento de colapso estiverem documentados.

### FASE 4 - Validacao de uso (sem retrabalho)
- [TODO] `LB-11` Validacao de fluxo com usuarios (APG, CONTABIL, SUPERVISAO, POWERBI).
  Pronto quando: checklist de uso real passar sem bloqueio visual critico.
- [TODO] `LB-12` Fechamento do pacote de handoff para codar.
  Pronto quando: houver pacote final com telas aprovadas, componentes e regras de implementacao.

## Ordem recomendada de execucao
1. `LB-01`
2. `LB-02`
3. `LB-03`
4. `LB-04`
5. `LB-05`
6. `LB-06`
7. `LB-07`
8. `LB-08`
9. `LB-09`
10. `LB-10`
11. `LB-11`
12. `LB-12`

## Criterio de aceite do LEYOUT BETA
- Estrutura visual unica e consistente entre Operacao + Dashboard.
- Diferenca de contexto clara entre `LOA` e `TESTE`.
- Fluxos criticos visiveis sem confusao (import, export, filtro, edicao, historico).
- Modais legiveis e sem excesso de informacao concorrente.
- Sem regressao de usabilidade em desktop e com diretriz minima para responsivo.

## Checkpoint de execucao
Active: `LB-01`
Blocked: nenhum
Resume from: montar mapa final de navegacao em 1 pagina (menu + rotas + destino de cada botao da toolbar).
