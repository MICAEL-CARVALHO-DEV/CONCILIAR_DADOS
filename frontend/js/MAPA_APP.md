# Mapa `app.js`

## Objetivo
Documentar os blocos reais do `app.js` atual para refatorar por partes sem quebrar o projeto.

## Panorama geral
O `app.js` atual concentra:

- configuracao e constantes globais
- estado local e persistencia
- autenticacao e sessao
- cliente de API e sincronizacao
- renderizacao da tabela principal
- modal de edicao da emenda
- importacao e exportacao XLSX
- auditoria visual, presenca e lock de edicao
- utilitarios genericos

## Blocos principais

## 1. Configuracao e constantes
Faixa principal:

- `app.js:10`
- `app.js:147`

Conteudo:

- chaves de storage
- papeis de usuario
- configuracao de API
- flags de websocket
- aliases de importacao
- definicao de campos monitorados

Destino futuro:

- `frontend/js/config.js`
- `frontend/js/constants/*.js` se a modularizacao crescer

## 2. Estado global e bootstrap inicial
Faixa principal:

- `app.js:172`
- `app.js:258`
- `app.js:347`
- `app.js:350`

Conteudo:

- `CURRENT_USER`
- `CURRENT_ROLE`
- `state`
- caches de backend, websocket, locks e import/export
- `loadUserConfig(false)`
- `loadState()`
- `saveState(true)`
- bootstrap com `initSelects()`, `setupAuthUi()`, `setupCrossTabSync()`, `render()` e `initializeAuthFlow()`

Destino futuro:

- `frontend/js/state/store.js`
- `frontend/js/main.js`

## 3. Referencias de DOM
Faixa principal:

- `app.js:260`
- `app.js:344`

Conteudo:

- tabela principal
- filtros
- modal da emenda
- modais auxiliares
- perfil, aprovacoes e auth gate

Problema atual:

- referencias de DOM espalhadas no arquivo raiz

Destino futuro:

- `frontend/js/ui/domRefs.js`
- ou referencias locais por modulo

## 4. Renderizacao da tela principal
Faixa principal:

- `app.js:353`
- `app.js:457`

Conteudo:

- `initSelects()`
- `syncYearFilter()`
- `syncCustomExportFilters()`
- `setSelectOptions()`
- `render()`
- `getFiltered()`

Responsabilidade:

- construir grade principal
- aplicar filtros
- ligar botao `Ver`

Destino futuro:

- `frontend/js/pages/home/mainTable.js`
- `frontend/js/pages/home/filters.js`

## 5. Modal de emenda e edicao local
Faixa principal:

- `app.js:803`
- `app.js:1537`

Conteudo:

- rascunho de campos
- validacao para salvar
- feedback visual
- abertura e fechamento do modal
- timeline
- resumo por usuario
- campos brutos da planilha

Funcoes centrais:

- `initModalDraftForRecord()`
- `renderKvEditor()`
- `saveModalDraftChanges()`
- `requestCloseModal()`
- `openModal()`
- `renderRawFields()`
- `renderMarksSummary()`

Destino futuro:

- `frontend/js/features/emendas/modal.js`
- `frontend/js/features/emendas/draft.js`
- `frontend/js/features/emendas/history.js`

## 6. Regras de progresso, status e resumo operacional
Faixa principal:

- `app.js:1359`
- `app.js:1509`

Conteudo:

- ultima marcacao por usuario
- progresso global
- atencao e atraso
- chips de usuario
- barra de progresso

Destino futuro:

- `frontend/js/features/emendas/progress.js`

## 7. Pipeline de importacao
Faixa principal:

- `app.js:1544`
- `app.js:2100`

Conteudo:

- processar linhas importadas
- criar registro
- merge de importacao
- detectar tipos
- detectar cabecalho
- montar relatorio de validacao
- leitura do XLSX

Funcoes centrais:

- `processImportedRows()`
- `createRecordFromImport()`
- `mergeImportIntoRecord()`
- `parseInputFile()`
- `detectHeaderRow()`

Destino futuro:

- `frontend/js/features/import/processImport.js`
- `frontend/js/features/import/parseWorkbook.js`
- `frontend/js/features/import/validation.js`

## 8. Auth gate e sessao no frontend
Faixa principal:

- `app.js:2180`
- `app.js:2493`

Conteudo:

- login e cadastro no auth gate
- mensagem de auth
- sucesso de autenticacao
- logout
- persistencia do token
- validacao inicial da sessao
- redirect para login

Funcoes centrais:

- `setupAuthUi()`
- `onAuthSuccess()`
- `setAuthenticatedUser()`
- `redirectToAuth()`
- `logoutCurrentUser()`
- `readStoredSessionToken()`
- `writeStoredSessionToken()`
- `clearStoredSessionToken()`
- `initializeAuthFlow()`

Destino futuro:

- `frontend/js/auth/authStore.js`
- `frontend/js/auth/authGuard.js`
- `frontend/js/auth/loginFlow.js`

## 9. Lock de edicao, modo leitura e presenca
Faixa principal:

- `app.js:2493`
- `app.js:3334`

Conteudo:

- perfil de supervisao
- lock de emenda
- modo leitura
- polling do lock
- presenca em websocket
- lista de usuarios ativos

