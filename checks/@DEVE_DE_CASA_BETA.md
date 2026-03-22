# @DEVE DE CASA - CENTRAL UNICA DE PENDENCIAS BETA SEC

CHECKLIST
Goal: Centralizar todas as pendencias (decisao, validacao, execucao e pos-beta) em um unico arquivo para eliminar retrabalho e duplicidade entre checks.
Success: Qualquer duvida de "o que falta" e respondida aqui, sem precisar cruzar varios arquivos.

## Regra oficial de uso
- `PLANO_MESTRE_UNIFICADO.md` define a prioridade unica, o recorte ativo e a ordem oficial de execucao.
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
- [DONE] `C49-A` / `P-R03` regra final da contagem de deputado.
  Fechado assim:
  - origem oficial da contagem: `BASE_ATUAL` consolidada
  - ajuste manual: habilitado em escopo global, com trilha de auditoria
  - permissao de ajuste: somente `PROGRAMADOR` via `PUT /dashboard/deputados/ajustes`
  - usuarios operacionais: podem visualizar a politica e a leitura de contagem
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
- [DONE] `C48` validar filtros fortes do historico operacional.
  Status tecnico: hardening aplicado em 17/03/2026 (normalizacao de caixa/espacos em filtros de historico no front e backend).
  Veredito manual/tecnico em 17/03/2026: `PASSOU`.
- [DONE] `C49` validar export do relatorio executivo (arquivo e abas).
  Status tecnico: validacao estrutural das abas obrigatorias adicionada no export executivo em 17/03/2026.
  Veredito manual/tecnico em 17/03/2026: `PASSOU`.
- [DONE] `C50-A` validar fluxo final da aba `Ajuda e suporte` apos aplicar a regra: historico/chamados so para `PROGRAMADOR`; usuarios comuns apenas solicitam.
  Status tecnico: hardening aplicado em 17/03/2026 (polling/inbox do suporte restritos ao `PROGRAMADOR`; usuario comum permanece em fluxo de solicitacao).
  Veredito manual/tecnico em 17/03/2026: `PASSOU`.
- [DONE] validar no navegador o warning de acessibilidade do modal (`aria-hidden`) sem regressao.
  Status tecnico: hardening de foco ao fechar modais aplicado em 17/03/2026 para reduzir risco de warning `aria-hidden`.
  Veredito manual/tecnico em 17/03/2026: `PASSOU`.
  Regra pratica: se nao reaparecer warning real no console, manter como esta.
- [DONE] validar visual final do dashboard expandido da visao Power BI (`C45-A`) no fluxo atual.
  Status tecnico: modo "Expandir leitura" implementado em 17/03/2026 para desktop (persistencia local + grid expandido + maior densidade de leitura).
  Veredito manual/tecnico em 17/03/2026: `PASSOU`.
  Regra funcional: painel interno fica em modo leitura; integracao externa com `Power BI Desktop` vem depois.

### C) Hardening tecnico para beta publica
- [DONE] `U08-B` Remover a exposicao do token de reset na resposta de `POST /auth/recovery-request` e retirar do front a leitura de `Token para simulacao`.
  Status tecnico: hardening aplicado em 21/03/2026 no backend e no front; resposta publica ficou generica e o link de debug so existe em contexto local controlado.
  Veredito tecnico: `PASSOU`.
- [DONE] `U09-B` Atualizar o workflow oficial do Cloudflare Pages para publicar a estrutura real do app atual.
  Status tecnico: workflow alinhado ao builder oficial `.cf-pages-dist`; Cloudflare Pages passou a publicar direto do `main`.
  Veredito tecnico: `PASSOU`.
- [DONE] `U09-C` Fazer `npm run lint` voltar a ser gate confiavel do front.
  Status tecnico: baseline ajustado ao contrato atual, workflow dedicado criado e `npm run lint` voltou a passar com `0 errors`.
  Veredito tecnico: `PASSOU`.
- [DONE] `U08-C` Reduzir a persistencia ampla do token de sessao no navegador antes de abrir mais a beta.
  Status tecnico: hardening aplicado em 21/03/2026 para manter token e perfil autenticado em `sessionStorage`, com migracao/limpeza automatica do legado em `localStorage`.
  Veredito tecnico: `PASSOU`.

### D) Regras operacionais saneadas
- [DONE] `R05` Consolidar `C03`, `C04`, `C18` e `C27` em regra unica da beta.
  Status tecnico: politica oficial publicada em `docs/politica_operacional_beta.md` e mapa historico/checklists alinhados ao mesmo entendimento.
  Veredito tecnico: `PASSOU`.

### E) Auth operacional e contingencia
- [DONE] `R06` Consolidar politica operacional de senha, bloqueio e contingencia.
  Status tecnico: politica oficial publicada em `docs/politica_auth_contingencia_beta.md`, backend alinhado ao contrato de lockout em `settings` e cadastro local passou a validar a politica de senha oficial.
  Veredito tecnico: `PASSOU`.

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
  Exemplos: `C25-A`, `C35`, `C37..C44`, `C47`, `C50`, `C53..C62`.
  Objetivo: evitar leitura ambigua de status.

## Ordem recomendada para resolver agora
1. `R07`
2. `R08`
3. `R09`

## Quadro objetivo de ataque
- `AGORA`: beta funcional ja fechada com `R06`
  Proxima prioridade operacional: backup, restauracao e gate automatizado.
- `DEPOIS DA BETA FUNCIONANDO`: `R07` e `R08`
  Fazer manutencao com o carro em movimento: backup diario real, prova de restauracao em PostgreSQL local e teste automatico para evitar regressao silenciosa.
- `FUTURO`: `R09` e `R10`
  BI externo, decisao de infraestrutura e demais refinamentos pos-beta.

## Formato de resposta rapida (para voce me enviar)
1. `R07`: `PASSOU` ou `FALHOU`
2. `R08`: `PASSOU` ou `FALHOU`
3. `R09`: `PASSOU` ou `FALHOU`

## Criterio de fechamento da beta
Beta fecha quando:
1. bloco A (vereditos restantes) estiver decidido
2. bloco B (validacoes finais) estiver aprovado
3. bloco C (hardening tecnico para beta publica) estiver aprovado
4. sem erro critico em smoke/regressao local

## Resume from
- Proximo bloco recomendado: executar `R07` como proximo corte de manutencao operacional da beta em uso real.


