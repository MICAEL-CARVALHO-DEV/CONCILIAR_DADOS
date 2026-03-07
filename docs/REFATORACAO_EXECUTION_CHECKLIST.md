# CHECKLIST
Goal: reduzir acoplamento do `app.js` extraindo utilitarios de filtros e selects para modulo de UI
Success: filtros e selects continuam funcionando sem alteração de comportamento, com fallback compatível.

- [DONE] Criar `frontend/js/ui/filters.js` com `setSelectOptions`, `syncYearFilter`, `syncCustomExportFilters`, `initSelects`.
- [DONE] Trocar chamadas de `app.js` para usar `filterUtils` com fallback local.
- [DONE] Atualizar `index.html` para carregar `frontend/js/ui/filters.js`.
- [DONE] Validar sintaxe e registrar commit `ID-FE-08`.

Active: ID-FE-09
Risks: nenhum ativo. Múltiplas chamadas a `syncYearFilter` e `syncCustomExportFilters` já cobertas por fallback e parâmetros explícitos no módulo.
