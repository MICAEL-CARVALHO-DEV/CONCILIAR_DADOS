(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function normalizeLooseText(value) {
    return String(value == null ? "" : value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function normalizeHeader(key) {
    return normalizeLooseText(key)
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function normalizeReferencePart(value) {
    return normalizeLooseText(value).replace(/\s+/g, " ").trim();
  }

  function normalizeRowKeys(row) {
    var out = {};
    Object.keys(row || {}).forEach(function (k) {
      var nk = normalizeHeader(k);
      if (!nk) return;
      if (out[nk] == null || String(out[nk]).trim() === "") out[nk] = row[k];
    });
    return out;
  }

  function pickValue(normalizedRow, aliases) {
    if (!normalizedRow) return "";
    for (var i = 0; i < aliases.length; i += 1) {
      var nk = normalizeHeader(aliases[i]);
      var raw = normalizedRow[nk];
      if (raw == null) continue;
      var txt = String(raw).trim();
      if (txt !== "") return raw;
    }
    return "";
  }

  function shallowCloneObj(obj) {
    var out = {};
    Object.keys(obj || {}).forEach(function (k) {
      out[k] = obj[k];
    });
    return out;
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function debounce(fn, ms) {
    var t = null;
    return function () {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(null, args);
      }, ms);
    };
  }

  root.normalizeUtils = {
    normalizeLooseText: normalizeLooseText,
    normalizeHeader: normalizeHeader,
    normalizeReferencePart: normalizeReferencePart,
    normalizeRowKeys: normalizeRowKeys,
    pickValue: pickValue,
    shallowCloneObj: shallowCloneObj,
    deepClone: deepClone,
    debounce: debounce
  };
})(window);
