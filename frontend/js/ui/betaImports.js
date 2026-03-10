(function (global) {
  var root = global.SECFrontend = global.SECFrontend || global.SEC_FRONTEND || {};
  global.SEC_FRONTEND = root;

  function noop() {}

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function safeText(value) {
    return value == null ? "" : String(value).trim();
  }

  function clearNode(node) {
    if (!node) return;
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren();
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function fallbackSetSelectOptions(select, options, preferredValue) {
    if (!select) return;
    clearNode(select);
    safeArray(options).forEach(function (item) {
      var option = document.createElement("option");
      option.value = item && item.value != null ? String(item.value) : "";
      option.textContent = item && item.label != null ? String(item.label) : option.value;
      select.appendChild(option);
    });
    if (preferredValue != null) select.value = String(preferredValue);
  }

  function cloneFilters(defaults, overrides) {
    var next = {};
    Object.keys(defaults || {}).forEach(function (key) { next[key] = defaults[key]; });
    Object.keys(overrides || {}).forEach(function (key) { next[key] = overrides[key]; });
    return next;
  }

  function normalizeLooseText(value) {
    return safeText(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function buildImportUserOptions(lots) {
    return Array.from(new Set(safeArray(lots).map(function (item) {
      return safeText(item && item.usuario_nome);
    }).filter(Boolean))).sort();
  }

  function filterLots(lots, filters) {
    var status = safeText(filters && filters.status_governanca).toUpperCase();
    var usuario = safeText(filters && filters.usuario);
    var query = normalizeLooseText(filters && filters.q);
    return safeArray(lots).filter(function (item) {
      if (status && safeText(item && item.status_governanca).toUpperCase() !== status) return false;
      if (usuario && safeText(item && item.usuario_nome) !== usuario) return false;
      if (query) {
        var blob = normalizeLooseText([
          item && item.arquivo_nome,
          item && item.usuario_nome,
          item && item.setor,
          item && item.observacao,
          item && item.governanca_motivo,
          item && item.abas_lidas
        ].join(" "));
        if (blob.indexOf(query) < 0) return false;
      }
      return true;
    });
  }

  function appendField(parent, labelText, control, grow) {
    var field = document.createElement("div");
    field.className = "field" + (grow ? " grow" : "");
    var label = document.createElement("label");
    label.textContent = labelText;
    field.appendChild(label);
    field.appendChild(control);
    parent.appendChild(field);
    return control;
  }

  function buildStatusClass(status) {
    return "beta-import-status beta-import-status-" + normalizeLooseText(status || "APLICADO").replace(/\s+/g, "-");
  }

  function renderMetric(container, label, value) {
    var item = document.createElement("div");
    item.className = "beta-import-stat";
    var title = document.createElement("div");
    title.className = "beta-import-stat-label";
    title.textContent = label;
    var val = document.createElement("div");
    val.className = "beta-import-stat-value";
    val.textContent = value;
    item.appendChild(title);
    item.appendChild(val);
    container.appendChild(item);
  }

  function countLineStatuses(lines) {
    var counts = {
      CREATED: 0,
      UPDATED: 0,
      UNCHANGED: 0,
      SKIPPED: 0,
      CONFLICT: 0
    };
    safeArray(lines).forEach(function (line) {
      var status = safeText(line && line.status_linha).toUpperCase();
      if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
    });
    return counts;
  }

  function filterLineItems(lines, filterKey) {
    var key = safeText(filterKey).toUpperCase();
    if (!key) return safeArray(lines);
    return safeArray(lines).filter(function (line) {
      return safeText(line && line.status_linha).toUpperCase() === key;
    });
  }

  function renderBetaImportsPanel(target, _filteredRows, options) {
    var opts = options || {};
    var clearNodeChildren = typeof opts.clearNodeChildren === "function" ? opts.clearNodeChildren : clearNode;
    var setSelectOptions = typeof opts.setSelectOptions === "function" ? opts.setSelectOptions : fallbackSetSelectOptions;
    var fmtDateTime = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : safeText;
    var extractApiError = typeof opts.extractApiError === "function" ? opts.extractApiError : function (_err, fallback) { return String(fallback || "Falha na API."); };
    var refreshLots = typeof opts.refreshLots === "function" ? opts.refreshLots : function () { return Promise.resolve(); };
    var refreshLines = typeof opts.refreshLines === "function" ? opts.refreshLines : function () { return Promise.resolve(); };
    var refreshLogs = typeof opts.refreshLogs === "function" ? opts.refreshLogs : function () { return Promise.resolve(); };
    var governLot = typeof opts.governLot === "function" ? opts.governLot : function () { return Promise.reject(new Error("Governanca indisponivel")); };
    var rerender = typeof opts.rerender === "function" ? opts.rerender : noop;
    var setFilters = typeof opts.setFilters === "function" ? opts.setFilters : noop;
    var setSelectedLotId = typeof opts.setSelectedLotId === "function" ? opts.setSelectedLotId : noop;
    var canView = typeof opts.canView === "function" ? opts.canView : function () { return false; };
    var canOpenRecord = typeof opts.canOpenRecord === "function" ? opts.canOpenRecord : function () { return false; };
    var openRecord = typeof opts.openRecord === "function" ? opts.openRecord : function () { return false; };

    clearNodeChildren(target);

    var intro = document.createElement("div");
    intro.className = "beta-panel-card";
    var introTitle = document.createElement("h4");
    introTitle.textContent = "Governanca de imports";
    var introText = document.createElement("p");
    introText.className = "muted small";
    introText.textContent = "Todos podem importar. O PROGRAMADOR monitora, corrige e remove imports com trilha de auditoria.";
    intro.appendChild(introTitle);
    intro.appendChild(introText);
    target.appendChild(intro);

    if (!canView()) {
      var locked = document.createElement("p");
      locked.className = "beta-empty";
      locked.textContent = "Painel de governanca disponivel apenas para PROGRAMADOR.";
      target.appendChild(locked);
      return;
    }

    var lots = safeArray(opts.lots);
    var lines = safeArray(opts.lines);
    var logs = safeArray(opts.logs);
    var filters = opts.filters && typeof opts.filters === "object" ? opts.filters : {};
    var selectedLotId = Number(opts.selectedLotId || 0);
    var filteredLots = filterLots(lots, filters);
    var selectedLot = filteredLots.find(function (item) { return Number(item && item.id || 0) === selectedLotId; }) ||
      lots.find(function (item) { return Number(item && item.id || 0) === selectedLotId; }) || null;

    var toolbar = document.createElement("div");
    toolbar.className = "beta-head-actions";
    var badge = document.createElement("span");
    badge.className = "beta-source-badge";
    badge.textContent = "Lotes: " + String(filteredLots.length) + " | Ultima sync: " + (opts.lastSyncAt ? fmtDateTime(opts.lastSyncAt) : "-");
    toolbar.appendChild(badge);
    var refreshBtn = document.createElement("button");
    refreshBtn.type = "button";
    refreshBtn.className = "btn";
    refreshBtn.textContent = opts.loading ? "Atualizando..." : "Atualizar imports";
    refreshBtn.disabled = !!opts.loading;
    refreshBtn.addEventListener("click", function () {
      refreshLots(true).catch(noop);
    });
    toolbar.appendChild(refreshBtn);
    target.appendChild(toolbar);

    var filtersCard = document.createElement("div");
    filtersCard.className = "beta-history-filters";
    var filtersGrid = document.createElement("div");
    filtersGrid.className = "filters";
    var statusSelect = appendField(filtersGrid, "Status", document.createElement("select"));
    setSelectOptions(statusSelect, [
      { value: "", label: "Todos" },
      { value: "APLICADO", label: "Aplicado" },
      { value: "CORRIGIDO", label: "Corrigido" },
      { value: "REMOVIDO", label: "Removido" }
    ], filters.status_governanca || "");
    var userSelect = appendField(filtersGrid, "Usuario", document.createElement("select"));
    setSelectOptions(userSelect, [{ value: "", label: "Todos" }].concat(buildImportUserOptions(lots).map(function (item) {
      return { value: item, label: item };
    })), filters.usuario || "");
    var queryInput = appendField(filtersGrid, "Busca", document.createElement("input"), true);
    queryInput.type = "search";
    queryInput.placeholder = "Arquivo, usuario, observacao, motivo...";
    queryInput.value = safeText(filters.q);
    filtersCard.appendChild(filtersGrid);
    var filterActions = document.createElement("div");
    filterActions.className = "beta-history-filter-actions";
    var applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "btn";
    applyBtn.textContent = "Aplicar filtros";
    applyBtn.addEventListener("click", function () {
      setFilters(cloneFilters(opts.filterDefaults, {
        status_governanca: statusSelect.value || "",
        usuario: userSelect.value || "",
        q: queryInput.value || ""
      }));
      rerender();
    });
    var clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "btn";
    clearBtn.textContent = "Limpar";
    clearBtn.addEventListener("click", function () {
      setFilters(cloneFilters(opts.filterDefaults, {}));
      rerender();
    });
    filterActions.appendChild(applyBtn);
    filterActions.appendChild(clearBtn);
    filtersCard.appendChild(filterActions);
    target.appendChild(filtersCard);

    var layout = document.createElement("div");
    layout.className = "beta-import-layout";
    target.appendChild(layout);

    var listCard = document.createElement("div");
    listCard.className = "beta-panel-card";
    layout.appendChild(listCard);
    var detailCard = document.createElement("div");
    detailCard.className = "beta-panel-card";
    layout.appendChild(detailCard);

    var listTitle = document.createElement("h4");
    listTitle.textContent = "Lotes de import";
    listCard.appendChild(listTitle);
    if (opts.error) {
      var err = document.createElement("p");
      err.className = "muted small";
      err.style.color = "#b4233d";
      err.textContent = safeText(opts.error);
      listCard.appendChild(err);
    }
    var listWrap = document.createElement("div");
    listWrap.className = "beta-import-list";
    listCard.appendChild(listWrap);

    if (opts.loading && !filteredLots.length) {
      var loading = document.createElement("p");
      loading.className = "beta-empty";
      loading.textContent = "Carregando imports...";
      listWrap.appendChild(loading);
    } else if (!filteredLots.length) {
      var empty = document.createElement("p");
      empty.className = "beta-empty";
      empty.textContent = "Nenhum lote encontrado para o filtro atual.";
      listWrap.appendChild(empty);
    } else {
      filteredLots.forEach(function (lot) {
        var item = document.createElement("button");
        item.type = "button";
        item.className = "beta-import-item" + (Number(lot.id || 0) === Number(selectedLotId || 0) ? " active" : "");
        var head = document.createElement("div");
        head.className = "beta-import-head";
        var fileName = document.createElement("strong");
        fileName.textContent = safeText(lot.arquivo_nome || ("Lote #" + String(lot.id || "-")));
        var status = document.createElement("span");
        status.className = buildStatusClass(lot.status_governanca || "APLICADO");
        status.textContent = safeText(lot.status_governanca || "APLICADO");
        head.appendChild(fileName);
        head.appendChild(status);
        item.appendChild(head);
        var meta = document.createElement("div");
        meta.className = "beta-history-meta";
        meta.textContent = "Lote #" + String(lot.id || "-") + " | " + safeText(lot.usuario_nome || "-") + " / " + safeText(lot.setor || "-") + " | " + fmtDateTime(lot.created_at);
        item.appendChild(meta);
        var stats = document.createElement("div");
        stats.className = "beta-import-stat-grid";
        renderMetric(stats, "Criadas", String(Number(lot.registros_criados || 0)));
        renderMetric(stats, "Ignoradas", String(Number(lot.linhas_ignoradas || 0)));
        renderMetric(stats, "Alteradas", String(Number(lot.registros_atualizados || 0)));
        item.appendChild(stats);
        item.addEventListener("click", function () {
          var nextId = Number(lot.id || 0);
          setSelectedLotId(nextId);
          Promise.all([
            refreshLines(false, nextId),
            refreshLogs(false, nextId)
          ]).finally(function () {
            rerender();
          });
        });
        listWrap.appendChild(item);
      });
    }

    var detailTitle = document.createElement("h4");
    detailTitle.textContent = selectedLot ? ("Detalhe do lote #" + String(selectedLot.id)) : "Detalhe do lote";
    detailCard.appendChild(detailTitle);
    if (!selectedLot) {
      var emptyDetail = document.createElement("p");
      emptyDetail.className = "beta-empty";
      emptyDetail.textContent = "Selecione um lote para ver linhas, auditoria e governanca.";
      detailCard.appendChild(emptyDetail);
      return;
    }

    var metaStack = document.createElement("div");
    metaStack.className = "beta-metric-stack";
    [
      "Arquivo: " + safeText(selectedLot.arquivo_nome || "-"),
      "Usuario: " + safeText(selectedLot.usuario_nome || "-") + " | " + safeText(selectedLot.setor || "-"),
      "Criado em: " + fmtDateTime(selectedLot.created_at),
      "Status governanca: " + safeText(selectedLot.status_governanca || "APLICADO"),
      "Motivo governanca: " + safeText(selectedLot.governanca_motivo || "-"),
      "Removidos: " + String(Number(selectedLot.registros_removidos || 0)),
      "Abas lidas: " + safeText(selectedLot.abas_lidas || "-")
    ].forEach(function (line) {
      var item = document.createElement("div");
      item.className = "beta-metric-line";
      item.textContent = line;
      metaStack.appendChild(item);
    });
    detailCard.appendChild(metaStack);

    var detailStats = document.createElement("div");
    detailStats.className = "beta-import-stat-grid";
    renderMetric(detailStats, "Linhas lidas", String(Number(selectedLot.linhas_lidas || 0)));
    renderMetric(detailStats, "Validas", String(Number(selectedLot.linhas_validas || 0)));
    renderMetric(detailStats, "Nao lidas/invalidas", String(Math.max(0, Number(selectedLot.linhas_lidas || 0) - Number(selectedLot.linhas_validas || 0))));
    renderMetric(detailStats, "Sem alteracao", String(Number(selectedLot.sem_alteracao || 0)));
    renderMetric(detailStats, "Criadas", String(Number(selectedLot.registros_criados || 0)));
    renderMetric(detailStats, "Ignoradas", String(Number(selectedLot.linhas_ignoradas || 0)));
    renderMetric(detailStats, "Alteradas", String(Number(selectedLot.registros_atualizados || 0)));
    detailCard.appendChild(detailStats);

    var actionBar = document.createElement("div");
    actionBar.className = "beta-history-filter-actions";
    actionBar.style.marginTop = "12px";
    var correctedBtn = document.createElement("button");
    correctedBtn.type = "button";
    correctedBtn.className = "btn";
    correctedBtn.textContent = "Marcar corrigido";
    correctedBtn.disabled = safeText(selectedLot.status_governanca).toUpperCase() === "REMOVIDO";
    correctedBtn.addEventListener("click", async function () {
      var motivo = global.prompt("Motivo da correcao do import:", safeText(selectedLot.governanca_motivo || ""));
      motivo = safeText(motivo);
      if (!motivo) return;
      try {
        await governLot(selectedLot.id, "CORRIGIR", motivo);
      } catch (err) {
        global.alert(extractApiError(err, "Falha ao corrigir governanca do import."));
      }
    });
    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn danger";
    removeBtn.textContent = "Remover import";
    removeBtn.disabled = safeText(selectedLot.status_governanca).toUpperCase() === "REMOVIDO";
    removeBtn.addEventListener("click", async function () {
      var motivo = global.prompt("Motivo da remocao do import:", "");
      motivo = safeText(motivo);
      if (!motivo) return;
      if (!global.confirm("Remover o import " + safeText(selectedLot.arquivo_nome || ("#" + selectedLot.id)) + "?")) return;
      try {
        await governLot(selectedLot.id, "REMOVER", motivo);
      } catch (err) {
        global.alert(extractApiError(err, "Falha ao remover import."));
      }
    });
    actionBar.appendChild(correctedBtn);
    actionBar.appendChild(removeBtn);
    detailCard.appendChild(actionBar);

    var governanceHint = document.createElement("p");
    governanceHint.className = "muted small";
    governanceHint.textContent = "O PROGRAMADOR pode abrir a emenda criada ou alterada por este lote para fazer o ajuste diretamente.";
    detailCard.appendChild(governanceHint);

    var linesTitle = document.createElement("h4");
    linesTitle.style.marginTop = "14px";
    linesTitle.textContent = "Linhas do lote";
    detailCard.appendChild(linesTitle);
    if (opts.linesError) {
      var linesErr = document.createElement("p");
      linesErr.className = "muted small";
      linesErr.style.color = "#b4233d";
      linesErr.textContent = safeText(opts.linesError);
      detailCard.appendChild(linesErr);
    }
    var linesWrap = document.createElement("div");
    linesWrap.className = "beta-import-lines";
    detailCard.appendChild(linesWrap);
    var lineStatusCounts = countLineStatuses(lines);
    var lineFilterBar = document.createElement("div");
    lineFilterBar.className = "beta-history-filter-actions";
    lineFilterBar.style.marginBottom = "10px";
    [
      { key: "", label: "Todas" },
      { key: "CREATED", label: "Criadas (" + String(lineStatusCounts.CREATED) + ")" },
      { key: "UPDATED", label: "Alteradas (" + String(lineStatusCounts.UPDATED) + ")" },
      { key: "SKIPPED", label: "Ignoradas (" + String(lineStatusCounts.SKIPPED) + ")" },
      { key: "CONFLICT", label: "Conflito (" + String(lineStatusCounts.CONFLICT) + ")" },
      { key: "UNCHANGED", label: "Sem alteracao (" + String(lineStatusCounts.UNCHANGED) + ")" }
    ].forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "btn";
      button.textContent = item.label;
      button.addEventListener("click", function () {
        setFilters(cloneFilters(opts.filterDefaults, {
          status_governanca: filters.status_governanca || "",
          usuario: filters.usuario || "",
          q: filters.q || "",
          line_status: item.key
        }));
        rerender();
      });
      lineFilterBar.appendChild(button);
    });
    detailCard.appendChild(lineFilterBar);
    var filteredLines = filterLineItems(lines, filters.line_status);
    if (opts.linesLoading && !lines.length) {
      var linesLoading = document.createElement("p");
      linesLoading.className = "beta-empty";
      linesLoading.textContent = "Carregando linhas...";
      linesWrap.appendChild(linesLoading);
    } else if (!filteredLines.length) {
      var linesEmpty = document.createElement("p");
      linesEmpty.className = "beta-empty";
      linesEmpty.textContent = lines.length ? "Nenhuma linha encontrada para esse filtro." : "Sem linhas detalhadas registradas para este lote.";
      linesWrap.appendChild(linesEmpty);
    } else {
      filteredLines.forEach(function (line) {
        var card = document.createElement("div");
        card.className = "beta-import-log";
        var lineHead = document.createElement("div");
        lineHead.className = "beta-import-head";
        var ident = document.createElement("strong");
        ident.textContent = safeText(line.id_interno || line.ref_key || ("Linha " + String(line.ordem || "-")));
        var lineStatus = document.createElement("span");
        lineStatus.className = buildStatusClass(line.status_linha || "APLICADO");
        lineStatus.textContent = safeText(line.status_linha || "-");
        lineHead.appendChild(ident);
        lineHead.appendChild(lineStatus);
        card.appendChild(lineHead);
        var lineMeta = document.createElement("div");
        lineMeta.className = "beta-history-meta";
        lineMeta.textContent = "Sheet: " + safeText(line.sheet_name || "-") + " | Linha: " + String(Number(line.row_number || 0));
        card.appendChild(lineMeta);
        if (safeText(line.mensagem)) {
          var msg = document.createElement("div");
          msg.className = "beta-history-note";
          msg.textContent = safeText(line.mensagem);
          card.appendChild(msg);
        }
        if (canOpenRecord(line)) {
          var cardActions = document.createElement("div");
          cardActions.className = "beta-history-filter-actions";
          cardActions.style.marginTop = "8px";
          var openButton = document.createElement("button");
          openButton.type = "button";
          openButton.className = "btn";
          openButton.textContent = "Abrir emenda para ajuste";
          openButton.addEventListener("click", function () {
            if (!openRecord(line)) {
              global.alert("Nao foi possivel localizar a emenda desse lote na base atual.");
            }
          });
          cardActions.appendChild(openButton);
          card.appendChild(cardActions);
        }
        linesWrap.appendChild(card);
      });
    }

    var logsTitle = document.createElement("h4");
    logsTitle.style.marginTop = "14px";
    logsTitle.textContent = "Auditoria da governanca";
    detailCard.appendChild(logsTitle);
    if (opts.logsError) {
      var logsErr = document.createElement("p");
      logsErr.className = "muted small";
      logsErr.style.color = "#b4233d";
      logsErr.textContent = safeText(opts.logsError);
      detailCard.appendChild(logsErr);
    }
    var logsWrap = document.createElement("div");
    logsWrap.className = "beta-import-logs";
    detailCard.appendChild(logsWrap);
    if (opts.logsLoading && !logs.length) {
      var logsLoading = document.createElement("p");
      logsLoading.className = "beta-empty";
      logsLoading.textContent = "Carregando auditoria...";
      logsWrap.appendChild(logsLoading);
    } else if (!logs.length) {
      var logsEmpty = document.createElement("p");
      logsEmpty.className = "beta-empty";
      logsEmpty.textContent = "Sem logs de governanca para este lote.";
      logsWrap.appendChild(logsEmpty);
    } else {
      logs.forEach(function (log) {
        var item = document.createElement("div");
        item.className = "beta-import-log";
        var logHead = document.createElement("div");
        logHead.className = "beta-import-head";
        var action = document.createElement("strong");
        action.textContent = safeText(log.acao || "-");
        var who = document.createElement("span");
        who.className = "beta-history-meta";
        who.textContent = safeText(log.usuario_nome || "sistema") + " / " + safeText(log.setor || "-");
        logHead.appendChild(action);
        logHead.appendChild(who);
        item.appendChild(logHead);
        var when = document.createElement("div");
        when.className = "beta-history-meta";
        when.textContent = fmtDateTime(log.created_at);
        item.appendChild(when);
        var reason = document.createElement("div");
        reason.className = "beta-history-note";
        reason.textContent = safeText(log.motivo || "-");
        item.appendChild(reason);
        if (safeText(log.detalhes_json)) {
          var parsed = safeText(log.detalhes_json);
          try {
            parsed = JSON.stringify(JSON.parse(parsed), null, 2);
          } catch (_err) { /* no-op */ }
          var pre = document.createElement("pre");
          pre.textContent = parsed;
          item.appendChild(pre);
        }
        logsWrap.appendChild(item);
      });
    }
  }

  root.betaImportsUtils = {
    renderBetaImportsPanel: renderBetaImportsPanel
  };
})(window);
