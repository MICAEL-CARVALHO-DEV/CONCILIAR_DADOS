(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function applyAccessProfile(ctx) {
    var isOwner = ctx.currentRole === "PROGRAMADOR";
    var readOnlyMeta = ctx.getReadOnlyRoleMeta();
    var canManageData = ["APG", "SUPERVISAO", "POWERBI", "PROGRAMADOR"].indexOf(String(ctx.currentRole || "").trim().toUpperCase()) >= 0;
    var canCreateProfiles = isOwner;
    var isWorkspaceOperational = typeof ctx.isWorkspaceOperational === "function" ? !!ctx.isWorkspaceOperational() : true;
    var canUseWorkspaceDataset = typeof ctx.canUseWorkspaceDataset === "function" ? !!ctx.canUseWorkspaceDataset() : isWorkspaceOperational;
    var canUseDemoTools = typeof ctx.canUseDemoTools === "function" ? !!ctx.canUseDemoTools() : false;
    var canImportData = canUseWorkspaceDataset && (typeof ctx.canImportData === "function" ? !!ctx.canImportData() : canManageData);
    var apiTag = ctx.apiOnline ? "API online" : "modo local";
    var storageTag = ctx.getStorageMode() === ctx.STORAGE_MODE_LOCAL ? "persistencia local" : "sessao";
    var viewTag = isOwner ? " (dono)" : (readOnlyMeta ? readOnlyMeta.viewTag : "");

    if (ctx.currentUserInfo) {
      ctx.currentUserInfo.textContent = "Usuario: " + ctx.currentUser + " / " + ctx.currentRole + viewTag + " | " + apiTag + " | " + storageTag;
    }

    if (ctx.btnExportAtuais) ctx.btnExportAtuais.style.display = canUseWorkspaceDataset ? "inline-block" : "none";
    if (ctx.btnExportHistorico) ctx.btnExportHistorico.style.display = canUseWorkspaceDataset ? "inline-block" : "none";
    if (ctx.btnExportCustom) ctx.btnExportCustom.style.display = canUseWorkspaceDataset ? "inline-block" : "none";
    if (ctx.btnPendingApprovals) ctx.btnPendingApprovals.style.display = isOwner && isWorkspaceOperational ? "inline-block" : "none";
    if (ctx.btnCreateProfile) ctx.btnCreateProfile.style.display = canCreateProfiles ? "inline-block" : "none";
    if (ctx.importLabel) ctx.importLabel.style.display = canImportData ? "inline-block" : "none";
    if (ctx.btnReset) ctx.btnReset.style.display = isOwner && canUseDemoTools ? "inline-block" : "none";
    if (ctx.btnDemo4Users) ctx.btnDemo4Users.style.display = isOwner && canUseDemoTools ? "inline-block" : "none";
    if (ctx.btnProfile) ctx.btnProfile.style.display = "inline-block";
    if (ctx.btnLogout) ctx.btnLogout.style.display = "inline-block";

    if (isWorkspaceOperational) {
      ctx.renderRoleNotice();
      ctx.renderSupervisorQuickPanel();
      ctx.applyModalAccessProfile();
      ctx.syncBetaAuditPolling();
      ctx.syncBetaSupportPolling();
    }
    ctx.refreshProfileModal();
  }

  root.accessProfileUtils = {
    applyAccessProfile: applyAccessProfile
  };
})(typeof window !== "undefined" ? window : globalThis);

