(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function initModalDraftForRecord(rec, ctx) {
    var draft = {};
    var original = {};

    ctx.MODAL_FIELD_ORDER.forEach(function (field) {
      if (!field.editable) return;
      var type = ctx.getModalFieldType(field.key);
      var normalized = ctx.normalizeDraftFieldValue(rec[field.key], type);
      draft[field.key] = normalized;
      original[field.key] = normalized;
    });

    var nextState = {
      recordId: rec.id,
      draft: draft,
      original: original,
      dirty: {}
    };
    ctx.setModalDraftState(nextState);

    var restored = restorePersistedModalDraft(rec, ctx);
    ctx.updateModalDraftUi();
    return restored;
  }

  function isModalDraftDirty(ctx) {
    var state = ctx.getModalDraftState();
    if (!state || !state.dirty) return false;
    return Object.keys(state.dirty).length > 0;
  }

  function hasPendingModalAction(ctx) {
    var state = ctx.getModalDraftState();
    return !!(state && state.pendingAction && state.pendingAction.type);
  }

  function hasModalMarkDraft(ctx) {
    var selectedStatus = ctx.markStatus ? String(ctx.markStatus.value || "").trim() : "";
    var reason = ctx.markReason ? String(ctx.markReason.value || "").trim() : "";
    return selectedStatus.length > 0 || reason.length > 0;
  }

  function canSaveDraftNow(ctx) {
    if (!ctx.canMutateRecords()) return false;
    if (ctx.isEmendaLockReadOnly()) return false;
    if (hasPendingModalAction(ctx)) return true;
    var selectedStatus = ctx.markStatus ? String(ctx.markStatus.value || "").trim() : "";
    var reason = ctx.markReason ? String(ctx.markReason.value || "").trim() : "";
    if (!isModalDraftDirty(ctx)) {
      return selectedStatus.length > 0 && reason.length > 0;
    }
    return selectedStatus.length > 0 && reason.length > 0;
  }

  function getDraftSaveBlockReason(ctx) {
    if (!ctx.canMutateRecords()) {
      return ctx.getReadOnlyRoleMessage() || "Perfil em leitura: sem alteracao de dados.";
    }
    if (ctx.isEmendaLockReadOnly()) {
      return "Edicao bloqueada: esta emenda esta em uso por outro usuario (modo leitura).";
    }
    if (hasPendingModalAction(ctx)) return "";
    var selectedStatus = ctx.markStatus ? String(ctx.markStatus.value || "").trim() : "";
    var reason = ctx.markReason ? String(ctx.markReason.value || "").trim() : "";
    if (!isModalDraftDirty(ctx)) {
      if (!selectedStatus && !reason) return "";
      if (!selectedStatus) return "ATENCAO: selecione um status para concluir o salvamento oficial.";
      if (!reason) return "ATENCAO: informe o motivo/observacao para concluir o salvamento oficial.";
      return "";
    }
    if (!selectedStatus) {
      return "ATENCAO: nao e permitido salvar alteracoes de campos sem marcar status na secao de Marcacao de Status.";
    }
    if (!reason) {
      return "ATENCAO: informe o motivo/observacao na Marcacao de Status para concluir o salvamento.";
    }
    return "";
  }

  function hasPendingModalDraft(ctx) {
    return isModalDraftDirty(ctx) || hasPendingModalAction(ctx) || hasModalMarkDraft(ctx);
  }

  function normalizeDraftStoragePart(value) {
    return String(value == null ? "" : value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "_");
  }

  function getModalDraftStorageKey(recordId, ctx) {
    return [
      ctx.MODAL_DRAFT_STORAGE_PREFIX,
      normalizeDraftStoragePart(ctx.CURRENT_USER || "anon"),
      normalizeDraftStoragePart(ctx.CURRENT_ROLE || "role"),
      normalizeDraftStoragePart(recordId || "")
    ].join(":");
  }

  function readPersistedModalDraft(recordId, ctx) {
    var key = getModalDraftStorageKey(recordId, ctx);
    var raw = ctx.readStorageValue(globalScope.localStorage, key);
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (String(parsed.recordId || "") !== String(recordId || "")) return null;
      return parsed;
    } catch (_err) {
      ctx.removeStorageValue(globalScope.localStorage, key);
      return null;
    }
  }

  function clearPersistedModalDraft(recordId, ctx) {
    ctx.removeStorageValue(globalScope.localStorage, getModalDraftStorageKey(recordId, ctx));
    var state = ctx.getModalDraftState();
    if (state && state.recordId === recordId) {
      delete state.lastDraftSavedAt;
    }
  }

  function clearModalStatusDraftInputs(ctx) {
    if (ctx.markStatus) ctx.markStatus.value = "";
    if (ctx.markReason) ctx.markReason.value = "";
  }

  function persistModalDraftSnapshot(reason, ctx) {
    var state = ctx.getModalDraftState();
    if (!state || !state.recordId) return false;
    var recordId = state.recordId;
    if (!hasPendingModalDraft(ctx)) {
      clearPersistedModalDraft(recordId, ctx);
      return false;
    }

    var payload = {
      recordId: recordId,
      user: ctx.CURRENT_USER,
      role: ctx.CURRENT_ROLE,
      savedAt: ctx.isoNow(),
      reason: String(reason || "autosave"),
      draft: ctx.shallowCloneObj(state.draft || {}),
      pendingAction: state.pendingAction ? ctx.deepClone(state.pendingAction) : null,
      markStatus: ctx.markStatus ? String(ctx.markStatus.value || "") : "",
      markReason: ctx.markReason ? String(ctx.markReason.value || "") : ""
    };

    ctx.writeStorageValue(globalScope.localStorage, getModalDraftStorageKey(recordId, ctx), JSON.stringify(payload));
    state.lastDraftSavedAt = payload.savedAt;
    return true;
  }

  function restorePersistedModalDraft(rec, ctx) {
    var state = ctx.getModalDraftState();
    if (!rec || !state) return false;
    var snapshot = readPersistedModalDraft(rec.id, ctx);
    if (!snapshot) return false;

    var nextDirty = {};
    ctx.MODAL_FIELD_ORDER.forEach(function (field) {
      if (!field.editable) return;
      var type = ctx.getModalFieldType(field.key);
      var originalValue = ctx.normalizeDraftFieldValue(rec[field.key], type);
      var hasDraftValue = snapshot.draft && Object.prototype.hasOwnProperty.call(snapshot.draft, field.key);
      var draftSource = hasDraftValue ? snapshot.draft[field.key] : originalValue;
      var draftValue = ctx.normalizeDraftFieldValue(draftSource, type);

      state.original[field.key] = originalValue;
      state.draft[field.key] = draftValue;
      if (ctx.hasFieldChanged(originalValue, draftValue, type)) {
        nextDirty[field.key] = true;
      }
    });

    state.dirty = nextDirty;
    state.pendingAction = snapshot.pendingAction && snapshot.pendingAction.type === "MARK_STATUS"
      ? {
        type: "MARK_STATUS",
        status: ctx.normalizeStatus(snapshot.pendingAction.status || snapshot.markStatus || ""),
        reason: String(snapshot.pendingAction.reason || snapshot.markReason || "")
      }
      : null;
    state.lastDraftSavedAt = snapshot.savedAt || "";

    if (ctx.markStatus) ctx.markStatus.value = String(snapshot.markStatus || "");
    if (ctx.markReason) ctx.markReason.value = String(snapshot.markReason || "");
    return true;
  }

  function onModalFieldInput(event, ctx) {
    var state = ctx.getModalDraftState();
    if (!state) return;
    if (!ctx.canMutateRecords()) return;
    ctx.clearModalSaveFeedback();
    var el = event.target;
    var key = el.getAttribute("data-kv-field");
    var type = el.getAttribute("data-kv-type") || "string";
    if (!key) return;

    var parsed = ctx.parseDraftFieldValue(el.value, type);
    state.draft[key] = parsed;

    var original = state.original[key];
    if (ctx.hasFieldChanged(original, parsed, type)) state.dirty[key] = true;
    else delete state.dirty[key];

    ctx.updateModalDraftUi();
    ctx.scheduleModalAutosave("field");
  }

  function rebaseModalDraftAfterSave(rec, ctx) {
    var state = ctx.getModalDraftState();
    if (!rec || !state || state.recordId !== rec.id) return;
    var nextDraft = {};
    var nextOriginal = {};
    var nextDirty = {};

    ctx.MODAL_FIELD_ORDER.forEach(function (field) {
      if (!field.editable) return;
      var type = ctx.getModalFieldType(field.key);
      var savedValue = ctx.normalizeDraftFieldValue(rec[field.key], type);
      var currentDraftValue = state && state.draft
        ? ctx.normalizeDraftFieldValue(state.draft[field.key], type)
        : savedValue;

      nextOriginal[field.key] = savedValue;
      nextDraft[field.key] = currentDraftValue;
      if (ctx.hasFieldChanged(savedValue, currentDraftValue, type)) {
        nextDirty[field.key] = true;
      }
    });

    state.original = nextOriginal;
    state.draft = nextDraft;
    state.dirty = nextDirty;
    state.pendingAction = null;
  }

  root.modalDraftStateUtils = {
    initModalDraftForRecord: initModalDraftForRecord,
    isModalDraftDirty: isModalDraftDirty,
    hasPendingModalAction: hasPendingModalAction,
    hasModalMarkDraft: hasModalMarkDraft,
    canSaveDraftNow: canSaveDraftNow,
    getDraftSaveBlockReason: getDraftSaveBlockReason,
    hasPendingModalDraft: hasPendingModalDraft,
    normalizeDraftStoragePart: normalizeDraftStoragePart,
    getModalDraftStorageKey: getModalDraftStorageKey,
    readPersistedModalDraft: readPersistedModalDraft,
    clearPersistedModalDraft: clearPersistedModalDraft,
    clearModalStatusDraftInputs: clearModalStatusDraftInputs,
    persistModalDraftSnapshot: persistModalDraftSnapshot,
    restorePersistedModalDraft: restorePersistedModalDraft,
    onModalFieldInput: onModalFieldInput,
    rebaseModalDraftAfterSave: rebaseModalDraftAfterSave
  };
})(typeof window !== "undefined" ? window : globalThis);

