/***********************
 * Prototipo SEC Emendas - v3
 * - Status oficial controlado por usuarios operacionais (supervisao monitora)
 * - Marcacao por usuario e timeline completa
 * - Importacao de XLSX (multiplas abas)
 * - Chave de referencia para duplicidade
 * - Merge de importacao sem perder historico
 ************************/

const STORAGE_KEY = "sec_emendas_prototipo_v3";
const LEGACY_STORAGE_KEYS = ["sec_emendas_prototipo_v2"];

const STATUS = [
  "Recebido",
  "Em analise",
  "Pendente",
  "Aguardando execucao",
  "Em execucao",
  "Aprovado",
  "Concluido",
  "Cancelado"
];
const STATUS_FILTERS = [
  { label: "Todos (andamento)", value: "" },
  { label: "Concluido global", value: "done" },
  { label: "Em andamento", value: "in_progress" },
  { label: "Atencao", value: "attention" },
  { label: "Sem marcacoes", value: "no_marks" }
];

const EXPORT_SCOPE = Object.freeze({
  ATUAIS: "ATUAIS",
  HISTORICO: "HISTORICO",
  PERSONALIZADO: "PERSONALIZADO"
});
const EXPORT_SCOPE_SUFFIX = Object.freeze({
  ATUAIS: "atual",
  HISTORICO: "historico",
  PERSONALIZADO: "custom"
});
const CROSS_TAB_CHANNEL_NAME = "sec_emendas";
const CROSS_TAB_PING_KEY = "SEC_STATE_PING";
const LOCAL_TAB_ID = "tab_" + Math.random().toString(36).slice(2) + "_" + Date.now();
const SYSTEM_MIGRATION_USER = "sistema";
const SYSTEM_MIGRATION_ROLE = "PROGRAMADOR";
const USER_ROLE_OPTIONS = ["APG", "SUPERVISAO", "CONTABIL", "POWERBI", "PROGRAMADOR"];
const PUBLIC_SELF_REGISTER_ROLE_OPTIONS = ["APG", "SUPERVISAO", "CONTABIL", "POWERBI"];
const API_BASE_URL_KEY = "SEC_API_BASE_URL";
const API_ENABLED_KEY = "SEC_API_ENABLED";
const API_SHARED_KEY_SESSION_KEY = "SEC_API_SHARED_KEY_SESSION";
const SESSION_TOKEN_KEY = "SEC_SESSION_TOKEN";
const SESSION_TOKEN_BACKUP_KEY = "SEC_SESSION_TOKEN_BKP";
const AUTH_LOGIN_PAGE = "login.html";
const AUTH_REGISTER_PAGE = "cadastro.html";
const STORAGE_MODE_KEY = "SEC_STORAGE_MODE";
const STORAGE_MODE_LOCAL = "local";
const STORAGE_MODE_SESSION = "session";
const DEFAULT_API_BASE_URL = "http://localhost:8000";
const RUNTIME_CONFIG = (typeof window !== "undefined" && window.SEC_APP_CONFIG && typeof window.SEC_APP_CONFIG === "object") ? window.SEC_APP_CONFIG : {};
const SEC_FRONTEND = (typeof window !== "undefined" && window.SECFrontend && typeof window.SECFrontend === "object") ? window.SECFrontend : {};
const storageUtils = SEC_FRONTEND.storageUtils || null;
const domUtils = SEC_FRONTEND.domUtils || null;
const escapeUtils = SEC_FRONTEND.escapeUtils || null;
const formatUtils = SEC_FRONTEND.formatUtils || null;
const normalizeUtils = SEC_FRONTEND.normalizeUtils || null;
const importNormalizationUtils = SEC_FRONTEND.importNormalizationUtils || null;
const idUtils = SEC_FRONTEND.idUtils || null;
const statusUtils = SEC_FRONTEND.statusUtils || null;
const progressUtils = SEC_FRONTEND.progressUtils || null;
const filterUtils = SEC_FRONTEND.filterUtils || null;
const exportUtils = SEC_FRONTEND.exportUtils || null;
const importReportUtils = SEC_FRONTEND.importReportUtils || null;
const authStore = SEC_FRONTEND.authStore || null;
const authGuard = SEC_FRONTEND.authGuard || null;
const apiClient = SEC_FRONTEND.apiClient || null;
const concurrencyService = SEC_FRONTEND.concurrencyService || null;
const uiRender = SEC_FRONTEND.uiRender || null;
const AUTH_KEYS = Object.freeze({
  userName: "SEC_USER_NAME",
  userRole: "SEC_USER_ROLE",
  legacyUserId: "SEC_USER_ID",
  sessionToken: SESSION_TOKEN_KEY,
  sessionTokenBackup: SESSION_TOKEN_BACKUP_KEY
});
const API_WS_PATH = "/ws";
const WS_RECONNECT_BASE_MS = 1500;
const WS_RECONNECT_MAX_MS = 15000;
const WS_REFRESH_DEBOUNCE_MS = 400;
const API_WS_ENABLED = String((RUNTIME_CONFIG && RUNTIME_CONFIG.API_WS_ENABLED) != null ? RUNTIME_CONFIG.API_WS_ENABLED : "false").trim().toLowerCase() === "true";
const EMENDA_LOCK_POLL_MS = 20000;
const API_DEFAULT_EVENT_ORIGIN = "UI";
const DEMO_MULTI_USERS = [
  { name: "Miguel", role: "APG" },
  { name: "Ana", role: "CONTABIL" },
  { name: "Bruno", role: "POWERBI" },
  { name: "Carla", role: "SUPERVISAO" }
];
const DEMO_NOTES = [
  "Aguardando documento complementar.",
  "Validacao contabil pendente.",
  "Encaminhado para execucao.",
  "Revisado em reuniao de acompanhamento.",
  "Aguardando retorno do setor responsavel."
];

const HOME_CHANGES_LIMIT = 14;
const REFERENCE_FIELDS = ["identificacao", "cod_subfonte", "cod_acao", "municipio", "deputado"];

const TRACKED_FIELDS = [
  { key: "ano", label: "Ano", type: "number" },
  { key: "identificacao", label: "Identificacao", type: "string" },
  { key: "cod_subfonte", label: "Cod Subfonte", type: "string" },
  { key: "deputado", label: "Deputado", type: "string" },
  { key: "cod_uo", label: "Cod UO", type: "string" },
  { key: "sigla_uo", label: "Sigla UO", type: "string" },
  { key: "cod_orgao", label: "Cod Orgao", type: "string" },
  { key: "cod_acao", label: "Cod Acao", type: "string" },
  { key: "descricao_acao", label: "Descricao Acao", type: "string" },
  { key: "plan_a", label: "Plano A", type: "string" },
  { key: "plan_b", label: "Plano B", type: "string" },
  { key: "municipio", label: "Municipio", type: "string" },
  { key: "valor_inicial", label: "Valor Inicial", type: "money" },
  { key: "valor_atual", label: "Valor Atual", type: "money" },
  { key: "processo_sei", label: "Processo SEI", type: "string" }
];

const TRACKED_FIELD_BY_KEY = TRACKED_FIELDS.reduce(function (acc, def) {
  acc[def.key] = def;
  return acc;
}, {});

const MODAL_FIELD_ORDER = [
  { key: "ano", label: "Ano", editable: true },
  { key: "identificacao", label: "Identificacao", editable: true },
  { key: "cod_subfonte", label: "Cod Subfonte", editable: true },
  { key: "cod_acao", label: "Cod Acao", editable: true },
  { key: "descricao_acao", label: "Descricao Acao", editable: true },
  { key: "plan_a", label: "Plano A", editable: true },
  { key: "plan_b", label: "Plano B", editable: true },
  { key: "municipio", label: "Municipio", editable: true },
  { key: "deputado", label: "Deputado", editable: true },
  { key: "cod_uo", label: "Cod UO", editable: true },
  { key: "sigla_uo", label: "Sigla UO", editable: true },
  { key: "cod_orgao", label: "Cod Orgao", editable: true },
  { key: "valor_inicial", label: "Valor Inicial", editable: true },
  { key: "valor_atual", label: "Valor Atual", editable: true },
  { key: "processo_sei", label: "Processo SEI", editable: true },
  { key: "ref_key", label: "Ref Key", editable: false }
];
const IMPORT_ALIASES = {
  id: ["id", "id_interno", "id interno", "codigo_interno", "codigo interno"],
  ano: ["ano", "exercicio"],
  identificacao: ["identificacao", "identificacao_emenda", "numero_emenda", "emenda", "identificacao da emenda"],
  cod_subfonte: ["cod_subfonte", "codigo_subfonte", "subfonte", "cod subfonte"],
  deputado: ["deputado", "autor", "parlamentar"],
  cod_uo: ["cod_uo", "codigo_uo", "uo", "cod uo"],
  sigla_uo: ["sigla_uo", "sigla uo", "uo_sigla", "sigla da uo", "sigla do uo"],
  cod_orgao: ["cod_orgao", "codigo_orgao", "orgao", "cod orgao"],
  cod_acao: ["cod_acao", "codigo_acao", "acao", "cod acao", "cod da acao", "cod. da acao", "codigo da acao"],
  descricao_acao: ["descricao_acao", "descricao da acao", "acao_descricao", "descricao", "descritor da acao"],
  plan_a: ["plan_a", "plano_a", "plano a", "planoa", "plano a acao", "plano de acao a"],
  plan_b: ["plan_b", "plano_b", "plano b", "planob", "plano b acao", "plano de acao b"],
  municipio: ["municipio", "cidade", "municipio / estado", "municipio estado"],
  valor_inicial: ["valor_inicial", "valor inicial", "valor_original", "valor original", "valor inicial epi"],
  valor_atual: ["valor_atual", "valor atual", "valor", "valor_emenda", "valor emenda", "valor atual epi"],
  processo_sei: ["processo_sei", "processo sei", "sei", "processo"],
  status_oficial: ["status_oficial", "status oficial", "status"]
};

const RAW_PREFERRED_HEADERS = {
  id: "ID Interno",
  ano: "Ano",
  identificacao: "Identificacao",
  cod_subfonte: "Cod Subfonte",
  deputado: "Deputado",
  cod_uo: "Cod. UO",
  sigla_uo: "Sigla da UO",
  cod_orgao: "Cod. Orgao",
  cod_acao: "Cod. da Acao",
  descricao_acao: "Descritor da Acao",
  plan_a: "Plano A",
  plan_b: "Plano B",
  municipio: "Municipio / Estado",
  valor_inicial: "Valor Inicial",
  valor_atual: "Valor Atual",
  processo_sei: "Processo SEI",
  status_oficial: "Status"
};

/**
 * Usuario local por maquina:
 * - CURRENT_USER: nome de quem esta usando
 * - CURRENT_ROLE: APG | SUPERVISAO | CONTABIL | POWERBI
 */
let CURRENT_USER = "USER01";
let CURRENT_ROLE = "CONTABIL";
let lastFocusedElement = null;
let modalDraftState = null;
let modalCloseInProgress = false;
let modalSaveFeedbackTimer = null;
let modalAutoCloseTimer = null;

configureFrontendModules();
loadUserConfig(false);

const DEMO = [
  mkRecord({
    demo_seed: true,
    id: "EPI-2026-000001",
    ano: 2026,
    identificacao: "EPI 2026 / Fanfarra",
    cod_subfonte: "SF-10",
    deputado: "DEP-ALFA",
    cod_uo: "1701",
    sigla_uo: "SEPLAN",
    cod_orgao: "17",
    cod_acao: "4023",
    descricao_acao: "Apoio a projetos culturais",
    municipio: "Salvador",
    valor_inicial: 120000,
    valor_atual: 120000,
    processo_sei: "SEI-0001/2026",
    status_oficial: "Recebido",
    eventos: [
      mkEvent("IMPORT", { note: "Registro criado (demo)." }),
      mkEvent("OFFICIAL_STATUS", { from: null, to: "Recebido", note: "Publicacao inicial.", actor_role: "SUPERVISAO", actor_user: "SUP01" }),
      mkEvent("MARK_STATUS", { to: "Em analise", note: "Inicio da analise.", actor_role: "APG", actor_user: "APG01" })
    ]
  }),
  mkRecord({
    demo_seed: true,
    id: "EPI-2026-000002",
    ano: 2026,
    identificacao: "EPI 2026 / Reforma Escola",
    cod_subfonte: "SF-20",
    deputado: "DEP-BETA",
    cod_uo: "1701",
    sigla_uo: "SEPLAN",
    cod_orgao: "17",
    cod_acao: "5100",
    descricao_acao: "Reforma de escola estadual",
    municipio: "Feira de Santana",
    valor_inicial: 450000,
    valor_atual: 450000,
    processo_sei: "SEI-0002/2026",
    status_oficial: "Em analise",
    eventos: [
      mkEvent("IMPORT", { note: "Registro criado (demo)." }),
      mkEvent("OFFICIAL_STATUS", { from: null, to: "Em analise", note: "Processo em andamento.", actor_role: "APG", actor_user: "APG02" }),
      mkEvent("MARK_STATUS", { to: "Aguardando execucao", note: "Aguardando ordem de servico.", actor_role: "POWERBI", actor_user: "PBI01" })
    ]
  })
];

let state = loadState();
state.records = (state.records || []).map(normalizeRecordShape);
migrateLegacyStatusRecords(state.records);

let selectedId = null;
let idCountersByYear = buildIdCounters(state.records);
let apiOnline = false;
let apiLastError = "";
let apiEmendaIdByInterno = {};
let apiSocket = null;
let apiSocketReconnectTimer = null;
let apiSocketBackoffMs = WS_RECONNECT_BASE_MS;
let apiRefreshTimer = null;
let apiRefreshRunning = false;
let presenceByBackendId = {};
let currentPresenceBackendId = null;
let emendaLockState = null;
let emendaLockReadOnly = false;
let emendaLockTimer = null;
let latestImportReport = null;
let latestExportReport = null;
let lastImportValidation = null;
let lastImportedWorkbookTemplate = null;
let lastImportedPlanilha1Aoa = null;
const stateChannel = (typeof window !== "undefined" && "BroadcastChannel" in window) ? new BroadcastChannel(CROSS_TAB_CHANNEL_NAME) : null;
assignMissingIds(state.records, idCountersByYear);
syncReferenceKeys(state.records);
saveState(true);

const tbody = document.getElementById("tbody");
const statusFilter = document.getElementById("statusFilter");
const yearFilter = document.getElementById("yearFilter");
const searchInput = document.getElementById("searchInput");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalSub = document.getElementById("modalSub");
const modalAccessState = document.getElementById("modalAccessState");
const modalClose = document.getElementById("modalClose");
const modalClose2 = document.getElementById("modalClose2");

const kv = document.getElementById("kv");
const kvDraftHint = document.getElementById("kvDraftHint");
const btnKvSave = document.getElementById("btnKvSave");
const modalSaveGuard = document.getElementById("modalSaveGuard");
const modalSaveFeedback = document.getElementById("modalSaveFeedback");
const historyEl = document.getElementById("history");
const userProgressBox = document.getElementById("userProgressBox");
const livePresenceText = document.getElementById("livePresenceText");

const markStatus = document.getElementById("markStatus");
const markReason = document.getElementById("markReason");
const btnMarkStatus = document.getElementById("btnMarkStatus");
const btnAddNote = document.getElementById("btnAddNote");

const conflictBox = document.getElementById("conflictBox");
const conflictText = document.getElementById("conflictText");
const marksSummary = document.getElementById("marksSummary");
const rawFields = document.getElementById("rawFields");

const btnExportAtuais = document.getElementById("btnExportAtuais");
const btnExportHistorico = document.getElementById("btnExportHistorico");
const btnExportCustom = document.getElementById("btnExportCustom");
const btnExportOne = document.getElementById("btnExportOne");
const btnReset = document.getElementById("btnReset");
const fileCsv = document.getElementById("fileCsv");
const importReport = document.getElementById("importReport");
const importLabel = document.querySelector("label[for='fileCsv']");
const currentUserInfo = document.getElementById("currentUserInfo");
const roleNotice = document.getElementById("roleNotice");
const supervisorQuickPanel = document.getElementById("supervisorQuickPanel");
const btnProfile = document.getElementById("btnProfile");
const btnPendingApprovals = document.getElementById("btnPendingApprovals");
const btnCreateProfile = document.getElementById("btnCreateProfile");
const btnLogout = document.getElementById("btnLogout");
const btnDemo4Users = document.getElementById("btnDemo4Users");

const exportCustomModal = document.getElementById("exportCustomModal");
const btnExportCustomClose = document.getElementById("btnExportCustomClose");
const btnExportCustomCancel = document.getElementById("btnExportCustomCancel");
const btnExportCustomApply = document.getElementById("btnExportCustomApply");
const exportCustomYear = document.getElementById("exportCustomYear");
const exportCustomStatus = document.getElementById("exportCustomStatus");
const exportCustomDeputado = document.getElementById("exportCustomDeputado");
const exportCustomMunicipio = document.getElementById("exportCustomMunicipio");
const exportCustomIncludeOld = document.getElementById("exportCustomIncludeOld");
const exportCustomSummary = document.getElementById("exportCustomSummary");

const profileModal = document.getElementById("profileModal");
const btnProfileClose = document.getElementById("btnProfileClose");
const btnProfileCloseX = document.getElementById("btnProfileCloseX");
const profileName = document.getElementById("profileName");
const profileRole = document.getElementById("profileRole");
const profileMode = document.getElementById("profileMode");
const profileApi = document.getElementById("profileApi");
const pendingUsersModal = document.getElementById("pendingUsersModal");
const btnPendingUsersClose = document.getElementById("btnPendingUsersClose");
const btnPendingUsersCloseX = document.getElementById("btnPendingUsersCloseX");
const btnPendingUsersRefresh = document.getElementById("btnPendingUsersRefresh");
const pendingUsersTableWrap = document.getElementById("pendingUsersTableWrap");
const pendingUsersFeedback = document.getElementById("pendingUsersFeedback");

const authGate = document.getElementById("authGate");
const authTabLogin = document.getElementById("authTabLogin");
const authTabRegister = document.getElementById("authTabRegister");
const authLoginForm = document.getElementById("authLoginForm");
const authRegisterForm = document.getElementById("authRegisterForm");
const authLoginName = document.getElementById("authLoginName");
const authLoginPassword = document.getElementById("authLoginPassword");
const authRegisterName = document.getElementById("authRegisterName");
const authRegisterRole = document.getElementById("authRegisterRole");
const authRegisterPassword = document.getElementById("authRegisterPassword");
const authRegisterPassword2 = document.getElementById("authRegisterPassword2");
const authMsg = document.getElementById("authMsg");

initSelects();
setupAuthUi();
setupCrossTabSync();
render();
initializeAuthFlow();

