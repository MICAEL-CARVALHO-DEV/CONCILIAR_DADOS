(function (globalScope) {
  "use strict";

  var root = globalScope.SEC_FRONTEND = globalScope.SEC_FRONTEND || {};

  function applyAccessProfile(ctx) {
    var isOwner = ctx.currentRole === "PROGRAMADOR";
    var readOnlyMeta = ctx.getReadOnlyRoleMeta();
    var canManageData = isOwner || ctx.currentRole === "APG";
    var canCreateProfiles = isOwner;
    var apiTag = ctx.apiOnline ? "API online" : "modo local";
    var storageTag = ctx.getStorageMode() === ctx.STORAGE_MODE_LOCAL ? "persistencia local" : "sessao";
    var viewTag = isOwner ? " (dono)" : (readOnlyMeta ? readOnlyMeta.viewTag : "");

    if (ctx.currentUserInfo) {
      ctx.currentUserInfo.textContent = "Usuario: " + ctx.currentUser + " / " + ctx.currentRole + viewTag + " | " + apiTag + " | " + storageTag;
    }

    if (ctx.btnExportAtuais) ctx.btnExportAtuais.style.display = "inline-block";
    if (ctx.btnExportHistorico) ctx.btnExportHistorico.style.display = "inline-block";
    if (ctx.btnExportCustom) ctx.btnExportCustom.style.display = "inline-block";
    if (ctx.btnPendingApprovals) ctx.btnPendingApprovals.style.display = isOwner ? "inline-block" : "none";
    if (ctx.btnCreateProfile) ctx.btnCreateProfile.style.display = canCreateProfiles ? "inline-block" : "none";
    if (ctx.importLabel) ctx.importLabel.style.display = canManageData ? "inline-block" : "none";
    if (ctx.btnReset) ctx.btnReset.style.display = isOwner ? "inline-block" : "none";
    if (ctx.btnDemo4Users) ctx.btnDemo4Users.style.display = isOwner ? "inline-block" : "none";
    if (ctx.btnProfile) ctx.btnProfile.style.display = "inline-block";
    if (ctx.btnLogout) ctx.btnLogout.style.display = "inline-block";

    ctx.renderRoleNotice();
    ctx.renderSupervisorQuickPanel();
    ctx.applyModalAccessProfile();
    ctx.syncBetaAuditPolling();
    ctx.syncBetaSupportPolling();
    ctx.refreshProfileModal();
  }

  root.accessProfileUtils = {
    applyAccessProfile: applyAccessProfile
  };
})(typeof window !== "undefined" ? window : globalThis);
