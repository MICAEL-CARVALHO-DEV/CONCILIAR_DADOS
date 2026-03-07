(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function safeGetItem(storage, key) {
    try {
      return storage ? String(storage.getItem(key) || "") : "";
    } catch (_err) {
      return "";
    }
  }

  function safeSetItem(storage, key, value) {
    try {
      if (!storage) return false;
      storage.setItem(key, String(value));
      return true;
    } catch (_err) {
      return false;
    }
  }

  function safeRemoveItem(storage, key) {
    try {
      if (!storage) return false;
      storage.removeItem(key);
      return true;
    } catch (_err) {
      return false;
    }
  }

  function readSessionToken(sessionKey, backupKey) {
    var sessionToken = safeGetItem(global.sessionStorage, sessionKey).trim();
    if (sessionToken) {
      safeSetItem(global.localStorage, backupKey, sessionToken);
      return sessionToken;
    }

    var backupToken = safeGetItem(global.localStorage, backupKey).trim();
    if (backupToken) {
      safeSetItem(global.sessionStorage, sessionKey, backupToken);
      return backupToken;
    }
    return "";
  }

  function writeSessionToken(token, sessionKey, backupKey) {
    var raw = String(token || "").trim();
    if (!raw) {
      clearSessionToken(sessionKey, backupKey);
      return;
    }
    safeSetItem(global.sessionStorage, sessionKey, raw);
    safeSetItem(global.localStorage, backupKey, raw);
  }

  function clearSessionToken(sessionKey, backupKey) {
    safeRemoveItem(global.sessionStorage, sessionKey);
    safeRemoveItem(global.localStorage, backupKey);
  }

  root.storageUtils = {
    safeGetItem: safeGetItem,
    safeSetItem: safeSetItem,
    safeRemoveItem: safeRemoveItem,
    readSessionToken: readSessionToken,
    writeSessionToken: writeSessionToken,
    clearSessionToken: clearSessionToken
  };
})(window);
