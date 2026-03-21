(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  var STORAGE_MODE_KEY_DEFAULT = "SEC_STORAGE_MODE";
  var STORAGE_MODE_LOCAL = "local";
  var STORAGE_MODE_SESSION = "session";

  function getRuntimeConfig() {
    return global.SEC_APP_CONFIG && typeof global.SEC_APP_CONFIG === "object"
      ? global.SEC_APP_CONFIG
      : {};
  }

  function getCurrentHost() {
    return global.location && global.location.hostname
      ? String(global.location.hostname || "").trim().toLowerCase()
      : "";
  }

  function isLocalHost(host) {
    return !host || host === "localhost" || host === "127.0.0.1";
  }

  function readRuntimeAppEnv() {
    var cfg = getRuntimeConfig();
    var host = getCurrentHost();
    var raw = String(cfg.APP_ENV || "local").trim().toLowerCase();
    if (isLocalHost(host) && (raw === "prod" || raw === "production")) return "local";
    if (raw === "prod") return "production";
    return raw || "local";
  }

  function isCentralSyncMode() {
    var host = getCurrentHost();
    return !isLocalHost(host) && readRuntimeAppEnv() === "production";
  }

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

  function toText(value) {
    return value == null ? "" : String(value);
  }

  function readStorageValue(storage, key) {
    return toText(safeGetItem(storage, key)).trim();
  }

  function writeStorageValue(storage, key, value) {
    var raw = toText(value);
    return safeSetItem(storage, key, raw);
  }

  function removeStorageValue(storage, key) {
    return safeRemoveItem(storage, key);
  }

  function getStorageMode(storageModeKey) {
    if (isCentralSyncMode()) return STORAGE_MODE_SESSION;
    var key = toText(storageModeKey || STORAGE_MODE_KEY_DEFAULT).trim() || STORAGE_MODE_KEY_DEFAULT;
    return readStorageValue(global.localStorage, key).toLowerCase() === STORAGE_MODE_LOCAL
      ? STORAGE_MODE_LOCAL
      : STORAGE_MODE_SESSION;
  }

  function getPrimaryStorage(storageModeKey) {
    return getStorageMode(storageModeKey) === STORAGE_MODE_LOCAL
      ? global.localStorage
      : global.sessionStorage;
  }

  function getSecondaryStorage(storageModeKey) {
    return getStorageMode(storageModeKey) === STORAGE_MODE_LOCAL
      ? global.sessionStorage
      : global.localStorage;
  }

  function readSessionToken(sessionKey, backupKey) {
    var sessionToken = safeGetItem(global.sessionStorage, sessionKey).trim();
    if (sessionToken) {
      safeRemoveItem(global.localStorage, backupKey);
      return sessionToken;
    }

    var backupToken = safeGetItem(global.localStorage, backupKey).trim();
    if (backupToken) {
      safeSetItem(global.sessionStorage, sessionKey, backupToken);
      safeRemoveItem(global.localStorage, backupKey);
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
    safeRemoveItem(global.localStorage, backupKey);
  }

  function clearSessionToken(sessionKey, backupKey) {
    safeRemoveItem(global.sessionStorage, sessionKey);
    safeRemoveItem(global.localStorage, backupKey);
  }

  root.storageUtils = {
    safeGetItem: safeGetItem,
    safeSetItem: safeSetItem,
    safeRemoveItem: safeRemoveItem,
    readStorageValue: readStorageValue,
    writeStorageValue: writeStorageValue,
    removeStorageValue: removeStorageValue,
    isCentralSyncMode: isCentralSyncMode,
    getStorageMode: getStorageMode,
    getPrimaryStorage: getPrimaryStorage,
    getSecondaryStorage: getSecondaryStorage,
    readSessionToken: readSessionToken,
    writeSessionToken: writeSessionToken,
    clearSessionToken: clearSessionToken
  };
})(window);
