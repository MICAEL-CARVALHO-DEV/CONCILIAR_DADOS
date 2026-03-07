(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function safeText(value, textFn) {
    if (typeof textFn === "function") return textFn(value);
    if (value == null) return "";
    return String(value).trim();
  }

  function shallowCloneObject(obj) {
    if (!obj || typeof obj !== "object") return {};
    return Object.assign({}, obj);
  }

  function buildKnownHeaderSet(importAliases, normalizeHeaderFn) {
    var set = new Set();
    var aliases = importAliases && typeof importAliases === "object" ? importAliases : {};

    Object.keys(aliases).forEach(function (key) {
      (aliases[key] || []).forEach(function (alias) {
        var normalized = typeof normalizeHeaderFn === "function" ? normalizeHeaderFn(alias) : safeText(alias).toLowerCase();
        set.add(normalized);
      });
    });

    return set;
  }

  function countCriticalEmpties(rows, mapImportRowFn, textFn) {
    var counters = { identificacao: 0, deputado: 0, municipio: 0 };

    (Array.isArray(rows) ? rows : []).forEach(function (ctx) {
      var mapped = typeof mapImportRowFn === "function" ? mapImportRowFn(ctx) : {};
      if (!safeText(mapped.identificacao, textFn)) counters.identificacao += 1;
      if (!safeText(mapped.deputado, textFn)) counters.deputado += 1;
      if (!safeText(mapped.municipio, textFn)) counters.municipio += 1;
    });

    return counters;
  }

  function detectType(values) {
    var filtered = (values || []).filter(function (value) {
      return value != null && String(value).trim() !== "";
    });

    if (!filtered.length) return "vazio";
    if (filtered.every(function (value) { return Number.isFinite(Number(value)); })) return "numero";
    return "texto";
  }

  function detectImportTypes(rows, mapImportRowFn, detectTypeFn) {
    var runDetectType = typeof detectTypeFn === "function" ? detectTypeFn : detectType;
    var sample = (Array.isArray(rows) ? rows : []).slice(0, 50).map(function (ctx) {
      return typeof mapImportRowFn === "function" ? mapImportRowFn(ctx) : {};
    });

    return {
      ano: runDetectType(sample.map(function (row) { return row.ano; })),
      valor_inicial: runDetectType(sample.map(function (row) { return row.valor_inicial; })),
      valor_atual: runDetectType(sample.map(function (row) { return row.valor_atual; })),
      identificacao: runDetectType(sample.map(function (row) { return row.identificacao; })),
      processo_sei: runDetectType(sample.map(function (row) { return row.processo_sei; }))
    };
  }

  function buildHeadersFromRow(rawHeader, textFn) {
    var out = [];
    var used = {};
    var headerRow = Array.isArray(rawHeader) ? rawHeader : [];
    var total = Math.max(headerRow.length, 1);

    for (var i = 0; i < total; i += 1) {
      var base = safeText(headerRow[i], textFn);
      if (!base) base = "COL_" + String(i + 1);

      var key = base;
      var suffix = 2;
      while (used[key]) {
        key = base + "_" + String(suffix);
        suffix += 1;
      }
      used[key] = true;
      out.push(key);
    }

    return out;
  }

  function rowArrayToObject(arr, headers) {
    var row = Array.isArray(arr) ? arr : [];
    var keys = Array.isArray(headers) ? headers : [];
    var obj = {};

    for (var c = 0; c < keys.length; c += 1) {
      var key = keys[c];
      if (!key) continue;
      obj[key] = row[c] == null ? "" : String(row[c]).trim();
    }

    return obj;
  }

  function isRowEmpty(arr, textFn) {
    if (!Array.isArray(arr)) return true;
    return !arr.some(function (value) {
      return safeText(value, textFn) !== "";
    });
  }

  function detectHeaderRow(matrix, textFn, normalizeHeaderFn, buildHeadersFromRowFn) {
    if (!Array.isArray(matrix) || !matrix.length) return null;

    var scanLimit = Math.min(matrix.length, 40);
    var bestIndex = -1;
    var bestScore = -1;

    for (var i = 0; i < scanLimit; i += 1) {
      var row = Array.isArray(matrix[i]) ? matrix[i] : [];
      var nonEmpty = row.filter(function (value) {
        return safeText(value, textFn) !== "";
      }).length;
      if (nonEmpty < 3) continue;

      var normalized = row.map(function (value) {
        return typeof normalizeHeaderFn === "function"
          ? normalizeHeaderFn(value)
          : safeText(value, textFn).toLowerCase();
      });

      var score = nonEmpty;
      var hints = ["identificacao", "deputado", "status", "municipio", "cod_uo", "cod_subfonte", "cod_da_acao", "descritor_da_acao"];
      hints.forEach(function (hint) {
        if (normalized.includes(hint)) score += 5;
      });

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    if (bestIndex < 0) return null;
    var rawHeader = Array.isArray(matrix[bestIndex]) ? matrix[bestIndex] : [];
    var toHeaders = typeof buildHeadersFromRowFn === "function" ? buildHeadersFromRowFn : function (row) {
      return buildHeadersFromRow(row, textFn);
    };
    return {
      headerRowIndex: bestIndex,
      headers: toHeaders(rawHeader)
    };
  }

  function buildImportValidationReport(sourceRows, deps) {
    var options = deps && typeof deps === "object" ? deps : {};
    var rows = Array.isArray(sourceRows) ? sourceRows : [];
    var knownSet = typeof options.buildKnownHeaderSet === "function" ? options.buildKnownHeaderSet() : new Set();
    var normalizeHeader = typeof options.normalizeHeader === "function" ? options.normalizeHeader : function (value) {
      return safeText(value).toLowerCase();
    };
    var cloneRow = typeof options.shallowCloneObj === "function" ? options.shallowCloneObj : shallowCloneObject;
    var countEmpties = typeof options.countCriticalEmpties === "function" ? options.countCriticalEmpties : function () {
      return { identificacao: 0, deputado: 0, municipio: 0 };
    };
    var detectTypes = typeof options.detectImportTypes === "function" ? options.detectImportTypes : function () {
      return {};
    };
    var headersFound = [];
    var headerSeen = new Set();
    var headerNormalizedCount = {};
    var preview = [];
    var alerts = [];

    rows.slice(0, 5).forEach(function (ctx) {
      preview.push({
        aba: ctx && ctx.sheetName ? ctx.sheetName : "XLSX",
        linha: ctx && ctx.rowNumber != null ? Number(ctx.rowNumber) : null,
        dados: cloneRow((ctx && ctx.row) || {})
      });
    });

    rows.forEach(function (ctx) {
      var row = (ctx && ctx.row) || {};
      Object.keys(row).forEach(function (key) {
        if (!headerSeen.has(key)) {
          headerSeen.add(key);
          headersFound.push(key);
        }

        var normalizedKey = normalizeHeader(key);
        headerNormalizedCount[normalizedKey] = (headerNormalizedCount[normalizedKey] || 0) + 1;
      });
    });

    var recognized = [];
    var unrecognized = [];
    headersFound.forEach(function (header) {
      if (knownSet.has(normalizeHeader(header))) recognized.push(header);
      else unrecognized.push(header);
    });

    var duplicated = Object.keys(headerNormalizedCount).filter(function (key) {
      return headerNormalizedCount[key] > 1;
    });

    if (recognized.length < 3) alerts.push("Cabecalho suspeito: poucas colunas reconhecidas.");
    if (duplicated.length) alerts.push("Colunas duplicadas detectadas: " + duplicated.join(", "));

    var criticalEmpty = countEmpties(rows);
    Object.keys(criticalEmpty).forEach(function (key) {
      if (criticalEmpty[key] > 0) {
        alerts.push("Campo critico vazio em " + key + ": " + String(criticalEmpty[key]) + " linha(s).");
      }
    });

    return {
      recognizedHeaders: recognized,
      unrecognizedHeaders: unrecognized,
      duplicatedHeaders: duplicated,
      previewRows: preview,
      detectedTypes: detectTypes(rows),
      alerts: alerts
    };
  }

  root.importValidationUtils = root.importValidationUtils || {};
  root.importValidationUtils.buildKnownHeaderSet = buildKnownHeaderSet;
  root.importValidationUtils.countCriticalEmpties = countCriticalEmpties;
  root.importValidationUtils.detectType = detectType;
  root.importValidationUtils.detectImportTypes = detectImportTypes;
  root.importValidationUtils.buildHeadersFromRow = buildHeadersFromRow;
  root.importValidationUtils.rowArrayToObject = rowArrayToObject;
  root.importValidationUtils.isRowEmpty = isRowEmpty;
  root.importValidationUtils.detectHeaderRow = detectHeaderRow;
  root.importValidationUtils.buildImportValidationReport = buildImportValidationReport;
})(window);
