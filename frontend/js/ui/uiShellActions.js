(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  async function exportOne(ctx) {
    var rec = ctx.getSelected();
    if (!rec) return;

    var templateReady = !!(ctx.lastImportedWorkbookTemplate && ctx.lastImportedWorkbookTemplate.buffer);
    var templateMode = templateReady
      ? globalScope.confirm("Exportar este registro em modo TEMPLATE (mesma estrutura do XLSX original)?")
      : false;
    var roundTripCheck = globalScope.confirm("Executar round-trip check apos exportar? (pode ser mais lento)");
    var filename = "emenda_" + rec.id + "_" + ctx.dateStamp() + ".xlsx";

    var exportMeta = ctx.exportRecordsToXlsx([rec], filename, {
      useOriginalHeaders: true,
      roundTripCheck: roundTripCheck,
      templateMode: templateMode,
      exportScope: ctx.EXPORT_SCOPE.ATUAIS,
      exportFilters: { single_id: rec.id }
    });
    if (!exportMeta) return;

    ctx.setLatestExportReport({
      escopo: ctx.EXPORT_SCOPE.ATUAIS,
      arquivoNome: filename,
      quantidadeRegistros: 1,
      filtros: { single_id: rec.id },
      geradoEm: ctx.isoNow()
    });
    ctx.renderImportDashboard();

    await ctx.syncExportLogToApi({
      formato: "XLSX",
      arquivoNome: filename,
      quantidadeRegistros: 1,
      quantidadeEventos: ctx.countAuditEvents([rec]),
      filtros: { single_id: rec.id },
      modoHeaders: templateMode ? "template_original" : "originais",
      escopoExportacao: ctx.EXPORT_SCOPE.ATUAIS,
      roundTripOk: exportMeta && exportMeta.roundTrip ? exportMeta.roundTrip.ok : null,
      roundTripIssues: exportMeta && exportMeta.roundTrip ? (exportMeta.roundTrip.issues || []) : []
    });
  }

  async function runExportAtuais(ctx) {
    await ctx.runExportByScope(ctx.EXPORT_SCOPE.ATUAIS);
  }

  async function runExportHistorico(ctx) {
    await ctx.runExportByScope(ctx.EXPORT_SCOPE.HISTORICO);
  }

  async function runCustomExport(filters, ctx) {
    return ctx.runExportByScope(ctx.EXPORT_SCOPE.PERSONALIZADO, { customFilters: filters });
  }

  root.uiShellActions = {
    exportOne: exportOne,
    runExportAtuais: runExportAtuais,
    runExportHistorico: runExportHistorico,
    runCustomExport: runCustomExport
  };
})(typeof window !== "undefined" ? window : globalThis);

