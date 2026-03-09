(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

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
    if (preferredValue != null) {
      select.value = String(preferredValue);
    }
  }

  function buildBetaAuditFilterOptions(rows, options) {
    var opts = options || {};
    var source = safeArray(rows);
    var getAuditYearValue = typeof opts.getAuditYearValue === "function" ? opts.getAuditYearValue : function () { return ""; };
    var buildAuditMonthOptions = typeof opts.buildAuditMonthOptions === "function" ? opts.buildAuditMonthOptions : function () { return []; };
    var text = typeof opts.text === "function" ? opts.text : safeText;
    var filters = opts.filters && typeof opts.filters === "object" ? opts.filters : {};

    var years = Array.from(new Set(source.map(getAuditYearValue).filter(Boolean))).sort().reverse();
    var users = Array.from(new Set(source.map(function (row) { return text(row && row.usuario_nome); }).filter(Boolean))).sort();
    var roles = Array.from(new Set(source.map(function (row) { return text(row && row.setor); }).filter(Boolean))).sort();
    var eventTypes = Array.from(new Set(source.map(function (row) { return text(row && row.tipo_evento); }).filter(Boolean))).sort();
    var origins = Array.from(new Set(source.map(function (row) { return text(row && row.origem_evento); }).filter(Boolean))).sort();

    return {
      years: years,
      months: buildAuditMonthOptions(source, filters.ano),
      users: users,
      roles: roles,
      eventTypes: eventTypes,
      origins: origins
    };
  }

  function renderBetaHistoryPanel(target, filteredRows, options) {
    var opts = options || {};
    var clearNodeChildren = typeof opts.clearNodeChildren === "function" ? opts.clearNodeChildren : clearNode;
    var text = typeof opts.text === "function" ? opts.text : safeText;
    var fmtDateTime = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : safeText;
    var setSelectOptions = typeof opts.setSelectOptions === "function" ? opts.setSelectOptions : fallbackSetSelectOptions;
    var canViewGlobalAuditApi = typeof opts.canViewGlobalAuditApi === "function" ? opts.canViewGlobalAuditApi : function () { return false; };
    var refreshBetaAuditFromApi = typeof opts.refreshBetaAuditFromApi === "function" ? opts.refreshBetaAuditFromApi : function () { return Promise.resolve(); };
    var buildAuditMonthOptions = typeof opts.buildAuditMonthOptions === "function" ? opts.buildAuditMonthOptions : function () { return []; };
    var getVisibleAuditRows = typeof opts.getVisibleAuditRows === "function" ? opts.getVisibleAuditRows : function () { return { source: "LOCAL", rows: [] }; };
    var flattenLocalAuditRows = typeof opts.flattenLocalAuditRows === "function" ? opts.flattenLocalAuditRows : function () { return []; };
    var getAuditRecordMeta = typeof opts.getAuditRecordMeta === "function" ? opts.getAuditRecordMeta : function () { return { code: "-", detail: "-" }; };
    var describeApiAuditRow = typeof opts.describeApiAuditRow === "function" ? opts.describeApiAuditRow : function () { return "-"; };
    var describeEventForPanel = typeof opts.describeEventForPanel === "function" ? opts.describeEventForPanel : function () { return "-"; };
    var rerender = typeof opts.rerender === "function" ? opts.rerender : function () {};
    var setAuditFilters = typeof opts.setAuditFilters === "function" ? opts.setAuditFilters : function () {};
    var getAuditYearValue = typeof opts.getAuditYearValue === "function" ? opts.getAuditYearValue : function () { return ""; };
    var filters = opts.filters && typeof opts.filters === "object" ? opts.filters : {};
    var betaAuditRows = safeArray(opts.auditRows);
    var betaAuditLoading = !!opts.loading;
    var betaAuditError = String(opts.error || "");
    var betaAuditLastSyncAt = opts.lastSyncAt || "";
    var betaAuditLimit = Number(opts.auditLimit || 150);
    var auditFilterDefaults = opts.auditFilterDefaults && typeof opts.auditFilterDefaults === "object" ? opts.auditFilterDefaults : {};

    clearNodeChildren(target);

    var auditState = getVisibleAuditRows(filteredRows);
    var rows = safeArray(auditState.rows).slice(0, betaAuditLimit);
    var optionSourceRows = canViewGlobalAuditApi() && betaAuditRows.length
      ? betaAuditRows
      : flattenLocalAuditRows(filteredRows);
    var filterOptions = buildBetaAuditFilterOptions(optionSourceRows, {
      getAuditYearValue: getAuditYearValue,
      buildAuditMonthOptions: buildAuditMonthOptions,
      text: text,
      filters: filters
    });

    var toolbar = document.createElement("div");
    toolbar.className = "beta-head-actions";

    var sourceBadge = document.createElement("span");
    sourceBadge.className = "beta-source-badge";
    sourceBadge.textContent = auditState.source === "API" ? "Historico global da API" : "Historico local do navegador";
    toolbar.appendChild(sourceBadge);

    if (canViewGlobalAuditApi()) {
      var refreshBtn = document.createElement("button");
      refreshBtn.className = "btn";
      refreshBtn.type = "button";
      refreshBtn.textContent = betaAuditLoading ? "Atualizando..." : "Atualizar historico";
      refreshBtn.disabled = betaAuditLoading;
      refreshBtn.addEventListener("click", function () {
        refreshBetaAuditFromApi(true).catch(function () {});
      });
      toolbar.appendChild(refreshBtn);
    }

    target.appendChild(toolbar);

    var filterWrap = document.createElement("div");
    filterWrap.className = "filters beta-history-filters";

    function appendField(labelText, control, grow) {
      var field = document.createElement("div");
      field.className = "field" + (grow ? " grow" : "");
      var label = document.createElement("label");
      label.textContent = labelText;
      field.appendChild(label);
      field.appendChild(control);
      filterWrap.appendChild(field);
      return control;
    }

    var yearSelect = appendField("Ano do historico", document.createElement("select"));
    setSelectOptions(yearSelect, [{ label: "Todos", value: "" }].concat(filterOptions.years.map(function (value) {
      return { label: value, value: value };
    })), filters.ano || "");

    var monthSelect = appendField("Mes", document.createElement("select"));
    setSelectOptions(monthSelect, [{ label: "Todos", value: "" }].concat(filterOptions.months), filters.mes || "");

    var userSelect = appendField("Usuario", document.createElement("select"));
    setSelectOptions(userSelect, [{ label: "Todos", value: "" }].concat(filterOptions.users.map(function (value) {
      return { label: value, value: value };
    })), filters.usuario || "");

    var roleSelect = appendField("Perfil", document.createElement("select"));
    setSelectOptions(roleSelect, [{ label: "Todos", value: "" }].concat(filterOptions.roles.map(function (value) {
      return { label: value, value: value };
    })), filters.setor || "");

    var eventSelect = appendField("Tipo de evento", document.createElement("select"));
    setSelectOptions(eventSelect, [{ label: "Todos", value: "" }].concat(filterOptions.eventTypes.map(function (value) {
      return { label: value, value: value };
    })), filters.tipo_evento || "");

    var originSelect = appendField("Origem", document.createElement("select"));
    setSelectOptions(originSelect, [{ label: "Todas", value: "" }].concat(filterOptions.origins.map(function (value) {
      return { label: value, value: value };
    })), filters.origem_evento || "");

    var searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "usuario, motivo, campo, valor, emenda...";
    searchInput.value = filters.q || "";
    appendField("Busca no historico", searchInput, true);

    var actionField = document.createElement("div");
    actionField.className = "field";
    var actionLabel = document.createElement("label");
    actionLabel.textContent = "Acoes";
    var actionWrap = document.createElement("div");
    actionWrap.className = "beta-history-filter-actions";
    var applyBtn = document.createElement("button");
    applyBtn.className = "btn primary";
    applyBtn.type = "button";
    applyBtn.textContent = "Aplicar";
    var clearBtn = document.createElement("button");
    clearBtn.className = "btn";
    clearBtn.type = "button";
    clearBtn.textContent = "Limpar";
    actionWrap.appendChild(applyBtn);
    actionWrap.appendChild(clearBtn);
    actionField.appendChild(actionLabel);
    actionField.appendChild(actionWrap);
    filterWrap.appendChild(actionField);

    yearSelect.addEventListener("change", function () {
      var nextMonths = [{ label: "Todos", value: "" }].concat(buildAuditMonthOptions(optionSourceRows, yearSelect.value || ""));
      var preferredMonth = nextMonths.some(function (item) { return item.value === monthSelect.value; }) ? monthSelect.value : "";
      setSelectOptions(monthSelect, nextMonths, preferredMonth);
    });

    searchInput.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      applyBtn.click();
    });

    applyBtn.addEventListener("click", function () {
      setAuditFilters({
        ano: String(yearSelect.value || ""),
        mes: String(monthSelect.value || ""),
        usuario: String(userSelect.value || ""),
        setor: String(roleSelect.value || ""),
        tipo_evento: String(eventSelect.value || ""),
        origem_evento: String(originSelect.value || ""),
        q: String(searchInput.value || "").trim()
      });
      if (canViewGlobalAuditApi()) {
        refreshBetaAuditFromApi(true).catch(function () {});
        return;
      }
      rerender();
    });

    clearBtn.addEventListener("click", function () {
      var nextFilters = {};
      Object.keys(auditFilterDefaults).forEach(function (key) {
        nextFilters[key] = auditFilterDefaults[key];
      });
      setAuditFilters(nextFilters);
      if (canViewGlobalAuditApi()) {
        refreshBetaAuditFromApi(true).catch(function () {});
        return;
      }
      rerender();
    });

    target.appendChild(filterWrap);

    var info = document.createElement("p");
    info.className = "muted small";
    info.style.marginTop = "10px";
    var filterInfo = "Filtro atual: " + String(safeArray(filteredRows).length) + " emendas visiveis. Eventos retornados: " + String(rows.length) + ".";
    var syncInfo = betaAuditLastSyncAt ? (" Ultima leitura da API: " + fmtDateTime(betaAuditLastSyncAt) + ".") : "";
    info.textContent = filterInfo + syncInfo;
    target.appendChild(info);

    if (betaAuditError) {
      var error = document.createElement("p");
      error.className = "muted small";
      error.style.color = "#b4233d";
      error.style.marginTop = "8px";
      error.textContent = betaAuditError;
      target.appendChild(error);
    }

    if (!rows.length) {
      var empty = document.createElement("p");
      empty.className = "beta-empty";
      empty.style.marginTop = "12px";
      empty.textContent = betaAuditLoading
        ? "Carregando historico operacional..."
        : "Sem eventos para o filtro atual.";
      target.appendChild(empty);
      return;
    }

    var list = document.createElement("div");
    list.className = "recent-list beta-history-list";

    rows.forEach(function (row) {
      var meta = getAuditRecordMeta(row);
      var item = document.createElement("div");
      item.className = "recent-item";

      var top = document.createElement("div");
      top.className = "recent-item-top";

      var left = document.createElement("div");
      var badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = text(row.tipo_evento || "EVENTO");
      left.appendChild(badge);

      var targetLine = document.createElement("div");
      targetLine.className = "recent-item-target";
      targetLine.textContent = meta.code + " | " + meta.detail;
      left.appendChild(targetLine);
      top.appendChild(left);

      var right = document.createElement("div");
      right.className = "muted small";
      right.textContent = fmtDateTime(row.data_hora);
      top.appendChild(right);
      item.appendChild(top);

      var action = document.createElement("div");
      action.className = "recent-item-action";
      action.textContent = row.source === "API" ? describeApiAuditRow(row) : describeEventForPanel({
        type: row.tipo_evento,
        from: row.valor_antigo,
        to: row.valor_novo,
        field: row.campo_alterado
      });
      item.appendChild(action);

      var auditMeta = document.createElement("div");
      auditMeta.className = "beta-history-meta";
      auditMeta.textContent = "Usuario: " + text(row.usuario_nome || "-")
        + " | Perfil: " + text(row.setor || "-")
        + " | Origem: " + text(row.origem_evento || row.source || "-");
      item.appendChild(auditMeta);

      if (text(row.motivo)) {
        var note = document.createElement("div");
        note.className = "beta-history-note";
        note.textContent = "Obs.: " + text(row.motivo);
        item.appendChild(note);
      }

      list.appendChild(item);
    });

    target.appendChild(list);
  }

  root.betaHistoryUtils = {
    buildBetaAuditFilterOptions: buildBetaAuditFilterOptions,
    renderBetaHistoryPanel: renderBetaHistoryPanel
  };
})(window);
