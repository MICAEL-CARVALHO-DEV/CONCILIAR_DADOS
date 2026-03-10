(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function setupCrossTabSync(ctx) {
    var getWorkspaceKey = typeof ctx.getWorkspaceKey === "function" ? ctx.getWorkspaceKey : function () { return ctx.workspaceKey; };
    var getStorageKey = typeof ctx.getStorageKey === "function" ? ctx.getStorageKey : function () { return ctx.STORAGE_KEY; };
    var getCrossTabPingKey = typeof ctx.getCrossTabPingKey === "function" ? ctx.getCrossTabPingKey : function () { return ctx.CROSS_TAB_PING_KEY; };

    if (ctx.stateChannel) {
      ctx.stateChannel.onmessage = function (evt) {
        var data = evt && evt.data ? evt.data : null;
        if (!data || data.type !== "state_updated") return;
        if (data.tabId && data.tabId === ctx.LOCAL_TAB_ID) return;
        if (data.workspaceKey && getWorkspaceKey() && data.workspaceKey !== getWorkspaceKey()) return;
        ctx.refreshStateFromStorage();
      };
    }

    if (typeof globalScope.window !== "undefined") {
      globalScope.window.addEventListener("storage", function (e) {
        if (!e) return;
        if (e.key !== getStorageKey() && e.key !== getCrossTabPingKey()) return;
        ctx.refreshStateFromStorage();
      });
    }
  }

  function bootstrapAppUi(ctx) {
    ctx.initSelects();
    ctx.setupAuthUi();
    setupCrossTabSync(ctx);
    ctx.render();
    ctx.initializeAuthFlow();
  }

  root.appLifecycleUtils = {
    setupCrossTabSync: setupCrossTabSync,
    bootstrapAppUi: bootstrapAppUi
  };
})(typeof window !== "undefined" ? window : globalThis);