function getFilterUtil(methodName) {
  if (!filterUtils) return null;
  const method = filterUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getUiRenderUtil(methodName) {
  if (!uiRender) return null;
  const method = uiRender[methodName];
  return typeof method === "function" ? method : null;
}

function getProgressUtil(methodName) {
  if (!progressUtils) return null;
  const method = progressUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getFormatUtil(methodName) {
  if (!formatUtils) return null;
  const method = formatUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getNormalizeUtil(methodName) {
  if (!normalizeUtils) return null;
  const method = normalizeUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getStatusUtil(methodName) {
  if (!statusUtils) return null;
  const method = statusUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getIdUtil(methodName) {
  if (!idUtils) return null;
  const method = idUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getImportNormalizationUtil(methodName) {
  if (!importNormalizationUtils) return null;
  const method = importNormalizationUtils[methodName];
  return typeof method === "function" ? method : null;
}

// Inicializa os filtros da UI principal e prepara os selects dependentes.
function initSelects() {
  const initSelectsUtil = getFilterUtil("initSelects");
  if (initSelectsUtil) {
    initSelectsUtil({
      statusFilter: statusFilter,
      markStatus: markStatus,
      yearFilter: yearFilter,
      exportCustomYear: exportCustomYear,
      exportCustomStatus: exportCustomStatus,
      statusFilters: STATUS_FILTERS,
      statusValues: STATUS,
      records: state.records,
      toInt: toInt
    });
    return;
  }

  setSelectOptions(statusFilter, STATUS_FILTERS);

  setSelectOptions(markStatus, [{ label: "Selecione um status", value: "" }].concat(STATUS.map(function (s) {
    return { label: s, value: s };
  })));

  syncYearFilter();
  syncCustomExportFilters();
}

function syncYearFilter() {
  const syncYearFilterUtil = getFilterUtil("syncYearFilter");
  if (syncYearFilterUtil) {
    syncYearFilterUtil({
      select: yearFilter,
      current: yearFilter.value,
      records: state.records,
      toInt: toInt
    });
    return;
  }

  const current = yearFilter.value;
  const years = Array.from(new Set(state.records.map(function (r) {
    return toInt(r.ano);
  }))).filter(function (y) {
    return y > 0;
  }).sort(function (a, b) {
    return b - a;
  });

  const opts = [{ label: "Todos", value: "" }].concat(years.map(function (y) {
    return { label: String(y), value: String(y) };
  }));

  setSelectOptions(yearFilter, opts, current);
}

function syncCustomExportFilters() {
  const syncCustomExportFiltersUtil = getFilterUtil("syncCustomExportFilters");
  if (syncCustomExportFiltersUtil) {
    syncCustomExportFiltersUtil({
      exportCustomYear: exportCustomYear,
      exportCustomStatus: exportCustomStatus,
      records: state.records,
      statusValues: STATUS,
      toInt: toInt,
      currentYear: exportCustomYear ? exportCustomYear.value : "",
      currentStatus: exportCustomStatus ? exportCustomStatus.value : ""
    });
    return;
  }

  if (!exportCustomYear || !exportCustomStatus) return;

  const years = Array.from(new Set((state.records || []).map(function (r) {
    return toInt(r.ano);
  }))).filter(function (y) {
    return y > 0;
  }).sort(function (a, b) {
    return b - a;
  });

  const yearOptions = [{ label: "Todos", value: "" }].concat(years.map(function (y) {
    return { label: String(y), value: String(y) };
  }));

  const statusOptions = [{ label: "Todos", value: "" }].concat(STATUS.map(function (s) {
    return { label: s, value: s };
  }));

  setSelectOptions(exportCustomYear, yearOptions, exportCustomYear.value || "");
  setSelectOptions(exportCustomStatus, statusOptions, exportCustomStatus.value || "");
}

// Preenche um <select> mantendo valor anterior quando ainda for valido.
function setSelectOptions(select, options, preferredValue) {
  const setSelectOptionsUtil = getFilterUtil("setSelectOptions");
  if (setSelectOptionsUtil) {
    return setSelectOptionsUtil(select, options, preferredValue);
  }

  const prev = preferredValue !== undefined ? preferredValue : select.value;
  clearNodeChildren(select);
  options.forEach(function (opt) {
    const el = document.createElement("option");
    el.value = opt.value;
    el.textContent = opt.label;
    select.appendChild(el);
  });

  const hasPrev = options.some(function (opt) {
    return opt.value === prev;
  });
  select.value = hasPrev ? prev : options[0].value;
}

// Render da grade principal de emendas (dados + progresso + acoes).
function render() {
  const rows = getFiltered();
  while (tbody && tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  const renderMainRowUtil = getUiRenderUtil("renderMainRow");
  const useRenderer = !!renderMainRowUtil;
  const renderMainRows = function (r) {
    if (useRenderer) {
      renderMainRowUtil(tbody, r, {
        fmtMoney: fmtMoney,
        fmtDateTime: fmtDateTime,
        getActiveUsersWithLastMark: getActiveUsersWithLastMark,
        calcProgress: calcProgress,
        renderProgressBar: renderProgressBar,
        renderMemberChips: renderMemberChips,
        getLastEventDays: function (row) {
          return daysSince(lastEventAt(row));
        },
        onView: function (id) {
          openModal(id);
        }
      });
      return;
    }

    const users = getActiveUsersWithLastMark(r);
    const progress = calcProgress(users);
    const staleDays = daysSince(lastEventAt(r));

    const tr = document.createElement("tr");
    const tdId = document.createElement("td");
    const code = document.createElement("code");
    code.textContent = String(r.id || "");
    tdId.appendChild(code);
    tr.appendChild(tdId);

    const tdIdentificacao = document.createElement("td");
    tdIdentificacao.textContent = String(r.identificacao || "");
    tr.appendChild(tdIdentificacao);

    const tdMunicipio = document.createElement("td");
    tdMunicipio.textContent = String(r.municipio || "");
    tr.appendChild(tdMunicipio);

    const tdDeputado = document.createElement("td");
    tdDeputado.textContent = String(r.deputado || "");
    tr.appendChild(tdDeputado);

    const tdProgress = document.createElement("td");
    appendRenderedMarkup(tdProgress, renderProgressBar(progress));
    tr.appendChild(tdProgress);

    const tdChips = document.createElement("td");
    appendRenderedMarkup(tdChips, renderMemberChips(users));
    tr.appendChild(tdChips);

    const tdStale = document.createElement("td");
    tdStale.className = "muted small";
    tdStale.textContent = staleDays === Infinity ? "-" : (String(staleDays) + " dias");
    tr.appendChild(tdStale);

    const tdValor = document.createElement("td");
    tdValor.textContent = "R$ " + fmtMoney(r.valor_atual);
    tr.appendChild(tdValor);

    const tdUpdated = document.createElement("td");
    tdUpdated.className = "muted";
    tdUpdated.textContent = fmtDateTime(r.updated_at);
    tr.appendChild(tdUpdated);

    const tdAction = document.createElement("td");
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.setAttribute("data-action", "view");
    btn.setAttribute("data-id", String(r.id || ""));
    btn.textContent = "Ver";
    tdAction.appendChild(btn);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  };

  rows.forEach(renderMainRows);
  if (!useRenderer) {
    Array.prototype.forEach.call(tbody.querySelectorAll("button[data-action='view']"), function (btn) {
      btn.addEventListener("click", function () {
        openModal(btn.dataset.id);
      });
    });
  }

  renderImportDashboard();
  renderSupervisorQuickPanel(rows);
}

// Aplica filtros de status/ano/texto sobre o estado em memoria.
function getFiltered() {
  const status = statusFilter.value;
  const year = yearFilter.value;
  const q = (searchInput.value || "").trim().toLowerCase();

  return state.records.filter(function (r) {
    const users = getActiveUsersWithLastMark(r);
    const global = getGlobalProgressState(users);
    const okStatus = !status || global.code === status;
    const okYear = !year || String(r.ano) === year;
    const blob = [r.id, r.identificacao, r.municipio, r.deputado, r.processo_sei, r.cod_subfonte, r.cod_acao, r.cod_uo, r.sigla_uo, r.cod_orgao, r.ref_key].join(" ").toLowerCase();
    const okQuery = !q || blob.indexOf(q) >= 0;
    return okStatus && okYear && okQuery;
  }).sort(function (a, b) {
    if (a.id === b.id) return 0;
    return a.id > b.id ? 1 : -1;
  });
}

statusFilter.addEventListener("change", render);
yearFilter.addEventListener("change", render);
searchInput.addEventListener("input", debounce(render, 120));
if (btnProfile) {
  btnProfile.addEventListener("click", function () {
    openProfileModal();
  });
}
if (btnLogout) {
  btnLogout.addEventListener("click", async function () {
    await logoutCurrentUser();
    redirectToAuth(AUTH_LOGIN_PAGE, "logout=1");
  });
}
if (btnDemo4Users) {
  btnDemo4Users.addEventListener("click", function () {
    generateRandomMultiUserDemo();
  });
}

modalClose.addEventListener("click", function () { requestCloseModal(); });
modalClose2.addEventListener("click", function () { requestCloseModal(); });
modal.addEventListener("click", function (e) {
  if (e.target === modal) requestCloseModal();
});
if (btnKvSave) {
  btnKvSave.addEventListener("click", async function (e) { if (e) { e.preventDefault(); e.stopPropagation(); }
    clearModalAutoCloseTimer();
    const ok = await saveModalDraftChanges(false);
    if (ok) {
      modalAutoCloseTimer = setTimeout(function () {
        forceCloseModal();
      }, 1100);
    }
  });
}
if (markStatus) markStatus.addEventListener("change", function () { clearModalAutoCloseTimer(); updateModalDraftUi(); });
if (markReason) markReason.addEventListener("input", function () { clearModalAutoCloseTimer(); updateModalDraftUi(); });

function isUnsafeReloadShortcut(e) {
  if (!e) return false;
  var key = String(e.key || "").toLowerCase();
  if (key === "f5") return true;
  var accel = !!(e.ctrlKey || e.metaKey);
  return accel && key === "r";
}

document.addEventListener("keydown", function (e) {
  if (modal.classList.contains("show") && isModalDraftDirty() && isUnsafeReloadShortcut(e)) {
    e.preventDefault();
    e.stopPropagation();
    showModalSaveFeedback("ATENCAO: salve as edicoes antes de recarregar a pagina.", true);
    if (btnKvSave && typeof btnKvSave.focus === "function") btnKvSave.focus();
    return;
  }

  if (e.key !== "Escape") return;
  if (modal.classList.contains("show")) {
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
  if (pendingUsersModal && pendingUsersModal.classList.contains("show")) {
    closePendingUsersModal();
  }
});
window.addEventListener("beforeunload", function (e) {
  if (!modal.classList.contains("show")) return;
  if (!isModalDraftDirty() && !hasPendingModalAction()) return;
  e.preventDefault();
  e.returnValue = "";
});

btnMarkStatus.addEventListener("click", function (e) { if (e) { e.preventDefault(); e.stopPropagation(); }
  clearModalAutoCloseTimer();
  const rec = getSelected();
  if (!rec || !modalDraftState) return;
  if (!canMutateRecords()) {
    showModalSaveFeedback("Perfil SUPERVISAO: monitoramento apenas. Edicao bloqueada.", true);
    return;
  }

  const selectedStatus = markStatus ? (markStatus.value || "").trim() : "";
  if (!selectedStatus) {
    showModalSaveFeedback("ATENCAO: selecione um status para preparar a marcacao.", true);
    if (markStatus) markStatus.focus();
    updateModalDraftUi();
    return;
  }

  const next = normalizeStatus(selectedStatus);
  const why = (markReason.value || "").trim();
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
  showModalSaveFeedback("Marcacao preparada. Agora clique em Salvar edicoes para gravar.", false);
});

btnAddNote.addEventListener("click", function (e) { if (e) { e.preventDefault(); e.stopPropagation(); }
  clearModalAutoCloseTimer();
  const rec = getSelected();
  if (!rec || !modalDraftState) return;
  if (!canMutateRecords()) {
    showModalSaveFeedback("Perfil SUPERVISAO: monitoramento apenas. Edicao bloqueada.", true);
    return;
  }

  const why = (markReason.value || "").trim();
  if (!why) {
    showModalSaveFeedback("ATENCAO: escreva uma observacao para preparar a nota.", true);
    return;
  }

  modalDraftState.pendingAction = {
    type: "NOTE",
    reason: why
  };
  updateModalDraftUi();
  showModalSaveFeedback("Nota preparada. Agora clique em Salvar edicoes para gravar.", false);
});

if (btnExportOne) {
  btnExportOne.addEventListener("click", async function () {
    const rec = getSelected();
    if (!rec) return;

    const templateReady = !!(lastImportedWorkbookTemplate && lastImportedWorkbookTemplate.buffer);
    const templateMode = templateReady
      ? confirm("Exportar este registro em modo TEMPLATE (mesma estrutura do XLSX original)?")
      : false;
    const roundTripCheck = confirm("Executar round-trip check apos exportar? (pode ser mais lento)");
    const filename = "emenda_" + rec.id + "_" + dateStamp() + ".xlsx";

    const exportMeta = exportRecordsToXlsx([rec], filename, {
      useOriginalHeaders: true,
      roundTripCheck: roundTripCheck,
      templateMode: templateMode,
      exportScope: EXPORT_SCOPE.ATUAIS,
      exportFilters: { single_id: rec.id }
    });
    if (!exportMeta) return;

    latestExportReport = {
      escopo: EXPORT_SCOPE.ATUAIS,
      arquivoNome: filename,
      quantidadeRegistros: 1,
      filtros: { single_id: rec.id },
      geradoEm: isoNow()
    };
    renderImportDashboard();

    await syncExportLogToApi({
      formato: "XLSX",
      arquivoNome: filename,
      quantidadeRegistros: 1,
      quantidadeEventos: countAuditEvents([rec]),
      filtros: { single_id: rec.id },
      modoHeaders: templateMode ? "template_original" : "originais",
      escopoExportacao: EXPORT_SCOPE.ATUAIS,
      roundTripOk: exportMeta && exportMeta.roundTrip ? exportMeta.roundTrip.ok : null,
      roundTripIssues: exportMeta && exportMeta.roundTrip ? (exportMeta.roundTrip.issues || []) : []
    });
  });
}
if (btnExportAtuais) {
  btnExportAtuais.addEventListener("click", async function () {
    await runExportByScope(EXPORT_SCOPE.ATUAIS);
  });
}

if (btnExportHistorico) {
  btnExportHistorico.addEventListener("click", async function () {
    await runExportByScope(EXPORT_SCOPE.HISTORICO);
  });
}

if (btnExportCustom) {
  btnExportCustom.addEventListener("click", function () {
    openExportCustomModal();
  });
}

if (btnExportCustomApply) {
  btnExportCustomApply.addEventListener("click", async function () {
    const filters = {
      ano: exportCustomYear ? exportCustomYear.value : "",
      status: exportCustomStatus ? exportCustomStatus.value : "",
      deputado: exportCustomDeputado ? (exportCustomDeputado.value || "").trim() : "",
      municipio: exportCustomMunicipio ? (exportCustomMunicipio.value || "").trim() : "",
      include_old: !!(exportCustomIncludeOld && exportCustomIncludeOld.checked)
    };

    const ok = await runExportByScope(EXPORT_SCOPE.PERSONALIZADO, { customFilters: filters });
    if (ok) closeExportCustomModal();
  });
}

if (btnExportCustomClose) {
  btnExportCustomClose.addEventListener("click", closeExportCustomModal);
}
if (btnExportCustomCancel) {
  btnExportCustomCancel.addEventListener("click", closeExportCustomModal);
}
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
if (btnPendingApprovals) {
  btnPendingApprovals.addEventListener("click", function () {
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
    const btn = e.target && e.target.closest ? e.target.closest("button[data-pending-action='approve']") : null;
    if (!btn) return;
    const userId = Number(btn.getAttribute("data-user-id") || 0);
    if (!userId) return;
    approvePendingUser(userId).catch(function (err) {
      const msg = extractApiError(err, "Falha ao aprovar cadastro.");
      setPendingUsersFeedback(msg, true);
    });
  });
}

btnReset.addEventListener("click", function () {
  if (!canMutateRecords()) {
    alert("Perfil SUPERVISAO nao pode resetar dados.");
    return;
  }
  if (!confirm("Resetar para dados DEMO? Isso apaga alteracoes locais.")) return;
  state = { records: deepClone(DEMO).map(normalizeRecordShape) };
  idCountersByYear = buildIdCounters(state.records);
  assignMissingIds(state.records, idCountersByYear);
  syncReferenceKeys(state.records);
  saveState();
  syncYearFilter();
  render();
  closeModal();
  hideImportReport();
  lastImportedPlanilha1Aoa = null;
});

fileCsv.addEventListener("change", async function () {
  if (!canMutateRecords()) {
    alert("Perfil SUPERVISAO nao pode importar planilhas.");
    fileCsv.value = "";
    return;
  }
  const file = fileCsv.files && fileCsv.files[0];
  if (!file) return;

  try {
    const sourceRows = await parseInputFile(file);
    if (!sourceRows.length) {
      alert("Nenhuma linha valida encontrada no arquivo.");
      hideImportReport();
      return;
    }

    const removedDemo = purgeDemoBeforeOfficialImport();
    if (removedDemo > 0) {
      idCountersByYear = buildIdCounters(state.records || []);
    }

    const report = processImportedRows(sourceRows, file.name);
    saveState();
    syncYearFilter();
    render();
    showImportReport(report);
    const loteId = await syncImportBatchToApi(file, report);
    if (loteId) {
      await syncImportLinesToApi(loteId, report.rowDetails || []);
    }

    const extraDemoInfo = removedDemo > 0 ? (" | Demos removidos: " + String(removedDemo)) : "";
    alert("Importacao concluida. Criados: " + report.created + " | Atualizados: " + report.updated + " | Sem alteracao: " + report.unchanged + " | Linhas lidas: " + report.totalRows + extraDemoInfo);
  } catch (err) {
    console.error(err);
    const detail = err && err.message ? String(err.message) : "erro desconhecido";
    const hint = detail.includes("Biblioteca XLSX nao carregada") ? " Dica: abra por http://127.0.0.1:5500 e confirme internet para carregar a biblioteca XLSX." : "";
    alert("Falha ao importar arquivo. Detalhe: " + detail + hint);
  } finally {
    fileCsv.value = "";
  }
});

function getModalFieldType(fieldKey) {
  const def = TRACKED_FIELD_BY_KEY[fieldKey];
  return def && def.type ? def.type : "string";
}

function getModalFieldLabel(fieldKey, fallback) {
  const def = TRACKED_FIELD_BY_KEY[fieldKey];
  return def && def.label ? def.label : (fallback || fieldKey);
}

function normalizeDraftFieldValue(value, type) {
  const normalizeDraftFieldValueUtil = getFormatUtil("normalizeDraftFieldValue");
  if (normalizeDraftFieldValueUtil) {
    return normalizeDraftFieldValueUtil(value, type);
  }
  if (type === "money") return toNumber(value);
  if (type === "number") return toInt(value);
  return String(value == null ? "" : value).trim();
}

function formatDraftInputValue(value, type) {
  const formatDraftInputValueUtil = getFormatUtil("formatDraftInputValue");
  if (formatDraftInputValueUtil) {
    return formatDraftInputValueUtil(value, type);
  }
  if (type === "money") return fmtMoney(value || 0);
  if (type === "number") return String(toInt(value));
  return String(value == null ? "" : value);
}

function parseDraftFieldValue(raw, type) {
  const parseDraftFieldValueUtil = getFormatUtil("parseDraftFieldValue");
  if (parseDraftFieldValueUtil) {
    return parseDraftFieldValueUtil(raw, type);
  }
  const v = String(raw == null ? "" : raw);
  if (type === "money") return toNumber(v);
  if (type === "number") return toInt(v);
  return v.trim();
}

function initModalDraftForRecord(rec) {
  const draft = {};
  const original = {};

  MODAL_FIELD_ORDER.forEach(function (field) {
    if (!field.editable) return;
    const type = getModalFieldType(field.key);
    const normalized = normalizeDraftFieldValue(rec[field.key], type);
    draft[field.key] = normalized;
    original[field.key] = normalized;
  });

  modalDraftState = {
    recordId: rec.id,
    draft: draft,
    original: original,
    dirty: {}
  };

  updateModalDraftUi();
}

function isModalDraftDirty() {
  if (!modalDraftState || !modalDraftState.dirty) return false;
  return Object.keys(modalDraftState.dirty).length > 0;
}

function hasPendingModalAction() {
  return !!(modalDraftState && modalDraftState.pendingAction && modalDraftState.pendingAction.type);
}

function canSaveDraftNow() {
  if (!canMutateRecords()) return false;
  if (isEmendaLockReadOnly()) return false;
  if (hasPendingModalAction()) return true;
  if (!isModalDraftDirty()) return false;
  const selectedStatus = markStatus ? (markStatus.value || "").trim() : "";
  const reason = (markReason ? (markReason.value || "") : "").trim();
  return selectedStatus.length > 0 && reason.length > 0;
}

function getDraftSaveBlockReason() {
  if (!canMutateRecords()) {
    return "Perfil SUPERVISAO: monitoramento apenas, sem alteracao de dados.";
  }
  if (isEmendaLockReadOnly()) {
    return "Edicao bloqueada: esta emenda esta em uso por outro usuario (modo leitura).";
  }
  if (hasPendingModalAction()) return "";
  if (!isModalDraftDirty()) return "";
  const selectedStatus = markStatus ? (markStatus.value || "").trim() : "";
  if (!selectedStatus) {
    return "ATENCAO: nao e permitido salvar alteracoes de campos sem marcar status na secao de Marcacao de Status.";
  }
  const reason = (markReason ? (markReason.value || "") : "").trim();
  if (!reason) {
    return "ATENCAO: informe o motivo/observacao na Marcacao de Status para concluir o salvamento.";
  }
  return "";
}

function clearModalAutoCloseTimer() {
  if (modalAutoCloseTimer) {
    clearTimeout(modalAutoCloseTimer);
    modalAutoCloseTimer = null;
  }
}

function clearModalSaveFeedback() {
  if (!modalSaveFeedback) return;
  if (modalSaveFeedbackTimer) {
    clearTimeout(modalSaveFeedbackTimer);
    modalSaveFeedbackTimer = null;
  }
  modalSaveFeedback.textContent = "";
  modalSaveFeedback.classList.add("hidden");
  modalSaveFeedback.classList.remove("success", "error");
}

function showModalSaveFeedback(message, isError) {
  if (!modalSaveFeedback) return;
  clearModalSaveFeedback();
  modalSaveFeedback.textContent = message;
  modalSaveFeedback.classList.remove("hidden");
  modalSaveFeedback.classList.add(isError ? "error" : "success");
  modalSaveFeedbackTimer = setTimeout(function () {
    clearModalSaveFeedback();
  }, 2600);
}

function updateModalDraftUi() {
  const dirty = isModalDraftDirty();
  const pending = hasPendingModalAction();
  const hasDraft = dirty || pending;
  const canSave = canSaveDraftNow();
  const blockReason = getDraftSaveBlockReason();

  if (kvDraftHint) {
    kvDraftHint.classList.toggle("hidden", !hasDraft);
    if (hasDraft) {
      if (pending) {
        kvDraftHint.textContent = "Marcacao/nota pronta: somente Salvar edicoes grava no historico.";
      } else if (canSave) {
        kvDraftHint.textContent = "Edicao pendente: pronta para salvar.";
      } else {
        kvDraftHint.textContent = "Edicao pendente: informe status e motivo na marcacao para salvar.";
      }
    }
  }

  if (modalSaveGuard) {
    modalSaveGuard.classList.toggle("hidden", !hasDraft || !blockReason);
    modalSaveGuard.textContent = blockReason || "";
  }

  if (btnKvSave) btnKvSave.disabled = !canSave;

  if (!kv) return;
  const inputs = kv.querySelectorAll("[data-kv-field]");
  inputs.forEach(function (el) {
    const key = el.getAttribute("data-kv-field");
    const isDirty = !!(modalDraftState && modalDraftState.dirty && modalDraftState.dirty[key]);
    el.classList.toggle("kv-dirty", isDirty);
  });
}

function applyModalAccessProfile() {
  const readOnlyMode = !canMutateRecords() || isEmendaLockReadOnly();
  if (markStatus) markStatus.disabled = readOnlyMode;
  if (markReason) markReason.disabled = readOnlyMode;
  if (btnMarkStatus) btnMarkStatus.disabled = readOnlyMode;
  if (btnAddNote) btnAddNote.disabled = readOnlyMode;
  if (btnKvSave) btnKvSave.style.display = readOnlyMode ? "none" : "inline-block";
  if (kv) {
    const inputs = kv.querySelectorAll("[data-kv-field]");
    inputs.forEach(function (el) {
      el.disabled = readOnlyMode;
    });
  }
}

function onModalFieldInput(e) {
  if (!modalDraftState) return;
  if (!canMutateRecords()) return;
  clearModalSaveFeedback();
  const el = e.target;
  const key = el.getAttribute("data-kv-field");
  const type = el.getAttribute("data-kv-type") || "string";
  if (!key) return;

  const parsed = parseDraftFieldValue(el.value, type);
  modalDraftState.draft[key] = parsed;

  const original = modalDraftState.original[key];
  if (hasFieldChanged(original, parsed, type)) modalDraftState.dirty[key] = true;
  else delete modalDraftState.dirty[key];

  updateModalDraftUi();
}

// Renderiza editor de campos da emenda no modal.
function renderKvEditor(rec) {
  clearNodeChildren(kv);

  MODAL_FIELD_ORDER.forEach(function (field) {
    const k = document.createElement("div");
    k.className = "k";
    k.textContent = field.label;

    const v = document.createElement("div");
    v.className = "v";

    if (field.editable) {
      const type = getModalFieldType(field.key);
      const isLongText = field.key === "descricao_acao";
      const input = document.createElement(isLongText ? "textarea" : "input");
      input.className = isLongText ? "kv-textarea" : "kv-input";
      if (!isLongText) input.type = "text";
      input.setAttribute("data-kv-field", field.key);
      input.setAttribute("data-kv-type", type);
      input.value = formatDraftInputValue(modalDraftState && modalDraftState.draft ? modalDraftState.draft[field.key] : rec[field.key], type);
      if (!canMutateRecords()) input.disabled = true;
      input.addEventListener("input", onModalFieldInput);
      v.appendChild(input);
    } else {
      v.textContent = String(rec[field.key] == null ? "-" : rec[field.key]);
    }

    kv.appendChild(k);
    kv.appendChild(v);
  });

  applyModalAccessProfile();
  updateModalDraftUi();
}

// Salva alteracoes de campos feitas no modal e registra eventos.
async function saveModalDraftChanges(keepOpen) {
  clearModalAutoCloseTimer();
  if (!canMutateRecords()) {
    showModalSaveFeedback("Perfil SUPERVISAO: monitoramento apenas. Salvamento bloqueado.", true);
    return false;
  }
  if (isEmendaLockReadOnly()) {
    showModalSaveFeedback("Edicao bloqueada: emenda em uso por outro usuario.", true);
    return false;
  }
  if (!modalDraftState) return true;

  const hasDirty = isModalDraftDirty();
  const pendingAction = modalDraftState.pendingAction || null;
  if (!hasDirty && !pendingAction) return true;

  const rec = getSelected();
  if (!rec || rec.id !== modalDraftState.recordId) return false;
  const recSnapshot = deepClone(rec);

  const changedEvents = [];
  const dirtyKeys = Object.keys(modalDraftState.dirty || {});

  dirtyKeys.forEach(function (key) {
    const type = getModalFieldType(key);
    const label = getModalFieldLabel(key, key);
    const prev = rec[key];
    const next = normalizeDraftFieldValue(modalDraftState.draft[key], type);
    if (!hasFieldChanged(prev, next, type)) return;

    rec[key] = next;
    changedEvents.push(mkEvent("EDIT_FIELD", {
      key: key,
      field: label,
      from: stringifyFieldValue(prev, type),
      to: stringifyFieldValue(next, type),
      raw_from: prev,
      raw_to: next,
      note: "Edicao manual confirmada."
    }));
  });

  const oldRef = rec.ref_key || "";
  syncCanonicalToAllFields(rec);
  rec.ref_key = buildReferenceKey(rec);
  if (oldRef !== rec.ref_key) {
    changedEvents.push(mkEvent("EDIT_FIELD", {
      field: "Chave Referencia",
      from: oldRef,
      to: rec.ref_key,
      note: "Recalculada apos edicao manual."
    }));
  }

  let action = pendingAction;
  if (!action && changedEvents.length) {
    const selectedStatus = markStatus ? (markStatus.value || "").trim() : "";
    const reasonForSave = (markReason ? (markReason.value || "") : "").trim();
    if (!selectedStatus) {
      showModalSaveFeedback("ERRO: nao pode salvar alteracoes sem marcar status.", true);
      if (markStatus) markStatus.focus();
      updateModalDraftUi();
      return false;
    }
    if (!reasonForSave) {
      showModalSaveFeedback("ERRO: informe motivo/observacao para salvar alteracoes.", true);
      if (markReason) markReason.focus();
      updateModalDraftUi();
      return false;
    }
    action = { type: "MARK_STATUS", status: normalizeStatus(selectedStatus), reason: reasonForSave };
  }

  if (!action && !changedEvents.length) {
    modalDraftState.dirty = {};
    updateModalDraftUi();
    return true;
  }

  const prependEvents = [];
  if (action && action.type === "MARK_STATUS") {
    prependEvents.push(mkEvent("MARK_STATUS", { to: normalizeStatus(action.status || ""), note: String(action.reason || "") }));
  } else if (action && action.type === "NOTE") {
    prependEvents.push(mkEvent("NOTE", { note: String(action.reason || "") }));
  }

  prependEvents.push.apply(prependEvents, changedEvents);
  if (!prependEvents.length) return true;

  rec.updated_at = isoNow();
  rec.eventos = prependEvents.concat(rec.eventos || []);

  if (action && action.type === "MARK_STATUS") {
    try {
      await syncGenericEventToApi(rec, {
        tipo_evento: "MARK_STATUS",
        valor_novo: normalizeStatus(action.status || ""),
        motivo: String(action.reason || "")
      });
    } catch (err) {
      await rollbackSaveAndReport(err, rec, recSnapshot, "marcacao de status para salvar");
      return false;
    }
  } else if (action && action.type === "NOTE") {
    try {
      await syncGenericEventToApi(rec, {
        tipo_evento: "NOTE",
        motivo: String(action.reason || "")
      });
    } catch (err) {
      await rollbackSaveAndReport(err, rec, recSnapshot, "nota para salvar");
      return false;
    }
  }

  for (let i = 0; i < changedEvents.length; i += 1) {
    const ev = changedEvents[i];
    try {
      const fieldKey = String(ev.key || "").trim();
      const fieldType = getModalFieldType(fieldKey);
      const rawOld = Object.prototype.hasOwnProperty.call(ev, "raw_from") ? ev.raw_from : ev.from;
      const rawNew = Object.prototype.hasOwnProperty.call(ev, "raw_to") ? ev.raw_to : ev.to;
      await syncGenericEventToApi(rec, {
        tipo_evento: "EDIT_FIELD",
        campo_alterado: fieldKey || ev.field || "",
        valor_antigo: String(rawOld == null ? "" : normalizeDraftFieldValue(rawOld, fieldType)),
        valor_novo: String(rawNew == null ? "" : normalizeDraftFieldValue(rawNew, fieldType)),
        motivo: ev.note || "Edicao manual confirmada."
      });
    } catch (err) {
      await rollbackSaveAndReport(err, rec, recSnapshot, "edicao de campo");
      return false;
    }
  }

  saveState();
  if (typeof notifyStateUpdated === "function") notifyStateUpdated();
  render();

  if (keepOpen) {
    openModal(rec.id, true);
    setTimeout(function () {
      showModalSaveFeedback("Registro salvo com sucesso.", false);
    }, 80);
  } else {
    modalDraftState = null;
    updateModalDraftUi();
    showModalSaveFeedback("Registro salvo com sucesso.", false);
  }

  return true;
}
function discardModalDraftChanges(keepOpen) {
  if (keepOpen) {
    const rec = getSelected();
    if (rec) {
      openModal(rec.id, true);
      return;
    }
  }

  modalDraftState = null;
  updateModalDraftUi();
}

// Fecha modal com confirmacao quando existe alteracao pendente.
async function requestCloseModal() {
  if (modalCloseInProgress) return;
  modalCloseInProgress = true;
  try {
    if (isModalDraftDirty() || hasPendingModalAction()) {
      discardModalDraftChanges(false);
      forceCloseModal();
      return;
    }

    forceCloseModal();
  } finally {
    modalCloseInProgress = false;
  }
}
// Abre modal de detalhe da emenda selecionada.
function openModal(id, keepReasons) {
  clearModalAutoCloseTimer();
  clearModalSaveFeedback();
  const previousId = selectedId;
  if (previousId && previousId !== id) {
    const previousRec = (state.records || []).find(function (r) { return r.id === previousId; });
    if (previousRec) {
      announcePresenceForRecord(previousRec, "leave");
      releaseEmendaLock(previousRec).catch(function () { /* no-op */ });
    }
  }
  lastFocusedElement = document.activeElement;
  selectedId = id;
  const rec = getSelected();
  if (!rec) return;
  setEmendaLockReadOnly(!canMutateRecords());

  modalTitle.textContent = "Emenda: " + rec.id;
  modalSub.textContent = rec.identificacao + " | " + rec.municipio + " | " + rec.deputado;

  if (!keepReasons) {
    if (markStatus) markStatus.value = "";
    markReason.value = "";
  }

  initModalDraftForRecord(rec);
  renderKvEditor(rec);

  const users = getActiveUsersWithLastMark(rec);
  const progress = calcProgress(users);
  const delays = whoIsDelaying(users);
  const attentionIssues = getAttentionIssues(users);

  const lastMarks = getLastMarksByUser(rec);
  renderMarksSummary(lastMarks);
  renderRawFields(rec);

  if (userProgressBox) {
    renderUserProgressBox(userProgressBox, progress, delays, {
      renderProgressBar: renderProgressBar,
      renderMemberChips: renderMemberChips,
      users: users
    });
  }

  if (attentionIssues.length) {
    conflictBox.classList.remove("hidden");
    conflictText.textContent = attentionIssues.join(" | ");
  } else {
    conflictBox.classList.add("hidden");
    conflictText.textContent = "";
  }

  renderHistoryFallback(rec);

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  applyModalAccessProfile();
  renderEmendaLockInfo(rec);
  syncModalEmendaLock(rec).catch(function (_err) {
    renderEmendaLockInfo(rec);
  });
  setTimeout(function () {
    if (modalClose && typeof modalClose.focus === "function") modalClose.focus();
  }, 0);
}

function renderUserProgressBox(progressContainer, progress, delays, options) {
  if (!progressContainer) return;
  const opts = options || {};
  const progressRenderer = typeof opts.renderProgressBar === "function" ? opts.renderProgressBar : null;
  const chipsRenderer = typeof opts.renderMemberChips === "function" ? opts.renderMemberChips : null;
  const users = Array.isArray(opts.users) ? opts.users : [];

  clearNodeChildren(progressContainer);

  if (progressRenderer) {
    const progressWrap = document.createElement("div");
    appendRenderedMarkup(progressWrap, progressRenderer(progress));
    progressContainer.appendChild(progressWrap);
  }

  if (chipsRenderer) {
    const chipWrap = document.createElement("div");
    chipWrap.className = "member-chip-wrap";
    chipWrap.style.marginTop = "8px";
    appendRenderedMarkup(chipWrap, chipsRenderer(users));
    progressContainer.appendChild(chipWrap);
  }

  const footer = document.createElement("p");
  footer.className = "muted small";
  footer.style.marginTop = "8px";
  const label = document.createElement("b");
  const names = Array.isArray(delays) ? delays : [];
  if (names.length) {
    label.textContent = "Quem esta atrasando:";
    footer.appendChild(label);
    footer.appendChild(document.createTextNode(" " + names.map(function (u) { return String(u && u.name ? u.name : ""); }).join(", ")));
  } else {
    label.textContent = "Todos concluiram.";
    footer.appendChild(label);
  }
  progressContainer.appendChild(footer);
}

function renderRawFields(rec) {
  if (!rawFields) return;
  const renderRawFieldsUtil = getUiRenderUtil("renderRawFields");
  if (renderRawFieldsUtil) {
    const source = rec && rec.all_fields && typeof rec.all_fields === "object" ? rec.all_fields : null;
    renderRawFieldsUtil(rawFields, source, {});
    return;
  }

  clearNodeChildren(rawFields);
  const fallback = document.createElement("p");
  fallback.className = "muted small";
  fallback.textContent = "Renderizador indisponível (raw fields).";
  rawFields.appendChild(fallback);
}

function getEventsSorted(rec) {
  return (rec.eventos || []).slice().sort(function (a, b) {
    const ta = new Date(a.at).getTime() || 0;
    const tb = new Date(b.at).getTime() || 0;
    return tb - ta;
  });
}

function renderMarksSummary(lastMarks) {
  if (!marksSummary) return;
  const renderMarksSummaryUtil = getUiRenderUtil("renderMarksSummary");
  if (renderMarksSummaryUtil) {
    renderMarksSummaryUtil(marksSummary, lastMarks, {
      fmtDateTime: fmtDateTime,
      statusColor: statusColor
    });
    return;
  }

  clearNodeChildren(marksSummary);
  const fallback = document.createElement("p");
  fallback.className = "muted small";
  fallback.textContent = "Renderizador indisponível (resumo de marcacoes).";
  marksSummary.appendChild(fallback);
}

function renderHistoryFallback(rec) {
  if (!historyEl) return;
  const renderHistoryToContainerUtil = getUiRenderUtil("renderHistoryToContainer");
  if (renderHistoryToContainerUtil) {
    renderHistoryToContainerUtil(historyEl, getEventsSorted(rec), { fmtDateTime: fmtDateTime });
    return;
  }

  clearNodeChildren(historyEl);
  const fallback = document.createElement("p");
  fallback.className = "muted small";
  fallback.textContent = "Renderizador indisponível (historico).";
  historyEl.appendChild(fallback);
}

function getLastMarksByUser(rec) {
  const map = {};
  getEventsSorted(rec).forEach(function (ev) {
    if (ev.type !== "MARK_STATUS") return;
    const user = ev.actor_user;
    if (!user || map[user]) return;
    map[user] = { role: ev.actor_role, status: ev.to, at: ev.at, note: ev.note };
  });
  return map;
}

function getActiveUsersWithLastMark(rec) {
  const getActiveUsersWithLastMarkUtil = getProgressUtil("getActiveUsersWithLastMark");
  if (getActiveUsersWithLastMarkUtil) {
    return getActiveUsersWithLastMarkUtil(rec, {
      normalizeStatus: function (value) {
        return normalizeStatus(value);
      },
      localeCompare: function (a, b, locale) {
        return String(a || "").localeCompare(String(b || ""), locale);
      }
    });
  }
  return legacyGetActiveUsersWithLastMark(rec);
}

function calcProgress(users) {
  const calcProgressUtil = getProgressUtil("calcProgress");
  if (calcProgressUtil) {
    return calcProgressUtil(users);
  }
  return legacyCalcProgress(users);
}

function getAttentionIssues(users) {
  const getAttentionIssuesUtil = getProgressUtil("getAttentionIssues");
  if (getAttentionIssuesUtil) {
    return getAttentionIssuesUtil(users);
  }
  return legacyGetAttentionIssues(users);
}

function getGlobalProgressState(users) {
  const getGlobalProgressStateUtil = getProgressUtil("getGlobalProgressState");
  if (getGlobalProgressStateUtil) {
    return getGlobalProgressStateUtil(users);
  }
  return legacyGetGlobalProgressState(users);
}

function getInitials(name) {
  const getInitialsUtil = getProgressUtil("getInitials");
  if (getInitialsUtil) {
    return getInitialsUtil(name);
  }
  return legacyGetInitials(name);
}

function statusClass(status) {
  const statusClassUtil = getStatusUtil("statusClass");
  if (statusClassUtil) {
    return statusClassUtil(status, normalizeLooseText);
  }

  const s = normalizeLooseText(status);
  if (s.indexOf("concl") >= 0) return "st-ok";
  if (s.indexOf("cancel") >= 0) return "st-bad";
  if (s.indexOf("pend") >= 0 || s.indexOf("aguard") >= 0) return "st-warn";
  if (s.indexOf("exec") >= 0 || s.indexOf("anal") >= 0 || s.indexOf("apro") >= 0 || s.indexOf("rece") >= 0) return "st-mid";
  return "st-none";
}

function renderMemberChips(users) {
  const renderMemberChipsUtil = getProgressUtil("renderMemberChips");
  if (renderMemberChipsUtil) {
    return renderMemberChipsUtil(users, {
      escapeHtml: escapeHtml,
      statusClass: statusClass,
      daysSince: daysSince
    });
  }
  return legacyRenderMemberChips(users);
}

function renderProgressBar(progress) {
  const renderProgressBarUtil = getProgressUtil("renderProgressBar");
  if (renderProgressBarUtil) {
    return renderProgressBarUtil(progress);
  }
  return legacyRenderProgressBar(progress);
}

function lastEventAt(rec) {
  const lastEventAtUtil = getProgressUtil("lastEventAt");
  if (lastEventAtUtil) {
    return lastEventAtUtil(rec);
  }
  return legacyLastEventAt(rec);
}

function daysSince(iso) {
  const daysSinceUtil = getProgressUtil("daysSince");
  if (daysSinceUtil) {
    return daysSinceUtil(iso);
  }
  return legacyDaysSince(iso);
}

function whoIsDelaying(users) {
  const whoIsDelayingUtil = getProgressUtil("whoIsDelaying");
  if (whoIsDelayingUtil) {
    return whoIsDelayingUtil(users);
  }
  return legacyWhoIsDelaying(users);
}

function legacyGetActiveUsersWithLastMark(rec) {
  const map = new Map();
  const events = Array.isArray(rec && rec.eventos) ? rec.eventos : [];

  events.forEach(function (ev) {
    if (!ev || !ev.actor_user) return;
    if (ev.type !== "MARK_STATUS" && ev.type !== "NOTE") return;
    if (!map.has(ev.actor_user)) {
      map.set(ev.actor_user, {
        name: ev.actor_user,
        role: ev.actor_role || "-",
        lastStatus: null,
        lastAt: null,
        lastNote: ""
      });
    }
  });

  events.forEach(function (ev) {
    if (!ev || ev.type !== "MARK_STATUS" || !ev.actor_user || !map.has(ev.actor_user)) return;
    const user = map.get(ev.actor_user);
    const ts = ev.at ? (new Date(ev.at).getTime() || 0) : 0;
    const oldTs = user.lastAt ? (new Date(user.lastAt).getTime() || 0) : 0;
    if (!user.lastAt || ts >= oldTs) {
      user.lastStatus = normalizeStatus(ev.to || "");
      user.lastAt = ev.at || null;
      user.lastNote = ev.note || "";
      user.role = ev.actor_role || user.role || "-";
    }
  });

  return Array.from(map.values()).sort(function (a, b) {
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

function legacyCalcProgress(users) {
  const total = Array.isArray(users) ? users.length : 0;
  const concl = (users || []).filter(function (u) { return u.lastStatus === "Concluido"; }).length;
  return {
    total: total,
    concl: concl,
    percent: total ? Math.round((concl / total) * 100) : 0,
    done: total > 0 && concl === total
  };
}

function legacyGetAttentionIssues(users) {
  const issues = [];
  const list = Array.isArray(users) ? users : [];
  if (!list.length) return issues;

  const noStatus = list.filter(function (u) { return !u.lastStatus; });
  if (noStatus.length) {
    issues.push("Usuarios sem status: " + noStatus.map(function (u) { return u.name; }).join(", "));
  }

  const hasCancelado = list.some(function (u) { return u.lastStatus === "Cancelado"; });
  const hasConcluido = list.some(function (u) { return u.lastStatus === "Concluido"; });
  if (hasCancelado && hasConcluido) {
    issues.push("Ha Cancelado junto com Concluido no mesmo registro.");
  }

  return issues;
}

function legacyGetGlobalProgressState(users) {
  const list = Array.isArray(users) ? users : [];
  if (!list.length) return { code: "no_marks", label: "Sem marcacoes" };
  const progress = legacyCalcProgress(list);
  const issues = legacyGetAttentionIssues(list);
  if (issues.length) return { code: "attention", label: "Atencao" };
  if (progress.done) return { code: "done", label: "Concluido global" };
  return { code: "in_progress", label: "Em andamento" };
}

function legacyGetInitials(name) {
  return String(name || "").trim().split(/\s+/).slice(0, 2).map(function (p) { return p.charAt(0); }).join("").toUpperCase();
}

function legacyRenderMemberChips(users) {
  const list = Array.isArray(users) ? users : [];
  if (!list.length) return "<span class=\"muted small\">Sem marcacoes</span>";

  return list.map(function (u) {
    const cls = statusClass(u.lastStatus || "");
    const stale = daysSince(u.lastAt);
    const staleTag = stale === Infinity ? "" : "<span class=\"chip-age\">" + String(stale) + "d</span>";
    const title = escapeHtml(u.name + " / " + (u.role || "-") + " | " + (u.lastStatus || "Sem status") + " | " + (u.lastAt || "-"));
    return "<span class=\"member-chip " + cls + "\" title=\"" + title + "\"><span class=\"mav\">" + escapeHtml(legacyGetInitials(u.name)) + "</span><span class=\"mtxt\">" + escapeHtml(u.lastStatus || "Sem status") + "</span>" + staleTag + "</span>";
  }).join("");
}

function legacyRenderProgressBar(progress) {
  const safe = progress || { concl: 0, total: 0, percent: 0, done: false };
  const cls = safe.done ? "ok" : (safe.percent >= 50 ? "warn" : "bad");
  return ""
    + "<div class=\"prog\">"
    + "  <div class=\"prog-top\"><span class=\"light " + cls + "\"></span><span class=\"muted small\">" + String(safe.concl) + "/" + String(safe.total) + " concluiram (" + String(safe.percent) + "%)</span></div>"
    + "  <div class=\"prog-bar\"><div class=\"prog-fill " + cls + "\" style=\"width:" + String(safe.percent) + "%\"></div></div>"
    + "</div>";
}

function legacyLastEventAt(rec) {
  const events = Array.isArray(rec && rec.eventos) ? rec.eventos : [];
  let maxTs = 0;
  let out = null;
  events.forEach(function (ev) {
    const ts = ev && ev.at ? (new Date(ev.at).getTime() || 0) : 0;
    if (ts > maxTs) {
      maxTs = ts;
      out = ev.at;
    }
  });
  return out;
}

function legacyDaysSince(iso) {
  if (!iso) return Infinity;
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts) || ts <= 0) return Infinity;
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}

function legacyWhoIsDelaying(users) {
  return (users || []).filter(function (u) {
    return u.lastStatus !== "Concluido";
  });
}

function closeModal() {
  requestCloseModal();
}

function forceCloseModal() {
  const activeRec = getSelected();
  if (activeRec) {
    announcePresenceForRecord(activeRec, "leave");
    releaseEmendaLock(activeRec).catch(function () { /* no-op */ });
  }
  clearEmendaLockTimer();
  setEmendaLockState(null);
  clearModalAutoCloseTimer();
  clearModalSaveFeedback();
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  if (modalAccessState) {
    modalAccessState.classList.add("hidden");
    modalAccessState.textContent = "";
  }
  selectedId = null;
  modalDraftState = null;
  updateModalDraftUi();
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function getSelected() {
  return state.records.find(function (r) {
    return r.id === selectedId;
  });
}

// Pipeline de importacao: cria/atualiza registros e gera relatorio consolidado.
function processImportedRows(sourceRows, fileName) {
  const report = {
    fileName: fileName,
    totalRows: sourceRows.length,
    consideredRows: 0,
    skippedRows: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    duplicateById: 0,
    duplicateByRef: 0,
    duplicateInFile: 0,
    conflictIdVsRef: 0,
    sheetNames: [],
    rowDetails: [],
    validation: lastImportValidation || null
  };

  const sheetSet = new Set();
  const existingById = new Map();
  const existingByRef = new Map();
  const seenImportRef = new Set();

  state.records.forEach(function (rec) {
    existingById.set(rec.id, rec);
    if (rec.ref_key && !existingByRef.has(rec.ref_key)) existingByRef.set(rec.ref_key, rec);
  });

  sourceRows.forEach(function (ctx) {
    sheetSet.add(ctx.sheetName || "XLSX");
    const incoming = mapImportRow(ctx);

    if (!hasUsefulData(incoming)) {
      report.skippedRows += 1;
      report.rowDetails.push({
        ordem: report.rowDetails.length + 1,
        sheet_name: ctx.sheetName || "XLSX",
        row_number: ctx.rowNumber != null ? Number(ctx.rowNumber) : 0,
        status_linha: "SKIPPED",
        id_interno: incoming.id || "",
        ref_key: incoming.ref_key || "",
        mensagem: "Linha ignorada: sem dados uteis"
      });
      return;
    }
    report.consideredRows += 1;

    if (incoming.ref_key) {
      if (seenImportRef.has(incoming.ref_key)) report.duplicateInFile += 1;
      seenImportRef.add(incoming.ref_key);
    }

    const byId = incoming.id ? existingById.get(incoming.id) : null;
    const byRef = incoming.ref_key ? existingByRef.get(incoming.ref_key) : null;

    if (byId) report.duplicateById += 1;
    if (!byId && byRef) report.duplicateByRef += 1;

    let target = byId || byRef || null;
    if (byId && byRef && byId !== byRef) {
      report.conflictIdVsRef += 1;
      target = byId;
    }

    if (!target) {
      const created = createRecordFromImport(incoming, ctx, fileName);
      state.records.push(created);
      existingById.set(created.id, created);
      if (created.ref_key && !existingByRef.has(created.ref_key)) existingByRef.set(created.ref_key, created);
      report.created += 1;
      report.rowDetails.push({
        ordem: report.rowDetails.length + 1,
        sheet_name: ctx.sheetName || "XLSX",
        row_number: ctx.rowNumber != null ? Number(ctx.rowNumber) : 0,
        status_linha: "CREATED",
        id_interno: created.id || "",
        ref_key: created.ref_key || "",
        mensagem: "Registro criado"
      });
      return;
    }

    const mergeResult = mergeImportIntoRecord(target, incoming, ctx, fileName);
    if (mergeResult.changedAny) report.updated += 1;
    else report.unchanged += 1;

    report.rowDetails.push({
      ordem: report.rowDetails.length + 1,
      sheet_name: ctx.sheetName || "XLSX",
      row_number: ctx.rowNumber != null ? Number(ctx.rowNumber) : 0,
      status_linha: byId && byRef && byId !== byRef ? "CONFLICT" : (mergeResult.changedAny ? "UPDATED" : "UNCHANGED"),
      id_interno: target.id || "",
      ref_key: target.ref_key || incoming.ref_key || "",
      mensagem: byId && byRef && byId !== byRef ? "Conflito ID x chave referencia; aplicado no ID existente" : (mergeResult.changedAny ? "Registro atualizado" : "Sem alteracao")
    });

    existingById.set(target.id, target);
    if (target.ref_key) existingByRef.set(target.ref_key, target);
  });

  report.sheetNames = Array.from(sheetSet);
  if (!report.validation) report.validation = buildImportValidationReport(sourceRows);
  return report;
}

// Cria um novo registro interno a partir de uma linha importada.
function createRecordFromImport(incoming, ctx, fileName) {
  const now = isoNow();
  const ano = incoming.ano || currentYear();
  const id = incoming.id || generateInternalId(ano, idCountersByYear);

  const base = mkRecord({
    id: id,
    ano: ano,
    identificacao: incoming.identificacao || "-",
    cod_subfonte: incoming.cod_subfonte || "",
    deputado: incoming.deputado || "-",
    cod_uo: incoming.cod_uo || "",
    sigla_uo: incoming.sigla_uo || "",
    cod_orgao: incoming.cod_orgao || "",
    cod_acao: incoming.cod_acao || "",
    descricao_acao: incoming.descricao_acao || "",
    plan_a: incoming.plan_a || "",
    plan_b: incoming.plan_b || "",
    municipio: incoming.municipio || "-",
    valor_inicial: incoming.valor_inicial != null ? incoming.valor_inicial : (incoming.valor_atual != null ? incoming.valor_atual : 0),
    valor_atual: incoming.valor_atual != null ? incoming.valor_atual : (incoming.valor_inicial != null ? incoming.valor_inicial : 0),
    processo_sei: incoming.processo_sei || "",
    created_at: now,
    updated_at: now,
    source_sheet: incoming.source_sheet || ctx.sheetName || "Controle de EPI",
    source_row: ctx.rowNumber != null ? Number(ctx.rowNumber) : null,
    all_fields: shallowCloneObj(incoming.all_fields || {}),
    eventos: [mkEvent("IMPORT", { note: buildImportNote(fileName, ctx) })]
  });

  base.ref_key = buildReferenceKey(base);

  if (incoming.status_oficial) {
    base.eventos.unshift(mkEvent("MARK_STATUS", {
      to: normalizeStatus(incoming.status_oficial),
      note: "Marcacao inicial vinda da importacao.",
      actor_user: SYSTEM_MIGRATION_USER,
      actor_role: SYSTEM_MIGRATION_ROLE
    }));
  }

  return base;
}

// Faz merge de uma linha importada em registro existente, preservando historico.
function mergeImportIntoRecord(target, incoming, ctx, fileName) {
  const changedEvents = [];
  let changedAny = false;

  const rawMergeChanged = mergeRawFields(target, incoming.all_fields || {});
  if (rawMergeChanged) changedAny = true;

  if (incoming.source_sheet && incoming.source_sheet !== target.source_sheet) {
    target.source_sheet = incoming.source_sheet;
    changedAny = true;
  }
  if (ctx.rowNumber != null && Number(ctx.rowNumber) !== Number(target.source_row)) {
    target.source_row = Number(ctx.rowNumber);
    changedAny = true;
  }

  TRACKED_FIELDS.forEach(function (def) {
    const nextRaw = incoming[def.key];
    if (!hasIncomingValue(nextRaw, def.type)) return;

    const prev = target[def.key];
    if (!hasFieldChanged(prev, nextRaw, def.type)) return;

    if (def.type === "money" || def.type === "number") target[def.key] = Number(nextRaw);
    else target[def.key] = String(nextRaw).trim();

    changedEvents.push(mkEvent("EDIT_FIELD", {
      field: def.label,
      from: stringifyFieldValue(prev, def.type),
      to: stringifyFieldValue(target[def.key], def.type),
      note: "Atualizado via importacao."
    }));
    changedAny = true;
  });

  if (incoming.status_oficial) {
    const nextStatus = normalizeStatus(incoming.status_oficial);
    const prevMarked = latestMarkedStatus(target);
    if (normalizeStatus(prevMarked || "") !== nextStatus) {
      changedEvents.push(mkEvent("MARK_STATUS", {
        to: nextStatus,
        note: "Marcacao atualizada via importacao.",
        actor_user: SYSTEM_MIGRATION_USER,
        actor_role: SYSTEM_MIGRATION_ROLE
      }));
      changedAny = true;
    }
  }

  const oldRef = target.ref_key || "";
  syncCanonicalToAllFields(target);
  target.ref_key = buildReferenceKey(target);
  if (oldRef !== target.ref_key) {
    changedEvents.push(mkEvent("EDIT_FIELD", { field: "Chave Referencia", from: oldRef, to: target.ref_key, note: "Recalculada apos importacao." }));
    changedAny = true;
  }

  if (changedAny) {
    target.updated_at = isoNow();
    changedEvents.push(mkEvent("IMPORT", { note: buildImportNote(fileName, ctx) + " (com atualizacoes)" }));
    target.eventos = changedEvents.concat(target.eventos || []);
  }

  return { changedAny: changedAny };
}

function mapImportRow(ctx) {
  const rawOriginal = shallowCloneObj(ctx.row || {});
  const row = normalizeRowKeys(rawOriginal);

  const ano = toInt(pickValue(row, IMPORT_ALIASES.ano));
  const identificacao = asText(pickValue(row, IMPORT_ALIASES.identificacao));
  const codSubfonte = asText(pickValue(row, IMPORT_ALIASES.cod_subfonte));
  const codAcao = asText(pickValue(row, IMPORT_ALIASES.cod_acao));
  const municipio = asText(pickValue(row, IMPORT_ALIASES.municipio));
  const deputado = asText(pickValue(row, IMPORT_ALIASES.deputado));

  const record = {
    id: asText(pickValue(row, IMPORT_ALIASES.id)),
    ano: ano || currentYear(),
    identificacao: identificacao,
    cod_subfonte: codSubfonte,
    deputado: deputado,
    cod_uo: asText(pickValue(row, IMPORT_ALIASES.cod_uo)),
    sigla_uo: asText(pickValue(row, IMPORT_ALIASES.sigla_uo)),
    cod_orgao: asText(pickValue(row, IMPORT_ALIASES.cod_orgao)),
    cod_acao: codAcao,
    descricao_acao: asText(pickValue(row, IMPORT_ALIASES.descricao_acao)),
    plan_a: asText(pickValue(row, IMPORT_ALIASES.plan_a)),
    plan_b: asText(pickValue(row, IMPORT_ALIASES.plan_b)),
    municipio: municipio,
    valor_inicial: toNumberOrNull(pickValue(row, IMPORT_ALIASES.valor_inicial)),
    valor_atual: toNumberOrNull(pickValue(row, IMPORT_ALIASES.valor_atual)),
    processo_sei: asText(pickValue(row, IMPORT_ALIASES.processo_sei)),
    status_oficial: "",
    all_fields: rawOriginal,
    source_sheet: ctx.sheetName || "XLSX",
    source_row: ctx.rowNumber != null ? Number(ctx.rowNumber) : null
  };

  const statusRaw = asText(pickValue(row, IMPORT_ALIASES.status_oficial));
  if (statusRaw) record.status_oficial = normalizeStatus(statusRaw);

  syncCanonicalToAllFields(record);
  record.ref_key = buildReferenceKey(record);
  return record;
}

function hasUsefulData(record) {
  const checks = [record.id, record.identificacao, record.cod_subfonte, record.cod_acao, record.municipio, record.deputado, record.processo_sei, record.ref_key];
  const hasText = checks.some(function (v) {
    return !!String(v || "").trim();
  });
  const hasNumber = record.valor_inicial != null || record.valor_atual != null;
  return hasText || hasNumber;
}

function hasIncomingValue(value, type) {
  if (type === "money" || type === "number") return value != null && String(value).trim() !== "" && Number.isFinite(Number(value));
  return value != null && String(value).trim() !== "";
}

function hasFieldChanged(prev, next, type) {
  if (type === "money") return toNumber(prev) !== toNumber(next);
  if (type === "number") return toInt(prev) !== toInt(next);
  return normalizeLooseText(prev) !== normalizeLooseText(next);
}

function stringifyFieldValue(value, type) {
  if (type === "money") return "R$ " + fmtMoney(value);
  if (type === "number") return String(toInt(value));
  return String(value == null ? "" : value);
}

// Padroniza mensagem de auditoria para eventos de importacao.
function buildImportNote(fileName, ctx) {
  return "Importado de " + fileName + " | Aba: " + (ctx.sheetName || "XLSX") + " | Linha: " + String(ctx.rowNumber || "-");
}

// Le arquivo XLSX, detecta cabecalho e extrai linhas validas para importacao.
async function parseInputFile(file) {
  const name = String(file.name || "").toLowerCase();

  if (!name.endsWith(".xlsx")) {
    throw new Error("Formato nao suportado. Use apenas XLSX.");
  }

  const xlsxApi = typeof window !== "undefined" ? window.XLSX : null;
  if (!xlsxApi) throw new Error("Biblioteca XLSX nao carregada.");

  const buffer = await file.arrayBuffer();
  const templateBuffer = buffer.slice(0);
  const wb = xlsxApi.read(buffer, {
    type: "array",
    raw: false,
    cellFormula: true,
    cellNF: true,
    cellStyles: true,
    cellDates: false
  });
  const out = [];
  const knownHeaders = buildKnownHeaderSet();
  lastImportedPlanilha1Aoa = extractPlanilha1AoaFromWorkbook(wb, xlsxApi);

  const preferredSheet = wb.SheetNames.includes("Controle de EPI") ? "Controle de EPI" : null;
  const orderedSheetNames = preferredSheet
    ? [preferredSheet].concat(wb.SheetNames.filter(function (n) { return n !== preferredSheet; }))
    : wb.SheetNames.slice();

  orderedSheetNames.forEach(function (sheetName) {
    const sheet = wb.Sheets[sheetName];
    const matrix = xlsxApi.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false, blankrows: false });
    const detected = detectHeaderRow(matrix);
    if (!detected) return;

    const headers = detected.headers;
    const recognizedCount = headers.reduce(function (acc, h) {
      return acc + (knownHeaders.has(normalizeHeader(h)) ? 1 : 0);
    }, 0);

    if (sheetName === "Controle de EPI" && recognizedCount < 5) {
      throw new Error("Cabecalho da aba Controle de EPI nao reconhecido. Verifique se a linha de cabecalho esta correta.");
    }
    if (sheetName !== "Controle de EPI" && recognizedCount < 3) return;

    for (let r = detected.headerRowIndex + 1; r < matrix.length; r += 1) {
      const arr = matrix[r] || [];
      if (isRowEmpty(arr)) continue;
      const rowObj = rowArrayToObject(arr, headers);
      out.push({ sheetName: sheetName, rowNumber: r + 1, row: rowObj });
    }
  });

  lastImportedWorkbookTemplate = {
    fileName: file.name || "template.xlsx",
    importedAt: isoNow(),
    preferredSheet: preferredSheet || "",
    buffer: templateBuffer
  };

  lastImportValidation = buildImportValidationReport(out);
  return out;
}


function extractPlanilha1AoaFromWorkbook(workbook, xlsxApi) {
  try {
    if (!workbook || !xlsxApi || !workbook.Sheets) return null;
    const ws = workbook.Sheets["Planilha1"];
    if (!ws) return null;

    const matrix = xlsxApi.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, blankrows: false });
    if (!Array.isArray(matrix) || !matrix.length) return null;

    let headerIdx = -1;
    const scanLimit = Math.min(matrix.length, 50);
    for (let i = 0; i < scanLimit; i += 1) {
      const row = Array.isArray(matrix[i]) ? matrix[i] : [];
      const c1 = normalizeHeader(row[0]);
      const c2 = normalizeHeader(row[1]);
      const hasRotulo = c1.indexOf("rotulos_de_linha") >= 0 || c1.indexOf("rotulo_de_linha") >= 0;
      const hasContagem = c2.indexOf("contagem_de_deputado") >= 0;
      if (hasRotulo && hasContagem) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx < 0) return null;

    const headerRow = matrix[headerIdx] || [];
    const out = [[
      text(headerRow[0]) || "Rotulos de Linha",
      text(headerRow[1]) || "Contagem de Deputado"
    ]];

    for (let i = headerIdx + 1; i < matrix.length; i += 1) {
      const row = Array.isArray(matrix[i]) ? matrix[i] : [];
      const label = text(row[0]);
      const value = text(row[1]);
      if (!label && !value) continue;
      out.push([label, value]);
      if (normalizeLooseText(label) === "total geral") break;
    }

    return out.length > 1 ? out : null;
  } catch (_err) {
    return null;
  }
}


// Gera diagnostico estrutural da planilha (cabecalhos, tipos e faltas criticas).
function buildImportValidationReport(sourceRows) {
  const rows = Array.isArray(sourceRows) ? sourceRows : [];
  const knownSet = buildKnownHeaderSet();
  const headersFound = [];
  const headerSeen = new Set();
  const headerNormalizedCount = {};
  const preview = [];
  const alerts = [];

  rows.slice(0, 5).forEach(function (ctx) {
    preview.push({
      aba: ctx && ctx.sheetName ? ctx.sheetName : "XLSX",
      linha: ctx && ctx.rowNumber != null ? Number(ctx.rowNumber) : null,
      dados: shallowCloneObj((ctx && ctx.row) || {})
    });
  });

  rows.forEach(function (ctx) {
    const row = (ctx && ctx.row) || {};
    Object.keys(row).forEach(function (k) {
      if (!headerSeen.has(k)) {
        headerSeen.add(k);
        headersFound.push(k);
      }
      const nk = normalizeHeader(k);
      headerNormalizedCount[nk] = (headerNormalizedCount[nk] || 0) + 1;
    });
  });

  const recognized = [];
  const unrecognized = [];
  headersFound.forEach(function (h) {
    if (knownSet.has(normalizeHeader(h))) recognized.push(h);
    else unrecognized.push(h);
  });

  const duplicated = Object.keys(headerNormalizedCount).filter(function (k) {
    return headerNormalizedCount[k] > 1;
  });

  if (recognized.length < 3) alerts.push("Cabecalho suspeito: poucas colunas reconhecidas.");
  if (duplicated.length) alerts.push("Colunas duplicadas detectadas: " + duplicated.join(", "));

  const criticalEmpty = countCriticalEmpties(rows);
  Object.keys(criticalEmpty).forEach(function (key) {
    if (criticalEmpty[key] > 0) alerts.push("Campo critico vazio em " + key + ": " + String(criticalEmpty[key]) + " linha(s).");
  });

  return {
    recognizedHeaders: recognized,
    unrecognizedHeaders: unrecognized,
    duplicatedHeaders: duplicated,
    previewRows: preview,
    detectedTypes: detectImportTypes(rows),
    alerts: alerts
  };
}

function buildKnownHeaderSet() {
  const set = new Set();
  Object.keys(IMPORT_ALIASES).forEach(function (key) {
    (IMPORT_ALIASES[key] || []).forEach(function (alias) {
      set.add(normalizeHeader(alias));
    });
  });
  return set;
}

function countCriticalEmpties(rows) {
  const counters = { identificacao: 0, deputado: 0, municipio: 0 };
  rows.forEach(function (ctx) {
    const mapped = mapImportRow(ctx);
    if (!text(mapped.identificacao)) counters.identificacao += 1;
    if (!text(mapped.deputado)) counters.deputado += 1;
    if (!text(mapped.municipio)) counters.municipio += 1;
  });
  return counters;
}

function detectImportTypes(rows) {
  const sample = rows.slice(0, 50).map(function (ctx) { return mapImportRow(ctx); });
  return {
    ano: detectType(sample.map(function (r) { return r.ano; })),
    valor_inicial: detectType(sample.map(function (r) { return r.valor_inicial; })),
    valor_atual: detectType(sample.map(function (r) { return r.valor_atual; })),
    identificacao: detectType(sample.map(function (r) { return r.identificacao; })),
    processo_sei: detectType(sample.map(function (r) { return r.processo_sei; }))
  };
}

function detectType(values) {
  const v = (values || []).filter(function (x) { return x != null && String(x).trim() !== ""; });
  if (!v.length) return "vazio";
  const allNum = v.every(function (x) { return Number.isFinite(Number(x)); });
  if (allNum) return "numero";
  return "texto";
}
function detectHeaderRow(matrix) {
  if (!Array.isArray(matrix) || !matrix.length) return null;

  const scanLimit = Math.min(matrix.length, 40);
  let bestIndex = -1;
  let bestScore = -1;

  for (let i = 0; i < scanLimit; i += 1) {
    const row = Array.isArray(matrix[i]) ? matrix[i] : [];
    const nonEmpty = row.filter(function (v) {
      return text(v) !== "";
    }).length;
    if (nonEmpty < 3) continue;

    const normalized = row.map(function (v) { return normalizeHeader(v); });
    let score = nonEmpty;
    const hints = ["identificacao", "deputado", "status", "municipio", "cod_uo", "cod_subfonte", "cod_da_acao", "descritor_da_acao"];
    hints.forEach(function (h) {
      if (normalized.includes(h)) score += 5;
    });

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  if (bestIndex < 0) return null;
  const rawHeader = Array.isArray(matrix[bestIndex]) ? matrix[bestIndex] : [];
  const headers = buildHeadersFromRow(rawHeader);
  return { headerRowIndex: bestIndex, headers: headers };
}

function buildHeadersFromRow(rawHeader) {
  const out = [];
  const used = {};
  const total = Math.max(rawHeader.length, 1);

  for (let i = 0; i < total; i += 1) {
    let base = text(rawHeader[i]);
    if (!base) base = "COL_" + String(i + 1);

    let key = base;
    let n = 2;
    while (used[key]) {
      key = base + "_" + String(n);
      n += 1;
    }
    used[key] = true;
    out.push(key);
  }

  return out;
}

function rowArrayToObject(arr, headers) {
  const obj = {};
  for (let c = 0; c < headers.length; c += 1) {
    const key = headers[c];
    if (!key) continue;
    obj[key] = arr[c] == null ? "" : String(arr[c]).trim();
  }
  return obj;
}

function isRowEmpty(arr) {
  if (!Array.isArray(arr)) return true;
  return !arr.some(function (v) {
    return text(v) !== "";
  });
}

function renderStatus(status) {
  const renderStatusUtil = getStatusUtil("renderStatus");
  if (renderStatusUtil) {
    return renderStatusUtil(status, statusColor, escapeHtml);
  }

  const color = statusColor(status);
  return "<span class=\"badge\"><span class=\"dot\" style=\"background:" + color + "\"></span>" + escapeHtml(status) + "</span>";
}

function statusColor(status) {
  const statusColorUtil = getStatusUtil("statusColor");
  if (statusColorUtil) {
    return statusColorUtil(status);
  }
  if (status === "Concluido") return "#2ecc71";
  if (status === "Cancelado") return "#ff4f6d";
  if (status === "Pendente") return "#f1c40f";
  if (status === "Aguardando execucao") return "#f39c12";
  if (status === "Em execucao") return "#3498db";
  if (status === "Em analise") return "#4f8cff";
  if (status === "Aprovado") return "#9b59b6";
  return "#95a5a6";
}

function normalizeStatus(input) {
  const normalizeStatusUtil = getStatusUtil("normalizeStatus");
  if (normalizeStatusUtil) {
    return normalizeStatusUtil(input, STATUS, normalizeLooseText);
  }
  const cleaned = normalizeLooseText(input);
  if (!cleaned) return "Recebido";
  const found = STATUS.find(function (st) {
    return normalizeLooseText(st) === cleaned;
  });
  return found || "Recebido";
}


function generateRandomMultiUserDemo() {
  if (!Array.isArray(state.records) || state.records.length === 0) {
    state = { records: deepClone(DEMO).map(normalizeRecordShape) };
  }

  const sampleSize = Math.min(state.records.length, 20);
  const targets = state.records.slice(0, sampleSize);

  targets.forEach(function (rec, idx) {
    for (let i = 0; i < DEMO_MULTI_USERS.length; i += 1) {
      const u = DEMO_MULTI_USERS[i];
      const st = pickRandom(STATUS);
      const note = pickRandom(DEMO_NOTES) + " [demo #" + String(idx + 1) + "]";
      rec.eventos.unshift(mkEvent("MARK_STATUS", {
        to: st,
        note: note,
        actor_user: u.name,
        actor_role: u.role
      }));
    }
    rec.updated_at = isoNow();
    syncCanonicalToAllFields(rec);
  });

  saveState();
  syncYearFilter();
  render();
  alert("Demo aplicada: 4 usuarios com eventos aleatorios em " + String(sampleSize) + " emendas.");
}

function pickRandom(arr) {
  if (!arr || !arr.length) return "";
  const i = Math.floor(Math.random() * arr.length);
  return arr[i];
}

// Configura eventos de login/cadastro do auth-gate interno da pagina principal.
function setupAuthUi() {
  if (!authGate) return;

  syncRegisterRoles();
  switchAuthMode("login");

  if (authTabLogin) {
    authTabLogin.addEventListener("click", function () {
      switchAuthMode("login");
    });
  }

  if (authTabRegister) {
    authTabRegister.addEventListener("click", function () {
      switchAuthMode("register");
    });
  }

  if (authLoginForm) {
    authLoginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const nome = String(authLoginName && authLoginName.value || "").trim();
      const senha = String(authLoginPassword && authLoginPassword.value || "").trim();
      if (!nome || !senha) {
        setAuthMessage("Informe nome e senha.", true);
        return;
      }

      setAuthMessage("Autenticando...");
      try {
        const resp = await apiRequestPublic("POST", "/auth/login", { nome: nome, senha: senha });
        onAuthSuccess(resp);
      } catch (err) {
        setAuthMessage(extractApiError(err, "Falha no login."), true);
      }
    });
  }

  if (authRegisterForm) {
    authRegisterForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const nome = String(authRegisterName && authRegisterName.value || "").trim();
      const perfil = normalizeUserRole(authRegisterRole && authRegisterRole.value || "");
      const senha1 = String(authRegisterPassword && authRegisterPassword.value || "").trim();
      const senha2 = String(authRegisterPassword2 && authRegisterPassword2.value || "").trim();

      if (!nome || !senha1 || !senha2) {
        setAuthMessage("Preencha todos os campos do cadastro.", true);
        return;
      }
      if (senha1 !== senha2) {
        setAuthMessage("As senhas nao conferem.", true);
        return;
      }

      setAuthMessage("Cadastrando...");
      try {
        const resp = await apiRequestPublic("POST", "/auth/register", {
          nome: nome,
          perfil: perfil,
          senha: senha1
        });
        if (resp && resp.pending_approval) {
          setAuthMessage("Cadastro enviado. Aguarde aprovacao do PROGRAMADOR.");
          switchAuthMode("login");
          return;
        }
        onAuthSuccess(resp);
      } catch (err) {
        setAuthMessage(extractApiError(err, "Falha no cadastro."), true);
      }
    });
  }
}

// Carrega papeis permitidos no cadastro publico do auth-gate.
function syncRegisterRoles() {
  if (!authRegisterRole) return;
  clearNodeChildren(authRegisterRole);
  PUBLIC_SELF_REGISTER_ROLE_OPTIONS.forEach(function (role) {
    const opt = document.createElement("option");
    opt.value = role;
    opt.textContent = role;
    authRegisterRole.appendChild(opt);
  });
}

// Alterna entre formularios de login e cadastro no auth-gate.
function switchAuthMode(mode) {
  if (!authLoginForm || !authRegisterForm || !authTabLogin || !authTabRegister) return;
  const register = mode === "register";
  authLoginForm.classList.toggle("hidden", register);
  authRegisterForm.classList.toggle("hidden", !register);
  authTabLogin.classList.toggle("active", !register);
  authTabRegister.classList.toggle("active", register);
  setAuthMessage("");
}

function setAuthMessage(msg, isError) {
  if (!authMsg) return;
  authMsg.textContent = msg || "";
  authMsg.style.color = isError ? "#b4233d" : "";
}

function showAuthGate(msg) {
  const q = msg ? "msg=" + encodeURIComponent(msg) : "";
  redirectToAuth(AUTH_LOGIN_PAGE, q);
}

function hideAuthGate() {
  if (!authGate) return;
  authGate.classList.add("hidden");
  authGate.setAttribute("aria-hidden", "true");
  setAuthMessage("");
}

function extractApiError(err, fallback) {
  const extractApiErrorUtil = getFormatUtil("extractApiError");
  if (extractApiErrorUtil) {
    return extractApiErrorUtil(err, fallback);
  }
  const msg = err && err.message ? String(err.message) : "";
  if (!msg) return fallback;
  const mark = "::";
  if (msg.indexOf(mark) >= 0) return msg.split(mark)[1] || fallback;
  return msg;
}

// Trata sucesso de autenticacao: grava sessao, libera UI e sincroniza API.
function onAuthSuccess(resp) {
  const token = resp && resp.token ? String(resp.token) : "";
  const usuario = resp && resp.usuario ? resp.usuario : null;
  if (!token || !usuario) {
    setAuthMessage("Resposta de autenticacao invalida.", true);
    return;
  }

  writeStoredSessionToken(token);
  setAuthenticatedUser(usuario);
  hideAuthGate();
  applyAccessProfile();
  bootstrapApiIntegration().finally(function () {
    connectApiSocket();
  });
  render();
}

function readStorageValue(store, key) {
  if (store == null) return "";
  if (storageUtils && typeof storageUtils.readStorageValue === "function") {
    return storageUtils.readStorageValue(store, key);
  }
  try {
    return String(store.getItem(key) || "").trim();
  } catch (_err) {
    return "";
  }
}

function writeStorageValue(store, key, value) {
  if (store == null) return;
  const raw = String(value == null ? "" : value);
  if (storageUtils && typeof storageUtils.writeStorageValue === "function") {
    storageUtils.writeStorageValue(store, key, raw);
    return;
  }
  try {
    store.setItem(key, raw);
  } catch (_err) {}
}

function removeStorageValue(store, key) {
  if (store == null) return;
  if (storageUtils && typeof storageUtils.removeStorageValue === "function") {
    storageUtils.removeStorageValue(store, key);
    return;
  }
  try {
    store.removeItem(key);
  } catch (_err) {}
}

// Persiste usuario autenticado no contexto local da UI.
function setAuthenticatedUser(usuario) {
  CURRENT_USER = String(usuario.nome || CURRENT_USER).trim() || CURRENT_USER;
  CURRENT_ROLE = normalizeUserRole(usuario.perfil || CURRENT_ROLE);
  if (authStore && typeof authStore.writeAuthenticatedProfile === "function") {
    authStore.writeAuthenticatedProfile({
      name: CURRENT_USER,
      role: CURRENT_ROLE
    }, AUTH_KEYS);
  }
}

// Redireciona para login/cadastro preservando pagina de retorno.
function redirectToAuth(page, query) {
  if (authStore && typeof authStore.redirectToAuth === "function") {
    authStore.redirectToAuth(page || AUTH_LOGIN_PAGE, query, "index.html");
    return;
  }
  const target = page || AUTH_LOGIN_PAGE;
  const suffix = query ? (String(query).startsWith("?") ? String(query) : "?" + String(query)) : "";
  const next = encodeURIComponent("index.html");
  const hasQ = suffix.indexOf("?") >= 0;
  const finalUrl = target + suffix + (hasQ ? "&" : "?") + "next=" + next;
  if (!window.location.pathname.toLowerCase().endsWith("/" + target.toLowerCase())) {
    window.location.href = finalUrl;
  }
}
// Encerra sessao local e tenta logout remoto na API.
async function logoutCurrentUser() {
  const token = readStoredSessionToken();
  if (token && isApiEnabled()) {
    try {
      await apiRequest("POST", "/auth/logout", {});
    } catch (_err) {
      // ignora erro de logout remoto
    }
  }
  if (authStore && typeof authStore.clearSessionAndProfile === "function") {
    authStore.clearSessionAndProfile(AUTH_KEYS);
  } else {
    clearStoredSessionToken();
  }
  closeApiSocket();
}

function isLocalFrontendContext() {
  if (authGuard && typeof authGuard.isLocalFrontendContext === "function") {
    return authGuard.isLocalFrontendContext();
  }
  const host = (typeof window !== "undefined" && window.location && window.location.hostname)
    ? String(window.location.hostname)
    : "";
  return !host || host === "localhost" || host === "127.0.0.1";
}

function readStoredSessionToken() {
  if (authStore && typeof authStore.readStoredSessionToken === "function") {
    return authStore.readStoredSessionToken(AUTH_KEYS);
  }
  var cfg = (AUTH_KEYS && typeof AUTH_KEYS === "object") ? AUTH_KEYS : {};
  var tokenKey = cfg.sessionToken || "SEC_SESSION_TOKEN";
  var backupTokenKey = cfg.sessionTokenBackup || "SEC_SESSION_TOKEN_BKP";
  if (storageUtils && typeof storageUtils.readSessionToken === "function") {
    return storageUtils.readSessionToken(tokenKey, backupTokenKey);
  }
  try {
    if (typeof sessionStorage !== "undefined") {
      var sessionToken = String(sessionStorage.getItem(tokenKey) || "").trim();
      if (sessionToken) {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(backupTokenKey, sessionToken);
        }
        return sessionToken;
      }
    }
    if (typeof localStorage !== "undefined") {
      var backupToken = String(localStorage.getItem(backupTokenKey) || "").trim();
      if (backupToken && typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(tokenKey, backupToken);
      }
      return backupToken;
    }
  } catch (_err) {
    return "";
  }
  return "";
}

function writeStoredSessionToken(token) {
  if (authStore && typeof authStore.writeStoredSessionToken === "function") {
    authStore.writeStoredSessionToken(token, AUTH_KEYS);
    return;
  }
  var cfg = (AUTH_KEYS && typeof AUTH_KEYS === "object") ? AUTH_KEYS : {};
  var tokenKey = cfg.sessionToken || "SEC_SESSION_TOKEN";
  var backupTokenKey = cfg.sessionTokenBackup || "SEC_SESSION_TOKEN_BKP";
  if (storageUtils && typeof storageUtils.writeSessionToken === "function") {
    storageUtils.writeSessionToken(token, tokenKey, backupTokenKey);
    return;
  }
  var raw = String(token == null ? "" : token).trim();
  if (!raw) {
    clearStoredSessionToken();
    return;
  }
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(tokenKey, raw);
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(backupTokenKey, raw);
    }
  } catch (_err) {
    // sem persistencia persistente, mantém sessão em memória apenas neste fluxo.
  }
}

