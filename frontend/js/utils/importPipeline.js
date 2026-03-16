(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function asTrimmedString(value) {
    if (value == null) return "";
    return String(value).trim();
  }

  function readInt(value, toIntFn) {
    if (typeof toIntFn === "function") return toIntFn(value);
    var parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function readNumber(value, toNumberFn) {
    if (typeof toNumberFn === "function") return toNumberFn(value);
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function safeNormalizeLooseText(value, normalizeLooseTextFn) {
    if (typeof normalizeLooseTextFn === "function") return normalizeLooseTextFn(value);
    return asTrimmedString(value).toLowerCase();
  }

  function safeClone(obj, shallowCloneObjFn) {
    if (typeof shallowCloneObjFn === "function") return shallowCloneObjFn(obj || {});
    return Object.assign({}, obj || {});
  }

  function hasUsefulData(record) {
    var source = record && typeof record === "object" ? record : {};
    var checks = [
      source.id,
      source.identificacao,
      source.cod_subfonte,
      source.cod_acao,
      source.municipio,
      source.deputado,
      source.objetivo_epi,
      source.processo_sei,
      source.ref_key
    ];
    var hasText = checks.some(function (value) {
      return !!asTrimmedString(value);
    });
    var hasNumber = source.valor_inicial != null || source.valor_atual != null;
    return hasText || hasNumber;
  }

  function hasIncomingValue(value, type) {
    if (type === "money" || type === "number") {
      return value != null && asTrimmedString(value) !== "" && Number.isFinite(Number(value));
    }
    return value != null && asTrimmedString(value) !== "";
  }

  function hasFieldChanged(prev, next, type, options) {
    var opts = options && typeof options === "object" ? options : {};
    if (type === "money") return readNumber(prev, opts.toNumber) !== readNumber(next, opts.toNumber);
    if (type === "number") return readInt(prev, opts.toInt) !== readInt(next, opts.toInt);
    return safeNormalizeLooseText(prev, opts.normalizeLooseText) !== safeNormalizeLooseText(next, opts.normalizeLooseText);
  }

  function stringifyFieldValue(value, type, options) {
    var opts = options && typeof options === "object" ? options : {};
    if (type === "money") {
      if (typeof opts.fmtMoney === "function") return "R$ " + opts.fmtMoney(value);
      return "R$ " + String(readNumber(value, opts.toNumber));
    }
    if (type === "number") return String(readInt(value, opts.toInt));
    return String(value == null ? "" : value);
  }

  function buildImportNote(fileName, ctx) {
    var fileLabel = asTrimmedString(fileName);
    var source = ctx && typeof ctx === "object" ? ctx : {};
    return "Importado de " + fileLabel + " | Aba: " + (source.sheetName || "XLSX") + " | Linha: " + String(source.rowNumber || "-");
  }

  function mapImportRow(ctx, dependencies) {
    var dep = dependencies && typeof dependencies === "object" ? dependencies : {};
    var source = ctx && typeof ctx === "object" ? ctx : {};
    var rawOriginal = safeClone(source.row || {}, dep.shallowCloneObj);
    var row = typeof dep.normalizeRowKeys === "function" ? dep.normalizeRowKeys(rawOriginal) : rawOriginal;
    var asText = typeof dep.asText === "function" ? dep.asText : asTrimmedString;
    var pickValue = typeof dep.pickValue === "function" ? dep.pickValue : function () { return ""; };
    var importAliases = dep.importAliases || {};

    var ano = typeof dep.toInt === "function" ? dep.toInt(pickValue(row, importAliases.ano)) : readInt(pickValue(row, importAliases.ano));
    var rowId = asText(pickValue(row, importAliases.id));
    var identificacao = asText(pickValue(row, importAliases.identificacao)) || rowId;
    var codSubfonte = asText(pickValue(row, importAliases.cod_subfonte));
    var codAcao = asText(pickValue(row, importAliases.cod_acao));
    var municipio = asText(pickValue(row, importAliases.municipio));
    var deputado = asText(pickValue(row, importAliases.deputado));

    var record = {
      id: rowId,
      ano: ano || (typeof dep.currentYear === "function" ? dep.currentYear() : new Date().getFullYear()),
      identificacao: identificacao,
      cod_subfonte: codSubfonte,
      deputado: deputado,
      cod_uo: asText(pickValue(row, importAliases.cod_uo)),
      sigla_uo: asText(pickValue(row, importAliases.sigla_uo)),
      cod_orgao: asText(pickValue(row, importAliases.cod_orgao)),
      cod_acao: codAcao,
      descricao_acao: asText(pickValue(row, importAliases.descricao_acao)),
      objetivo_epi: asText(pickValue(row, importAliases.objetivo_epi)),
      plan_a: asText(pickValue(row, importAliases.plan_a)),
      plan_b: asText(pickValue(row, importAliases.plan_b)),
      municipio: municipio,
      valor_inicial: typeof dep.toNumberOrNull === "function" ? dep.toNumberOrNull(pickValue(row, importAliases.valor_inicial)) : null,
      valor_atual: typeof dep.toNumberOrNull === "function" ? dep.toNumberOrNull(pickValue(row, importAliases.valor_atual)) : null,
      processo_sei: asText(pickValue(row, importAliases.processo_sei)),
      status_oficial: "",
      all_fields: rawOriginal,
      source_sheet: source.sheetName || "XLSX",
      source_row: source.rowNumber != null ? Number(source.rowNumber) : null
    };

    var statusRaw = asText(pickValue(row, importAliases.status_oficial));
    if (statusRaw && typeof dep.normalizeStatus === "function") {
      record.status_oficial = dep.normalizeStatus(statusRaw);
    } else if (statusRaw) {
      record.status_oficial = statusRaw;
    }

    if (typeof dep.syncCanonicalToAllFields === "function") dep.syncCanonicalToAllFields(record);
    if (typeof dep.buildReferenceKey === "function") record.ref_key = dep.buildReferenceKey(record);
    else record.ref_key = "";
    return record;
  }

  function createRecordFromImport(incoming, ctx, fileName, dependencies) {
    var dep = dependencies && typeof dependencies === "object" ? dependencies : {};
    var source = ctx && typeof ctx === "object" ? ctx : {};
    var item = incoming && typeof incoming === "object" ? incoming : {};
    var now = typeof dep.isoNow === "function" ? dep.isoNow() : new Date().toISOString();
    var ano = item.ano || (typeof dep.currentYear === "function" ? dep.currentYear() : new Date().getFullYear());
    var id = item.id || (typeof dep.generateInternalIdForYear === "function" ? dep.generateInternalIdForYear(ano) : "");
    var note = typeof dep.buildImportNote === "function" ? dep.buildImportNote(fileName, source) : buildImportNote(fileName, source);
    var clone = function (value) { return safeClone(value, dep.shallowCloneObj); };
    var mkRecord = typeof dep.mkRecord === "function" ? dep.mkRecord : function (payload) { return payload; };
    var mkEvent = typeof dep.mkEvent === "function" ? dep.mkEvent : function (_type, payload) { return payload || {}; };

    var base = mkRecord({
      id: id,
      ano: ano,
      identificacao: item.identificacao || "-",
      cod_subfonte: item.cod_subfonte || "",
      deputado: item.deputado || "-",
      cod_uo: item.cod_uo || "",
      sigla_uo: item.sigla_uo || "",
      cod_orgao: item.cod_orgao || "",
      cod_acao: item.cod_acao || "",
      descricao_acao: item.descricao_acao || "",
      objetivo_epi: item.objetivo_epi || "",
      plan_a: item.plan_a || "",
      plan_b: item.plan_b || "",
      municipio: item.municipio || "-",
      valor_inicial: item.valor_inicial != null ? item.valor_inicial : (item.valor_atual != null ? item.valor_atual : 0),
      valor_atual: item.valor_atual != null ? item.valor_atual : (item.valor_inicial != null ? item.valor_inicial : 0),
      processo_sei: item.processo_sei || "",
      created_at: now,
      updated_at: now,
      source_sheet: item.source_sheet || source.sheetName || "Controle de EPI",
      source_row: source.rowNumber != null ? Number(source.rowNumber) : null,
      all_fields: clone(item.all_fields || {}),
      eventos: [mkEvent("IMPORT", { note: note })]
    });

    if (typeof dep.buildReferenceKey === "function") base.ref_key = dep.buildReferenceKey(base);

    if (item.status_oficial) {
      base.eventos.unshift(mkEvent("MARK_STATUS", {
        to: typeof dep.normalizeStatus === "function" ? dep.normalizeStatus(item.status_oficial) : item.status_oficial,
        note: "Marcacao inicial vinda da importacao.",
        actor_user: dep.systemMigrationUser,
        actor_role: dep.systemMigrationRole
      }));
    }

    return base;
  }

  function mergeImportIntoRecord(target, incoming, ctx, fileName, dependencies) {
    var dep = dependencies && typeof dependencies === "object" ? dependencies : {};
    var source = ctx && typeof ctx === "object" ? ctx : {};
    var item = incoming && typeof incoming === "object" ? incoming : {};
    var changedEvents = [];
    var changedAny = false;
    var mkEvent = typeof dep.mkEvent === "function" ? dep.mkEvent : function (_type, payload) { return payload || {}; };
    var hasValue = typeof dep.hasIncomingValue === "function" ? dep.hasIncomingValue : hasIncomingValue;
    var fieldChanged = typeof dep.hasFieldChanged === "function" ? dep.hasFieldChanged : function (prev, next, type) {
      return hasFieldChanged(prev, next, type, dep);
    };
    var stringify = typeof dep.stringifyFieldValue === "function" ? dep.stringifyFieldValue : function (value, type) {
      return stringifyFieldValue(value, type, dep);
    };

    if (typeof dep.mergeRawFields === "function" && dep.mergeRawFields(target, item.all_fields || {})) {
      changedAny = true;
    }

    if (item.source_sheet && item.source_sheet !== target.source_sheet) {
      target.source_sheet = item.source_sheet;
      changedAny = true;
    }
    if (source.rowNumber != null && Number(source.rowNumber) !== Number(target.source_row)) {
      target.source_row = Number(source.rowNumber);
      changedAny = true;
    }

    (dep.trackedFields || []).forEach(function (fieldDef) {
      var nextRaw = item[fieldDef.key];
      if (!hasValue(nextRaw, fieldDef.type)) return;

      var prev = target[fieldDef.key];
      if (!fieldChanged(prev, nextRaw, fieldDef.type)) return;

      if (fieldDef.type === "money" || fieldDef.type === "number") target[fieldDef.key] = Number(nextRaw);
      else target[fieldDef.key] = String(nextRaw).trim();

      changedEvents.push(mkEvent("EDIT_FIELD", {
        field: fieldDef.label,
        from: stringify(prev, fieldDef.type),
        to: stringify(target[fieldDef.key], fieldDef.type),
        note: "Atualizado via importacao."
      }));
      changedAny = true;
    });

    if (item.status_oficial) {
      var nextStatus = typeof dep.normalizeStatus === "function" ? dep.normalizeStatus(item.status_oficial) : item.status_oficial;
      var prevMarked = typeof dep.latestMarkedStatus === "function" ? dep.latestMarkedStatus(target) : "";
      var prevStatus = typeof dep.normalizeStatus === "function" ? dep.normalizeStatus(prevMarked || "") : prevMarked;
      if (prevStatus !== nextStatus) {
        changedEvents.push(mkEvent("MARK_STATUS", {
          to: nextStatus,
          note: "Marcacao atualizada via importacao.",
          actor_user: dep.systemMigrationUser,
          actor_role: dep.systemMigrationRole
        }));
        changedAny = true;
      }
    }

    var oldRef = target.ref_key || "";
    if (typeof dep.syncCanonicalToAllFields === "function") dep.syncCanonicalToAllFields(target);
    if (typeof dep.buildReferenceKey === "function") target.ref_key = dep.buildReferenceKey(target);
    if (oldRef !== target.ref_key) {
      changedEvents.push(mkEvent("EDIT_FIELD", {
        field: "Chave Referencia",
        from: oldRef,
        to: target.ref_key,
        note: "Recalculada apos importacao."
      }));
      changedAny = true;
    }

    if (changedAny) {
      target.updated_at = typeof dep.isoNow === "function" ? dep.isoNow() : new Date().toISOString();
      changedEvents.push(mkEvent("IMPORT", {
        note: (typeof dep.buildImportNote === "function" ? dep.buildImportNote(fileName, source) : buildImportNote(fileName, source)) + " (com atualizacoes)"
      }));
      target.eventos = changedEvents.concat(target.eventos || []);
    }

    return { changedAny: changedAny };
  }

  root.importPipelineUtils = {
    hasUsefulData: hasUsefulData,
    hasIncomingValue: hasIncomingValue,
    hasFieldChanged: hasFieldChanged,
    stringifyFieldValue: stringifyFieldValue,
    buildImportNote: buildImportNote,
    mapImportRow: mapImportRow,
    createRecordFromImport: createRecordFromImport,
    mergeImportIntoRecord: mergeImportIntoRecord
  };
})(window);
