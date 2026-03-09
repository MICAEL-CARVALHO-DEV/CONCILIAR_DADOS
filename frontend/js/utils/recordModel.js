(function (globalScope) {
  "use strict";

  var root = globalScope.SEC_FRONTEND = globalScope.SEC_FRONTEND || {};

  function shallowCloneObj(obj) {
    if (!obj || typeof obj !== "object") return {};
    return Object.assign({}, obj);
  }

  function mkEvent(type, payload, ctx) {
    var p = payload || {};
    return {
      at: p.at || ctx.isoNow(),
      actor_user: p.actor_user || ctx.currentUser,
      actor_role: p.actor_role || ctx.currentRole,
      type: type,
      key: p.key || null,
      field: p.field || null,
      from: p.from || null,
      to: p.to || null,
      raw_from: Object.prototype.hasOwnProperty.call(p, "raw_from") ? p.raw_from : null,
      raw_to: Object.prototype.hasOwnProperty.call(p, "raw_to") ? p.raw_to : null,
      note: p.note || ""
    };
  }

  function mkRecord(data, ctx) {
    var now = ctx.isoNow();
    var rec = {
      id: ctx.asText(data.id),
      ano: ctx.toInt(data.ano) || ctx.currentYear(),
      identificacao: ctx.asText(data.identificacao) || "-",
      cod_subfonte: ctx.asText(data.cod_subfonte),
      deputado: ctx.asText(data.deputado) || "-",
      cod_uo: ctx.asText(data.cod_uo),
      sigla_uo: ctx.asText(data.sigla_uo),
      cod_orgao: ctx.asText(data.cod_orgao),
      cod_acao: ctx.asText(data.cod_acao),
      descricao_acao: ctx.asText(data.descricao_acao),
      plan_a: ctx.asText(data.plan_a || data.plano_a),
      plan_b: ctx.asText(data.plan_b || data.plano_b),
      municipio: ctx.asText(data.municipio) || "-",
      valor_inicial: ctx.toNumber(data.valor_inicial != null ? data.valor_inicial : 0),
      valor_atual: ctx.toNumber(data.valor_atual != null ? data.valor_atual : (data.valor_inicial != null ? data.valor_inicial : 0)),
      processo_sei: ctx.asText(data.processo_sei),
      status_oficial: ctx.normalizeStatus(data.status_oficial || "Recebido"),
      backend_id: data.backend_id != null ? Number(data.backend_id) : null,
      row_version: ctx.toInt(data.row_version) > 0 ? ctx.toInt(data.row_version) : 1,
      created_at: data.created_at || now,
      updated_at: data.updated_at || now,
      eventos: Array.isArray(data.eventos) && data.eventos.length ? data.eventos : [mkEvent("IMPORT", { note: "Registro criado." }, ctx)],
      ref_key: "",
      source_sheet: ctx.asText(data.source_sheet || "Controle de EPI"),
      source_row: data.source_row != null ? Number(data.source_row) : null,
      all_fields: data.all_fields && typeof data.all_fields === "object" ? shallowCloneObj(data.all_fields) : {},
      demo_seed: !!data.demo_seed
    };
    ctx.syncCanonicalToAllFields(rec);
    rec.ref_key = ctx.buildReferenceKey(rec);
    return rec;
  }

  function normalizeRecordShape(raw, ctx) {
    var rec = mkRecord(raw || {}, ctx);
    rec.id = ctx.asText(raw && raw.id ? raw.id : rec.id);
    rec.backend_id = raw && raw.backend_id != null ? Number(raw.backend_id) : rec.backend_id;
    rec.row_version = raw && ctx.toInt(raw.row_version) > 0 ? ctx.toInt(raw.row_version) : rec.row_version;
    rec.parent_id = raw && raw.parent_id != null ? Number(raw.parent_id) : rec.parent_id;
    rec.version = raw && ctx.toInt(raw.version) > 0 ? ctx.toInt(raw.version) : rec.version;
    rec.is_current = raw && Object.prototype.hasOwnProperty.call(raw, "is_current") ? raw.is_current !== false : rec.is_current;
    rec.created_at = (raw && raw.created_at) || rec.created_at;
    rec.updated_at = (raw && raw.updated_at) || rec.updated_at;
    rec.eventos = Array.isArray(raw && raw.eventos) && raw.eventos.length ? raw.eventos : rec.eventos;
    if (!rec.valor_inicial && rec.valor_atual) rec.valor_inicial = rec.valor_atual;
    rec.source_sheet = ctx.asText((raw && raw.source_sheet) || rec.source_sheet || "Controle de EPI");
    rec.source_row = raw && raw.source_row != null ? Number(raw.source_row) : rec.source_row;
    rec.all_fields = rec.all_fields && typeof rec.all_fields === "object" ? rec.all_fields : {};
    rec.demo_seed = (raw && raw.demo_seed === true) || inferDemoSeed(raw || rec, ctx);
    ctx.syncCanonicalToAllFields(rec);
    rec.ref_key = ctx.buildReferenceKey(rec);
    return rec;
  }

  function inferDemoSeed(rec, ctx) {
    if (!rec) return false;
    if (rec.demo_seed === true) return true;

    var identificacao = ctx.normalizeLooseText(rec.identificacao || "");
    var deputado = ctx.normalizeLooseText(rec.deputado || "");
    var processo = ctx.normalizeLooseText(rec.processo_sei || "");
    var id = ctx.normalizeLooseText(rec.id || "");
    var events = Array.isArray(rec.eventos) ? rec.eventos : [];

    var hasDemoNote = events.some(function (ev) {
      return ctx.normalizeLooseText(ev && ev.note ? ev.note : "").indexOf("demo") >= 0;
    });
    if (hasDemoNote) return true;

    if (identificacao === "epi 2026 / fanfarra" && deputado === "dep-alfa") return true;
    if (identificacao === "epi 2026 / reforma escola" && deputado === "dep-beta") return true;
    if (id === "epi-2026-000001" && processo === "sei-0001/2026") return true;
    if (id === "epi-2026-000002" && processo === "sei-0002/2026") return true;

    return false;
  }

  function purgeDemoBeforeOfficialImport(ctx) {
    var records = Array.isArray(ctx.getRecords()) ? ctx.getRecords() : [];
    var kept = records.filter(function (rec) {
      return !inferDemoSeed(rec, ctx);
    });
    var removed = records.length - kept.length;
    if (removed > 0) {
      ctx.setRecords(kept);
    }
    return removed;
  }

  function migrateLegacyStatusRecords(records, ctx) {
    (records || []).forEach(function (rec) {
      var events = Array.isArray(rec && rec.eventos) ? rec.eventos : [];
      var hasMark = events.some(function (ev) { return ev && ev.type === "MARK_STATUS"; });
      var legacyStatus = ctx.normalizeStatus(rec && rec.status_oficial ? rec.status_oficial : "");

      if (!hasMark && legacyStatus) {
        events.unshift(mkEvent("MARK_STATUS", {
          to: legacyStatus,
          note: "Migracao automatica de status legado.",
          actor_user: ctx.systemMigrationUser,
          actor_role: ctx.systemMigrationRole
        }, ctx));
        rec.eventos = events;
        rec.updated_at = rec.updated_at || ctx.isoNow();
      }

      if (rec && Object.prototype.hasOwnProperty.call(rec, "status_oficial")) {
        rec.status_oficial = "";
      }
    });
  }

  function latestMarkedStatus(rec, ctx) {
    var events = ctx.getEventsSorted(rec || {});
    for (var i = 0; i < events.length; i += 1) {
      var ev = events[i];
      if (ev && ev.type === "MARK_STATUS" && ev.to) return ctx.normalizeStatus(ev.to);
    }
    return "";
  }

  function deriveStatusForBackend(rec, ctx) {
    return latestMarkedStatus(rec, ctx) || "Recebido";
  }

  root.recordModelUtils = {
    mkEvent: mkEvent,
    mkRecord: mkRecord,
    normalizeRecordShape: normalizeRecordShape,
    inferDemoSeed: inferDemoSeed,
    purgeDemoBeforeOfficialImport: purgeDemoBeforeOfficialImport,
    migrateLegacyStatusRecords: migrateLegacyStatusRecords,
    latestMarkedStatus: latestMarkedStatus,
    deriveStatusForBackend: deriveStatusForBackend
  };
})(window);
