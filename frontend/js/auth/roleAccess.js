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

  function isSupportManagerUser(ctx) {
    return Array.isArray(ctx.supportManagerRoles) && ctx.supportManagerRoles.indexOf(ctx.currentRole) >= 0;
  }

  function isProgramadorUser(ctx) {
    return String((ctx || {}).currentRole || "").trim().toUpperCase() === "PROGRAMADOR";
  }

  function getReadOnlyRoleMeta(ctx) {
    if (isSupervisorUser(ctx)) {
      return {
        key: "SUPERVISAO",
        viewTag: " (supervisao)",
        noticeTitle: "Modo supervisao: somente monitoramento",
        noticeDescription: "Este perfil acompanha andamento e auditoria em tempo real, sem alterar dados.",
        modalReadOnlyMessage: "MODO LEITURA: perfil SUPERVISAO monitora, sem alterar dados.",
        lockModeLabel: "Modo supervisao (leitura)"
      };
    }
    if (isPowerBiUser(ctx)) {
      return {
        key: "POWERBI",
        viewTag: " (power bi)",
        noticeTitle: "Modo Power BI: leitura analitica",
        noticeDescription: "Este perfil consulta historico, indicadores e visao consolidada, sem alterar dados.",
        modalReadOnlyMessage: "MODO LEITURA: perfil POWERBI consulta indicadores e historico, sem alterar dados.",
        lockModeLabel: "Modo Power BI (leitura)"
      };
    }
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
    return !!ctx.currentUser && !!ctx.workspaceAllowsImport;
  }

  function canMutateRecords(ctx) {
    return !!ctx.workspaceAllowsMutation && !isReadOnlyRoleUser(ctx);
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

