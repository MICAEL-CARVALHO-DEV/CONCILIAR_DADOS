(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function setAuthMessage(msg, isError, ctx) {
    if (!ctx.authMsg) return;
    ctx.authMsg.textContent = msg || "";
    ctx.authMsg.style.color = isError ? "#b4233d" : "";
  }

  function hideAuthGate(ctx) {
    if (!ctx.authGate) return;
    ctx.authGate.classList.add("hidden");
    ctx.authGate.setAttribute("aria-hidden", "true");
    setAuthMessage("", false, ctx);
  }

  function redirectToAuth(page, query, ctx) {
    if (ctx.authStoreRedirect) {
      ctx.authStoreRedirect(page || ctx.authLoginPage, query, ctx.nextPath);
      return;
    }
    var target = page || ctx.authLoginPage;
    var suffix = query ? (String(query).startsWith("?") ? String(query) : "?" + String(query)) : "";
    var next = encodeURIComponent(ctx.nextPath || "index.html");
    var hasQuery = suffix.indexOf("?") >= 0;
    var finalUrl = target + suffix + (hasQuery ? "&" : "?") + "next=" + next;
    if (!globalScope.location.pathname.toLowerCase().endsWith("/" + target.toLowerCase())) {
      globalScope.location.href = finalUrl;
    }
  }

  function showAuthGate(msg, ctx) {
    var q = msg ? "msg=" + encodeURIComponent(msg) : "";
    redirectToAuth(ctx.authLoginPage, q, ctx);
  }

  function extractApiError(err, fallback, ctx) {
    if (ctx.extractApiErrorFromFormat) {
      return ctx.extractApiErrorFromFormat(err, fallback);
    }
    var msg = err && err.message ? String(err.message) : "";
    if (!msg) return fallback;
    var mark = "::";
    if (msg.indexOf(mark) >= 0) return msg.split(mark)[1] || fallback;
    return msg;
  }

  function setAuthenticatedUser(usuario, ctx) {
    ctx.setCurrentUser(String(usuario.nome || ctx.getCurrentUser()).trim() || ctx.getCurrentUser());
    ctx.setCurrentRole(ctx.normalizeUserRole(usuario.perfil || ctx.getCurrentRole()));
    ctx.resetBetaWorkspaceTabs();
    ctx.writeAuthenticatedProfile({
      name: ctx.getCurrentUser(),
      role: ctx.getCurrentRole()
    });
  }

  function readStoredSessionToken(ctx) {
    if (ctx.authStoreReadStoredSessionToken) {
      return ctx.authStoreReadStoredSessionToken();
    }
    return "";
  }

  function writeStoredSessionToken(token, ctx) {
    if (ctx.authStoreWriteStoredSessionToken) {
      ctx.authStoreWriteStoredSessionToken(token);
    }
  }

  function clearStoredSessionToken(ctx) {
    if (ctx.authStoreClearStoredSessionToken) {
      ctx.authStoreClearStoredSessionToken();
    }
  }

  root.authSessionUtils = {
    setAuthMessage: setAuthMessage,
    showAuthGate: showAuthGate,
    hideAuthGate: hideAuthGate,
    extractApiError: extractApiError,
    setAuthenticatedUser: setAuthenticatedUser,
    redirectToAuth: redirectToAuth,
    readStoredSessionToken: readStoredSessionToken,
    writeStoredSessionToken: writeStoredSessionToken,
    clearStoredSessionToken: clearStoredSessionToken
  };
})(typeof window !== "undefined" ? window : globalThis);

