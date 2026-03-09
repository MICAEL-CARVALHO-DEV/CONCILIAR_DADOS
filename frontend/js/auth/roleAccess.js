(function (globalScope) {
  "use strict";

  var root = globalScope.SEC_FRONTEND = globalScope.SEC_FRONTEND || {};

  function isSupervisorUser(ctx) {
    return ctx.currentRole === "SUPERVISAO";
  }

  function isPowerBiUser(ctx) {
    return ctx.currentRole === "POWERBI";
  }

  function isSupportManagerUser(ctx) {
    return Array.isArray(ctx.supportManagerRoles) && ctx.supportManagerRoles.indexOf(ctx.currentRole) >= 0;
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
    return ctx.isApiEnabled() && ["APG", "SUPERVISAO", "POWERBI", "PROGRAMADOR"].indexOf(ctx.currentRole) >= 0;
  }

  function canUseSupportApi(ctx) {
    return ctx.isApiEnabled() && !!ctx.currentUser;
  }

  function canMutateRecords(ctx) {
    return !isReadOnlyRoleUser(ctx);
  }

  root.roleAccessUtils = {
    isSupervisorUser: isSupervisorUser,
    isPowerBiUser: isPowerBiUser,
    isSupportManagerUser: isSupportManagerUser,
    getReadOnlyRoleMeta: getReadOnlyRoleMeta,
    isReadOnlyRoleUser: isReadOnlyRoleUser,
    getReadOnlyRoleMessage: getReadOnlyRoleMessage,
    getReadOnlyRoleLockLabel: getReadOnlyRoleLockLabel,
    canViewGlobalAuditApi: canViewGlobalAuditApi,
    canUseSupportApi: canUseSupportApi,
    canMutateRecords: canMutateRecords
  };
})(typeof window !== "undefined" ? window : globalThis);
