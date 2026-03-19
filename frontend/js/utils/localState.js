(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function syncActiveUsersCache(records, ctx) {
    (records || []).forEach(function (rec) {
      rec.active_users = ctx.getActiveUsersWithLastMark(rec).map(function (u) {
        return {
          name: u.name,
          role: u.role,
          lastStatus: u.lastStatus,
          lastAt: u.lastAt
        };
      });
    });
  }

  function notifyStateUpdated(ctx) {
    if (ctx.stateChannel) {
      ctx.stateChannel.postMessage({ type: "state_updated", at: Date.now(), tabId: ctx.localTabId, workspaceKey: ctx.workspaceKey });
    }
    ctx.writeStorageValue(globalScope.localStorage, ctx.crossTabPingKey, String(Date.now()));
  }

  function loadState(ctx) {
    try {
      if (ctx.ignorePersistedState) {
        return { records: ctx.deepClone(ctx.seedRecords || []) };
      }

      if (typeof ctx.isCentralSyncMode === "function" && ctx.isCentralSyncMode()) {
        var rawCentral = ctx.readStorageValue(globalScope.sessionStorage, ctx.storageKey);
        if (rawCentral) {
          var parsedCentral = JSON.parse(rawCentral);
          if (parsedCentral && Array.isArray(parsedCentral.records)) return parsedCentral;
        }
        return { records: [] };
      }

      var primary = ctx.getPrimaryStorage();
      var secondary = ctx.getSecondaryStorage();
      var raw = ctx.readStorageValue(primary, ctx.storageKey);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.records)) return parsed;
      }

      var rawSecondary = ctx.readStorageValue(secondary, ctx.storageKey);
      if (rawSecondary) {
        var parsedSecondary = JSON.parse(rawSecondary);
        if (parsedSecondary && Array.isArray(parsedSecondary.records)) return parsedSecondary;
      }

      for (var i = 0; i < ctx.legacyStorageKeys.length; i += 1) {
        var legacyRaw = ctx.readStorageValue(globalScope.localStorage, ctx.legacyStorageKeys[i]);
        if (!legacyRaw) continue;
        var parsedLegacy = JSON.parse(legacyRaw);
        if (parsedLegacy && Array.isArray(parsedLegacy.records)) return { records: parsedLegacy.records };
      }

      return { records: ctx.deepClone(ctx.seedRecords || []) };
    } catch (_err) {
      return { records: ctx.deepClone(ctx.seedRecords || []) };
    }
  }

  function refreshStateFromStorage(ctx) {
    var loaded = loadState(ctx);
    var nextState = { records: (loaded.records || []).map(ctx.normalizeRecordShape) };
    ctx.setState(nextState);
    if (typeof ctx.afterLoadState === "function") ctx.afterLoadState(nextState);
    ctx.migrateLegacyStatusRecords(nextState.records);
    ctx.syncReferenceKeys(nextState.records);
    ctx.syncYearFilter();
    ctx.render();
  }

  function saveState(silentSync, ctx) {
    var currentState = ctx.getState();
    syncActiveUsersCache(currentState.records || [], ctx);
    var data = JSON.stringify(currentState);
    if (typeof ctx.isCentralSyncMode === "function" && ctx.isCentralSyncMode()) {
      globalScope.sessionStorage.setItem(ctx.storageKey, data);
      globalScope.localStorage.removeItem(ctx.storageKey);
      if (!silentSync) notifyStateUpdated(ctx);
      return;
    }
    var primary = ctx.getPrimaryStorage();
    var secondary = ctx.getSecondaryStorage();
    primary.setItem(ctx.storageKey, data);
    secondary.removeItem(ctx.storageKey);
    if (!silentSync) notifyStateUpdated(ctx);
  }

  root.localStateUtils = {
    syncActiveUsersCache: syncActiveUsersCache,
    notifyStateUpdated: notifyStateUpdated,
    loadState: loadState,
    refreshStateFromStorage: refreshStateFromStorage,
    saveState: saveState
  };
})(typeof window !== "undefined" ? window : globalThis);

