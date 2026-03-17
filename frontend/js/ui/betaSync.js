(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function noop() {}

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function safeText(value) {
    return value == null ? "" : String(value).trim();
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

  function syncPolling(options) {
    var opts = options || {};
    var shouldRun = typeof opts.shouldRun === "function" ? opts.shouldRun : function () { return false; };
    var getTimer = typeof opts.getTimer === "function" ? opts.getTimer : function () { return null; };
    var setTimer = typeof opts.setTimer === "function" ? opts.setTimer : noop;
    var onClear = typeof opts.onClear === "function" ? opts.onClear : noop;
    var tick = typeof opts.tick === "function" ? opts.tick : function () { return Promise.resolve(); };
    var intervalMs = Number(opts.intervalMs || 0);

    if (!shouldRun()) {
      onClear();
      return;
    }
    if (getTimer() || !(intervalMs > 0)) return;

    setTimer(setInterval(function () {
      Promise.resolve(tick()).catch(noop);
    }, intervalMs));
  }

  function normalizeAuditRows(rows, options) {
    var opts = options || {};
    var text = typeof opts.text === "function" ? opts.text : safeText;
    return safeArray(rows).map(function (row) {
      var when = text(row && row.data_hora);
      return Object.assign({}, row, {
        source: "API",
        data_hora: when,
        at_ts: new Date(when).getTime() || 0
      });
    }).sort(function (a, b) {
      return (b.at_ts || 0) - (a.at_ts || 0);
    });
  }

  async function refreshBetaAuditFromApi(forceRender, options) {
    var opts = options || {};
    var canViewGlobalAuditApi = typeof opts.canViewGlobalAuditApi === "function" ? opts.canViewGlobalAuditApi : function () { return false; };
    var isApiEnabled = typeof opts.isApiEnabled === "function" ? opts.isApiEnabled : function () { return false; };
    var isLoading = typeof opts.isLoading === "function" ? opts.isLoading : function () { return false; };
    var setLoading = typeof opts.setLoading === "function" ? opts.setLoading : noop;
    var setRows = typeof opts.setRows === "function" ? opts.setRows : noop;
    var setError = typeof opts.setError === "function" ? opts.setError : noop;
    var setLastSyncAt = typeof opts.setLastSyncAt === "function" ? opts.setLastSyncAt : noop;
    var renderWorkspace = typeof opts.renderWorkspace === "function" ? opts.renderWorkspace : noop;
    var apiRequest = typeof opts.apiRequest === "function" ? opts.apiRequest : function () { return Promise.reject(new Error("apiRequest indisponivel")); };
    var buildQuery = typeof opts.buildQuery === "function" ? opts.buildQuery : function () { return ""; };
    var extractApiError = typeof opts.extractApiError === "function" ? opts.extractApiError : function (_err, fallback) { return String(fallback || "Falha ao carregar historico."); };
    var isoNow = typeof opts.isoNow === "function" ? opts.isoNow : function () { return ""; };
    var text = typeof opts.text === "function" ? opts.text : safeText;

    if (!canViewGlobalAuditApi()) {
      setRows([]);
      setError(isApiEnabled() ? "Perfil atual sem acesso ao historico global da API." : "");
      setLoading(false);
      if (forceRender) renderWorkspace();
      return;
    }
    if (isLoading()) return;

    setLoading(true);
    if (forceRender) renderWorkspace();

    try {
      var remoteRows = await apiRequest("GET", "/audit?" + buildQuery(), undefined, "UI", { handleAuthFailure: false });
      setRows(normalizeAuditRows(remoteRows, { text: text }));
      setError("");
      setLastSyncAt(isoNow());
    } catch (err) {
      setError(extractApiError(err, "Falha ao carregar historico global da API."));
    } finally {
      setLoading(false);
      if (forceRender) renderWorkspace();
    }
  }

  async function refreshBetaSupportMessagesFromApi(forceRender, threadId, options) {
    var opts = options || {};
    var canUseSupportApi = typeof opts.canUseSupportApi === "function" ? opts.canUseSupportApi : function () { return false; };
    var isSupportManagerUser = typeof opts.isSupportManagerUser === "function" ? opts.isSupportManagerUser : function () { return false; };
    var getSelectedThreadId = typeof opts.getSelectedThreadId === "function" ? opts.getSelectedThreadId : function () { return 0; };
    var setMessages = typeof opts.setMessages === "function" ? opts.setMessages : noop;
    var setMessagesError = typeof opts.setMessagesError === "function" ? opts.setMessagesError : noop;
    var isMessagesLoading = typeof opts.isMessagesLoading === "function" ? opts.isMessagesLoading : function () { return false; };
    var setMessagesLoading = typeof opts.setMessagesLoading === "function" ? opts.setMessagesLoading : noop;
    var renderWorkspace = typeof opts.renderWorkspace === "function" ? opts.renderWorkspace : noop;
    var apiRequest = typeof opts.apiRequest === "function" ? opts.apiRequest : function () { return Promise.reject(new Error("apiRequest indisponivel")); };
    var extractApiError = typeof opts.extractApiError === "function" ? opts.extractApiError : function (_err, fallback) { return String(fallback || "Falha ao carregar mensagens do suporte."); };

    var id = Number(threadId || getSelectedThreadId() || 0);
    if (!id || !canUseSupportApi() || !isSupportManagerUser()) {
      setMessages([]);
      setMessagesError("");
      setMessagesLoading(false);
      if (forceRender) renderWorkspace();
      return;
    }
    if (isMessagesLoading()) return;

    setMessagesLoading(true);
    if (forceRender) renderWorkspace();
    try {
      var rows = await apiRequest("GET", "/support/threads/" + String(id) + "/messages", undefined, "UI", { handleAuthFailure: false });
      setMessages(safeArray(rows));
      setMessagesError("");
    } catch (err) {
      setMessagesError(extractApiError(err, "Falha ao carregar mensagens do suporte."));
    } finally {
      setMessagesLoading(false);
      if (forceRender) renderWorkspace();
    }
  }

  async function refreshBetaSupportFromApi(forceRender, options) {
    var opts = options || {};
    var canUseSupportApi = typeof opts.canUseSupportApi === "function" ? opts.canUseSupportApi : function () { return false; };
    var isSupportManagerUser = typeof opts.isSupportManagerUser === "function" ? opts.isSupportManagerUser : function () { return false; };
    var isApiEnabled = typeof opts.isApiEnabled === "function" ? opts.isApiEnabled : function () { return false; };
    var isLoading = typeof opts.isLoading === "function" ? opts.isLoading : function () { return false; };
    var setLoading = typeof opts.setLoading === "function" ? opts.setLoading : noop;
    var setThreads = typeof opts.setThreads === "function" ? opts.setThreads : noop;
    var setMessages = typeof opts.setMessages === "function" ? opts.setMessages : noop;
    var setError = typeof opts.setError === "function" ? opts.setError : noop;
    var setMessagesError = typeof opts.setMessagesError === "function" ? opts.setMessagesError : noop;
    var setLastSyncAt = typeof opts.setLastSyncAt === "function" ? opts.setLastSyncAt : noop;
    var getSelectedThreadId = typeof opts.getSelectedThreadId === "function" ? opts.getSelectedThreadId : function () { return 0; };
    var setSelectedThreadId = typeof opts.setSelectedThreadId === "function" ? opts.setSelectedThreadId : noop;
    var renderWorkspace = typeof opts.renderWorkspace === "function" ? opts.renderWorkspace : noop;
    var apiRequest = typeof opts.apiRequest === "function" ? opts.apiRequest : function () { return Promise.reject(new Error("apiRequest indisponivel")); };
    var buildQuery = typeof opts.buildQuery === "function" ? opts.buildQuery : function () { return ""; };
    var refreshMessages = typeof opts.refreshMessages === "function" ? opts.refreshMessages : function () { return Promise.resolve(); };
    var syncPollingFn = typeof opts.syncPolling === "function" ? opts.syncPolling : noop;
    var extractApiError = typeof opts.extractApiError === "function" ? opts.extractApiError : function (_err, fallback) { return String(fallback || "Falha ao carregar chamados de suporte."); };
    var isoNow = typeof opts.isoNow === "function" ? opts.isoNow : function () { return ""; };

    if (!canUseSupportApi()) {
      setThreads([]);
      setMessages([]);
      setError(isApiEnabled() ? "Sessao necessaria para usar suporte." : "Suporte exige API ativa.");
      setMessagesError("");
      setLoading(false);
      if (forceRender) renderWorkspace();
      return;
    }
    if (!isSupportManagerUser()) {
      setThreads([]);
      setMessages([]);
      setError("");
      setMessagesError("");
      setLastSyncAt(isoNow());
      setLoading(false);
      if (forceRender) renderWorkspace();
      syncPollingFn();
      return;
    }
    if (isLoading()) return;

    setLoading(true);
    if (forceRender) renderWorkspace();
    try {
      var rows = await apiRequest("GET", "/support/threads?" + buildQuery(), undefined, "UI", { handleAuthFailure: false });
      var nextThreads = safeArray(rows);
      setThreads(nextThreads);
      setError("");
      setLastSyncAt(isoNow());
      var selectedThreadId = Number(getSelectedThreadId() || 0);
      var stillSelected = nextThreads.some(function (item) {
        return Number(item && item.id ? item.id : 0) === selectedThreadId;
      });
      if (!stillSelected) {
        selectedThreadId = nextThreads.length ? Number(nextThreads[0].id || 0) : 0;
        setSelectedThreadId(selectedThreadId);
      }
      if (selectedThreadId) {
        await refreshMessages(false, selectedThreadId);
      } else {
        setMessages([]);
        setMessagesError("");
      }
    } catch (err) {
      setError(extractApiError(err, "Falha ao carregar chamados de suporte."));
    } finally {
      setLoading(false);
      if (forceRender) renderWorkspace();
      syncPollingFn();
    }
  }

  root.betaSyncUtils = {
    clearPollingTimer: clearPollingTimer,
    syncPolling: syncPolling,
    refreshBetaAuditFromApi: refreshBetaAuditFromApi,
    refreshBetaSupportMessagesFromApi: refreshBetaSupportMessagesFromApi,
    refreshBetaSupportFromApi: refreshBetaSupportFromApi
  };
})(window);