function clearStoredSessionToken() {
  if (authStore && typeof authStore.clearStoredSessionToken === "function") {
    authStore.clearStoredSessionToken(AUTH_KEYS);
    return;
  }
  var cfg = (AUTH_KEYS && typeof AUTH_KEYS === "object") ? AUTH_KEYS : {};
  var tokenKey = cfg.sessionToken || "SEC_SESSION_TOKEN";
  var backupTokenKey = cfg.sessionTokenBackup || "SEC_SESSION_TOKEN_BKP";
  if (storageUtils && typeof storageUtils.clearSessionToken === "function") {
    storageUtils.clearSessionToken(tokenKey, backupTokenKey);
    return;
  }
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(tokenKey);
    }
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(backupTokenKey);
    }
  } catch (_err) {
    // sem persistência, apenas ignora.
  }
}

// Ponto de entrada da autenticacao ao abrir index.html.
async function initializeAuthFlow() {
  if (!isApiEnabled()) {
    closeApiSocket();
    loadUserConfig(false);
    applyAccessProfile();
    bootstrapApiIntegration();
    return;
  }

  const token = readStoredSessionToken();
  if (!token) {
    closeApiSocket();
    redirectToAuth(AUTH_LOGIN_PAGE, "msg=" + encodeURIComponent("Entre para continuar."));
    return;
  }

  let me = null;
  try {
    me = await apiRequest("GET", "/auth/me");
  } catch (authErr) {
    // Fallback robusto para ambiente local:
    // se houver base antiga/instavel, fixa em 127.0.0.1:8000 e revalida token 1 vez.
    if (isLocalFrontendContext()) {
      try {
        writeStorageValue(localStorage, API_BASE_URL_KEY, "http://127.0.0.1:8000");
        // apiRequest pode limpar token em 401; restaura para a tentativa direta.
        writeStoredSessionToken(token);
        const probe = await apiRequest("GET", "/auth/me", undefined, "INIT", { handleAuthFailure: false });
        me = probe;
      } catch (_fallbackErr) {
        // segue fluxo padrao de expiracao abaixo
      }
    }
    if (!me) {
      clearStoredSessionToken();
      closeApiSocket();
      redirectToAuth(AUTH_LOGIN_PAGE, "msg=" + encodeURIComponent("Sessao expirada. Faca login novamente."));
      return;
    }
    console.warn("auth/me falhou na API principal, seguindo com fallback local.", authErr);
  }

  try {
    setAuthenticatedUser(me);
    hideAuthGate();
    applyAccessProfile();
    await bootstrapApiIntegration();
    connectApiSocket();
  } catch (uiErr) {
    // Erros de interface nao devem derrubar a sessao valida.
    console.error("Falha ao inicializar UI apos autenticacao:", uiErr);
  }
}


