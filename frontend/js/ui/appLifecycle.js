(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function setupCrossTabSync(ctx) {
    if (ctx.stateChannel) {
      ctx.stateChannel.onmessage = function (evt) {
        var data = evt && evt.data ? evt.data : null;
        if (!data || data.type !== "state_updated") return;
        if (data.tabId && data.tabId === ctx.LOCAL_TAB_ID) return;
        ctx.refreshStateFromStorage();
      };
    }

    if (typeof globalScope.window !== "undefined") {
      globalScope.window.addEventListener("storage", function (e) {
        if (!e) return;
        if (e.key !== ctx.STORAGE_KEY && e.key !== ctx.CROSS_TAB_PING_KEY) return;
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

