(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function applyAccessProfile(ctx) {
    var isOwner = ctx.currentRole === "PROGRAMADOR";
    var readOnlyMeta = ctx.getReadOnlyRoleMeta();
    var canManageData = ["APG", "SUPERVISAO", "POWERBI", "PROGRAMADOR"].indexOf(String(ctx.currentRole || "").trim().toUpperCase()) >= 0;
    var canCreateProfiles = isOwner;
    var isCentralSyncMode = typeof ctx.isCentralSyncMode === "function" ? !!ctx.isCentralSyncMode() : false;
    var canOperateCentralData = typeof ctx.canOperateCentralData === "function" ? !!ctx.canOperateCentralData() : true;
    var isWorkspaceOperational = typeof ctx.isWorkspaceOperational === "function" ? !!ctx.isWorkspaceOperational() : true;
    var canUseWorkspaceDataset = typeof ctx.canUseWorkspaceDataset === "function" ? !!ctx.canUseWorkspaceDataset() : isWorkspaceOperational;
    var canUseDemoTools = typeof ctx.canUseDemoTools === "function" ? !!ctx.canUseDemoTools() : false;
    var canImportData = canUseWorkspaceDataset
      && (typeof ctx.canImportData === "function" ? !!ctx.canImportData() : canManageData)
      && (!isCentralSyncMode || canOperateCentralData);
    var apiTag = isCentralSyncMode
      ? (ctx.apiOnline ? "base central online" : "base central offline")
      : (ctx.apiOnline ? "API online" : "modo local");
    var storageTag = isCentralSyncMode
      ? "cache de sessao"
      : (ctx.getStorageMode() === ctx.STORAGE_MODE_LOCAL ? "persistencia local" : "sessao");
    var viewTag = isOwner ? " (dono)" : (readOnlyMeta ? readOnlyMeta.viewTag : "");
    var userName = String(ctx.currentUser || "").trim() || "Usuario";
    var userRole = String(ctx.currentRole || "").trim() || "PERFIL";
    var userHandle = "@" + userName.toLowerCase().replace(/\s+/g, ".");
    var avatarLetters = typeof ctx.buildUserAvatarLetters === "function"
      ? String(ctx.buildUserAvatarLetters(userName) || "SE")
      : "SE";

    if (ctx.currentUserInfo) {
      ctx.currentUserInfo.textContent = apiTag + " | " + storageTag;
    }
    if (ctx.sidebarUserName) {
      ctx.sidebarUserName.textContent = userName;
    }
    if (ctx.sidebarUserRole) {
      ctx.sidebarUserRole.textContent = userRole + viewTag;
    }
    if (ctx.sidebarUserMenuName) {
      ctx.sidebarUserMenuName.textContent = userName;
    }
    if (ctx.sidebarUserMenuHandle) {
      ctx.sidebarUserMenuHandle.textContent = userHandle;
    }
    if (ctx.sidebarUserAvatar) {
      ctx.sidebarUserAvatar.textContent = avatarLetters;
      ctx.sidebarUserAvatar.setAttribute("title", userName + " (" + userRole + ")");
    }

    if (ctx.btnExportAtuais) ctx.btnExportAtuais.style.display = canUseWorkspaceDataset ? "inline-block" : "none";
    if (ctx.btnExportHistorico) ctx.btnExportHistorico.style.display = canUseWorkspaceDataset ? "inline-block" : "none";
    if (ctx.btnExportCustom) ctx.btnExportCustom.style.display = canUseWorkspaceDataset ? "inline-block" : "none";
    if (ctx.btnPendingApprovals) ctx.btnPendingApprovals.style.display = isOwner && isWorkspaceOperational ? "flex" : "none";
    if (ctx.btnCreateProfile) ctx.btnCreateProfile.style.display = canCreateProfiles ? "inline-block" : "none";
    if (ctx.importLabel) ctx.importLabel.style.display = canImportData ? "inline-block" : "none";
    if (ctx.fileCsv) ctx.fileCsv.disabled = !canImportData;
    if (ctx.btnReset) ctx.btnReset.style.display = isOwner && canUseDemoTools ? "inline-block" : "none";
    if (ctx.btnDemo4Users) ctx.btnDemo4Users.style.display = isOwner && canUseDemoTools ? "inline-block" : "none";
    if (ctx.btnProfile) ctx.btnProfile.style.display = "flex";
    if (ctx.btnChangePassword) ctx.btnChangePassword.style.display = "flex";
    if (ctx.btnLogout) ctx.btnLogout.style.display = "flex";

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