// Carrega configuracao de usuario local (fallback quando API esta desativada).
function loadUserConfig(forcePrompt) {
  const savedAuthUser = authStore && typeof authStore.readAuthenticatedProfile === "function"
    ? authStore.readAuthenticatedProfile(AUTH_KEYS)
    : null;
  const legacyAuthUser = authStore && typeof authStore.readLegacyAuthenticatedProfile === "function"
    ? authStore.readLegacyAuthenticatedProfile(AUTH_KEYS)
    : null;
  const savedUser = (savedAuthUser && savedAuthUser.name) || (legacyAuthUser && legacyAuthUser.name);
  const savedRole = savedAuthUser && savedAuthUser.role;

  if (savedUser) CURRENT_USER = String(savedUser).trim() || CURRENT_USER;
  if (savedRole) CURRENT_ROLE = normalizeUserRole(savedRole);

  if (isApiEnabled()) return;

  if (forcePrompt || !savedUser || !savedRole) {
    const nameInput = prompt("Informe seu nome (ex.: Miguel):", savedUser || CURRENT_USER) || CURRENT_USER;
    const roleInput = prompt("Informe seu setor (APG | SUPERVISAO | CONTABIL | POWERBI | PROGRAMADOR):", savedRole || CURRENT_ROLE) || CURRENT_ROLE;

    CURRENT_USER = String(nameInput).trim() || CURRENT_USER;
    CURRENT_ROLE = normalizeUserRole(roleInput);
    if (authStore && typeof authStore.writeAuthenticatedProfile === "function") {
      authStore.writeAuthenticatedProfile({
        name: CURRENT_USER,
        role: CURRENT_ROLE
      }, AUTH_KEYS);
    }
  }
}

function isSupervisorUser() {
  return CURRENT_ROLE === "SUPERVISAO";
}

function canMutateRecords() {
  return !isSupervisorUser();
}

function clearEmendaLockTimer() {
  if (concurrencyService && typeof concurrencyService.clearEmendaLockTimer === "function") {
    concurrencyService.clearEmendaLockTimer();
    return;
  }
  if (!emendaLockTimer) return;
  clearInterval(emendaLockTimer);
  emendaLockTimer = null;
}

function setEmendaLockState(payload) {
  if (concurrencyService && typeof concurrencyService.setEmendaLockState === "function") {
    concurrencyService.setEmendaLockState(payload);
    return;
  }
  emendaLockState = payload && typeof payload === "object" ? payload : null;
  if (!canMutateRecords()) {
    emendaLockReadOnly = true;
    return;
  }
  if (!emendaLockState) {
    emendaLockReadOnly = false;
    return;
  }
  emendaLockReadOnly = !Boolean(emendaLockState.can_edit);
}

function isEmendaLockReadOnly() {
  if (concurrencyService && typeof concurrencyService.isEmendaLockReadOnly === "function") {
    return !!concurrencyService.isEmendaLockReadOnly();
  }
  return !!emendaLockReadOnly;
}

function getEmendaLockState() {
  if (concurrencyService && typeof concurrencyService.getEmendaLockState === "function") {
    const next = concurrencyService.getEmendaLockState();
    return next && typeof next === "object" ? next : null;
  }
  return emendaLockState;
}

function setEmendaLockReadOnly(value) {
  if (concurrencyService && typeof concurrencyService.setEmendaLockReadOnly === "function") {
    concurrencyService.setEmendaLockReadOnly(!!value);
    return;
  }
  emendaLockReadOnly = !!value;
}

function emendaLockOwnerText(payload) {
  if (!payload || !payload.locked) return "";
  const ownerName = text(payload.owner_user_name || "-");
  const ownerRole = text(payload.owner_user_role || "-");
  return ownerName + " (" + ownerRole + ")";
}

function renderModalAccessState(rec) {
  if (!modalAccessState) return;
  if (!modal || !modal.classList.contains("show") || !rec) {
    modalAccessState.classList.add("hidden");
    modalAccessState.classList.remove("access-mode-readonly", "access-mode-edit", "access-mode-warning");
    modalAccessState.textContent = "";
    return;
  }

  const showAccessState = function (mode, message) {
    modalAccessState.textContent = message;
    modalAccessState.classList.remove("access-mode-readonly", "access-mode-edit", "access-mode-warning");
    if (mode === "readonly") {
      modalAccessState.classList.add("access-mode-readonly");
    } else if (mode === "edit") {
      modalAccessState.classList.add("access-mode-edit");
    } else if (mode === "warning") {
      modalAccessState.classList.add("access-mode-warning");
    }
    modalAccessState.textContent = message;
    modalAccessState.classList.remove("hidden");
  };

  if (!isApiEnabled()) {
    if (!canMutateRecords()) {
      showAccessState("readonly", "MODO LEITURA: perfil SUPERVISAO monitora, sem alterar dados.");
      return;
    }
    modalAccessState.classList.add("hidden");
    modalAccessState.classList.remove("access-mode-readonly", "access-mode-edit", "access-mode-warning");
    modalAccessState.textContent = "";
    return;
  }

  if (!canMutateRecords()) {
    showAccessState("readonly", "MODO LEITURA: perfil SUPERVISAO monitora, sem alterar dados.");
    return;
  }

  if (!isEmendaLockReadOnly()) {
    modalAccessState.classList.add("hidden");
    modalAccessState.classList.remove("access-mode-readonly", "access-mode-edit", "access-mode-warning");
    modalAccessState.textContent = "";
    return;
  }

  const lockState = getEmendaLockState();
  if (!lockState) {
    showAccessState("warning", "MODO LEITURA: verificando disponibilidade de edicao...");
    return;
  }

  const owner = emendaLockOwnerText(lockState);
  const expiresAt = lockState && lockState.expires_at ? fmtDateTime(lockState.expires_at) : "";
  const ownerMsg = owner ? (" por " + owner) : " por outro usuario";
  const when = expiresAt ? (" Ate: " + expiresAt + ".") : "";
  showAccessState("readonly", "MODO LEITURA: esta emenda esta em edicao" + ownerMsg + "." + when);
}

function renderEmendaLockInfo(rec) {
  let message = "";
  if (rec) {
    if (!isApiEnabled()) {
      message = "Modo local: lock de edicao indisponivel.";
    } else if (isSupervisorUser()) {
      const lockState = getEmendaLockState();
      const owner = emendaLockOwnerText(lockState);
      message = owner
        ? ("Modo supervisao (leitura). Em edicao por: " + owner + ".")
        : "Modo supervisao (leitura).";
    } else {
      const lockState = getEmendaLockState();
      const expiresAt = lockState && lockState.expires_at ? fmtDateTime(lockState.expires_at) : "";
      if (isEmendaLockReadOnly()) {
        const owner = emendaLockOwnerText(lockState);
        const ownerMsg = owner ? ("por " + owner) : "por outro usuario";
        const when = expiresAt ? (" Ate: " + expiresAt + ".") : "";
        message = "Modo leitura ativo: emenda em edicao " + ownerMsg + "." + when;
      } else if (lockState && lockState.locked && lockState.is_owner) {
        const when = expiresAt ? (" Ate: " + expiresAt + ".") : "";
        message = "Voce esta com edicao exclusiva desta emenda." + when;
      } else {
        message = "Edicao disponivel nesta emenda.";
      }
    }
  }

  if (livePresenceText) livePresenceText.textContent = message;
  renderModalAccessState(rec);
}

async function fetchEmendaLockStatus(rec) {
  if (concurrencyService && typeof concurrencyService.fetchEmendaLockStatus === "function") {
    return await concurrencyService.fetchEmendaLockStatus(rec);
  }
  const backendId = await ensureBackendEmenda(rec, { handleAuthFailure: false });
  return await apiRequest("GET", "/emendas/" + String(backendId) + "/lock", undefined, "UI", { handleAuthFailure: false });
}

async function acquireEmendaLock(rec, forceAcquire) {
  if (concurrencyService && typeof concurrencyService.acquireEmendaLock === "function") {
    return await concurrencyService.acquireEmendaLock(rec, forceAcquire);
  }
  const backendId = await ensureBackendEmenda(rec, { handleAuthFailure: false });
  return await apiRequest("POST", "/emendas/" + String(backendId) + "/lock/acquire", {
    force: !!forceAcquire
  }, "UI", { handleAuthFailure: false });
}

async function renewEmendaLock(rec) {
  if (concurrencyService && typeof concurrencyService.renewEmendaLock === "function") {
    return await concurrencyService.renewEmendaLock(rec);
  }
  const backendId = await ensureBackendEmenda(rec, { handleAuthFailure: false });
  return await apiRequest("POST", "/emendas/" + String(backendId) + "/lock/renew", {}, "UI", { handleAuthFailure: false });
}

async function releaseEmendaLock(rec) {
  if (concurrencyService && typeof concurrencyService.releaseEmendaLock === "function") {
    return await concurrencyService.releaseEmendaLock(rec);
  }
  if (!rec || !isApiEnabled()) return;
  const backendId = getBackendIdForRecord(rec) || await ensureBackendEmenda(rec, { handleAuthFailure: false });
  if (!backendId) return;
  await apiRequest("POST", "/emendas/" + String(backendId) + "/lock/release", {}, "UI", { handleAuthFailure: false });
}

async function tickEmendaLock() {
  if (concurrencyService && typeof concurrencyService.tickEmendaLock === "function") {
    await concurrencyService.tickEmendaLock();
    return;
  }
  if (!modal || !modal.classList.contains("show")) return;
  const rec = getSelected();
  if (!rec) return;

  try {
    if (!canMutateRecords()) {
      const lockInfo = await fetchEmendaLockStatus(rec);
      setEmendaLockState(lockInfo);
    } else if (isEmendaLockReadOnly()) {
      const lockInfo = await fetchEmendaLockStatus(rec);
      setEmendaLockState(lockInfo);
      if (lockInfo && !lockInfo.locked && lockInfo.can_edit) {
        const acquired = await acquireEmendaLock(rec, false);
        setEmendaLockState(acquired);
      }
    } else {
      const renewed = await renewEmendaLock(rec);
      setEmendaLockState(renewed);
    }
  } catch (_err) {
    // Mantem estado atual em caso de oscilacao de rede.
  }

  renderEmendaLockInfo(rec);
  applyModalAccessProfile();
  updateModalDraftUi();
}

function startEmendaLockPolling() {
  if (concurrencyService && typeof concurrencyService.startEmendaLockPolling === "function") {
    concurrencyService.startEmendaLockPolling();
    return;
  }
  clearEmendaLockTimer();
  if (!isApiEnabled()) return;
  emendaLockTimer = setInterval(function () {
    tickEmendaLock().catch(function () { /* no-op */ });
  }, EMENDA_LOCK_POLL_MS);
}

