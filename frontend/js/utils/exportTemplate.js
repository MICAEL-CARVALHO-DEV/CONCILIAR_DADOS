(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  var TEMPLATE_CANONICAL_KEYS_DEFAULT = [
    "identificacao",
    "cod_subfonte",
    "deputado",
    "cod_uo",
    "sigla_uo",
    "cod_orgao",
    "cod_acao",
    "descricao_acao",
    "plan_a",
    "plan_b",
    "municipio",
    "valor_inicial",
    "valor_atual",
    "processo_sei",
    "status_oficial"
  ];

  function normalizeTextLike(value, normalizeHeaderFn) {
    if (typeof normalizeHeaderFn === "function") return normalizeHeaderFn(value);
    return String(value == null ? "" : value)
      .toLowerCase()
      .trim();
  }

  function buildCanonicalColumnMap(headers, importAliases, rawPreferredHeaders, normalizeHeaderFn, canonicalKeys) {
    var keys = Array.isArray(canonicalKeys) ? canonicalKeys : TEMPLATE_CANONICAL_KEYS_DEFAULT;
    var aliases = importAliases || {};
    var rawPreferred = rawPreferredHeaders || {};

    var map = {};
    for (var i = 0; i < keys.length; i += 1) {
      var canonicalKey = keys[i];
      var idx = findHeaderIndexByAliases(headers, canonicalKey, aliases, rawPreferred, normalizeHeaderFn);
      if (idx >= 0) map[canonicalKey] = idx;
    }
    return map;
  }

  function findHeaderIndexByAliases(headers, canonicalKey, importAliases, rawPreferredHeaders, normalizeHeaderFn) {
    var aliases = importAliases || {};
    var rawPreferred = rawPreferredHeaders || {};
    var normalize = function (value) {
      return normalizeTextLike(value, normalizeHeaderFn);
    };

    var wanted = [];
    var list = aliases[canonicalKey] || [];

    for (var i = 0; i < list.length; i += 1) {
      wanted.push(list[i]);
    }
    if (rawPreferred[canonicalKey]) {
      wanted.push(rawPreferred[canonicalKey]);
    }

    var wantSet = {};
    for (i = 0; i < wanted.length; i += 1) {
      wantSet[normalize(wanted[i])] = true;
    }

    for (i = 0; i < ((headers || []).length); i += 1) {
      var headerValue = headers[i];
      if (wantSet[normalize(headerValue)]) return i;
    }
    return -1;
  }

  function getRecordValueForTemplate(rec, canonicalKey, importAliases, rawPreferredHeaders, normalizeHeaderFn) {
    if (!rec) return "";
    if (canonicalKey === "status_oficial") return rec.status_oficial || "";

    var raw = rec.all_fields && typeof rec.all_fields === "object" ? rec.all_fields : null;
    var aliases = (importAliases || {})[canonicalKey] || [];
    var normalize = function (value) {
      return normalizeTextLike(value, normalizeHeaderFn);
    };

    var want = [];
    for (var i = 0; i < aliases.length; i += 1) {
      want.push(aliases[i]);
    }

    var preferred = (rawPreferredHeaders || {})[canonicalKey];
    if (preferred) want.push(preferred);

    var wantedSet = {};
    for (i = 0; i < want.length; i += 1) {
      wantedSet[normalize(want[i])] = true;
    }

    if (raw) {
      var keys = Object.keys(raw);
      for (i = 0; i < keys.length; i += 1) {
        var key = keys[i];
        if (wantedSet[normalize(key)]) {
          var value = raw[key];
          if (value != null && String(value).trim() !== "") return value;
        }
      }
    }

    return rec[canonicalKey] == null ? "" : rec[canonicalKey];
  }

  function setWorksheetCellValue(ws, rowNumber, colIndex, value, canonicalKey, xlsxApi, toNumberFn, compareFn) {
    if (!ws || !xlsxApi || !xlsxApi.utils || typeof xlsxApi.utils.encode_cell !== "function") return false;

    var addr = xlsxApi.utils.encode_cell({
      r: Math.max(0, Number(rowNumber) - 1),
      c: Math.max(0, Number(colIndex))
    });
    var previousCell = ws[addr];
    var prevValue = previousCell && Object.prototype.hasOwnProperty.call(previousCell, "v") ? previousCell.v : "";
    var numericField = canonicalKey === "valor_inicial" || canonicalKey === "valor_atual";

    var parseNumber = typeof toNumberFn === "function" ? toNumberFn : function (value) {
      var s = String(value == null ? "" : value).trim().replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(/,/g, ".").replace(/[^\d.-]/g, "");
      var n = Number(s);
      return Number.isFinite(n) ? n : 0;
    };

    var cmp = typeof compareFn === "function" ? compareFn : function (v) {
      if (v == null) return "";
      if (typeof v === "number") return Number(v).toString();
      return String(v).trim();
    };

    var normalizedNext = value == null ? "" : value;
    var nextCell;
    if (numericField && String(normalizedNext).trim() !== "" && Number.isFinite(parseNumber(normalizedNext))) {
      nextCell = {
        t: "n",
        v: parseNumber(normalizedNext)
      };
    } else {
      nextCell = {
        t: "s",
        v: String(normalizedNext)
      };
    }

    var changed = cmp(prevValue) !== cmp(nextCell.v);
    if (!changed) return false;

    if (previousCell && previousCell.z) nextCell.z = previousCell.z;
    if (previousCell && previousCell.s) nextCell.s = previousCell.s;
    ws[addr] = nextCell;
    return true;
  }

  function normalizeCompareValue(v) {
    if (v == null) return "";
    if (typeof v === "number") return Number(v).toString();
    return String(v).trim();
  }

  function runTemplateRoundTripCheck(workbook, assertions, compareFn, xlsxApi) {
    var api = xlsxApi || (global.XLSX || (global.window && global.window.XLSX));
    if (!api || !workbook) return { ok: true, issues: [] };

    var cmp = typeof compareFn === "function" ? compareFn : normalizeCompareValue;
    try {
      var arr = api.write(workbook, { type: "array", bookType: "xlsx" });
      var wb2 = api.read(arr, { type: "array" });
      var issues = [];
      var limit = Math.min((assertions || []).length, 800);

      for (var i = 0; i < limit; i += 1) {
        var a = assertions[i];
        var ws = wb2.Sheets[a.sheetName];
        if (!ws) {
          issues.push("Aba ausente no round-trip: " + a.sheetName);
          continue;
        }

        var addr = api.utils.encode_cell({
          r: Math.max(0, Number(a.rowNumber) - 1),
          c: Math.max(0, Number(a.colIndex))
        });
        var cell = ws[addr];
        var got = cell && Object.prototype.hasOwnProperty.call(cell, "v") ? cell.v : "";
        if (cmp(got) !== cmp(a.expected)) {
          issues.push("Divergencia em " + a.sheetName + "!" + addr + ": esperado=" + cmp(a.expected) + " recebido=" + cmp(got));
          if (issues.length >= 25) {
            break;
          }
        }
      }

      return { ok: issues.length === 0, issues: issues };
    } catch (err) {
      return {
        ok: false,
        issues: ["Falha no round-trip (template): " + (err && err.message ? err.message : "erro desconhecido")]
      };
    }
  }

  function runRoundTripCheck(workbook, headers, xlsxApi) {
    var api = xlsxApi || (global.XLSX || (global.window && global.window.XLSX));
    if (!api) return { ok: true, issues: [] };

    try {
      var arr = api.write(workbook, { type: "array", bookType: "xlsx" });
      var wb2 = api.read(arr, { type: "array" });
      var ws = wb2.Sheets["Controle de EPI"];
      var aoa = api.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, blankrows: false });
      var issues = [];

      if (!aoa.length) return { ok: false, issues: ["Planilha de retorno vazia."] };

      var head2 = aoa[0] || [];
      if (head2.length !== headers.length) {
        issues.push("Quantidade de colunas mudou no round-trip.");
      }

      var rowCount = Math.max(0, aoa.length - 1);
      if (rowCount <= 0) issues.push("Nenhuma linha de dados apos round-trip.");

      var wanted = ["id_interno_sistema", "identificacao", "municipio", "deputado", "processo_sei", "valor_atual"];
      var idx = {};
      for (var i = 0; i < wanted.length; i += 1) {
        var key = wanted[i];
        idx[key] = head2.indexOf(key);
      }
      var missingCols = wanted.filter(function (k) { return idx[k] < 0; });
      if (missingCols.length) {
        issues.push("Campos-chave ausentes no round-trip: " + missingCols.join(", "));
      }

      if (!missingCols.length && rowCount > 0) {
        var limit = Math.min(rowCount, 20);
        for (i = 1; i <= limit; i += 1) {
          var row = aoa[i] || [];
          if (!String(row[idx.id_interno_sistema] || "").trim()) {
            issues.push("Linha " + String(i + 1) + " sem id_interno_sistema apos round-trip.");
            break;
          }
        }
      }

      return { ok: issues.length === 0, issues: issues };
    } catch (err) {
      return {
        ok: false,
        issues: ["Falha no round-trip: " + (err && err.message ? err.message : "erro desconhecido")]
      };
    }
  }

  function buildPlanilha1Aoa(records, isDemoSeedFn) {
    var checkDemoSeed = typeof isDemoSeedFn === "function" ? isDemoSeedFn : function () { return false; };
    var safeRecords = (records || []).filter(function (r) {
      return !checkDemoSeed(r);
    });

    var byDeputado = {};
    safeRecords.forEach(function (r) {
      var nome = (r && r.deputado != null) ? String(r.deputado).trim() : "";
      if (!nome) nome = "(Sem deputado)";
      byDeputado[nome] = (byDeputado[nome] || 0) + 1;
    });

    var ordered = Object.keys(byDeputado).sort(function (a, b) {
      return String(a).localeCompare(String(b), "pt-BR");
    });

    var out = [
      ["Rotulos de Linha", "Contagem de Deputado"],
      ["Indicar escola", safeRecords.length]
    ];

    ordered.forEach(function (nome) {
      out.push([nome, byDeputado[nome]]);
    });
    out.push(["Total Geral", safeRecords.length]);
    return out;
  }

  root.exportTemplateUtils = {
    templateCanonicalKeys: TEMPLATE_CANONICAL_KEYS_DEFAULT,
    buildCanonicalColumnMap: buildCanonicalColumnMap,
    findHeaderIndexByAliases: findHeaderIndexByAliases,
    getRecordValueForTemplate: getRecordValueForTemplate,
    setWorksheetCellValue: setWorksheetCellValue,
    normalizeCompareValue: normalizeCompareValue,
    runTemplateRoundTripCheck: runTemplateRoundTripCheck,
    runRoundTripCheck: runRoundTripCheck,
    buildPlanilha1Aoa: buildPlanilha1Aoa
  };
})(window);