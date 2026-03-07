(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function textValue(value) {
    if (value == null) return "";
    return String(value);
  }

  function safeNormalizeLoose(value, normalizeLooseTextFn) {
    if (typeof normalizeLooseTextFn === "function") return normalizeLooseTextFn(value);
    return textValue(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
  }

  function buildPlanilha1Html(aoa, options) {
    var dep = options || {};
    var escapeHtmlFn = typeof dep.escapeHtml === "function" ? dep.escapeHtml : function (v) {
      return String(v)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    };
    var normalizeLooseFn = typeof dep.normalizeLooseText === "function" ? dep.normalizeLooseText : null;

    if (!Array.isArray(aoa) || aoa.length === 0) {
      return "<p class=\"muted small\">Sem dados para resumo por deputado.</p>";
    }

    var html = "<div class=\"table-wrap\"><table class=\"table\" style=\"min-width:420px\"><thead><tr><th>" + escapeHtmlFn(String(aoa[0][0] || "Rotulos de Linha")) + "</th><th>" + escapeHtmlFn(String(aoa[0][1] || "Contagem")) + "</th></tr></thead><tbody>";

    for (var i = 1; i < aoa.length; i += 1) {
      var row = aoa[i] || [];
      var label = row[0] == null ? "" : String(row[0]);
      var val = row[1] == null ? "" : String(row[1]);
      var isTotal = safeNormalizeLoose(label, normalizeLooseFn) === "total geral";
      html += "<tr" + (isTotal ? " style=\"font-weight:700\"" : "") + "><td>" + escapeHtmlFn(label) + "</td><td>" + escapeHtmlFn(val) + "</td></tr>";
    }

    html += "</tbody></table></div>";
    return html;
  }

  root.importReportUtils = root.importReportUtils || {};
  root.importReportUtils.buildPlanilha1Html = buildPlanilha1Html;
})(window);
