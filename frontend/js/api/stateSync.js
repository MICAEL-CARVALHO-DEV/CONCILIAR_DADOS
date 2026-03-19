(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};
  var SEMI_AUTO_REFRESH_MIN_MS = 15000;
  // Chave interna para deferred refresh (update remoto com input focado).
  var __deferredRefreshTimer = null;
  var __deferredRefreshBlurHandler = null;

  function noop() {}

  function isEditableElement(element) {
    if (!element || typeof element !== "object") return false;
    if (element.isContentEditable) return true;
    var tagName = String(element.tagName || "").toUpperCase();
    if (tagName === "TEXTAREA") return !element.disabled && !element.readOnly;
    if (tagName !== "INPUT" && tagName !== "SELECT") return false;
    var inputType = String(element.type || "").toLowerCase();
    if (inputType === "button" || inputType === "submit" || inputType === "reset" || inputType === "checkbox" || inputType === "radio") {
      return false;
    }
    return !element.disabled && !element.readOnly;
  }

  function shouldDeferInteractiveRefresh() {
    if (!global.document) return false;
    var active = global.document.activeElement;
    return isEditableElement(active);
  }

  function isDocumentVisible() {
    if (!global.document) return true;
    if (typeof global.document.hidden === "boolean") {
      return !global.document.hidden;
    }
    return true;
  }

  function isAutoPollEnabled() {
    var cfg = global.SEC_APP_CONFIG && typeof global.SEC_APP_CONFIG === "object"
      ? global.SEC_APP_CONFIG
      : {};
    if (Object.prototype.hasOwnProperty.call(cfg, "API_STATE_POLL_ENABLED")) {
      return String(cfg.API_STATE_POLL_ENABLED).trim().toLowerCase() === "true";
    }
    return false;
  }

  function safeWarn() {
    if (!global.console || typeof global.console.warn !== "function") return;
    global.console.warn.apply(global.console, arguments);
  }

  function getNow() {
    return Date.now();
  }

  function getLastSemiAutoRefreshAt() {
    return Number(root.__lastSemiAutoRefreshAt || 0);
  }

  function markSemiAutoRefreshAt() {
    root.__lastSemiAutoRefreshAt = getNow();
  }

  function shouldRunSemiAutoRefresh() {
    var elapsed = getNow() - getLastSemiAutoRefreshAt();
    return elapsed >= SEMI_AUTO_REFRESH_MIN_MS;
  }

  function bindSemiAutoRefresh(options) {
    var opts = options || {};
    var isApiEnabled = typeof opts.isApiEnabled === "function" ? opts.isApiEnabled : function () { return false; };
    var isApiOnline = typeof opts.isApiOnline === "function" ? opts.isApiOnline : function () { return false; };
    if (!global.document || root.__semiAutoRefreshBound) return;

    function tryRefreshOnResume() {
      if (!isApiEnabled() || !isApiOnline()) return;
      if (!isDocumentVisible() || shouldDeferInteractiveRefresh()) return;
      if (!shouldRunSemiAutoRefresh()) return;
      Promise.resolve(refreshRemoteEmendasFromApi(true, opts)).catch(noop);
    }

    global.document.addEventListener("visibilitychange", function () {
      if (global.document.visibilityState !== "visible") return;
      tryRefreshOnResume();
    });

    global.addEventListener("focus", function () {
      tryRefreshOnResume();
    });

    global.addEventListener("SEC_REFRESH_NOW", function () {
      Promise.resolve(refreshRemoteEmendasFromApi(true, opts)).catch(noop);
    });

    root.__semiAutoRefreshBound = true;
  }

  function ensureManualRefreshButton(options) {
    var opts = options || {};
    var isApiEnabled = typeof opts.isApiEnabled === "function" ? opts.isApiEnabled : function () { return false; };
    var isApiOnline = typeof opts.isApiOnline === "function" ? opts.isApiOnline : function () { return false; };
    if (!global.document || !global.document.body) return;

    var button = global.document.getElementById("secManualRefreshBtn");
    if (!button) {
      button = global.document.createElement("button");
      button.type = "button";
      button.id = "secManualRefreshBtn";
      button.textContent = "Atualizar agora";
      button.setAttribute("aria-label", "Atualizar dados agora");
      button.style.position = "fixed";
      button.style.right = "20px";
      button.style.bottom = "20px";
      button.style.zIndex = "9999";
      button.style.padding = "10px 14px";
      button.style.borderRadius = "999px";
      button.style.border = "1px solid rgba(13, 110, 253, 0.18)";
      button.style.background = "#ffffff";
      button.style.color = "#0f172a";
      button.style.fontSize = "14px";
      button.style.fontWeight = "600";
      button.style.boxShadow = "0 8px 20px rgba(15, 23, 42, 0.12)";
      button.style.cursor = "pointer";
      button.style.transition = "opacity 160ms ease, transform 160ms ease";
      button.addEventListener("mouseenter", function () {
        button.style.transform = "translateY(-1px)";
      });
      button.addEventListener("mouseleave", function () {
        button.style.transform = "translateY(0)";
      });
      button.addEventListener("click", function () {
        if (!isApiEnabled() || !isApiOnline()) return;
        if (button.dataset.loading === "true") return;
        button.dataset.loading = "true";
        button.disabled = true;
        button.textContent = "Atualizando...";
        Promise.resolve(refreshRemoteEmendasFromApi(true, opts)).then(function (ok) {
          button.textContent = ok ? "Atualizado agora" : "Falha ao atualizar";
        }).catch(function () {
          button.textContent = "Falha ao atualizar";
        }).finally(function () {
          global.setTimeout(function () {
            button.dataset.loading = "false";
            button.disabled = false;
            button.textContent = "Atualizar agora";
          }, 1600);
        });
      });
      global.document.body.appendChild(button);
    }

    button.style.display = isApiEnabled() ? "inline-flex" : "none";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.opacity = isApiOnline() ? "1" : "0.6";
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

  // Quando um update remoto chega com input focado, agenda o snapshot
  // para ser aplicado assim que o usuario sair do campo (blur) ou apos
  // um fallback de 8 segundos, o que ocorrer primeiro.
  function scheduleDeferredRemoteRefresh(opts) {
    if (__deferredRefreshTimer) return; // ja existe um agendamento pendente
    var render = typeof opts.render === "function" ? opts.render : noop;
    var refreshOpenModalAfterRemoteSync = typeof opts.refreshOpenModalAfterRemoteSync === "function" ? opts.refreshOpenModalAfterRemoteSync : noop;

    function flushDeferred() {
      clearTimeout(__deferredRefreshTimer);
      __deferredRefreshTimer = null;
      if (__deferredRefreshBlurHandler && global.document) {
        global.document.removeEventListener("focusout", __deferredRefreshBlurHandler, true);
        __deferredRefreshBlurHandler = null;
      }
      render();
      refreshOpenModalAfterRemoteSync();
    }

    // Listener de blur one-shot: dispara quando o usuario sai do campo ativo.
    __deferredRefreshBlurHandler = function () {
      if (shouldDeferInteractiveRefresh()) return; // ainda ha campo focado
      flushDeferred();
    };
    if (global.document) {
      global.document.addEventListener("focusout", __deferredRefreshBlurHandler, true);
    }
    // Fallback: aplica apos 8s independentemente do foco.
    __deferredRefreshTimer = setTimeout(flushDeferred, 8000);
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
      var deferInteractiveRefresh = shouldDeferInteractiveRefresh();
      mergeRemoteEmendas(Array.isArray(remoteList) ? remoteList : []);
      setApiOnline(true);
      setApiLastError("");
      markSemiAutoRefreshAt();
      saveState(true);
      syncYearFilter();
      if (forceRender !== false && !deferInteractiveRefresh) {
        render();
      } else if (forceRender !== false && deferInteractiveRefresh) {
        // Update remoto chegou enquanto usuario estava digitando.
        // Agenda aplicacao do snapshot para quando o campo perder foco.
        scheduleDeferredRemoteRefresh({ render: render, refreshOpenModalAfterRemoteSync: refreshOpenModalAfterRemoteSync });
      }
      if (!deferInteractiveRefresh) {
        refreshOpenModalAfterRemoteSync();
      }
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
    var isSocketConnected = typeof opts.isSocketConnected === "function" ? opts.isSocketConnected : function () { return false; };
    var getTimer = typeof opts.getTimer === "function" ? opts.getTimer : function () { return null; };
    var setTimer = typeof opts.setTimer === "function" ? opts.setTimer : noop;
    var clearPolling = typeof opts.clearPolling === "function" ? opts.clearPolling : noop;
    var refreshRemoteEmendas = typeof opts.refreshRemoteEmendas === "function" ? opts.refreshRemoteEmendas : function () { return Promise.resolve(false); };
    var intervalMs = Number(opts.intervalMs || 0);
    var effectiveIntervalMs = Math.max(intervalMs, 30000);

    if (!isApiEnabled() || !isApiOnline() || (isWebSocketEnabled && isSocketConnected()) || !isAutoPollEnabled()) {
      clearPolling();
      return;
    }
    if (getTimer() || !(effectiveIntervalMs > 0)) return;
    setTimer(setInterval(function () {
      if (!isDocumentVisible() || shouldDeferInteractiveRefresh()) {
        return;
      }
      Promise.resolve(refreshRemoteEmendas(true)).catch(noop);
    }, effectiveIntervalMs));
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
    if (!shouldDeferInteractiveRefresh()) {
      render();
    }
    markSemiAutoRefreshAt();
    if (opts.isApiOnline && opts.isApiOnline()) {
      refreshBetaAudit(false).catch(noop);
      refreshBetaSupport(false).catch(noop);
    }
    ensureManualRefreshButton(opts);
    bindSemiAutoRefresh(opts);
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
