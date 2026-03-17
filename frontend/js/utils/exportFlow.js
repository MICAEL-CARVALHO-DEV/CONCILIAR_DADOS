(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function filterRecordsForExport(scope, customFilters, records, dependencies) {
    var dep = dependencies && typeof dependencies === "object" ? dependencies : {};
    var scopeValues = dep.exportScope || {};
    var list = Array.isArray(records) ? records.slice() : [];

    if (scope === scopeValues.HISTORICO) {
      return list;
    }

    if (scope === scopeValues.PERSONALIZADO) {
      var filters = customFilters || {};
      var year = String(filters.ano || "").trim();
      var status = String(filters.status || "").trim();
      var deputado = String(filters.deputado || "").trim();
      var municipio = String(filters.municipio || "").trim();
      var includeOld = !!filters.include_old;

      return list.filter(function (record) {
        if (!includeOld && typeof dep.isCurrentRecord === "function" && !dep.isCurrentRecord(record)) return false;
        if (year && String((typeof dep.toInt === "function" ? dep.toInt(record && record.ano) : record && record.ano) || "") !== year) return false;
        if (status && typeof dep.getRecordCurrentStatus === "function" && typeof dep.normalizeStatus === "function") {
          if (dep.getRecordCurrentStatus(record) !== dep.normalizeStatus(status)) return false;
        }
        if (typeof dep.matchesTextFilter === "function" && !dep.matchesTextFilter(record && record.deputado, deputado)) return false;
        if (typeof dep.matchesTextFilter === "function" && !dep.matchesTextFilter(record && record.municipio, municipio)) return false;
        return true;
      });
    }

    return list.filter(function (record) {
      return typeof dep.isCurrentRecord === "function" ? dep.isCurrentRecord(record) : true;
    });
  }

  async function runExportByScope(scope, options, dependencies) {
    var dep = dependencies && typeof dependencies === "object" ? dependencies : {};
    var opts = options || {};
    var scopeValues = dep.exportScope || {};
    var exportScope = scope || scopeValues.ATUAIS;
    var customFilters = opts.customFilters || null;
    var confirmFn = typeof dep.confirm === "function" ? dep.confirm : function () { return true; };
    var alertFn = typeof dep.alert === "function" ? dep.alert : function () {};
    var scopeLabel = typeof dep.exportScopeLabel === "function" ? dep.exportScopeLabel(exportScope) : String(exportScope || "");

    if (exportScope !== scopeValues.ATUAIS) {
      var ok = confirmFn("Confirmar exportacao no modo " + scopeLabel + "?");
      if (!ok) return false;
    }

    var selectedRecords = typeof dep.filterRecordsForExport === "function"
      ? dep.filterRecordsForExport(exportScope, customFilters)
      : [];
    if (!selectedRecords.length) {
      alertFn("Nenhum registro encontrado para o modo de exportacao selecionado.");
      return false;
    }

    var officialLayout = true;
    var templateMode = false;
    var modeOriginal = false;
    var roundTripCheck = false;
    var filename = typeof dep.buildExportFilename === "function" ? dep.buildExportFilename(exportScope) : "";
    var filtersSnapshot = typeof dep.buildExportFiltersSnapshot === "function"
      ? dep.buildExportFiltersSnapshot(exportScope, customFilters)
      : {};

    var exportMeta = typeof dep.exportRecordsToXlsx === "function"
      ? dep.exportRecordsToXlsx(selectedRecords, filename, {
          useOriginalHeaders: modeOriginal,
          roundTripCheck: roundTripCheck,
          templateMode: templateMode,
          officialLayout: officialLayout,
          includeAuditLog: false,
          exportScope: exportScope,
          exportFilters: filtersSnapshot
        })
      : null;
    if (!exportMeta) return false;

    if (typeof dep.onLatestExportReport === "function") {
      dep.onLatestExportReport({
        escopo: exportScope,
        arquivoNome: filename,
        quantidadeRegistros: selectedRecords.length,
        filtros: filtersSnapshot,
        geradoEm: typeof dep.isoNow === "function" ? dep.isoNow() : new Date().toISOString()
      });
    }

    if (typeof dep.renderImportDashboard === "function") {
      dep.renderImportDashboard();
    }

    if (typeof dep.syncExportLogToApi === "function") {
      await dep.syncExportLogToApi({
        formato: "XLSX",
        arquivoNome: filename,
        quantidadeRegistros: selectedRecords.length,
        quantidadeEventos: officialLayout ? 0 : (typeof dep.countAuditEvents === "function" ? dep.countAuditEvents(selectedRecords) : 0),
        filtros: filtersSnapshot,
        modoHeaders: officialLayout ? "layout_oficial" : (templateMode ? "template_original" : (modeOriginal ? "originais" : "normalizados")),
        escopoExportacao: exportScope,
        roundTripOk: exportMeta && exportMeta.roundTrip ? exportMeta.roundTrip.ok : null,
        roundTripIssues: exportMeta && exportMeta.roundTrip ? (exportMeta.roundTrip.issues || []) : []
      });
    }

    return true;
  }

  root.exportFlowUtils = {
    filterRecordsForExport: filterRecordsForExport,
    runExportByScope: runExportByScope
  };
})(window);
