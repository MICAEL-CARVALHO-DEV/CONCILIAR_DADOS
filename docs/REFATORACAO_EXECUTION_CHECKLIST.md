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

Active: ID-FE-13
Risks: validar login local sem API após alteração de fallback legado e checar compatibilidade em ambiente legado.
