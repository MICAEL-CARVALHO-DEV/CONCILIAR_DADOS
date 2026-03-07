(function (win) {
  const SECFrontend = (win && win.SECFrontend && typeof win.SECFrontend === "object") ? win.SECFrontend : (win.SECFrontend = {});

  const noop = function () {};
  const toBool = function (value) {
    return !!value;
  };

  const state = {
    emendaLockState: null,
    emendaLockReadOnly: false,
    emendaLockTimer: null,
    presenceByBackendId: {},
    currentPresenceBackendId: null,
    apiSocket: null,
    apiSocketReconnectTimer: null,
    apiRefreshTimer: null,
    apiRefreshRunning: false,
    apiSocketBackoffMs: 1500
  };

  const cfg = {
    isApiEnabled: noop,
    canMutateRecords: noop,
    ensureBackendEmenda: noop,
    apiRequest: async function () {
      throw new Error("apiRequest nao configurado");
    },
    getSelected: noop,
    getBackendIdForRecord: noop,
    getApiBaseUrl: function () { return ""; },
    getSessionToken: function () { return ""; },
    isApiSocketEnabled: function () { return false; },
    getCurrentUser: function () { return ""; },
    getCurrentRole: function () { return ""; },
    emendaLockPollMs: 20000,
    apiWsPath: "/ws",
    wsReconnectBaseMs: 1500,
    wsReconnectMaxMs: 15000,
    wsRefreshDebounceMs: 400,
    text: function (v) { return v == null ? "" : String(v); },
    fmtDateTime: function (iso) { return String(iso || ""); },
    extractApiError: function (_err, fallback) { return fallback || "falha"; },
    onApiError: noop,
    onPresenceUpdated: noop,
    onQueueApiRefresh: noop,
    onLockStateChanged: noop
  };

  function notifyStateChange() {
    if (typeof cfg.onLockStateChanged === "function") {
      cfg.onLockStateChanged({
        state: state.emendaLockState,
        readOnly: state.emendaLockReadOnly
      });
    }
  }

  function getApiWsUrl() {
    const base = cfg.getApiBaseUrl();
    if (!base) return "";
    if (base.indexOf("https://") === 0) return "wss://" + base.slice(8) + cfg.apiWsPath;
    if (base.indexOf("http://") === 0) return "ws://" + base.slice(7) + cfg.apiWsPath;
    return "";
  }

  function setEmendaLockState(payload) {
    state.emendaLockState = payload && typeof payload === "object" ? payload : null;

    if (!cfg.canMutateRecords()) {
      state.emendaLockReadOnly = true;
      notifyStateChange();
      return;
    }

    if (!state.emendaLockState) {
      state.emendaLockReadOnly = false;
      notifyStateChange();
      return;
    }

    state.emendaLockReadOnly = !Boolean(state.emendaLockState.can_edit);
    notifyStateChange();
  }

  function setEmendaLockReadOnly(value) {
    state.emendaLockReadOnly = toBool(value);
    notifyStateChange();
  }

  async function fetchEmendaLockStatus(rec) {
    const backendId = await cfg.ensureBackendEmenda(rec, { handleAuthFailure: false });
    return await cfg.apiRequest("GET", "/emendas/" + String(backendId) + "/lock", undefined, "UI", { handleAuthFailure: false });
  }

  async function acquireEmendaLock(rec, forceAcquire) {
    const backendId = await cfg.ensureBackendEmenda(rec, { handleAuthFailure: false });
    return await cfg.apiRequest("POST", "/emendas/" + String(backendId) + "/lock/acquire", {
      force: !!forceAcquire
    }, "UI", { handleAuthFailure: false });
  }

  async function renewEmendaLock(rec) {
    const backendId = await cfg.ensureBackendEmenda(rec, { handleAuthFailure: false });
    return await cfg.apiRequest("POST", "/emendas/" + String(backendId) + "/lock/renew", {}, "UI", { handleAuthFailure: false });
  }

  async function releaseEmendaLock(rec) {
    if (!rec || !cfg.isApiEnabled()) return;
    const backendId = cfg.getBackendIdForRecord(rec) || await cfg.ensureBackendEmenda(rec, { handleAuthFailure: false });
    if (!backendId) return;
    await cfg.apiRequest("POST", "/emendas/" + String(backendId) + "/lock/release", {}, "UI", { handleAuthFailure: false });
  }

  function clearEmendaLockTimer() {
    if (!state.emendaLockTimer) return;
    clearInterval(state.emendaLockTimer);
    state.emendaLockTimer = null;
  }

  async function tickEmendaLock() {
    const rec = cfg.getSelected();
    if (!rec) return;

    try {
      if (!cfg.canMutateRecords()) {
        const lockInfo = await fetchEmendaLockStatus(rec);
        setEmendaLockState(lockInfo);
      } else if (state.emendaLockReadOnly) {
        const lockInfo = await fetchEmendaLockStatus(rec);
        setEmendaLockState(lockInfo);
        if (lockInfo && !lockInfo.locked && lockInfo.can_edit) {
          const acquired = await acquireEmendaLock(rec, false);
          setEmendaLockState(acquired);
        }
      } else {
        const renewed = await renewEmendaLock(rec);
        setEmendaLockState(renewed);
      }
    } catch (_err) {
      // Mantem estado atual em caso de oscilacao de rede.
    }
  }

  function startEmendaLockPolling() {
    clearEmendaLockTimer();
    if (!cfg.isApiEnabled()) return;
    state.emendaLockTimer = setInterval(function () {
      tickEmendaLock().catch(noop);
    }, cfg.emendaLockPollMs);
  }

  async function syncModalEmendaLock(rec) {
    clearEmendaLockTimer();
    state.emendaLockState = null;
    if (cfg.canMutateRecords()) setEmendaLockReadOnly(true);

    if (!rec) return;
    if (!cfg.isApiEnabled()) {
      return;
    }

    try {
      if (!cfg.canMutateRecords()) {
        const lockInfo = await fetchEmendaLockStatus(rec);
        setEmendaLockState(lockInfo);
      } else {
        const acquired = await acquireEmendaLock(rec, false);
        setEmendaLockState(acquired);
      }
    } catch (err) {
      setEmendaLockState({
        locked: true,
        can_edit: false,
        message: cfg.extractApiError(err, "Falha ao consultar lock de edicao.")
      });
    }

    startEmendaLockPolling();
  }

  function clearApiSocketReconnectTimer() {
    if (!state.apiSocketReconnectTimer) return;
    clearTimeout(state.apiSocketReconnectTimer);
    state.apiSocketReconnectTimer = null;
  }

  function closeApiSocket() {
    clearApiSocketReconnectTimer();
    state.presenceByBackendId = {};
    state.currentPresenceBackendId = null;
    if (state.apiSocket) {
      try {
        state.apiSocket.onopen = null;
        state.apiSocket.onmessage = null;
        state.apiSocket.onerror = null;
        state.apiSocket.onclose = null;
      } catch (_err) {}
      try {
        state.apiSocket.close();
      } catch (_err) {}
      state.apiSocket = null;
    }
    notifyPresenceUpdated();
  }

  function scheduleApiSocketReconnect() {
    clearApiSocketReconnectTimer();
    const token = cfg.getSessionToken();
    if (!cfg.isApiEnabled() || !token) return;

    const waitMs = Math.max(cfg.wsReconnectBaseMs, Math.min(state.apiSocketBackoffMs, cfg.wsReconnectMaxMs));
    state.apiSocketReconnectTimer = setTimeout(function () {
      connectApiSocket();
    }, waitMs);
    state.apiSocketBackoffMs = Math.min(cfg.wsReconnectMaxMs, Math.floor(waitMs * 1.8));
  }

  function queueApiRefreshFromSocket() {
    if (state.apiRefreshRunning) return;
    if (state.apiRefreshTimer) clearTimeout(state.apiRefreshTimer);
    state.apiRefreshTimer = setTimeout(async function () {
      state.apiRefreshTimer = null;
      if (state.apiRefreshRunning) return;
      state.apiRefreshRunning = true;
      try {
        await cfg.onQueueApiRefresh();
      } catch (_err) {
        // bootstrap ja trata erro internamente
      } finally {
        state.apiRefreshRunning = false;
      }
    }, cfg.wsRefreshDebounceMs);
  }

  function sendSocketJson(payload) {
    if (!state.apiSocket || state.apiSocket.readyState !== 1) return;
    try {
      state.apiSocket.send(JSON.stringify(payload || {}));
    } catch (_err) {
      // no-op
    }
  }

  function getPresenceUsersForRecord(rec) {
    const backendId = cfg.getBackendIdForRecord(rec);
    if (!backendId) return [];
    return Array.isArray(state.presenceByBackendId[backendId]) ? state.presenceByBackendId[backendId] : [];
  }

  function notifyPresenceUpdated() {
    if (typeof cfg.onPresenceUpdated === "function") {
      cfg.onPresenceUpdated();
    }
  }

  function handlePresencePayload(data) {
    const backendId = Number(data && data.id ? data.id : 0);
    if (!backendId) return;
    const users = Array.isArray(data && data.users)
      ? data.users.map(function (u) {
        return {
          usuario_nome: cfg.text(u && u.usuario_nome ? u.usuario_nome : "-"),
          setor: cfg.text(u && u.setor ? u.setor : "-"),
          at: cfg.text(u && u.at ? u.at : "")
        };
      })
      : [];

    if (!users.length) delete state.presenceByBackendId[backendId];
    else state.presenceByBackendId[backendId] = users;

    notifyPresenceUpdated();
  }

  function announcePresenceForRecord(rec, action) {
    if (!cfg.isApiEnabled()) return;
    const backendId = cfg.getBackendIdForRecord(rec);
    if (!backendId) return;

    sendSocketJson({
      type: "presence",
      action: String(action || "").toLowerCase(),
      emenda_id: backendId
    });

    const normalized = String(action || "").toLowerCase();
    if (normalized === "join") {
      state.currentPresenceBackendId = backendId;
    } else if (normalized === "leave" && state.currentPresenceBackendId === backendId) {
      state.currentPresenceBackendId = null;
    }
  }

  function connectApiSocket() {
    closeApiSocket();

    if (!cfg.isApiSocketEnabled()) return;
    if (typeof WebSocket === "undefined") return;
    if (!cfg.isApiEnabled()) return;

    const token = cfg.getSessionToken();
    if (!token) return;

    const wsBase = getApiWsUrl();
    if (!wsBase) return;

    const wsUrl = wsBase
      + "?token=" + encodeURIComponent(token)
      + "&user_name=" + encodeURIComponent(cfg.getCurrentUser() || "")
      + "&user_role=" + encodeURIComponent(cfg.getCurrentRole() || "");

    try {
      state.apiSocket = new WebSocket(wsUrl);
    } catch (_err) {
      scheduleApiSocketReconnect();
      return;
    }

    state.apiSocket.onopen = function () {
      state.apiSocketBackoffMs = cfg.wsReconnectBaseMs;
      const rec = cfg.getSelected();
      if (rec) announcePresenceForRecord(rec, "join");
    };

    state.apiSocket.onmessage = function (evt) {
      const raw = evt && evt.data ? String(evt.data) : "";
      if (!raw) return;

      let data = null;
      try {
        data = JSON.parse(raw);
      } catch (_err) {
        return;
      }
      if (!data) return;

      if (data.type === "presence") {
        handlePresencePayload(data);
        return;
      }

      if (data.type !== "update") return;
      queueApiRefreshFromSocket();
    };

    state.apiSocket.onerror = function () {
      // onclose trata reconexao
    };

    state.apiSocket.onclose = function () {
      state.apiSocket = null;
      scheduleApiSocketReconnect();
    };
  }

  function configure(opts) {
    const next = opts || {};
    cfg.isApiEnabled = typeof next.isApiEnabled === "function" ? next.isApiEnabled : cfg.isApiEnabled;
    cfg.canMutateRecords = typeof next.canMutateRecords === "function" ? next.canMutateRecords : cfg.canMutateRecords;
    cfg.ensureBackendEmenda = typeof next.ensureBackendEmenda === "function" ? next.ensureBackendEmenda : cfg.ensureBackendEmenda;
    cfg.apiRequest = typeof next.apiRequest === "function" ? next.apiRequest : cfg.apiRequest;
    cfg.getSelected = typeof next.getSelected === "function" ? next.getSelected : cfg.getSelected;
    cfg.getBackendIdForRecord = typeof next.getBackendIdForRecord === "function" ? next.getBackendIdForRecord : cfg.getBackendIdForRecord;
    cfg.getApiBaseUrl = typeof next.getApiBaseUrl === "function" ? next.getApiBaseUrl : cfg.getApiBaseUrl;
    cfg.getSessionToken = typeof next.getSessionToken === "function" ? next.getSessionToken : cfg.getSessionToken;
    cfg.isApiSocketEnabled = typeof next.isApiSocketEnabled === "function" ? next.isApiSocketEnabled : cfg.isApiSocketEnabled;
    cfg.getCurrentUser = typeof next.getCurrentUser === "function" ? next.getCurrentUser : cfg.getCurrentUser;
    cfg.getCurrentRole = typeof next.getCurrentRole === "function" ? next.getCurrentRole : cfg.getCurrentRole;
    cfg.emendaLockPollMs = Number(next.emendaLockPollMs) > 1000 ? Number(next.emendaLockPollMs) : cfg.emendaLockPollMs;
    cfg.apiWsPath = typeof next.apiWsPath === "string" ? next.apiWsPath : cfg.apiWsPath;
    cfg.wsReconnectBaseMs = Number(next.wsReconnectBaseMs) > 0 ? Number(next.wsReconnectBaseMs) : cfg.wsReconnectBaseMs;
    cfg.wsReconnectMaxMs = Number(next.wsReconnectMaxMs) > cfg.wsReconnectBaseMs ? Number(next.wsReconnectMaxMs) : cfg.wsReconnectMaxMs;
    cfg.wsRefreshDebounceMs = Number(next.wsRefreshDebounceMs) >= 0 ? Number(next.wsRefreshDebounceMs) : cfg.wsRefreshDebounceMs;
    cfg.text = typeof next.text === "function" ? next.text : cfg.text;
    cfg.fmtDateTime = typeof next.fmtDateTime === "function" ? next.fmtDateTime : cfg.fmtDateTime;
    cfg.extractApiError = typeof next.extractApiError === "function" ? next.extractApiError : cfg.extractApiError;
    cfg.onApiError = typeof next.onApiError === "function" ? next.onApiError : cfg.onApiError;
    cfg.onPresenceUpdated = typeof next.onPresenceUpdated === "function" ? next.onPresenceUpdated : cfg.onPresenceUpdated;
    cfg.onQueueApiRefresh = typeof next.onQueueApiRefresh === "function" ? next.onQueueApiRefresh : cfg.onQueueApiRefresh;
    cfg.onLockStateChanged = typeof next.onLockStateChanged === "function" ? next.onLockStateChanged : cfg.onLockStateChanged;
    state.apiSocketBackoffMs = cfg.wsReconnectBaseMs;
  }

  SECFrontend.concurrencyService = {
    configure,
    clearEmendaLockTimer,
    setEmendaLockState,
    getEmendaLockState: function () {
      return state.emendaLockState;
    },
    setEmendaLockReadOnly,
    isEmendaLockReadOnly: function () {
      return !!state.emendaLockReadOnly;
    },
    fetchEmendaLockStatus,
    acquireEmendaLock,
    renewEmendaLock,
    releaseEmendaLock,
    tickEmendaLock,
    startEmendaLockPolling,
    syncModalEmendaLock,
    clearApiSocketReconnectTimer,
    closeApiSocket,
    scheduleApiSocketReconnect,
    queueApiRefreshFromSocket,
    announcePresenceForRecord,
    getPresenceUsersForRecord,
    sendSocketJson,
    handlePresencePayload,
    getApiWebSocketUrl: getApiWsUrl,
    connectApiSocket,
    notifyPresenceUpdated
  };
})(typeof window !== "undefined" ? window : globalThis);
