(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function buildPowerBiFilterOptions(rows, ctx) {
    var source = Array.isArray(rows) ? rows : [];
    var deputados = Array.from(new Set(source.map(function (rec) { return ctx.text(rec && rec.deputado) || "-"; }).filter(Boolean))).sort();
    var municipios = Array.from(new Set(source.map(function (rec) { return ctx.text(rec && rec.municipio) || "-"; }).filter(Boolean))).sort();
    var statuses = Array.from(new Set(source.map(function (rec) { return ctx.getRecordCurrentStatus(rec) || "-"; }).filter(Boolean))).sort();
    return {
      deputados: deputados,
      municipios: municipios,
      statuses: statuses
    };
  }

  function applyPowerBiDashboardFilters(rows, ctx) {
    var source = Array.isArray(rows) ? rows : [];
    return source.filter(function (rec) {
      var deputado = ctx.text(rec && rec.deputado) || "-";
      var municipio = ctx.text(rec && rec.municipio) || "-";
      var statusAtual = ctx.getRecordCurrentStatus(rec) || "-";
      if (ctx.filters.deputado && deputado !== ctx.filters.deputado) return false;
      if (ctx.filters.municipio && municipio !== ctx.filters.municipio) return false;
      if (ctx.filters.status && statusAtual !== ctx.filters.status) return false;
      if (ctx.filters.q) {
        var blob = ctx.normalizeLooseText([
          ctx.text(rec && rec.id),
          ctx.text(rec && rec.identificacao),
          deputado,
          municipio,
          ctx.text(rec && rec.cod_acao),
          ctx.text(rec && rec.descricao_acao),
          ctx.text(rec && rec.plan_a),
          ctx.text(rec && rec.plan_b),
          statusAtual
        ].join(" "));
        if (!blob.includes(ctx.normalizeLooseText(ctx.filters.q))) return false;
      }
      return true;
    });
  }

  function getDeputadoAvatarLetters(name, ctx) {
    var src = ctx.text(name || "").trim();
    if (!src) return "DP";
    var parts = src.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getDeputadoPhotoUrl(record, ctx) {
    if (!record || typeof record !== "object") return "";
    var allFields = record.all_fields && typeof record.all_fields === "object" ? record.all_fields : {};
    var candidates = [
      record.foto_deputado_url,
      record.foto_url,
      allFields.foto_deputado_url,
      allFields.foto_url,
      allFields.foto,
      allFields.imagem,
      allFields.image_url
    ];
    for (var i = 0; i < candidates.length; i += 1) {
      var value = ctx.text(candidates[i]);
      if (!value) continue;
      if (/^(https?:)?\/\//i.test(value) || value.startsWith("/")) return value;
    }
    return "";
  }

  function getScopedAuditRowsForRecords(rows, ctx) {
    if (!Array.isArray(ctx.betaAuditRows) || !ctx.betaAuditRows.length) return [];
    var ids = {};
    (Array.isArray(rows) ? rows : []).forEach(function (rec) {
      var backendId = ctx.getBackendIdForRecord(rec);
      if (backendId) ids[String(backendId)] = true;
    });
    return ctx.betaAuditRows.filter(function (row) {
      return !!ids[String(Number(row && row.emenda_id ? row.emenda_id : 0))];
    });
  }

  function buildPowerBiDashboardData(filteredRows, ctx) {
    var sourceRows = Array.isArray(filteredRows) ? filteredRows : [];
    var filterOptions = buildPowerBiFilterOptions(sourceRows, ctx);
    var rows = applyPowerBiDashboardFilters(sourceRows, ctx);
    var scopedAuditRows = getScopedAuditRowsForRecords(rows, ctx);
    var isExecutiveRole = ["APG", "SUPERVISAO", "POWERBI", "PROGRAMADOR"].indexOf(ctx.currentRole) >= 0;

    var summary = {
      total: rows.length,
      valorTotal: 0,
      done: 0,
      attention: 0,
      deputados: new Set(),
      municipios: new Set(),
      latestUpdate: ""
    };
    var byDeputado = {};
    var byMunicipio = {};
    var byStatus = {};
    var byUser = {};
    var recordDeputadoMap = {};

    rows.forEach(function (rec) {
      var users = ctx.getActiveUsersWithLastMark(rec);
      var global = ctx.getGlobalProgressState(users);
      var deputado = ctx.text(rec && rec.deputado) || "-";
      var municipio = ctx.text(rec && rec.municipio) || "-";
      var valor = ctx.toNumber(rec && rec.valor_atual);
      var statusAtual = ctx.getRecordCurrentStatus(rec) || "-";
      var updatedAt = ctx.text(rec && rec.updated_at);
      var backendId = ctx.getBackendIdForRecord(rec);

      summary.valorTotal += valor;
      summary.deputados.add(deputado);
      summary.municipios.add(municipio);
      if (updatedAt && (!summary.latestUpdate || updatedAt > summary.latestUpdate)) summary.latestUpdate = updatedAt;
      if (global && global.code === "done") summary.done += 1;
      if (global && global.code === "attention") summary.attention += 1;

      if (backendId) recordDeputadoMap[String(backendId)] = deputado;

      if (!byDeputado[deputado]) {
        byDeputado[deputado] = {
          label: deputado,
          total: 0,
          valor: 0,
          done: 0,
          attention: 0,
          statusMap: {},
          municipios: new Set(),
          latestUpdate: "",
          latestStatus: "",
          latestAction: "",
          latestActor: "",
          auditEvents: 0,
          actors: new Set(),
          photoUrl: getDeputadoPhotoUrl(rec, ctx)
        };
      }
      byDeputado[deputado].total += 1;
      byDeputado[deputado].valor += valor;
      byDeputado[deputado].municipios.add(municipio);
      byDeputado[deputado].statusMap[statusAtual] = (byDeputado[deputado].statusMap[statusAtual] || 0) + 1;
      if (updatedAt && (!byDeputado[deputado].latestUpdate || updatedAt > byDeputado[deputado].latestUpdate)) {
        byDeputado[deputado].latestUpdate = updatedAt;
        byDeputado[deputado].latestStatus = statusAtual;
      }
      if (global && global.code === "done") byDeputado[deputado].done += 1;
      if (global && global.code === "attention") byDeputado[deputado].attention += 1;

      if (!byMunicipio[municipio]) byMunicipio[municipio] = { label: municipio, total: 0, valor: 0, attention: 0 };
      byMunicipio[municipio].total += 1;
      byMunicipio[municipio].valor += valor;
      if (global && global.code === "attention") byMunicipio[municipio].attention += 1;

      byStatus[statusAtual] = (byStatus[statusAtual] || 0) + 1;
    });

    scopedAuditRows.forEach(function (row) {
      var deputado = recordDeputadoMap[String(Number(row && row.emenda_id ? row.emenda_id : 0))];
      var actorName = ctx.text(row && row.usuario_nome) || "sistema";
      var eventType = ctx.text(row && row.tipo_evento) || "EVENTO";
      if (actorName) {
        byUser[actorName] = byUser[actorName] || { label: actorName, total: 0, perfil: ctx.text(row && row.setor) || "-", lastAt: "", lastEvent: "" };
        byUser[actorName].total += 1;
        if (ctx.text(row && row.data_hora) && (!byUser[actorName].lastAt || ctx.text(row.data_hora) > byUser[actorName].lastAt)) {
          byUser[actorName].lastAt = ctx.text(row.data_hora);
          byUser[actorName].lastEvent = eventType;
        }
      }
      if (!deputado || !byDeputado[deputado]) return;
      byDeputado[deputado].auditEvents += 1;
      byDeputado[deputado].actors.add(actorName);
      if (ctx.text(row && row.data_hora) && (!byDeputado[deputado].latestAction || ctx.text(row.data_hora) > byDeputado[deputado].latestAction)) {
        byDeputado[deputado].latestAction = ctx.text(row.data_hora);
        byDeputado[deputado].latestActor = actorName;
      }
    });

    return {
      sourceRows: sourceRows,
      filterOptions: filterOptions,
      rows: rows,
      scopedAuditRows: scopedAuditRows,
      isExecutiveRole: isExecutiveRole,
      summary: summary,
      byDeputado: byDeputado,
      byMunicipio: byMunicipio,
      byStatus: byStatus,
      byUser: byUser
    };
  }

  root.powerBiDataUtils = {
    buildPowerBiFilterOptions: buildPowerBiFilterOptions,
    applyPowerBiDashboardFilters: applyPowerBiDashboardFilters,
    getDeputadoAvatarLetters: getDeputadoAvatarLetters,
    getDeputadoPhotoUrl: getDeputadoPhotoUrl,
    getScopedAuditRowsForRecords: getScopedAuditRowsForRecords,
    buildPowerBiDashboardData: buildPowerBiDashboardData
  };
})(typeof window !== "undefined" ? window : globalThis);

