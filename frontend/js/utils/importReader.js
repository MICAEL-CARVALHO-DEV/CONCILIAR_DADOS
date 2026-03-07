(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function readText(value, textFn) {
    if (typeof textFn === "function") return textFn(value);
    if (value == null) return "";
    return String(value).trim();
  }

  function extractPlanilha1AoaFromWorkbook(workbook, xlsxApi, dependencies) {
    var dep = dependencies && typeof dependencies === "object" ? dependencies : {};
    try {
      if (!workbook || !xlsxApi || !workbook.Sheets) return null;
      var ws = workbook.Sheets["Planilha1"];
      if (!ws) return null;

      var matrix = xlsxApi.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, blankrows: false });
      if (!Array.isArray(matrix) || !matrix.length) return null;

      var headerIdx = -1;
      var scanLimit = Math.min(matrix.length, 50);
      for (var i = 0; i < scanLimit; i += 1) {
        var row = Array.isArray(matrix[i]) ? matrix[i] : [];
        var c1 = typeof dep.normalizeHeader === "function" ? dep.normalizeHeader(row[0]) : readText(row[0]).toLowerCase();
        var c2 = typeof dep.normalizeHeader === "function" ? dep.normalizeHeader(row[1]) : readText(row[1]).toLowerCase();
        var hasRotulo = c1.indexOf("rotulos_de_linha") >= 0 || c1.indexOf("rotulo_de_linha") >= 0;
        var hasContagem = c2.indexOf("contagem_de_deputado") >= 0;
        if (hasRotulo && hasContagem) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx < 0) return null;

      var headerRow = matrix[headerIdx] || [];
      var out = [[
        readText(headerRow[0], dep.text) || "Rotulos de Linha",
        readText(headerRow[1], dep.text) || "Contagem de Deputado"
      ]];

      for (var j = headerIdx + 1; j < matrix.length; j += 1) {
        var dataRow = Array.isArray(matrix[j]) ? matrix[j] : [];
        var label = readText(dataRow[0], dep.text);
        var value = readText(dataRow[1], dep.text);
        if (!label && !value) continue;
        out.push([label, value]);
        var normalizedLabel = typeof dep.normalizeLooseText === "function" ? dep.normalizeLooseText(label) : label.toLowerCase();
        if (normalizedLabel === "total geral") break;
      }

      return out.length > 1 ? out : null;
    } catch (_err) {
      return null;
    }
  }

  async function parseInputFile(file, dependencies) {
    var dep = dependencies && typeof dependencies === "object" ? dependencies : {};
    var fileName = String(file && file.name ? file.name : "");
    var lowerName = fileName.toLowerCase();
    if (!lowerName.endsWith(".xlsx")) {
      throw new Error("Formato nao suportado. Use apenas XLSX.");
    }

    var xlsxApi = dep.xlsxApi;
    if (!xlsxApi) throw new Error("Biblioteca XLSX nao carregada.");

    var buffer = await file.arrayBuffer();
    var templateBuffer = buffer.slice(0);
    var workbook = xlsxApi.read(buffer, {
      type: "array",
      raw: false,
      cellFormula: true,
      cellNF: true,
      cellStyles: true,
      cellDates: false
    });

    var out = [];
    var buildKnownHeaderSet = typeof dep.buildKnownHeaderSet === "function" ? dep.buildKnownHeaderSet : function () { return new Set(); };
    var knownHeaders = buildKnownHeaderSet();
    var readPlanilha1 = typeof dep.extractPlanilha1AoaFromWorkbook === "function"
      ? dep.extractPlanilha1AoaFromWorkbook
      : function (wb, api) { return extractPlanilha1AoaFromWorkbook(wb, api, dep); };
    var importedPlanilha1Aoa = readPlanilha1(workbook, xlsxApi);

    var preferredSheet = workbook.SheetNames.includes("Controle de EPI") ? "Controle de EPI" : null;
    var orderedSheetNames = preferredSheet
      ? [preferredSheet].concat(workbook.SheetNames.filter(function (name) { return name !== preferredSheet; }))
      : workbook.SheetNames.slice();

    orderedSheetNames.forEach(function (sheetName) {
      var sheet = workbook.Sheets[sheetName];
      var matrix = xlsxApi.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false, blankrows: false });
      var detected = typeof dep.detectHeaderRow === "function" ? dep.detectHeaderRow(matrix) : null;
      if (!detected) return;

      var headers = detected.headers || [];
      var recognizedCount = headers.reduce(function (acc, header) {
        var normalized = typeof dep.normalizeHeader === "function" ? dep.normalizeHeader(header) : readText(header).toLowerCase();
        return acc + (knownHeaders.has(normalized) ? 1 : 0);
      }, 0);

      if (sheetName === "Controle de EPI" && recognizedCount < 5) {
        throw new Error("Cabecalho da aba Controle de EPI nao reconhecido. Verifique se a linha de cabecalho esta correta.");
      }
      if (sheetName !== "Controle de EPI" && recognizedCount < 3) return;

      for (var r = detected.headerRowIndex + 1; r < matrix.length; r += 1) {
        var arr = matrix[r] || [];
        if (typeof dep.isRowEmpty === "function" && dep.isRowEmpty(arr)) continue;
        var rowObj = typeof dep.rowArrayToObject === "function" ? dep.rowArrayToObject(arr, headers) : {};
        out.push({ sheetName: sheetName, rowNumber: r + 1, row: rowObj });
      }
    });

    var templateSnapshot = {
      fileName: fileName || "template.xlsx",
      importedAt: typeof dep.isoNow === "function" ? dep.isoNow() : new Date().toISOString(),
      preferredSheet: preferredSheet || "",
      buffer: templateBuffer
    };

    var validation = typeof dep.buildImportValidationReport === "function" ? dep.buildImportValidationReport(out) : null;
    return {
      rows: out,
      templateSnapshot: templateSnapshot,
      planilha1Aoa: importedPlanilha1Aoa,
      validation: validation
    };
  }

  root.importReaderUtils = {
    parseInputFile: parseInputFile,
    extractPlanilha1AoaFromWorkbook: extractPlanilha1AoaFromWorkbook
  };
})(window);
