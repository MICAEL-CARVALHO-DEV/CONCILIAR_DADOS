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
    var setTab = typeof opts.setTab === "function" ? opts.setTab : noop;
    var renderHistory = typeof opts.renderHistory === "function" ? opts.renderHistory : noop;
    var renderPowerBi = typeof opts.renderPowerBi === "function" ? opts.renderPowerBi : noop;
    var renderSupport = typeof opts.renderSupport === "function" ? opts.renderSupport : noop;
    var renderImports = typeof opts.renderImports === "function" ? opts.renderImports : noop;

    clearNodeChildren(target);

    var head = document.createElement("div");
    head.className = "beta-head";

    var intro = document.createElement("div");
    var title = document.createElement("h3");
    title.textContent = "Central beta operacional";
    var subtitle = document.createElement("p");
    subtitle.className = "muted small";
    subtitle.textContent = "Historico recente, visao consolidada e suporte operacional para homologacao da empresa.";
    intro.appendChild(title);
    intro.appendChild(subtitle);
    head.appendChild(intro);

    var headActions = document.createElement("div");
    headActions.className = "beta-head-actions";
    var mode = document.createElement("span");
    mode.className = "beta-source-badge";
    mode.textContent = canViewGlobalAuditApi() ? "API ligada para historico" : "Historico em fallback local";
    headActions.appendChild(mode);
    head.appendChild(headActions);
    target.appendChild(head);

    var tabs = document.createElement("div");
    tabs.className = "beta-tabs";
    var tabsConfig = [
      { key: "history", label: "Historico operacional" },
      { key: "powerbi", label: "Visao Power BI" },
      { key: "support", label: "Ajuda e suporte" }
    ];
    if (showImportGovernance) {
      tabsConfig.push({ key: "imports", label: "Governanca de imports" });
    }
    tabsConfig.forEach(function (tab) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "beta-tab-btn" + (activeTab === tab.key ? " active" : "");
      btn.textContent = tab.label;
      btn.addEventListener("click", function () {
        setTab(tab.key);
      });
      tabs.appendChild(btn);
    });
    target.appendChild(tabs);

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
