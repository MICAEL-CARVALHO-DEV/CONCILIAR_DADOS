(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function normalizeYearFromRecordYear(ano, toIntFn, fallbackYearFn) {
    var year = String((toIntFn && toIntFn(ano)) || (fallbackYearFn ? fallbackYearFn() : new Date().getFullYear()));
    return year;
  }

  function buildIdCounters(records) {
    var counters = {};
    (records || []).forEach(function (r) {
      var id = String(r && r.id || "");
      var m = id.match(/^EPI-(\d{4})-(\d+)$/i);
      if (!m) return;
      var year = m[1];
      var seq = parseInt(m[2], 10) || 0;
      counters[year] = Math.max(counters[year] || 0, seq);
    });
    return counters;
  }

  function generateInternalId(ano, counters, toIntFn, currentYearFn) {
    var year = normalizeYearFromRecordYear(ano, toIntFn, currentYearFn);
    var next = ((counters[year] || 0) + 1);
    counters[year] = next;
    return "EPI-" + year + "-" + String(next).padStart(6, "0");
  }

  function assignMissingIds(records, counters, generateFn, toIntFn, currentYearFn) {
    (records || []).forEach(function (r) {
      if (String(r && r.id || "").trim()) return;
      r.id = generateFn(r && r.ano, counters, toIntFn, currentYearFn);
    });
  }

  root.idUtils = {
    buildIdCounters: buildIdCounters,
    generateInternalId: generateInternalId,
    assignMissingIds: assignMissingIds
  };
})(window);
