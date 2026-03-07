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
- [DONE] Manter compatibilidade de fallback no `app.js` enquanto o fluxo de auth modulariza o estado e reduz acoplamento.

Active: ID-FE-11
Risks: divergencia pontual entre leitura de perfil via `authStore` e fallback legado; mitigada mantendo fallback de `localStorage` enquanto nao retirar dependencias totalmente.
