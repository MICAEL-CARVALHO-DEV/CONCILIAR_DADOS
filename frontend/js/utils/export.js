(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function getCurrentFilterSnapshot(config) {
    var c = config || {};
    var statusFilter = c.statusFilter || null;
    var yearFilter = c.yearFilter || null;
    var searchInput = c.searchInput || null;

    return {
      status: statusFilter ? String(statusFilter.value || "") : "",
      ano: yearFilter ? String(yearFilter.value || "") : "",
      busca: searchInput ? String((searchInput.value || "").trim()) : ""
    };
  }

  function countAuditEvents(records) {
    return (records || []).reduce(function (acc, rec) {
      return acc + ((rec && Array.isArray(rec.eventos)) ? rec.eventos.length : 0);
    }, 0);
  }

  function exportScopeLabel(scope, scopeValues) {
    if (!scopeValues) return String(scope || "");
    if (scope === scopeValues.HISTORICO) return "HISTORICO";
    if (scope === scopeValues.PERSONALIZADO) return "PERSONALIZADO";
    return "ATUAIS";
  }

  function buildExportFilename(scope, scopeValues, suffixes, dateStampFn) {
    var suffix = scope && suffixes && suffixes[scope] ? suffixes[scope] : (suffixes && suffixes.ATUAIS ? suffixes.ATUAIS : "atual");
    var stamp = typeof dateStampFn === "function" ? dateStampFn() : String(new Date().getTime());
    return "emendas_export_" + stamp + "_" + suffix + ".xlsx";
  }

  function isCurrentRecord(rec) {
    return !(rec && Object.prototype.hasOwnProperty.call(rec, "is_current") && rec.is_current === false);
  }

  function matchesTextFilter(value, term, normalizeFn) {
    var normalize = typeof normalizeFn === "function" ? normalizeFn : function (v) {
      return String(v == null ? "" : v).toLowerCase();
    };
    var src = normalize(value || "");
    var q = normalize(term || "");
    if (!q) return true;
    return src.indexOf(q) >= 0;
  }

  function buildExportFiltersSnapshot(scope, customFilters, baseFilterFactory, scopeLabelFactory) {
    var snapshot = typeof baseFilterFactory === "function" ? (baseFilterFactory() || {}) : {};
    snapshot.escopo = typeof scopeLabelFactory === "function" ? scopeLabelFactory(scope) : String(scope || "ATUAIS");
    if (snapshot.escopo === "") {
      snapshot.escopo = String(scope || "ATUAIS");
    }

    if (scope === "PERSONALIZADO") {
      var custom = customFilters || {};
      snapshot.personalizado = {
        ano: custom.ano ? String(custom.ano) : "",
        status: custom.status ? String(custom.status) : "",
        deputado: custom.deputado ? String(custom.deputado) : "",
        municipio: custom.municipio ? String(custom.municipio) : "",
        include_old: !!custom.include_old
      };
    }

    return snapshot;
  }

  root.exportUtils = {
    getCurrentFilterSnapshot: getCurrentFilterSnapshot,
    countAuditEvents: countAuditEvents,
    exportScopeLabel: exportScopeLabel,
    buildExportFilename: buildExportFilename,
    isCurrentRecord: isCurrentRecord,
    matchesTextFilter: matchesTextFilter,
    buildExportFiltersSnapshot: buildExportFiltersSnapshot
  };
})(window);
