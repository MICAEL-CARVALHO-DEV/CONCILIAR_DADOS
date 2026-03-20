// =============================================================
// betaSupport.js — PAINEL DE SUPORTE E MONITOR DE CUSTOS
// Dono: Antigravity (frontend/js/ui/)
// Responsabilidade: Renderiza o painel de suporte (chamados, respostas,
//   inbox do programador) e o Monitor de Limites (Cloudflare / Render /
//   Supabase). Estado de custo persiste em localStorage.
// Contrato de opts (renderBetaSupportPanel): text, fmtDateTime,
//   normalizeLooseText, setSelectOptions, apiRequest, isSupportManagerUser,
//   canUseSupportApi, isApiEnabled, getSupportScopeValue, refreshSupportFromApi,
//   refreshSupportMessagesFromApi, rerender, setSupportFilters,
//   setSelectedThreadId, setLastRequest, setMessagesError,
//   threads, messages, filters, lastRequest, supportCategories,
//   supportThreadStatus, supportFilterDefaults, selectedThreadId,
//   loading, messagesLoading, error, messagesError, lastSyncAt.
// Exports: SECFrontend.betaSupportUtils
//   buildSupportUserOptions(threads, textFn) -> string[]
//   renderBetaSupportPanel(target, filteredRows, opts) -> void
// Nao tocar: app.js, index.html, style.css
// =============================================================
(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};
  var COST_MONITOR_STORAGE_KEY = "SEC_BETA_COST_MONITOR";

  function noop() {}

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function safeText(value) {
    return value == null ? "" : String(value).trim();
  }

  function clearNode(node) {
    if (!node) return;
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren();
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function toNumber(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clampToRange(value, minValue, maxValue) {
    var n = toNumber(value, minValue);
    if (n < minValue) n = minValue;
    if (n > maxValue) n = maxValue;
    return n;
  }

  function buildCostMonitorDefaults() {
    return {
      users: 3,
      cloudflareBuildsUsed: 0,
      cloudflareBuildsLimit: 500,
      cloudflareFilesUsed: 0,
      cloudflareFilesLimit: 20000,
      renderHoursUsed: 0,
      renderHoursLimit: 750,
      supabaseUsagePercent: 12,
      useRenderStarter: false,
      useSupabasePro: false
    };
  }

  function sanitizeCostMonitorState(value) {
    var defaults = buildCostMonitorDefaults();
    var src = value && typeof value === "object" ? value : {};
    return {
      users: clampToRange(src.users, 1, 500),
      cloudflareBuildsUsed: clampToRange(src.cloudflareBuildsUsed, 0, 1000000),
      cloudflareBuildsLimit: clampToRange(src.cloudflareBuildsLimit, 1, 1000000),
      cloudflareFilesUsed: clampToRange(src.cloudflareFilesUsed, 0, 10000000),
      cloudflareFilesLimit: clampToRange(src.cloudflareFilesLimit, 1, 10000000),
      renderHoursUsed: clampToRange(src.renderHoursUsed, 0, 100000),
      renderHoursLimit: clampToRange(src.renderHoursLimit, 1, 100000),
      supabaseUsagePercent: clampToRange(src.supabaseUsagePercent, 0, 100),
      useRenderStarter: src.useRenderStarter === true ? true : defaults.useRenderStarter,
      useSupabasePro: src.useSupabasePro === true ? true : defaults.useSupabasePro
    };
  }

  function readCostMonitorState() {
    try {
      var raw = global.localStorage ? global.localStorage.getItem(COST_MONITOR_STORAGE_KEY) : "";
      if (!raw) return buildCostMonitorDefaults();
      return sanitizeCostMonitorState(JSON.parse(raw));
    } catch (_err) {
      return buildCostMonitorDefaults();
    }
  }

  function saveCostMonitorState(state) {
    try {
      if (!global.localStorage) return;
      global.localStorage.setItem(COST_MONITOR_STORAGE_KEY, JSON.stringify(sanitizeCostMonitorState(state)));
    } catch (_err) {
      // no-op
    }
  }

  function usagePercent(used, limit) {
    if (!limit) return 0;
    var pct = (toNumber(used, 0) / toNumber(limit, 1)) * 100;
    return clampToRange(pct, 0, 9999);
  }

  function classifyUsage(percent) {
    var pct = toNumber(percent, 0);
    if (pct >= 90) return { level: "critical", label: "Critico" };
    if (pct >= 75) return { level: "attention", label: "Atencao" };
    return { level: "ok", label: "Estavel" };
  }

  function badgeClassByLevel(level) {
    if (level === "critical") return "is-critical";
    if (level === "attention") return "is-attention";
    return "is-ok";
  }

  function buildMonthlyCostEstimate(state) {
    var renderCost = state.useRenderStarter ? 7 : 0;
    var supabaseCost = state.useSupabasePro ? 25 : 0;
    return {
      render: renderCost,
      supabase: supabaseCost,
      total: renderCost + supabaseCost
    };
  }

  function renderCostMonitorCard(target) {
    var state = readCostMonitorState();
    var card = document.createElement("div");
    card.className = "beta-panel-card beta-cost-monitor-card";

    var title = document.createElement("h4");
    title.textContent = "Monitor de limites (beta)";
    card.appendChild(title);

    var note = document.createElement("p");
    note.className = "muted small";
    note.textContent = "Painel rapido para evitar surpresa de custo. Ajuste os valores conforme seu plano atual.";
    card.appendChild(note);

    var costLine = document.createElement("div");
    costLine.className = "beta-cost-estimate";
    var costValue = document.createElement("strong");
    var costSplit = document.createElement("span");
    costSplit.className = "muted small";
    costLine.appendChild(costValue);
    costLine.appendChild(costSplit);
    card.appendChild(costLine);

    var metricGrid = document.createElement("div");
    metricGrid.className = "beta-cost-metric-grid";
    card.appendChild(metricGrid);

    var metricCloudflare = document.createElement("div");
    metricCloudflare.className = "beta-cost-metric";
    var metricRender = document.createElement("div");
    metricRender.className = "beta-cost-metric";
    var metricSupabase = document.createElement("div");
    metricSupabase.className = "beta-cost-metric";
    metricGrid.appendChild(metricCloudflare);
    metricGrid.appendChild(metricRender);
    metricGrid.appendChild(metricSupabase);

    var formGrid = document.createElement("div");
    formGrid.className = "beta-cost-form-grid";
    card.appendChild(formGrid);

    function addNumberField(labelText, minValue) {
      var field = document.createElement("div");
      field.className = "field";
      var label = document.createElement("label");
      label.textContent = labelText;
      var input = document.createElement("input");
      input.type = "number";
      input.min = String(minValue || 0);
      input.step = "1";
      field.appendChild(label);
      field.appendChild(input);
      formGrid.appendChild(field);
      return input;
    }

    function addToggleField(labelText) {
      var field = document.createElement("div");
      field.className = "field beta-cost-toggle-field";
      var label = document.createElement("label");
      label.textContent = labelText;
      var wrap = document.createElement("label");
      wrap.className = "beta-cost-toggle";
      var input = document.createElement("input");
      input.type = "checkbox";
      var textNode = document.createElement("span");
      textNode.textContent = "Ativar plano pago";
      wrap.appendChild(input);
      wrap.appendChild(textNode);
      field.appendChild(label);
      field.appendChild(wrap);
      formGrid.appendChild(field);
      return input;
    }

    var inputUsers = addNumberField("Usuarios ativos no fluxo", 1);
    var inputBuildsUsed = addNumberField("Cloudflare builds usados", 0);
    var inputBuildsLimit = addNumberField("Cloudflare limite builds", 1);
    var inputFilesUsed = addNumberField("Cloudflare arquivos do projeto", 0);
    var inputFilesLimit = addNumberField("Cloudflare limite arquivos", 1);
    var inputRenderHoursUsed = addNumberField("Render horas usadas", 0);
    var inputRenderHoursLimit = addNumberField("Render limite horas", 1);
    var inputSupabaseUsagePercent = addNumberField("Supabase uso da cota gratis (%)", 0);
    var toggleRenderStarter = addToggleField("Render Starter (~US$7/mes)");
    var toggleSupabasePro = addToggleField("Supabase Pro (~US$25/mes)");

    var actions = document.createElement("div");
    actions.className = "beta-history-filter-actions";
    var resetBtn = document.createElement("button");
    resetBtn.className = "btn";
    resetBtn.type = "button";
    resetBtn.textContent = "Resetar monitor";
    actions.appendChild(resetBtn);
    card.appendChild(actions);

    function readFormState() {
      return sanitizeCostMonitorState({
        users: inputUsers.value,
        cloudflareBuildsUsed: inputBuildsUsed.value,
        cloudflareBuildsLimit: inputBuildsLimit.value,
        cloudflareFilesUsed: inputFilesUsed.value,
        cloudflareFilesLimit: inputFilesLimit.value,
        renderHoursUsed: inputRenderHoursUsed.value,
        renderHoursLimit: inputRenderHoursLimit.value,
        supabaseUsagePercent: inputSupabaseUsagePercent.value,
        useRenderStarter: !!toggleRenderStarter.checked,
        useSupabasePro: !!toggleSupabasePro.checked
      });
    }

    function applyStateToForm(nextState) {
      inputUsers.value = String(nextState.users);
      inputBuildsUsed.value = String(nextState.cloudflareBuildsUsed);
      inputBuildsLimit.value = String(nextState.cloudflareBuildsLimit);
      inputFilesUsed.value = String(nextState.cloudflareFilesUsed);
      inputFilesLimit.value = String(nextState.cloudflareFilesLimit);
      inputRenderHoursUsed.value = String(nextState.renderHoursUsed);
      inputRenderHoursLimit.value = String(nextState.renderHoursLimit);
      inputSupabaseUsagePercent.value = String(nextState.supabaseUsagePercent);
      toggleRenderStarter.checked = !!nextState.useRenderStarter;
      toggleSupabasePro.checked = !!nextState.useSupabasePro;
    }

    function metricLine(container, titleText, detailText, usageText, usageLevel) {
      clearNode(container);
      var head = document.createElement("div");
      head.className = "beta-cost-metric-head";
      var titleEl = document.createElement("strong");
      titleEl.textContent = titleText;
      var badge = document.createElement("span");
      badge.className = "beta-cost-badge " + badgeClassByLevel(usageLevel);
      badge.textContent = classifyUsage(parseFloat(usageText) || 0).label;
      head.appendChild(titleEl);
      head.appendChild(badge);
      container.appendChild(head);

      var detail = document.createElement("p");
      detail.className = "muted small";
      detail.textContent = detailText;
      container.appendChild(detail);

      var usage = document.createElement("p");
      usage.className = "beta-cost-usage";
      usage.textContent = "Uso: " + usageText + "%";
      container.appendChild(usage);
    }

    function refreshMonitorUi(nextState) {
      var monthly = buildMonthlyCostEstimate(nextState);
      costValue.textContent = "Estimativa mensal: US$ " + String(monthly.total.toFixed(2));
      costSplit.textContent = "Render: US$ " + String(monthly.render.toFixed(2)) + " | Supabase: US$ " + String(monthly.supabase.toFixed(2));

      var cfBuildsPct = usagePercent(nextState.cloudflareBuildsUsed, nextState.cloudflareBuildsLimit);
      var cfFilesPct = usagePercent(nextState.cloudflareFilesUsed, nextState.cloudflareFilesLimit);
      var cfPct = Math.max(cfBuildsPct, cfFilesPct);
      var renderPct = usagePercent(nextState.renderHoursUsed, nextState.renderHoursLimit);
      var supabasePct = clampToRange(nextState.supabaseUsagePercent, 0, 100);

      metricLine(
        metricCloudflare,
        "Cloudflare (Free)",
        "Builds " + String(nextState.cloudflareBuildsUsed) + "/" + String(nextState.cloudflareBuildsLimit) + " | Arquivos " + String(nextState.cloudflareFilesUsed) + "/" + String(nextState.cloudflareFilesLimit),
        cfPct.toFixed(1),
        classifyUsage(cfPct).level
      );
      metricLine(
        metricRender,
        nextState.useRenderStarter ? "Render (Starter)" : "Render (Free)",
        "Horas " + String(nextState.renderHoursUsed) + "/" + String(nextState.renderHoursLimit),
        renderPct.toFixed(1),
        classifyUsage(renderPct).level
      );
      metricLine(
        metricSupabase,
        nextState.useSupabasePro ? "Supabase (Pro)" : "Supabase (Free)",
        "Leitura rapida para fluxo com " + String(nextState.users) + " usuario(s) ativo(s).",
        supabasePct.toFixed(1),
        classifyUsage(supabasePct).level
      );
    }

    function persistAndRefresh() {
      var nextState = readFormState();
      saveCostMonitorState(nextState);
      refreshMonitorUi(nextState);
    }

    applyStateToForm(state);
    refreshMonitorUi(state);

    [
      inputUsers,
      inputBuildsUsed,
      inputBuildsLimit,
      inputFilesUsed,
      inputFilesLimit,
      inputRenderHoursUsed,
      inputRenderHoursLimit,
      inputSupabaseUsagePercent,
      toggleRenderStarter,
      toggleSupabasePro
    ].forEach(function (el) {
      el.addEventListener("input", persistAndRefresh);
      el.addEventListener("change", persistAndRefresh);
    });

    resetBtn.addEventListener("click", function () {
      var defaults = buildCostMonitorDefaults();
      saveCostMonitorState(defaults);
      applyStateToForm(defaults);
      refreshMonitorUi(defaults);
    });

    target.appendChild(card);
  }

  function fallbackSetSelectOptions(select, options, preferredValue) {
    if (!select) return;
    var items = safeArray(options);
    clearNode(select);
    items.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item && item.value != null ? String(item.value) : "";
      option.textContent = item && item.label != null ? String(item.label) : option.value;
      select.appendChild(option);
    });
    if (preferredValue != null) {
      select.value = String(preferredValue);
    }
  }

  function cloneFilters(defaults, overrides) {
    var next = {};
    if (defaults && typeof defaults === "object") {
      Object.keys(defaults).forEach(function (key) {
        next[key] = defaults[key];
      });
    }
    if (overrides && typeof overrides === "object") {
      Object.keys(overrides).forEach(function (key) {
        next[key] = overrides[key];
      });
    }
    return next;
  }

  function buildSupportUserOptions(threads, textFn) {
    var formatText = typeof textFn === "function" ? textFn : safeText;
    return Array.from(new Set(safeArray(threads).map(function (item) {
      return formatText(item && item.usuario_nome);
    }).filter(Boolean))).sort();
  }

  function appendFilterField(parent, labelText, control, grow) {
    var field = document.createElement("div");
    field.className = "field" + (grow ? " grow" : "");
    var label = document.createElement("label");
    label.textContent = labelText;
    field.appendChild(label);
    field.appendChild(control);
    parent.appendChild(field);
    return control;
  }

  function renderBetaSupportPanel(target, filteredRows, options) {
    var opts = options || {};
    var clearNodeChildren = typeof opts.clearNodeChildren === "function" ? opts.clearNodeChildren : clearNode;
    var text = typeof opts.text === "function" ? opts.text : safeText;
    var fmtDateTime = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : safeText;
    var normalizeLooseText = typeof opts.normalizeLooseText === "function" ? opts.normalizeLooseText : safeText;
    var setSelectOptions = typeof opts.setSelectOptions === "function" ? opts.setSelectOptions : fallbackSetSelectOptions;
    var getSupportThreadEmendaLabel = typeof opts.getSupportThreadEmendaLabel === "function" ? opts.getSupportThreadEmendaLabel : function () { return ""; };
    var getBackendIdForRecord = typeof opts.getBackendIdForRecord === "function" ? opts.getBackendIdForRecord : function () { return 0; };
    var toInt = typeof opts.toInt === "function" ? opts.toInt : function (value) { return Number.parseInt(value, 10) || 0; };
    var extractApiError = typeof opts.extractApiError === "function" ? opts.extractApiError : function (_err, fallback) { return String(fallback || "Falha ao comunicar com a API."); };
    var apiRequest = typeof opts.apiRequest === "function" ? opts.apiRequest : function () { return Promise.reject(new Error("apiRequest indisponivel")); };
    var isSupportManagerUser = typeof opts.isSupportManagerUser === "function" ? opts.isSupportManagerUser : function () { return false; };
    var canUseSupportApi = typeof opts.canUseSupportApi === "function" ? opts.canUseSupportApi : function () { return false; };
    var isApiEnabled = typeof opts.isApiEnabled === "function" ? opts.isApiEnabled : function () { return false; };
    var getSupportScopeValue = typeof opts.getSupportScopeValue === "function" ? opts.getSupportScopeValue : function () { return isSupportManagerUser() ? "all" : "mine"; };
    var refreshSupportFromApi = typeof opts.refreshSupportFromApi === "function" ? opts.refreshSupportFromApi : function () { return Promise.resolve(); };
    var refreshSupportMessagesFromApi = typeof opts.refreshSupportMessagesFromApi === "function" ? opts.refreshSupportMessagesFromApi : function () { return Promise.resolve(); };
    var rerender = typeof opts.rerender === "function" ? opts.rerender : noop;
    var setSupportFilters = typeof opts.setSupportFilters === "function" ? opts.setSupportFilters : noop;
    var setSelectedThreadId = typeof opts.setSelectedThreadId === "function" ? opts.setSelectedThreadId : noop;
    var setLastRequest = typeof opts.setLastRequest === "function" ? opts.setLastRequest : noop;
    var setMessagesError = typeof opts.setMessagesError === "function" ? opts.setMessagesError : noop;

    var threads = safeArray(opts.threads);
    var messages = safeArray(opts.messages);
    var filters = opts.filters && typeof opts.filters === "object" ? opts.filters : {};
    var lastRequest = opts.lastRequest && typeof opts.lastRequest === "object" ? opts.lastRequest : null;
    var supportCategories = safeArray(opts.supportCategories);
    var supportThreadStatus = safeArray(opts.supportThreadStatus);
    var supportFilterDefaults = opts.supportFilterDefaults && typeof opts.supportFilterDefaults === "object" ? opts.supportFilterDefaults : {};
    var rows = safeArray(filteredRows);
    var selectedThreadId = Number(opts.selectedThreadId || 0);
    var betaSupportLoading = !!opts.loading;
    var betaSupportMessagesLoading = !!opts.messagesLoading;
    var betaSupportError = String(opts.error || "");
    var betaSupportMessagesError = String(opts.messagesError || "");
    var betaSupportLastSyncAt = opts.lastSyncAt || "";

    clearNodeChildren(target);

    var intro = document.createElement("div");
    intro.className = "beta-panel-card";
    var title = document.createElement("h4");
    title.textContent = "Ajuda e suporte";
    var note = document.createElement("p");
    note.className = "muted small";
    note.textContent = isSupportManagerUser()
      ? "Inbox central de suporte. Voce pode acompanhar todos os chamados, responder e fechar quando a orientacao estiver resolvida."
      : "Abra um chamado com contexto da operacao. O acompanhamento completo fica centralizado com o PROGRAMADOR nesta etapa da beta.";
    intro.appendChild(title);
    intro.appendChild(note);
    target.appendChild(intro);
    renderCostMonitorCard(target);

    if (!canUseSupportApi()) {
      var empty = document.createElement("p");
      empty.className = "beta-empty";
      empty.textContent = isApiEnabled() ? "Faca login para usar o suporte." : "Suporte exige API ativa.";
      target.appendChild(empty);
      return;
    }

    if (isSupportManagerUser()) {
      var toolbar = document.createElement("div");
      toolbar.className = "beta-head-actions";
      var badge = document.createElement("span");
      badge.className = "beta-source-badge";
      badge.textContent = "Chamados: " + String(threads.length) + " | Escopo: " + (getSupportScopeValue() === "all" ? "todos" : "meus");
      toolbar.appendChild(badge);
      var refreshBtn = document.createElement("button");
      refreshBtn.className = "btn";
      refreshBtn.type = "button";
      refreshBtn.textContent = betaSupportLoading ? "Atualizando..." : "Atualizar suporte";
      refreshBtn.disabled = betaSupportLoading;
      refreshBtn.addEventListener("click", function () {
        refreshSupportFromApi(true).catch(noop);
      });
      toolbar.appendChild(refreshBtn);
      target.appendChild(toolbar);
    }

    var composer = document.createElement("div");
    composer.className = "beta-panel-card";
    var composerTitle = document.createElement("h4");
    composerTitle.textContent = "Abrir chamado";
    composer.appendChild(composerTitle);

    var composerGrid = document.createElement("div");
    composerGrid.className = "filters beta-support-compose-grid";

    var subjectInput = appendFilterField(composerGrid, "Assunto", document.createElement("input"), true);
    subjectInput.type = "text";
    subjectInput.placeholder = "Ex.: duvida no status da emenda";

    var categorySelect = appendFilterField(composerGrid, "Categoria", document.createElement("select"));
    setSelectOptions(categorySelect, supportCategories.map(function (value) {
      return { label: value, value: value };
    }), "OPERACAO");

    var emendaSelect = appendFilterField(composerGrid, "Emenda relacionada", document.createElement("select"));
    var emendaOptions = [{ label: "Nenhuma", value: "" }].concat(rows.slice(0, 120).map(function (rec) {
      var backendId = getBackendIdForRecord(rec);
      return {
        label: String(rec.id || "-") + " | " + text(rec.identificacao || "-"),
        value: backendId ? String(backendId) : ""
      };
    }).filter(function (item) { return !!item.value; }));
    setSelectOptions(emendaSelect, emendaOptions, "");

    var bodyField = document.createElement("div");
    bodyField.className = "field grow beta-support-message-field";
    var bodyLabel = document.createElement("label");
    bodyLabel.textContent = "Mensagem";
    var bodyInput = document.createElement("textarea");
    bodyInput.className = "kv-textarea";
    bodyInput.placeholder = "Descreva o problema, o contexto e o que voce esperava que acontecesse.";
    bodyField.appendChild(bodyLabel);
    bodyField.appendChild(bodyInput);
    composerGrid.appendChild(bodyField);

    var composerActions = document.createElement("div");
    composerActions.className = "beta-history-filter-actions";
    var openBtn = document.createElement("button");
    openBtn.className = "btn primary";
    openBtn.type = "button";
    openBtn.textContent = "Enviar chamado";
    var clearComposerBtn = document.createElement("button");
    clearComposerBtn.className = "btn";
    clearComposerBtn.type = "button";
    clearComposerBtn.textContent = "Limpar";
    composerActions.appendChild(openBtn);
    composerActions.appendChild(clearComposerBtn);
    bodyField.appendChild(composerActions);

    var composerFeedback = document.createElement("p");
    composerFeedback.className = "muted small";
    composerFeedback.style.marginTop = "8px";
    composer.appendChild(composerGrid);
    composer.appendChild(composerFeedback);
    target.appendChild(composer);

    clearComposerBtn.addEventListener("click", function () {
      subjectInput.value = "";
      categorySelect.value = "OPERACAO";
      emendaSelect.value = "";
      bodyInput.value = "";
      composerFeedback.textContent = "";
    });

    openBtn.addEventListener("click", async function () {
      var payload = {
        subject: String(subjectInput.value || "").trim(),
        categoria: String(categorySelect.value || "OUTRO"),
        emenda_id: toInt(emendaSelect.value) || undefined,
        mensagem: String(bodyInput.value || "").trim()
      };
      if (!payload.subject || !payload.mensagem) {
        composerFeedback.style.color = "#b4233d";
        composerFeedback.textContent = "Informe assunto e mensagem para abrir o chamado.";
        return;
      }
      composerFeedback.style.color = "";
      composerFeedback.textContent = "Enviando chamado...";
      try {
        var created = await apiRequest("POST", "/support/threads", payload, "UI");
        var emendaLabel = "";
        if (emendaSelect.value) {
          var selectedOption = emendaSelect.options && emendaSelect.selectedIndex >= 0 ? emendaSelect.options[emendaSelect.selectedIndex] : null;
          emendaLabel = selectedOption ? String(selectedOption.textContent || "") : "";
        }
        setSelectedThreadId(Number(created && created.id ? created.id : 0));
        setLastRequest({
          id: Number(created && created.id ? created.id : 0),
          subject: payload.subject,
          categoria: payload.categoria,
          emendaLabel: emendaLabel,
          createdAt: created && created.created_at ? created.created_at : ""
        });
        subjectInput.value = "";
        categorySelect.value = "OPERACAO";
        emendaSelect.value = "";
        bodyInput.value = "";
        composerFeedback.textContent = "Chamado enviado com sucesso.";
        await refreshSupportFromApi(true);
      } catch (err) {
        composerFeedback.style.color = "#b4233d";
        composerFeedback.textContent = extractApiError(err, "Falha ao abrir chamado.");
      }
    });

    if (!isSupportManagerUser()) {
      if (lastRequest) {
        var requestCard = document.createElement("div");
        requestCard.className = "beta-panel-card beta-support-request-card";
        var requestTitle = document.createElement("h4");
        requestTitle.textContent = "Solicitacao registrada";
        requestCard.appendChild(requestTitle);
        [
          "Protocolo: #" + String(lastRequest.id || "-"),
          "Assunto: " + text(lastRequest.subject || "-"),
          "Categoria: " + text(lastRequest.categoria || "-"),
          "Emenda relacionada: " + (text(lastRequest.emendaLabel || "") || "Nao vinculada"),
          "Envio: " + (lastRequest.createdAt ? fmtDateTime(lastRequest.createdAt) : "agora")
        ].forEach(function (line) {
          var item = document.createElement("div");
          item.className = "beta-metric-line";
          item.textContent = line;
          requestCard.appendChild(item);
        });
        target.appendChild(requestCard);
      }
      var restrictedNote = document.createElement("p");
      restrictedNote.className = "muted small";
      restrictedNote.textContent = "Nesta fase, usuarios operacionais usam apenas a solicitacao. Historico completo, respostas e fechamento ficam concentrados no PROGRAMADOR.";
      target.appendChild(restrictedNote);
      return;
    }

    var filterWrap = document.createElement("div");
    filterWrap.className = "filters beta-support-filter-grid";
    var statusSelect = document.createElement("select");
    var categoryFilterSelect = document.createElement("select");
    var userSelect = document.createElement("select");
    var scopeSelect = document.createElement("select");
    var searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "assunto, usuario, ultima mensagem...";
    searchInput.value = filters.q || "";

    setSelectOptions(statusSelect, [{ label: "Todos", value: "" }].concat(supportThreadStatus.map(function (value) {
      return { label: value, value: value };
    })), filters.status || "");
    setSelectOptions(categoryFilterSelect, [{ label: "Todas", value: "" }].concat(supportCategories.map(function (value) {
      return { label: value, value: value };
    })), filters.categoria || "");
    setSelectOptions(userSelect, [{ label: "Todos", value: "" }].concat(buildSupportUserOptions(threads, text).map(function (value) {
      return { label: value, value: value };
    })), filters.usuario || "");
    setSelectOptions(scopeSelect, [
      { label: "Meus chamados", value: "mine" },
      { label: "Todos os chamados", value: "all" }
    ], getSupportScopeValue());

    appendFilterField(filterWrap, "Status", statusSelect);
    appendFilterField(filterWrap, "Categoria", categoryFilterSelect);
    if (isSupportManagerUser()) appendFilterField(filterWrap, "Escopo", scopeSelect);
    if (isSupportManagerUser()) appendFilterField(filterWrap, "Usuario", userSelect);
    appendFilterField(filterWrap, "Busca", searchInput, true);
    var filterActions = document.createElement("div");
    filterActions.className = "field";
    var filterActionsLabel = document.createElement("label");
    filterActionsLabel.textContent = "Acoes";
    var filterActionsWrap = document.createElement("div");
    filterActionsWrap.className = "beta-history-filter-actions";
    var applyFilterBtn = document.createElement("button");
    applyFilterBtn.className = "btn primary";
    applyFilterBtn.type = "button";
    applyFilterBtn.textContent = "Aplicar";
    var clearFilterBtn = document.createElement("button");
    clearFilterBtn.className = "btn";
    clearFilterBtn.type = "button";
    clearFilterBtn.textContent = "Limpar";
    filterActionsWrap.appendChild(applyFilterBtn);
    filterActionsWrap.appendChild(clearFilterBtn);
    filterActions.appendChild(filterActionsLabel);
    filterActions.appendChild(filterActionsWrap);
    filterWrap.appendChild(filterActions);
    target.appendChild(filterWrap);

    applyFilterBtn.addEventListener("click", function () {
      setSupportFilters({
        status: String(statusSelect.value || ""),
        categoria: String(categoryFilterSelect.value || ""),
        usuario: String(userSelect.value || ""),
        q: String(searchInput.value || "").trim(),
        scope: isSupportManagerUser() ? String(scopeSelect.value || "mine") : "mine"
      });
      refreshSupportFromApi(true).catch(noop);
    });

    clearFilterBtn.addEventListener("click", function () {
      setSupportFilters(cloneFilters(supportFilterDefaults, {
        scope: isSupportManagerUser() ? "all" : "mine"
      }));
      refreshSupportFromApi(true).catch(noop);
    });

    searchInput.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      applyFilterBtn.click();
    });

    var layout = document.createElement("div");
    layout.className = "beta-support-layout";
    var listCard = document.createElement("div");
    listCard.className = "beta-panel-card beta-support-list-card";
    var detailCard = document.createElement("div");
    detailCard.className = "beta-panel-card beta-support-detail-card";
    layout.appendChild(listCard);
    layout.appendChild(detailCard);
    target.appendChild(layout);

    var listTitle = document.createElement("h4");
    listTitle.textContent = "Chamados";
    listCard.appendChild(listTitle);

    var listInfo = document.createElement("p");
    listInfo.className = "muted small";
    listInfo.textContent = "Ultima leitura: " + (betaSupportLastSyncAt ? fmtDateTime(betaSupportLastSyncAt) : "-");
    listCard.appendChild(listInfo);
    if (betaSupportError) {
      var err = document.createElement("p");
      err.className = "muted small";
      err.style.color = "#b4233d";
      err.textContent = betaSupportError;
      listCard.appendChild(err);
    }

    var threadList = document.createElement("div");
    threadList.className = "beta-support-thread-list";
    listCard.appendChild(threadList);

    if (betaSupportLoading && !threads.length) {
      var loading = document.createElement("p");
      loading.className = "beta-empty";
      loading.textContent = "Carregando chamados...";
      threadList.appendChild(loading);
    } else if (!threads.length) {
      var emptyMsg = document.createElement("p");
      emptyMsg.className = "beta-empty";
      emptyMsg.textContent = "Nenhum chamado encontrado para o filtro atual.";
      threadList.appendChild(emptyMsg);
    } else {
      threads.forEach(function (thread) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "beta-support-thread-item" + (Number(thread.id || 0) === selectedThreadId ? " active" : "");

        var head = document.createElement("div");
        head.className = "beta-support-thread-head";
        var subject = document.createElement("strong");
        subject.textContent = text(thread.subject || "Chamado sem titulo");
        var statusBadge = document.createElement("span");
        statusBadge.className = "beta-support-status beta-support-status-" + normalizeLooseText(thread.status || "ABERTO").replace(/\s+/g, "-");
        statusBadge.textContent = text(thread.status || "ABERTO");
        head.appendChild(subject);
        head.appendChild(statusBadge);
        button.appendChild(head);

        var meta = document.createElement("div");
        meta.className = "beta-history-meta";
        meta.textContent = text(thread.usuario_nome || "-") + " | " + text(thread.setor || "-") + " | " + text(thread.categoria || "OUTRO");
        button.appendChild(meta);

        var preview = document.createElement("div");
        preview.className = "beta-support-thread-preview";
        preview.textContent = text(thread.last_message_preview || "-");
        button.appendChild(preview);

        var extra = document.createElement("div");
        extra.className = "muted small";
        var emendaLabel = getSupportThreadEmendaLabel(thread);
        extra.textContent = (emendaLabel ? (emendaLabel + " | ") : "") + fmtDateTime(thread.last_message_at || thread.updated_at || thread.created_at);
        button.appendChild(extra);

        button.addEventListener("click", function () {
          var nextThreadId = Number(thread.id || 0);
          setSelectedThreadId(nextThreadId);
          refreshSupportMessagesFromApi(true, nextThreadId).catch(noop);
        });

        threadList.appendChild(button);
      });
    }

    var selectedThread = threads.find(function (item) {
      return Number(item && item.id ? item.id : 0) === selectedThreadId;
    }) || null;

    var detailTitle = document.createElement("h4");
    detailTitle.textContent = selectedThread ? ("Chamado #" + String(selectedThread.id)) : "Detalhe do chamado";
    detailCard.appendChild(detailTitle);

    if (!selectedThread) {
      var emptyDetail = document.createElement("p");
      emptyDetail.className = "beta-empty";
      emptyDetail.textContent = "Selecione um chamado para acompanhar a conversa.";
      detailCard.appendChild(emptyDetail);
      return;
    }

    var detailMeta = document.createElement("div");
    detailMeta.className = "beta-metric-stack";
    [
      "Assunto: " + text(selectedThread.subject || "-"),
      "Solicitante: " + text(selectedThread.usuario_nome || "-") + " | " + text(selectedThread.setor || "-"),
      "Categoria: " + text(selectedThread.categoria || "-"),
      "Status: " + text(selectedThread.status || "-"),
      "Emenda relacionada: " + (getSupportThreadEmendaLabel(selectedThread) || "Nao vinculada")
    ].forEach(function (line) {
      var item = document.createElement("div");
      item.className = "beta-metric-line";
      item.textContent = line;
      detailMeta.appendChild(item);
    });
    detailCard.appendChild(detailMeta);

    if (isSupportManagerUser()) {
      var statusBar = document.createElement("div");
      statusBar.className = "beta-history-filter-actions";
      statusBar.style.marginTop = "10px";
      var statusUpdateSelect = document.createElement("select");
      setSelectOptions(statusUpdateSelect, supportThreadStatus.map(function (value) {
        return { label: value, value: value };
      }), text(selectedThread.status || "ABERTO"));
      var statusUpdateBtn = document.createElement("button");
      statusUpdateBtn.className = "btn";
      statusUpdateBtn.type = "button";
      statusUpdateBtn.textContent = "Atualizar status";
      statusUpdateBtn.addEventListener("click", async function () {
        try {
          await apiRequest("PATCH", "/support/threads/" + String(selectedThread.id) + "/status", {
            status: String(statusUpdateSelect.value || "ABERTO")
          }, "UI");
          await refreshSupportFromApi(true);
        } catch (err) {
          setMessagesError(extractApiError(err, "Falha ao atualizar status do chamado."));
          rerender();
        }
      });
      statusBar.appendChild(statusUpdateSelect);
      statusBar.appendChild(statusUpdateBtn);
      detailCard.appendChild(statusBar);
    }

    if (betaSupportMessagesError) {
      var detailErr = document.createElement("p");
      detailErr.className = "muted small";
      detailErr.style.color = "#b4233d";
      detailErr.style.marginTop = "8px";
      detailErr.textContent = betaSupportMessagesError;
      detailCard.appendChild(detailErr);
    }

    var messageWrap = document.createElement("div");
    messageWrap.className = "beta-support-message-list";
    if (betaSupportMessagesLoading && !messages.length) {
      var messageLoading = document.createElement("p");
      messageLoading.className = "beta-empty";
      messageLoading.textContent = "Carregando conversa...";
      messageWrap.appendChild(messageLoading);
    } else if (!messages.length) {
      var emptyMessage = document.createElement("p");
      emptyMessage.className = "beta-empty";
      emptyMessage.textContent = "Sem mensagens neste chamado.";
      messageWrap.appendChild(emptyMessage);
    } else {
      messages.forEach(function (message) {
        var bubble = document.createElement("div");
        var isSupportBubble = text(message && message.origem) === "SUPORTE";
        bubble.className = "beta-support-message" + (isSupportBubble ? " support" : " user");
        var top = document.createElement("div");
        top.className = "beta-support-message-top";
        top.textContent = text(message.usuario_nome || "-") + " | " + text(message.setor || "-") + " | " + fmtDateTime(message.created_at);
        var body = document.createElement("div");
        body.className = "beta-support-message-body";
        body.textContent = text(message.mensagem || "");
        bubble.appendChild(top);
        bubble.appendChild(body);
        messageWrap.appendChild(bubble);
      });
    }
    detailCard.appendChild(messageWrap);

    var replyField = document.createElement("div");
    replyField.className = "field beta-support-reply-field";
    var replyLabel = document.createElement("label");
    replyLabel.textContent = "Responder";
    var replyInput = document.createElement("textarea");
    replyInput.className = "kv-textarea";
    replyInput.placeholder = isSupportManagerUser()
      ? "Resposta de suporte / orientacao operacional..."
      : "Complementar contexto, anexo logico, retorno do teste...";
    var replyActions = document.createElement("div");
    replyActions.className = "beta-history-filter-actions";
    var replyBtn = document.createElement("button");
    replyBtn.className = "btn primary";
    replyBtn.type = "button";
    replyBtn.textContent = isSupportManagerUser() ? "Enviar resposta" : "Enviar complemento";
    var reloadMessagesBtn = document.createElement("button");
    reloadMessagesBtn.className = "btn";
    reloadMessagesBtn.type = "button";
    reloadMessagesBtn.textContent = "Atualizar conversa";
    replyActions.appendChild(replyBtn);
    replyActions.appendChild(reloadMessagesBtn);
    replyField.appendChild(replyLabel);
    replyField.appendChild(replyInput);
    replyField.appendChild(replyActions);
    detailCard.appendChild(replyField);

    var replyFeedback = document.createElement("p");
    replyFeedback.className = "muted small";
    detailCard.appendChild(replyFeedback);

    reloadMessagesBtn.addEventListener("click", function () {
      refreshSupportMessagesFromApi(true, selectedThread.id).catch(noop);
    });

    replyBtn.addEventListener("click", async function () {
      var message = String(replyInput.value || "").trim();
      if (!message) {
        replyFeedback.style.color = "#b4233d";
        replyFeedback.textContent = "Informe a mensagem antes de enviar.";
        return;
      }
      replyFeedback.style.color = "";
      replyFeedback.textContent = "Enviando resposta...";
      try {
        await apiRequest("POST", "/support/threads/" + String(selectedThread.id) + "/messages", {
          mensagem: message
        }, "UI");
        replyInput.value = "";
        replyFeedback.textContent = "Mensagem enviada.";
        await refreshSupportFromApi(true);
      } catch (err) {
        replyFeedback.style.color = "#b4233d";
        replyFeedback.textContent = extractApiError(err, "Falha ao enviar mensagem.");
      }
    });
  }

  root.betaSupportUtils = {
    buildSupportUserOptions: buildSupportUserOptions,
    renderBetaSupportPanel: renderBetaSupportPanel
  };
})(typeof window !== "undefined" ? window : globalThis);
