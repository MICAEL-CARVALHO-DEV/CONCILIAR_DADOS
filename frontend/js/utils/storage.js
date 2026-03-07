(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  var STORAGE_MODE_KEY_DEFAULT = "SEC_STORAGE_MODE";
  var STORAGE_MODE_LOCAL = "local";
  var STORAGE_MODE_SESSION = "session";

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
    readStorageValue: readStorageValue,
    writeStorageValue: writeStorageValue,
    removeStorageValue: removeStorageValue,
    getStorageMode: getStorageMode,
    getPrimaryStorage: getPrimaryStorage,
    getSecondaryStorage: getSecondaryStorage,
    readSessionToken: readSessionToken,
    writeSessionToken: writeSessionToken,
    clearSessionToken: clearSessionToken
  };
})(window);
