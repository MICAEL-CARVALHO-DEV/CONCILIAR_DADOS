(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};
  var storageUtils = root.storageUtils;

  function withDefaults(keys) {
    var cfg = keys && typeof keys === "object" ? keys : {};
    return {
      userName: cfg.userName || "SEC_USER_NAME",
      userRole: cfg.userRole || "SEC_USER_ROLE",
      sessionToken: cfg.sessionToken || "SEC_SESSION_TOKEN",
      sessionTokenBackup: cfg.sessionTokenBackup || "SEC_SESSION_TOKEN_BKP"
    };
  }

  function readStoredSessionToken(keys) {
    var cfg = withDefaults(keys);
    if (storageUtils && typeof storageUtils.readSessionToken === "function") {
      return storageUtils.readSessionToken(cfg.sessionToken, cfg.sessionTokenBackup);
    }
    return "";
  }

  function writeStoredSessionToken(token, keys) {
    var cfg = withDefaults(keys);
    if (storageUtils && typeof storageUtils.writeSessionToken === "function") {
      storageUtils.writeSessionToken(token, cfg.sessionToken, cfg.sessionTokenBackup);
    }
  }

  function clearStoredSessionToken(keys) {
    var cfg = withDefaults(keys);
    if (storageUtils && typeof storageUtils.clearSessionToken === "function") {
      storageUtils.clearSessionToken(cfg.sessionToken, cfg.sessionTokenBackup);
    }
  }

  function readAuthenticatedUser(keys) {
    var cfg = withDefaults(keys);
    return {
      name: storageUtils ? storageUtils.safeGetItem(global.localStorage, cfg.userName).trim() : "",
      role: storageUtils ? storageUtils.safeGetItem(global.localStorage, cfg.userRole).trim() : ""
    };
  }

  function writeAuthenticatedUser(user, keys) {
    var cfg = withDefaults(keys);
    var nextUser = user && user.name != null ? String(user.name).trim() : "";
    var nextRole = user && user.role != null ? String(user.role).trim() : "";
    if (storageUtils) {
      if (nextUser) storageUtils.safeSetItem(global.localStorage, cfg.userName, nextUser);
      if (nextRole) storageUtils.safeSetItem(global.localStorage, cfg.userRole, nextRole);
    }
  }

  function clearAuthenticatedUser(keys) {
    var cfg = withDefaults(keys);
    if (storageUtils) {
      storageUtils.safeRemoveItem(global.localStorage, cfg.userName);
      storageUtils.safeRemoveItem(global.localStorage, cfg.userRole);
    }
  }

  function redirectToAuth(page, query, nextPath) {
    var target = page || "login.html";
    var suffix = query ? (String(query).startsWith("?") ? String(query) : "?" + String(query)) : "";
    var next = encodeURIComponent(nextPath || "index.html");
    var hasQuery = suffix.indexOf("?") >= 0;
    var finalUrl = target + suffix + (hasQuery ? "&" : "?") + "next=" + next;
    if (!global.location.pathname.toLowerCase().endsWith("/" + target.toLowerCase())) {
      global.location.href = finalUrl;
    }
  }

  root.authStore = {
    readStoredSessionToken: readStoredSessionToken,
    writeStoredSessionToken: writeStoredSessionToken,
    clearStoredSessionToken: clearStoredSessionToken,
    readAuthenticatedUser: readAuthenticatedUser,
    writeAuthenticatedUser: writeAuthenticatedUser,
    clearAuthenticatedUser: clearAuthenticatedUser,
    redirectToAuth: redirectToAuth
  };
})(window);
