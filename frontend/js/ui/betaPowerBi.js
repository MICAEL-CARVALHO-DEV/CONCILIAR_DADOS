(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};
  var POWERBI_EXPANDED_STORAGE_KEY = "SEC_POWERBI_EXPANDED";

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

  function toFiniteNumber(value, fallbackValue) {
    var fallback = Number.isFinite(fallbackValue) ? fallbackValue : 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function createSvgNode(tagName) {
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
  }

  function renderMunicipioMapCard(target, mapModel, options) {
    var opts = options || {};
    var setPowerBiFilters = typeof opts.setPowerBiFilters === "function" ? opts.setPowerBiFilters : noop;
    var rerender = typeof opts.rerender === "function" ? opts.rerender : noop;
    var fmtMoney = typeof opts.fmtMoney === "function" ? opts.fmtMoney : safeText;
    var filters = opts.filters && typeof opts.filters === "object" ? opts.filters : {};

    var model = mapModel && typeof mapModel === "object" ? mapModel : {};
    var points = safeArray(model.points);
    if (!points.length) {
      var emptyCard = document.createElement("section");
      emptyCard.className = "beta-panel-card beta-map-card";
      var emptyTitle = document.createElement("h4");
      emptyTitle.textContent = "Mapa interativo de emendas";
      var emptyText = document.createElement("p");
      emptyText.className = "beta-empty";
      emptyText.textContent = "Sem municipios suficientes no filtro atual para montar o mapa.";
      emptyCard.appendChild(emptyTitle);
      emptyCard.appendChild(emptyText);
      target.appendChild(emptyCard);
      return;
    }

    var bounds = model.bounds && typeof model.bounds === "object" ? model.bounds : {};
    var lonMin = toFiniteNumber(bounds.lonMin, -46);
    var lonMax = toFiniteNumber(bounds.lonMax, -36);
    var latMin = toFiniteNumber(bounds.latMin, -19);
    var latMax = toFiniteNumber(bounds.latMax, -7);
    if (lonMax <= lonMin) lonMax = lonMin + 1;
    if (latMax <= latMin) latMax = latMin + 1;

    var mapCard = document.createElement("section");
    mapCard.className = "beta-panel-card beta-map-card";
    var mapTitle = document.createElement("h4");
    mapTitle.textContent = "Mapa interativo de emendas";
    mapCard.appendChild(mapTitle);

    var mapHint = document.createElement("p");
    mapHint.className = "muted small";
    mapHint.textContent = model.usingRealCoordinates
      ? "Distribuicao territorial por municipio (coordenadas geograficas detectadas na base)."
      : "Distribuicao operacional por municipio (posicoes aproximadas por falta de coordenadas explicitas).";
    mapCard.appendChild(mapHint);

    var mapLayout = document.createElement("div");
    mapLayout.className = "beta-map-layout";

    var stage = document.createElement("div");
    stage.className = "beta-map-stage";
    var svg = createSvgNode("svg");
    svg.setAttribute("class", "beta-map-svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Mapa interativo com distribuicao de emendas por municipio");

    var defs = createSvgNode("defs");
    var gridPattern = createSvgNode("pattern");
    gridPattern.setAttribute("id", "betaMapGrid");
    gridPattern.setAttribute("width", "10");
    gridPattern.setAttribute("height", "10");
    gridPattern.setAttribute("patternUnits", "userSpaceOnUse");
    var gridLineH = createSvgNode("path");
    gridLineH.setAttribute("d", "M 10 0 L 0 0 0 10");
    gridLineH.setAttribute("fill", "none");
    gridLineH.setAttribute("stroke", "rgba(23,64,139,0.16)");
    gridLineH.setAttribute("stroke-width", "0.4");
    gridPattern.appendChild(gridLineH);
    defs.appendChild(gridPattern);
    svg.appendChild(defs);

    var baseRect = createSvgNode("rect");
    baseRect.setAttribute("x", "0");
    baseRect.setAttribute("y", "0");
    baseRect.setAttribute("width", "100");
    baseRect.setAttribute("height", "100");
    baseRect.setAttribute("fill", "url(#betaMapGrid)");
    svg.appendChild(baseRect);

    var tooltip = document.createElement("div");
    tooltip.className = "beta-map-tooltip hidden";
    stage.appendChild(svg);
    stage.appendChild(tooltip);

    var maxTotal = points.reduce(function (acc, item) {
      return Math.max(acc, toFiniteNumber(item.total, 0));
    }, 1);

    function setTooltip(point, px, py) {
      tooltip.innerHTML = ""
        + "<strong>" + safeText(point.label) + "</strong>"
        + "<span>Emendas: " + String(point.total || 0) + "</span>"
        + "<span>Valor: R$ " + fmtMoney(point.valor || 0) + "</span>"
        + "<span>Atencao: " + String(point.attention || 0) + "</span>";
      tooltip.style.left = clamp(px + 14, 12, stage.clientWidth - 250) + "px";
      tooltip.style.top = clamp(py - 16, 8, stage.clientHeight - 110) + "px";
      tooltip.classList.remove("hidden");
    }

    function hideTooltip() {
      tooltip.classList.add("hidden");
    }

    points.forEach(function (point) {
      var normalizedX = (toFiniteNumber(point.lon, lonMin) - lonMin) / (lonMax - lonMin);
      var normalizedY = (latMax - toFiniteNumber(point.lat, latMin)) / (latMax - latMin);
      var x = clamp((normalizedX * 88) + 6, 4, 96);
      var y = clamp((normalizedY * 84) + 8, 4, 96);
      var radius = clamp(2.8 + ((toFiniteNumber(point.total, 0) / maxTotal) * 5.8), 2.8, 8.8);
      var isActive = safeText(filters.municipio) && safeText(filters.municipio) === safeText(point.label);

      var marker = createSvgNode("circle");
      marker.setAttribute("cx", String(x));
      marker.setAttribute("cy", String(y));
      marker.setAttribute("r", String(radius));
      marker.setAttribute("class", "beta-map-point" + (isActive ? " is-active" : ""));
      marker.setAttribute("tabindex", "0");
      marker.setAttribute("role", "button");
      marker.setAttribute("aria-label", "Filtrar municipio " + safeText(point.label));

      marker.addEventListener("mouseenter", function (event) {
        setTooltip(point, event.offsetX || (x * stage.clientWidth / 100), event.offsetY || (y * stage.clientHeight / 100));
      });
      marker.addEventListener("mousemove", function (event) {
        setTooltip(point, event.offsetX || (x * stage.clientWidth / 100), event.offsetY || (y * stage.clientHeight / 100));
      });
      marker.addEventListener("mouseleave", hideTooltip);
      marker.addEventListener("blur", hideTooltip);
      marker.addEventListener("click", function () {
        setPowerBiFilters({
          deputado: safeText(filters.deputado || ""),
          municipio: safeText(point.label),
          status: safeText(filters.status || ""),
          objetivo_epi: safeText(filters.objetivo_epi || ""),
          q: safeText(filters.q || "")
        });
        rerender();
      });
      marker.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        marker.click();
      });

      svg.appendChild(marker);
    });

    var side = document.createElement("aside");
    side.className = "beta-map-side";
    var sideTitle = document.createElement("strong");
    sideTitle.className = "beta-map-side-title";
    sideTitle.textContent = "Top municipios";
    side.appendChild(sideTitle);

    var sideList = document.createElement("div");
    sideList.className = "beta-map-list";
    points.slice().sort(function (a, b) {
      if (toFiniteNumber(b.total, 0) !== toFiniteNumber(a.total, 0)) return toFiniteNumber(b.total, 0) - toFiniteNumber(a.total, 0);
      return toFiniteNumber(b.valor, 0) - toFiniteNumber(a.valor, 0);
    }).slice(0, 10).forEach(function (point) {
      var rowBtn = document.createElement("button");
      rowBtn.type = "button";
      rowBtn.className = "beta-map-list-item" + (safeText(filters.municipio) === safeText(point.label) ? " is-active" : "");
      rowBtn.innerHTML = ""
        + "<span>" + safeText(point.label) + "</span>"
        + "<small>" + String(point.total || 0) + " emendas</small>";
      rowBtn.addEventListener("click", function () {
        setPowerBiFilters({
          deputado: safeText(filters.deputado || ""),
          municipio: safeText(point.label),
          status: safeText(filters.status || ""),
          objetivo_epi: safeText(filters.objetivo_epi || ""),
          q: safeText(filters.q || "")
        });
        rerender();
      });
      sideList.appendChild(rowBtn);
    });
    side.appendChild(sideList);

    var clearMunicipioBtn = document.createElement("button");
    clearMunicipioBtn.type = "button";
    clearMunicipioBtn.className = "btn";
    clearMunicipioBtn.textContent = "Limpar municipio";
    clearMunicipioBtn.addEventListener("click", function () {
      setPowerBiFilters({
        deputado: safeText(filters.deputado || ""),
        municipio: "",
        status: safeText(filters.status || ""),
        objetivo_epi: safeText(filters.objetivo_epi || ""),
        q: safeText(filters.q || "")
      });
      rerender();
    });
    side.appendChild(clearMunicipioBtn);

    mapLayout.appendChild(stage);
    mapLayout.appendChild(side);
    mapCard.appendChild(mapLayout);
    target.appendChild(mapCard);
  }

  function readPowerBiExpandedMode() {
    try {
      if (!global || !global.localStorage) return false;
      return global.localStorage.getItem(POWERBI_EXPANDED_STORAGE_KEY) === "1";
    } catch (_err) {
      return false;
    }
  }

  function savePowerBiExpandedMode(nextValue) {
    try {
      if (!global || !global.localStorage) return;
      global.localStorage.setItem(POWERBI_EXPANDED_STORAGE_KEY, nextValue ? "1" : "0");
    } catch (_err) {
      // no-op
    }
  }

  function renderBetaPowerBiPanel(target, filteredRows, options) {
    var opts = options || {};
    var clearNodeChildren = typeof opts.clearNodeChildren === "function" ? opts.clearNodeChildren : clearNode;
    var buildPowerBiDashboardData = typeof opts.buildPowerBiDashboardData === "function" ? opts.buildPowerBiDashboardData : function () { return {}; };
    var exportExecutiveDashboardReport = typeof opts.exportExecutiveDashboardReport === "function" ? opts.exportExecutiveDashboardReport : function () { return Promise.resolve(false); };
    var exportPowerBiLeanReport = typeof opts.exportPowerBiLeanReport === "function" ? opts.exportPowerBiLeanReport : function () { return Promise.resolve(false); };
    var extractApiError = typeof opts.extractApiError === "function" ? opts.extractApiError : function (_err, fallback) { return String(fallback || "Falha ao exportar relatorio executivo."); };
    var setSelectOptions = typeof opts.setSelectOptions === "function" ? opts.setSelectOptions : fallbackSetSelectOptions;
    var fmtMoney = typeof opts.fmtMoney === "function" ? opts.fmtMoney : safeText;
    var fmtDateTime = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : safeText;
    var getDeputadoAvatarLetters = typeof opts.getDeputadoAvatarLetters === "function" ? opts.getDeputadoAvatarLetters : fallbackAvatarLetters;
    var rerender = typeof opts.rerender === "function" ? opts.rerender : noop;
    var setPowerBiFilters = typeof opts.setPowerBiFilters === "function" ? opts.setPowerBiFilters : noop;
    var filters = opts.filters && typeof opts.filters === "object" ? opts.filters : {};
    var filterDefaults = opts.filterDefaults && typeof opts.filterDefaults === "object" ? opts.filterDefaults : {};
    var isExpandedMode = readPowerBiExpandedMode();

    if (target && target.classList) {
      target.classList.add("beta-powerbi-panel");
      target.classList.toggle("beta-powerbi-panel-expanded", isExpandedMode);
    }

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
    var byObjetivo = model.byObjetivo && typeof model.byObjetivo === "object" ? model.byObjetivo : {};
    var mapModel = model.mapModel && typeof model.mapModel === "object" ? model.mapModel : { points: [] };
    var deputadoCountPolicy = model.deputadoCountPolicy && typeof model.deputadoCountPolicy === "object"
      ? model.deputadoCountPolicy
      : {
          origem_oficial: "BASE_ATUAL",
          escopo_ajuste: "GLOBAL",
          perfil_ajuste: "PROGRAMADOR",
          observacao: "Contagem oficial usa emendas atuais da base consolidada; todos os usuarios autenticados podem visualizar e apenas PROGRAMADOR pode ajustar globalmente com auditoria."
        };

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
    var introBadges = document.createElement("div");
    introBadges.className = "beta-head-actions beta-inline-badges";
    [
      "Modo leitura",
      "Fonte principal: Objetivo EPI",
      "Reflexo executivo da operacao",
      "Contagem deputado: " + safeText(deputadoCountPolicy.origem_oficial || "BASE_ATUAL")
    ].forEach(function (labelText) {
      var badge = document.createElement("span");
      badge.className = "beta-source-badge";
      badge.textContent = labelText;
      introBadges.appendChild(badge);
    });
    if (isExpandedMode) {
      var expandedBadge = document.createElement("span");
      expandedBadge.className = "beta-source-badge";
      expandedBadge.textContent = "Layout expandido (desktop)";
      introBadges.appendChild(expandedBadge);
    }
    intro.appendChild(introBadges);
    var executiveActions = document.createElement("div");
    executiveActions.className = "beta-history-filter-actions beta-powerbi-layout-actions";
    executiveActions.style.marginTop = "10px";
    var layoutBtn = document.createElement("button");
    layoutBtn.className = "btn";
    layoutBtn.type = "button";
    layoutBtn.textContent = isExpandedMode ? "Modo compacto" : "Expandir leitura";
    layoutBtn.addEventListener("click", function () {
      savePowerBiExpandedMode(!isExpandedMode);
      rerender();
    });
    executiveActions.appendChild(layoutBtn);
    if (isExecutiveRole) {
      var exportLeanBtn = document.createElement("button");
      exportLeanBtn.className = "btn primary";
      exportLeanBtn.type = "button";
      exportLeanBtn.textContent = "Exportar Power BI (enxuto)";
      exportLeanBtn.addEventListener("click", function () {
        exportPowerBiLeanReport(filteredRows).catch(function (err) {
          alert(extractApiError(err, "Falha ao exportar base enxuta do Power BI."));
        });
      });
      executiveActions.appendChild(exportLeanBtn);

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
    }
    intro.appendChild(executiveActions);
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

    var objetivoField = document.createElement("div");
    objetivoField.className = "field";
    var objetivoLabel = document.createElement("label");
    objetivoLabel.textContent = "Objetivo EPI";
    var objetivoInput = document.createElement("input");
    objetivoInput.type = "text";
    objetivoInput.placeholder = "Filtrar por objetivo principal";
    objetivoInput.value = filters.objetivo_epi || "";
    objetivoField.appendChild(objetivoLabel);
    objetivoField.appendChild(objetivoInput);
    filterWrap.appendChild(objetivoField);

    var searchField = document.createElement("div");
    searchField.className = "field grow";
    var searchLabel = document.createElement("label");
    searchLabel.textContent = "Busca complementar";
    var searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "emenda, objetivo epi, deputado, municipio, acao...";
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
        objetivo_epi: String(objetivoInput.value || "").trim(),
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
    objetivoInput.addEventListener("keydown", function (event) {
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
    kpiGrid.className = "beta-kpi-grid beta-powerbi-kpi-grid" + (isExpandedMode ? " is-expanded" : "");

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
    addKpi("Objetivos ativos", String(summary.objetivos ? summary.objetivos.size : 0));
    addKpi("Concluidas", String(summary.done || 0));
    addKpi("Em atencao", String(summary.attention || 0));
    target.appendChild(kpiGrid);

    var controlGrid = document.createElement("div");
    controlGrid.className = "beta-split-grid beta-powerbi-control-grid" + (isExpandedMode ? " is-expanded" : "");

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
    }).slice(0, isExpandedMode ? 14 : 10);

    var objetivos = Object.keys(byObjetivo).map(function (key) { return byObjetivo[key]; }).sort(function (a, b) {
      if (b.total !== a.total) return b.total - a.total;
      return b.valor - a.valor;
    }).slice(0, isExpandedMode ? 14 : 10);

    var users = Object.keys(byUser).map(function (key) { return byUser[key]; }).sort(function (a, b) {
      if (b.total !== a.total) return b.total - a.total;
      return String(b.lastAt || "").localeCompare(String(a.lastAt || ""));
    }).slice(0, isExpandedMode ? 12 : 8);

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

    appendSummaryTable("Controle por Objetivo EPI", ["Objetivo EPI", "Emendas", "Valor atual", "Atencao"], objetivos, function (tr, item) {
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
      "Objetivos EPI ativos no recorte: " + String(summary.objetivos ? summary.objetivos.size : 0) + ".",
      "Contagem oficial de deputado: " + safeText(deputadoCountPolicy.origem_oficial || "BASE_ATUAL") + ".",
      "Ajuste manual de contagem: escopo " + safeText(deputadoCountPolicy.escopo_ajuste || "GLOBAL") + " por " + safeText(deputadoCountPolicy.perfil_ajuste || "PROGRAMADOR") + ".",
      safeText(deputadoCountPolicy.observacao || ""),
      "Objetivo EPI alimenta o recorte principal do dashboard e orienta a leitura executiva.",
      "Todos podem visualizar o dashboard; alteracoes continuam na operacao e na governanca."
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

    renderMunicipioMapCard(target, mapModel, {
      setPowerBiFilters: setPowerBiFilters,
      rerender: rerender,
      fmtMoney: fmtMoney,
      filters: filters
    });

    var deputyTitle = document.createElement("h4");
    deputyTitle.style.marginTop = "14px";
    deputyTitle.textContent = "Perfil de emendas por deputado";
    target.appendChild(deputyTitle);

    var deputyGrid = document.createElement("div");
    deputyGrid.className = "beta-deputy-grid beta-powerbi-deputy-grid" + (isExpandedMode ? " is-expanded" : "");
    var deputados = Object.keys(byDeputado).map(function (key) { return byDeputado[key]; }).sort(function (a, b) {
      if (b.total !== a.total) return b.total - a.total;
      return b.valor - a.valor;
    }).slice(0, filters.deputado ? (isExpandedMode ? 18 : 12) : (isExpandedMode ? 14 : 8));

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
