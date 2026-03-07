# CHECKLIST
Goal: reduzir acoplamento do `app.js` extraindo blocos de utilitarios para modulos pequenos.
Success: funcoes de progresso/marcacao passam a usar `frontend/js/ui/metrics.js` com fallback seguro.

- [DONE] Criar `frontend/js/utils/export.js` com `getCurrentFilterSnapshot`, `countAuditEvents`, `exportScopeLabel`, `buildExportFilename`, `isCurrentRecord`, `matchesTextFilter`, `buildExportFiltersSnapshot`.
- [DONE] Atualizar `app.js` para usar `exportUtils` com fallback local.
- [DONE] Atualizar `index.html` para carregar `frontend/js/utils/export.js`.
- [DONE] Validar sintaxe e registrar commit `ID-FE-09`.
- [DONE] Criar `frontend/js/ui/metrics.js` com funcoes de progresso/participacao (`getActiveUsersWithLastMark`, `calcProgress`, `getGlobalProgressState`, `renderMemberChips`, `renderProgressBar`, etc.).
- [DONE] Atualizar `app.js` para consumir `progressUtils` com fallback local.
- [DONE] Atualizar `index.html` para carregar `frontend/js/ui/metrics.js`.
- [DONE] Validar sintaxe de `app.js` e `frontend/js/ui/metrics.js`.
- [DONE] Consolidar fluxo de sessao/autenticacao no modulo `frontend/js/auth/authStore.js` e consumir o novo API no `app.js` (token + perfil do usuario com fallback local).
- [DONE] Consolidar `loadUserConfig` para priorizar leitura de perfil via `authStore`.
- [DONE] Remover escrita/leitura direta de `SEC_USER_NAME`/`SEC_USER_ROLE` fora do `authStore` no `app.js`.
- [DONE] Mover leitura de legado `SEC_USER_ID` para `authStore` e usá-la via API de perfil no `app.js`.
- [DONE] Centralizar recuperação/gravação/limpeza de token no `authStore` (incluindo fallback de session/localStorage) e remover lógica de fallback duplicada no `app.js`.
- [DONE] Garantir fallback de token no `app.js` caso `authStore` não esteja disponível no carregamento (session/localStorage direto).
- [DONE] Extrair helpers de template/export (`buildCanonicalColumnMap`, `findHeaderIndexByAliases`, `setWorksheetCellValue`, `runRoundTripCheck`, `buildPlanilha1Aoa`) para `frontend/js/utils/exportTemplate.js`.
- [DONE] Extrair builders de dados de exportação (`buildExportTableData`, `buildAuditLogTableData`, `buildSummaryAoa`) para `frontend/js/utils/exportData.js`.
- [DONE] Extrair utilitário de render da Planilha1 para `frontend/js/ui/importReport.js` com fallback local.
- [DONE] Extrair badge de resumo de exportação (`buildExportSummaryBadgeHtml`) para `frontend/js/ui/importReport.js`.
- [DONE] Delegar `renderImportDashboard` em `frontend/js/ui/importReport.js` com fallback para implementação local.

Active: ID-FE-19
Risks: validar comportamento em dispositivos com storage bloqueado.
