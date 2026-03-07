(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function normalizeSelectedValue(value) {
    return value == null ? "" : String(value);
  }

  function setSelectOptions(select, options, preferredValue) {
    if (!select) return;
    var prev = preferredValue !== undefined ? normalizeSelectedValue(preferredValue) : normalizeSelectedValue(select.value);

    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }

    for (var i = 0; i < (options || []).length; i += 1) {
      var opt = options[i] || {};
      var el = document.createElement("option");
      el.value = opt.value;
      el.textContent = opt.label;
      select.appendChild(el);
    }

    var firstValue = options && options[0] ? String(options[0].value || "") : "";
    var hasPrev = false;
    for (var j = 0; j < (options || []).length; j += 1) {
      if (String(options[j].value) === prev) {
        hasPrev = true;
        break;
      }
    }
    select.value = hasPrev ? prev : firstValue;
  }

  function buildYearOptions(records, toIntFn) {
    var toIntSafe = typeof toIntFn === "function" ? toIntFn : function (v) {
      var n = parseInt(v, 10);
      return Number.isFinite(n) ? n : 0;
    };

    var years = {};
    (records || []).forEach(function (r) {
      var y = toIntSafe(r && r.ano);
      if (y > 0) years[y] = true;
    });

    var sorted = Object.keys(years).map(function (y) { return parseInt(y, 10); }).sort(function (a, b) {
      return b - a;
    });

    return [{ label: "Todos", value: "" }].concat(sorted.map(function (y) {
      return { label: String(y), value: String(y) };
    }));
  }

  function syncYearFilter(config) {
    var c = config || {};
    var select = c.select;
    if (!select) return;

    var current = c.current != null ? c.current : select.value;
    var opts = buildYearOptions(c.records || [], c.toInt);
    setSelectOptions(select, opts, current);
  }

  function syncCustomExportFilters(config) {
    var c = config || {};
    var yearSelect = c.exportCustomYear;
    var statusSelect = c.exportCustomStatus;
    if (!yearSelect || !statusSelect) return;

    var yearOpts = buildYearOptions(c.records || [], c.toInt);
    var statusOpts = [{ label: "Todos", value: "" }].concat((c.statusValues || []).map(function (s) { return { label: String(s || ""), value: String(s || "") }; }));

    setSelectOptions(yearSelect, yearOpts, c.currentYear != null ? c.currentYear : yearSelect.value);
    setSelectOptions(statusSelect, statusOpts, c.currentStatus != null ? c.currentStatus : statusSelect.value);
  }

  function initSelects(config) {
    var c = config || {};
    setSelectOptions(c.statusFilter, c.statusFilters || []);
    setSelectOptions(c.markStatus, [{ label: "Selecione um status", value: "" }].concat((c.statusValues || []).map(function (s) {
      return { label: String(s || ""), value: String(s || "") };
    })));
    syncYearFilter({
      select: c.yearFilter,
      records: c.records || [],
      toInt: c.toInt
    });
    syncCustomExportFilters({
      exportCustomYear: c.exportCustomYear,
      exportCustomStatus: c.exportCustomStatus,
      records: c.records || [],
      statusValues: c.statusValues || [],
      toInt: c.toInt
    });
  }

  root.filterUtils = {
    setSelectOptions: setSelectOptions,
    syncYearFilter: syncYearFilter,
    syncCustomExportFilters: syncCustomExportFilters,
    initSelects: initSelects,
    buildYearOptions: buildYearOptions
  };
})(window);
