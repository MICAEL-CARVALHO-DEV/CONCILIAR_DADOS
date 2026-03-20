// =============================================================
// betaData.js — TRANSFORMACOES DE DADOS DE AUDITORIA E SUPORTE
// Dono: Antigravity (frontend/js/ui/)
// Responsabilidade: Camada de transformacao de dados pura (sem renderizacao).
//   Flatten de eventos locais para linhas de auditoria, filtros compostos,
//   construcao de blobs de busca, opcoes de mes/ano e queries de suporte.
//   Nao possui efeitos colaterais de DOM.
// Contrato de contexto (ctx): text, normalizeLooseText, filters,
//   canViewGlobalAuditApi, getBetaAuditRows, getBackendIdForRecord,
//   findRecordByBackendId, isSupportManagerUser, getSupportFilters, supportLimit.
// Exports: SECFrontend.betaDataUtils
//   flattenLocalAuditRows(records, ctx) -> AuditRow[]
//   buildAuditMonthOptions(rows, yearValue, ctx) -> {label,value}[]
//   applyBetaAuditFilters(rows, ctx) -> AuditRow[]
//   getVisibleAuditRows(filteredRows, ctx) -> {source, rows}
//   getAuditRecordMeta(row, ctx) -> {code, detail}
//   getSupportScopeValue(ctx) -> "mine"|"all"
//   getSupportThreadEmendaLabel(thread, ctx) -> string
//   buildSupportUserOptions(threads, ctx) -> string[]
//   buildSupportApiQuery(ctx) -> URLSearchParams string
// Nao tocar: app.js, index.html, style.css
// =============================================================
(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function flattenLocalAuditRows(records, ctx) {
    var out = [];
    (Array.isArray(records) ? records : []).forEach(function (rec) {
      (Array.isArray(rec && rec.eventos) ? rec.eventos : []).forEach(function (ev, idx) {
        var when = ctx.text(ev && ev.at);
        out.push({
          id: ctx.text(rec && rec.id) + ":" + String(idx) + ":" + when,
          source: "LOCAL",
          emenda_id: ctx.getBackendIdForRecord(rec),
          emenda_ref: ctx.text(rec && rec.id) || "-",
          emenda_identificacao: ctx.text(rec && rec.identificacao) || "-",
          emenda_objetivo_epi: ctx.text(rec && rec.objetivo_epi) || "",
          usuario_nome: ctx.text(ev && ev.actor_user) || "sistema",
          setor: ctx.text(ev && ev.actor_role) || "-",
          tipo_evento: ctx.text(ev && ev.type) || "EVENTO",
          origem_evento: ctx.text(ev && ev.origin) || "LOCAL",
          campo_alterado: ctx.text(ev && ev.field) || "",
          valor_antigo: ev && Object.prototype.hasOwnProperty.call(ev, "from") ? ctx.text(ev.from) : "",
          valor_novo: ev && Object.prototype.hasOwnProperty.call(ev, "to") ? ctx.text(ev.to) : "",
          motivo: ctx.text(ev && ev.note) || "",
          data_hora: when,
          at_ts: new Date(when).getTime() || 0
        });
      });
    });
    out.sort(function (a, b) {
      return b.at_ts - a.at_ts;
    });
    return out;
  }

  function getAuditYearValue(row, ctx) {
    var when = ctx.text(row && row.data_hora);
    var d = new Date(when);
    var ts = d.getTime();
    if (!Number.isFinite(ts)) return "";
    return String(d.getFullYear());
  }

  function getAuditMonthValue(row, ctx) {
    var when = ctx.text(row && row.data_hora);
    var d = new Date(when);
    var ts = d.getTime();
    if (!Number.isFinite(ts)) return "";
    return String(d.getMonth() + 1).padStart(2, "0");
  }

  function buildAuditSearchBlob(row, ctx) {
    var meta = getAuditRecordMeta(row, ctx);
    return ctx.normalizeLooseText([
      ctx.text(row && row.usuario_nome),
      ctx.text(row && row.setor),
      ctx.text(row && row.tipo_evento),
      ctx.text(row && row.origem_evento),
      ctx.text(row && row.campo_alterado),
      ctx.text(row && row.valor_antigo),
      ctx.text(row && row.valor_novo),
      ctx.text(row && row.motivo),
      ctx.text(row && row.emenda_identificacao),
      ctx.text(row && row.emenda_objetivo_epi),
      ctx.text(row && row.emenda_municipio),
      ctx.text(row && row.emenda_deputado),
      ctx.text(meta && meta.code),
      ctx.text(meta && meta.detail)
    ].join(" "));
  }

  function buildAuditMonthOptions(rows, yearValue, ctx) {
    var source = Array.isArray(rows) ? rows : [];
    var selectedYear = String(yearValue || "");
    var monthMap = {};
    source.forEach(function (row) {
      var year = getAuditYearValue(row, ctx);
      var month = getAuditMonthValue(row, ctx);
      if (!month) return;
      if (selectedYear && year !== selectedYear) return;
      monthMap[month] = true;
    });
    var labels = {
      "01": "01 - Janeiro",
      "02": "02 - Fevereiro",
      "03": "03 - Marco",
      "04": "04 - Abril",
      "05": "05 - Maio",
      "06": "06 - Junho",
      "07": "07 - Julho",
      "08": "08 - Agosto",
      "09": "09 - Setembro",
      "10": "10 - Outubro",
      "11": "11 - Novembro",
      "12": "12 - Dezembro"
    };
    return Object.keys(monthMap).sort().map(function (month) {
      return {
        label: labels[month] || month,
        value: month
      };
    });
  }

  function applyBetaAuditFilters(rows, ctx) {
    var source = Array.isArray(rows) ? rows : [];
    return source.filter(function (row) {
      var usuarioFilter = ctx.normalizeLooseText(ctx.filters.usuario);
      var setorFilter = ctx.normalizeLooseText(ctx.filters.setor);
      var tipoEventoFilter = ctx.normalizeLooseText(ctx.filters.tipo_evento);
      var origemEventoFilter = ctx.normalizeLooseText(ctx.filters.origem_evento);
      if (ctx.filters.ano && getAuditYearValue(row, ctx) !== String(ctx.filters.ano)) return false;
      if (ctx.filters.mes && getAuditMonthValue(row, ctx) !== String(ctx.filters.mes).padStart(2, "0")) return false;
      if (usuarioFilter && ctx.normalizeLooseText(ctx.text(row && row.usuario_nome)) !== usuarioFilter) return false;
      if (setorFilter && ctx.normalizeLooseText(ctx.text(row && row.setor)) !== setorFilter) return false;
      if (tipoEventoFilter && ctx.normalizeLooseText(ctx.text(row && row.tipo_evento)) !== tipoEventoFilter) return false;
      if (origemEventoFilter && ctx.normalizeLooseText(ctx.text(row && row.origem_evento)) !== origemEventoFilter) return false;
      if (ctx.filters.objetivo_epi) {
        var objetivoBlob = ctx.normalizeLooseText(ctx.text(row && row.emenda_objetivo_epi));
        if (!objetivoBlob.includes(ctx.normalizeLooseText(ctx.filters.objetivo_epi))) return false;
      }
      if (ctx.filters.q) {
        var queryText = ctx.normalizeLooseText(ctx.filters.q);
        if (!buildAuditSearchBlob(row, ctx).includes(queryText)) return false;
      }
      return true;
    });
  }

  function getVisibleAuditRows(filteredRows, ctx) {
    var rows = Array.isArray(filteredRows) ? filteredRows : [];
    if (ctx.canViewGlobalAuditApi() && ctx.getBetaAuditRows().length) {
      return {
        source: "API",
        rows: applyBetaAuditFilters(ctx.getBetaAuditRows(), ctx)
      };
    }
    return {
      source: "LOCAL",
      rows: applyBetaAuditFilters(flattenLocalAuditRows(rows, ctx), ctx)
    };
  }

  function getAuditRecordMeta(row, ctx) {
    if (!row) return { code: "-", detail: "-" };
    if (row.emenda_ref) {
      return {
        code: ctx.text(row.emenda_ref) || "-",
        detail: ctx.text(row.emenda_identificacao) || "-"
      };
    }
    if (row.emenda_identificacao) {
      var apiLabel = row.emenda_ano ? ("API#" + String(row.emenda_id || "-") + " / " + String(row.emenda_ano)) : ("API#" + String(row.emenda_id || "-"));
      var apiDetail = [
        ctx.text(row.emenda_identificacao),
        ctx.text(row.emenda_municipio),
        ctx.text(row.emenda_deputado)
      ].filter(Boolean).join(" | ");
      return {
        code: apiLabel,
        detail: apiDetail || ctx.text(row.emenda_identificacao) || "-"
      };
    }
    var backendId = Number(row.emenda_id || 0);
    var rec = backendId ? ctx.findRecordByBackendId(backendId) : null;
    if (rec) {
      return {
        code: ctx.text(rec.id) || ("API#" + String(backendId)),
        detail: ctx.text(rec.identificacao) || "-"
      };
    }
    return {
      code: backendId ? ("API#" + String(backendId)) : "-",
      detail: "-"
    };
  }

  function getSupportScopeValue(ctx) {
    if (!ctx.isSupportManagerUser()) return "mine";
    return ctx.getSupportFilters().scope === "mine" ? "mine" : "all";
  }

  function getSupportThreadEmendaLabel(thread, ctx) {
    var backendId = Number(thread && thread.emenda_id ? thread.emenda_id : 0);
    if (!backendId) return "";
    var rec = ctx.findRecordByBackendId(backendId);
    if (!rec) return "Emenda #" + String(backendId);
    return String(rec.id || ("API#" + String(backendId))) + " | " + ctx.text(rec.identificacao || "-");
  }

  function buildSupportUserOptions(threads, ctx) {
    return Array.from(new Set((Array.isArray(threads) ? threads : []).map(function (item) {
      return ctx.text(item && item.usuario_nome);
    }).filter(Boolean))).sort();
  }

  function buildSupportApiQuery(ctx) {
    var params = new URLSearchParams();
    params.set("limit", String(ctx.supportLimit));
    if (ctx.getSupportFilters().status) params.set("status", String(ctx.getSupportFilters().status));
    if (ctx.getSupportFilters().categoria) params.set("categoria", String(ctx.getSupportFilters().categoria));
    if (ctx.getSupportFilters().usuario) params.set("usuario", String(ctx.getSupportFilters().usuario));
    if (ctx.getSupportFilters().q) params.set("q", String(ctx.getSupportFilters().q));
    if (getSupportScopeValue(ctx) !== "all") params.set("mine_only", "true");
    return params.toString();
  }

  root.betaDataUtils = {
    flattenLocalAuditRows: flattenLocalAuditRows,
    buildAuditMonthOptions: buildAuditMonthOptions,
    applyBetaAuditFilters: applyBetaAuditFilters,
    getVisibleAuditRows: getVisibleAuditRows,
    getAuditRecordMeta: getAuditRecordMeta,
    getSupportScopeValue: getSupportScopeValue,
    getSupportThreadEmendaLabel: getSupportThreadEmendaLabel,
    buildSupportUserOptions: buildSupportUserOptions,
    buildSupportApiQuery: buildSupportApiQuery
  };
})(typeof window !== "undefined" ? window : globalThis);

