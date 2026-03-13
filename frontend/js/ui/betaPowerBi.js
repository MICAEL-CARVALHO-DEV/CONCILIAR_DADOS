(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

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
    if (preferredValue != null) {
      select.value = String(preferredValue);
    }
  }

  function fallbackAvatarLetters(name) {
    var src = safeText(name);
    if (!src) return "DP";
    var parts = src.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function renderBetaPowerBiPanel(target, filteredRows, options) {
    var opts = options || {};
    var clearNodeChildren = typeof opts.clearNodeChildren === "function" ? opts.clearNodeChildren : clearNode;
    var buildPowerBiDashboardData = typeof opts.buildPowerBiDashboardData === "function" ? opts.buildPowerBiDashboardData : function () { return {}; };
    var exportExecutiveDashboardReport = typeof opts.exportExecutiveDashboardReport === "function" ? opts.exportExecutiveDashboardReport : function () { return Promise.resolve(false); };
    var extractApiError = typeof opts.extractApiError === "function" ? opts.extractApiError : function (_err, fallback) { return String(fallback || "Falha ao exportar relatorio executivo."); };
    var setSelectOptions = typeof opts.setSelectOptions === "function" ? opts.setSelectOptions : fallbackSetSelectOptions;
    var fmtMoney = typeof opts.fmtMoney === "function" ? opts.fmtMoney : safeText;
    var fmtDateTime = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : safeText;
    var getDeputadoAvatarLetters = typeof opts.getDeputadoAvatarLetters === "function" ? opts.getDeputadoAvatarLetters : fallbackAvatarLetters;
    var rerender = typeof opts.rerender === "function" ? opts.rerender : noop;
    var setPowerBiFilters = typeof opts.setPowerBiFilters === "function" ? opts.setPowerBiFilters : noop;
    var filters = opts.filters && typeof opts.filters === "object" ? opts.filters : {};
    var filterDefaults = opts.filterDefaults && typeof opts.filterDefaults === "object" ? opts.filterDefaults : {};

    clearNodeChildren(target);

    var model = buildPowerBiDashboardData(filteredRows);
    var sourceRows = safeArray(model.sourceRows);
    var filterOptions = model.filterOptions && typeof model.filterOptions === "object" ? model.filterOptions : { deputados: [], municipios: [], statuses: [] };
    var rows = safeArray(model.rows);
    var scopedAuditRows = safeArray(model.scopedAuditRows);
    var isExecutiveRole = !!model.isExecutiveRole;
    var summary = model.summary && typeof model.summary === "object" ? model.summary : { total: 0, valorTotal: 0, deputados: new Set(), municipios: new Set(), done: 0, attention: 0, latestUpdate: "" };
    var byDeputado = model.byDeputado && typeof model.byDeputado === "object" ? model.byDeputado : {};
    var byMunicipio = model.byMunicipio && typeof model.byMunicipio === "object" ? model.byMunicipio : {};
    var byStatus = model.byStatus && typeof model.byStatus === "object" ? model.byStatus : {};
    var byUser = model.byUser && typeof model.byUser === "object" ? model.byUser : {};

    var intro = document.createElement("div");
    intro.className = "beta-panel-card";
    var introTitle = document.createElement("h4");
    introTitle.textContent = "Dashboard executivo da operacao";
    var introText = document.createElement("p");
    introText.className = "muted small";
    introText.textContent = isExecutiveRole
      ? "Leitura executiva habilitada para APG, supervisao, Power BI e dono. Acoes sensiveis continuam sob governanca do PROGRAMADOR."
      : "Visao compartilhada em leitura. O detalhamento executivo e a governanca operacional continuam centralizados em APG, SUPERVISAO, POWERBI e PROGRAMADOR.";
    intro.appendChild(introTitle);
    intro.appendChild(introText);
    if (isExecutiveRole) {
      var executiveActions = document.createElement("div");
      executiveActions.className = "beta-history-filter-actions";
      executiveActions.style.marginTop = "10px";
      var exportBtn = document.createElement("button");
      exportBtn.className = "btn primary";
      exportBtn.type = "button";
      exportBtn.textContent = "Exportar relatorio executivo";
      exportBtn.addEventListener("click", function () {
        exportExecutiveDashboardReport(filteredRows).catch(function (err) {
          alert(extractApiError(err, "Falha ao exportar relatorio executivo."));
        });
      });
      executiveActions.appendChild(exportBtn);
      intro.appendChild(executiveActions);
    }
    target.appendChild(intro);

    var filterWrap = document.createElement("div");
    filterWrap.className = "filters beta-dashboard-filters";

    function appendSelectField(labelText, items, currentValue) {
      var field = document.createElement("div");
      field.className = "field";
      var label = document.createElement("label");
      label.textContent = labelText;
      var select = document.createElement("select");
      setSelectOptions(select, [{ label: "Todos", value: "" }].concat(safeArray(items).map(function (value) {
        return { label: value, value: value };
      })), currentValue || "");
      field.appendChild(label);
      field.appendChild(select);
      filterWrap.appendChild(field);
      return select;
    }

    var deputadoSelect = appendSelectField("Deputado", filterOptions.deputados, filters.deputado);
    var municipioSelect = appendSelectField("Municipio", filterOptions.municipios, filters.municipio);
    var statusSelect = appendSelectField("Status atual", filterOptions.statuses, filters.status);

    var searchField = document.createElement("div");
    searchField.className = "field grow";
    var searchLabel = document.createElement("label");
    searchLabel.textContent = "Busca no dashboard";
    var searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "emenda, deputado, municipio, acao, plano...";
    searchInput.value = filters.q || "";
    searchField.appendChild(searchLabel);
    searchField.appendChild(searchInput);
    filterWrap.appendChild(searchField);

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

    applyBtn.addEventListener("click", function () {
      setPowerBiFilters({
        deputado: String(deputadoSelect.value || ""),
        municipio: String(municipioSelect.value || ""),
        status: String(statusSelect.value || ""),
        q: String(searchInput.value || "").trim()
      });
      rerender();
    });

    clearBtn.addEventListener("click", function () {
      var nextFilters = {};
      Object.keys(filterDefaults).forEach(function (key) {
        nextFilters[key] = filterDefaults[key];
      });
      setPowerBiFilters(nextFilters);
      rerender();
    });

    searchInput.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      applyBtn.click();
    });

    target.appendChild(filterWrap);

    if (!isExecutiveRole) {
      var sharedViewNote = document.createElement("p");
      sharedViewNote.className = "muted small";
      sharedViewNote.style.marginTop = "8px";
      sharedViewNote.textContent = "Leitura compartilhada liberada. Controles executivos do dashboard ficam ativos para APG, SUPERVISAO, POWERBI e PROGRAMADOR.";
      target.appendChild(sharedViewNote);
    }

    var kpiGrid = document.createElement("div");
    kpiGrid.className = "beta-kpi-grid";

    function addKpi(label, value) {
      var card = document.createElement("div");
      card.className = "beta-kpi-card";
      var title = document.createElement("div");
      title.className = "beta-kpi-label";
      title.textContent = label;
      var content = document.createElement("div");
      content.className = "beta-kpi-value";
      content.textContent = value;
      card.appendChild(title);
      card.appendChild(content);
      kpiGrid.appendChild(card);
    }

    addKpi("Emendas no dashboard", String(summary.total || 0));
    addKpi("Valor atual total", "R$ " + fmtMoney(summary.valorTotal || 0));
    addKpi("Deputados monitorados", String(summary.deputados ? summary.deputados.size : 0));
    addKpi("Municipios cobertos", String(summary.municipios ? summary.municipios.size : 0));
    addKpi("Concluidas", String(summary.done || 0));
    addKpi("Em atencao", String(summary.attention || 0));
    target.appendChild(kpiGrid);

    var controlGrid = document.createElement("div");
    controlGrid.className = "beta-split-grid";

    function appendSummaryTable(titleText, headers, items, renderRow) {
      var card = document.createElement("div");
      card.className = "beta-panel-card table-wrap";
      var title = document.createElement("h4");
      title.textContent = titleText;
      card.appendChild(title);

      if (!items.length) {
        var empty = document.createElement("p");
        empty.className = "beta-empty";
        empty.textContent = "Sem dados para o filtro atual.";
        card.appendChild(empty);
        controlGrid.appendChild(card);
        return;
      }

      var table = document.createElement("table");
      table.className = "table";
      var thead = document.createElement("thead");
      var trH = document.createElement("tr");
      headers.forEach(function (label) {
        var th = document.createElement("th");
        th.textContent = label;
        trH.appendChild(th);
      });
      thead.appendChild(trH);
      table.appendChild(thead);

      var tbodyEl = document.createElement("tbody");
      items.forEach(function (item) {
        var tr = document.createElement("tr");
        renderRow(tr, item);
        tbodyEl.appendChild(tr);
      });
      table.appendChild(tbodyEl);
      card.appendChild(table);
      controlGrid.appendChild(card);
    }

    var statusRows = Object.keys(byStatus).map(function (key) {
      return { label: key, total: byStatus[key] || 0 };
    }).sort(function (a, b) {
      return b.total - a.total;
    });

    var municipios = Object.keys(byMunicipio).map(function (key) { return byMunicipio[key]; }).sort(function (a, b) {
      if (b.total !== a.total) return b.total - a.total;
      return b.valor - a.valor;
    }).slice(0, 10);

    var users = Object.keys(byUser).map(function (key) { return byUser[key]; }).sort(function (a, b) {
      if (b.total !== a.total) return b.total - a.total;
      return String(b.lastAt || "").localeCompare(String(a.lastAt || ""));
    }).slice(0, 8);

    appendSummaryTable("Controle por status", ["Status", "Total"], statusRows, function (tr, item) {
      [item.label, String(item.total)].forEach(function (value) {
        var td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
    });

    appendSummaryTable("Controle por municipio", ["Municipio", "Emendas", "Valor atual", "Atencao"], municipios, function (tr, item) {
      [item.label, String(item.total), "R$ " + fmtMoney(item.valor), String(item.attention)].forEach(function (value) {
        var td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
    });

    if (users.length) {
      appendSummaryTable("Atividade de usuarios", ["Usuario", "Perfil", "Eventos", "Ultima acao"], users, function (tr, item) {
        [item.label, item.perfil, String(item.total), item.lastAt ? (item.lastEvent + " | " + fmtDateTime(item.lastAt)) : "-"].forEach(function (value) {
          var td = document.createElement("td");
          td.textContent = value;
          tr.appendChild(td);
        });
      });
    }

    var controlCard = document.createElement("div");
    controlCard.className = "beta-panel-card";
    var controlTitle = document.createElement("h4");
    controlTitle.textContent = "Controle da base atual";
    var controlList = document.createElement("div");
    controlList.className = "beta-metric-stack";
    [
      "Ultima atualizacao: " + (summary.latestUpdate ? fmtDateTime(summary.latestUpdate) : "-"),
      "Filtro superior aplicado sobre " + String(sourceRows.length) + " emendas.",
      "Filtro interno do dashboard retornou " + String(rows.length) + " emendas.",
      "Todos podem visualizar o dashboard; a leitura executiva e a governanca continuam centralizadas em APG, SUPERVISAO, POWERBI e PROGRAMADOR."
    ].forEach(function (line) {
      var item = document.createElement("div");
      item.className = "beta-metric-line";
      item.textContent = line;
      controlList.appendChild(item);
    });
    controlCard.appendChild(controlTitle);
    controlCard.appendChild(controlList);
    controlGrid.appendChild(controlCard);
    target.appendChild(controlGrid);

    var deputyTitle = document.createElement("h4");
    deputyTitle.style.marginTop = "14px";
    deputyTitle.textContent = "Perfil de emendas por deputado";
    target.appendChild(deputyTitle);

    var deputyGrid = document.createElement("div");
    deputyGrid.className = "beta-deputy-grid";
    var deputados = Object.keys(byDeputado).map(function (key) { return byDeputado[key]; }).sort(function (a, b) {
      if (b.total !== a.total) return b.total - a.total;
      return b.valor - a.valor;
    }).slice(0, filters.deputado ? 12 : 8);

    if (!deputados.length) {
      var empty = document.createElement("p");
      empty.className = "beta-empty";
      empty.textContent = "Sem deputados para o filtro atual.";
      target.appendChild(empty);
      return;
    }

    deputados.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "beta-deputy-card";

      var head = document.createElement("div");
      head.className = "beta-deputy-head";

      var avatar = document.createElement(item.photoUrl ? "img" : "div");
      avatar.className = "beta-deputy-avatar";
      if (item.photoUrl) {
        avatar.src = item.photoUrl;
        avatar.alt = "Foto de " + item.label;
      } else {
        avatar.textContent = getDeputadoAvatarLetters(item.label);
        avatar.title = "Foto oficial pendente de fonte estruturada";
      }
      head.appendChild(avatar);

      var identity = document.createElement("div");
      var name = document.createElement("h5");
      name.textContent = item.label;
      var sub = document.createElement("p");
      sub.className = "muted small";
      sub.textContent = String(item.total) + " emendas | " + String(item.municipios.size) + " municipios";
      identity.appendChild(name);
      identity.appendChild(sub);
      head.appendChild(identity);
      card.appendChild(head);

      var metricGrid = document.createElement("div");
      metricGrid.className = "beta-deputy-metrics";
      [
        { label: "Valor atual", value: "R$ " + fmtMoney(item.valor) },
        { label: "Concluidas", value: String(item.done) },
        { label: "Em atencao", value: String(item.attention) },
        { label: "Eventos", value: String(item.auditEvents) }
      ].forEach(function (metric) {
        var box = document.createElement("div");
        box.className = "beta-deputy-metric";
        var label = document.createElement("div");
        label.className = "beta-kpi-label";
        label.textContent = metric.label;
        var value = document.createElement("div");
        value.className = "beta-kpi-value beta-kpi-value-sm";
        value.textContent = metric.value;
        box.appendChild(label);
        box.appendChild(value);
        metricGrid.appendChild(box);
      });
      card.appendChild(metricGrid);

      var dominantStatus = Object.keys(item.statusMap || {}).sort(function (a, b) {
        return (item.statusMap[b] || 0) - (item.statusMap[a] || 0);
      })[0] || "-";
      var diag = document.createElement("div");
      diag.className = "beta-metric-stack";
      [
        "Status dominante: " + dominantStatus,
        "Principais lugares: " + Array.from(item.municipios).slice(0, 3).join(", "),
        "Ultima atualizacao: " + (item.latestUpdate ? fmtDateTime(item.latestUpdate) : "-"),
        "Ultima acao registrada: " + (item.latestAction ? (fmtDateTime(item.latestAction) + " por " + (item.latestActor || "sistema")) : "-")
      ].forEach(function (line) {
        var row = document.createElement("div");
        row.className = "beta-metric-line";
        row.textContent = line;
        diag.appendChild(row);
      });
      card.appendChild(diag);

      deputyGrid.appendChild(card);
    });

    target.appendChild(deputyGrid);

    if (!scopedAuditRows.length) {
      var auditHint = document.createElement("p");
      auditHint.className = "muted small";
      auditHint.style.marginTop = "10px";
      auditHint.textContent = "Sem eventos auditados no recorte atual do dashboard.";
      target.appendChild(auditHint);
    }
  }

  root.betaPowerBiUtils = {
    renderBetaPowerBiPanel: renderBetaPowerBiPanel
  };
})(window);
