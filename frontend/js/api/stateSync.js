(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function noop() {}

  function safeWarn() {
    if (!global.console || typeof global.console.warn !== "function") return;
    global.console.warn.apply(global.console, arguments);
  }

  function clearPollingTimer(options) {
    var opts = options || {};
    var getTimer = typeof opts.getTimer === "function" ? opts.getTimer : function () { return null; };
    var setTimer = typeof opts.setTimer === "function" ? opts.setTimer : noop;
    var timer = getTimer();
    if (!timer) return;
    clearInterval(timer);
    setTimer(null);
  }

  async function refreshRemoteEmendasFromApi(forceRender, options) {
    var opts = options || {};
    var isApiEnabled = typeof opts.isApiEnabled === "function" ? opts.isApiEnabled : function () { return false; };
    var apiRequest = typeof opts.apiRequest === "function" ? opts.apiRequest : function () { return Promise.reject(new Error("apiRequest indisponivel")); };
    var mergeRemoteEmendas = typeof opts.mergeRemoteEmendas === "function" ? opts.mergeRemoteEmendas : noop;
    var setApiOnline = typeof opts.setApiOnline === "function" ? opts.setApiOnline : noop;
    var setApiLastError = typeof opts.setApiLastError === "function" ? opts.setApiLastError : noop;
    var saveState = typeof opts.saveState === "function" ? opts.saveState : noop;
    var syncYearFilter = typeof opts.syncYearFilter === "function" ? opts.syncYearFilter : noop;
    var render = typeof opts.render === "function" ? opts.render : noop;
    var refreshOpenModalAfterRemoteSync = typeof opts.refreshOpenModalAfterRemoteSync === "function" ? opts.refreshOpenModalAfterRemoteSync : noop;
    var applyAccessProfile = typeof opts.applyAccessProfile === "function" ? opts.applyAccessProfile : noop;

    if (!isApiEnabled()) return false;
    try {
      var remoteList = await apiRequest("GET", "/emendas", undefined, "API", { handleAuthFailure: false });
      mergeRemoteEmendas(Array.isArray(remoteList) ? remoteList : []);
      setApiOnline(true);
      setApiLastError("");
      saveState(true);
      syncYearFilter();
      if (forceRender !== false) {
        render();
      }
      refreshOpenModalAfterRemoteSync();
      return true;
    } catch (err) {
      var status = Number(err && err.status ? err.status : 0);
      if (status >= 500 || status === 0) {
        setApiOnline(false);
        setApiLastError(err && err.message ? String(err.message) : "falha ao atualizar emendas");
        applyAccessProfile();
      }
      return false;
    }
  }

  function syncApiStatePolling(options) {
    var opts = options || {};
    var isApiEnabled = typeof opts.isApiEnabled === "function" ? opts.isApiEnabled : function () { return false; };
    var isApiOnline = typeof opts.isApiOnline === "function" ? opts.isApiOnline : function () { return false; };
    var isWebSocketEnabled = !!opts.isWebSocketEnabled;
    var getTimer = typeof opts.getTimer === "function" ? opts.getTimer : function () { return null; };
    var setTimer = typeof opts.setTimer === "function" ? opts.setTimer : noop;
    var clearPolling = typeof opts.clearPolling === "function" ? opts.clearPolling : noop;
    var refreshRemoteEmendas = typeof opts.refreshRemoteEmendas === "function" ? opts.refreshRemoteEmendas : function () { return Promise.resolve(false); };
    var intervalMs = Number(opts.intervalMs || 0);

    if (!isApiEnabled() || !isApiOnline() || isWebSocketEnabled) {
      clearPolling();
      return;
    }
    if (getTimer() || !(intervalMs > 0)) return;
    setTimer(setInterval(function () {
      Promise.resolve(refreshRemoteEmendas(true)).catch(noop);
    }, intervalMs));
  }

  function resetApiLinkedState(options) {
    var opts = options || {};
    var closeApiSocket = typeof opts.closeApiSocket === "function" ? opts.closeApiSocket : noop;
    var clearBetaAuditPolling = typeof opts.clearBetaAuditPolling === "function" ? opts.clearBetaAuditPolling : noop;
    var clearBetaSupportPolling = typeof opts.clearBetaSupportPolling === "function" ? opts.clearBetaSupportPolling : noop;
    var clearApiStatePolling = typeof opts.clearApiStatePolling === "function" ? opts.clearApiStatePolling : noop;
    var resetBetaAuditState = typeof opts.resetBetaAuditState === "function" ? opts.resetBetaAuditState : noop;
    var resetBetaSupportState = typeof opts.resetBetaSupportState === "function" ? opts.resetBetaSupportState : noop;
    var setApiOnline = typeof opts.setApiOnline === "function" ? opts.setApiOnline : noop;
    var setApiLastError = typeof opts.setApiLastError === "function" ? opts.setApiLastError : noop;
    var nextOnline = Object.prototype.hasOwnProperty.call(opts, "apiOnline") ? !!opts.apiOnline : false;
    var nextError = Object.prototype.hasOwnProperty.call(opts, "apiLastError") ? String(opts.apiLastError || "") : "";

    closeApiSocket();
    clearBetaAuditPolling();
    clearBetaSupportPolling();
    clearApiStatePolling();
    resetBetaAuditState();
    resetBetaSupportState();
    setApiOnline(nextOnline);
    setApiLastError(nextError);
  }

  async function bootstrapApiIntegration(options) {
    var opts = options || {};
    var isApiEnabled = typeof opts.isApiEnabled === "function" ? opts.isApiEnabled : function () { return false; };
    var resetApiState = typeof opts.resetApiState === "function" ? opts.resetApiState : noop;
    var apiRequest = typeof opts.apiRequest === "function" ? opts.apiRequest : function () { return Promise.reject(new Error("apiRequest indisponivel")); };
    var mergeRemoteEmendas = typeof opts.mergeRemoteEmendas === "function" ? opts.mergeRemoteEmendas : noop;
    var setApiOnline = typeof opts.setApiOnline === "function" ? opts.setApiOnline : noop;
    var setApiLastError = typeof opts.setApiLastError === "function" ? opts.setApiLastError : noop;
    var saveState = typeof opts.saveState === "function" ? opts.saveState : noop;
    var syncYearFilter = typeof opts.syncYearFilter === "function" ? opts.syncYearFilter : noop;
    var applyAccessProfile = typeof opts.applyAccessProfile === "function" ? opts.applyAccessProfile : noop;
    var render = typeof opts.render === "function" ? opts.render : noop;
    var refreshBetaAudit = typeof opts.refreshBetaAudit === "function" ? opts.refreshBetaAudit : function () { return Promise.resolve(); };
    var refreshBetaSupport = typeof opts.refreshBetaSupport === "function" ? opts.refreshBetaSupport : function () { return Promise.resolve(); };
    var syncApiPolling = typeof opts.syncApiPolling === "function" ? opts.syncApiPolling : noop;
    var logWarning = typeof opts.logWarning === "function" ? opts.logWarning : safeWarn;

    if (!isApiEnabled()) {
      resetApiState({ apiOnline: false, apiLastError: "" });
      applyAccessProfile();
      return;
    }

    try {
      await apiRequest("GET", "/health", undefined, "API");
      var remoteList = await apiRequest("GET", "/emendas", undefined, "API");
      mergeRemoteEmendas(Array.isArray(remoteList) ? remoteList : []);
      setApiOnline(true);
      setApiLastError("");
    } catch (err) {
      var apiLastError = err && err.message ? String(err.message) : "falha de conexao";
      resetApiState({ apiOnline: false, apiLastError: apiLastError });
      logWarning("API indisponivel, mantendo modo local:", apiLastError);
    }

    saveState();
    syncYearFilter();
    applyAccessProfile();
    render();
    if (opts.isApiOnline && opts.isApiOnline()) {
      refreshBetaAudit(false).catch(noop);
      refreshBetaSupport(false).catch(noop);
    }
    syncApiPolling();
  }

  root.apiStateSyncUtils = {
    clearPollingTimer: clearPollingTimer,
    refreshRemoteEmendasFromApi: refreshRemoteEmendasFromApi,
    syncApiStatePolling: syncApiStatePolling,
    resetApiLinkedState: resetApiLinkedState,
    bootstrapApiIntegration: bootstrapApiIntegration
  };
})(window);
