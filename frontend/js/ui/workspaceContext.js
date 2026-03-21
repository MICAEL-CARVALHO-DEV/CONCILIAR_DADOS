// =============================================================
// workspaceContext.js — SELETOR E CONTEXTO DE BASE OPERACIONAL
// Dono: Antigravity (frontend/js/ui/)
// Responsabilidade: Renderiza o painel de troca de workspace
//   (LOA atual, sandbox, futuro) com selector de base, badges de modo,
//   aviso de contexto nao-operacional e card de roadmap por workspace.
//   Sem efeitos colaterais fora dos tres nos alvo recebidos por parametro.
// Contrato de opts (renderWorkspaceContext): visibleWorkspaces, currentWorkspace,
//   canSwitch, onChange(workspaceKey), clearNodeChildren.
//   currentWorkspace shape: {key, label, mode, description, notice,
//     preBetaLocked, stageTitle, stageDescription, rules[], nextSteps[]}.
// Exports: SECFrontend.workspaceContextUtils
//   renderWorkspaceContext(barTarget, noticeTarget, stageTarget, opts) -> void
// Nao tocar: app.js, index.html, style.css
// =============================================================
(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function clearNode(node) {
    if (!node) return;
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren();
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function setNodeVisible(node, visible) {
    if (!node) return;
    node.classList.toggle("hidden", !visible);
  }

  function renderWorkspaceContext(barTarget, noticeTarget, stageTarget, options) {
    var opts = options || {};
    var visibleWorkspaces = Array.isArray(opts.visibleWorkspaces) ? opts.visibleWorkspaces : [];
    var currentWorkspace = opts.currentWorkspace || null;
    var canSwitch = !!opts.canSwitch;
    var manualDemoActive = !!opts.manualDemoActive;
    var onChange = typeof opts.onChange === "function" ? opts.onChange : function () {};
    var clearNodeChildren = typeof opts.clearNodeChildren === "function" ? opts.clearNodeChildren : clearNode;

    clearNodeChildren(barTarget);
    clearNodeChildren(noticeTarget);
    clearNodeChildren(stageTarget);

    if (!barTarget || !currentWorkspace) {
      setNodeVisible(noticeTarget, false);
      setNodeVisible(stageTarget, false);
      return;
    }

    var main = document.createElement("div");
    main.className = "workspace-bar-main";

    var title = document.createElement("h3");
    title.textContent = "Base operacional";
    main.appendChild(title);

    var description = document.createElement("p");
    description.className = "muted small";
    description.textContent = currentWorkspace.description || "Contexto ativo do sistema.";
    main.appendChild(description);

    var meta = document.createElement("div");
    meta.className = "workspace-bar-meta";

    var currentBadge = document.createElement("span");
    currentBadge.className = "workspace-badge" + (currentWorkspace.mode === "sandbox" ? " workspace-badge-test" : "") + (currentWorkspace.mode === "future" ? " workspace-badge-future" : "");
    currentBadge.textContent = "Base atual: " + currentWorkspace.label;
    meta.appendChild(currentBadge);

    if (currentWorkspace.mode === "operational") {
      var opBadge = document.createElement("span");
      opBadge.className = "workspace-badge";
      opBadge.textContent = "Operacao ativa";
      meta.appendChild(opBadge);
      if (manualDemoActive) {
        var demoBadge = document.createElement("span");
        demoBadge.className = "workspace-badge workspace-badge-test";
        demoBadge.textContent = "Demo manual isolado";
        meta.appendChild(demoBadge);
      }
    } else if (currentWorkspace.mode === "sandbox") {
      var testBadge = document.createElement("span");
      testBadge.className = "workspace-badge workspace-badge-test";
      testBadge.textContent = "Ambiente isolado";
      meta.appendChild(testBadge);
    } else {
      var futureBadge = document.createElement("span");
      futureBadge.className = "workspace-badge workspace-badge-future";
      futureBadge.textContent = "Planejado";
      meta.appendChild(futureBadge);
    }

    main.appendChild(meta);
    barTarget.appendChild(main);

    if (canSwitch && visibleWorkspaces.length > 1) {
      var selectorWrap = document.createElement("div");
      selectorWrap.className = "workspace-selector-wrap";

      var selectorLabel = document.createElement("label");
      selectorLabel.setAttribute("for", "workspaceSelector");
      selectorLabel.textContent = "Selecionar base";
      selectorWrap.appendChild(selectorLabel);

      var selector = document.createElement("select");
      selector.id = "workspaceSelector";
      visibleWorkspaces.forEach(function (workspace) {
        var option = document.createElement("option");
        option.value = workspace.key;
        option.textContent = workspace.label + (workspace.mode === "future" ? " (futuro)" : "");
        option.disabled = !!workspace.disabled;
        option.selected = workspace.key === currentWorkspace.key;
        selector.appendChild(option);
      });
      selector.addEventListener("change", function () {
        onChange(selector.value);
      });
      selectorWrap.appendChild(selector);
      barTarget.appendChild(selectorWrap);
    }

    if (currentWorkspace.mode === "operational" && !currentWorkspace.preBetaLocked) {
      setNodeVisible(noticeTarget, false);
      setNodeVisible(stageTarget, false);
      return;
    }

    setNodeVisible(noticeTarget, true);
    var noticeTitle = document.createElement("h4");
    noticeTitle.textContent = currentWorkspace.mode === "sandbox"
      ? "Modo TESTE isolado"
      : (currentWorkspace.preBetaLocked ? "LOA em preparacao" : "Base futura");
    noticeTarget.appendChild(noticeTitle);

    var noticeText = document.createElement("p");
    noticeText.className = "muted small";
    noticeText.textContent = currentWorkspace.notice || "Este contexto ainda nao opera a base oficial.";
    noticeTarget.appendChild(noticeText);

    if (currentWorkspace.preBetaLocked) {
      setNodeVisible(stageTarget, false);
      return;
    }

    setNodeVisible(stageTarget, true);
    var stageCard = document.createElement("div");
    stageCard.className = "workspace-stage-card";

    var stageTitle = document.createElement("h3");
    stageTitle.textContent = currentWorkspace.stageTitle || currentWorkspace.label;
    stageCard.appendChild(stageTitle);

    var stageCopy = document.createElement("p");
    stageCopy.className = "muted";
    stageCopy.textContent = currentWorkspace.stageDescription || "Contexto reservado para evolucao futura.";
    stageCard.appendChild(stageCopy);

    var grid = document.createElement("div");
    grid.className = "workspace-stage-grid";

    var panelRules = document.createElement("div");
    panelRules.className = "workspace-stage-panel";
    var panelRulesTitle = document.createElement("h4");
    panelRulesTitle.textContent = "Como esta funcionando agora";
    panelRules.appendChild(panelRulesTitle);
    var rulesList = document.createElement("ul");
    (currentWorkspace.rules || []).forEach(function (ruleText) {
      var li = document.createElement("li");
      li.textContent = ruleText;
      rulesList.appendChild(li);
    });
    panelRules.appendChild(rulesList);
    grid.appendChild(panelRules);

    var panelNext = document.createElement("div");
    panelNext.className = "workspace-stage-panel";
    var panelNextTitle = document.createElement("h4");
    panelNextTitle.textContent = "Proximo nivel";
    panelNext.appendChild(panelNextTitle);
    var nextList = document.createElement("ul");
    (currentWorkspace.nextSteps || []).forEach(function (stepText) {
      var li = document.createElement("li");
      li.textContent = stepText;
      nextList.appendChild(li);
    });
    panelNext.appendChild(nextList);
    grid.appendChild(panelNext);
    stageCard.appendChild(grid);

    if (currentWorkspace.mode === "sandbox") {
      var actions = document.createElement("div");
      actions.className = "workspace-stage-actions";

      var backBtn = document.createElement("button");
      backBtn.type = "button";
      backBtn.className = "btn primary";
      backBtn.textContent = "Voltar para LOA atual";
      backBtn.addEventListener("click", function () {
        onChange("LOA_ATUAL");
      });
      actions.appendChild(backBtn);

      stageCard.appendChild(actions);
    }

    stageTarget.appendChild(stageCard);
  }

  root.workspaceContextUtils = {
    renderWorkspaceContext: renderWorkspaceContext
  };
})(typeof window !== "undefined" ? window : globalThis);
