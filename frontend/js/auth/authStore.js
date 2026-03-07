(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};
  var storageUtils = root.storageUtils;

  function fallbackGetItem(storage, key) {
    try {
      return String(storage && storage.getItem ? storage.getItem(key) || "" : "").trim();
    } catch (_err) {
      return "";
    }
  }

  function fallbackSetItem(storage, key, value) {
    try {
      if (!storage || !storage.setItem) return false;
      storage.setItem(key, String(value == null ? "" : value));
      return true;
    } catch (_err) {
      return false;
    }
  }

  function fallbackRemoveItem(storage, key) {
    try {
      if (!storage || !storage.removeItem) return false;
      storage.removeItem(key);
      return true;
    } catch (_err) {
      return false;
    }
  }

  function withDefaults(keys) {
    var cfg = keys && typeof keys === "object" ? keys : {};
    return {
      userName: cfg.userName || "SEC_USER_NAME",
      userRole: cfg.userRole || "SEC_USER_ROLE",
      legacyUserId: cfg.legacyUserId || "SEC_USER_ID",
      sessionToken: cfg.sessionToken || "SEC_SESSION_TOKEN",
      sessionTokenBackup: cfg.sessionTokenBackup || "SEC_SESSION_TOKEN_BKP"
    };
  }

  function readStoredSessionToken(keys) {
    var cfg = withDefaults(keys);
    if (storageUtils && typeof storageUtils.readSessionToken === "function") {
      return storageUtils.readSessionToken(cfg.sessionToken, cfg.sessionTokenBackup);
    }
    var sessionToken = fallbackGetItem(global.sessionStorage, cfg.sessionToken);
    if (sessionToken) {
      fallbackSetItem(global.localStorage, cfg.sessionTokenBackup, sessionToken);
      return sessionToken;
    }
    var backupToken = fallbackGetItem(global.localStorage, cfg.sessionTokenBackup);
    if (backupToken) {
      fallbackSetItem(global.sessionStorage, cfg.sessionToken, backupToken);
      return backupToken;
    }
    return "";
  }

  function writeStoredSessionToken(token, keys) {
    var cfg = withDefaults(keys);
    if (storageUtils && typeof storageUtils.writeSessionToken === "function") {
      storageUtils.writeSessionToken(token, cfg.sessionToken, cfg.sessionTokenBackup);
      return;
    }
    var raw = String(token == null ? "" : token).trim();
    if (!raw) {
      clearStoredSessionToken(cfg);
      return;
    }
    fallbackSetItem(global.sessionStorage, cfg.sessionToken, raw);
    fallbackSetItem(global.localStorage, cfg.sessionTokenBackup, raw);
  }

  function clearStoredSessionToken(keys) {
    var cfg = withDefaults(keys);
    if (storageUtils && typeof storageUtils.clearSessionToken === "function") {
      storageUtils.clearSessionToken(cfg.sessionToken, cfg.sessionTokenBackup);
      return;
    }
    fallbackRemoveItem(global.sessionStorage, cfg.sessionToken);
    fallbackRemoveItem(global.localStorage, cfg.sessionTokenBackup);
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

  function readAuthenticatedProfile(keys) {
    var user = readAuthenticatedUser(keys);
    return {
      name: user.name,
      role: user.role
    };
  }

  function writeAuthenticatedProfile(profile, keys) {
    writeAuthenticatedUser(profile || {}, keys);
  }

  function clearSessionAndProfile(keys) {
    var cfg = withDefaults(keys);
    clearStoredSessionToken(cfg);
    clearAuthenticatedUser(cfg);
  }

  function readLegacyAuthenticatedProfile(keys) {
    var cfg = withDefaults(keys);
    if (!storageUtils) return { name: "", role: "" };
    return {
      name: storageUtils.safeGetItem(global.localStorage, cfg.legacyUserId).trim(),
      role: ""
    };
  }

  function hasStoredSession(keys) {
    return !!readStoredSessionToken(keys);
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
    clearSessionAndProfile: clearSessionAndProfile,
    readAuthenticatedUser: readAuthenticatedUser,
    writeAuthenticatedUser: writeAuthenticatedUser,
    readAuthenticatedProfile: readAuthenticatedProfile,
    writeAuthenticatedProfile: writeAuthenticatedProfile,
    hasStoredSession: hasStoredSession,
    readLegacyAuthenticatedProfile: readLegacyAuthenticatedProfile,
    clearAuthenticatedUser: clearAuthenticatedUser,
    redirectToAuth: redirectToAuth
  };
})(window);
