// =============================================================
// formatters.js — UTILITÁRIOS DE FORMATAÇÃO GLOBAIS
// Dono: Antigravity (frontend/js/utils/)
// Responsabilidade: Centralizar formatação de moeda, data/hora e texto
//   para evitar duplicidade entre módulos.
// Uso: SECFrontend.formatters.fmtMoney(valor)
//       SECFrontend.formatters.fmtDateTime(isoString)
//       SECFrontend.formatters.fmtDate(isoString)
// Nao depende de: app.js, DOM, estado global
// =============================================================
(function (global) {
  "use strict";
  var root = global.SECFrontend = global.SECFrontend || {};

  // --- Moeda ---
  var _brlFormatter = null;
  function getBrlFormatter() {
    if (_brlFormatter) return _brlFormatter;
    try {
      _brlFormatter = new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (_e) {
      _brlFormatter = null;
    }
    return _brlFormatter;
  }

  function fmtMoney(value) {
    var n = typeof value === "number" ? value : Number(value);
    if (!isFinite(n)) return "—";
    var fmt = getBrlFormatter();
    if (fmt) return fmt.format(n);
    // Fallback manual
    return n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // --- Data e Hora ---
  var _dtFormatter = null;
  var _dateFormatter = null;

  function getDateTimeFormatter() {
    if (_dtFormatter) return _dtFormatter;
    try {
      _dtFormatter = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    } catch (_e) { _dtFormatter = null; }
    return _dtFormatter;
  }

  function getDateFormatter() {
    if (_dateFormatter) return _dateFormatter;
    try {
      _dateFormatter = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric"
      });
    } catch (_e) { _dateFormatter = null; }
    return _dateFormatter;
  }

  function fmtDateTime(isoString) {
    if (!isoString) return "—";
    try {
      var d = new Date(String(isoString));
      if (isNaN(d.getTime())) return String(isoString);
      var fmt = getDateTimeFormatter();
      return fmt ? fmt.format(d) : d.toLocaleString("pt-BR");
    } catch (_e) {
      return String(isoString);
    }
  }

  function fmtDate(isoString) {
    if (!isoString) return "—";
    try {
      var d = new Date(String(isoString));
      if (isNaN(d.getTime())) return String(isoString);
      var fmt = getDateFormatter();
      return fmt ? fmt.format(d) : d.toLocaleDateString("pt-BR");
    } catch (_e) {
      return String(isoString);
    }
  }

  // --- Texto ---
  function truncate(text, maxLen) {
    var s = String(text || "").trim();
    var limit = typeof maxLen === "number" ? maxLen : 80;
    return s.length > limit ? s.slice(0, limit) + "…" : s;
  }

  function normalizeLooseText(text) {
    return String(text || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().trim();
  }

  root.formatters = {
    fmtMoney: fmtMoney,
    fmtDateTime: fmtDateTime,
    fmtDate: fmtDate,
    truncate: truncate,
    normalizeLooseText: normalizeLooseText
  };
})(window);
