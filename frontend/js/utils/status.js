(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function normalizeStatus(input, statuses, normalizeFn) {
    var normalizeText = typeof normalizeFn === "function" ? normalizeFn : normalizeFallback;
    var cleaned = normalizeText(input);
    if (!cleaned) return "Recebido";

    var list = Array.isArray(statuses) ? statuses : [];
    if (!list.length) {
      list = ["Recebido", "Em analise", "Pendente", "Aguardando execucao", "Em execucao", "Aprovado", "Concluido", "Cancelado"];
    }

    for (var i = 0; i < list.length; i += 1) {
      if (normalizeText(list[i]) === cleaned) {
        return list[i];
      }
    }
    return "Recebido";
  }

  function statusColor(status) {
    if (status === "Concluido") return "#2ecc71";
    if (status === "Cancelado") return "#ff4f6d";
    if (status === "Pendente") return "#f1c40f";
    if (status === "Aguardando execucao") return "#f39c12";
    if (status === "Em execucao") return "#3498db";
    if (status === "Em analise") return "#4f8cff";
    if (status === "Aprovado") return "#9b59b6";
    return "#95a5a6";
  }

  function statusClass(status, normalizeFn) {
    var norm = typeof normalizeFn === "function" ? normalizeFn(status) : normalizeFallback(status);
    if (norm.indexOf("concl") >= 0) return "st-ok";
    if (norm.indexOf("cancel") >= 0) return "st-bad";
    if (norm.indexOf("pend") >= 0 || norm.indexOf("aguard") >= 0) return "st-warn";
    if (norm.indexOf("exec") >= 0 || norm.indexOf("anal") >= 0 || norm.indexOf("apro") >= 0 || norm.indexOf("rece") >= 0) return "st-mid";
    return "st-none";
  }

  function renderStatus(status, statusColorFn, escapeHtmlFn) {
    var color = typeof statusColorFn === "function" ? statusColorFn(status) : statusColor(status);
    var safeStatus = typeof escapeHtmlFn === "function" ? escapeHtmlFn(status) : String(status || "");
    return "<span class=\"badge\"><span class=\"dot\" style=\"background:" + color + "\"></span>" + safeStatus + "</span>";
  }

  function quickHashString(input) {
    var hash = 2166136261;
    var str = String(input || "");
    for (var i = 0; i < str.length; i += 1) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function normalizeFallback(value) {
    return String(value == null ? "" : value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  root.statusUtils = {
    normalizeStatus: normalizeStatus,
    statusColor: statusColor,
    statusClass: statusClass,
    renderStatus: renderStatus,
    quickHashString: quickHashString
  };
})(window);
