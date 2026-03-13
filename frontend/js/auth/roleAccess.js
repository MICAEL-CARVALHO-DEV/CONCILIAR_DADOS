(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function isSupervisorUser(ctx) {
    return ctx.currentRole === "SUPERVISAO";
  }

  function isPowerBiUser(ctx) {
    return ctx.currentRole === "POWERBI";
  }

  function isOperationalRoleUser(ctx) {
    return ["APG", "SUPERVISAO", "POWERBI", "PROGRAMADOR"].indexOf(String((ctx || {}).currentRole || "").trim().toUpperCase()) >= 0;
  }

  function isSupportManagerUser(ctx) {
    return Array.isArray(ctx.supportManagerRoles) && ctx.supportManagerRoles.indexOf(ctx.currentRole) >= 0;
  }

  function isProgramadorUser(ctx) {
    return String((ctx || {}).currentRole || "").trim().toUpperCase() === "PROGRAMADOR";
  }

  function getReadOnlyRoleMeta(ctx) {
    if (!ctx) return null;
    return null;
  }

  function isReadOnlyRoleUser(ctx) {
    return !!getReadOnlyRoleMeta(ctx);
  }

  function getReadOnlyRoleMessage(ctx) {
    var meta = getReadOnlyRoleMeta(ctx);
    return meta ? meta.modalReadOnlyMessage : "";
  }

  function getReadOnlyRoleLockLabel(ctx) {
    var meta = getReadOnlyRoleMeta(ctx);
    return meta ? meta.lockModeLabel : "Modo leitura";
  }

  function canViewGlobalAuditApi(ctx) {
    return String(ctx.workspaceMode || "operational") === "operational" && ctx.isApiEnabled() && ["APG", "SUPERVISAO", "POWERBI", "PROGRAMADOR"].indexOf(ctx.currentRole) >= 0;
  }

  function canUseSupportApi(ctx) {
    return String(ctx.workspaceMode || "operational") === "operational" && ctx.isApiEnabled() && !!ctx.currentUser;
  }

  function canImportData(ctx) {
    var canUsePreviewApi = false;
    if (typeof ctx.isImportPreviewApiEnabled === "function") {
      canUsePreviewApi = !!ctx.isImportPreviewApiEnabled();
    } else if (typeof ctx.isApiEnabled === "function") {
      canUsePreviewApi = !!ctx.isApiEnabled();
    }
    return !!ctx.currentUser
      && !!ctx.workspaceAllowsImport
      && isOperationalRoleUser(ctx)
      && canUsePreviewApi;
  }

  function canMutateRecords(ctx) {
    return !!ctx.workspaceAllowsMutation && isOperationalRoleUser(ctx) && !isReadOnlyRoleUser(ctx);
  }

  root.roleAccessUtils = {
    isSupervisorUser: isSupervisorUser,
    isPowerBiUser: isPowerBiUser,
    isSupportManagerUser: isSupportManagerUser,
    isProgramadorUser: isProgramadorUser,
    getReadOnlyRoleMeta: getReadOnlyRoleMeta,
    isReadOnlyRoleUser: isReadOnlyRoleUser,
    getReadOnlyRoleMessage: getReadOnlyRoleMessage,
    getReadOnlyRoleLockLabel: getReadOnlyRoleLockLabel,
    canViewGlobalAuditApi: canViewGlobalAuditApi,
    canUseSupportApi: canUseSupportApi,
    canImportData: canImportData,
    canMutateRecords: canMutateRecords
  };
})(typeof window !== "undefined" ? window : globalThis);

