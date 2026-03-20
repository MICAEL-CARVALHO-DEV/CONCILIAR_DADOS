// =============================================================
// modalShell.js — CICLO DE VIDA DO MODAL DE EMENDA
// Dono: Antigravity (frontend/js/ui/)
// Responsabilidade: Gerenciar abertura, fechamento, descarte de rascunho
//   e refresh do modal de emenda, incluindo controle de lock e sincronização.
// Exports: SECFrontend.modalShellUtils
//   openModal, forceCloseModal, requestCloseModal, discardModalDraftChanges,
//   refreshOpenModalAfterSave, refreshOpenModalAfterRemoteSync
// Nao tocar: app.js, index.html, style.css
// =============================================================
(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function refreshOpenModalAfterSave(rec, ctx) {
    if (!rec || !ctx.modal || !ctx.modal.classList.contains("show") || ctx.getSelectedId() !== rec.id) return;
    ctx.refreshModalSectionsForRecord(rec);
  }

  function shouldRefreshOpenModalFromRemote(rec, ctx) {
    if (!rec || !ctx.modal || !ctx.modal.classList.contains("show") || ctx.getSelectedId() !== rec.id) return false;
    if (!ctx.canMutateRecords()) return true;
    if (ctx.isEmendaLockReadOnly()) return true;
    return !ctx.hasPendingModalDraft();
  }

  function refreshOpenModalAfterRemoteSync(ctx) {
    var rec = ctx.getSelected();
    if (!shouldRefreshOpenModalFromRemote(rec, ctx)) return;
    refreshOpenModalAfterSave(rec, ctx);
  }

  function discardModalDraftChanges(keepOpen, ctx) {
    ctx.clearModalAutosaveTimer();
    if (keepOpen) {
      var rec = ctx.getSelected();
      if (rec) {
        openModal(rec.id, true, ctx);
        return;
      }
    }

    ctx.setModalDraftState(null);
    ctx.updateModalDraftUi();
  }

  async function requestCloseModal(ctx) {
    if (ctx.getModalCloseInProgress()) return;
    ctx.setModalCloseInProgress(true);
    try {
      if (ctx.hasPendingModalDraft()) {
        var rec = ctx.getSelected();
        ctx.flushModalAutosave({ reason: "close-request" });

        if (ctx.canSaveDraftNow()) {
          var shouldSave = globalScope.confirm("Existe rascunho nesta emenda. OK = salvar oficialmente agora. Cancelar = escolher entre descartar ou manter o rascunho local.");
          if (shouldSave) {
            var saved = await ctx.saveModalDraftChanges(false);
            if (saved) {
              forceCloseModal(ctx);
            }
            return;
          }
        }

        var shouldDiscard = globalScope.confirm("Deseja descartar o rascunho desta emenda? OK = descartar. Cancelar = manter o rascunho local para continuar depois.");
        if (shouldDiscard) {
          if (rec) ctx.clearPersistedModalDraft(rec.id);
          discardModalDraftChanges(false, ctx);
          forceCloseModal(ctx);
          return;
        }

        ctx.flushModalAutosave({ reason: "close-keep-draft" });
        forceCloseModal(ctx);
        return;
      }

      forceCloseModal(ctx);
    } finally {
      ctx.setModalCloseInProgress(false);
    }
  }

  function openModal(id, keepReasons, ctx) {
    ctx.clearModalAutoCloseTimer();
    ctx.clearModalAutosaveTimer();
    ctx.clearModalSaveFeedback();
    var previousId = ctx.getSelectedId();
    if (previousId && previousId !== id) {
      var previousRec = (ctx.state.records || []).find(function (r) { return r.id === previousId; });
      if (previousRec) {
        ctx.announcePresenceForRecord(previousRec, "leave");
        ctx.releaseEmendaLock(previousRec).catch(function () { /* no-op */ });
      }
    }
    ctx.setLastFocusedElement(globalScope.document ? globalScope.document.activeElement : null);
    ctx.setSelectedId(id);
    var rec = ctx.getSelected();
    if (!rec) return;
    ctx.setEmendaLockReadOnly(!ctx.canMutateRecords());

    var syncModalRecordHeader = ctx.syncModalRecordHeader;
    if (syncModalRecordHeader) {
      syncModalRecordHeader(ctx.modalTitle, ctx.modalSub, rec);
    } else {
      ctx.modalTitle.textContent = "Emenda: " + rec.id;
      ctx.modalSub.textContent = rec.identificacao + " | " + rec.municipio + " | " + rec.deputado;
    }

    if (!keepReasons) {
      if (ctx.markStatus) ctx.markStatus.value = "";
      ctx.markReason.value = "";
    }

    var restoredDraft = ctx.initModalDraftForRecord(rec);
    ctx.renderKvEditor(rec);
    ctx.refreshModalSectionsForRecord(rec);

    ctx.setAuxModalVisibility(ctx.modal, true);
    ctx.renderEmendaLockInfo(rec);
    ctx.syncModalEmendaLock(rec).catch(function () {
      ctx.renderEmendaLockInfo(rec);
    });
    if (restoredDraft) {
      globalScope.setTimeout(function () {
        ctx.showModalSaveFeedback("Rascunho local restaurado. Clique em Salvar edicoes para gravar oficialmente.", false);
      }, 120);
    }
    globalScope.setTimeout(function () {
      ctx.focusIfPossible(ctx.modalClose);
    }, 0);
  }

  function forceCloseModal(ctx) {
    var activeRec = ctx.getSelected();
    if (activeRec) {
      ctx.announcePresenceForRecord(activeRec, "leave");
      ctx.releaseEmendaLock(activeRec).catch(function () { /* no-op */ });
    }
    ctx.clearEmendaLockTimer();
    ctx.setEmendaLockState(null);
    ctx.clearModalAutoCloseTimer();
    ctx.clearModalAutosaveTimer();
    ctx.clearModalSaveFeedback();
    var lastFocusedElement = ctx.getLastFocusedElement();
    if (lastFocusedElement && ctx.modal && !ctx.modal.contains(lastFocusedElement)) {
      ctx.focusIfPossible(lastFocusedElement);
    } else if (typeof globalScope.document !== "undefined" && globalScope.document.activeElement && ctx.modal && ctx.modal.contains(globalScope.document.activeElement) && typeof globalScope.document.activeElement.blur === "function") {
      globalScope.document.activeElement.blur();
    }
    ctx.setAuxModalVisibility(ctx.modal, false);
    if (ctx.modalAccessState) {
      ctx.modalAccessState.classList.add("hidden");
      ctx.modalAccessState.textContent = "";
    }
    ctx.clearModalStatusDraftInputs();
    ctx.setSelectedId(null);
    ctx.setModalDraftState(null);
    ctx.updateModalDraftUi();
    if (!lastFocusedElement || (ctx.modal && ctx.modal.contains(lastFocusedElement))) {
      ctx.focusIfPossible(globalScope.document ? globalScope.document.body : null);
    }
  }

  root.modalShellUtils = {
    refreshOpenModalAfterSave: refreshOpenModalAfterSave,
    shouldRefreshOpenModalFromRemote: shouldRefreshOpenModalFromRemote,
    refreshOpenModalAfterRemoteSync: refreshOpenModalAfterRemoteSync,
    discardModalDraftChanges: discardModalDraftChanges,
    requestCloseModal: requestCloseModal,
    openModal: openModal,
    forceCloseModal: forceCloseModal
  };
})(typeof window !== "undefined" ? window : globalThis);