Funcoes centrais:

- `fetchEmendaLockStatus()`
- `acquireEmendaLock()`
- `renewEmendaLock()`
- `releaseEmendaLock()`
- `syncModalEmendaLock()`
- `announcePresenceForRecord()`
- `connectApiSocket()`

Destino futuro:

- `frontend/js/features/emendas/lock.js`
- `frontend/js/features/emendas/presence.js`

## 10. Perfil, aprovacao de usuarios e controle de acesso
Faixa principal:

- `app.js:2697`
- `app.js:2945`

Conteudo:

- painel rapido da supervisao
- perfil atual
- aprovacao de cadastros
- permissao por role

Funcoes centrais:

- `renderRoleNotice()`
- `renderSupervisorQuickPanel()`
- `applyAccessProfile()`
- `openProfileModal()`
- `refreshPendingUsersModal()`
- `approvePendingUser()`

Destino futuro:

- `frontend/js/features/users/profile.js`
- `frontend/js/features/users/pendingApprovals.js`
- `frontend/js/features/access/accessProfile.js`

## 11. Sincronizacao com backend
Faixa principal:

- `app.js:2945`
- `app.js:3160`

Conteudo:

- health check
- bootstrap de dados da API
- merge de emendas remotas
- sync de status oficial
- sync de eventos
- garantir emenda no backend

Funcoes centrais:

- `bootstrapApiIntegration()`
- `mergeRemoteEmendas()`
- `syncOfficialStatusToApi()`
- `syncGenericEventToApi()`
- `ensureBackendEmenda()`

Destino futuro:

- `frontend/js/services/emendasApi.js`
- `frontend/js/services/syncService.js`

## 12. Cliente HTTP e tratamento de erro
Faixa principal:

- `app.js:3347`
- `app.js:3613`

Conteudo:

- decisao se API esta ativa
- resolucao de base URL
- wrapper autenticado
- wrapper publico
- headers padrao
- tratamento de conflito e lock
- rollback local apos erro de sync

Funcoes centrais:

- `isApiEnabled()`
- `getApiBaseUrl()`
- `apiRequest()`
- `apiRequestPublic()`
- `buildApiHeaders()`
- `conflictMessageFromError()`
- `refreshRecordConcurrencyFromApi()`
- `rollbackSaveAndReport()`

Destino futuro:

- `frontend/js/api/client.js`
- `frontend/js/api/errors.js`

## 13. Persistencia local e sincronizacao entre abas
Faixa principal:

- `app.js:3775`
- `app.js:3853`

Conteudo:

- `BroadcastChannel`
- notificacao entre abas
- leitura e gravação do estado
- cache de usuarios ativos

Funcoes centrais:

- `setupCrossTabSync()`
- `notifyStateUpdated()`
- `refreshStateFromStorage()`
- `loadState()`
- `saveState()`

Destino futuro:

- `frontend/js/state/storage.js`
- `frontend/js/state/crossTab.js`

## 14. Dashboard de importacao e exportacao
Faixa principal:

- `app.js:4004`
- `app.js:5079`

Conteudo:

- dashboard visual da importacao
- abas do relatorio
- resumo da exportacao
- filtros de export
- exportacao XLSX normal e template
- sincronizacao de lote de import e log de export

Funcoes centrais:

- `renderImportDashboard()`
- `buildImportSummaryHtml()`
- `runExportByScope()`
- `syncImportBatchToApi()`
- `syncImportLinesToApi()`
- `syncExportLogToApi()`
- `exportRecordsToXlsx()`
- `exportRecordsToTemplateXlsx()`
- `buildPlanilha1Aoa()`

Destino futuro:

- `frontend/js/features/import/dashboard.js`
- `frontend/js/features/export/exportModal.js`
- `frontend/js/features/export/xlsxExport.js`

## 15. Utilitarios puros
Faixa principal:

- `app.js:5079`
- `app.js:5184`

Conteudo:

- formatadores
- parse numerico
- texto
- `escapeHtml`
- `debounce`
- `deepClone`

Destino futuro:

- `frontend/js/utils/format.js`
- `frontend/js/utils/parse.js`
- `frontend/js/utils/escape.js`
- `frontend/js/utils/misc.js`

## Ordem recomendada de extracao
Extrair nesta ordem:

1. `utils`
2. `auth`
3. `api/client`
4. `state/storage`
5. `features/emendas/lock + presence`
6. `features/emendas/modal`
7. `features/import`
8. `features/export`
9. `pages/home`

## Arquivos alvo da primeira rodada

- `frontend/js/main.js`
- `frontend/js/api/client.js`
- `frontend/js/auth/authStore.js`
- `frontend/js/auth/authGuard.js`
- `frontend/js/utils/storage.js`
- `frontend/js/utils/dom.js`
- `frontend/js/utils/escape.js`

## Riscos principais da refatoracao do frontend

- quebrar auth e sessao
- quebrar lock de edicao
- quebrar importacao/exportacao
- deixar render da tabela inconsistente
- manter `fetch()` direto espalhado

## Criterio de sucesso da Fase 1 no frontend

- mapa validado
- ordem de extracao definida
- fronteira entre auth, api, state, UI e import/export clara
