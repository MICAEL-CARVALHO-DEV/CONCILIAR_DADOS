(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function resolveTemplateTargetSheets(workbook, records) {
    var preferred = "Controle de EPI";
    if (workbook && Array.isArray(workbook.SheetNames) && workbook.SheetNames.includes(preferred)) {
      return [preferred];
    }

    var used = new Set();
    (records || []).forEach(function (record) {
      var name = String((record && record.source_sheet) || "").trim();
      if (name) used.add(name);
    });

    var workbookSheetNames = workbook && Array.isArray(workbook.SheetNames) ? workbook.SheetNames : [];
    var out = workbookSheetNames.filter(function (name) { return used.has(name); });
    return out.length ? out : workbookSheetNames.slice();
  }

  function exportRecordsToTemplateXlsx(records, filename, options, dependencies) {
    var opts = options || {};
    var dep = dependencies && typeof dependencies === "object" ? dependencies : {};
    var template = dep.templateSnapshot || null;

    if (!template || !template.buffer) {
      if (typeof dep.notify === "function") {
        dep.notify("Modo template indisponivel: importe um arquivo XLSX original antes de exportar.");
      }
      return null;
    }

    var xlsxApi = dep.xlsxApi;
    if (!xlsxApi) {
      if (typeof dep.notify === "function") {
        dep.notify("Biblioteca XLSX nao carregada.");
      }
      return null;
    }

    var workbook = xlsxApi.read(template.buffer.slice(0), {
      type: "array",
      raw: false,
      cellFormula: true,
      cellNF: true,
      cellStyles: true,
      cellDates: false
    });

    var pickTargetSheets = typeof dep.resolveTemplateTargetSheets === "function"
      ? dep.resolveTemplateTargetSheets
      : resolveTemplateTargetSheets;
    var targetSheetNames = pickTargetSheets(workbook, records);
    var summary = { updatedCells: 0, updatedRecords: 0, skippedRecords: 0, missingColumns: [] };
    var updatedRecordIds = new Set();
    var roundTripAssertions = [];
    var templateCanonicalKeys = Array.isArray(dep.templateCanonicalKeys) ? dep.templateCanonicalKeys : [];

    targetSheetNames.forEach(function (sheetName) {
      var ws = workbook.Sheets[sheetName];
      if (!ws) return;

      var matrix = xlsxApi.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, blankrows: false });
      var detected = typeof dep.detectHeaderRow === "function" ? dep.detectHeaderRow(matrix) : null;
      if (!detected) return;

      var columnByCanonical = typeof dep.buildCanonicalColumnMap === "function"
        ? dep.buildCanonicalColumnMap(detected.headers)
        : {};
      var missingCols = templateCanonicalKeys.filter(function (key) {
        return columnByCanonical[key] == null;
      });
      if (missingCols.length) {
        summary.missingColumns.push(sheetName + ": " + missingCols.join(", "));
      }

      var headerRowNumber = detected.headerRowIndex + 1;
      (records || []).forEach(function (record) {
        if (!record) return;
        if (String(record.source_sheet || "") !== String(sheetName)) return;

        var rowNumber = Number(record.source_row || 0);
        if (!Number.isFinite(rowNumber) || rowNumber <= headerRowNumber) {
          summary.skippedRecords += 1;
          return;
        }

        var changedAny = false;
        templateCanonicalKeys.forEach(function (key) {
          var colIndex = columnByCanonical[key];
          if (colIndex == null) return;

          var nextValue = typeof dep.getRecordValueForTemplate === "function"
            ? dep.getRecordValueForTemplate(record, key)
            : "";
          var changed = typeof dep.setWorksheetCellValue === "function"
            ? dep.setWorksheetCellValue(ws, rowNumber, colIndex, nextValue, key, xlsxApi)
            : false;

          if (changed) {
            changedAny = true;
            summary.updatedCells += 1;
            roundTripAssertions.push({
              sheetName: sheetName,
              rowNumber: rowNumber,
              colIndex: colIndex,
              expected: nextValue
            });
          }
        });

        if (changedAny) {
          updatedRecordIds.add(record.id || (sheetName + ":" + String(rowNumber)));
        }
      });
    });

    summary.updatedRecords = updatedRecordIds.size;

    var roundTrip = null;
    if (opts.roundTripCheck) {
      roundTrip = typeof dep.runTemplateRoundTripCheck === "function"
        ? dep.runTemplateRoundTripCheck(workbook, roundTripAssertions)
        : { ok: true, issues: [] };
      if (!roundTrip.ok && typeof dep.notify === "function") {
        dep.notify("Round-trip check (template) encontrou divergencias\n" + roundTrip.issues.join("\n"));
      }
    }

    xlsxApi.writeFile(workbook, filename || ("emendas_export_" + (typeof dep.dateStamp === "function" ? dep.dateStamp() : String(Date.now())) + ".xlsx"));

    var infoMsg = [
      "Template export concluido.",
      "Registros atualizados: " + String(summary.updatedRecords),
      "Celulas atualizadas: " + String(summary.updatedCells),
      "Registros sem origem de linha/aba: " + String(summary.skippedRecords)
    ];
    if (summary.missingColumns.length) {
      infoMsg.push("Colunas nao mapeadas no template: " + summary.missingColumns.join(" | "));
    }
    if (typeof dep.log === "function") dep.log(infoMsg.join(" "));

    return {
      totalRegistros: (records || []).length,
      totalEventos: typeof dep.countAuditEvents === "function" ? dep.countAuditEvents(records) : 0,
      roundTrip: roundTrip,
      templateSummary: summary
    };
  }

  root.exportTemplateWriterUtils = {
    resolveTemplateTargetSheets: resolveTemplateTargetSheets,
    exportRecordsToTemplateXlsx: exportRecordsToTemplateXlsx
  };
})(window);