async function syncModalEmendaLock(rec) {
  if (concurrencyService && typeof concurrencyService.syncModalEmendaLock === "function") {
    await concurrencyService.syncModalEmendaLock(rec);
    return;
  }
  clearEmendaLockTimer();
  emendaLockState = null;
  if (canMutateRecords()) setEmendaLockReadOnly(true);

  if (!rec) return;
  if (!isApiEnabled()) {
    renderEmendaLockInfo(rec);
    return;
  }

  try {
    if (!canMutateRecords()) {
      const lockInfo = await fetchEmendaLockStatus(rec);
      setEmendaLockState(lockInfo);
    } else {
      const acquired = await acquireEmendaLock(rec, false);
      setEmendaLockState(acquired);
    }
  } catch (err) {
    setEmendaLockState({
      locked: true,
      can_edit: false,
      message: extractApiError(err, "Falha ao consultar lock de edicao.")
    });
  }

  renderEmendaLockInfo(rec);
  applyModalAccessProfile();
  updateModalDraftUi();
  startEmendaLockPolling();
}

function renderRoleNotice() {
  if (!roleNotice) return;
  const renderRoleNoticeUtil = getUiRenderUtil("renderRoleNotice");
  if (renderRoleNoticeUtil) {
    renderRoleNoticeUtil(roleNotice, { isSupervisor: isSupervisorUser() });
    return;
  }

  roleNotice.classList.toggle("hidden", !isSupervisorUser());
  clearNodeChildren(roleNotice);
  if (isSupervisorUser()) {
    const h4 = document.createElement("h4");
    h4.textContent = "Modo supervisao: somente monitoramento";
    const p = document.createElement("p");
    p.className = "muted small";
    p.textContent = "Este perfil acompanha andamento e auditoria em tempo real, sem alterar dados.";
    roleNotice.appendChild(h4);
    roleNotice.appendChild(p);
    return;
  }
}

function renderSupervisorQuickPanel(prefilteredRows) {
  if (!supervisorQuickPanel) return;
  const rows = Array.isArray(prefilteredRows) ? prefilteredRows : getFiltered();
  const renderSupervisorQuickPanelUtil = getUiRenderUtil("renderSupervisorQuickPanel");
  if (renderSupervisorQuickPanelUtil) {
    renderSupervisorQuickPanelUtil(supervisorQuickPanel, {
      isSupervisor: isSupervisorUser(),
      rows: rows,
      getGlobalProgressState: getGlobalProgressState,
      getActiveUsersWithLastMark: getActiveUsersWithLastMark,
      getStaleDays: function (rec) { return daysSince(lastEventAt(rec)); },
      onOpen: function (recId) {
        if (recId) openModal(recId);
      }
    });
    return;
  }

  supervisorQuickPanel.classList.add("hidden");
  clearNodeChildren(supervisorQuickPanel);
  const fallback = document.createElement("p");
  fallback.className = "muted small";
  fallback.textContent = "Renderizador indisponivel (painel da supervisao).";
  supervisorQuickPanel.appendChild(fallback);
}

// Aplica regras de permissao por perfil e atualiza botoes/indicadores.
function applyAccessProfile() {
  const isOwner = CURRENT_ROLE === "PROGRAMADOR";
  const isSupervisor = isSupervisorUser();
  const canManageData = isOwner || CURRENT_ROLE === "APG";
  const canCreateProfiles = isOwner;
  const apiTag = apiOnline ? "API online" : "modo local";
  const storageTag = getStorageMode() === STORAGE_MODE_LOCAL ? "persistencia local" : "sessao";
  const viewTag = isOwner ? " (dono)" : (isSupervisor ? " (supervisao)" : "");

  if (currentUserInfo) {
    currentUserInfo.textContent = "Usuario: " + CURRENT_USER + " / " + CURRENT_ROLE + viewTag + " | " + apiTag + " | " + storageTag;
  }

  if (btnExportAtuais) btnExportAtuais.style.display = "inline-block";
  if (btnExportHistorico) btnExportHistorico.style.display = "inline-block";
  if (btnExportCustom) btnExportCustom.style.display = "inline-block";
  if (btnPendingApprovals) btnPendingApprovals.style.display = isOwner ? "inline-block" : "none";
  if (btnCreateProfile) btnCreateProfile.style.display = canCreateProfiles ? "inline-block" : "none";
  if (importLabel) importLabel.style.display = canManageData ? "inline-block" : "none";
  if (btnReset) btnReset.style.display = isOwner ? "inline-block" : "none";
  if (btnDemo4Users) btnDemo4Users.style.display = isOwner ? "inline-block" : "none";
  if (btnProfile) btnProfile.style.display = "inline-block";
  if (btnLogout) btnLogout.style.display = "inline-block";
  renderRoleNotice();
  renderSupervisorQuickPanel();
  applyModalAccessProfile();
  refreshProfileModal();
}

function refreshProfileModal() {
  if (profileName) profileName.value = CURRENT_USER || "-";
  if (profileRole) profileRole.value = CURRENT_ROLE || "-";
  if (profileMode) profileMode.value = isApiEnabled() ? "Nuvem/API" : "Local";
  if (profileApi) profileApi.value = apiOnline ? "Conectada" : "Indisponivel";
}

function openProfileModal() {
  if (!profileModal) return;
  refreshProfileModal();
  profileModal.classList.add("show");
  profileModal.setAttribute("aria-hidden", "false");
}

function closeProfileModal() {
  if (!profileModal) return;
  profileModal.classList.remove("show");
  profileModal.setAttribute("aria-hidden", "true");
}

function isOwnerUser() {
  return CURRENT_ROLE === "PROGRAMADOR";
}

function setPendingUsersFeedback(msg, isError) {
  if (!pendingUsersFeedback) return;
  pendingUsersFeedback.textContent = msg || "";
  pendingUsersFeedback.style.color = isError ? "#b4233d" : "";
}

function closePendingUsersModal() {
  if (!pendingUsersModal) return;
  pendingUsersModal.classList.remove("show");
  pendingUsersModal.setAttribute("aria-hidden", "true");
}

function renderPendingUsersTable(items) {
  if (!pendingUsersTableWrap) return;
  const renderPendingUsersTableUtil = getUiRenderUtil("renderPendingUsersTable");
  if (renderPendingUsersTableUtil) {
    renderPendingUsersTableUtil(pendingUsersTableWrap, items, {
      roles: USER_ROLE_OPTIONS,
      normalizeUserRole: normalizeUserRole,
      fmtDateTime: fmtDateTime
    });
    return;
  }

  clearNodeChildren(pendingUsersTableWrap);
  const fallback = document.createElement("p");
  fallback.className = "muted small";
  if (!Array.isArray(items) || items.length === 0) {
    fallback.textContent = "Nao ha cadastros em analise no momento.";
  } else {
    fallback.textContent = "Renderizador indisponivel (pendencias de usuario).";
  }
  pendingUsersTableWrap.appendChild(fallback);
}

// Busca e lista cadastros pendentes para aprovacao.
async function refreshPendingUsersModal() {
  if (!isApiEnabled()) {
    setPendingUsersFeedback("Aprovacao de cadastro exige API ativa.", true);
    renderPendingUsersTable([]);
    return;
  }
  if (!isOwnerUser()) {
    setPendingUsersFeedback("Apenas PROGRAMADOR pode aprovar cadastros.", true);
    renderPendingUsersTable([]);
    return;
  }

  setPendingUsersFeedback("Carregando cadastros em analise...");
  try {
    const users = await apiRequest("GET", "/users?include_inactive=true", undefined, "UI");
    const pending = (Array.isArray(users) ? users : []).filter(function (u) {
      if (u && u.ativo) return false;
      const lastLogin = u && u.ultimo_login ? String(u.ultimo_login).trim() : "";
      return lastLogin === "";
    });
    renderPendingUsersTable(pending);
    setPendingUsersFeedback("Pendentes: " + String(pending.length));
  } catch (err) {
    renderPendingUsersTable([]);
    setPendingUsersFeedback(extractApiError(err, "Falha ao carregar cadastros pendentes."), true);
  }
}

// Aprova usuario pendente com perfil selecionado pelo programador.
async function approvePendingUser(userId) {
  if (!userId) return;
  if (!isOwnerUser()) {
    setPendingUsersFeedback("Apenas PROGRAMADOR pode aprovar cadastros.", true);
    return;
  }

  const roleSelect = pendingUsersTableWrap ? pendingUsersTableWrap.querySelector("select[data-pending-role='" + String(userId) + "']") : null;
  const selectedRole = normalizeUserRole(roleSelect ? roleSelect.value : "CONTABIL");

  setPendingUsersFeedback("Aprovando usuario #" + String(userId) + "...");
  await apiRequest("PATCH", "/users/" + String(userId) + "/status", {
    ativo: true,
    perfil: selectedRole
  }, "UI");

  setPendingUsersFeedback("Usuario aprovado com sucesso.");
  await refreshPendingUsersModal();
}

// Abre modal de aprovacao e dispara refresh inicial.
function openPendingUsersModal() {
  if (!pendingUsersModal) return;
  pendingUsersModal.classList.add("show");
  pendingUsersModal.setAttribute("aria-hidden", "false");
  refreshPendingUsersModal().catch(function (err) {
    setPendingUsersFeedback(extractApiError(err, "Falha ao abrir cadastros pendentes."), true);
  });
}

// Sincroniza estado local com API (health + lista de emendas).
async function bootstrapApiIntegration() {
  if (!isApiEnabled()) {
    closeApiSocket();
    apiOnline = false;
    applyAccessProfile();
    return;
  }

  try {
    await apiRequest("GET", "/health", undefined, "API");
    const remoteList = await apiRequest("GET", "/emendas", undefined, "API");
    mergeRemoteEmendas(Array.isArray(remoteList) ? remoteList : []);
    apiOnline = true;
    apiLastError = "";
  } catch (err) {
    apiOnline = false;
    apiLastError = err && err.message ? String(err.message) : "falha de conexao";
    closeApiSocket();
    console.warn("API indisponivel, mantendo modo local:", apiLastError);
  }

  saveState();
  syncYearFilter();
  applyAccessProfile();
  render();
}


function mergeRemoteEmendas(remoteList) {
  const localByInternal = {};
  state.records.forEach(function (r) {
    localByInternal[r.id] = r;
  });

  function applyRemoteSnapshotToLocalRecord(local, remote) {
    if (!local || !remote) return;

    if (Object.prototype.hasOwnProperty.call(remote, "ano")) {
      const nextAno = toInt(remote.ano);
      if (nextAno > 0) local.ano = nextAno;
    }
    if (Object.prototype.hasOwnProperty.call(remote, "identificacao")) local.identificacao = text(remote.identificacao) || "-";
    if (Object.prototype.hasOwnProperty.call(remote, "cod_subfonte")) local.cod_subfonte = text(remote.cod_subfonte);
    if (Object.prototype.hasOwnProperty.call(remote, "deputado")) local.deputado = text(remote.deputado) || "-";
    if (Object.prototype.hasOwnProperty.call(remote, "cod_uo")) local.cod_uo = text(remote.cod_uo);
    if (Object.prototype.hasOwnProperty.call(remote, "sigla_uo")) local.sigla_uo = text(remote.sigla_uo);
    if (Object.prototype.hasOwnProperty.call(remote, "cod_orgao")) local.cod_orgao = text(remote.cod_orgao);
    if (Object.prototype.hasOwnProperty.call(remote, "cod_acao")) local.cod_acao = text(remote.cod_acao);
    if (Object.prototype.hasOwnProperty.call(remote, "descricao_acao")) local.descricao_acao = text(remote.descricao_acao);
    if (Object.prototype.hasOwnProperty.call(remote, "plan_a")) local.plan_a = text(remote.plan_a);
    if (Object.prototype.hasOwnProperty.call(remote, "plan_b")) local.plan_b = text(remote.plan_b);
    if (Object.prototype.hasOwnProperty.call(remote, "municipio")) local.municipio = text(remote.municipio) || "-";
    if (Object.prototype.hasOwnProperty.call(remote, "processo_sei")) local.processo_sei = text(remote.processo_sei);
    if (Object.prototype.hasOwnProperty.call(remote, "valor_inicial")) local.valor_inicial = toNumber(remote.valor_inicial);
    if (Object.prototype.hasOwnProperty.call(remote, "valor_atual")) local.valor_atual = toNumber(remote.valor_atual);
    if (Object.prototype.hasOwnProperty.call(remote, "created_at") && remote.created_at) local.created_at = String(remote.created_at);
    if (Object.prototype.hasOwnProperty.call(remote, "updated_at") && remote.updated_at) local.updated_at = String(remote.updated_at);
  }

  remoteList.forEach(function (re) {
    const idInterno = text(re.id_interno);
    if (!idInterno) return;

    apiEmendaIdByInterno[idInterno] = Number(re.id);

    const local = localByInternal[idInterno];
    if (local) {
      local.backend_id = Number(re.id);
      applyRemoteSnapshotToLocalRecord(local, re);
      if (toInt(re.row_version) > 0) local.row_version = toInt(re.row_version);

      const remoteStatus = normalizeStatus(re.status_oficial || "");
      if (remoteStatus && remoteStatus !== normalizeStatus(latestMarkedStatus(local) || "")) {
        local.eventos.unshift(mkEvent("MARK_STATUS", {
          to: remoteStatus,
          note: "Status importado da API.",
          actor_user: SYSTEM_MIGRATION_USER,
          actor_role: SYSTEM_MIGRATION_ROLE
        }));
      }

      syncCanonicalToAllFields(local);
      return;
    }

    const novo = mkRecord({
      id: idInterno,
      backend_id: Number(re.id),
      ano: toInt(re.ano) || currentYear(),
      identificacao: text(re.identificacao) || "-",
      cod_subfonte: text(re.cod_subfonte),
      deputado: text(re.deputado) || "-",
      cod_uo: text(re.cod_uo),
      sigla_uo: text(re.sigla_uo),
      cod_orgao: text(re.cod_orgao),
      cod_acao: text(re.cod_acao),
      descricao_acao: text(re.descricao_acao),
      plan_a: text(re.plan_a),
      plan_b: text(re.plan_b),
      municipio: text(re.municipio) || "-",
      valor_inicial: toNumber(re.valor_inicial),
      valor_atual: toNumber(re.valor_atual),
      processo_sei: text(re.processo_sei),
      row_version: toInt(re.row_version) > 0 ? toInt(re.row_version) : 1,
      created_at: re.created_at || isoNow(),
      updated_at: re.updated_at || isoNow(),
      eventos: [mkEvent("IMPORT", { note: "Carregado da API." })]
    });

    const remoteStatusNovo = normalizeStatus(re.status_oficial || "");
    if (remoteStatusNovo) {
      novo.eventos.unshift(mkEvent("MARK_STATUS", {
        to: remoteStatusNovo,
        note: "Status importado da API.",
        actor_user: SYSTEM_MIGRATION_USER,
        actor_role: SYSTEM_MIGRATION_ROLE
      }));
    }

    state.records.push(novo);
  });
}

function applySyncResponseToRecord(rec, responsePayload) {
  if (!rec || !responsePayload || typeof responsePayload !== "object") return;
  const nextRowVersion = toInt(responsePayload.row_version);
  if (nextRowVersion > 0) rec.row_version = nextRowVersion;
  if (responsePayload.updated_at) rec.updated_at = String(responsePayload.updated_at);
}

// Envia alteracao de status oficial da emenda para backend.
async function syncOfficialStatusToApi(rec, nextStatus, motivo) {
  if (!isApiEnabled()) return;
  const backendId = await ensureBackendEmenda(rec);
  const resp = await apiRequest("POST", "/emendas/" + String(backendId) + "/status", {
    novo_status: nextStatus,
    motivo: motivo,
    expected_row_version: toInt(rec.row_version) > 0 ? toInt(rec.row_version) : 1
  }, "UI");
  applySyncResponseToRecord(rec, resp);
  apiOnline = true;
  apiLastError = "";
  applyAccessProfile();
}

// Envia evento generico (nota, marcacao, edicao) para backend.
async function syncGenericEventToApi(rec, payload) {
  if (!isApiEnabled()) return;
  const backendId = await ensureBackendEmenda(rec);
  const body = Object.assign({}, payload || {}, {
    expected_row_version: toInt(rec.row_version) > 0 ? toInt(rec.row_version) : 1
  });
  const resp = await apiRequest("POST", "/emendas/" + String(backendId) + "/eventos", body, payload && payload.origem_evento ? payload.origem_evento : "UI");
  applySyncResponseToRecord(rec, resp);
  apiOnline = true;
  apiLastError = "";
  applyAccessProfile();
}

// Garante que o registro local tenha ID correspondente no backend.
async function ensureBackendEmenda(rec, options) {
  const requestOpts = options && typeof options === "object" ? options : {};
  const handleAuthFailure = Object.prototype.hasOwnProperty.call(requestOpts, "handleAuthFailure")
    ? !!requestOpts.handleAuthFailure
    : true;
  if (rec.backend_id) return rec.backend_id;

  const known = apiEmendaIdByInterno[rec.id];
  if (known) {
    rec.backend_id = Number(known);
    return rec.backend_id;
  }

  const remoteList = await apiRequest("GET", "/emendas", undefined, "API", { handleAuthFailure: handleAuthFailure });
  const found = (Array.isArray(remoteList) ? remoteList : []).find(function (x) {
    return text(x.id_interno) === rec.id;
  });

  if (found) {
    rec.backend_id = Number(found.id);
    apiEmendaIdByInterno[rec.id] = rec.backend_id;
    if (toInt(found.row_version) > 0) rec.row_version = toInt(found.row_version);
    if (found.updated_at) rec.updated_at = String(found.updated_at);
    return rec.backend_id;
  }

  const created = await apiRequest("POST", "/emendas", {
    id_interno: rec.id,
    ano: toInt(rec.ano) || currentYear(),
    identificacao: rec.identificacao || "-",
    cod_subfonte: rec.cod_subfonte || "",
    deputado: rec.deputado || "",
    cod_uo: rec.cod_uo || "",
    sigla_uo: rec.sigla_uo || "",
    cod_orgao: rec.cod_orgao || "",
    cod_acao: rec.cod_acao || "",
    descricao_acao: rec.descricao_acao || "",
    plan_a: rec.plan_a || "",
    plan_b: rec.plan_b || "",
    municipio: rec.municipio || "",
    valor_inicial: toNumber(rec.valor_inicial || 0),
    valor_atual: toNumber(rec.valor_atual || 0),
    processo_sei: rec.processo_sei || "",
    status_oficial: deriveStatusForBackend(rec)
  }, "IMPORT", { handleAuthFailure: handleAuthFailure });

  rec.backend_id = created && created.id != null ? Number(created.id) : null;
  if (rec.backend_id) apiEmendaIdByInterno[rec.id] = rec.backend_id;
  if (created && toInt(created.row_version) > 0) rec.row_version = toInt(created.row_version);
  if (created && created.updated_at) rec.updated_at = String(created.updated_at);
  return rec.backend_id;
}


function getApiWebSocketUrl() {
  if (concurrencyService && typeof concurrencyService.getApiWebSocketUrl === "function") {
    return concurrencyService.getApiWebSocketUrl();
  }
  const base = getApiBaseUrl();
  if (!base) return "";
  if (base.indexOf("https://") === 0) return "wss://" + base.slice(8) + API_WS_PATH;
  if (base.indexOf("http://") === 0) return "ws://" + base.slice(7) + API_WS_PATH;
  return "";
}

function clearApiSocketReconnectTimer() {
  if (concurrencyService && typeof concurrencyService.clearApiSocketReconnectTimer === "function") {
    concurrencyService.clearApiSocketReconnectTimer();
    return;
  }
  if (!apiSocketReconnectTimer) return;
  clearTimeout(apiSocketReconnectTimer);
  apiSocketReconnectTimer = null;
}

function closeApiSocket() {
  if (concurrencyService && typeof concurrencyService.closeApiSocket === "function") {
    concurrencyService.closeApiSocket();
    return;
  }
  clearApiSocketReconnectTimer();
  presenceByBackendId = {};
  currentPresenceBackendId = null;
  if (apiSocket) {
    try { apiSocket.onopen = null; apiSocket.onmessage = null; apiSocket.onerror = null; apiSocket.onclose = null; } catch (_err) {}
    try { apiSocket.close(); } catch (_err) {}
    apiSocket = null;
  }
}

function scheduleApiSocketReconnect() {
  if (concurrencyService && typeof concurrencyService.scheduleApiSocketReconnect === "function") {
    concurrencyService.scheduleApiSocketReconnect();
    return;
  }
  clearApiSocketReconnectTimer();
  const token = readStoredSessionToken();
  if (!isApiEnabled() || !token) return;

  const waitMs = Math.max(WS_RECONNECT_BASE_MS, Math.min(apiSocketBackoffMs, WS_RECONNECT_MAX_MS));
  apiSocketReconnectTimer = setTimeout(function () {
    connectApiSocket();
  }, waitMs);
  apiSocketBackoffMs = Math.min(WS_RECONNECT_MAX_MS, Math.floor(waitMs * 1.8));
}

function queueApiRefreshFromSocket() {
  if (concurrencyService && typeof concurrencyService.queueApiRefreshFromSocket === "function") {
    concurrencyService.queueApiRefreshFromSocket();
    return;
  }
  if (apiRefreshRunning) return;
  if (apiRefreshTimer) clearTimeout(apiRefreshTimer);
  apiRefreshTimer = setTimeout(async function () {
    apiRefreshTimer = null;
    if (apiRefreshRunning) return;
    apiRefreshRunning = true;
    try {
      await bootstrapApiIntegration();
    } catch (_err) {
      // bootstrap ja trata erro internamente
    } finally {
      apiRefreshRunning = false;
    }
  }, WS_REFRESH_DEBOUNCE_MS);
}

function sendSocketJson(payload) {
  if (concurrencyService && typeof concurrencyService.sendSocketJson === "function") {
    concurrencyService.sendSocketJson(payload);
    return;
  }
  if (!apiSocket || apiSocket.readyState !== 1) return;
  try {
    apiSocket.send(JSON.stringify(payload || {}));
  } catch (_err) {
    // no-op
  }
}

function getBackendIdForRecord(rec) {
  if (!rec) return 0;
  if (rec.backend_id) return Number(rec.backend_id) || 0;
  const known = apiEmendaIdByInterno[rec.id];
  return known ? Number(known) || 0 : 0;
}

function announcePresenceForRecord(rec, action) {
  if (concurrencyService && typeof concurrencyService.announcePresenceForRecord === "function") {
    concurrencyService.announcePresenceForRecord(rec, action);
    return;
  }
  if (!isApiEnabled()) return;
  const backendId = getBackendIdForRecord(rec);
  if (!backendId) return;

  sendSocketJson({
    type: "presence",
    action: String(action || "").toLowerCase(),
    emenda_id: backendId
  });

  if (String(action || "").toLowerCase() === "join") {
    currentPresenceBackendId = backendId;
  } else if (String(action || "").toLowerCase() === "leave" && currentPresenceBackendId === backendId) {
    currentPresenceBackendId = null;
  }
}

function getPresenceUsersForRecord(rec) {
  if (concurrencyService && typeof concurrencyService.getPresenceUsersForRecord === "function") {
    return concurrencyService.getPresenceUsersForRecord(rec) || [];
  }
  const backendId = getBackendIdForRecord(rec);
  if (!backendId) return [];
  return Array.isArray(presenceByBackendId[backendId]) ? presenceByBackendId[backendId] : [];
}

function renderLivePresence(rec) {
  if (!livePresenceText) return;
  const users = getPresenceUsersForRecord(rec);
  if (!users.length) {
    livePresenceText.textContent = "Sem outro usuario ativo nesta emenda no momento.";
    return;
  }
  const list = users.map(function (u) {
    const nome = text(u.usuario_nome || "-");
    const setor = text(u.setor || "-");
    return nome + " (" + setor + ")";
  });
  livePresenceText.textContent = "Usuarios ativos nesta emenda agora: " + list.join(" | ");
}

function handlePresencePayload(data) {
  if (concurrencyService && typeof concurrencyService.handlePresencePayload === "function") {
    concurrencyService.handlePresencePayload(data);
    const rec = getSelected();
    if (rec) renderLivePresence(rec);
    return;
  }
  const backendId = Number(data && data.id ? data.id : 0);
  if (!backendId) return;
  const users = Array.isArray(data && data.users) ? data.users.map(function (u) {
    return {
      usuario_nome: text(u && u.usuario_nome ? u.usuario_nome : "-"),
      setor: text(u && u.setor ? u.setor : "-"),
      at: text(u && u.at ? u.at : "")
    };
  }) : [];

  if (!users.length) delete presenceByBackendId[backendId];
  else presenceByBackendId[backendId] = users;

  const rec = getSelected();
  if (rec && getBackendIdForRecord(rec) === backendId) {
    renderLivePresence(rec);
  }
}


// Abre WebSocket da API para atualizar tela em tempo real.
function connectApiSocket() {
  if (concurrencyService && typeof concurrencyService.connectApiSocket === "function") {
    concurrencyService.connectApiSocket();
    return;
  }
  closeApiSocket();

  if (!API_WS_ENABLED) return;
  if (typeof WebSocket === "undefined") return;
  if (!isApiEnabled()) return;

  const token = readStoredSessionToken();
  if (!token) return;

  const wsBase = getApiWebSocketUrl();
  if (!wsBase) return;

  const wsUrl = wsBase
    + "?token=" + encodeURIComponent(token)
    + "&user_name=" + encodeURIComponent(CURRENT_USER || "")
    + "&user_role=" + encodeURIComponent(CURRENT_ROLE || "");
  try {
    apiSocket = new WebSocket(wsUrl);
  } catch (_err) {
    scheduleApiSocketReconnect();
    return;
  }

  apiSocket.onopen = function () {
    apiSocketBackoffMs = WS_RECONNECT_BASE_MS;
    const rec = getSelected();
    if (rec) announcePresenceForRecord(rec, "join");
  };

  apiSocket.onmessage = function (evt) {
    const raw = evt && evt.data ? String(evt.data) : "";
    if (!raw) return;

    let data = null;
    try { data = JSON.parse(raw); } catch (_err) { return; }
    if (!data) return;

    if (data.type === "presence") {
      handlePresencePayload(data);
      return;
    }

    if (data.type !== "update") return;
    queueApiRefreshFromSocket();
  };

  apiSocket.onerror = function () {
    // onclose trata reconexao
  };

  apiSocket.onclose = function () {
    apiSocket = null;
    scheduleApiSocketReconnect();
  };
}
// Decide se a UI deve operar em modo API (nuvem) ou local.
function isApiEnabled() {
  if (apiClient && typeof apiClient.isApiEnabled === "function") {
    return apiClient.isApiEnabled();
  }
  return true;
}

// Resolve URL base da API (compatibilidade local, quando o cliente modular não estiver disponível).
function getApiBaseUrl() {
  if (apiClient && typeof apiClient.getApiBaseUrl === "function") {
    return apiClient.getApiBaseUrl();
  }
  const host = (typeof window !== "undefined" && window.location && window.location.hostname) ? String(window.location.hostname) : "";
  const isHostedUi = !!host && host !== "localhost" && host !== "127.0.0.1";
  const local = readStorageValue(localStorage, API_BASE_URL_KEY);
  const byHostMap = (RUNTIME_CONFIG && RUNTIME_CONFIG.API_BASE_URL_BY_HOST && typeof RUNTIME_CONFIG.API_BASE_URL_BY_HOST === "object")
    ? RUNTIME_CONFIG.API_BASE_URL_BY_HOST
    : {};
  const hostBase = text(byHostMap[host]);
  if (!isHostedUi) {
    return (text(local || DEFAULT_API_BASE_URL) || "http://127.0.0.1:8000").replace(/\/+$/, "");
  }
  return (text(local || hostBase || (RUNTIME_CONFIG && RUNTIME_CONFIG.API_BASE_URL) || DEFAULT_API_BASE_URL) || "http://127.0.0.1:8000").replace(/\/+$/, "");
}

// Wrapper autenticado para chamadas privadas da API.
async function apiRequest(method, path, body, eventOrigin, options) {
  if (apiClient && typeof apiClient.apiRequest === "function") {
    return await apiClient.apiRequest(method, path, body, eventOrigin, options);
  }
  throw new Error("Cliente de API indisponivel. Recarregue a pagina.");
}

