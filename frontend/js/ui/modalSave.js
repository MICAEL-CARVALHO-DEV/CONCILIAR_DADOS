(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function clearModalAutosaveTimer(ctx) {
    var timer = ctx.getModalAutosaveTimer();
    if (timer) {
      globalScope.clearTimeout(timer);
      ctx.setModalAutosaveTimer(null);
    }
  }

  function clearModalSaveFeedback(ctx) {
    var feedbackTimer = ctx.getModalSaveFeedbackTimer();
    if (feedbackTimer) {
      globalScope.clearTimeout(feedbackTimer);
      ctx.setModalSaveFeedbackTimer(null);
    }
    if (!ctx.modalSaveFeedback) return;
    if (ctx.setModalSaveFeedbackState) {
      ctx.setModalSaveFeedbackState(ctx.modalSaveFeedback, "", { hidden: true, isError: false });
      return;
    }
    ctx.modalSaveFeedback.textContent = "";
    ctx.modalSaveFeedback.classList.add("hidden");
    ctx.modalSaveFeedback.classList.remove("success", "error");
  }

  function showModalSaveFeedback(message, isError, ctx) {
    if (!ctx.modalSaveFeedback) return;
    clearModalSaveFeedback(ctx);
    if (ctx.setModalSaveFeedbackState) {
      ctx.setModalSaveFeedbackState(ctx.modalSaveFeedback, message, { hidden: false, isError: isError });
    } else {
      ctx.modalSaveFeedback.textContent = message;
      ctx.modalSaveFeedback.classList.remove("hidden");
      ctx.modalSaveFeedback.classList.add(isError ? "error" : "success");
    }
    ctx.setModalSaveFeedbackTimer(globalScope.setTimeout(function () {
      clearModalSaveFeedback(ctx);
    }, 2600));
  }

  function updateModalDraftUi(ctx) {
    var dirty = ctx.isModalDraftDirty();
    var pending = ctx.hasPendingModalAction();
    var hasMarkDraft = ctx.hasModalMarkDraft();
    var hasDraft = dirty || pending || hasMarkDraft;
    var canSave = ctx.canSaveDraftNow();
    var blockReason = ctx.getDraftSaveBlockReason();
    var modalDraftState = ctx.getModalDraftState();
    var draftSavedAtText = modalDraftState && modalDraftState.lastDraftSavedAt
      ? ctx.fmtDateTime(modalDraftState.lastDraftSavedAt)
      : "";

    if (ctx.updateModalDraftUiRenderer) {
      ctx.updateModalDraftUiRenderer(ctx.kv, ctx.kvDraftHint, ctx.modalSaveGuard, ctx.btnKvSave, modalDraftState, {
        dirty: dirty,
        pending: pending,
        hasMarkDraft: hasMarkDraft,
        canSave: canSave,
        blockReason: blockReason,
        draftSavedAtText: draftSavedAtText
      });
      return;
    }

    if (ctx.kvDraftHint) {
      ctx.kvDraftHint.classList.toggle("hidden", !hasDraft);
      if (hasDraft) {
        if (pending) {
          ctx.kvDraftHint.textContent = "Marcacao pronta: rascunho local salvo automaticamente. Clique em Salvar edicoes para gravar oficialmente.";
        } else if (canSave) {
          ctx.kvDraftHint.textContent = "Rascunho local salvo automaticamente. Clique em Salvar edicoes para gravar oficialmente.";
        } else if (hasMarkDraft) {
          ctx.kvDraftHint.textContent = "Rascunho local salvo automaticamente. Complete status e motivo para gravar oficialmente.";
        } else {
          ctx.kvDraftHint.textContent = "Rascunho local salvo automaticamente. Informe status e motivo para salvar oficialmente.";
        }
        if (draftSavedAtText) {
          ctx.kvDraftHint.textContent += " Ultimo rascunho local: " + draftSavedAtText + ".";
        }
      }
    }

    if (ctx.modalSaveGuard) {
      ctx.modalSaveGuard.classList.toggle("hidden", !hasDraft || !blockReason);
      ctx.modalSaveGuard.textContent = blockReason || "";
    }

    if (ctx.btnKvSave) ctx.btnKvSave.disabled = !canSave;

    if (!ctx.kv) return;
    var inputs = ctx.kv.querySelectorAll("[data-kv-field]");
    inputs.forEach(function (el) {
      var key = el.getAttribute("data-kv-field");
      var isDirty = !!(modalDraftState && modalDraftState.dirty && modalDraftState.dirty[key]);
      el.classList.toggle("kv-dirty", isDirty);
    });
  }

  function scheduleModalAutosave(reason, ctx) {
    clearModalAutosaveTimer(ctx);
    if (!ctx.modal || !ctx.modal.classList.contains("show")) return;
    if (!ctx.getModalDraftState()) return;
    if (!ctx.hasPendingModalDraft()) {
      clearPersistedDraftForCurrentRecord(ctx);
      return;
    }

    ctx.setModalAutosaveTimer(globalScope.setTimeout(function () {
      ctx.persistModalDraftSnapshot(reason || "debounce");
      updateModalDraftUi(ctx);
    }, ctx.MODAL_AUTOSAVE_DEBOUNCE_MS));
  }

  function flushModalAutosave(options, ctx) {
    var opts = options && typeof options === "object" ? options : {};
    clearModalAutosaveTimer(ctx);
    var modalDraftState = ctx.getModalDraftState();
    if (!modalDraftState) return true;
    if (!ctx.hasPendingModalDraft()) {
      ctx.clearPersistedModalDraft(modalDraftState.recordId);
      return true;
    }
    return ctx.persistModalDraftSnapshot(opts.reason || "flush");
  }

  function clearPersistedDraftForCurrentRecord(ctx) {
    var modalDraftState = ctx.getModalDraftState();
    if (!modalDraftState) return;
    ctx.clearPersistedModalDraft(modalDraftState.recordId);
  }

  async function saveModalDraftChanges(keepOpenOrOptions, ctx) {
    if (ctx.getModalDraftSavePromise()) {
      return await ctx.getModalDraftSavePromise();
    }

    var saveOptions = keepOpenOrOptions && typeof keepOpenOrOptions === "object"
      ? keepOpenOrOptions
      : { keepOpen: !!keepOpenOrOptions };
    var keepOpen = !!saveOptions.keepOpen;
    var preserveInteraction = !!saveOptions.preserveInteraction;
    var silentSuccess = !!saveOptions.silentSuccess;

    ctx.setModalDraftSavePromise((async function () {
      ctx.clearModalAutoCloseTimer();
      clearModalAutosaveTimer(ctx);
      if (!ctx.canMutateRecords()) {
        showModalSaveFeedback(ctx.getReadOnlyRoleMessage() || "Perfil em leitura: salvamento bloqueado.", true, ctx);
        return false;
      }
      if (ctx.isEmendaLockReadOnly()) {
        showModalSaveFeedback("Edicao bloqueada: emenda em uso por outro usuario.", true, ctx);
        return false;
      }

      var modalDraftState = ctx.getModalDraftState();
      if (!modalDraftState) return true;

      var hasDirty = ctx.isModalDraftDirty();
      var pendingAction = modalDraftState.pendingAction || null;
      if (!hasDirty && !pendingAction) return true;

      var rec = ctx.getSelected();
      if (!rec || rec.id !== modalDraftState.recordId) return false;
      var recSnapshot = ctx.deepClone(rec);
      var changedEvents = [];
      var dirtyKeys = Object.keys(modalDraftState.dirty || {});

      dirtyKeys.forEach(function (key) {
        if (ctx.isLockedStructuralField(key)) return;
        var fieldType = ctx.getModalFieldType(key);
        var label = ctx.getModalFieldLabel(key, key);
        var prev = rec[key];
        var next = ctx.normalizeDraftFieldValue(modalDraftState.draft[key], fieldType);
        if (!ctx.hasFieldChanged(prev, next, fieldType)) return;

        rec[key] = next;
        changedEvents.push(ctx.mkEvent("EDIT_FIELD", {
          key: key,
          field: label,
          from: ctx.stringifyFieldValue(prev, fieldType),
          to: ctx.stringifyFieldValue(next, fieldType),
          raw_from: prev,
          raw_to: next,
          note: "Edicao manual confirmada."
        }));
      });

      var oldRef = rec.ref_key || "";
      ctx.syncCanonicalToAllFields(rec);
      rec.ref_key = ctx.buildReferenceKey(rec);
      if (oldRef !== rec.ref_key) {
        changedEvents.push(ctx.mkEvent("EDIT_FIELD", {
          field: "Chave Referencia",
          from: oldRef,
          to: rec.ref_key,
          note: "Recalculada apos edicao manual."
        }));
      }

      var action = pendingAction;
      if (!action) {
        var selectedStatus = ctx.markStatus ? String(ctx.markStatus.value || "").trim() : "";
        var reasonForSave = ctx.markReason ? String(ctx.markReason.value || "").trim() : "";
        if (changedEvents.length || selectedStatus || reasonForSave) {
          if (!selectedStatus) {
            showModalSaveFeedback("ERRO: nao pode salvar alteracoes sem marcar status.", true, ctx);
            if (ctx.markStatus) ctx.markStatus.focus();
            updateModalDraftUi(ctx);
            return false;
          }
          if (!reasonForSave) {
            showModalSaveFeedback("ERRO: informe motivo/observacao para salvar alteracoes.", true, ctx);
            if (ctx.markReason) ctx.markReason.focus();
            updateModalDraftUi(ctx);
            return false;
          }
          action = { type: "MARK_STATUS", status: ctx.normalizeStatus(selectedStatus), reason: reasonForSave };
        }
      }

      if (!action && !changedEvents.length) {
        modalDraftState.dirty = {};
        updateModalDraftUi(ctx);
        return true;
      }

      var prependEvents = [];
      if (action && action.type === "MARK_STATUS") {
        prependEvents.push(ctx.mkEvent("MARK_STATUS", { to: ctx.normalizeStatus(action.status || ""), note: String(action.reason || "") }));
      }
      prependEvents.push.apply(prependEvents, changedEvents);
      if (!prependEvents.length) return true;

      rec.updated_at = ctx.isoNow();
      rec.eventos = prependEvents.concat(rec.eventos || []);

      if (action && action.type === "MARK_STATUS") {
        try {
          await ctx.syncGenericEventToApi(rec, {
            tipo_evento: "MARK_STATUS",
            valor_novo: ctx.normalizeStatus(action.status || ""),
            motivo: String(action.reason || "")
          });
        } catch (err) {
          await ctx.rollbackSaveAndReport(err, rec, recSnapshot, "marcacao de status para salvar");
          return false;
        }
      }

      for (var i = 0; i < changedEvents.length; i += 1) {
        var ev = changedEvents[i];
        try {
          var fieldKey = String(ev.key || "").trim();
          var fieldType = ctx.getModalFieldType(fieldKey);
          var rawOld = Object.prototype.hasOwnProperty.call(ev, "raw_from") ? ev.raw_from : ev.from;
          var rawNew = Object.prototype.hasOwnProperty.call(ev, "raw_to") ? ev.raw_to : ev.to;
          await ctx.syncGenericEventToApi(rec, {
            tipo_evento: "EDIT_FIELD",
            campo_alterado: fieldKey || ev.field || "",
            valor_antigo: String(rawOld == null ? "" : ctx.normalizeDraftFieldValue(rawOld, fieldType)),
            valor_novo: String(rawNew == null ? "" : ctx.normalizeDraftFieldValue(rawNew, fieldType)),
            motivo: ev.note || "Edicao manual confirmada."
          });
        } catch (err) {
          await ctx.rollbackSaveAndReport(err, rec, recSnapshot, "edicao de campo");
          return false;
        }
      }

      ctx.saveState();
      ctx.clearPersistedModalDraft(rec.id);
      ctx.clearModalStatusDraftInputs();
      if (typeof ctx.notifyStateUpdated === "function") ctx.notifyStateUpdated();
      ctx.render();

      if (keepOpen) {
        if (preserveInteraction) {
          ctx.rebaseModalDraftAfterSave(rec);
          ctx.refreshOpenModalAfterSave(rec);
          updateModalDraftUi(ctx);
          if (!silentSuccess) {
            showModalSaveFeedback("Registro salvo com sucesso.", false, ctx);
          }
        } else {
          ctx.openModal(rec.id, true);
          globalScope.setTimeout(function () {
            if (!silentSuccess) {
              showModalSaveFeedback("Registro salvo com sucesso.", false, ctx);
            }
          }, 80);
        }
      } else {
        ctx.setModalDraftState(null);
        updateModalDraftUi(ctx);
        showModalSaveFeedback("Registro salvo com sucesso.", false, ctx);
      }

      return true;
    })());

    try {
      return await ctx.getModalDraftSavePromise();
    } finally {
      ctx.setModalDraftSavePromise(null);
    }
  }

  root.modalSaveUtils = {
    clearModalAutosaveTimer: clearModalAutosaveTimer,
    scheduleModalAutosave: scheduleModalAutosave,
    flushModalAutosave: flushModalAutosave,
    clearModalSaveFeedback: clearModalSaveFeedback,
    showModalSaveFeedback: showModalSaveFeedback,
    updateModalDraftUi: updateModalDraftUi,
    saveModalDraftChanges: saveModalDraftChanges
  };
})(typeof window !== "undefined" ? window : globalThis);

