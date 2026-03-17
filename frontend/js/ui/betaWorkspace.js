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

  function renderBetaWorkspace(target, filteredRows, options) {
    var opts = options || {};
    var clearNodeChildren = typeof opts.clearNodeChildren === "function" ? opts.clearNodeChildren : clearNode;
    var activeTab = String(opts.activeTab || "history");
    var canViewGlobalAuditApi = typeof opts.canViewGlobalAuditApi === "function" ? opts.canViewGlobalAuditApi : function () { return false; };
    var showImportGovernance = !!opts.showImportGovernance;
    var renderHistory = typeof opts.renderHistory === "function" ? opts.renderHistory : noop;
    var renderPowerBi = typeof opts.renderPowerBi === "function" ? opts.renderPowerBi : noop;
    var renderSupport = typeof opts.renderSupport === "function" ? opts.renderSupport : noop;
    var renderImports = typeof opts.renderImports === "function" ? opts.renderImports : noop;
    var tabMetaMap = {
      history: {
        label: "Historico operacional",
        description: "Auditoria recente, filtros e leitura consolidada do que mudou na base operacional."
      },
      powerbi: {
        label: "Visao Power BI",
        description: "Camada analitica para supervisao, indicadores executivos e recortes por deputado, municipio e status."
      },
      support: {
        label: "Ajuda e suporte",
        description: "Fila de chamados, respostas operacionais e alinhamento entre usuarios de homologacao e equipe de suporte."
      },
      imports: {
        label: "Governanca de imports",
        description: "Lotes, linhas, logs e governanca do processo de importacao sem tirar a planilha principal do foco."
      }
    };
    var activeMeta = tabMetaMap[activeTab] || tabMetaMap.history;

    clearNodeChildren(target);

    var head = document.createElement("div");
    head.className = "beta-head";

    var intro = document.createElement("div");
    var title = document.createElement("h3");
    title.textContent = activeMeta.label;
    var subtitle = document.createElement("p");
    subtitle.className = "muted small";
    subtitle.textContent = activeMeta.description;
    intro.appendChild(title);
    intro.appendChild(subtitle);
    head.appendChild(intro);

    var headActions = document.createElement("div");
    headActions.className = "beta-head-actions";
    var routeBadge = document.createElement("span");
    routeBadge.className = "beta-source-badge";
    routeBadge.textContent = "Area ativa: " + activeMeta.label;
    headActions.appendChild(routeBadge);
    var mode = document.createElement("span");
    mode.className = "beta-source-badge";
    mode.textContent = canViewGlobalAuditApi() ? "API ligada para historico" : "Historico em fallback local";
    headActions.appendChild(mode);
    head.appendChild(headActions);
    target.appendChild(head);

    var panel = document.createElement("div");
    panel.className = "beta-tab-panel";
    target.appendChild(panel);

    if (activeTab === "imports" && showImportGovernance) {
      renderImports(panel, filteredRows);
    } else if (activeTab === "powerbi") {
      renderPowerBi(panel, filteredRows);
    } else if (activeTab === "support") {
      renderSupport(panel, filteredRows);
    } else {
      renderHistory(panel, filteredRows);
    }
  }

  root.betaWorkspaceUtils = {
    renderBetaWorkspace: renderBetaWorkspace
  };
})(window);
