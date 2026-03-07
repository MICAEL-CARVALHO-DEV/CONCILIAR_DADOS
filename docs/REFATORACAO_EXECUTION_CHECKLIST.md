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
- [DONE] Extrair `syncCanonicalToAllFields`/`upsertRawField` para `frontend/js/utils/importNormalization.js` com fallback local no `app.js`.
- [DONE] Extrair `syncReferenceKeys`/`buildReferenceKey` para `frontend/js/utils/importNormalization.js` com fallback local.
- [DONE] Extrair `readStorageValue`/`writeStorageValue`/`removeStorageValue` e helpers de modo de armazenamento (`getStorageMode`, `getPrimaryStorage`, `getSecondaryStorage`) para `frontend/js/utils/storage.js`; `app.js` passa a delegar com fallback.
- [DONE] Ajustar `frontend/js/auth/authStore.js` para reutilizar helpers genéricos de `storageUtils` em acessos de autenticação, reduzindo fallback duplicado.
- [DONE] Delegar leitura/gravação/limpeza de token do `app.js` para `storageUtils` (com fallback preservado).
- [DONE] Ler `API shared key` via `storageUtils.readStorageValue` na configuração do `apiClient`.
- [DONE] Usar `storageUtils.readStorageValue` ao montar headers da API para `X-API-Key`.
- [DONE] Normalizar a assinatura de `wireImportReportTabs` entre `app.js` e `frontend/js/ui/importReport.js`, mantendo compatibilidade retroativa.
- [DONE] Passar `buildExportSummaryBadgeHtml` e `exportScopeLabel` explicitamente para `renderImportDashboard`, reduzindo dependência de fallback implícito.
- [DONE] Padronizar o acesso a `importReportUtils` no topo do `app.js`, removendo verificações repetidas por `typeof`.
- [DONE] Criar `getImportReportUtil()` no `app.js` para centralizar a ponte com `frontend/js/ui/importReport.js`.
- [DONE] Criar `getFilterUtil()` no `app.js` para centralizar a ponte com `frontend/js/ui/filters.js`.
- [DONE] Criar `getUiRenderUtil()` e `getProgressUtil()` no `app.js` para centralizar as pontes com `frontend/js/ui/renderers.js` e `frontend/js/ui/metrics.js`.
- [DONE] Criar `getFormatUtil()`, `getNormalizeUtil()`, `getStatusUtil()`, `getIdUtil()` e `getImportNormalizationUtil()` no `app.js` para centralizar bridges de utilitários puros.
- [DONE] Criar `getStorageUtil()`, `getAuthStoreUtil()`, `getAuthGuardUtil()`, `getApiClientUtil()` e `getConcurrencyUtil()` no `app.js` para centralizar bridges de infraestrutura.
- [DONE] Conectar `exportUtils`, `exportTemplateUtils` e `exportDataUtils` ao `SEC_FRONTEND` no `app.js`, removendo acesso inconsistente por globais soltas.
- [DONE] Criar `getDomUtil()` e `getEscapeUtil()` no `app.js` para centralizar bridges de DOM/escape e remover checagens diretas restantes.
- [DONE] Criar `focusIfPossible()` e `getOptionFunction()` no `app.js` para reduzir guardas repetidos de foco/callback opcional na UI.
- [DONE] Exportar `buildPlanilha1Html` em `frontend/js/ui/importReport.js` para o `app.js` delegar a renderizacao da Planilha1 ao modulo.
- [DONE] Criar `getExportTemplateValue()` no `app.js` para remover acesso direto restante a `exportTemplateUtils.templateCanonicalKeys`.
- [DONE] Criar `getImportReportContext()` no `app.js` para centralizar dependencias dos wrappers de relatorio/importacao e reduzir repeticao de contexto.
- [DONE] Alinhar `renderImportDashboard` do modulo `importReport` com `HOME_CHANGES_LIMIT`, removendo o limite fixo `10` e o reset redundante de `innerHTML`.
- [DONE] Criar `getXlsxApi()`, `getExportTemplateContext()` e `getExportDataContext()` no `app.js` para centralizar dependencias dos wrappers de exportacao/template.
- [DONE] Reutilizar `getXlsxApi()` em `parseInputFile()` para remover o acesso direto restante a `window.XLSX` no fluxo de importacao.
- [DONE] Criar `getUiRenderContext()` no `app.js` para centralizar dependencias passadas aos renderizadores de grade, historico, supervisao e pendencias.
- [DONE] Criar `getFilterContext()` no `app.js` para centralizar dependencias dos wrappers de filtros principais e exportacao customizada.
- [DONE] Criar `getApiClientConfigContext()` e `getConcurrencyConfigContext()` no `app.js` para tirar configuracoes inline de `configureFrontendModules()`.
- [DONE] Criar `getProgressContext()` no `app.js` para centralizar dependencias passadas aos wrappers de `progressUtils`.
- [DONE] Criar `getImportPipelineContext()` no `app.js` para centralizar dependencias do fluxo de mapeamento, criacao e merge de importacao.
- [DONE] Criar `getImportValidationContext()` no `app.js` para centralizar helpers usados no parsing e no diagnostico estrutural da importacao.
- [DONE] Criar `getStatusContext()`, `getNormalizeContext()`, `getIdContext()` e `getImportNormalizationContext()` no `app.js` para reduzir parametros inline em wrappers utilitarios.

Active: ID-FE-48
Risks: validar comportamento em dispositivos com storage bloqueado.