// Wrapper publico para login/cadastro sem token.
async function apiRequestPublic(method, path, body) {
  if (apiClient && typeof apiClient.apiRequestPublic === "function") {
    return await apiClient.apiRequestPublic(method, path, body);
  }
  throw new Error("Cliente de API indisponivel. Recarregue a pagina.");
}

// Monta headers padrao de auditoria/autenticacao para chamadas privadas.
function buildApiHeaders(eventOrigin) {
  if (apiClient && typeof apiClient.buildApiHeaders === "function") {
    return apiClient.buildApiHeaders(eventOrigin);
  }
  const headers = {
    "X-User-Name": CURRENT_USER,
    "X-User-Role": CURRENT_ROLE
  };

  const origin = String(eventOrigin || API_DEFAULT_EVENT_ORIGIN).trim().toUpperCase();
  if (origin) headers["X-Event-Origin"] = origin;

  const token = readStoredSessionToken();
  if (token) {
    headers["Authorization"] = "Bearer " + token;
    // Compatibilidade com backend antigo.
    headers["X-Session-Token"] = token;
  }

  const key = storageUtils && typeof storageUtils.readStorageValue === "function"
    ? storageUtils.readStorageValue(sessionStorage, API_SHARED_KEY_SESSION_KEY)
    : readStorageValue(sessionStorage, API_SHARED_KEY_SESSION_KEY);
  if (key) headers["X-API-Key"] = key;

  return headers;
}

function getStorageMode() {
  if (storageUtils && typeof storageUtils.getStorageMode === "function") {
    const mode = String(storageUtils.getStorageMode(STORAGE_MODE_KEY) || "").toLowerCase();
    if (mode === STORAGE_MODE_LOCAL || mode === STORAGE_MODE_SESSION) return mode;
  }

  const configured = readStorageValue(localStorage, STORAGE_MODE_KEY).toLowerCase();
  if (configured === STORAGE_MODE_LOCAL) return STORAGE_MODE_LOCAL;
  return STORAGE_MODE_SESSION;
}

function getPrimaryStorage() {
  if (storageUtils && typeof storageUtils.getPrimaryStorage === "function") {
    return storageUtils.getPrimaryStorage(STORAGE_MODE_KEY);
  }
  return getStorageMode() === STORAGE_MODE_LOCAL ? localStorage : sessionStorage;
}

function getSecondaryStorage() {
  if (storageUtils && typeof storageUtils.getSecondaryStorage === "function") {
    return storageUtils.getSecondaryStorage(STORAGE_MODE_KEY);
  }
  return getStorageMode() === STORAGE_MODE_LOCAL ? sessionStorage : localStorage;
}

function isApiConflictError(err) {
  return !!(err && Number(err.status) === 409);
}

function extractConflictDetail(err) {
  const detail = err && err.detail && typeof err.detail === "object" ? err.detail : null;
  if (!detail) return null;
  if (detail.code && String(detail.code) === "edit_lock_conflict") return null;
  return {
    message: String(detail.message || "Conflito de atualizacao."),
    expected: toInt(detail.expected_row_version),
    current: toInt(detail.current_row_version),
    updatedAt: text(detail.current_updated_at || "")
  };
}

function extractLockConflictDetail(err) {
  const detail = err && err.detail && typeof err.detail === "object" ? err.detail : null;
  if (!detail) return null;
  if (String(detail.code || "") !== "edit_lock_conflict") return null;
  return {
    ownerName: text(detail.lock_owner_name || ""),
    ownerRole: text(detail.lock_owner_role || ""),
    expiresAt: text(detail.lock_expires_at || "")
  };
}

function conflictMessageFromError(err) {
  const lockInfo = extractLockConflictDetail(err);
  if (lockInfo) {
    const owner = (lockInfo.ownerName || "-") + " (" + (lockInfo.ownerRole || "-") + ")";
    const until = lockInfo.expiresAt ? fmtDateTime(lockInfo.expiresAt) : "-";
    return "Edicao bloqueada por outro usuario: " + owner + ". Expira em: " + until + ".";
  }
  const info = extractConflictDetail(err);
  if (!info) return "Conflito de atualizacao detectado. Atualize os dados antes de salvar novamente.";
  const when = info.updatedAt ? fmtDateTime(info.updatedAt) : "-";
  return "Conflito detectado: versao esperada " + String(info.expected || "-")
    + ", versao atual " + String(info.current || "-")
    + ". Ultima alteracao: " + when + ".";
}

async function refreshRecordConcurrencyFromApi(rec) {
  if (!rec || !isApiEnabled()) return false;
  const backendId = getBackendIdForRecord(rec);
  if (!backendId) return false;
  try {
    const remote = await apiRequest("GET", "/emendas/" + String(backendId), undefined, "API");
    if (remote && remote.updated_at) rec.updated_at = String(remote.updated_at);
    if (remote && toInt(remote.row_version) > 0) rec.row_version = toInt(remote.row_version);
    return true;
  } catch (_err) {
    return false;
  }
}

function restoreRecordFromSnapshot(rec, snapshot) {
  if (!rec || !snapshot) return;
  const restored = deepClone(snapshot);
  Object.keys(rec).forEach(function (key) { delete rec[key]; });
  Object.keys(restored).forEach(function (key) { rec[key] = restored[key]; });
}

async function rollbackSaveAndReport(err, rec, snapshot, actionName) {
  restoreRecordFromSnapshot(rec, snapshot);
  saveState(true);
  render();
  if (selectedId === rec.id) openModal(rec.id, true);

  if (isApiConflictError(err)) {
    await refreshRecordConcurrencyFromApi(rec);
    showModalSaveFeedback(conflictMessageFromError(err), true);
    return;
  }

  handleApiSyncError(err, actionName);
}

function handleApiSyncError(err, actionName) {
  const msg = err && err.message ? String(err.message) : "falha desconhecida";
  const status = Number(err && err.status ? err.status : 0);
  apiOnline = !!status && status < 500;
  apiLastError = msg;
  applyAccessProfile();
  console.warn("Falha ao sincronizar " + actionName + " com API:", msg);
}

function normalizeUserRole(roleInput) {
  const role = String(roleInput || "").trim().toUpperCase();
  return USER_ROLE_OPTIONS.includes(role) ? role : "CONTABIL";
}

function mkEvent(type, payload) {
  const p = payload || {};
  return {
    at: p.at || isoNow(),
    actor_user: p.actor_user || CURRENT_USER,
    actor_role: p.actor_role || CURRENT_ROLE,
    type: type,
    key: p.key || null,
    field: p.field || null,
    from: p.from || null,
    to: p.to || null,
    raw_from: Object.prototype.hasOwnProperty.call(p, "raw_from") ? p.raw_from : null,
    raw_to: Object.prototype.hasOwnProperty.call(p, "raw_to") ? p.raw_to : null,
    note: p.note || ""
  };
}

function mkRecord(data) {
  const now = isoNow();
  const rec = {
    id: asText(data.id),
    ano: toInt(data.ano) || currentYear(),
    identificacao: asText(data.identificacao) || "-",
    cod_subfonte: asText(data.cod_subfonte),
    deputado: asText(data.deputado) || "-",
    cod_uo: asText(data.cod_uo),
    sigla_uo: asText(data.sigla_uo),
    cod_orgao: asText(data.cod_orgao),
    cod_acao: asText(data.cod_acao),
    descricao_acao: asText(data.descricao_acao),
    plan_a: asText(data.plan_a || data.plano_a),
    plan_b: asText(data.plan_b || data.plano_b),
    municipio: asText(data.municipio) || "-",
    valor_inicial: toNumber(data.valor_inicial != null ? data.valor_inicial : 0),
    valor_atual: toNumber(data.valor_atual != null ? data.valor_atual : (data.valor_inicial != null ? data.valor_inicial : 0)),
    processo_sei: asText(data.processo_sei),
    status_oficial: normalizeStatus(data.status_oficial || "Recebido"),
    backend_id: data.backend_id != null ? Number(data.backend_id) : null,
    row_version: toInt(data.row_version) > 0 ? toInt(data.row_version) : 1,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    eventos: Array.isArray(data.eventos) && data.eventos.length ? data.eventos : [mkEvent("IMPORT", { note: "Registro criado." })],
    ref_key: "",
    source_sheet: asText(data.source_sheet || "Controle de EPI"),
    source_row: data.source_row != null ? Number(data.source_row) : null,
    all_fields: data.all_fields && typeof data.all_fields === "object" ? shallowCloneObj(data.all_fields) : {},
    demo_seed: !!data.demo_seed
  };
  syncCanonicalToAllFields(rec);
  rec.ref_key = buildReferenceKey(rec);
  return rec;
}

function normalizeRecordShape(raw) {
  const rec = mkRecord(raw || {});
  rec.id = asText(raw && raw.id ? raw.id : rec.id);
  rec.backend_id = raw && raw.backend_id != null ? Number(raw.backend_id) : rec.backend_id;
  rec.row_version = raw && toInt(raw.row_version) > 0 ? toInt(raw.row_version) : rec.row_version;
  rec.parent_id = raw && raw.parent_id != null ? Number(raw.parent_id) : rec.parent_id;
  rec.version = raw && toInt(raw.version) > 0 ? toInt(raw.version) : rec.version;
  rec.is_current = raw && Object.prototype.hasOwnProperty.call(raw, "is_current") ? raw.is_current !== false : rec.is_current;
  rec.created_at = (raw && raw.created_at) || rec.created_at;
  rec.updated_at = (raw && raw.updated_at) || rec.updated_at;
  rec.eventos = Array.isArray(raw && raw.eventos) && raw.eventos.length ? raw.eventos : rec.eventos;
  if (!rec.valor_inicial && rec.valor_atual) rec.valor_inicial = rec.valor_atual;
  rec.source_sheet = asText((raw && raw.source_sheet) || rec.source_sheet || "Controle de EPI");
  rec.source_row = raw && raw.source_row != null ? Number(raw.source_row) : rec.source_row;
  rec.all_fields = rec.all_fields && typeof rec.all_fields === "object" ? rec.all_fields : {};
  rec.demo_seed = (raw && raw.demo_seed === true) || inferDemoSeed(raw || rec);
  syncCanonicalToAllFields(rec);
  rec.ref_key = buildReferenceKey(rec);
  return rec;
}


function inferDemoSeed(rec) {
  if (!rec) return false;
  if (rec.demo_seed === true) return true;

  const identificacao = normalizeLooseText(rec.identificacao || "");
  const deputado = normalizeLooseText(rec.deputado || "");
  const processo = normalizeLooseText(rec.processo_sei || "");
  const id = normalizeLooseText(rec.id || "");
  const events = Array.isArray(rec.eventos) ? rec.eventos : [];

  const hasDemoNote = events.some(function (ev) {
    return normalizeLooseText(ev && ev.note ? ev.note : "").indexOf("demo") >= 0;
  });
  if (hasDemoNote) return true;

  if (identificacao === "epi 2026 / fanfarra" && deputado === "dep-alfa") return true;
  if (identificacao === "epi 2026 / reforma escola" && deputado === "dep-beta") return true;

  if (id === "epi-2026-000001" && processo === "sei-0001/2026") return true;
  if (id === "epi-2026-000002" && processo === "sei-0002/2026") return true;

  return false;
}

function purgeDemoBeforeOfficialImport() {
  const records = Array.isArray(state && state.records) ? state.records : [];
  const kept = records.filter(function (rec) {
    return !inferDemoSeed(rec);
  });
  const removed = records.length - kept.length;
  if (removed > 0) {
    state.records = kept;
  }
  return removed;
}

function migrateLegacyStatusRecords(records) {
  (records || []).forEach(function (rec) {
    const events = Array.isArray(rec && rec.eventos) ? rec.eventos : [];
    const hasMark = events.some(function (ev) { return ev && ev.type === "MARK_STATUS"; });
    const legacyStatus = normalizeStatus(rec && rec.status_oficial ? rec.status_oficial : "");

    if (!hasMark && legacyStatus) {
      events.unshift(mkEvent("MARK_STATUS", {
        to: legacyStatus,
        note: "Migracao automatica de status legado.",
        actor_user: SYSTEM_MIGRATION_USER,
        actor_role: SYSTEM_MIGRATION_ROLE
      }));
      rec.eventos = events;
      rec.updated_at = rec.updated_at || isoNow();
    }

    if (rec && Object.prototype.hasOwnProperty.call(rec, "status_oficial")) {
      rec.status_oficial = "";
    }
  });
}

function latestMarkedStatus(rec) {
  const events = getEventsSorted(rec || {});
  for (let i = 0; i < events.length; i += 1) {
    const ev = events[i];
    if (ev && ev.type === "MARK_STATUS" && ev.to) return normalizeStatus(ev.to);
  }
  return "";
}

function deriveStatusForBackend(rec) {
  return latestMarkedStatus(rec) || "Recebido";
}

// Sincroniza alteracoes entre abas via BroadcastChannel/storage event.
function setupCrossTabSync() {
  if (stateChannel) {
    stateChannel.onmessage = function (evt) {
      const data = evt && evt.data ? evt.data : null;
      if (!data || data.type !== "state_updated") return;
      if (data.tabId && data.tabId === LOCAL_TAB_ID) return;
      refreshStateFromStorage();
    };
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", function (e) {
      if (!e) return;
      if (e.key !== STORAGE_KEY && e.key !== CROSS_TAB_PING_KEY) return;
      refreshStateFromStorage();
    });
  }
}

// Notifica outras abas que o estado local mudou.
function notifyStateUpdated() {
  if (stateChannel) {
    stateChannel.postMessage({ type: "state_updated", at: Date.now(), tabId: LOCAL_TAB_ID });
  }
  writeStorageValue(localStorage, CROSS_TAB_PING_KEY, String(Date.now()));
}

// Recarrega estado salvo e redesenha interface.
function refreshStateFromStorage() {
  const loaded = loadState();
  state = { records: (loaded.records || []).map(normalizeRecordShape) };
  migrateLegacyStatusRecords(state.records);
  syncReferenceKeys(state.records);
  syncYearFilter();
  render();
}
// Carrega estado persistido (storage atual, fallback e legado).
function loadState() {
  try {
    const primary = getPrimaryStorage();
    const secondary = getSecondaryStorage();
    const raw = readStorageValue(primary, STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.records)) return parsed;
    }

    const rawSecondary = readStorageValue(secondary, STORAGE_KEY);
    if (rawSecondary) {
      const parsedSecondary = JSON.parse(rawSecondary);
      if (parsedSecondary && Array.isArray(parsedSecondary.records)) return parsedSecondary;
    }

    for (let i = 0; i < LEGACY_STORAGE_KEYS.length; i += 1) {
      const legacyRaw = readStorageValue(localStorage, LEGACY_STORAGE_KEYS[i]);
      if (!legacyRaw) continue;
      const parsedLegacy = JSON.parse(legacyRaw);
      if (parsedLegacy && Array.isArray(parsedLegacy.records)) return { records: parsedLegacy.records };
    }

    return { records: deepClone(DEMO) };
  } catch (_err) {
    return { records: deepClone(DEMO) };
  }
}

// Persiste estado e opcionalmente propaga sincronizacao cross-tab.
function saveState(silentSync) {
  syncActiveUsersCache(state.records || []);
  const data = JSON.stringify(state);
  const primary = getPrimaryStorage();
  const secondary = getSecondaryStorage();
  primary.setItem(STORAGE_KEY, data);
  secondary.removeItem(STORAGE_KEY);
  if (!silentSync) notifyStateUpdated();
}


function syncActiveUsersCache(records) {
  (records || []).forEach(function (rec) {
    rec.active_users = getActiveUsersWithLastMark(rec).map(function (u) {
      return {
        name: u.name,
        role: u.role,
        lastStatus: u.lastStatus,
        lastAt: u.lastAt
      };
    });
  });
}
function buildIdCounters(records) {
  const buildIdCountersUtil = getIdUtil("buildIdCounters");
  if (buildIdCountersUtil) {
    return buildIdCountersUtil(records);
  }

  const counters = {};
  records.forEach(function (r) {
    const id = String(r.id || "");
    const m = id.match(/^EPI-(\d{4})-(\d+)$/i);
    if (!m) return;
    const year = m[1];
    const seq = parseInt(m[2], 10) || 0;
    counters[year] = Math.max(counters[year] || 0, seq);
  });
  return counters;
}

function assignMissingIds(records, counters) {
  const assignMissingIdsUtil = getIdUtil("assignMissingIds");
  if (assignMissingIdsUtil) {
    return assignMissingIdsUtil(records, counters, generateInternalId, toInt, currentYear);
  }

  records.forEach(function (r) {
    if (String(r.id || "").trim()) return;
    r.id = generateInternalId(r.ano, counters);
  });
}

function generateInternalId(ano, counters) {
  const generateInternalIdUtil = getIdUtil("generateInternalId");
  if (generateInternalIdUtil) {
    return generateInternalIdUtil(ano, counters, toInt, currentYear);
  }

  const year = String(toInt(ano) || currentYear());
  const next = (counters[year] || 0) + 1;
  counters[year] = next;
  return "EPI-" + year + "-" + String(next).padStart(6, "0");
}
function syncReferenceKeys(records) {
  const syncReferenceKeysUtil = getImportNormalizationUtil("syncReferenceKeys");
  if (syncReferenceKeysUtil) {
    return syncReferenceKeysUtil(records, REFERENCE_FIELDS, buildReferenceKey);
  }
  records.forEach(function (r) {
    r.ref_key = buildReferenceKey(r);
  });
}

function buildReferenceKey(record) {
  const buildReferenceKeyUtil = getImportNormalizationUtil("buildReferenceKey");
  if (buildReferenceKeyUtil) {
    return buildReferenceKeyUtil(record, REFERENCE_FIELDS, normalizeReferencePart);
  }
  const parts = REFERENCE_FIELDS.map(function (field) {
    return normalizeReferencePart(record[field]);
  });
  if (parts.every(function (p) { return p === ""; })) return "";
  return parts.join("|");
}

function normalizeReferencePart(value) {
  const normalizeReferencePartUtil = getImportNormalizationUtil("normalizeReferencePart");
  if (normalizeReferencePartUtil) {
    return normalizeReferencePartUtil(value, normalizeLooseText);
  }
  const normalizeReferencePartFallbackUtil = getNormalizeUtil("normalizeReferencePart");
  if (normalizeReferencePartFallbackUtil) {
    return normalizeReferencePartFallbackUtil(value);
  }
  return normalizeLooseText(value).replace(/\s+/g, " ").trim();
}

