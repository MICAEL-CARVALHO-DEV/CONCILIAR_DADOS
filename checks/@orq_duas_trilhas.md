# @ORQ DUAS TRILHAS - BACKEND E FRONT BETA

CHECKLIST
Goal: Operar `Codex VS Code` e `Codex Desktop` em paralelo com ORQ, acelerando `backend + deve de casa` e `front beta` sem perder contexto nem quebrar contrato entre as frentes.
Success: Cada sessao sabe o que pode tocar, qual entrega vem primeiro, quando precisa fazer handoff e onde registrar bloqueio.

## Regra oficial desta fase
- `Codex VS Code` assume `backend + deve de casa tecnico`.
- `Codex Desktop` assume `front beta + Figma + organizacao visual`.
- `ORQ` decide prioridade, integra contratos e destrava conflito.
- As duas sessoes trabalham como `irmaos`: podem ler, revisar e acompanhar o que o outro esta fazendo no `front` e no `back` para manter a mesma linha de ideia.
- A separacao existe para evitar conflito de edicao, nao para isolar pensamento.
- Mudanca de contrato de API precisa virar handoff antes do front consumir.
- Mudanca visual grande do front nao pode remover `id` ou classe congelada em `@front_beta.md`.

## Entradas oficiais
- Regra funcional: `@deve_de_casa_beta.md`
- Regra visual/front: `@front_beta.md`
- Operacao dupla: `../docs/operacao_codex_duplo.md`
- Governanca ORQ: `../docs/orquestracao_multi_ia.md`

## TRILHA A - BACKEND / VS CODE
- [DONE] `ORQ-BACK-01` Ler `@deve_de_casa_beta.md` e separar o que e decisao sua x o que ja da para preparar tecnicamente.
  Pronto quando: existir mapa curto de tarefas backend que nao dependem do front.
- [DONE] `ORQ-BACK-02` Preparar contratos leves para o front beta consumir sem puxar conta para o navegador.
  Pronto quando: resumos/endpoints auxiliares estiverem expostos com payload estavel.
- [DONE] `ORQ-BACK-03` Fechar governanca tecnica de import/export e historico no backend.
  Pronto quando: lotes, resumos, filtros e logs estiverem prontos para plugar no front.
  Atual:
  - `GET /dashboard/resumo` pronto
  - `GET /imports/resumo` pronto
  - `GET /audit/resumo` pronto
  - `GET /support/resumo` pronto
  - `GET /exports/resumo` pronto
- [DONE] `ORQ-BACK-04` Executar validacao tecnica local de cada corte.
  Pronto quando: py_compile, smoke ou validacao equivalente passar sem regressao clara.
- [DONE] `ORQ-BACK-05` Emitir handoff para o front beta.
  Pronto quando: endpoint, campos, risco e proximo passo estiverem escritos.
- [DONE] `ORQ-BACK-06` Aplicar regras ja decididas de autonomia sem quebrar contrato.
  Pronto quando: suporte completo ficar restrito ao `PROGRAMADOR` e dono do lote puder corrigir/remover o proprio import.

## TRILHA B - FRONT BETA / DESKTOP
- [DONE] `ORQ-FRONT-01` Rodar `FB-01`, `FB-02` e `FB-03` do `@front_beta.md`.
  Pronto quando: shell visual, contrato congelado e plano de encaixe estiverem fechados.
- [DONE] `ORQ-FRONT-02` Definir a versao escolhida do layout de referencia.
  Pronto quando: existir direcao visual clara para sidebar, header, abas e tabela, com base oficial externa travada.
- [DONE] `ORQ-FRONT-03` Montar a casca nova sem tocar contrato funcional.
  Pronto quando: `FB-04`, `FB-05` e `FB-06` estiverem claros para implementacao.
- [DONE] `ORQ-FRONT-04` Reencaixar planilha e blocos secundarios.
  Pronto quando: `FB-07`, `FB-08` e `FB-09` tiverem ordem segura de entrada.
- [DONE] `ORQ-FRONT-05` Emitir handoff para o backend.
  Pronto quando: dependencia de API, nomes de blocos e areas sensiveis estiverem escritas.

## Radar cruzado oficial
### Backend / VS Code
- Estado: backend ativo, com trilha de governanca tecnica e endpoints de resumo publicados.
- Ultimo corte validado: `py_compile` ok + smoke com `FastAPI TestClient` ok em `/dashboard/resumo`, `/imports/resumo`, `/exports/resumo`, `/audit/resumo` e `/support/resumo`.
- Regras beta aplicadas no backend:
  - historico/gestao completa de suporte restritos ao `PROGRAMADOR`
  - dono do lote pode governar o proprio import (`CORRIGIR` / `REMOVER`)
