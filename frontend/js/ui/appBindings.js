(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function noop() {}

  function bindUiShellEvents(options) {
    var opts = options || {};
    var render = typeof opts.render === "function" ? opts.render : noop;
    var debounce = typeof opts.debounce === "function" ? opts.debounce : function (fn) { return fn; };
    var openProfileModal = typeof opts.openProfileModal === "function" ? opts.openProfileModal : noop;
    var openChangePasswordModal = typeof opts.openChangePasswordModal === "function" ? opts.openChangePasswordModal : noop;
    var logoutCurrentUser = typeof opts.logoutCurrentUser === "function" ? opts.logoutCurrentUser : function () { return Promise.resolve(); };
    var redirectToAuth = typeof opts.redirectToAuth === "function" ? opts.redirectToAuth : noop;
    var generateRandomMultiUserDemo = typeof opts.generateRandomMultiUserDemo === "function" ? opts.generateRandomMultiUserDemo : noop;
    var requestCloseModal = typeof opts.requestCloseModal === "function" ? opts.requestCloseModal : noop;
    var clearModalAutosaveTimer = typeof opts.clearModalAutosaveTimer === "function" ? opts.clearModalAutosaveTimer : noop;
    var clearModalAutoCloseTimer = typeof opts.clearModalAutoCloseTimer === "function" ? opts.clearModalAutoCloseTimer : noop;
    var saveModalDraftChanges = typeof opts.saveModalDraftChanges === "function" ? opts.saveModalDraftChanges : function () { return Promise.resolve(false); };
    var forceCloseModal = typeof opts.forceCloseModal === "function" ? opts.forceCloseModal : noop;
    var updateModalDraftUi = typeof opts.updateModalDraftUi === "function" ? opts.updateModalDraftUi : noop;
    var scheduleModalAutosave = typeof opts.scheduleModalAutosave === "function" ? opts.scheduleModalAutosave : noop;
    var isUnsafeReloadShortcut = typeof opts.isUnsafeReloadShortcut === "function" ? opts.isUnsafeReloadShortcut : function () { return false; };
    var hasPendingModalDraft = typeof opts.hasPendingModalDraft === "function" ? opts.hasPendingModalDraft : function () { return false; };
    var showModalSaveFeedback = typeof opts.showModalSaveFeedback === "function" ? opts.showModalSaveFeedback : noop;
    var focusIfPossible = typeof opts.focusIfPossible === "function" ? opts.focusIfPossible : noop;
    var flushModalAutosave = typeof opts.flushModalAutosave === "function" ? opts.flushModalAutosave : noop;
    var getSelected = typeof opts.getSelected === "function" ? opts.getSelected : function () { return null; };
    var canMutateRecords = typeof opts.canMutateRecords === "function" ? opts.canMutateRecords : function () { return false; };
    var getReadOnlyRoleMessage = typeof opts.getReadOnlyRoleMessage === "function" ? opts.getReadOnlyRoleMessage : function () { return ""; };
    var normalizeStatus = typeof opts.normalizeStatus === "function" ? opts.normalizeStatus : function (value) { return value; };
    var btnMarkStatus = opts.btnMarkStatus || null;
    var markStatus = opts.markStatus || null;
    var markReason = opts.markReason || null;
    var modalDraftStateRef = typeof opts.getModalDraftState === "function" ? opts.getModalDraftState : function () { return null; };
    var btnExportOne = opts.btnExportOne || null;
    var exportOne = typeof opts.exportOne === "function" ? opts.exportOne : function () { return Promise.resolve(); };
    var btnExportAtuais = opts.btnExportAtuais || null;
    var btnExportHistorico = opts.btnExportHistorico || null;
    var btnExportCustom = opts.btnExportCustom || null;
    var btnExportCustomApply = opts.btnExportCustomApply || null;
    var btnExportCustomClose = opts.btnExportCustomClose || null;
    var btnExportCustomCancel = opts.btnExportCustomCancel || null;
    var exportCustomModal = opts.exportCustomModal || null;
    var openExportCustomModal = typeof opts.openExportCustomModal === "function" ? opts.openExportCustomModal : noop;
    var runExportAtuais = typeof opts.runExportAtuais === "function" ? opts.runExportAtuais : function () { return Promise.resolve(); };
    var runExportHistorico = typeof opts.runExportHistorico === "function" ? opts.runExportHistorico : function () { return Promise.resolve(); };
    var runCustomExport = typeof opts.runCustomExport === "function" ? opts.runCustomExport : function () { return Promise.resolve(false); };
    var closeExportCustomModal = typeof opts.closeExportCustomModal === "function" ? opts.closeExportCustomModal : noop;
    var refreshCustomExportSummary = typeof opts.refreshCustomExportSummary === "function" ? opts.refreshCustomExportSummary : noop;
    var exportCustomYear = opts.exportCustomYear || null;
    var exportCustomStatus = opts.exportCustomStatus || null;
    var exportCustomDeputado = opts.exportCustomDeputado || null;
    var exportCustomMunicipio = opts.exportCustomMunicipio || null;
    var exportCustomIncludeOld = opts.exportCustomIncludeOld || null;
    var btnProfileClose = opts.btnProfileClose || null;
    var btnProfileCloseX = opts.btnProfileCloseX || null;
    var closeProfileModal = typeof opts.closeProfileModal === "function" ? opts.closeProfileModal : noop;
    var profileModal = opts.profileModal || null;
    var btnChangePasswordClose = opts.btnChangePasswordClose || null;
    var btnChangePasswordCloseX = opts.btnChangePasswordCloseX || null;
    var closeChangePasswordModal = typeof opts.closeChangePasswordModal === "function" ? opts.closeChangePasswordModal : noop;
    var changePasswordModal = opts.changePasswordModal || null;
    var changePasswordForm = opts.changePasswordForm || null;
    var btnChangePasswordSubmit = opts.btnChangePasswordSubmit || null;
    var submitChangePassword = typeof opts.submitChangePassword === "function" ? opts.submitChangePassword : function () { return Promise.resolve(); };
    var btnPendingApprovals = opts.btnPendingApprovals || null;
    var openPendingUsersModal = typeof opts.openPendingUsersModal === "function" ? opts.openPendingUsersModal : noop;
    var btnPendingUsersClose = opts.btnPendingUsersClose || null;
    var btnPendingUsersCloseX = opts.btnPendingUsersCloseX || null;
    var closePendingUsersModal = typeof opts.closePendingUsersModal === "function" ? opts.closePendingUsersModal : noop;
    var btnPendingUsersRefresh = opts.btnPendingUsersRefresh || null;
    var refreshPendingUsersModal = typeof opts.refreshPendingUsersModal === "function" ? opts.refreshPendingUsersModal : noop;
    var pendingUsersModal = opts.pendingUsersModal || null;
    var pendingUsersTableWrap = opts.pendingUsersTableWrap || null;
    var approvePendingUser = typeof opts.approvePendingUser === "function" ? opts.approvePendingUser : function () { return Promise.resolve(); };
    var rejectPendingUser = typeof opts.rejectPendingUser === "function" ? opts.rejectPendingUser : function () { return Promise.resolve(); };
    var extractApiError = typeof opts.extractApiError === "function" ? opts.extractApiError : function (_err, fallback) { return String(fallback || "Falha."); };
    var setPendingUsersFeedback = typeof opts.setPendingUsersFeedback === "function" ? opts.setPendingUsersFeedback : noop;
    var statusFilter = opts.statusFilter || null;
    var yearFilter = opts.yearFilter || null;
    var searchInput = opts.searchInput || null;
    var btnSidebarToggle = opts.btnSidebarToggle || null;
    var toggleSidebarCollapsed = typeof opts.toggleSidebarCollapsed === "function" ? opts.toggleSidebarCollapsed : noop;
    var syncSidebarCollapsedByViewport = typeof opts.syncSidebarCollapsedByViewport === "function" ? opts.syncSidebarCollapsedByViewport : noop;
    var appSidebar = opts.appSidebar || null;
    var mainSectorStage = opts.mainSectorStage || null;
    var btnThemeToggle = opts.btnThemeToggle || null;
    var toggleThemeMode = typeof opts.toggleThemeMode === "function" ? opts.toggleThemeMode : noop;
    var sidebarUserMenuTrigger = opts.sidebarUserMenuTrigger || null;
    var sidebarUserMenuContainer = opts.sidebarUserMenuContainer || null;
    var sidebarUserMenuActions = opts.sidebarUserMenuActions || null;
    var btnProfile = opts.btnProfile || null;
    var btnChangePassword = opts.btnChangePassword || null;
    var btnLogout = opts.btnLogout || null;
    var btnDemo4Users = opts.btnDemo4Users || null;
    var modalClose = opts.modalClose || null;
    var modalClose2 = opts.modalClose2 || null;
    var modal = opts.modal || null;
    var btnKvSave = opts.btnKvSave || null;
    var modalAutoCloseTimerRef = typeof opts.setModalAutoCloseTimer === "function" ? opts.setModalAutoCloseTimer : noop;
    var authLoginPage = String(opts.authLoginPage || "frontend/pages/login.html");
    var sidebarMenuOpen = false;
    var sidebarInteractionActive = false;
    var sidebarFocusStrong = false;

    function setSidebarFocusStrong(nextStrong) {
      var body = global && global.document ? global.document.body : null;
      var isStrong = !!nextStrong;
      if (sidebarFocusStrong === isStrong) return;
      sidebarFocusStrong = isStrong;
      if (body) body.classList.toggle("sidebar-focus-strong", isStrong);
      if (mainSectorStage) mainSectorStage.classList.toggle("sidebar-focus-strong", isStrong);
      if (pendingUsersModal) pendingUsersModal.classList.toggle("sidebar-focus-strong", isStrong);
    }

    function syncSidebarFocusStrongState() {
      setSidebarFocusStrong(sidebarInteractionActive || sidebarMenuOpen);
    }

    function setSidebarUserMenuOpen(nextOpen) {
      if (!sidebarUserMenuContainer || !sidebarUserMenuTrigger || !sidebarUserMenuActions) return;
      sidebarMenuOpen = !!nextOpen;
      sidebarUserMenuContainer.classList.toggle("is-menu-open", sidebarMenuOpen);
      sidebarUserMenuTrigger.setAttribute("aria-expanded", sidebarMenuOpen ? "true" : "false");
      sidebarUserMenuActions.setAttribute("aria-hidden", sidebarMenuOpen ? "false" : "true");
      syncSidebarFocusStrongState();
    }

    function closeSidebarUserMenu() {
      setSidebarUserMenuOpen(false);
    }

    if (statusFilter) statusFilter.addEventListener("change", render);
    if (yearFilter) yearFilter.addEventListener("change", render);
    if (searchInput) searchInput.addEventListener("input", debounce(render, 120));
    syncSidebarCollapsedByViewport();
    if (btnSidebarToggle && btnSidebarToggle.getAttribute("data-sidebar-bound") !== "1") {
      btnSidebarToggle.setAttribute("data-sidebar-bound", "1");
      btnSidebarToggle.addEventListener("click", function () { toggleSidebarCollapsed(); });
    }
    if (appSidebar && appSidebar.getAttribute("data-sidebar-focus-strong-bound") !== "1") {
      appSidebar.setAttribute("data-sidebar-focus-strong-bound", "1");
      appSidebar.addEventListener("mouseenter", function () {
        sidebarInteractionActive = true;
        syncSidebarFocusStrongState();
      });
      appSidebar.addEventListener("mouseleave", function () {
        sidebarInteractionActive = false;
        syncSidebarFocusStrongState();
      });
      appSidebar.addEventListener("focusin", function () {
        sidebarInteractionActive = true;
        syncSidebarFocusStrongState();
      });
      appSidebar.addEventListener("focusout", function (e) {
        var nextTarget = e && e.relatedTarget ? e.relatedTarget : null;
        if (nextTarget && appSidebar.contains(nextTarget)) return;
        sidebarInteractionActive = false;
        syncSidebarFocusStrongState();
      });
    }
    if (!global.__SEC_SIDEBAR_RESIZE_BOUND__) {
      global.__SEC_SIDEBAR_RESIZE_BOUND__ = true;
      global.addEventListener("resize", debounce(syncSidebarCollapsedByViewport, 150));
    }
    if (btnThemeToggle) {
      btnThemeToggle.addEventListener("click", function () {
        toggleThemeMode();
        closeSidebarUserMenu();
      });
    }

    if (sidebarUserMenuTrigger && sidebarUserMenuTrigger.getAttribute("data-user-menu-bound") !== "1") {
      sidebarUserMenuTrigger.setAttribute("data-user-menu-bound", "1");
      sidebarUserMenuTrigger.addEventListener("click", function () {
        setSidebarUserMenuOpen(!sidebarMenuOpen);
      });
      sidebarUserMenuTrigger.addEventListener("keydown", function (e) {
        if (!e) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setSidebarUserMenuOpen(!sidebarMenuOpen);
        }
      });
    }

    if (btnProfile) {
      btnProfile.addEventListener("click", function () {
        closeSidebarUserMenu();
        openProfileModal();
      });
    }
    if (btnChangePassword) {
      btnChangePassword.addEventListener("click", function () {
        closeSidebarUserMenu();
        openChangePasswordModal();
      });
    }
    if (btnLogout) {
      btnLogout.addEventListener("click", async function () {
        closeSidebarUserMenu();
        await logoutCurrentUser();
        redirectToAuth(authLoginPage, "logout=1");
      });
    }
    if (btnDemo4Users) {
      btnDemo4Users.addEventListener("click", function () {
        generateRandomMultiUserDemo();
      });
    }

    if (modalClose) modalClose.addEventListener("click", function () { requestCloseModal(); });
    if (modalClose2) modalClose2.addEventListener("click", function () { requestCloseModal(); });
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) requestCloseModal();
      });
    }

    if (btnKvSave) {
      btnKvSave.addEventListener("click", async function (e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        clearModalAutosaveTimer();
        clearModalAutoCloseTimer();
        var ok = await saveModalDraftChanges(false);
        if (ok) {
          modalAutoCloseTimerRef(setTimeout(function () {
            forceCloseModal();
          }, 1100));
        }
      });
    }

    if (markStatus) {
      markStatus.addEventListener("change", function () {
        clearModalAutoCloseTimer();
        updateModalDraftUi();
        scheduleModalAutosave("status");
      });
    }
    if (markReason) {
      markReason.addEventListener("input", function () {
        clearModalAutoCloseTimer();
        updateModalDraftUi();
        scheduleModalAutosave("reason");
      });
    }

    document.addEventListener("keydown", function (e) {
      if (modal && modal.classList.contains("show") && hasPendingModalDraft() && isUnsafeReloadShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();
        showModalSaveFeedback("ATENCAO: salve as edicoes antes de recarregar a pagina.", true);
        focusIfPossible(btnKvSave);
        return;
      }

      if (e.key !== "Escape") return;
      if (modal && modal.classList.contains("show")) {
        requestCloseModal();
        return;
      }
      if (exportCustomModal && exportCustomModal.classList.contains("show")) {
        closeExportCustomModal();
        return;
      }
      if (profileModal && profileModal.classList.contains("show")) {
        closeProfileModal();
        return;
      }
      if (changePasswordModal && changePasswordModal.classList.contains("show")) {
        closeChangePasswordModal();
        return;
      }
      if (pendingUsersModal && pendingUsersModal.classList.contains("show")) {
        closePendingUsersModal();
        return;
      }

      if (sidebarMenuOpen) {
        closeSidebarUserMenu();
      }
    });

    document.addEventListener("click", function (e) {
      if (!sidebarMenuOpen || !sidebarUserMenuContainer) return;
      var target = e && e.target ? e.target : null;
      if (target && sidebarUserMenuContainer.contains(target)) return;
      closeSidebarUserMenu();
    });

    global.addEventListener("beforeunload", function (e) {
      if (!modal || !modal.classList.contains("show")) return;
      if (!hasPendingModalDraft()) return;
      flushModalAutosave({ reason: "beforeunload" });
      e.preventDefault();
      e.returnValue = "";
    });
    global.addEventListener("pagehide", function () {
      flushModalAutosave({ reason: "pagehide" });
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState !== "hidden") return;
      flushModalAutosave({ reason: "visibilitychange" });
    });

    if (btnMarkStatus) {
      btnMarkStatus.addEventListener("click", function (e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        clearModalAutoCloseTimer();
        var rec = getSelected();
        var modalDraftState = modalDraftStateRef();
        if (!rec || !modalDraftState) return;
        if (!canMutateRecords()) {
          showModalSaveFeedback(getReadOnlyRoleMessage() || "Perfil em leitura. Edicao bloqueada.", true);
          return;
        }

        var selectedStatus = markStatus ? String(markStatus.value || "").trim() : "";
        if (!selectedStatus) {
          showModalSaveFeedback("ATENCAO: selecione um status para preparar a marcacao.", true);
          if (markStatus) markStatus.focus();
          updateModalDraftUi();
          return;
        }

        var next = normalizeStatus(selectedStatus);
        var why = markReason ? String(markReason.value || "").trim() : "";
        if (!why) {
          showModalSaveFeedback("ATENCAO: informe motivo/observacao para preparar a marcacao.", true);
          return;
        }

        modalDraftState.pendingAction = {
          type: "MARK_STATUS",
          status: next,
          reason: why
        };
        updateModalDraftUi();
        scheduleModalAutosave("mark-status");
        showModalSaveFeedback("Marcacao preparada. O rascunho local sera salvo automaticamente; clique em Salvar edicoes para gravar oficialmente.", false);
      });
    }

    if (btnExportOne) {
      btnExportOne.addEventListener("click", async function () {
        await exportOne();
      });
    }
    if (btnExportAtuais) {
      btnExportAtuais.addEventListener("click", async function () {
        await runExportAtuais();
      });
    }
    if (btnExportHistorico) {
      btnExportHistorico.addEventListener("click", async function () {
        await runExportHistorico();
      });
    }
    if (btnExportCustom) {
      btnExportCustom.addEventListener("click", function () {
        openExportCustomModal();
      });
    }
    if (btnExportCustomApply) {
      btnExportCustomApply.addEventListener("click", async function () {
        var filters = {
          ano: exportCustomYear ? exportCustomYear.value : "",
          status: exportCustomStatus ? exportCustomStatus.value : "",
          deputado: exportCustomDeputado ? String(exportCustomDeputado.value || "").trim() : "",
          municipio: exportCustomMunicipio ? String(exportCustomMunicipio.value || "").trim() : "",
          include_old: !!(exportCustomIncludeOld && exportCustomIncludeOld.checked)
        };
        var ok = await runCustomExport(filters);
        if (ok) closeExportCustomModal();
      });
    }
    if (btnExportCustomClose) btnExportCustomClose.addEventListener("click", closeExportCustomModal);
    if (btnExportCustomCancel) btnExportCustomCancel.addEventListener("click", closeExportCustomModal);
    if (exportCustomModal) {
      exportCustomModal.addEventListener("click", function (e) {
        if (e.target === exportCustomModal) closeExportCustomModal();
      });
    }
    if (exportCustomYear) exportCustomYear.addEventListener("change", refreshCustomExportSummary);
    if (exportCustomStatus) exportCustomStatus.addEventListener("change", refreshCustomExportSummary);
    if (exportCustomDeputado) exportCustomDeputado.addEventListener("input", debounce(refreshCustomExportSummary, 120));
    if (exportCustomMunicipio) exportCustomMunicipio.addEventListener("input", debounce(refreshCustomExportSummary, 120));
    if (exportCustomIncludeOld) exportCustomIncludeOld.addEventListener("change", refreshCustomExportSummary);

    if (btnProfileClose) btnProfileClose.addEventListener("click", closeProfileModal);
    if (btnProfileCloseX) btnProfileCloseX.addEventListener("click", closeProfileModal);
    if (profileModal) {
      profileModal.addEventListener("click", function (e) {
        if (e.target === profileModal) closeProfileModal();
      });
    }
    if (btnChangePasswordClose) btnChangePasswordClose.addEventListener("click", closeChangePasswordModal);
    if (btnChangePasswordCloseX) btnChangePasswordCloseX.addEventListener("click", closeChangePasswordModal);
    if (changePasswordForm) {
      changePasswordForm.addEventListener("submit", async function (e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        await submitChangePassword();
      });
    }
    if (changePasswordModal) {
      changePasswordModal.addEventListener("click", function (e) {
        if (e.target === changePasswordModal) closeChangePasswordModal();
      });
    }

    if (btnPendingApprovals) {
      btnPendingApprovals.addEventListener("click", function () {
        closeSidebarUserMenu();
        openPendingUsersModal();
      });
    }
    if (btnPendingUsersClose) btnPendingUsersClose.addEventListener("click", closePendingUsersModal);
    if (btnPendingUsersCloseX) btnPendingUsersCloseX.addEventListener("click", closePendingUsersModal);
    if (btnPendingUsersRefresh) {
      btnPendingUsersRefresh.addEventListener("click", function () {
        refreshPendingUsersModal();
      });
    }
    if (pendingUsersModal) {
      pendingUsersModal.addEventListener("click", function (e) {
        if (e.target === pendingUsersModal) closePendingUsersModal();
      });
    }
    if (pendingUsersTableWrap) {
      pendingUsersTableWrap.addEventListener("click", function (e) {
        var btn = e.target && e.target.closest ? e.target.closest("button[data-pending-action]") : null;
        if (!btn) return;
        var userId = Number(btn.getAttribute("data-user-id") || 0);
        if (!userId) return;
        var action = String(btn.getAttribute("data-pending-action") || "").toLowerCase();
        var runner = action === "reject" ? rejectPendingUser : approvePendingUser;
        var fallbackMessage = action === "reject" ? "Falha ao recusar cadastro." : "Falha ao aprovar cadastro.";
        runner(userId).catch(function (err) {
          var msg = extractApiError(err, fallbackMessage);
          setPendingUsersFeedback(msg, true);
        });
      });
    }
  }

  root.appBindingsUtils = {
    bindUiShellEvents: bindUiShellEvents
  };
})(window);
