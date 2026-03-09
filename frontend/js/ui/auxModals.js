(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function noop() {}

  function setAuxModalVisibility(modalEl, visible, options) {
    var opts = options || {};
    var delegate = typeof opts.setModalVisibility === "function" ? opts.setModalVisibility : noop;
    delegate(modalEl, visible);
  }

  function refreshProfileModal(options) {
    var opts = options || {};
    var syncProfileModalFields = typeof opts.syncProfileModalFields === "function" ? opts.syncProfileModalFields : noop;
    syncProfileModalFields(opts.fields || {}, opts.state || {});
  }

  function openProfileModal(options) {
    var opts = options || {};
    refreshProfileModal(opts);
    setAuxModalVisibility(opts.modal, true, opts);
  }

  function closeProfileModal(options) {
    var opts = options || {};
    setAuxModalVisibility(opts.modal, false, opts);
  }

  function openExportCustomModal(options) {
    var opts = options || {};
    if (!opts.modal) return;
    var syncFilters = typeof opts.syncFilters === "function" ? opts.syncFilters : noop;
    var refreshSummary = typeof opts.refreshSummary === "function" ? opts.refreshSummary : noop;
    syncFilters();

    if (opts.exportCustomYear && opts.yearFilter && !opts.exportCustomYear.value) {
      opts.exportCustomYear.value = opts.yearFilter.value || "";
    }
    if (opts.exportCustomStatus && !opts.exportCustomStatus.value) {
      opts.exportCustomStatus.value = "";
    }
    if (opts.exportCustomIncludeOld) opts.exportCustomIncludeOld.checked = false;
    if (opts.exportCustomDeputado) opts.exportCustomDeputado.value = "";
    if (opts.exportCustomMunicipio) opts.exportCustomMunicipio.value = "";

    refreshSummary();
    setAuxModalVisibility(opts.modal, true, opts);
  }

  function closeExportCustomModal(options) {
    var opts = options || {};
    setAuxModalVisibility(opts.modal, false, opts);
  }

  root.auxModalsUtils = {
    setAuxModalVisibility: setAuxModalVisibility,
    refreshProfileModal: refreshProfileModal,
    openProfileModal: openProfileModal,
    closeProfileModal: closeProfileModal,
    openExportCustomModal: openExportCustomModal,
    closeExportCustomModal: closeExportCustomModal
  };
})(window);
