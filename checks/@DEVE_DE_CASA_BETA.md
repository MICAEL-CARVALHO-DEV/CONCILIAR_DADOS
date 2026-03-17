# @DEVE DE CASA - CENTRAL UNICA DE PENDENCIAS BETA SEC

CHECKLIST
Goal: Centralizar todas as pendencias (decisao, validacao, execucao e pos-beta) em um unico arquivo para eliminar retrabalho e duplicidade entre checks.
Success: Qualquer duvida de "o que falta" e respondida aqui, sem precisar cruzar varios arquivos.

## Regra oficial de uso
- Pendencia nova entra primeiro aqui.
- `check62.md` e `checkuser.md` ficam como mapa/historico de execucao.
- `check_pendencias_beta_sec.md` fica somente como referencia historica de decisoes.
- Este arquivo e a fonte canonica para fechamento da beta.

## Ja decididos (nao pendentes)
- [DONE] `C12-A` `Status_2` nao entra no sistema; coluna extra/duplicada sera apenas tolerada no import.
- [DONE] Import oficial `backend-first` (Python le `.xlsx`; front envia/renderiza).
- [DONE] Fluxo operacional unificado sem dependencia exclusiva de PROGRAMADOR.
- [DONE] Beta atual fica focada na base oficial; `TESTE` e `FEDERAL` saem do escopo operacional.
- [DONE] `workspace_id` completo no backend fica fora da beta atual; so reabre se a estrategia multi-base voltar.
- [DONE] `C19-A` / `P-R02` cadeia oficial de import fica em base consolidada unica, sem camadas extras (`raiz -> import2 -> import3` ignorado nesta fase).
- [DONE] Historico de import por lote permanece ativo; historico por emenda permanece ativo e deve continuar acessivel.
- [DONE] Regra operacional de import: usuarios podem ver, corrigir e excluir o import que eles mesmos fizeram.
- [DONE] `C25-B` / `P-R05` `objetivo_epi` entra na beta como campo operacional.
- [DONE] `C25-B` `objetivo_epi` passa a ser ponto de partida do andamento operacional.
- [DONE] Execucao tecnica de `C25-B`: `objetivo_epi` ja persiste em backend, modal, preview de importacao e export atual.
- [DONE] Fluxo da aba `Ajuda e suporte`: usuarios comuns ficam com fluxo de solicitar chamado; historico/chamados completos ficam visiveis para `PROGRAMADOR`.
- [DONE] `P-R06` servidor interno so entra quando banco/historico estiverem confiaveis e operando bem.
- [DONE] `P-R06` leitura externa do Power BI entra depois da beta final, consumindo `objetivo_epi` e `Planilha1`.
- [DONE] Estrategia Power BI futura: 2 visoes coexistem (`Power BI` interno de leitura no sistema + leitura externa no `Power BI Desktop`).

## PENDENCIAS BLOQUEADORAS DA BETA
### A) Veredito funcional (depende da sua decisao)
- [DOING] `C49-A` / `P-R03` regra final da contagem de deputado.
  Parcialmente decidido:
  - ajuste manual fica habilitado
  - escopo do ajuste: global
  - base tecnica atual: ajuste global auditado via `PUT /dashboard/deputados/ajustes`
  - permissao tecnica atual: somente `PROGRAMADOR` (seguranca para beta)
  Ainda falta decidir com a funcionaria: origem oficial da contagem (`base atual`, `historico` ou outra origem).
- [DONE] `C25-B` nome final do bloco/rotulo.
  Fechado assim:
  - `Objetivo EPI` = eixo principal da operacao
  - `Planilha1` = reflexo operacional/resumo por deputado
  - front atualizado para refletir esse encaixe sem mudar o contrato do campo
- [DONE] `C27` regra oficial do export da operacao.
  Fechado assim:
  - `template mode` passa a ser o padrao quando existe XLSX original importado
  - sem template, o export segue pela trilha atual com headers originais e visual reforcado
  - layout visual do arquivo final foi reforcado sem trocar o contrato do dado exportado

### B) Validacao final (manual/visual)
- [TODO] `C48` validar filtros fortes do historico operacional.
- [TODO] `C49` validar export do relatorio executivo (arquivo e abas).
- [TODO] `C50-A` validar fluxo final da aba `Ajuda e suporte` apos aplicar a regra: historico/chamados so para `PROGRAMADOR`; usuarios comuns apenas solicitam.
- [TODO] validar no navegador o warning de acessibilidade do modal (`aria-hidden`) sem regressao.
  Regra pratica: se nao reaparecer warning real no console, manter como esta.
- [TODO] validar visual final do dashboard expandido da visao Power BI (`C45-A`) no fluxo atual.
  Regra funcional: painel interno fica em modo leitura; integracao externa com `Power BI Desktop` vem depois.

## PENDENCIAS QUE NAO BLOQUEIAM A BETA (POS-BETA)
- [TODO] reabrir `workspace_id` real no backend apenas se a estrategia multi-base voltar no futuro.
- [TODO] refinamento do export para fidelidade visual maior ao original.
- [TODO] redesign do layout principal e dashboard Power BI.
- [TODO] mapa interativo com hover/preview de emenda no dashboard.
- [TODO] migracao para servidor interno (mantendo nuvem ate a base ficar confiavel).
- [TODO] leitura externa Power BI fora do sistema via `Power BI Desktop`.
- [TODO] melhorias finais de acessibilidade e UX.

## PENDENCIAS DE HIGIENE DO MAPA (DOCUMENTACAO)
- [TODO] alinhar itens do `check62.md` que estao como `[ ]` mas ja trazem `| DONE:` no texto.
  Exemplos: `C03`, `C04`, `C18`, `C25-A`, `C35`, `C37..C44`, `C47`, `C50`, `C53..C62`.
  Objetivo: evitar leitura ambigua de status.

## Ordem recomendada para resolver agora
1. `C49-A` (origem oficial da contagem)
2. `C48`
3. `C49`
4. `C50-A`
5. warning `aria-hidden`
6. `C45-A`

## Formato de resposta rapida (para voce me enviar)
1. `C49-A`: <origem oficial da contagem>
2. `C48`: <passou/falhou>
3. `C50-A`: <passou/falhou>
4. `C45-A`: <passou/falhou>

## Criterio de fechamento da beta
Beta fecha quando:
1. bloco A (vereditos restantes) estiver decidido
2. bloco B (validacoes finais) estiver aprovado
3. sem erro critico em smoke/regressao local

## Resume from
- Proxima decisao recomendada: `C49-A`.
- Se quiser validar antes de decidir: comece por `C48`, `C50-A` e `C45-A`.


