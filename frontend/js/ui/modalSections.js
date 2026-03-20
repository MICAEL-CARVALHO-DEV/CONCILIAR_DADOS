// =============================================================
// modalSections.js — SECOES INTERNAS DO MODAL DE EMENDA
// Dono: Antigravity (frontend/js/ui/)
// Responsabilidade: Atualizar as secoes do modal (cabecalho, campos KV readonly,
//   historico, progresso, membros, conflitos e perfil de acesso).
// Exports: SECFrontend.modalSectionsUtils
//   refreshModalSections, refreshModalRecordHeader,
//   syncModalReadonlyFieldValues, renderHistoryFallback
// Nao tocar: app.js, index.html, style.css
// =============================================================
(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function noop() {}

  function clearNode(node) {
    if (!node) return;
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren();
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function refreshModalRecordHeader(record, options) {
    if (!record) return;
    var opts = options || {};
    var titleEl = opts.titleEl || null;
    var subtitleEl = opts.subtitleEl || null;
    var syncModalRecordHeader = typeof opts.syncModalRecordHeader === "function" ? opts.syncModalRecordHeader : null;

    if (syncModalRecordHeader) {
      syncModalRecordHeader(titleEl, subtitleEl, record);
      return;
    }
    if (titleEl) titleEl.textContent = "Emenda: " + String(record.id || "");
    if (subtitleEl) {
      subtitleEl.textContent = [
        String(record.identificacao || ""),
        String(record.municipio || ""),
        String(record.deputado || "")
      ].join(" | ");
    }
  }

  function syncModalReadonlyFieldValues(record, options) {
    var opts = options || {};
    var kv = opts.kv || null;
    if (!kv || !record) return;
    var readonlyFields = kv.querySelectorAll("[data-kv-readonly-field]");
    readonlyFields.forEach(function (el) {
      var key = el.getAttribute("data-kv-readonly-field");
      el.textContent = String(record[key] == null ? "-" : record[key]);
    });
  }

  function renderHistoryFallback(record, options) {
    var opts = options || {};
    var historyEl = opts.historyEl || null;
    var renderHistoryToContainer = typeof opts.renderHistoryToContainer === "function" ? opts.renderHistoryToContainer : null;
    var getEventsSorted = typeof opts.getEventsSorted === "function" ? opts.getEventsSorted : function () { return []; };
    var clearNodeChildren = typeof opts.clearNodeChildren === "function" ? opts.clearNodeChildren : clearNode;
    if (!historyEl) return;

    if (renderHistoryToContainer) {
      renderHistoryToContainer(historyEl, getEventsSorted(record), opts.uiCtx || {});
      return;
    }

    clearNodeChildren(historyEl);
    var fallback = document.createElement("p");
    fallback.className = "muted small";
    fallback.textContent = "Renderizador indisponivel (historico).";
    historyEl.appendChild(fallback);
  }

  function refreshModalSections(record, options) {
    if (!record) return;
    var opts = options || {};
    var getActiveUsersWithLastMark = typeof opts.getActiveUsersWithLastMark === "function" ? opts.getActiveUsersWithLastMark : function () { return []; };
    var calcProgress = typeof opts.calcProgress === "function" ? opts.calcProgress : function () { return {}; };
    var whoIsDelaying = typeof opts.whoIsDelaying === "function" ? opts.whoIsDelaying : function () { return []; };
    var getAttentionIssues = typeof opts.getAttentionIssues === "function" ? opts.getAttentionIssues : function () { return []; };
    var getLastMarksByUser = typeof opts.getLastMarksByUser === "function" ? opts.getLastMarksByUser : function () { return {}; };
    var renderMarksSummary = typeof opts.renderMarksSummary === "function" ? opts.renderMarksSummary : noop;
    var renderRawFields = typeof opts.renderRawFields === "function" ? opts.renderRawFields : noop;
    var renderUserProgressBox = typeof opts.renderUserProgressBox === "function" ? opts.renderUserProgressBox : noop;
    var renderConflictState = typeof opts.renderConflictState === "function" ? opts.renderConflictState : null;
    var renderHistory = typeof opts.renderHistory === "function" ? opts.renderHistory : noop;
    var applyModalAccessProfile = typeof opts.applyModalAccessProfile === "function" ? opts.applyModalAccessProfile : noop;
    var userProgressBox = opts.userProgressBox || null;
    var realTimeUserPanelEnabled = !!opts.realTimeUserPanelEnabled;
    var renderProgressBar = typeof opts.renderProgressBar === "function" ? opts.renderProgressBar : null;
    var renderMemberChips = typeof opts.renderMemberChips === "function" ? opts.renderMemberChips : null;
    var conflictBox = opts.conflictBox || null;
    var conflictText = opts.conflictText || null;

    refreshModalRecordHeader(record, opts);
    syncModalReadonlyFieldValues(record, opts);

    var users = getActiveUsersWithLastMark(record);
    var progress = calcProgress(users);
    var delays = whoIsDelaying(users);
    var attentionIssues = getAttentionIssues(users);
    var lastMarks = getLastMarksByUser(record);

    renderMarksSummary(lastMarks);
    renderRawFields(record);

    if (realTimeUserPanelEnabled && userProgressBox) {
      renderUserProgressBox(userProgressBox, progress, delays, {
        renderProgressBar: renderProgressBar,
        renderMemberChips: renderMemberChips,
        users: users
      });
    }

    if (renderConflictState) {
      renderConflictState(conflictBox, conflictText, attentionIssues);
    } else if (attentionIssues.length) {
      if (conflictBox) conflictBox.classList.remove("hidden");
      if (conflictText) conflictText.textContent = attentionIssues.join(" | ");
    } else {
      if (conflictBox) conflictBox.classList.add("hidden");
      if (conflictText) conflictText.textContent = "";
    }

    renderHistory(record);
    applyModalAccessProfile();
  }

  root.modalSectionsUtils = {
    refreshModalRecordHeader: refreshModalRecordHeader,
    syncModalReadonlyFieldValues: syncModalReadonlyFieldValues,
    renderHistoryFallback: renderHistoryFallback,
    refreshModalSections: refreshModalSections
  };
})(window);
