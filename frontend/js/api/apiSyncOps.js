(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function noop() {}

  function safeWarn() {
    if (!globalScope.console || typeof globalScope.console.warn !== "function") return;
    globalScope.console.warn.apply(globalScope.console, arguments);
  }

  function applySyncResponseToRecord(rec, responsePayload, ctx) {
    var toInt = typeof ctx.toInt === "function" ? ctx.toInt : function (value) { return Number(value || 0); };
    if (!rec || !responsePayload || typeof responsePayload !== "object") return;
    var nextRowVersion = toInt(responsePayload.row_version);
    if (nextRowVersion > 0) rec.row_version = nextRowVersion;
    if (responsePayload.updated_at) rec.updated_at = String(responsePayload.updated_at);
  }

  async function ensureBackendEmenda(rec, options, ctx) {
    var requestOpts = options && typeof options === "object" ? options : {};
    var handleAuthFailure = Object.prototype.hasOwnProperty.call(requestOpts, "handleAuthFailure")
      ? !!requestOpts.handleAuthFailure
      : true;

    if (!rec) return null;
    if (rec.backend_id) return rec.backend_id;

    var known = ctx.getApiEmendaIdByInterno(rec.id);
    if (known) {
      rec.backend_id = Number(known);
      return rec.backend_id;
    }

    var remoteList = await ctx.apiRequest("GET", "/emendas", undefined, "API", { handleAuthFailure: handleAuthFailure });
    var found = (Array.isArray(remoteList) ? remoteList : []).find(function (item) {
      return ctx.text(item.id_interno) === rec.id;
    });

    if (found) {
      rec.backend_id = Number(found.id);
      ctx.setApiEmendaIdByInterno(rec.id, rec.backend_id);
      if (ctx.toInt(found.row_version) > 0) rec.row_version = ctx.toInt(found.row_version);
      if (found.updated_at) rec.updated_at = String(found.updated_at);
      return rec.backend_id;
    }

    var created = await ctx.apiRequest("POST", "/emendas", {
      id_interno: rec.id,
      ano: ctx.toInt(rec.ano) || ctx.currentYear(),
      identificacao: rec.identificacao || "-",
      cod_subfonte: rec.cod_subfonte || "",
      deputado: rec.deputado || "",
      cod_uo: rec.cod_uo || "",
      sigla_uo: rec.sigla_uo || "",
      cod_orgao: rec.cod_orgao || "",
      cod_acao: rec.cod_acao || "",
      descricao_acao: rec.descricao_acao || "",
      plan_a: rec.plan_a || "",
      plan_b: rec.plan_b || "",
      municipio: rec.municipio || "",
      valor_inicial: ctx.toNumber(rec.valor_inicial || 0),
      valor_atual: ctx.toNumber(rec.valor_atual || 0),
      processo_sei: rec.processo_sei || "",
      status_oficial: ctx.deriveStatusForBackend(rec)
    }, "IMPORT", { handleAuthFailure: handleAuthFailure });

    rec.backend_id = created && created.id != null ? Number(created.id) : null;
    if (rec.backend_id) ctx.setApiEmendaIdByInterno(rec.id, rec.backend_id);
    if (created && ctx.toInt(created.row_version) > 0) rec.row_version = ctx.toInt(created.row_version);
    if (created && created.updated_at) rec.updated_at = String(created.updated_at);
    return rec.backend_id;
  }

  async function syncOfficialStatusToApi(rec, nextStatus, motivo, ctx) {
    if (!ctx.isApiEnabled()) return;
    var backendId = await ensureBackendEmenda(rec, undefined, ctx);
    var resp = await ctx.apiRequest("POST", "/emendas/" + String(backendId) + "/status", {
      novo_status: nextStatus,
      motivo: motivo,
      expected_row_version: ctx.toInt(rec.row_version) > 0 ? ctx.toInt(rec.row_version) : 1
    }, "UI");
    applySyncResponseToRecord(rec, resp, ctx);
    ctx.setApiOnline(true);
    ctx.setApiLastError("");
    ctx.applyAccessProfile();
    Promise.resolve(ctx.refreshBetaAuditFromApi(false)).catch(noop);
  }

  async function syncGenericEventToApi(rec, payload, ctx) {
    if (!ctx.isApiEnabled()) return;
    var backendId = await ensureBackendEmenda(rec, undefined, ctx);
    var body = Object.assign({}, payload || {}, {
      expected_row_version: ctx.toInt(rec.row_version) > 0 ? ctx.toInt(rec.row_version) : 1
    });
    var resp = await ctx.apiRequest(
      "POST",
      "/emendas/" + String(backendId) + "/eventos",
      body,
      payload && payload.origem_evento ? payload.origem_evento : "UI"
    );
    applySyncResponseToRecord(rec, resp, ctx);
    ctx.setApiOnline(true);
    ctx.setApiLastError("");
    ctx.applyAccessProfile();
    Promise.resolve(ctx.refreshBetaAuditFromApi(false)).catch(noop);
  }

  function handleApiSyncError(err, actionName, ctx) {
    var msg = err && err.message ? String(err.message) : "falha desconhecida";
    var status = Number(err && err.status ? err.status : 0);
    ctx.setApiOnline(!!status && status < 500);
    ctx.setApiLastError(msg);
    ctx.applyAccessProfile();
    safeWarn("Falha ao sincronizar " + actionName + " com API:", msg);
  }

  function buildImportSyncRecords(report, ctx) {
    var state = typeof ctx.getState === "function" ? ctx.getState() : {};
    var byId = new Map();
    (Array.isArray(state && state.records) ? state.records : []).forEach(function (rec) {
      if (rec && rec.id) byId.set(rec.id, rec);
    });

    var out = [];
    var seen = new Set();
    var lines = Array.isArray(report && report.rowDetails) ? report.rowDetails : [];
    lines.forEach(function (ln) {
      var status = String(ln && ln.status_linha ? ln.status_linha : "").trim().toUpperCase();
      var idInterno = ctx.text(ln && ln.id_interno);
      if (!idInterno || status === "SKIPPED") return;
      if (seen.has(idInterno)) return;

      var rec = byId.get(idInterno);
      if (!rec) return;

      seen.add(idInterno);
      out.push({
        id_interno: rec.id,
        ano: ctx.toInt(rec.ano) || ctx.currentYear(),
        identificacao: rec.identificacao || "-",
        cod_subfonte: rec.cod_subfonte || "",
        deputado: rec.deputado || "",
        cod_uo: rec.cod_uo || "",
        sigla_uo: rec.sigla_uo || "",
        cod_orgao: rec.cod_orgao || "",
        cod_acao: rec.cod_acao || "",
        descricao_acao: rec.descricao_acao || "",
        municipio: rec.municipio || "",
        valor_inicial: rec.valor_inicial != null ? Number(rec.valor_inicial) : 0,
        valor_atual: rec.valor_atual != null ? Number(rec.valor_atual) : (rec.valor_inicial != null ? Number(rec.valor_inicial) : 0),
        processo_sei: rec.processo_sei || "",
        status_oficial: ctx.deriveStatusForBackend(rec),
        source_sheet: rec.source_sheet || (ln && ln.sheet_name ? String(ln.sheet_name) : "Controle de EPI"),
        source_row: rec.source_row != null ? Number(rec.source_row) : (ln && ln.row_number != null ? Number(ln.row_number) : null)
      });
    });

    return out;
  }

  function buildImportApplyRecordsFromPreview(report, ctx) {
    var source = report && typeof report === "object" ? report : {};
    var rows = Array.isArray(source.sourceRows) ? source.sourceRows : [];
    var details = Array.isArray(source.rowDetails) ? source.rowDetails : [];
    var acceptedStatuses = { CREATED: true, UPDATED: true, UNCHANGED: true };
    var out = [];
    var seen = new Set();

    details.forEach(function (ln, idx) {
      var status = String(ln && ln.status_linha ? ln.status_linha : "").trim().toUpperCase();
      if (!acceptedStatuses[status]) return;

      var previewRow = rows[idx] && typeof rows[idx] === "object" ? rows[idx] : null;
      var mapped = previewRow && previewRow.dados && typeof previewRow.dados === "object"
        ? previewRow.dados
        : {};
      var idInterno = ctx.text(mapped.id != null ? mapped.id : (ln && ln.id_interno));
      if (!idInterno || seen.has(idInterno)) return;

      seen.add(idInterno);

      var valorInicialRaw = mapped.valor_inicial;
      var valorAtualRaw = mapped.valor_atual;
      var valorInicial = ctx.text(valorInicialRaw) !== "" ? ctx.toNumber(valorInicialRaw) : 0;
      var valorAtual = ctx.text(valorAtualRaw) !== "" ? ctx.toNumber(valorAtualRaw) : valorInicial;
      var statusOficial = ctx.text(mapped.status_oficial) || "Recebido";
      var sourceSheet = ctx.text(previewRow && previewRow.aba) || ctx.text(ln && ln.sheet_name) || "Controle de EPI";
      var sourceRow = previewRow && previewRow.linha != null
        ? Number(previewRow.linha)
        : (ln && ln.row_number != null ? Number(ln.row_number) : null);

      out.push({
        id_interno: idInterno,
        ano: ctx.toInt(mapped.ano) || ctx.currentYear(),
        identificacao: ctx.text(mapped.identificacao) || idInterno || "-",
        cod_subfonte: ctx.text(mapped.cod_subfonte),
        deputado: ctx.text(mapped.deputado),
        cod_uo: ctx.text(mapped.cod_uo),
        sigla_uo: ctx.text(mapped.sigla_uo),
        cod_orgao: ctx.text(mapped.cod_orgao),
        cod_acao: ctx.text(mapped.cod_acao),
        descricao_acao: ctx.text(mapped.descricao_acao),
        municipio: ctx.text(mapped.municipio),
        valor_inicial: valorInicial,
        valor_atual: valorAtual,
        processo_sei: ctx.text(mapped.processo_sei),
        status_oficial: statusOficial,
        source_sheet: sourceSheet,
        source_row: sourceRow
      });
    });

    return out;
  }

  function buildImportApplyPayload(file, report, ctx) {
    var source = report && typeof report === "object" ? report : {};
    var previewHash = String(source.fileHash || "").trim().toLowerCase();
    if (!previewHash) {
      throw new Error("Preview sem fileHash autoritativo.");
    }

    return {
      preview_hash: previewHash,
      arquivo_nome: file && file.name ? file.name : (source.fileName || "importacao.xlsx"),
      registros: buildImportApplyRecordsFromPreview(source, ctx),
      linhas_lidas: Number(source.totalRows || 0),
      linhas_validas: Number(source.consideredRows || 0),
      linhas_ignoradas: Number(source.skippedRows || 0),
      registros_criados: Number(source.created || 0),
      registros_atualizados: Number(source.updated || 0),
      sem_alteracao: Number(source.unchanged || 0),
      duplicidade_id: Number(source.duplicateById || 0),
      duplicidade_ref: Number(source.duplicateByRef || 0),
      duplicidade_arquivo: Number(source.duplicateInFile || 0),
      conflito_id_ref: Number(source.conflictIdVsRef || 0),
      abas_lidas: Array.isArray(source.sheetNames) ? source.sheetNames.slice() : [],
      observacao: "Aplicacao via governanca web",
      origem_evento: "IMPORT",
      linhas: Array.isArray(source.rowDetails) ? source.rowDetails.map(function (ln, idx) {
        return {
          ordem: ln && ln.ordem != null ? Number(ln.ordem) : (idx + 1),
          sheet_name: ln && ln.sheet_name ? String(ln.sheet_name) : "",
          row_number: ln && ln.row_number != null ? Number(ln.row_number) : 0,
          status_linha: (ln && ln.status_linha ? String(ln.status_linha) : "UNCHANGED").toUpperCase(),
          id_interno: ln && ln.id_interno ? String(ln.id_interno) : "",
          ref_key: ln && ln.ref_key ? String(ln.ref_key) : "",
          mensagem: ln && ln.mensagem ? String(ln.mensagem) : ""
        };
      }) : []
    };
  }

  async function previewImportXlsx(file, ctx) {
    var canPreview = typeof ctx.isImportPreviewApiEnabled === "function"
      ? !!ctx.isImportPreviewApiEnabled()
      : !!ctx.isApiEnabled();
    if (!canPreview) {
      throw new Error("Preview de importacao indisponivel sem API ativa.");
    }
    if (!file) {
      throw new Error("Arquivo XLSX nao informado.");
    }

    var url = ctx.getApiBaseUrl() + "/imports/preview-xlsx";
    var formData = new globalScope.FormData();
    formData.append("file", file, file && file.name ? file.name : "import.xlsx");

    var headers = Object.assign({}, ctx.buildApiHeaders("IMPORT"));
    delete headers["Content-Type"];
    delete headers["content-type"];

    var response;
    try {
      response = await globalScope.fetch(url, {
        method: "POST",
        headers: headers,
        body: formData
      });
    } catch (err) {
      handleApiSyncError(err, "preview de importacao", ctx);
      throw err;
    }

    var payload = null;
    var contentType = response.headers.get("content-type") || "";
    if (contentType.indexOf("application/json") >= 0) {
      payload = await response.json().catch(function () { return null; });
    } else {
      var textPayload = await response.text().catch(function () { return ""; });
      payload = textPayload ? { detail: textPayload } : null;
    }

    if (!response.ok) {
      var err = new Error(payload && payload.detail ? String(payload.detail) : ("Falha no preview de importacao (" + String(response.status) + ")"));
      err.status = response.status;
      handleApiSyncError(err, "preview de importacao", ctx);
      throw err;
    }

    ctx.setApiOnline(true);
    ctx.setApiLastError("");
    ctx.applyAccessProfile();
    return payload || {};
  }

  async function previewImportedEmendasToApi(file, ctx) {
    return previewImportXlsx(file, ctx);
  }

  async function rollbackSaveAndReport(err, rec, snapshot, actionName, ctx) {
    ctx.restoreRecordFromSnapshot(rec, snapshot);
    ctx.saveState(true);
    ctx.render();
    if (ctx.getSelectedId() === rec.id) ctx.openModal(rec.id, true);

    if (ctx.isApiConflictError(err)) {
      await ctx.refreshRecordConcurrencyFromApi(rec);
      ctx.showModalSaveFeedback(ctx.conflictMessageFromError(err), true);
      return;
    }

    handleApiSyncError(err, actionName, ctx);
  }

  async function syncImportBatchToApi(file, report, ctx) {
    if (!ctx.isApiEnabled()) return null;
    var authoritativeHash = report && report.fileHash ? String(report.fileHash).trim().toLowerCase() : "";
    var payload = {
      arquivo_nome: file && file.name ? file.name : (report.fileName || "importacao"),
      arquivo_hash: authoritativeHash || ctx.quickHashString(
        (file && file.name ? file.name : "") + "|"
        + (file && file.size ? file.size : 0) + "|"
        + (file && file.lastModified ? file.lastModified : 0) + "|"
        + (report.totalRows || 0) + "|"
        + (report.created || 0) + "|"
        + (report.updated || 0)
      ),
      linhas_lidas: report.totalRows || 0,
      linhas_validas: report.consideredRows || 0,
      linhas_ignoradas: report.skippedRows || 0,
      registros_criados: report.created || 0,
      registros_atualizados: report.updated || 0,
      sem_alteracao: report.unchanged || 0,
      duplicidade_id: report.duplicateById || 0,
      duplicidade_ref: report.duplicateByRef || 0,
      duplicidade_arquivo: report.duplicateInFile || 0,
      conflito_id_ref: report.conflictIdVsRef || 0,
      abas_lidas: report.sheetNames || [],
      observacao: "Importacao via interface web",
      origem_evento: "IMPORT"
    };

    try {
      var resp = await ctx.apiRequest("POST", "/imports/lotes", payload, "IMPORT");
      ctx.setApiOnline(true);
      ctx.setApiLastError("");
      ctx.applyAccessProfile();
      return {
        loteId: resp && resp.id != null ? Number(resp.id) : null,
        changed: !(resp && Object.prototype.hasOwnProperty.call(resp, "changed")) || resp.changed !== false,
        reason: resp && resp.reason ? String(resp.reason) : "",
        existingLotId: resp && resp.lote_id_existente != null ? Number(resp.lote_id_existente) : null,
        arquivoHash: payload.arquivo_hash
      };
    } catch (err) {
      handleApiSyncError(err, "lote de importacao", ctx);
      return null;
    }
  }

  async function syncImportedEmendasToApi(file, report, ctx) {
    if (!ctx.isApiEnabled()) return null;

    var registros = buildImportSyncRecords(report, ctx);
    if (!registros.length) {
      return { ok: true, processed: 0, created: 0, updated: 0, unchanged: 0 };
    }

    try {
      var resp = await ctx.apiRequest("POST", "/imports/emendas/sync", {
        arquivo_nome: file && file.name ? file.name : (report && report.fileName ? report.fileName : "importacao.xlsx"),
        registros: registros
      }, "IMPORT");
      ctx.setApiOnline(true);
      ctx.setApiLastError("");
      ctx.applyAccessProfile();
      return resp;
    } catch (err) {
      handleApiSyncError(err, "dados oficiais da importacao", ctx);
      throw err;
    }
  }

  async function applyImportedEmendasToApi(file, report, ctx) {
    if (!ctx.isApiEnabled()) return null;

    var payload = buildImportApplyPayload(file, report, ctx);
    if (!Array.isArray(payload.registros) || !payload.registros.length) {
      return { ok: true, changed: false, reason: "empty_preview", preview_hash: payload.preview_hash };
    }

    try {
      var resp = await ctx.apiRequest("POST", "/imports/emendas/apply", payload, "IMPORT");
      ctx.setApiOnline(true);
      ctx.setApiLastError("");
      ctx.applyAccessProfile();
      return resp;
    } catch (err) {
      handleApiSyncError(err, "apply de importacao", ctx);
      throw err;
    }
  }

  async function syncImportLinesToApi(loteId, rowDetails, ctx) {
    if (!ctx.isApiEnabled() || !loteId) return;
    var lines = Array.isArray(rowDetails) ? rowDetails : [];
    if (!lines.length) return;

    var chunkSize = 300;
    for (var i = 0; i < lines.length; i += chunkSize) {
      var chunk = lines.slice(i, i + chunkSize).map(function (ln, idx) {
        return {
          ordem: ln && ln.ordem != null ? Number(ln.ordem) : (i + idx + 1),
          sheet_name: ln && ln.sheet_name ? String(ln.sheet_name) : "",
          row_number: ln && ln.row_number != null ? Number(ln.row_number) : 0,
          status_linha: (ln && ln.status_linha ? String(ln.status_linha) : "UNCHANGED").toUpperCase(),
          id_interno: ln && ln.id_interno ? String(ln.id_interno) : "",
          ref_key: ln && ln.ref_key ? String(ln.ref_key) : "",
          mensagem: ln && ln.mensagem ? String(ln.mensagem) : ""
        };
      });

      try {
        await ctx.apiRequest("POST", "/imports/linhas/bulk", {
          lote_id: Number(loteId),
          linhas: chunk
        }, "IMPORT");
        ctx.setApiOnline(true);
        ctx.setApiLastError("");
      } catch (err) {
        handleApiSyncError(err, "linhas de importacao", ctx);
        return;
      }
    }

    ctx.applyAccessProfile();
  }

  async function syncExportLogToApi(meta, ctx) {
    if (!ctx.isApiEnabled()) return;
    var payload = {
      formato: String(meta && meta.formato ? meta.formato : "XLSX").toUpperCase(),
      arquivo_nome: meta && meta.arquivoNome ? meta.arquivoNome : "exportacao",
      quantidade_registros: meta && Number.isFinite(Number(meta.quantidadeRegistros)) ? Number(meta.quantidadeRegistros) : 0,
      quantidade_eventos: meta && Number.isFinite(Number(meta.quantidadeEventos)) ? Number(meta.quantidadeEventos) : 0,
      filtros_json: JSON.stringify(meta && meta.filtros ? meta.filtros : {}),
      modo_headers: meta && meta.modoHeaders ? meta.modoHeaders : "normalizados",
      escopo_exportacao: meta && meta.escopoExportacao ? String(meta.escopoExportacao) : ctx.exportScopeAtuais,
      round_trip_ok: meta && Object.prototype.hasOwnProperty.call(meta, "roundTripOk") ? meta.roundTripOk : null,
      round_trip_issues: meta && Array.isArray(meta.roundTripIssues) ? meta.roundTripIssues : [],
      origem_evento: "EXPORT"
    };

    try {
      await ctx.apiRequest("POST", "/exports/logs", payload, "EXPORT");
      ctx.setApiOnline(true);
      ctx.setApiLastError("");
      ctx.applyAccessProfile();
    } catch (err) {
      handleApiSyncError(err, "log de exportacao", ctx);
    }
  }

  root.apiSyncOpsUtils = {
    applySyncResponseToRecord: applySyncResponseToRecord,
    previewImportXlsx: previewImportXlsx,
    previewImportedEmendasToApi: previewImportedEmendasToApi,
    syncOfficialStatusToApi: syncOfficialStatusToApi,
    syncGenericEventToApi: syncGenericEventToApi,
    ensureBackendEmenda: ensureBackendEmenda,
    rollbackSaveAndReport: rollbackSaveAndReport,
    handleApiSyncError: handleApiSyncError,
    syncImportedEmendasToApi: syncImportedEmendasToApi,
    applyImportedEmendasToApi: applyImportedEmendasToApi,
    syncImportBatchToApi: syncImportBatchToApi,
    syncImportLinesToApi: syncImportLinesToApi,
    syncExportLogToApi: syncExportLogToApi
  };
})(window);

