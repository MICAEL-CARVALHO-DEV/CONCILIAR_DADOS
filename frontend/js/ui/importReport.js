(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function safeArr(value) {
    return Array.isArray(value) ? value : [];
  }

  function text(v) {
    return v == null ? "" : String(v).trim();
  }

  function escape(v) {
    return String(v)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function buildExportSummaryBadgeHtml(report, escapeHtmlFn, exportScopeLabelFn, fmtDateTimeFn) {
    var escapeHtml = typeof escapeHtmlFn === "function" ? escapeHtmlFn : escape;
    var scopeLabel = typeof exportScopeLabelFn === "function" ? exportScopeLabelFn : function (value) {
      if (value == null) return "-";
      var normalized = String(value).trim();
      return normalized || "-";
    };
    var _fmtDateTime = typeof fmtDateTimeFn === "function" ? fmtDateTimeFn : function () { return "-"; };
    if (!report) {
      return '<div class="export-summary-banner muted small">MODO: -</div>';
    }

    var scope = scopeLabel(report.escopo || "ATUAIS");
    var file = report.arquivoNome ? escapeHtml(String(report.arquivoNome)) : "-";
    var qty = Number.isFinite(Number(report.quantidadeRegistros)) ? Number(report.quantidadeRegistros) : 0;
    var when = report.geradoEm ? _fmtDateTime(report.geradoEm) : "-";

    return ''
      + '<div class="export-summary-banner">'
      + '  <span class="export-summary-mode">MODO: ' + scope + '</span>'
      + '  <span class="muted small">Arquivo: ' + file + '</span>'
      + '  <span class="muted small">Registros: ' + String(qty) + '</span>'
      + '  <span class="muted small">Gerado em: ' + escapeHtml(String(when)) + '</span>'
      + '</div>';
  }

  function buildPlanilha1HtmlFromUtils(aoa, escapeHtmlFn, normalizeLooseTextFn) {
    if (!root.importReportUtils || typeof root.importReportUtils.buildPlanilha1Html !== "function") {
      return "";
    }

    return root.importReportUtils.buildPlanilha1Html(aoa, {
      escapeHtml: escapeHtmlFn,
      normalizeLooseText: normalizeLooseTextFn
    });
  }

  function safeBuildRecordPlanilha1Aoa(lastImportedPlanilha1Aoa, buildPlanilha1AoaFn, records) {
    if (safeArr(lastImportedPlanilha1Aoa).length) return lastImportedPlanilha1Aoa;
    if (typeof buildPlanilha1AoaFn === "function") return buildPlanilha1AoaFn(records || []);
    return [];
  }

  function renderImportDashboard(stateRecords, latestImportReport, lastImportedPlanilha1Aoa, importReportEl, fmtDateTimeFn, escapeHtmlFn, buildPlanilha1AoaFn, normalizeLooseTextFn, buildPlanilha1HtmlFn, getRecentChangesForPanelFn, wireImportReportTabsFn) {
    if (!importReportEl) return;
    importReportEl.classList.remove("hidden");

    var left = latestImportReport ? buildImportSummaryHtml(
      latestImportReport,
      stateRecords,
      lastImportedPlanilha1Aoa,
      escapeHtmlFn,
      fmtDateTimeFn,
      buildPlanilha1AoaFn,
      normalizeLooseTextFn,
      buildPlanilha1HtmlFn
    ) : buildImportSummaryPlaceholderHtml(
      stateRecords,
      lastImportedPlanilha1Aoa,
      escapeHtmlFn,
      fmtDateTimeFn,
      buildPlanilha1AoaFn,
      normalizeLooseTextFn,
      buildPlanilha1HtmlFn,
      getRecentChangesForPanelFn
    );

    var recent = typeof getRecentChangesForPanelFn === "function" ? getRecentChangesForPanelFn(10) : [];
    var right = buildRecentChangesPanelHtml(
      recent,
      escapeHtmlFn,
      fmtDateTimeFn,
      typeof describeEventForPanel === "function" ? describeEventForPanel : null,
      text
    );

    importReportEl.innerHTML = "";
    importReportEl.appendChild(document.createTextNode(""));
    importReportEl.innerHTML =
      buildExportSummaryBadgeHtml(latestImportReport) +
      "<div class=\"import-dashboard-grid\"><section class=\"import-dashboard-left\">" + left + "</section><section class=\"import-dashboard-right\">" + right + "</section></div>";

    if (latestImportReport && typeof wireImportReportTabsFn === "function") {
      wireImportReportTabsFn("planilha1", importReportEl);
    }
  }

  function buildImportSummaryPlaceholderHtml(stateRecords, lastImportedPlanilha1Aoa, escapeHtmlFn, fmtDateTimeFn, buildPlanilha1AoaFn, normalizeLooseTextFn, buildPlanilha1HtmlFn, getRecentChangesForPanelFn) {
    var escapeHtml = typeof escapeHtmlFn === "function" ? escapeHtmlFn : escape;
    var _fmtDateTime = typeof fmtDateTimeFn === "function" ? fmtDateTimeFn : function () { return "-"; };
    var allRecords = safeArr(stateRecords);
    var totalRegistros = allRecords.length;
    var totalEventos = allRecords.reduce(function (acc, rec) {
      return acc + ((rec && rec.eventos && rec.eventos.length) ? rec.eventos.length : 0);
    }, 0);
    var recent = typeof getRecentChangesForPanelFn === "function" ? getRecentChangesForPanelFn(1) : [];
    var last = safeArr(recent)[0] || null;

    var planilha1Aoa = safeBuildRecordPlanilha1Aoa(lastImportedPlanilha1Aoa, buildPlanilha1AoaFn, allRecords);
    var planilha1Html = buildPlanilha1HtmlFromUtils(planilha1Aoa, escapeHtml, normalizeLooseTextFn) ||
      (typeof buildPlanilha1HtmlFn === "function" ? buildPlanilha1HtmlFn(planilha1Aoa) : "");

    var lastAt = last && last.at ? _fmtDateTime(last.at) : "-";
    var lastBy = last && last.actor_user ? escapeHtml(last.actor_user) + " (" + escapeHtml(last.actor_role || "") + ")" : "-";

    return "" +
      '<h4>Resumo da base atual</h4>' +
      '<p class="muted small">Sem importacao nova nesta sessao. Os dados atuais continuam ativos.</p>' +
      '<div class="kv" style="margin-top:8px">' +
      '  <div class="k">Registros carregados</div><div class="v">' + String(totalRegistros) + '</div>' +
      '  <div class="k">Eventos no historico</div><div class="v">' + String(totalEventos) + '</div>' +
      '  <div class="k">Ultima alteracao</div><div class="v">' + lastAt + '</div>' +
      '  <div class="k">Responsavel da ultima alteracao</div><div class="v">' + lastBy + '</div>' +
      '</div>' +
      '<div style="margin-top:12px">' +
      '  <h4 style="margin-bottom:8px">Resumo por deputado (Planilha1)</h4>' +
      planilha1Html +
      '</div>';
  }

  function buildImportSummaryHtml(report, stateRecords, lastImportedPlanilha1Aoa, escapeHtmlFn, fmtDateTimeFn, buildPlanilha1AoaFn, normalizeLooseTextFn, buildPlanilha1HtmlFn) {
    var escapeHtml = typeof escapeHtmlFn === "function" ? escapeHtmlFn : escape;
    var _fmtDateTime = typeof fmtDateTimeFn === "function" ? fmtDateTimeFn : function () { return "-"; };

    var sheets = (report && Array.isArray(report.sheetNames) && report.sheetNames.length) ? report.sheetNames.join(", ") : "-";
    var fileName = report && report.fileName ? report.fileName : "-";

    var planilha1Aoa = safeBuildRecordPlanilha1Aoa(lastImportedPlanilha1Aoa, buildPlanilha1AoaFn, stateRecords);
    var planilha1Html = buildPlanilha1HtmlFromUtils(planilha1Aoa, escapeHtml, normalizeLooseTextFn) ||
      (typeof buildPlanilha1HtmlFn === "function" ? buildPlanilha1HtmlFn(planilha1Aoa) : "");

    return "" +
      "<h4>Resumo da importacao</h4>" +
      "<p class=\"muted small\">Arquivo: " + escapeHtml(fileName) + " | Abas lidas: " + escapeHtml(sheets) + "</p>" +
      "<div class=\"import-tabs\" role=\"tablist\" aria-label=\"Abas do relatorio de importacao\">" +
      "  <button type=\"button\" class=\"import-tab-btn active\" data-import-tab=\"resumo\" role=\"tab\" aria-selected=\"true\">Resumo da importacao</button>" +
      "  <button type=\"button\" class=\"import-tab-btn\" data-import-tab=\"planilha1\" role=\"tab\" aria-selected=\"false\">Planilha1 (Deputados)</button>" +
      "  <button type=\"button\" class=\"import-tab-btn\" data-import-tab=\"validacao\" role=\"tab\" aria-selected=\"false\">Validacao</button>" +
      "</div>" +
      "<div class=\"import-tab-panels\">" +
      "  <section class=\"import-tab-panel active entering\" data-import-panel=\"resumo\">" +
      "    <div class=\"kv\" style=\"margin-top:8px\">" +
      "      <div class=\"k\">Linhas lidas</div><div class=\"v\">" + String(report.totalRows || 0) + "</div>" +
      "      <div class=\"k\">Linhas validas</div><div class=\"v\">" + String(report.consideredRows || 0) + "</div>" +
      "      <div class=\"k\">Linhas ignoradas</div><div class=\"v\">" + String(report.skippedRows || 0) + "</div>" +
      "      <div class=\"k\">Novos registros</div><div class=\"v\">" + String(report.created || 0) + "</div>" +
      "      <div class=\"k\">Registros atualizados</div><div class=\"v\">" + String(report.updated || 0) + "</div>" +
      "      <div class=\"k\">Sem alteracao</div><div class=\"v\">" + String(report.unchanged || 0) + "</div>" +
      "      <div class=\"k\">Duplicidade por ID</div><div class=\"v\">" + String(report.duplicateById || 0) + "</div>" +
      "      <div class=\"k\">Duplicidade por chave ref</div><div class=\"v\">" + String(report.duplicateByRef || 0) + "</div>" +
      "      <div class=\"k\">Duplicidade dentro do arquivo</div><div class=\"v\">" + String(report.duplicateInFile || 0) + "</div>" +
      "      <div class=\"k\">Conflito ID x chave ref</div><div class=\"v\">" + String(report.conflictIdVsRef || 0) + "</div>" +
      "    </div>" +
      "  </section>" +
      "  <section class=\"import-tab-panel import-report-right\" data-import-panel=\"planilha1\">" +
      "    <h4 style=\"margin-bottom:8px\">Resumo por deputado (Planilha1)</h4>" +
      planilha1Html +
      "  </section>" +
      "  <section class=\"import-tab-panel\" data-import-panel=\"validacao\">" +
      buildImportValidationHtml(report.validation, escapeHtmlFn) +
      "  </section>" +
      "</div>";
  }

  function buildImportValidationHtml(validation, escapeHtmlFn) {
    var escapeHtml = typeof escapeHtmlFn === "function" ? escapeHtmlFn : escape;
    var v = validation || {};
    var recognized = Array.isArray(v.recognizedHeaders) ? v.recognizedHeaders : [];
    var unrecognized = Array.isArray(v.unrecognizedHeaders) ? v.unrecognizedHeaders : [];
    var duplicated = Array.isArray(v.duplicatedHeaders) ? v.duplicatedHeaders : [];
    var alerts = Array.isArray(v.alerts) ? v.alerts : [];
    var preview = Array.isArray(v.previewRows) ? v.previewRows : [];
    var types = v.detectedTypes || {};

    var html = "" +
      "<h4>Relatorio de validacao</h4>" +
      "<div class=\"kv\" style=\"margin-top:8px\">" +
      "  <div class=\"k\">Colunas reconhecidas</div><div class=\"v\">" + escapeHtml(recognized.join(", ") || "-") + "</div>" +
      "  <div class=\"k\">Colunas nao reconhecidas</div><div class=\"v\">" + escapeHtml(unrecognized.join(", ") || "-") + "</div>" +
      "  <div class=\"k\">Colunas duplicadas</div><div class=\"v\">" + escapeHtml(duplicated.join(", ") || "-") + "</div>" +
      "  <div class=\"k\">Tipos detectados</div><div class=\"v\">" + escapeHtml(JSON.stringify(types)) + "</div>" +
      "</div>";

    if (alerts.length) {
      html += "<div style=\"margin-top:8px\"><b>Alertas</b><ul>" + alerts.map(function (a) { return "<li>" + escapeHtml(a) + "</li>"; }).join("") + "</ul></div>";
    }

    if (preview.length) {
      html += "<div style=\"margin-top:8px\"><b>Preview (5 linhas)</b>";
      html += "<div class=\"table-wrap\"><table class=\"table\" style=\"min-width:720px\"><thead><tr><th>Aba</th><th>Linha</th><th>Dados</th></tr></thead><tbody>";
      preview.forEach(function (row) {
        html += "<tr><td>" + escapeHtml(row.aba || "-") + "</td><td>" + escapeHtml(String(row.linha || "-")) + "</td><td><code>" + escapeHtml(JSON.stringify(row.dados)) + "</code></td></tr>";
      });
      html += "</tbody></table></div></div>";
    }

    return html;
  }

  function buildRecentChangesPanelHtml(items, escapeHtmlFn, fmtDateTimeFn, describeEventForPanelFn, textFn) {
    var escapeHtml = typeof escapeHtmlFn === "function" ? escapeHtmlFn : escape;
    var toText = typeof textFn === "function" ? textFn : text;
    var fmt = typeof fmtDateTimeFn === "function" ? fmtDateTimeFn : function () { return "-"; };
    var describe = typeof describeEventForPanelFn === "function"
      ? describeEventForPanelFn
      : function (item) {
          return toText(item && item.type ? item.type : "Evento");
        };

    var safeItems = safeArr(items);
    if (!safeItems.length) {
      return "" +
        "<h4>Painel de alteracoes</h4>" +
        "<p class=\"muted small\">Sem alteracoes registradas ainda.</p>";
    }

    var html = "" +
      "<h4>Painel de alteracoes</h4>" +
      "<p class=\"muted small\">Ultimos " + String(safeItems.length) + " eventos registrados (inclui sessoes anteriores).</p>" +
      "<div class=\"recent-list\">";

    safeItems.forEach(function (item) {
      html += "" +
        "<article class=\"recent-item\">" +
        "  <div class=\"recent-item-top\">" +
        "    <strong>" + escapeHtml(item.actor_user) + "</strong>" +
        "    <span class=\"muted small\">" + escapeHtml(item.actor_role) + " | " + fmt(item.at) + "</span>" +
        "  </div>" +
        "  <div class=\"recent-item-action\">" + escapeHtml(describe(item)) + "</div>" +
        "  <div class=\"recent-item-target\"><code>" + escapeHtml(item.id) + "</code> | " + escapeHtml(item.identificacao) + "</div>" +
        (item.note ? ("<div class=\"recent-item-note muted small\">Obs: " + escapeHtml(item.note) + "</div>") : "") +
        "</article>";
    });

    html += "</div>";
    return html;
  }

  function getRecentChangesForPanel(stateRecords, getEventsSortedFn, toIntFn, limit) {
    var records = safeArr(stateRecords);
    var out = [];
    var getEventsSorted = typeof getEventsSortedFn === "function" ? getEventsSortedFn : function (rec) {
      return (rec && Array.isArray(rec.eventos)) ? rec.eventos : [];
    };
    var toInt = typeof toIntFn === "function" ? toIntFn : function (v) {
      var n = parseInt(v, 10);
      return Number.isFinite(n) ? n : 0;
    };
    var t = typeof text === "function" ? text : function (v) { return String(v || ""); };

    records.forEach(function (rec) {
      getEventsSorted(rec).forEach(function (ev) {
        if (!ev || !ev.at) return;
        var ts = new Date(ev.at).getTime();
        if (!Number.isFinite(ts) || ts <= 0) return;

        out.push({
          at: ev.at,
          atTs: ts,
          actor_user: t(ev.actor_user) || "sistema",
          actor_role: t(ev.actor_role) || "-",
          type: t(ev.type) || "EVENTO",
          note: t(ev.note),
          id: t(rec.id) || "-",
          identificacao: t(rec.identificacao) || "-",
          from: ev.from,
          to: ev.to,
          field: ev.field
        });
      });
    });

    out.sort(function (a, b) {
      return b.atTs - a.atTs;
    });

    var max = Math.max(1, toInt(limit) || 10);
    return out.slice(0, max);
  }

  function describeEventForPanel(item, textFn) {
    var toText = typeof textFn === "function" ? textFn : text;

    if (!item) return "Alteracao registrada";
    if (item.type === "OFFICIAL_STATUS") return "Status oficial legado: " + toText(item.from || "-") + " -> " + toText(item.to || "-");
    if (item.type === "MARK_STATUS") return "Marcacao de status: " + toText(item.to || "-");
    if (item.type === "EDIT_FIELD") return "Edicao de campo: " + toText(item.field || "-");
    if (item.type === "NOTE") return "Nota adicionada";
    if (item.type === "IMPORT") return "Importacao/atualizacao de registro";
    return toText(item.type || "Evento");
  }

  function wireImportReportTabs(importReportEl, defaultTab) {
    if (!importReportEl) return;
    var tabButtons = Array.from(importReportEl.querySelectorAll("[data-import-tab]"));
    var tabPanels = Array.from(importReportEl.querySelectorAll("[data-import-panel]") );
    if (!tabButtons.length || !tabPanels.length) return;

    function activateTab(tabName) {
      tabButtons.forEach(function (btn) {
        var active = btn.getAttribute("data-import-tab") === tabName;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
      });

      tabPanels.forEach(function (panel) {
        var active = panel.getAttribute("data-import-panel") === tabName;
        panel.classList.toggle("active", active);
        if (active) {
          panel.classList.remove("entering");
          void panel.offsetWidth;
          panel.classList.add("entering");
        }
      });
    }

    tabButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        activateTab(btn.getAttribute("data-import-tab"));
      });
    });

    var first = defaultTab || (tabButtons[0] && tabButtons[0].getAttribute("data-import-tab"));
    if (first) activateTab(first);
  }

  root.importReportUtils = root.importReportUtils || {};
  root.importReportUtils.renderImportDashboard = renderImportDashboard;
  root.importReportUtils.buildExportSummaryBadgeHtml = buildExportSummaryBadgeHtml;
  root.importReportUtils.buildImportSummaryPlaceholderHtml = buildImportSummaryPlaceholderHtml;
  root.importReportUtils.buildImportSummaryHtml = buildImportSummaryHtml;
  root.importReportUtils.buildImportValidationHtml = buildImportValidationHtml;
  root.importReportUtils.buildRecentChangesPanelHtml = buildRecentChangesPanelHtml;
  root.importReportUtils.getRecentChangesForPanel = getRecentChangesForPanel;
  root.importReportUtils.describeEventForPanel = describeEventForPanel;
  root.importReportUtils.wireImportReportTabs = wireImportReportTabs;
})(window);