function normalizeLooseText(value) {
  const normalizeLooseTextUtil = getNormalizeUtil("normalizeLooseText");
  if (normalizeLooseTextUtil) {
    return normalizeLooseTextUtil(value);
  }
  return String(value == null ? "" : value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeRowKeys(row) {
  const normalizeRowKeysUtil = getNormalizeUtil("normalizeRowKeys");
  if (normalizeRowKeysUtil) {
    return normalizeRowKeysUtil(row);
  }
  const out = {};
  Object.keys(row || {}).forEach(function (k) {
    const nk = normalizeHeader(k);
    if (!nk) return;
    if (out[nk] == null || String(out[nk]).trim() === "") out[nk] = row[k];
  });
  return out;
}

function normalizeHeader(key) {
  const normalizeHeaderUtil = getNormalizeUtil("normalizeHeader");
  if (normalizeHeaderUtil) {
    return normalizeHeaderUtil(key);
  }
  return normalizeLooseText(key).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function pickValue(normalizedRow, aliases) {
  const pickValueUtil = getNormalizeUtil("pickValue");
  if (pickValueUtil) {
    return pickValueUtil(normalizedRow, aliases);
  }
  if (!normalizedRow) return "";
  for (let i = 0; i < aliases.length; i += 1) {
    const nk = normalizeHeader(aliases[i]);
    const raw = normalizedRow[nk];
    if (raw == null) continue;
    const txt = String(raw).trim();
    if (txt !== "") return raw;
  }
  return "";
}

function shallowCloneObj(obj) {
  const shallowCloneObjUtil = getNormalizeUtil("shallowCloneObj");
  if (shallowCloneObjUtil) {
    return shallowCloneObjUtil(obj);
  }
  const out = {};
  Object.keys(obj || {}).forEach(function (k) {
    out[k] = obj[k];
  });
  return out;
}

function mergeRawFields(target, incomingRaw) {
  if (!target.all_fields || typeof target.all_fields !== "object") target.all_fields = {};
  let changed = false;

  Object.keys(incomingRaw || {}).forEach(function (key) {
    const next = incomingRaw[key] == null ? "" : String(incomingRaw[key]);
    const prev = target.all_fields[key] == null ? "" : String(target.all_fields[key]);
    if (prev !== next) {
      target.all_fields[key] = next;
      changed = true;
    }
  });

  return changed;
}

function syncCanonicalToAllFields(record) {
  const syncCanonicalToAllFieldsUtil = getImportNormalizationUtil("syncCanonicalToAllFields");
  if (syncCanonicalToAllFieldsUtil) {
    return syncCanonicalToAllFieldsUtil(
      record,
      IMPORT_ALIASES,
      RAW_PREFERRED_HEADERS,
      normalizeHeader
    );
  }

  if (!record.all_fields || typeof record.all_fields !== "object") record.all_fields = {};

  upsertRawField(record.all_fields, "id", record.id);
  upsertRawField(record.all_fields, "ano", record.ano);
  upsertRawField(record.all_fields, "identificacao", record.identificacao);
  upsertRawField(record.all_fields, "cod_subfonte", record.cod_subfonte);
  upsertRawField(record.all_fields, "deputado", record.deputado);
  upsertRawField(record.all_fields, "cod_uo", record.cod_uo);
  upsertRawField(record.all_fields, "sigla_uo", record.sigla_uo);
  upsertRawField(record.all_fields, "cod_orgao", record.cod_orgao);
  upsertRawField(record.all_fields, "cod_acao", record.cod_acao);
  upsertRawField(record.all_fields, "descricao_acao", record.descricao_acao);
  upsertRawField(record.all_fields, "plan_a", record.plan_a);
  upsertRawField(record.all_fields, "plan_b", record.plan_b);
  upsertRawField(record.all_fields, "municipio", record.municipio);
  upsertRawField(record.all_fields, "valor_inicial", record.valor_inicial);
  upsertRawField(record.all_fields, "valor_atual", record.valor_atual);
  upsertRawField(record.all_fields, "processo_sei", record.processo_sei);
}

function upsertRawField(rawObj, canonicalKey, value) {
  const upsertRawFieldUtil = getImportNormalizationUtil("upsertRawField");
  if (upsertRawFieldUtil) {
    return upsertRawFieldUtil(
      rawObj,
      canonicalKey,
      value,
      IMPORT_ALIASES,
      RAW_PREFERRED_HEADERS,
      normalizeHeader
    );
  }

  const aliases = IMPORT_ALIASES[canonicalKey] || [];
  const preferred = RAW_PREFERRED_HEADERS[canonicalKey] || canonicalKey;
  const normalizedAliases = aliases.map(function (a) { return normalizeHeader(a); });

  let keyFound = null;
  Object.keys(rawObj).forEach(function (k) {
    if (keyFound) return;
    if (normalizedAliases.includes(normalizeHeader(k))) keyFound = k;
  });

  const finalKey = keyFound || preferred;
  rawObj[finalKey] = value == null ? "" : value;
}

function getImportReportUtil(methodName) {
  if (!importReportUtils) return null;
  const method = importReportUtils[methodName];
  return typeof method === "function" ? method : null;
}

function renderImportDashboard() {
  const renderImportDashboardUtil = getImportReportUtil("renderImportDashboard");
  if (renderImportDashboardUtil) {
    renderImportDashboardUtil(
      state.records || [],
      latestImportReport,
      lastImportedPlanilha1Aoa,
      importReport,
      fmtDateTime,
      escapeHtml,
      buildPlanilha1Aoa,
      normalizeLooseText,
      buildPlanilha1Html,
      function (limit) {
        return getRecentChangesForPanel(limit);
      },
      wireImportReportTabs,
      latestExportReport,
      buildExportSummaryBadgeHtml,
      exportScopeLabel
    );
    return;
  }

  if (!importReport) return;
  importReport.classList.remove("hidden");

  const left = latestImportReport ? buildImportSummaryHtml(latestImportReport) : buildImportSummaryPlaceholderHtml();
  const recent = getRecentChangesForPanel(HOME_CHANGES_LIMIT);
  const exportSummary = buildExportSummaryBadgeHtml(latestExportReport);

  clearNodeChildren(importReport);
  appendRenderedMarkup(importReport, exportSummary);
  appendRenderedMarkup(
    importReport,
    "<div class=\"import-dashboard-grid\">"
    + "  <section class=\"import-dashboard-left\">" + left + "</section>"
    + "  <section class=\"import-dashboard-right\">" + buildRecentChangesPanelHtml(recent) + "</section>"
    + "</div>"
  );

  if (latestImportReport) {
    wireImportReportTabs("planilha1");
  }
}

function buildExportSummaryBadgeHtml(report) {
  const buildExportSummaryBadgeHtmlUtil = getImportReportUtil("buildExportSummaryBadgeHtml");
  if (buildExportSummaryBadgeHtmlUtil) {
    return buildExportSummaryBadgeHtmlUtil(
      report,
      escapeHtml,
      exportScopeLabel,
      fmtDateTime
    );
  }
  if (!report) {
    return '<div class="export-summary-banner muted small">MODO: -</div>';
  }

  const scope = exportScopeLabel(report.escopo || EXPORT_SCOPE.ATUAIS);
  const file = report.arquivoNome ? escapeHtml(String(report.arquivoNome)) : "-";
  const qty = Number.isFinite(Number(report.quantidadeRegistros)) ? Number(report.quantidadeRegistros) : 0;
  const when = report.geradoEm ? fmtDateTime(report.geradoEm) : "-";

  return ''
    + '<div class="export-summary-banner">'
    + '  <span class="export-summary-mode">MODO: ' + scope + '</span>'
    + '  <span class="muted small">Arquivo: ' + file + '</span>'
    + '  <span class="muted small">Registros: ' + String(qty) + '</span>'
    + '  <span class="muted small">Gerado em: ' + escapeHtml(String(when)) + '</span>'
    + '</div>';
}
function buildImportSummaryPlaceholderHtml() {
  const buildImportSummaryPlaceholderHtmlUtil = getImportReportUtil("buildImportSummaryPlaceholderHtml");
  if (buildImportSummaryPlaceholderHtmlUtil) {
    return buildImportSummaryPlaceholderHtmlUtil(
      state.records || [],
      lastImportedPlanilha1Aoa,
      escapeHtml,
      fmtDateTime,
      buildPlanilha1Aoa,
      normalizeLooseText,
      buildPlanilha1Html,
      function (limit) { return getRecentChangesForPanel(limit); }
    );
  }
  const totalRegistros = (state.records || []).length;
  const totalEventos = (state.records || []).reduce(function (acc, rec) {
    return acc + ((rec && rec.eventos && rec.eventos.length) ? rec.eventos.length : 0);
  }, 0);
  const last = getRecentChangesForPanel(1)[0] || null;
  const lastAt = last ? fmtDateTime(last.at) : "-";
  const lastBy = last ? (escapeHtml(last.actor_user) + " (" + escapeHtml(last.actor_role) + ")") : "-";
  const planilha1Aoa = (Array.isArray(lastImportedPlanilha1Aoa) && lastImportedPlanilha1Aoa.length)
    ? lastImportedPlanilha1Aoa
    : buildPlanilha1Aoa(state.records || []);
  const planilha1Html = buildPlanilha1Html(planilha1Aoa);

  return ""
    + '<h4>Resumo da base atual</h4>'
    + '<p class="muted small">Sem importacao nova nesta sessao. Os dados atuais continuam ativos.</p>'
    + '<div class="kv" style="margin-top:8px">'
    + '  <div class="k">Registros carregados</div><div class="v">' + String(totalRegistros) + '</div>'
    + '  <div class="k">Eventos no historico</div><div class="v">' + String(totalEventos) + '</div>'
    + '  <div class="k">Ultima alteracao</div><div class="v">' + lastAt + '</div>'
    + '  <div class="k">Responsavel da ultima alteracao</div><div class="v">' + lastBy + '</div>'
    + '</div>'
    + '<div style="margin-top:12px">'
    + '  <h4 style="margin-bottom:8px">Resumo por deputado (Planilha1)</h4>'
    + planilha1Html
    + '</div>';
}

function buildImportSummaryHtml(report) {
  const buildImportSummaryHtmlUtil = getImportReportUtil("buildImportSummaryHtml");
  if (buildImportSummaryHtmlUtil) {
    return buildImportSummaryHtmlUtil(
      report,
      state.records || [],
      lastImportedPlanilha1Aoa,
      escapeHtml,
      fmtDateTime,
      buildPlanilha1Aoa,
      normalizeLooseText,
      buildPlanilha1Html
    );
  }
  const sheets = report && report.sheetNames && report.sheetNames.length ? report.sheetNames.join(", ") : "-";
  const fileName = report && report.fileName ? report.fileName : "-";

  const planilha1Aoa = (Array.isArray(lastImportedPlanilha1Aoa) && lastImportedPlanilha1Aoa.length)
    ? lastImportedPlanilha1Aoa
    : buildPlanilha1Aoa(state.records || []);
  const planilha1Html = buildPlanilha1Html(planilha1Aoa);

  return ""
    + "<h4>Resumo da importacao</h4>"
    + "<p class=\"muted small\">Arquivo: " + escapeHtml(fileName) + " | Abas lidas: " + escapeHtml(sheets) + "</p>"
    + "<div class=\"import-tabs\" role=\"tablist\" aria-label=\"Abas do relatorio de importacao\">"
    + "  <button type=\"button\" class=\"import-tab-btn active\" data-import-tab=\"resumo\" role=\"tab\" aria-selected=\"true\">Resumo da importacao</button>"
    + "  <button type=\"button\" class=\"import-tab-btn\" data-import-tab=\"planilha1\" role=\"tab\" aria-selected=\"false\">Planilha1 (Deputados)</button>"
    + "  <button type=\"button\" class=\"import-tab-btn\" data-import-tab=\"validacao\" role=\"tab\" aria-selected=\"false\">Validacao</button>"
    + "</div>"
    + "<div class=\"import-tab-panels\">"
    + "  <section class=\"import-tab-panel active entering\" data-import-panel=\"resumo\">"
    + "    <div class=\"kv\" style=\"margin-top:8px\">"
    + "      <div class=\"k\">Linhas lidas</div><div class=\"v\">" + String(report.totalRows || 0) + "</div>"
    + "      <div class=\"k\">Linhas validas</div><div class=\"v\">" + String(report.consideredRows || 0) + "</div>"
    + "      <div class=\"k\">Linhas ignoradas</div><div class=\"v\">" + String(report.skippedRows || 0) + "</div>"
    + "      <div class=\"k\">Novos registros</div><div class=\"v\">" + String(report.created || 0) + "</div>"
    + "      <div class=\"k\">Registros atualizados</div><div class=\"v\">" + String(report.updated || 0) + "</div>"
    + "      <div class=\"k\">Sem alteracao</div><div class=\"v\">" + String(report.unchanged || 0) + "</div>"
    + "      <div class=\"k\">Duplicidade por ID</div><div class=\"v\">" + String(report.duplicateById || 0) + "</div>"
    + "      <div class=\"k\">Duplicidade por chave ref</div><div class=\"v\">" + String(report.duplicateByRef || 0) + "</div>"
    + "      <div class=\"k\">Duplicidade dentro do arquivo</div><div class=\"v\">" + String(report.duplicateInFile || 0) + "</div>"
    + "      <div class=\"k\">Conflito ID x chave ref</div><div class=\"v\">" + String(report.conflictIdVsRef || 0) + "</div>"
    + "    </div>"
    + "  </section>"
    + "  <section class=\"import-tab-panel import-report-right\" data-import-panel=\"planilha1\">"
    + "    <h4 style=\"margin-bottom:8px\">Resumo por deputado (Planilha1)</h4>"
    + planilha1Html
    + "  </section>"
    + "  <section class=\"import-tab-panel\" data-import-panel=\"validacao\">"
    + buildImportValidationHtml(report.validation)
    + "  </section>"
    + "</div>";
}

function buildImportValidationHtml(validation) {
  const buildImportValidationHtmlUtil = getImportReportUtil("buildImportValidationHtml");
  if (buildImportValidationHtmlUtil) {
    return buildImportValidationHtmlUtil(validation, escapeHtml);
  }
  const v = validation || {};
  const recognized = Array.isArray(v.recognizedHeaders) ? v.recognizedHeaders : [];
  const unrecognized = Array.isArray(v.unrecognizedHeaders) ? v.unrecognizedHeaders : [];
  const duplicated = Array.isArray(v.duplicatedHeaders) ? v.duplicatedHeaders : [];
  const alerts = Array.isArray(v.alerts) ? v.alerts : [];
  const preview = Array.isArray(v.previewRows) ? v.previewRows : [];
  const types = v.detectedTypes || {};

  let html = ""
    + "<h4>Relatorio de validacao</h4>"
    + "<div class=\"kv\" style=\"margin-top:8px\">"
    + "  <div class=\"k\">Colunas reconhecidas</div><div class=\"v\">" + escapeHtml(recognized.join(", ") || "-") + "</div>"
    + "  <div class=\"k\">Colunas nao reconhecidas</div><div class=\"v\">" + escapeHtml(unrecognized.join(", ") || "-") + "</div>"
    + "  <div class=\"k\">Colunas duplicadas</div><div class=\"v\">" + escapeHtml(duplicated.join(", ") || "-") + "</div>"
    + "  <div class=\"k\">Tipos detectados</div><div class=\"v\">" + escapeHtml(JSON.stringify(types)) + "</div>"
    + "</div>";

  if (alerts.length) {
    html += "<div style=\"margin-top:8px\"><b>Alertas</b><ul>" + alerts.map(function (a) { return "<li>" + escapeHtml(a) + "</li>"; }).join("") + "</ul></div>";
  }

  if (preview.length) {
    html += "<div style=\"margin-top:8px\"><b>Preview (5 linhas)</b>";
    html += "<div class=\"table-wrap\"><table class=\"table\" style=\"min-width:720px\"><thead><tr><th>Aba</th><th>Linha</th><th>Dados</th></tr></thead><tbody>";
    preview.forEach(function (row) {
      html += "<tr><td>" + escapeHtml(row.aba || "-") + "</td><td>" + escapeHtml(String(row.linha || "-")) + "</td><td><code>" + escapeHtml(JSON.stringify(row.dados)) + "</code></td></tr>";
    });
    html += "</tbody></table></div></div>";
  }

  return html;
}
function buildRecentChangesPanelHtml(items) {
  const buildRecentChangesPanelHtmlUtil = getImportReportUtil("buildRecentChangesPanelHtml");
  if (buildRecentChangesPanelHtmlUtil) {
    return buildRecentChangesPanelHtmlUtil(items, escapeHtml, fmtDateTime, function (item) { return describeEventForPanel(item); }, text);
  }
  if (!items.length) {
    return ""
      + "<h4>Painel de alteracoes</h4>"
      + "<p class=\"muted small\">Sem alteracoes registradas ainda.</p>";
  }

  let html = ""
    + "<h4>Painel de alteracoes</h4>"
    + "<p class=\"muted small\">Ultimos " + String(items.length) + " eventos registrados (inclui sessoes anteriores).</p>"
    + "<div class=\"recent-list\">";

  items.forEach(function (item) {
    html += ""
      + "<article class=\"recent-item\">"
      + "  <div class=\"recent-item-top\">"
      + "    <strong>" + escapeHtml(item.actor_user) + "</strong>"
      + "    <span class=\"muted small\">" + escapeHtml(item.actor_role) + " | " + fmtDateTime(item.at) + "</span>"
      + "  </div>"
      + "  <div class=\"recent-item-action\">" + escapeHtml(describeEventForPanel(item)) + "</div>"
      + "  <div class=\"recent-item-target\"><code>" + escapeHtml(item.id) + "</code> | " + escapeHtml(item.identificacao) + "</div>"
      + (item.note ? ("<div class=\"recent-item-note muted small\">Obs: " + escapeHtml(item.note) + "</div>") : "")
      + "</article>";
  });

  html += "</div>";
  return html;
}

function getRecentChangesForPanel(limit) {
  const getRecentChangesForPanelUtil = getImportReportUtil("getRecentChangesForPanel");
  if (getRecentChangesForPanelUtil) {
    return getRecentChangesForPanelUtil(state.records || [], getEventsSorted, toInt, limit);
  }
  const out = [];

  (state.records || []).forEach(function (rec) {
    getEventsSorted(rec).forEach(function (ev) {
      if (!ev || !ev.at) return;
      const ts = new Date(ev.at).getTime();
      if (!Number.isFinite(ts) || ts <= 0) return;

      out.push({
        at: ev.at,
        atTs: ts,
        actor_user: text(ev.actor_user) || "sistema",
        actor_role: text(ev.actor_role) || "-",
        type: text(ev.type) || "EVENTO",
        note: text(ev.note),
        id: text(rec.id) || "-",
        identificacao: text(rec.identificacao) || "-",
        from: ev.from,
        to: ev.to,
        field: ev.field
      });
    });
  });

  out.sort(function (a, b) {
    return b.atTs - a.atTs;
  });

  const max = Math.max(1, toInt(limit) || 10);
  return out.slice(0, max);
}

function describeEventForPanel(item) {
  const describeEventForPanelUtil = getImportReportUtil("describeEventForPanel");
  if (describeEventForPanelUtil) {
    return describeEventForPanelUtil(item, text);
  }
  if (!item) return "Alteracao registrada";

  if (item.type === "OFFICIAL_STATUS") {
    return "Status oficial legado: " + text(item.from || "-") + " -> " + text(item.to || "-");
  }
  if (item.type === "MARK_STATUS") {
    return "Marcacao de status: " + text(item.to || "-");
  }
  if (item.type === "EDIT_FIELD") {
    return "Edicao de campo: " + text(item.field || "-");
  }
  if (item.type === "NOTE") {
    return "Nota adicionada";
  }
  if (item.type === "IMPORT") {
    return "Importacao/atualizacao de registro";
  }

  return text(item.type || "Evento");
}

function showImportReport(report) {
  latestImportReport = report || null;
  renderImportDashboard();
}

function wireImportReportTabs(targetOrTab, maybeDefaultTab) {
  const target = targetOrTab && typeof targetOrTab.querySelectorAll === "function" ? targetOrTab : importReport;
  const defaultTab = target === targetOrTab ? maybeDefaultTab : targetOrTab;

  const wireImportReportTabsUtil = getImportReportUtil("wireImportReportTabs");
  if (wireImportReportTabsUtil) {
    wireImportReportTabsUtil(target, defaultTab);
    return;
  }
  if (!target) return;
  const tabButtons = Array.from(target.querySelectorAll("[data-import-tab]"));
  const tabPanels = Array.from(target.querySelectorAll("[data-import-panel]"));
  if (!tabButtons.length || !tabPanels.length) return;

  function activateTab(tabName) {
    tabButtons.forEach(function (btn) {
      const active = btn.getAttribute("data-import-tab") === tabName;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    tabPanels.forEach(function (panel) {
      const active = panel.getAttribute("data-import-panel") === tabName;
      panel.classList.toggle("active", active);
      if (active) {
        panel.classList.remove("entering");
        void panel.offsetWidth;
        panel.classList.add("entering");
      }
    });
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activateTab(btn.getAttribute("data-import-tab"));
    });
  });

  activateTab(defaultTab || tabButtons[0].getAttribute("data-import-tab"));
}

function buildPlanilha1Html(aoa) {
  const buildPlanilha1HtmlUtil = getImportReportUtil("buildPlanilha1Html");
  if (buildPlanilha1HtmlUtil) {
    return buildPlanilha1HtmlUtil(aoa, {
      escapeHtml: escapeHtml,
      normalizeLooseText: normalizeLooseText
    });
  }
  if (!Array.isArray(aoa) || aoa.length === 0) {
    return "<p class=\"muted small\">Sem dados para resumo por deputado.</p>";
  }

  let html = "<div class=\"table-wrap\"><table class=\"table\" style=\"min-width:420px\"><thead><tr><th>" + escapeHtml(String(aoa[0][0] || "Rotulos de Linha")) + "</th><th>" + escapeHtml(String(aoa[0][1] || "Contagem")) + "</th></tr></thead><tbody>";

  for (let i = 1; i < aoa.length; i += 1) {
    const row = aoa[i] || [];
    const label = row[0] == null ? "" : String(row[0]);
    const val = row[1] == null ? "" : String(row[1]);
    const isTotal = normalizeLooseText(label) === "total geral";
    html += "<tr" + (isTotal ? " style=\"font-weight:700\"" : "") + "><td>" + escapeHtml(label) + "</td><td>" + escapeHtml(val) + "</td></tr>";
  }

  html += "</tbody></table></div>";
  return html;
}

function hideImportReport() {
  latestImportReport = null;
  renderImportDashboard();
}

function quickHashString(input) {
  const quickHashStringUtil = getStatusUtil("quickHashString");
  if (quickHashStringUtil) {
    return quickHashStringUtil(input);
  }
  let hash = 2166136261;
  const str = String(input || "");
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function getCurrentFilterSnapshot() {
  if (exportUtils && typeof exportUtils.getCurrentFilterSnapshot === "function") {
    return exportUtils.getCurrentFilterSnapshot({
      statusFilter: statusFilter,
      yearFilter: yearFilter,
      searchInput: searchInput
    });
  }
  return {
    status: statusFilter ? statusFilter.value : "",
    ano: yearFilter ? yearFilter.value : "",
    busca: searchInput ? (searchInput.value || "").trim() : ""
  };
}

function countAuditEvents(records) {
  if (exportUtils && typeof exportUtils.countAuditEvents === "function") {
    return exportUtils.countAuditEvents(records);
  }
  return (records || []).reduce(function (acc, rec) {
    return acc + ((rec && Array.isArray(rec.eventos)) ? rec.eventos.length : 0);
  }, 0);
}

function exportScopeLabel(scope) {
  if (exportUtils && typeof exportUtils.exportScopeLabel === "function") {
    return exportUtils.exportScopeLabel(scope, EXPORT_SCOPE);
  }
  if (scope === EXPORT_SCOPE.HISTORICO) return "HISTORICO";
  if (scope === EXPORT_SCOPE.PERSONALIZADO) return "PERSONALIZADO";
  return "ATUAIS";
}

function buildExportFilename(scope) {
  if (exportUtils && typeof exportUtils.buildExportFilename === "function") {
    return exportUtils.buildExportFilename(scope, EXPORT_SCOPE, EXPORT_SCOPE_SUFFIX, dateStamp);
  }
  const suffix = EXPORT_SCOPE_SUFFIX[scope] || EXPORT_SCOPE_SUFFIX.ATUAIS;
  return "emendas_export_" + dateStamp() + "_" + suffix + ".xlsx";
}

function isCurrentRecord(rec) {
  if (exportUtils && typeof exportUtils.isCurrentRecord === "function") {
    return exportUtils.isCurrentRecord(rec);
  }
  return !(rec && Object.prototype.hasOwnProperty.call(rec, "is_current") && rec.is_current === false);
}

function getRecordCurrentStatus(rec) {
  return latestMarkedStatus(rec) || normalizeStatus(rec && rec.status_oficial ? rec.status_oficial : "") || "";
}

function matchesTextFilter(value, term) {
  if (exportUtils && typeof exportUtils.matchesTextFilter === "function") {
    return exportUtils.matchesTextFilter(value, term, normalizeLooseText);
  }
  const src = normalizeLooseText(value || "");
  const q = normalizeLooseText(term || "");
  if (!q) return true;
  return src.indexOf(q) >= 0;
}

function filterRecordsForExport(scope, customFilters) {
  const records = Array.isArray(state.records) ? state.records.slice() : [];

  if (scope === EXPORT_SCOPE.HISTORICO) {
    return records;
  }

  if (scope === EXPORT_SCOPE.PERSONALIZADO) {
    const filters = customFilters || {};
    const year = String(filters.ano || "").trim();
    const status = String(filters.status || "").trim();
    const deputado = String(filters.deputado || "").trim();
    const municipio = String(filters.municipio || "").trim();
    const includeOld = !!filters.include_old;

    return records.filter(function (rec) {
      if (!includeOld && !isCurrentRecord(rec)) return false;
      if (year && String(toInt(rec.ano) || "") !== year) return false;
      if (status && getRecordCurrentStatus(rec) !== normalizeStatus(status)) return false;
      if (!matchesTextFilter(rec.deputado, deputado)) return false;
      if (!matchesTextFilter(rec.municipio, municipio)) return false;
      return true;
    });
  }

  return records.filter(function (rec) {
    return isCurrentRecord(rec);
  });
}

function buildExportFiltersSnapshot(scope, customFilters) {
  if (exportUtils && typeof exportUtils.buildExportFiltersSnapshot === "function") {
    return exportUtils.buildExportFiltersSnapshot(scope, customFilters, function () {
      return getCurrentFilterSnapshot();
    }, function (currentScope) {
      return exportScopeLabel(currentScope);
    });
  }

  const base = getCurrentFilterSnapshot();
  base.escopo = exportScopeLabel(scope);
  if (scope === EXPORT_SCOPE.PERSONALIZADO) {
    base.personalizado = {
      ano: customFilters && customFilters.ano ? String(customFilters.ano) : "",
      status: customFilters && customFilters.status ? String(customFilters.status) : "",
      deputado: customFilters && customFilters.deputado ? String(customFilters.deputado) : "",
      municipio: customFilters && customFilters.municipio ? String(customFilters.municipio) : "",
      include_old: !!(customFilters && customFilters.include_old)
    };
  }
  return base;
}

function openExportCustomModal() {
  if (!exportCustomModal) return;
  syncCustomExportFilters();

  if (exportCustomYear && yearFilter && !exportCustomYear.value) {
    exportCustomYear.value = yearFilter.value || "";
  }

  if (exportCustomStatus && !exportCustomStatus.value) {
    exportCustomStatus.value = "";
  }

  if (exportCustomIncludeOld) exportCustomIncludeOld.checked = false;
  if (exportCustomDeputado) exportCustomDeputado.value = "";
  if (exportCustomMunicipio) exportCustomMunicipio.value = "";

  refreshCustomExportSummary();
  exportCustomModal.classList.add("show");
  exportCustomModal.setAttribute("aria-hidden", "false");
}

function closeExportCustomModal() {
  if (!exportCustomModal) return;
  exportCustomModal.classList.remove("show");
  exportCustomModal.setAttribute("aria-hidden", "true");
}

function refreshCustomExportSummary() {
  if (!exportCustomSummary) return;
  const filters = {
    ano: exportCustomYear ? exportCustomYear.value : "",
    status: exportCustomStatus ? exportCustomStatus.value : "",
    deputado: exportCustomDeputado ? (exportCustomDeputado.value || "").trim() : "",
    municipio: exportCustomMunicipio ? (exportCustomMunicipio.value || "").trim() : "",
    include_old: !!(exportCustomIncludeOld && exportCustomIncludeOld.checked)
  };

  const rows = filterRecordsForExport(EXPORT_SCOPE.PERSONALIZADO, filters);
  const totalBase = Array.isArray(state.records) ? state.records.length : 0;
  exportCustomSummary.textContent = "Registros selecionados: " + String(rows.length) + " de " + String(totalBase);
}

// Orquestra exportacao por escopo (atuais, historico ou personalizado).
async function runExportByScope(scope, options) {
  const opts = options || {};
  const exportScope = scope || EXPORT_SCOPE.ATUAIS;
  const customFilters = opts.customFilters || null;

  if (exportScope !== EXPORT_SCOPE.ATUAIS) {
    const ok = confirm("Confirmar exportacao no modo " + exportScopeLabel(exportScope) + "?");
    if (!ok) return false;
  }

  const selectedRecords = filterRecordsForExport(exportScope, customFilters);
  if (!selectedRecords.length) {
    alert("Nenhum registro encontrado para o modo de exportacao selecionado.");
    return false;
  }

  const templateReady = !!(lastImportedWorkbookTemplate && lastImportedWorkbookTemplate.buffer);
  const templateMode = templateReady
    ? confirm("Exportar em modo TEMPLATE (mesma estrutura do XLSX original, alterando apenas dados)?")
    : false;

  const modeOriginal = templateMode ? true : confirm("Exportar com headers originais? OK = Originais, Cancelar = Normalizados.");
  const roundTripCheck = confirm("Executar round-trip check apos exportar? (pode ser mais lento)");
  const filename = buildExportFilename(exportScope);
  const filtersSnapshot = buildExportFiltersSnapshot(exportScope, customFilters);

  const exportMeta = exportRecordsToXlsx(selectedRecords, filename, {
    useOriginalHeaders: modeOriginal,
    roundTripCheck: roundTripCheck,
    templateMode: templateMode,
    exportScope: exportScope,
    exportFilters: filtersSnapshot
  });
  if (!exportMeta) return false;

  latestExportReport = {
    escopo: exportScope,
    arquivoNome: filename,
    quantidadeRegistros: selectedRecords.length,
    filtros: filtersSnapshot,
    geradoEm: isoNow()
  };
  renderImportDashboard();

  await syncExportLogToApi({
    formato: "XLSX",
    arquivoNome: filename,
    quantidadeRegistros: selectedRecords.length,
    quantidadeEventos: countAuditEvents(selectedRecords),
    filtros: filtersSnapshot,
    modoHeaders: templateMode ? "template_original" : (modeOriginal ? "originais" : "normalizados"),
    escopoExportacao: exportScope,
    roundTripOk: exportMeta && exportMeta.roundTrip ? exportMeta.roundTrip.ok : null,
    roundTripIssues: exportMeta && exportMeta.roundTrip ? (exportMeta.roundTrip.issues || []) : []
  });

  return true;
}
// Registra lote de importacao no backend para rastreabilidade.
async function syncImportBatchToApi(file, report) {
  if (!isApiEnabled()) return null;
  const payload = {
    arquivo_nome: file && file.name ? file.name : (report.fileName || "importacao"),
    arquivo_hash: quickHashString((file && file.name ? file.name : "") + "|" + (file && file.size ? file.size : 0) + "|" + (file && file.lastModified ? file.lastModified : 0) + "|" + (report.totalRows || 0) + "|" + (report.created || 0) + "|" + (report.updated || 0)),
    linhas_lidas: report.totalRows || 0,
    linhas_validas: report.consideredRows || 0,
    linhas_ignoradas: report.skippedRows || 0,
    registros_criados: report.created || 0,
    registros_atualizados: report.updated || 0,
    sem_alteracao: report.unchanged || 0,
    duplicidade_id: report.duplicateById || 0,
    duplicidade_ref: report.duplicateByRef || 0,
    duplicidade_arquivo: report.duplicateInFile || 0,
    conflito_id_ref: report.conflictIdVsRef || 0,
    abas_lidas: report.sheetNames || [],
    observacao: "Importacao via interface web",
    origem_evento: "IMPORT"
  };

  try {
    const resp = await apiRequest("POST", "/imports/lotes", payload, "IMPORT");
    apiOnline = true;
    apiLastError = "";
    applyAccessProfile();
    return resp && resp.id != null ? Number(resp.id) : null;
  } catch (err) {
    handleApiSyncError(err, "lote de importacao");
    return null;
  }
}

// Envia linhas detalhadas da importacao em blocos para evitar payload gigante.
async function syncImportLinesToApi(loteId, rowDetails) {
  if (!isApiEnabled()) return;
  if (!loteId) return;
  const lines = Array.isArray(rowDetails) ? rowDetails : [];
  if (!lines.length) return;

  const chunkSize = 300;
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize).map(function (ln, idx) {
      return {
        ordem: ln && ln.ordem != null ? Number(ln.ordem) : (i + idx + 1),
        sheet_name: ln && ln.sheet_name ? String(ln.sheet_name) : "",
        row_number: ln && ln.row_number != null ? Number(ln.row_number) : 0,
        status_linha: (ln && ln.status_linha ? String(ln.status_linha) : "UNCHANGED").toUpperCase(),
        id_interno: ln && ln.id_interno ? String(ln.id_interno) : "",
        ref_key: ln && ln.ref_key ? String(ln.ref_key) : "",
        mensagem: ln && ln.mensagem ? String(ln.mensagem) : ""
      };
    });

    try {
      await apiRequest("POST", "/imports/linhas/bulk", {
        lote_id: Number(loteId),
        linhas: chunk
      }, "IMPORT");
      apiOnline = true;
      apiLastError = "";
    } catch (err) {
      handleApiSyncError(err, "linhas de importacao");
      return;
    }
  }

  applyAccessProfile();
}

// Grava log de exportacao no backend (auditoria operacional).
async function syncExportLogToApi(meta) {
  if (!isApiEnabled()) return;
  const payload = {
    formato: String(meta && meta.formato ? meta.formato : "XLSX").toUpperCase(),
    arquivo_nome: meta && meta.arquivoNome ? meta.arquivoNome : "exportacao",
    quantidade_registros: meta && Number.isFinite(Number(meta.quantidadeRegistros)) ? Number(meta.quantidadeRegistros) : 0,
    quantidade_eventos: meta && Number.isFinite(Number(meta.quantidadeEventos)) ? Number(meta.quantidadeEventos) : 0,
    filtros_json: JSON.stringify(meta && meta.filtros ? meta.filtros : {}),
    modo_headers: meta && meta.modoHeaders ? meta.modoHeaders : "normalizados",
    escopo_exportacao: meta && meta.escopoExportacao ? String(meta.escopoExportacao) : EXPORT_SCOPE.ATUAIS,
    round_trip_ok: meta && Object.prototype.hasOwnProperty.call(meta, "roundTripOk") ? meta.roundTripOk : null,
    round_trip_issues: meta && Array.isArray(meta.roundTripIssues) ? meta.roundTripIssues : [],
    origem_evento: "EXPORT"
  };

  try {
    await apiRequest("POST", "/exports/logs", payload, "EXPORT");
    apiOnline = true;
    apiLastError = "";
    applyAccessProfile();
  } catch (err) {
    handleApiSyncError(err, "log de exportacao");
  }
}

// Exportador padrao: gera abas de dados + auditoria + resumo.
function exportRecordsToXlsx(records, filename, options) {
  const xlsxApi = typeof window !== "undefined" ? window.XLSX : null;
  if (!xlsxApi) {
    alert("Biblioteca XLSX nao carregada.");
    return null;
  }

  const opts = options || {};
  if (opts.templateMode) {
    return exportRecordsToTemplateXlsx(records, filename, opts, xlsxApi);
  }

  const dataTable = buildExportTableData(records, opts);
  const dataAoa = [dataTable.headers].concat(dataTable.rows.map(function (rowObj) {
    return dataTable.headers.map(function (h) { return rowObj[h] == null ? "" : rowObj[h]; });
  }));

  const auditTable = buildAuditLogTableData(records);
  const summaryAoa = buildSummaryAoa(records, auditTable.rows.length, opts.exportScope || EXPORT_SCOPE.ATUAIS, opts.exportFilters || {});
  const auditAoa = [auditTable.headers].concat(auditTable.rows.map(function (rowObj) {
    return auditTable.headers.map(function (h) { return rowObj[h] == null ? "" : rowObj[h]; });
  }));
  const auditSheetAoa = summaryAoa.concat([[]]).concat(auditAoa);

  const wsData = xlsxApi.utils.aoa_to_sheet(dataAoa);
  const wsAudit = xlsxApi.utils.aoa_to_sheet(auditSheetAoa);
  const wsPlanilha1 = xlsxApi.utils.aoa_to_sheet(buildPlanilha1Aoa(records));
  const wb = xlsxApi.utils.book_new();
  xlsxApi.utils.book_append_sheet(wb, wsPlanilha1, "Planilha1");
  xlsxApi.utils.book_append_sheet(wb, wsData, "Controle de EPI");
  xlsxApi.utils.book_append_sheet(wb, wsAudit, "AuditLog");

  let roundTrip = null;
  if (opts.roundTripCheck) {
    const check = runRoundTripCheck(wb, dataTable.headers);
    roundTrip = check;
    if (!check.ok) {
      alert("Round-trip check encontrou divergencias\n" + check.issues.join("\n"));
    }
  }

  xlsxApi.writeFile(wb, filename || ("emendas_export_" + dateStamp() + ".xlsx"));
  return {
    totalRegistros: records.length,
    totalEventos: auditTable.rows.length,
    roundTrip: roundTrip
  };
}

// Exportador em modo template: preserva estrutura do XLSX original.
function exportRecordsToTemplateXlsx(records, filename, options, xlsxApi) {
  const opts = options || {};
  const template = lastImportedWorkbookTemplate;
  if (!template || !template.buffer) {
    alert("Modo template indisponivel: importe um arquivo XLSX original antes de exportar.");
    return null;
  }

  const wb = xlsxApi.read(template.buffer.slice(0), {
    type: "array",
    raw: false,
    cellFormula: true,
    cellNF: true,
    cellStyles: true,
    cellDates: false
  });

  const targetSheetNames = resolveTemplateTargetSheets(wb, records);
  const summary = { updatedCells: 0, updatedRecords: 0, skippedRecords: 0, missingColumns: [] };
  const updatedRecordIds = new Set();
  const roundTripAssertions = [];

  targetSheetNames.forEach(function (sheetName) {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    const matrix = xlsxApi.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, blankrows: false });
    const detected = detectHeaderRow(matrix);
    if (!detected) return;

    const columnByCanonical = buildCanonicalColumnMap(detected.headers);
    const missingCols = TEMPLATE_CANONICAL_KEYS.filter(function (key) { return columnByCanonical[key] == null; });
    if (missingCols.length) {
      summary.missingColumns.push(sheetName + ": " + missingCols.join(", "));
    }

    const headerRowNumber = detected.headerRowIndex + 1;
    records.forEach(function (rec) {
      if (!rec) return;
      if (String(rec.source_sheet || "") !== String(sheetName)) return;
      const rowNumber = Number(rec.source_row || 0);
      if (!Number.isFinite(rowNumber) || rowNumber <= headerRowNumber) {
        summary.skippedRecords += 1;
        return;
      }

      let changedAny = false;
      TEMPLATE_CANONICAL_KEYS.forEach(function (key) {
        const colIndex = columnByCanonical[key];
        if (colIndex == null) return;

        const nextValue = getRecordValueForTemplate(rec, key);
        const changed = setWorksheetCellValue(ws, rowNumber, colIndex, nextValue, key, xlsxApi);
        if (changed) {
          changedAny = true;
          summary.updatedCells += 1;
          roundTripAssertions.push({
            sheetName: sheetName,
            rowNumber: rowNumber,
            colIndex: colIndex,
            expected: nextValue
          });
        }
      });

      if (changedAny) {
        updatedRecordIds.add(rec.id || (sheetName + ":" + String(rowNumber)));
      }
    });
  });

  summary.updatedRecords = updatedRecordIds.size;

  let roundTrip = null;
  if (opts.roundTripCheck) {
    roundTrip = runTemplateRoundTripCheck(wb, roundTripAssertions);
    if (!roundTrip.ok) {
      alert("Round-trip check (template) encontrou divergencias\n" + roundTrip.issues.join("\n"));
    }
  }

  xlsxApi.writeFile(wb, filename || ("emendas_export_" + dateStamp() + ".xlsx"));

  const infoMsg = [
    "Template export concluido.",
    "Registros atualizados: " + String(summary.updatedRecords),
    "Celulas atualizadas: " + String(summary.updatedCells),
    "Registros sem origem de linha/aba: " + String(summary.skippedRecords)
  ];
  if (summary.missingColumns.length) {
    infoMsg.push("Colunas nao mapeadas no template: " + summary.missingColumns.join(" | "));
  }
  console.log(infoMsg.join(" "));

  return {
    totalRegistros: records.length,
    totalEventos: countAuditEvents(records),
    roundTrip: roundTrip,
    templateSummary: summary
  };
}

