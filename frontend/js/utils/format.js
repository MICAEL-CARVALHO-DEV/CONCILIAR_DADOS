(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function asText(v) {
    if (v == null) return "";
    return String(v).trim();
  }

  function text(v) {
    return asText(v);
  }

  function toInt(v) {
    var n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  }

  function toNumber(v) {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    var s = asText(v).replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(/,/g, ".").replace(/[^\d.-]/g, "");
    var n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  function toNumberOrNull(v) {
    if (v == null) return null;
    var txt = asText(v);
    if (txt === "") return null;
    var n = toNumber(txt);
    return Number.isFinite(n) ? n : null;
  }

  function normalizeDraftFieldValue(value, type) {
    if (type === "money") return toNumber(value);
    if (type === "number") return toInt(value);
    return asText(value);
  }

  function formatDraftInputValue(value, type) {
    if (type === "money") return fmtMoney(value || 0);
    if (type === "number") return String(toInt(value));
    return String(value == null ? "" : value);
  }

  function parseDraftFieldValue(raw, type) {
    var v = String(raw == null ? "" : raw);
    if (type === "money") return toNumber(v);
    if (type === "number") return toInt(v);
    return v.trim();
  }

  function fmtMoney(n) {
    var x = toNumber(n);
    return x.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtDateTime(iso) {
    try {
      return new Date(iso).toLocaleString("pt-BR");
    } catch (_err) {
      return String(iso || "");
    }
  }

  function isoNow() {
    return new Date().toISOString();
  }

  function dateStamp() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    var hh = String(d.getHours()).padStart(2, "0");
    var mi = String(d.getMinutes()).padStart(2, "0");
    return yyyy + mm + dd + "_" + hh + mi;
  }

  function currentYear() {
    return new Date().getFullYear();
  }

  root.formatUtils = {
    asText: asText,
    text: text,
    toInt: toInt,
    toNumber: toNumber,
    toNumberOrNull: toNumberOrNull,
    normalizeDraftFieldValue: normalizeDraftFieldValue,
    formatDraftInputValue: formatDraftInputValue,
    parseDraftFieldValue: parseDraftFieldValue,
    fmtMoney: fmtMoney,
    fmtDateTime: fmtDateTime,
    isoNow: isoNow,
    dateStamp: dateStamp,
    currentYear: currentYear
  };
})(window);
