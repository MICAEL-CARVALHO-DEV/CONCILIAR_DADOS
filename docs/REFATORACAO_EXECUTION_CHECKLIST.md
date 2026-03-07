# CHECKLIST
Goal: reduzir acoplamento do `app.js` extraindo utilitarios de exportacao para modulo dedicado
Success: filtros e exportacao usam funcoes utilitarias compartilhadas sem alterar comportamento.

- [DONE] Criar `frontend/js/utils/export.js` com `getCurrentFilterSnapshot`, `countAuditEvents`, `exportScopeLabel`, `buildExportFilename`, `isCurrentRecord`, `matchesTextFilter`, `buildExportFiltersSnapshot`.
- [DONE] Atualizar `app.js` para usar `exportUtils` com fallback local.
- [DONE] Atualizar `index.html` para carregar `frontend/js/utils/export.js`.
- [DONE] Validar sintaxe e registrar commit `ID-FE-09`.

Active: ID-FE-10
Risks: nenhum ativo.