- Arquivos quentes: `backend/app/api/operations.py`, `backend/app/schemas.py`, `backend/app/services/audit_service.py`, `backend/app/services/import_export_service.py`, `backend/app/services/support_service.py`, `backend/app/services/dashboard_service.py`.

### Front / Desktop
- Estado: front principal concluido e adaptado ao contrato atual, sem reabrir `login` e `cadastro`.
- Ultimo corte validado: IDs criticos unicos, `node --check` ok e smoke HTTP ok em `index.html`, `frontend/pages/login.html`, `frontend/pages/cadastro.html` e `style.css`.
- Arquivos quentes: `index.html`, `style.css`, `app.js`, `frontend/js/ui/betaWorkspace.js`, `frontend/js/ui/importReport.js`.

## Protocolo de sincronia entre irmaos
- `Desktop` pode acompanhar o que o backend esta fazendo lendo este check, os handoffs e o diff atual antes de tocar o front.
- `VS Code` pode acompanhar o que o front esta fazendo lendo este check, os handoffs e o diff atual antes de tocar backend ou contrato.
- As duas sessoes podem revisar ideias uma da outra, mas cada uma respeita o dono da trilha antes de editar.
- `Desktop` pode sugerir impacto de front no backend; `VS Code` pode sugerir impacto de backend no front. Essa troca e desejada.
- Leitura cruzada dos arquivos quentes e parte do fluxo normal; o que exige cuidado e so a edicao simultanea de arquivo/contrato sensivel.
- Mudou payload, endpoint, campo ou regra de permissao: publicar handoff aqui antes de pedir consumo na outra trilha.
- Mudou encaixe visual, bloco, contexto ou necessidade de dado novo: publicar handoff aqui antes de pedir ajuste no backend.
- Se as duas sessoes quiserem tocar `app.js`, `index.html`, `style.css`, auth, bootstrap ou contrato ao mesmo tempo, volta para ORQ.

## Handoff backend -> front beta (atual)
```txt
Objetivo: expor resumos leves para o shell beta sem obrigar o front a montar conta pesada no navegador.
Arquivos tocados: backend/app/api/operations.py; backend/app/schemas.py; backend/app/services/audit_service.py; backend/app/services/import_export_service.py; backend/app/services/support_service.py; backend/app/services/dashboard_service.py
Contrato afetado: novos GET /dashboard/resumo, /imports/resumo, /exports/resumo, /audit/resumo e /support/resumo
Campos novos: totais, contagens, latest_event/latest_lot/latest_thread/latest_export e escopo resumido por modulo
Campos removidos: nenhum
Nao quebrar: payloads ja consumidos pelo front atual; regras de acesso por perfil; contratos 401/403
Proximo passo: front consumir quando precisar enriquecer shell beta sem recriar agregacao no navegador
```

## Handoff front beta -> backend (atual)
```txt
Objetivo: manter o shell principal institucional e adaptado ao contrato atual, sem criar fluxo paralelo e sem quebrar ids/classes congeladas.
Arquivos tocados: index.html; style.css; app.js; frontend/js/ui/betaWorkspace.js; frontend/js/ui/importReport.js
Contrato afetado: nenhum contrato novo de API; front continua acoplado ao contrato atual
Campos novos: nenhum obrigatorio
Campos removidos: nenhum
Nao quebrar: statusFilter, searchInput, yearFilter, mainTableCard, betaWorkspace, importReport, modal e demais ids congelados em @front_beta.md
Proximo passo: backend pode seguir evoluindo resumos e governanca; se mudar payload, registrar aqui antes do front consumir
```

## Handoff obrigatorio entre as trilhas
Usar este formato:

```txt
Objetivo:
Arquivos tocados:
Contrato afetado:
Campos novos:
Campos removidos:
Nao quebrar:
Proximo passo:
```

## Bloqueios que voltam para ORQ
- backend mudou payload sem avisar o front
- front quer remover `id` ou classe congelada
- duas sessoes querem tocar o mesmo contrato ao mesmo tempo
- decisao do `@deve_de_casa_beta.md` continua em aberto e trava implementacao

## Ordem recomendada agora
1. `ORQ-BACK-01`
2. `ORQ-FRONT-01`
3. `ORQ-BACK-02`
4. `ORQ-FRONT-02`
5. `ORQ-BACK-03`
6. `ORQ-FRONT-03`

## Checkpoint
Active: `ORQ-FRONT-05`
Blocked: nenhum
Resume from: backend base validado; proxima rodada depende do consumo desses resumos pelo front beta ou de novas decisoes do `@deve_de_casa_beta.md`.
