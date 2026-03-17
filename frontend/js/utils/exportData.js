(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function identityOrZero(v, fn) {
    return typeof fn === "function" ? fn(v) : v;
  }

  function emptyArrayFrom(value) {
    if (Array.isArray(value)) return value.slice();
    return [];
  }

  function readRawFields(record) {
    return record && record.all_fields && typeof record.all_fields === "object" ? record.all_fields : {};
  }

  function fallbackActiveUsers(record, dependencies) {
    if (typeof dependencies.getActiveUsersWithLastMark === "function") {
      return dependencies.getActiveUsersWithLastMark(record);
    }
    return [];
  }

  function fallbackCalcProgress(users, dependencies) {
    if (typeof dependencies.calcProgress === "function") {
      return dependencies.calcProgress(users);
    }
    return { concl: 0, total: 0, percent: 0 };
  }

  function fallbackGlobalState(users, dependencies) {
    if (typeof dependencies.getGlobalProgressState === "function") {
      return dependencies.getGlobalProgressState(users);
    }
    return { label: "Indefinido", code: "undefined" };
  }

  function fallbackSortedEvents(record, dependencies) {
    if (typeof dependencies.getEventsSorted === "function") {
      return dependencies.getEventsSorted(record);
    }
    var events = record && Array.isArray(record.eventos) ? record.eventos.slice() : [];
    return events;
  }

  var OFFICIAL_CONTROLE_COLUMNS = [
    { header: "Emenda", candidates: ["Emenda", "identificacao", "id", "id_interno_sistema"] },
    { header: "Emenda  apta", candidates: ["Emenda  apta", "Emenda apta", "emenda_apta"] },
    { header: "Cod Subfonte", candidates: ["Cod Subfonte", "cod_subfonte"] },
    { header: "Deputado", candidates: ["Deputado", "deputado"] },
    { header: "Cod. Órgão", candidates: ["Cod. Órgão", "Cod. Orgao", "cod_orgao"] },
    { header: "Nº Órgão", candidates: ["Nº Órgão", "N° Órgão", "No Orgao", "numero_orgao", "orgao"] },
    { header: "Sigla do Órgão", candidates: ["Sigla do Órgão", "sigla_uo", "sigla_do_orgao"] },
    { header: "Cod. UO", candidates: ["Cod. UO", "cod_uo"] },
    { header: "UO Orcamentária ", candidates: ["UO Orcamentária ", "UO Orcamentaria", "uo_orcamentaria"] },
    { header: "Nome da UO", candidates: ["Nome da UO", "nome_da_uo"] },
    { header: "Cod. USP", candidates: ["Cod. USP", "cod_usp"] },
    { header: "UO  Executora", candidates: ["UO  Executora", "UO Executora", "uo_executora"] },
    { header: "Cód. da Ação", candidates: ["Cód. da Ação", "Cod. da Acao", "cod_acao"] },
    { header: "Descritor da Ação", candidates: ["Descritor da Ação", "descricao_acao", "descritor_da_acao"] },
    { header: "Objeto da EPI", candidates: ["Objeto da EPI", "objetivo_epi"] },
    { header: "Status", candidates: ["Status", "status_oficial"] },
    { header: "Função", candidates: ["Função", "funcao"] },
    { header: "Município / Estado", candidates: ["Município / Estado", "Municipio / Estado", "municipio"] },
    { header: "TI/Estado", candidates: ["TI/Estado", "ti_estado"] },
    { header: "Condição da EPI", candidates: ["Condição da EPI", "condicao_da_epi"] },
    { header: "Valor Inicial EPI", candidates: ["Valor Inicial EPI", "valor_inicial", "valor_inicial_epi"] },
    { header: "Valor Reforçado", candidates: ["Valor Reforçado", "valor_reforcado"] },
    { header: "Valor Anulado", candidates: ["Valor Anulado", "valor_anulado"] },
    { header: "Valor Atual\nEPI", candidates: ["Valor Atual\nEPI", "Valor Atual EPI", "valor_atual", "valor_atual_epi"] },
    { header: "Data da Solicitação", candidates: ["Data da Solicitação", "data_da_solicitacao"] },
    { header: "Processo SEI", candidates: ["Processo SEI", "processo_sei"] },
    { header: "OBSERVAÇÃO", candidates: ["OBSERVAÇÃO", "OBSERVACAO", "observacao"] },
    { header: "Status", candidates: ["Status_2", "Status", "status_oficial"] }
  ];

  function normalizeLookupKey(value) {
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

  function isBlankValue(value) {
    return value == null || String(value).trim() === "";
  }

  function resolveOfficialColumnValue(record, raw, normalizedRaw, columnDef) {
    var candidates = columnDef && Array.isArray(columnDef.candidates) ? columnDef.candidates : [];
    var i;
    for (i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i];
      if (Object.prototype.hasOwnProperty.call(raw, candidate) && !isBlankValue(raw[candidate])) {
        return raw[candidate];
      }
    }
    for (i = 0; i < candidates.length; i += 1) {
      candidate = candidates[i];
      var normalized = normalizeLookupKey(candidate);
      if (Object.prototype.hasOwnProperty.call(normalizedRaw, normalized) && !isBlankValue(normalizedRaw[normalized])) {
        return normalizedRaw[normalized];
      }
    }
    for (i = 0; i < candidates.length; i += 1) {
      candidate = candidates[i];
      if (Object.prototype.hasOwnProperty.call(record || {}, candidate) && !isBlankValue(record[candidate])) {
        return record[candidate];
      }
    }
    return "";
  }

  function buildOfficialControleData(records) {
    var headers = OFFICIAL_CONTROLE_COLUMNS.map(function (column) { return column.header; });
    var rows = (records || []).map(function (record) {
      var raw = readRawFields(record);
      var normalizedRaw = {};
      Object.keys(raw).forEach(function (key) {
        normalizedRaw[normalizeLookupKey(key)] = raw[key];
      });
      return OFFICIAL_CONTROLE_COLUMNS.map(function (columnDef) {
        return resolveOfficialColumnValue(record, raw, normalizedRaw, columnDef);
      });
    });

    return {
      headers: headers,
      rows: rows,
      aoa: [headers].concat(rows),
      officialLayout: true
    };
  }

  function buildExportTableData(records, options, dependencies) {
    var opts = options || {};
    var dep = dependencies || {};
    if (opts.officialLayout) {
      return buildOfficialControleData(records);
    }

    var useOriginal = !!opts.useOriginalHeaders;

    var extraHeaders = [];
    var extraSet = {};

    (records || []).forEach(function (r) {
      var raw = readRawFields(r);
      Object.keys(raw).forEach(function (k) {
        if (!extraSet[k]) {
          extraSet[k] = true;
          extraHeaders.push(k);
        }
      });
    });

    var normalizedHeaders = [
      "id",
      "ano",
      "identificacao",
      "cod_subfonte",
      "deputado",
      "cod_uo",
      "sigla_uo",
      "cod_orgao",
      "cod_acao",
      "descricao_acao",
      "objetivo_epi",
      "plan_a",
      "plan_b",
      "municipio",
      "valor_inicial",
      "valor_atual",
      "processo_sei"
    ];
    var systemHeaders = [
      "id_interno_sistema",
      "backend_id",
      "parent_id",
      "version",
      "row_version",
      "is_current",
      "usuarios_ativos",
      "progresso",
      "global_state",
      "ref_key",
      "created_at",
      "updated_at",
      "source_sheet",
      "source_row"
    ];
    var headers = (useOriginal ? extraHeaders : normalizedHeaders).concat(systemHeaders);

    var rows = (records || []).map(function (r) {
      var out = {};
      var raw = readRawFields(r);
      var users = fallbackActiveUsers(r, dep);
      var progress = fallbackCalcProgress(users, dep);
      var global = fallbackGlobalState(users, dep);

      if (useOriginal) {
        extraHeaders.forEach(function (h) {
          out[h] = raw[h] == null ? "" : raw[h];
        });
      } else {
        normalizedHeaders.forEach(function (h) {
          out[h] = r[h] == null ? "" : r[h];
        });
      }

      out.id_interno_sistema = r.id == null ? "" : r.id;
      out.backend_id = r.backend_id == null ? "" : r.backend_id;
      out.parent_id = r.parent_id == null ? "" : r.parent_id;
      out.version = r.version == null ? 1 : r.version;
      out.row_version = r.row_version == null ? 1 : r.row_version;
      out.is_current = r.is_current !== false;
      out.usuarios_ativos = users.map(function (u) {
        return String(u.name || "") + " (" + String(u.role || "-") + ")";
      }).join(" | ");
      out.progresso = String(progress.concl || 0) + "/" + String(progress.total || 0) + " (" + String(progress.percent || 0) + ")%";
      out.global_state = global.label;
      out.ref_key = r.ref_key || "";
      out.created_at = r.created_at || "";
      out.updated_at = r.updated_at || "";
      out.source_sheet = r.source_sheet || "";
      out.source_row = r.source_row == null ? "" : r.source_row;
      return out;
    });

    return { headers: headers, rows: rows };
  }

  function buildAuditLogTableData(records, dependencies) {
    var dep = dependencies || {};
    var headers = [
      "id_interno_sistema",
      "identificacao",
      "municipio",
      "deputado",
      "usuarios_ativos",
      "progresso",
      "global_state",
      "data_hora_evento",
      "tipo_evento",
      "usuario",
      "setor",
      "campo",
      "valor_antigo",
      "valor_novo",
      "motivo",
      "source_sheet",
      "source_row"
    ];

    var rows = [];
    (records || []).forEach(function (r) {
      var orderedEvents = fallbackSortedEvents(r, dep);
      var users = fallbackActiveUsers(r, dep);
      var progress = fallbackCalcProgress(users, dep);
      var global = fallbackGlobalState(users, dep);
      var usersList = users.map(function (u) { return u.name; }).join(" | ");

      orderedEvents.forEach(function (ev) {
        rows.push({
          id_interno_sistema: r.id == null ? "" : r.id,
          identificacao: r.identificacao || "",
          municipio: r.municipio || "",
          deputado: r.deputado || "",
          usuarios_ativos: usersList,
          progresso: String(progress.concl || 0) + "/" + String(progress.total || 0) + " (" + String(progress.percent || 0) + ")%",
          global_state: global.label,
          data_hora_evento: ev.at || "",
          tipo_evento: ev.type || "",
          usuario: ev.actor_user || "",
          setor: ev.actor_role || "",
          campo: ev.field || "",
          valor_antigo: ev.from == null ? "" : ev.from,
          valor_novo: ev.to == null ? "" : ev.to,
          motivo: ev.note || "",
          source_sheet: r.source_sheet || "",
          source_row: r.source_row == null ? "" : r.source_row
        });
      });
    });

    rows.sort(function (a, b) {
      var ta = new Date(a.data_hora_evento).getTime() || 0;
      var tb = new Date(b.data_hora_evento).getTime() || 0;
      return tb - ta;
    });

    return { headers: headers, rows: rows };
  }

  function buildSummaryAoa(records, totalEvents, exportScope, exportFilters, dependencies) {
    var dep = dependencies || {};
    var now = new Date().toISOString();
    var byGlobal = { done: 0, in_progress: 0, attention: 0, no_marks: 0 };
    var scope = (typeof dep.exportScopeLabel === "function") ? dep.exportScopeLabel(exportScope) : ((exportScope && String(exportScope)) || "ATUAIS");
    var filtersJson = JSON.stringify(exportFilters || {});

    (records || []).forEach(function (r) {
      var global = fallbackGlobalState(fallbackActiveUsers(r, dep), dep);
      byGlobal[global.code] = (byGlobal[global.code] || 0) + 1;
    });

    var out = [
      ["Resumo da exportacao"],
      ["MODO: " + scope],
      ["Gerado em", now],
      ["Total de emendas", (records || []).length],
      ["Total de eventos (audit log)", totalEvents],
      ["Filtros", filtersJson],
      [],
      ["Andamento Global", "Quantidade"],
      ["Concluido global", byGlobal.done || 0],
      ["Em andamento", byGlobal.in_progress || 0],
      ["Atencao", byGlobal.attention || 0],
      ["Sem marcacoes", byGlobal.no_marks || 0]
    ];

    return out;
  }

  root.exportDataUtils = {
    buildExportTableData: buildExportTableData,
    buildAuditLogTableData: buildAuditLogTableData,
    buildSummaryAoa: buildSummaryAoa
  };
})(window);
