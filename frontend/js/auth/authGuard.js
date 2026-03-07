(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};
  var authStore = root.authStore;

  function isLocalFrontendContext() {
    var host = (global.location && global.location.hostname) ? String(global.location.hostname) : "";
    return !host || host === "localhost" || host === "127.0.0.1";
  }

  function hasStoredSession(keys) {
    if (!authStore || typeof authStore.readStoredSessionToken !== "function") return false;
    return !!authStore.readStoredSessionToken(keys);
  }

  root.authGuard = {
    isLocalFrontendContext: isLocalFrontendContext,
    hasStoredSession: hasStoredSession
  };
})(window);