function resolveTemplateTargetSheets(workbook, records) {
  const preferred = "Controle de EPI";
  if (workbook.SheetNames.includes(preferred)) return [preferred];

  const used = new Set();
  (records || []).forEach(function (r) {
    const n = String((r && r.source_sheet) || "").trim();
    if (n) used.add(n);
  });

  const out = workbook.SheetNames.filter(function (name) { return used.has(name); });
  return out.length ? out : workbook.SheetNames.slice();
}

const TEMPLATE_CANONICAL_KEYS = (typeof exportTemplateUtils !== "undefined" && exportTemplateUtils && Array.isArray(exportTemplateUtils.templateCanonicalKeys))
  ? exportTemplateUtils.templateCanonicalKeys.slice(0)
  : [
    "identificacao",
    "cod_subfonte",
    "deputado",
    "cod_uo",
    "sigla_uo",
    "cod_orgao",
    "cod_acao",
    "descricao_acao",
    "plan_a",
    "plan_b",
    "municipio",
    "valor_inicial",
    "valor_atual",
    "processo_sei",
    "status_oficial"
  ];

function buildCanonicalColumnMap(headers) {
  if (typeof exportTemplateUtils !== "undefined" && exportTemplateUtils && typeof exportTemplateUtils.buildCanonicalColumnMap === "function") {
    return exportTemplateUtils.buildCanonicalColumnMap(headers, IMPORT_ALIASES, RAW_PREFERRED_HEADERS, normalizeHeader, TEMPLATE_CANONICAL_KEYS);
  }
  const map = {};
  TEMPLATE_CANONICAL_KEYS.forEach(function (key) {
    const idx = findHeaderIndexByAliases(headers, key);
    if (idx >= 0) map[key] = idx;
  });
  return map;
}

function findHeaderIndexByAliases(headers, canonicalKey) {
  if (typeof exportTemplateUtils !== "undefined" && exportTemplateUtils && typeof exportTemplateUtils.findHeaderIndexByAliases === "function") {
    return exportTemplateUtils.findHeaderIndexByAliases(headers, canonicalKey, IMPORT_ALIASES, RAW_PREFERRED_HEADERS, normalizeHeader);
  }
  const list = [];
  const aliases = IMPORT_ALIASES[canonicalKey] || [];
  aliases.forEach(function (a) { list.push(a); });
  if (RAW_PREFERRED_HEADERS[canonicalKey]) list.push(RAW_PREFERRED_HEADERS[canonicalKey]);

  const wanted = new Set(list.map(function (x) { return normalizeHeader(x); }));
  for (let i = 0; i < (headers || []).length; i += 1) {
    if (wanted.has(normalizeHeader(headers[i]))) return i;
  }
  return -1;
}

function getRecordValueForTemplate(rec, canonicalKey) {
  if (typeof exportTemplateUtils !== "undefined" && exportTemplateUtils && typeof exportTemplateUtils.getRecordValueForTemplate === "function") {
    return exportTemplateUtils.getRecordValueForTemplate(rec, canonicalKey, IMPORT_ALIASES, RAW_PREFERRED_HEADERS, normalizeHeader);
  }
  if (!rec) return "";
  if (canonicalKey === "status_oficial") return rec.status_oficial || "";

  const raw = rec.all_fields && typeof rec.all_fields === "object" ? rec.all_fields : null;
  if (raw) {
    const aliases = IMPORT_ALIASES[canonicalKey] || [];
    const wanted = new Set(aliases.map(function (a) { return normalizeHeader(a); }));
    const preferred = RAW_PREFERRED_HEADERS[canonicalKey];
    if (preferred) wanted.add(normalizeHeader(preferred));

    const keys = Object.keys(raw);
    for (let i = 0; i < keys.length; i += 1) {
      const k = keys[i];
      if (wanted.has(normalizeHeader(k))) {
        const v = raw[k];
        if (v != null && String(v).trim() !== "") return v;
      }
    }
  }

  return rec[canonicalKey] == null ? "" : rec[canonicalKey];
}

function setWorksheetCellValue(ws, rowNumber, colIndex, value, canonicalKey, xlsxApi) {
  if (typeof exportTemplateUtils !== "undefined" && exportTemplateUtils && typeof exportTemplateUtils.setWorksheetCellValue === "function") {
    return exportTemplateUtils.setWorksheetCellValue(ws, rowNumber, colIndex, value, canonicalKey, xlsxApi, toNumber, normalizeCompareValue);
  }
  const addr = xlsxApi.utils.encode_cell({ r: Math.max(0, Number(rowNumber) - 1), c: Math.max(0, Number(colIndex)) });
  const previousCell = ws[addr];
  const prevValue = previousCell && Object.prototype.hasOwnProperty.call(previousCell, "v") ? previousCell.v : "";

  const numericField = canonicalKey === "valor_inicial" || canonicalKey === "valor_atual";
  const normalizedNext = value == null ? "" : value;

  let nextCell;
  if (numericField && String(normalizedNext).trim() !== "" && Number.isFinite(toNumber(normalizedNext))) {
    nextCell = {
      t: "n",
      v: toNumber(normalizedNext)
    };
  } else {
    nextCell = {
      t: "s",
      v: String(normalizedNext)
    };
  }

  const changed = normalizeCompareValue(prevValue) !== normalizeCompareValue(nextCell.v);
  if (!changed) return false;

  if (previousCell && previousCell.z) nextCell.z = previousCell.z;
  if (previousCell && previousCell.s) nextCell.s = previousCell.s;
  ws[addr] = nextCell;
  return true;
}

function normalizeCompareValue(v) {
  if (typeof exportTemplateUtils !== "undefined" && exportTemplateUtils && typeof exportTemplateUtils.normalizeCompareValue === "function") {
    return exportTemplateUtils.normalizeCompareValue(v);
  }
  if (v == null) return "";
  if (typeof v === "number") return Number(v).toString();
  return String(v).trim();
}

function runTemplateRoundTripCheck(workbook, assertions) {
  if (typeof exportTemplateUtils !== "undefined" && exportTemplateUtils && typeof exportTemplateUtils.runTemplateRoundTripCheck === "function") {
    return exportTemplateUtils.runTemplateRoundTripCheck(workbook, assertions, normalizeCompareValue, typeof window !== "undefined" ? window.XLSX : null);
  }
  try {
    const xlsxApi = typeof window !== "undefined" ? window.XLSX : null;
    if (!xlsxApi) return { ok: true, issues: [] };

    const arr = xlsxApi.write(workbook, { type: "array", bookType: "xlsx" });
    const wb2 = xlsxApi.read(arr, { type: "array" });
    const issues = [];

    const checkLimit = Math.min((assertions || []).length, 800);
    for (let i = 0; i < checkLimit; i += 1) {
      const a = assertions[i];
      const ws = wb2.Sheets[a.sheetName];
      if (!ws) {
        issues.push("Aba ausente no round-trip: " + a.sheetName);
        continue;
      }

      const addr = xlsxApi.utils.encode_cell({ r: Math.max(0, Number(a.rowNumber) - 1), c: Math.max(0, Number(a.colIndex)) });
      const cell = ws[addr];
      const got = cell && Object.prototype.hasOwnProperty.call(cell, "v") ? cell.v : "";
      if (normalizeCompareValue(got) !== normalizeCompareValue(a.expected)) {
        issues.push("Divergencia em " + a.sheetName + "!" + addr + ": esperado=" + normalizeCompareValue(a.expected) + " recebido=" + normalizeCompareValue(got));
        if (issues.length >= 25) break;
      }
    }

    return { ok: issues.length === 0, issues: issues };
  } catch (err) {
    return { ok: false, issues: ["Falha no round-trip (template): " + (err && err.message ? err.message : "erro desconhecido")] };
  }
}

// Monta tabela principal de exportacao com headers escolhidos.
function buildExportTableData(records, options) {
  if (typeof exportDataUtils !== "undefined" && exportDataUtils && typeof exportDataUtils.buildExportTableData === "function") {
    return exportDataUtils.buildExportTableData(records, options, {
      getActiveUsersWithLastMark: getActiveUsersWithLastMark,
      calcProgress: calcProgress,
      getGlobalProgressState: getGlobalProgressState
    });
  }
  const opts = options || {};
  const useOriginal = !!opts.useOriginalHeaders;

  const extraHeaders = [];
  const extraSet = new Set();

  records.forEach(function (r) {
    const raw = r && r.all_fields && typeof r.all_fields === "object" ? r.all_fields : {};
    Object.keys(raw).forEach(function (k) {
      if (!extraSet.has(k)) {
        extraSet.add(k);
        extraHeaders.push(k);
      }
    });
  });

  const normalizedHeaders = ["id", "ano", "identificacao", "cod_subfonte", "deputado", "cod_uo", "sigla_uo", "cod_orgao", "cod_acao", "descricao_acao", "plan_a", "plan_b", "municipio", "valor_inicial", "valor_atual", "processo_sei"];
  const systemHeaders = ["id_interno_sistema", "backend_id", "parent_id", "version", "row_version", "is_current", "usuarios_ativos", "progresso", "global_state", "ref_key", "created_at", "updated_at", "source_sheet", "source_row"];
  const headers = (useOriginal ? extraHeaders : normalizedHeaders).concat(systemHeaders);

  const rows = records.map(function (r) {
    const out = {};
    const raw = r && r.all_fields && typeof r.all_fields === "object" ? r.all_fields : {};
    const users = getActiveUsersWithLastMark(r);
    const progress = calcProgress(users);
    const global = getGlobalProgressState(users);

    if (useOriginal) {
      extraHeaders.forEach(function (h) {
        out[h] = raw[h] == null ? "" : raw[h];
      });
    } else {
      normalizedHeaders.forEach(function (h) {
        out[h] = r[h] == null ? "" : r[h];
      });
    }

    out.id_interno_sistema = r.id || "";
    out.backend_id = r.backend_id == null ? "" : r.backend_id;
    out.parent_id = r.parent_id == null ? "" : r.parent_id;
    out.version = r.version == null ? 1 : r.version;
    out.row_version = r.row_version == null ? 1 : r.row_version;
    out.is_current = r.is_current !== false;
    out.usuarios_ativos = users.map(function (u) { return u.name + " (" + (u.role || "-") + ")"; }).join(" | ");
    out.progresso = String(progress.concl) + "/" + String(progress.total) + " (" + String(progress.percent) + "%)";
    out.global_state = global.label;
    out.ref_key = r.ref_key || "";
    out.created_at = r.created_at || "";
    out.updated_at = r.updated_at || "";
    out.source_sheet = r.source_sheet || "";
    out.source_row = r.source_row == null ? "" : r.source_row;
    return out;
  });

  return { headers: headers, rows: rows };
}

// Monta tabela de auditoria para aba AuditLog do XLSX exportado.
function buildAuditLogTableData(records) {
  if (typeof exportDataUtils !== "undefined" && exportDataUtils && typeof exportDataUtils.buildAuditLogTableData === "function") {
    return exportDataUtils.buildAuditLogTableData(records, {
      getEventsSorted: getEventsSorted,
      getActiveUsersWithLastMark: getActiveUsersWithLastMark,
      calcProgress: calcProgress,
      getGlobalProgressState: getGlobalProgressState
    });
  }

  const headers = [
    "id_interno_sistema",
    "identificacao",
    "municipio",
    "deputado",
    "usuarios_ativos",
    "progresso",
    "global_state",
    "data_hora_evento",
    "tipo_evento",
    "usuario",
    "setor",
    "campo",
    "valor_antigo",
    "valor_novo",
    "motivo",
    "source_sheet",
    "source_row"
  ];

  const rows = [];
  records.forEach(function (r) {
    const orderedEvents = getEventsSorted(r);
    const users = getActiveUsersWithLastMark(r);
    const progress = calcProgress(users);
    const global = getGlobalProgressState(users);
    const usersList = users.map(function (u) { return u.name; }).join(" | ");

    orderedEvents.forEach(function (ev) {
      rows.push({
        id_interno_sistema: r.id || "",
        identificacao: r.identificacao || "",
        municipio: r.municipio || "",
        deputado: r.deputado || "",
        usuarios_ativos: usersList,
        progresso: String(progress.concl) + "/" + String(progress.total) + " (" + String(progress.percent) + "%)",
        global_state: global.label,
        data_hora_evento: ev.at || "",
        tipo_evento: ev.type || "",
        usuario: ev.actor_user || "",
        setor: ev.actor_role || "",
        campo: ev.field || "",
        valor_antigo: ev.from == null ? "" : ev.from,
        valor_novo: ev.to == null ? "" : ev.to,
        motivo: ev.note || "",
        source_sheet: r.source_sheet || "",
        source_row: r.source_row == null ? "" : r.source_row
      });
    });
  });

  rows.sort(function (a, b) {
    const ta = new Date(a.data_hora_evento).getTime() || 0;
    const tb = new Date(b.data_hora_evento).getTime() || 0;
    return tb - ta;
  });

  return { headers: headers, rows: rows };
}

function buildSummaryAoa(records, totalEvents, exportScope, exportFilters) {
  if (typeof exportDataUtils !== "undefined" && exportDataUtils && typeof exportDataUtils.buildSummaryAoa === "function") {
    return exportDataUtils.buildSummaryAoa(records, totalEvents, exportScope, exportFilters, {
      exportScopeLabel: exportScopeLabel,
      getGlobalProgressState: getGlobalProgressState,
      getActiveUsersWithLastMark: getActiveUsersWithLastMark
    });
  }
  const now = new Date().toISOString();
  const byGlobal = { done: 0, in_progress: 0, attention: 0, no_marks: 0 };
  const scope = exportScopeLabel(exportScope || EXPORT_SCOPE.ATUAIS);
  const filtersJson = JSON.stringify(exportFilters || {});

  records.forEach(function (r) {
    const global = getGlobalProgressState(getActiveUsersWithLastMark(r));
    byGlobal[global.code] = (byGlobal[global.code] || 0) + 1;
  });

  const out = [
    ["Resumo da exportacao"],
    ["MODO: " + scope],
    ["Gerado em", now],
    ["Total de emendas", records.length],
    ["Total de eventos (audit log)", totalEvents],
    ["Filtros", filtersJson],
    [],
    ["Andamento Global", "Quantidade"],
    ["Concluido global", byGlobal.done || 0],
    ["Em andamento", byGlobal.in_progress || 0],
    ["Atencao", byGlobal.attention || 0],
    ["Sem marcacoes", byGlobal.no_marks || 0]
  ];

  return out;
}

function runRoundTripCheck(workbook, headers) {
  if (typeof exportTemplateUtils !== "undefined" && exportTemplateUtils && typeof exportTemplateUtils.runRoundTripCheck === "function") {
    return exportTemplateUtils.runRoundTripCheck(workbook, headers, typeof window !== "undefined" ? window.XLSX : null);
  }
  try {
    const xlsxApi = typeof window !== "undefined" ? window.XLSX : null;
    if (!xlsxApi) return { ok: true, issues: [] };

    const arr = xlsxApi.write(workbook, { type: "array", bookType: "xlsx" });
    const wb2 = xlsxApi.read(arr, { type: "array" });
    const ws = wb2.Sheets["Controle de EPI"];
    const aoa = xlsxApi.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, blankrows: false });
    const issues = [];

    if (!aoa.length) return { ok: false, issues: ["Planilha de retorno vazia."] };

    const head2 = aoa[0] || [];
    if (head2.length !== headers.length) {
      issues.push("Quantidade de colunas mudou no round-trip.");
    }

    const rowCount = Math.max(0, aoa.length - 1);
    if (rowCount <= 0) issues.push("Nenhuma linha de dados apos round-trip.");

    const wanted = ["id_interno_sistema", "identificacao", "municipio", "deputado", "processo_sei", "valor_atual"];
    const idx = {};
    wanted.forEach(function (k) { idx[k] = head2.indexOf(k); });
    const missingCols = wanted.filter(function (k) { return idx[k] < 0; });
    if (missingCols.length) {
      issues.push("Campos-chave ausentes no round-trip: " + missingCols.join(", "));
    }

    if (!missingCols.length && rowCount > 0) {
      const limit = Math.min(rowCount, 20);
      for (let i = 1; i <= limit; i += 1) {
        const row = aoa[i] || [];
        if (!String(row[idx.id_interno_sistema] || "").trim()) {
          issues.push("Linha " + String(i + 1) + " sem id_interno_sistema apos round-trip.");
          break;
        }
      }
    }

    return { ok: issues.length === 0, issues: issues };
  } catch (err) {
    return { ok: false, issues: ["Falha no round-trip: " + (err && err.message ? err.message : "erro desconhecido")] };
  }
}

function buildPlanilha1Aoa(records) {
  if (typeof exportTemplateUtils !== "undefined" && exportTemplateUtils && typeof exportTemplateUtils.buildPlanilha1Aoa === "function") {
    return exportTemplateUtils.buildPlanilha1Aoa(records, inferDemoSeed);
  }
  const safeRecords = (records || []).filter(function (r) {
    return !inferDemoSeed(r);
  });

  const byDeputado = {};
  safeRecords.forEach(function (r) {
    const nome = (r.deputado || "").trim() || "(Sem deputado)";
    byDeputado[nome] = (byDeputado[nome] || 0) + 1;
  });

  const ordered = Object.keys(byDeputado).sort(function (a, b) {
    return a.localeCompare(b, "pt-BR");
  });

  const out = [
    ["Rotulos de Linha", "Contagem de Deputado"],
    ["Indicar escola", safeRecords.length]
  ];

  ordered.forEach(function (nome) {
    out.push([nome, byDeputado[nome]]);
  });

  out.push(["Total Geral", safeRecords.length]);
  return out;
}

function fmtMoney(n) {
  const fmtMoneyUtil = getFormatUtil("fmtMoney");
  if (fmtMoneyUtil) {
    return fmtMoneyUtil(n);
  }
  const x = toNumber(n);
  return x.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateTime(iso) {
  const fmtDateTimeUtil = getFormatUtil("fmtDateTime");
  if (fmtDateTimeUtil) {
    return fmtDateTimeUtil(iso);
  }
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR");
  } catch (_err) {
    return String(iso || "");
  }
}

function isoNow() {
  const isoNowUtil = getFormatUtil("isoNow");
  if (isoNowUtil) {
    return isoNowUtil();
  }
  return new Date().toISOString();
}

function dateStamp() {
  const dateStampUtil = getFormatUtil("dateStamp");
  if (dateStampUtil) {
    return dateStampUtil();
  }
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return yyyy + mm + dd + "_" + hh + mi;
}

function currentYear() {
  const currentYearUtil = getFormatUtil("currentYear");
  if (currentYearUtil) {
    return currentYearUtil();
  }
  return new Date().getFullYear();
}

function toInt(v) {
  const toIntUtil = getFormatUtil("toInt");
  if (toIntUtil) {
    return toIntUtil(v);
  }
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

function toNumber(v) {
  const toNumberUtil = getFormatUtil("toNumber");
  if (toNumberUtil) {
    return toNumberUtil(v);
  }
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v == null ? "" : v).trim().replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(/,/g, ".").replace(/[^\d.-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function toNumberOrNull(v) {
  const toNumberOrNullUtil = getFormatUtil("toNumberOrNull");
  if (toNumberOrNullUtil) {
    return toNumberOrNullUtil(v);
  }
  if (v == null) return null;
  const txt = String(v).trim();
  if (txt === "") return null;
  const n = toNumber(txt);
  if (!Number.isFinite(n)) return null;
  return n;
}

function asText(v) {
  const asTextUtil = getFormatUtil("asText");
  if (asTextUtil) {
    return asTextUtil(v);
  }
  if (v == null) return "";
  return String(v).trim();
}

function text(v) {
  const textUtil = getFormatUtil("text");
  if (textUtil) {
    return textUtil(v);
  }
  return asText(v);
}

function clearNodeChildren(node) {
  if (!node) return;
  if (domUtils && typeof domUtils.clearChildren === "function") {
    domUtils.clearChildren(node);
    return;
  }
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function appendRenderedMarkup(container, rendered) {
  if (!container) return;
  if (domUtils && typeof domUtils.appendRenderedMarkup === "function") {
    domUtils.appendRenderedMarkup(container, rendered);
    return;
  }

  if (!rendered && rendered !== 0) return;

  if (typeof Node !== "undefined" && rendered instanceof Node) {
    container.appendChild(rendered);
    return;
  }

  if (typeof DocumentFragment !== "undefined" && rendered instanceof DocumentFragment) {
    container.appendChild(rendered);
    return;
  }

  const html = String(rendered);
  if (!html) return;

  if (typeof document.createRange === "function") {
    const fragment = document.createRange().createContextualFragment(html);
    container.appendChild(fragment);
    return;
  }

  if (typeof DOMParser === "function") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString("<body>" + html + "</body>", "text/html");
      const body = doc && doc.body;
      if (body && body.childNodes) {
        while (body.firstChild) container.appendChild(body.firstChild);
        return;
      }
    } catch (_err) {}
  }

  container.appendChild(document.createTextNode(html));
}

function escapeHtml(str) {
  if (escapeUtils && typeof escapeUtils.escapeHtml === "function") {
    return escapeUtils.escapeHtml(str);
  }
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&#039;");
}

function debounce(fn, ms) {
  const debounceUtil = getNormalizeUtil("debounce");
  if (debounceUtil) {
    return debounceUtil(fn, ms);
  }
  let t = null;
  return function () {
    const args = arguments;
    clearTimeout(t);
    t = setTimeout(function () {
      fn.apply(null, args);
    }, ms);
  };
}

function deepClone(obj) {
  const deepCloneUtil = getNormalizeUtil("deepClone");
  if (deepCloneUtil) {
    return deepCloneUtil(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

function configureFrontendModules() {
  if (!apiClient || typeof apiClient.configure !== "function") return;
  apiClient.configure({
    runtimeConfig: RUNTIME_CONFIG,
    keys: {
      apiBaseUrl: API_BASE_URL_KEY,
      apiEnabled: API_ENABLED_KEY,
      apiSharedKeySession: API_SHARED_KEY_SESSION_KEY
    },
    defaultApiBaseUrl: DEFAULT_API_BASE_URL,
    defaultEventOrigin: API_DEFAULT_EVENT_ORIGIN,
    getCurrentUser: function () {
      return CURRENT_USER;
    },
    getCurrentRole: function () {
      return CURRENT_ROLE;
    },
    readStoredSessionToken: function () {
      return readStoredSessionToken();
    },
    getSharedApiKey: function () {
      if (storageUtils && typeof storageUtils.readStorageValue === "function") {
        return storageUtils.readStorageValue(sessionStorage, API_SHARED_KEY_SESSION_KEY);
      }
      return readStorageValue(sessionStorage, API_SHARED_KEY_SESSION_KEY);
    },
    onNetworkError: function (message) {
      apiOnline = false;
      apiLastError = String(message || "sem conexao com API");
      applyAccessProfile();
    },
    onHttpError: function (statusCode, detailMessage) {
      const transportError = !statusCode || statusCode >= 500;
      apiOnline = !transportError;
      apiLastError = "HTTP " + statusCode + " " + String(detailMessage || "");
      applyAccessProfile();
    },
    onAuthFailure: function () {
      clearStoredSessionToken();
      closeApiSocket();
      showAuthGate("Sessao expirada. Faca login novamente.");
    }
  });

  if (!concurrencyService || typeof concurrencyService.configure !== "function") return;
  concurrencyService.configure({
    isApiEnabled: function () {
      return isApiEnabled();
    },
    canMutateRecords: function () {
      return canMutateRecords();
    },
    ensureBackendEmenda: function (rec, options) {
      return ensureBackendEmenda(rec, options);
    },
    apiRequest: function (method, path, body, eventOrigin, requestOptions) {
      return apiRequest(method, path, body, eventOrigin, requestOptions);
    },
    getSelected: function () {
      return getSelected();
    },
    getBackendIdForRecord: function (rec) {
      return getBackendIdForRecord(rec);
    },
    getApiBaseUrl: function () {
      return getApiBaseUrl();
    },
    getSessionToken: function () {
      return readStoredSessionToken();
    },
    isApiSocketEnabled: function () {
      return API_WS_ENABLED;
    },
    getCurrentUser: function () {
      return CURRENT_USER;
    },
    getCurrentRole: function () {
      return CURRENT_ROLE;
    },
    emendaLockPollMs: EMENDA_LOCK_POLL_MS,
    apiWsPath: API_WS_PATH,
    wsReconnectBaseMs: WS_RECONNECT_BASE_MS,
    wsReconnectMaxMs: WS_RECONNECT_MAX_MS,
    wsRefreshDebounceMs: WS_REFRESH_DEBOUNCE_MS,
    text: function (value) {
      return text(value);
    },
    fmtDateTime: function (value) {
      return fmtDateTime(value);
    },
    extractApiError: function (err, fallback) {
      return extractApiError(err, fallback);
    },
    onPresenceUpdated: function () {
      const rec = getSelected();
      if (rec) renderLivePresence(rec);
    },
    onQueueApiRefresh: async function () {
      await bootstrapApiIntegration();
    },
    onLockStateChanged: function (payload) {
      emendaLockState = payload && payload.state && typeof payload.state === "object" ? payload.state : null;
      emendaLockReadOnly = !!(payload && payload.readOnly);
      renderEmendaLockInfo(getSelected());
      applyModalAccessProfile();
      updateModalDraftUi();
    }
  });
}
