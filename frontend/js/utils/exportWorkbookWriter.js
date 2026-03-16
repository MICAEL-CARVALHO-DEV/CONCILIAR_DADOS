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

  function normalizeFieldKey(value) {
    var raw = String(value == null ? "" : value);
    if (typeof raw.normalize === "function") {
      raw = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    return raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function resolveAuditFieldKey(value) {
    var normalized = normalizeFieldKey(value);
    var aliases = {
      ano: "ano",
      identificacao: "identificacao",
      identificacao_da_emenda: "identificacao",
      cod_subfonte: "cod_subfonte",
      codigo_subfonte: "cod_subfonte",
      deputado: "deputado",
      cod_uo: "cod_uo",
      codigo_uo: "cod_uo",
      sigla_uo: "sigla_uo",
      sigla_da_uo: "sigla_uo",
      cod_orgao: "cod_orgao",
      codigo_orgao: "cod_orgao",
      cod_acao: "cod_acao",
      cod_da_acao: "cod_acao",
      codigo_acao: "cod_acao",
      codigo_da_acao: "cod_acao",
      descricao_acao: "descricao_acao",
      descricao_da_acao: "descricao_acao",
      descritor_da_acao: "descricao_acao",
      objetivo_epi: "objetivo_epi",
      objetivo: "objetivo_epi",
      objetivo_de_epi: "objetivo_epi",
      plan_a: "plan_a",
      plano_a: "plan_a",
      plan_b: "plan_b",
      plano_b: "plan_b",
      municipio: "municipio",
      valor_inicial: "valor_inicial",
      valor_inicial_epi: "valor_inicial",
      valor_atual: "valor_atual",
      valor_atual_epi: "valor_atual",
      processo_sei: "processo_sei",
      processo: "processo_sei",
      status_oficial: "status_oficial",
      rotulos_de_linha: "rotulos_de_linha",
      contagem_de_deputado: "contagem_de_deputado",
      motivo: "motivo",
      valor_antigo: "valor_antigo",
      valor_novo: "valor_novo",
      usuarios_ativos: "usuarios_ativos"
    };
    return aliases[normalized] || normalized;
  }

  function collectModifiedFieldMap(auditRows) {
    var out = {};
    (auditRows || []).forEach(function (row) {
      var key = resolveAuditFieldKey(row && row.campo);
      if (key) out[key] = true;
    });
    return out;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function buildCellStyle(options) {
    var opts = options || {};
    var style = {
      font: {
        name: "Aptos",
        sz: opts.fontSize || 11,
        bold: !!opts.bold,
        color: { rgb: opts.fontColor || "1F2937" }
      },
      alignment: {
        horizontal: opts.horizontal || "center",
        vertical: "center",
        wrapText: true
      },
      border: {
        top: { style: "thin", color: { rgb: "D0D7DE" } },
        bottom: { style: "thin", color: { rgb: "D0D7DE" } },
        left: { style: "thin", color: { rgb: "D0D7DE" } },
        right: { style: "thin", color: { rgb: "D0D7DE" } }
      }
    };
    if (opts.fillColor) {
      style.fill = {
        patternType: "solid",
        fgColor: { rgb: opts.fillColor }
      };
    }
    if (opts.numFmt) style.numFmt = opts.numFmt;
    return style;
  }

  function computeColumnWidths(aoa, headerRowIndex, widthHints) {
    var out = [];
    var headerRow = Array.isArray(aoa && aoa[headerRowIndex]) ? aoa[headerRowIndex] : [];
    var lastColumn = headerRow.length;
    for (var c = 0; c < lastColumn; c += 1) {
      var headerKey = resolveAuditFieldKey(headerRow[c]);
      var width = String(headerRow[c] == null ? "" : headerRow[c]).length + 4;
      for (var r = 0; r < Math.min((aoa || []).length, 180); r += 1) {
        if (r === headerRowIndex) continue;
        var row = Array.isArray(aoa[r]) ? aoa[r] : [];
        var value = row[c];
        width = Math.max(width, String(value == null ? "" : value).length + 2);
      }
      width = Math.max(width, Number((widthHints || {})[headerKey] || 0));
      out.push({ wch: clamp(width, 12, 42) });
    }
    return out;
  }

  function applyWorksheetPresentation(ws, aoa, xlsxApi, options) {
    if (!ws || !aoa || !aoa.length || !xlsxApi || !xlsxApi.utils || typeof xlsxApi.utils.decode_range !== "function") {
      return;
    }

    var opts = options || {};
    var headerRowIndex = Number.isFinite(opts.headerRowIndex) ? opts.headerRowIndex : 0;
    var totalRowIndex = Number.isFinite(opts.totalRowIndex) ? opts.totalRowIndex : -1;
    var modifiedHeaders = opts.modifiedHeaders || {};
    var leftAlignHeaders = opts.leftAlignHeaders || {};
    var widthHints = opts.widthHints || {};
    var ref = ws["!ref"];
    if (!ref) return;

    var range = xlsxApi.utils.decode_range(ref);
    var headerRow = Array.isArray(aoa[headerRowIndex]) ? aoa[headerRowIndex] : [];
    var rowsMeta = [];

    ws["!cols"] = computeColumnWidths(aoa, headerRowIndex, widthHints);
    if (typeof xlsxApi.utils.encode_range === "function" && headerRow.length) {
      ws["!autofilter"] = {
        ref: xlsxApi.utils.encode_range({
          s: { r: headerRowIndex, c: 0 },
          e: { r: headerRowIndex, c: headerRow.length - 1 }
        })
      };
    }

    for (var rowIndex = 0; rowIndex <= range.e.r; rowIndex += 1) {
      if (rowIndex < headerRowIndex) rowsMeta[rowIndex] = { hpt: 21 };
      else if (rowIndex === headerRowIndex) rowsMeta[rowIndex] = { hpt: 25 };
      else if (rowIndex === totalRowIndex) rowsMeta[rowIndex] = { hpt: 24 };
      else rowsMeta[rowIndex] = { hpt: 20 };
    }
    ws["!rows"] = rowsMeta;

    for (var r = 0; r <= range.e.r; r += 1) {
      for (var c = 0; c <= range.e.c; c += 1) {
        var addr = xlsxApi.utils.encode_cell({ r: r, c: c });
        var cell = ws[addr];
        if (!cell) continue;

        var headerKey = resolveAuditFieldKey(headerRow[c]);
        var alignLeft = !!leftAlignHeaders[headerKey];
        var style;

        if (r < headerRowIndex) {
          style = buildCellStyle({
            fillColor: c === 0 ? "E8F1FB" : "F8FAFC",
            bold: c === 0,
            horizontal: c === 0 ? "left" : "center",
            fontSize: c === 0 ? 11 : 10
          });
        } else if (r === headerRowIndex) {
          style = buildCellStyle({
            fillColor: modifiedHeaders[headerKey] ? "C7791A" : "0F4C81",
            fontColor: "FFFFFF",
            bold: true,
            horizontal: alignLeft ? "left" : "center",
            fontSize: 12
          });
        } else if (r === totalRowIndex) {
          style = buildCellStyle({
            fillColor: "D6EAF8",
            bold: true,
            horizontal: alignLeft ? "left" : "center",
            fontSize: 11
          });
        } else {
          style = buildCellStyle({
            fillColor: r % 2 === 0 ? "FFFFFF" : "F8FAFC",
            horizontal: alignLeft ? "left" : "center",
            fontSize: 11,
            numFmt: typeof cell.v === "number" ? "#,##0.00" : undefined
          });
        }

        cell.s = style;
      }
    }
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
    var planilha1Aoa = buildPlanilha1Aoa(records);
    var modifiedHeaders = collectModifiedFieldMap(auditTable.rows);

    var wsData = xlsxApi.utils.aoa_to_sheet(dataAoa);
    var wsAudit = xlsxApi.utils.aoa_to_sheet(auditSheetAoa);
    var wsPlanilha1 = xlsxApi.utils.aoa_to_sheet(planilha1Aoa);

    applyWorksheetPresentation(wsPlanilha1, planilha1Aoa, xlsxApi, {
      headerRowIndex: 0,
      totalRowIndex: planilha1Aoa.length - 1,
      widthHints: {
        rotulos_de_linha: 28,
        contagem_de_deputado: 18
      },
      leftAlignHeaders: {
        rotulos_de_linha: true
      }
    });
    applyWorksheetPresentation(wsData, dataAoa, xlsxApi, {
      headerRowIndex: 0,
      modifiedHeaders: modifiedHeaders,
      widthHints: {
        identificacao: 24,
        descricao_acao: 34,
        objetivo_epi: 34,
        plan_a: 24,
        plan_b: 24,
        usuarios_ativos: 24,
        processo_sei: 18
      },
      leftAlignHeaders: {
        identificacao: true,
        descricao_acao: true,
        objetivo_epi: true,
        plan_a: true,
        plan_b: true
      }
    });
    applyWorksheetPresentation(wsAudit, auditSheetAoa, xlsxApi, {
      headerRowIndex: summaryAoa.length + 1,
      widthHints: {
        identificacao: 24,
        municipio: 20,
        usuarios_ativos: 28,
        valor_antigo: 22,
        valor_novo: 22,
        motivo: 30
      },
      leftAlignHeaders: {
        identificacao: true,
        municipio: true,
        usuarios_ativos: true,
        valor_antigo: true,
        valor_novo: true,
        motivo: true
      }
    });

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
