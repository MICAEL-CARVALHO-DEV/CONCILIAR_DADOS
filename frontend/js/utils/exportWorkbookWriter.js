(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function tableToAoa(table) {
    var source = table && typeof table === "object" ? table : {};
    var headers = Array.isArray(source.headers) ? source.headers : [];
    var rows = Array.isArray(source.rows) ? source.rows : [];
    return [headers].concat(rows.map(function (rowObj) {
      return headers.map(function (header) {
        return rowObj && rowObj[header] != null ? rowObj[header] : "";
      });
    }));
  }

  function exportRecordsToXlsx(records, filename, options, dependencies) {
    var dep = dependencies && typeof dependencies === "object" ? dependencies : {};
    var xlsxApi = dep.xlsxApi;
    if (!xlsxApi) {
      if (typeof dep.notify === "function") dep.notify("Biblioteca XLSX nao carregada.");
      return null;
    }

    var opts = options || {};
    if (opts.templateMode && typeof dep.exportRecordsToTemplateXlsx === "function") {
      return dep.exportRecordsToTemplateXlsx(records, filename, opts, xlsxApi);
    }

    var buildExportTableData = typeof dep.buildExportTableData === "function" ? dep.buildExportTableData : function () {
      return { headers: [], rows: [] };
    };
    var buildAuditLogTableData = typeof dep.buildAuditLogTableData === "function" ? dep.buildAuditLogTableData : function () {
      return { headers: [], rows: [] };
    };
    var buildSummaryAoa = typeof dep.buildSummaryAoa === "function" ? dep.buildSummaryAoa : function () { return []; };
    var buildPlanilha1Aoa = typeof dep.buildPlanilha1Aoa === "function" ? dep.buildPlanilha1Aoa : function () { return []; };
    var runRoundTripCheck = typeof dep.runRoundTripCheck === "function" ? dep.runRoundTripCheck : function () {
      return { ok: true, issues: [] };
    };

    var dataTable = buildExportTableData(records, opts);
    var dataAoa = tableToAoa(dataTable);

    var auditTable = buildAuditLogTableData(records);
    var exportScope = dep.exportScopeAtuais || "ATUAIS";
    var summaryAoa = buildSummaryAoa(records, auditTable.rows.length, opts.exportScope || exportScope, opts.exportFilters || {});
    var auditAoa = tableToAoa(auditTable);
    var auditSheetAoa = summaryAoa.concat([[]]).concat(auditAoa);

    var wsData = xlsxApi.utils.aoa_to_sheet(dataAoa);
    var wsAudit = xlsxApi.utils.aoa_to_sheet(auditSheetAoa);
    var wsPlanilha1 = xlsxApi.utils.aoa_to_sheet(buildPlanilha1Aoa(records));
    var workbook = xlsxApi.utils.book_new();
    xlsxApi.utils.book_append_sheet(workbook, wsPlanilha1, "Planilha1");
    xlsxApi.utils.book_append_sheet(workbook, wsData, "Controle de EPI");
    xlsxApi.utils.book_append_sheet(workbook, wsAudit, "AuditLog");

    var roundTrip = null;
    if (opts.roundTripCheck) {
      var check = runRoundTripCheck(workbook, dataTable.headers);
      roundTrip = check;
      if (!check.ok && typeof dep.notify === "function") {
        dep.notify("Round-trip check encontrou divergencias\n" + check.issues.join("\n"));
      }
    }

    var finalFilename = filename || ("emendas_export_" + (typeof dep.dateStamp === "function" ? dep.dateStamp() : String(Date.now())) + ".xlsx");
    xlsxApi.writeFile(workbook, finalFilename);

    return {
      totalRegistros: Array.isArray(records) ? records.length : 0,
      totalEventos: Array.isArray(auditTable.rows) ? auditTable.rows.length : 0,
      roundTrip: roundTrip
    };
  }

  root.exportWorkbookWriterUtils = {
    exportRecordsToXlsx: exportRecordsToXlsx
  };
})(window);
