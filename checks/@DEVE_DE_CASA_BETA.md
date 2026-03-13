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
- [DONE] `LOA x TESTE x FEDERAL` alinhado para fase beta (FEDERAL futura).
- [DONE] `workspace_id` completo no backend adiado para pos-beta.

## PENDENCIAS BLOQUEADORAS DA BETA
### A) Veredito funcional (depende da sua decisao)
- [TODO] `C19-A` / `P-R02` cadeia oficial de import (`raiz -> import2 -> import3`).
  Falta decidir: base consolidada x camadas, selecao de contexto e trilha por lote/emenda.
- [TODO] `C49-A` / `P-R03` regra final da contagem de deputado.
  Falta decidir: origem da contagem (base atual x historico), escopo do ajuste (import/planilha/global) e permissao de ajuste.
- [TODO] `C25-B` / `P-R05` fechar oficialmente `objetivo_epi`.
  Falta decidir: entra ou nao na beta; se entrar, origem e tipo (`estrutural` ou `operacional`).
- [TODO] `C27` regra oficial do export da operacao.
  Falta decidir: export oficial em `template mode` por padrao (`SIM/NAO`).
- [TODO] `P-R06` trilha de servidor interno + Power BI externo.
  Falta decidir: fase de migracao e momento da leitura externa.

### B) Validacao final (manual/visual)
- [TODO] `C48` validar filtros fortes do historico operacional.
- [TODO] `C49` validar export do relatorio executivo (arquivo e abas).
- [TODO] `C50-A` validar fluxo completo da aba `Ajuda e suporte`.
- [TODO] validar no navegador o warning de acessibilidade do modal (`aria-hidden`) sem regressao.
- [TODO] validar visual final do dashboard expandido da visao Power BI (`C45-A`) no fluxo atual.

## PENDENCIAS QUE NAO BLOQUEIAM A BETA (POS-BETA)
- [TODO] `workspace_id` real no backend para separar `LOA/TESTE/FEDERAL` no banco/API.
- [TODO] refinamento do export para fidelidade visual maior ao original.
- [TODO] redesign do layout principal e dashboard Power BI.
- [TODO] mapa interativo com hover/preview de emenda no dashboard.
- [TODO] migracao para servidor interno (se infraestrutura aprovar).
- [TODO] leitura externa Power BI fora do sistema.
- [TODO] melhorias finais de acessibilidade e UX.

## PENDENCIAS DE HIGIENE DO MAPA (DOCUMENTACAO)
- [TODO] alinhar itens do `check62.md` que estao como `[ ]` mas ja trazem `| DONE:` no texto.
  Exemplos: `C03`, `C04`, `C18`, `C25-A`, `C35`, `C37..C44`, `C47`, `C50`, `C53..C62`.
  Objetivo: evitar leitura ambigua de status.

## Ordem recomendada para resolver agora
1. `C19-A`
2. `C49-A`
3. `C25-B`
4. `C27`
5. `C48`
6. `C49`
7. `C50-A`
8. warning `aria-hidden`

## Formato de resposta rapida (para voce me enviar)
1. `C19-A`: <decisao>
2. `C49-A`: <decisao>
3. `C25-B`: <decisao>
4. `C27`: <decisao>
5. `P-R06`: <decisao>

## Criterio de fechamento da beta
Beta fecha quando:
1. bloco A (vereditos) estiver decidido
2. bloco B (validacoes finais) estiver aprovado
3. sem erro critico em smoke/regressao local

## Resume from
- Proxima decisao recomendada: `C19-A`.
- Se quiser validar antes de decidir: comece por `C48` e `C50-A`.


