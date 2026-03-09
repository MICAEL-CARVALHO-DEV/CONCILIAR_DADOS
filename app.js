/***********************
 * SEC Emendas - v3
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
const SEC_FRONTEND = (function () {
  if (typeof window === "undefined") return {};
  const registry = (window.SECFrontend && typeof window.SECFrontend === "object")
    ? window.SECFrontend
    : ((window.SEC_FRONTEND && typeof window.SEC_FRONTEND === "object") ? window.SEC_FRONTEND : {});
  window.SECFrontend = registry;
  window.SEC_FRONTEND = registry;
  return registry;
})();
const storageUtils = SEC_FRONTEND.storageUtils || null;
const domUtils = SEC_FRONTEND.domUtils || null;
const escapeUtils = SEC_FRONTEND.escapeUtils || null;
const formatUtils = SEC_FRONTEND.formatUtils || null;
const normalizeUtils = SEC_FRONTEND.normalizeUtils || null;
const localStateUtils = SEC_FRONTEND.localStateUtils || null;
const importNormalizationUtils = SEC_FRONTEND.importNormalizationUtils || null;
const importValidationUtils = SEC_FRONTEND.importValidationUtils || null;
const importPipelineUtils = SEC_FRONTEND.importPipelineUtils || null;
const importProcessorUtils = SEC_FRONTEND.importProcessorUtils || null;
const importReaderUtils = SEC_FRONTEND.importReaderUtils || null;
const idUtils = SEC_FRONTEND.idUtils || null;
const statusUtils = SEC_FRONTEND.statusUtils || null;
const progressUtils = SEC_FRONTEND.progressUtils || null;
const filterUtils = SEC_FRONTEND.filterUtils || null;
const accessProfileUtils = SEC_FRONTEND.accessProfileUtils || null;
const exportUtils = SEC_FRONTEND.exportUtils || null;
const exportFlowUtils = SEC_FRONTEND.exportFlowUtils || null;
const exportWorkbookWriterUtils = SEC_FRONTEND.exportWorkbookWriterUtils || null;
const exportTemplateUtils = SEC_FRONTEND.exportTemplateUtils || null;
const exportTemplateWriterUtils = SEC_FRONTEND.exportTemplateWriterUtils || null;
const exportDataUtils = SEC_FRONTEND.exportDataUtils || null;
const exportExecutiveUtils = SEC_FRONTEND.exportExecutiveUtils || null;
const recordModelUtils = SEC_FRONTEND.recordModelUtils || null;
const auxModalsUtils = SEC_FRONTEND.auxModalsUtils || null;
const importReportUtils = SEC_FRONTEND.importReportUtils || null;
const modalSectionsUtils = SEC_FRONTEND.modalSectionsUtils || null;
const modalDraftStateUtils = SEC_FRONTEND.modalDraftStateUtils || null;
const modalSaveUtils = SEC_FRONTEND.modalSaveUtils || null;
const modalShellUtils = SEC_FRONTEND.modalShellUtils || null;
const importControlsUtils = SEC_FRONTEND.importControlsUtils || null;
const appBindingsUtils = SEC_FRONTEND.appBindingsUtils || null;
const appLifecycleUtils = SEC_FRONTEND.appLifecycleUtils || null;
const appStartupUtils = SEC_FRONTEND.appStartupUtils || null;
const uiShellActions = SEC_FRONTEND.uiShellActions || null;
const pendingUsersUtils = SEC_FRONTEND.pendingUsersUtils || null;
const betaHistoryUtils = SEC_FRONTEND.betaHistoryUtils || null;
const powerBiDataUtils = SEC_FRONTEND.powerBiDataUtils || null;
const betaPowerBiUtils = SEC_FRONTEND.betaPowerBiUtils || null;
const betaSupportUtils = SEC_FRONTEND.betaSupportUtils || null;
const betaDataUtils = SEC_FRONTEND.betaDataUtils || null;
const betaSyncUtils = SEC_FRONTEND.betaSyncUtils || null;
const betaWorkspaceUtils = SEC_FRONTEND.betaWorkspaceUtils || null;
const authStore = SEC_FRONTEND.authStore || null;
const authSessionUtils = SEC_FRONTEND.authSessionUtils || null;
const authUiUtils = SEC_FRONTEND.authUiUtils || null;
const authFlowUtils = SEC_FRONTEND.authFlowUtils || null;
const roleAccessUtils = SEC_FRONTEND.roleAccessUtils || null;
const authGuard = SEC_FRONTEND.authGuard || null;
const apiClient = SEC_FRONTEND.apiClient || null;
const apiStateSyncUtils = SEC_FRONTEND.apiStateSyncUtils || null;
const apiSyncOpsUtils = SEC_FRONTEND.apiSyncOpsUtils || null;
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
const BETA_AUDIT_LIMIT = 150;
const BETA_AUDIT_POLL_MS = 15000;
const BETA_SUPPORT_LIMIT = 80;
const BETA_SUPPORT_POLL_MS = 10000;
const API_STATE_POLL_MS = 5000;
const API_DEFAULT_EVENT_ORIGIN = "UI";
const REALTIME_USER_PANEL_ENABLED = false;
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
const LOCKED_STRUCTURAL_FIELD_KEYS = new Set(["identificacao", "deputado", "cod_acao", "descricao_acao"]);

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
  { key: "identificacao", label: "Identificacao", editable: false },
  { key: "cod_subfonte", label: "Cod Subfonte", editable: true },
  { key: "cod_acao", label: "Cod Acao", editable: false },
  { key: "descricao_acao", label: "Descricao Acao", editable: false },
  { key: "plan_a", label: "Plano A", editable: true },
  { key: "plan_b", label: "Plano B", editable: true },
  { key: "municipio", label: "Municipio", editable: true },
  { key: "deputado", label: "Deputado", editable: false },
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
let modalAutosaveTimer = null;
let modalDraftSavePromise = null;
let betaWorkspaceTab = "history";
let betaWorkspaceTabTouched = false;
const MODAL_AUTOSAVE_DEBOUNCE_MS = 2000;
const MODAL_DRAFT_STORAGE_PREFIX = "SEC_MODAL_DRAFT_V1";
const SUPPORT_CATEGORIES = ["OPERACAO", "IMPORTACAO", "EXPORTACAO", "DASHBOARD", "ACESSO", "ESTRUTURAL", "OUTRO"];
const SUPPORT_THREAD_STATUS = ["ABERTO", "EM_ANALISE", "RESPONDIDO", "FECHADO"];
const SUPPORT_MANAGER_ROLES = ["SUPERVISAO", "POWERBI", "PROGRAMADOR"];

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
let betaAuditRows = [];
let betaAuditLoading = false;
let betaAuditError = "";
let betaAuditLastSyncAt = "";
let betaAuditPollTimer = null;
let betaSupportThreads = [];
let betaSupportLoading = false;
let betaSupportError = "";
let betaSupportLastSyncAt = "";
let betaSupportSelectedThreadId = 0;
let betaSupportMessages = [];
let betaSupportMessagesLoading = false;
let betaSupportMessagesError = "";
let betaSupportPollTimer = null;
let apiStatePollTimer = null;
const BETA_AUDIT_FILTER_DEFAULTS = Object.freeze({
  ano: "",
  mes: "",
  usuario: "",
  setor: "",
  tipo_evento: "",
  origem_evento: "",
  q: ""
});
let betaAuditFilters = Object.assign({}, BETA_AUDIT_FILTER_DEFAULTS);
const BETA_SUPPORT_FILTER_DEFAULTS = Object.freeze({
  status: "",
  categoria: "",
  usuario: "",
  q: "",
  scope: ""
});
let betaSupportFilters = Object.assign({}, BETA_SUPPORT_FILTER_DEFAULTS);
const BETA_POWERBI_FILTER_DEFAULTS = Object.freeze({
  deputado: "",
  municipio: "",
  status: "",
  q: ""
});
let betaPowerBiFilters = Object.assign({}, BETA_POWERBI_FILTER_DEFAULTS);
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
const userRealtimeCard = document.getElementById("userRealtimeCard");

const markStatus = document.getElementById("markStatus");
const markReason = document.getElementById("markReason");
const btnMarkStatus = document.getElementById("btnMarkStatus");

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
const betaWorkspace = document.getElementById("betaWorkspace");
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

function getFilterUtil(methodName) {
  if (!filterUtils) return null;
  const method = filterUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getAccessProfileUtil(methodName) {
  if (!accessProfileUtils) return null;
  const method = accessProfileUtils[methodName];
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

function getLocalStateUtil(methodName) {
  if (!localStateUtils) return null;
  const method = localStateUtils[methodName];
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

function getImportValidationUtil(methodName) {
  if (!importValidationUtils) return null;
  const method = importValidationUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getImportPipelineUtil(methodName) {
  if (!importPipelineUtils) return null;
  const method = importPipelineUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getImportProcessorUtil(methodName) {
  if (!importProcessorUtils) return null;
  const method = importProcessorUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getImportReaderUtil(methodName) {
  if (!importReaderUtils) return null;
  const method = importReaderUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getExportUtil(methodName) {
  if (!exportUtils) return null;
  const method = exportUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getExportFlowUtil(methodName) {
  if (!exportFlowUtils) return null;
  const method = exportFlowUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getExportWorkbookWriterUtil(methodName) {
  if (!exportWorkbookWriterUtils) return null;
  const method = exportWorkbookWriterUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getExportTemplateUtil(methodName) {
  if (!exportTemplateUtils) return null;
  const method = exportTemplateUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getExportTemplateWriterUtil(methodName) {
  if (!exportTemplateWriterUtils) return null;
  const method = exportTemplateWriterUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getExportTemplateValue(key) {
  if (!exportTemplateUtils) return null;
  return exportTemplateUtils[key];
}

function getTemplateCanonicalKeys() {
  const keys = getExportTemplateValue("templateCanonicalKeys");
  if (Array.isArray(keys) && keys.length) return keys.slice(0);
  return [
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
}

function getExportDataUtil(methodName) {
  if (!exportDataUtils) return null;
  const method = exportDataUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getStorageUtil(methodName) {
  if (!storageUtils) return null;
  const method = storageUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getAuthStoreUtil(methodName) {
  if (!authStore) return null;
  const method = authStore[methodName];
  return typeof method === "function" ? method : null;
}

function getAuthSessionUtil(methodName) {
  if (!authSessionUtils) return null;
  const method = authSessionUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getAuthGuardUtil(methodName) {
  if (!authGuard) return null;
  const method = authGuard[methodName];
  return typeof method === "function" ? method : null;
}

function getAuthFlowUtil(methodName) {
  if (!authFlowUtils) return null;
  const method = authFlowUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getRoleAccessUtil(methodName) {
  if (!roleAccessUtils) return null;
  const method = roleAccessUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getApiClientUtil(methodName) {
  if (!apiClient) return null;
  const method = apiClient[methodName];
  return typeof method === "function" ? method : null;
}

function getApiStateSyncUtil(methodName) {
  if (!apiStateSyncUtils) return null;
  const method = apiStateSyncUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getApiSyncOpsUtil(methodName) {
  if (!apiSyncOpsUtils) return null;
  const method = apiSyncOpsUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getConcurrencyUtil(methodName) {
  if (!concurrencyService) return null;
  const method = concurrencyService[methodName];
  return typeof method === "function" ? method : null;
}

function getDomUtil(methodName) {
  if (!domUtils) return null;
  const method = domUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getEscapeUtil(methodName) {
  if (!escapeUtils) return null;
  const method = escapeUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getBetaSupportUtil(methodName) {
  if (!betaSupportUtils) return null;
  const method = betaSupportUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getBetaDataUtil(methodName) {
  if (!betaDataUtils) return null;
  const method = betaDataUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getBetaHistoryUtil(methodName) {
  if (!betaHistoryUtils) return null;
  const method = betaHistoryUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getPowerBiDataUtil(methodName) {
  if (!powerBiDataUtils) return null;
  const method = powerBiDataUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getBetaPowerBiUtil(methodName) {
  if (!betaPowerBiUtils) return null;
  const method = betaPowerBiUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getBetaWorkspaceUtil(methodName) {
  if (!betaWorkspaceUtils) return null;
  const method = betaWorkspaceUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getBetaSyncUtil(methodName) {
  if (!betaSyncUtils) return null;
  const method = betaSyncUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getExportExecutiveUtil(methodName) {
  if (!exportExecutiveUtils) return null;
  const method = exportExecutiveUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getRecordModelUtil(methodName) {
  if (!recordModelUtils) return null;
  const method = recordModelUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getAuxModalUtil(methodName) {
  if (!auxModalsUtils) return null;
  const method = auxModalsUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getModalSectionsUtil(methodName) {
  if (!modalSectionsUtils) return null;
  const method = modalSectionsUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getModalDraftStateUtil(methodName) {
  if (!modalDraftStateUtils) return null;
  const method = modalDraftStateUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getModalSaveUtil(methodName) {
  if (!modalSaveUtils) return null;
  const method = modalSaveUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getModalShellUtil(methodName) {
  if (!modalShellUtils) return null;
  const method = modalShellUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getImportControlsUtil(methodName) {
  if (!importControlsUtils) return null;
  const method = importControlsUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getAuthUiUtil(methodName) {
  if (!authUiUtils) return null;
  const method = authUiUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getAppBindingsUtil(methodName) {
  if (!appBindingsUtils) return null;
  const method = appBindingsUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getAppLifecycleUtil(methodName) {
  if (!appLifecycleUtils) return null;
  const method = appLifecycleUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getUiShellActionsUtil(methodName) {
  if (!uiShellActions) return null;
  const method = uiShellActions[methodName];
  return typeof method === "function" ? method : null;
}

function getAppStartupUtil(methodName) {
  if (!appStartupUtils) return null;
  const method = appStartupUtils[methodName];
  return typeof method === "function" ? method : null;
}

function getPendingUsersUtil(methodName) {
  if (!pendingUsersUtils) return null;
  const method = pendingUsersUtils[methodName];
  return typeof method === "function" ? method : null;
}

// Inicializa os filtros da UI principal e prepara os selects dependentes.
function initSelects() {
  const filterCtx = getFilterContext();
  const initSelectsUtil = getFilterUtil("initSelects");
  if (initSelectsUtil) {
    initSelectsUtil(filterCtx);
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
  const filterCtx = getFilterContext();
  const syncYearFilterUtil = getFilterUtil("syncYearFilter");
  if (syncYearFilterUtil) {
    syncYearFilterUtil(Object.assign({}, filterCtx, {
      select: yearFilter,
      current: yearFilter.value
    }));
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
  const filterCtx = getFilterContext();
  const syncCustomExportFiltersUtil = getFilterUtil("syncCustomExportFilters");
  if (syncCustomExportFiltersUtil) {
    syncCustomExportFiltersUtil(filterCtx);
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
  const uiCtx = getUiRenderContext();
  while (tbody && tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  const renderMainRowUtil = getUiRenderUtil("renderMainRow");
  const useRenderer = !!renderMainRowUtil;
  const renderMainRows = function (r) {
    if (useRenderer) {
      renderMainRowUtil(tbody, r, uiCtx);
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
  renderBetaWorkspace(rows);
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

function isUnsafeReloadShortcut(e) {
  if (!e) return false;
  var key = String(e.key || "").toLowerCase();
  if (key === "f5") return true;
  var accel = !!(e.ctrlKey || e.metaKey);
  return accel && key === "r";
}

function getUiShellActionsContext() {
  return {
    getSelected: getSelected,
    lastImportedWorkbookTemplate: lastImportedWorkbookTemplate,
    dateStamp: dateStamp,
    exportRecordsToXlsx: exportRecordsToXlsx,
    EXPORT_SCOPE: EXPORT_SCOPE,
    isoNow: isoNow,
    setLatestExportReport: function (nextValue) {
      latestExportReport = nextValue;
    },
    renderImportDashboard: renderImportDashboard,
    syncExportLogToApi: syncExportLogToApi,
    countAuditEvents: countAuditEvents,
    runExportByScope: runExportByScope
  };
}

function getUiShellBindingsContext() {
  return {
    render: render,
    debounce: debounce,
    statusFilter: statusFilter,
    yearFilter: yearFilter,
    searchInput: searchInput,
    btnProfile: btnProfile,
    openProfileModal: openProfileModal,
    btnLogout: btnLogout,
    logoutCurrentUser: logoutCurrentUser,
    redirectToAuth: redirectToAuth,
    authLoginPage: AUTH_LOGIN_PAGE,
    btnDemo4Users: btnDemo4Users,
    generateRandomMultiUserDemo: generateRandomMultiUserDemo,
    modalClose: modalClose,
    modalClose2: modalClose2,
    modal: modal,
    requestCloseModal: requestCloseModal,
    btnKvSave: btnKvSave,
    clearModalAutosaveTimer: clearModalAutosaveTimer,
    clearModalAutoCloseTimer: clearModalAutoCloseTimer,
    saveModalDraftChanges: saveModalDraftChanges,
    setModalAutoCloseTimer: function (nextTimer) {
      modalAutoCloseTimer = nextTimer;
    },
    forceCloseModal: forceCloseModal,
    markStatus: markStatus,
    markReason: markReason,
    updateModalDraftUi: updateModalDraftUi,
    scheduleModalAutosave: scheduleModalAutosave,
    isUnsafeReloadShortcut: isUnsafeReloadShortcut,
    hasPendingModalDraft: hasPendingModalDraft,
    showModalSaveFeedback: showModalSaveFeedback,
    focusIfPossible: focusIfPossible,
    flushModalAutosave: flushModalAutosave,
    btnMarkStatus: btnMarkStatus,
    getSelected: getSelected,
    getModalDraftState: function () {
      return modalDraftState;
    },
    canMutateRecords: canMutateRecords,
    getReadOnlyRoleMessage: getReadOnlyRoleMessage,
    normalizeStatus: normalizeStatus,
    btnExportOne: btnExportOne,
    exportOne: async function () {
      return requireModuleFunction(getUiShellActionsUtil, "exportOne", "uiShellActions")(getUiShellActionsContext());
    },
    btnExportAtuais: btnExportAtuais,
    runExportAtuais: async function () {
      return requireModuleFunction(getUiShellActionsUtil, "runExportAtuais", "uiShellActions")(getUiShellActionsContext());
    },
    btnExportHistorico: btnExportHistorico,
    runExportHistorico: async function () {
      return requireModuleFunction(getUiShellActionsUtil, "runExportHistorico", "uiShellActions")(getUiShellActionsContext());
    },
    btnExportCustom: btnExportCustom,
    openExportCustomModal: openExportCustomModal,
    btnExportCustomApply: btnExportCustomApply,
    runCustomExport: async function (filters) {
      return requireModuleFunction(getUiShellActionsUtil, "runCustomExport", "uiShellActions")(filters, getUiShellActionsContext());
    },
    btnExportCustomClose: btnExportCustomClose,
    btnExportCustomCancel: btnExportCustomCancel,
    closeExportCustomModal: closeExportCustomModal,
    exportCustomModal: exportCustomModal,
    refreshCustomExportSummary: refreshCustomExportSummary,
    exportCustomYear: exportCustomYear,
    exportCustomStatus: exportCustomStatus,
    exportCustomDeputado: exportCustomDeputado,
    exportCustomMunicipio: exportCustomMunicipio,
    exportCustomIncludeOld: exportCustomIncludeOld,
    btnProfileClose: btnProfileClose,
    btnProfileCloseX: btnProfileCloseX,
    closeProfileModal: closeProfileModal,
    profileModal: profileModal,
    btnPendingApprovals: btnPendingApprovals,
    openPendingUsersModal: openPendingUsersModal,
    btnPendingUsersClose: btnPendingUsersClose,
    btnPendingUsersCloseX: btnPendingUsersCloseX,
    closePendingUsersModal: closePendingUsersModal,
    btnPendingUsersRefresh: btnPendingUsersRefresh,
    refreshPendingUsersModal: refreshPendingUsersModal,
    pendingUsersModal: pendingUsersModal,
    pendingUsersTableWrap: pendingUsersTableWrap,
    approvePendingUser: approvePendingUser,
    rejectPendingUser: rejectPendingUser,
    extractApiError: extractApiError,
    setPendingUsersFeedback: setPendingUsersFeedback
  };
}

function getImportControlsContext() {
  return {
    btnReset: btnReset,
    fileCsv: fileCsv,
    canMutateRecords: canMutateRecords,
    getState: function () {
      return state;
    },
    setState: function (nextState) {
      state = nextState;
    },
    setIdCountersByYear: function (nextValue) {
      idCountersByYear = nextValue;
    },
    getIdCountersByYear: function () {
      return idCountersByYear;
    },
    DEMO: DEMO,
    DEMO_MULTI_USERS: DEMO_MULTI_USERS,
    DEMO_NOTES: DEMO_NOTES,
    STATUS: STATUS,
    deepClone: deepClone,
    normalizeRecordShape: normalizeRecordShape,
    buildIdCounters: buildIdCounters,
    assignMissingIds: assignMissingIds,
    syncReferenceKeys: syncReferenceKeys,
    saveState: saveState,
    syncYearFilter: syncYearFilter,
    render: render,
    closeModal: closeModal,
    hideImportReport: hideImportReport,
    setLastImportedPlanilha1Aoa: function (nextValue) {
      lastImportedPlanilha1Aoa = nextValue;
    },
    parseInputFile: parseInputFile,
    purgeDemoBeforeOfficialImport: purgeDemoBeforeOfficialImport,
    processImportedRows: processImportedRows,
    showImportReport: showImportReport,
    syncImportBatchToApi: syncImportBatchToApi,
    syncImportLinesToApi: syncImportLinesToApi,
    mkEvent: mkEvent,
    isoNow: isoNow,
    syncCanonicalToAllFields: syncCanonicalToAllFields
  };
}

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
  const moduleFn = getModalDraftStateUtil("initModalDraftForRecord");
  if (moduleFn) {
    return moduleFn(rec, getModalDraftStateContext());
  }
  return false;
}

function isModalDraftDirty() {
  const moduleFn = getModalDraftStateUtil("isModalDraftDirty");
  if (moduleFn) {
    return moduleFn(getModalDraftStateContext());
  }
  if (!modalDraftState || !modalDraftState.dirty) return false;
  return Object.keys(modalDraftState.dirty).length > 0;
}

function hasPendingModalAction() {
  const moduleFn = getModalDraftStateUtil("hasPendingModalAction");
  if (moduleFn) {
    return moduleFn(getModalDraftStateContext());
  }
  return !!(modalDraftState && modalDraftState.pendingAction && modalDraftState.pendingAction.type);
}

function hasModalMarkDraft() {
  const moduleFn = getModalDraftStateUtil("hasModalMarkDraft");
  if (moduleFn) {
    return moduleFn(getModalDraftStateContext());
  }
  const selectedStatus = markStatus ? (markStatus.value || "").trim() : "";
  const reason = (markReason ? (markReason.value || "") : "").trim();
  return selectedStatus.length > 0 || reason.length > 0;
}

function canSaveDraftNow() {
  const moduleFn = getModalDraftStateUtil("canSaveDraftNow");
  if (moduleFn) {
    return moduleFn(getModalDraftStateContext());
  }
  if (!canMutateRecords()) return false;
  if (isEmendaLockReadOnly()) return false;
  if (hasPendingModalAction()) return true;
  const selectedStatus = markStatus ? (markStatus.value || "").trim() : "";
  const reason = (markReason ? (markReason.value || "") : "").trim();
  if (!isModalDraftDirty()) {
    return selectedStatus.length > 0 && reason.length > 0;
  }
  return selectedStatus.length > 0 && reason.length > 0;
}

function getDraftSaveBlockReason() {
  const moduleFn = getModalDraftStateUtil("getDraftSaveBlockReason");
  if (moduleFn) {
    return moduleFn(getModalDraftStateContext());
  }
  if (!canMutateRecords()) {
    return getReadOnlyRoleMessage() || "Perfil em leitura: sem alteracao de dados.";
  }
  if (isEmendaLockReadOnly()) {
    return "Edicao bloqueada: esta emenda esta em uso por outro usuario (modo leitura).";
  }
  if (hasPendingModalAction()) return "";
  const selectedStatus = markStatus ? (markStatus.value || "").trim() : "";
  const reason = (markReason ? (markReason.value || "") : "").trim();
  if (!isModalDraftDirty()) {
    if (!selectedStatus && !reason) return "";
    if (!selectedStatus) {
      return "ATENCAO: selecione um status para concluir o salvamento oficial.";
    }
    if (!reason) {
      return "ATENCAO: informe o motivo/observacao para concluir o salvamento oficial.";
    }
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

function clearModalAutoCloseTimer() {
  if (modalAutoCloseTimer) {
    clearTimeout(modalAutoCloseTimer);
    modalAutoCloseTimer = null;
  }
}

function clearModalAutosaveTimer() {
  const moduleFn = getModalSaveUtil("clearModalAutosaveTimer");
  if (moduleFn) {
    return moduleFn(getModalSaveContext());
  }
  if (modalAutosaveTimer) {
    clearTimeout(modalAutosaveTimer);
    modalAutosaveTimer = null;
  }
}

function hasPendingModalDraft() {
  const moduleFn = getModalDraftStateUtil("hasPendingModalDraft");
  if (moduleFn) {
    return moduleFn(getModalDraftStateContext());
  }
  return isModalDraftDirty() || hasPendingModalAction() || hasModalMarkDraft();
}

function normalizeDraftStoragePart(value) {
  const moduleFn = getModalDraftStateUtil("normalizeDraftStoragePart");
  if (moduleFn) {
    return moduleFn(value, getModalDraftStateContext());
  }
  return String(value == null ? "" : value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_");
}

function getModalDraftStorageKey(recordId) {
  const moduleFn = getModalDraftStateUtil("getModalDraftStorageKey");
  if (moduleFn) {
    return moduleFn(recordId, getModalDraftStateContext());
  }
  return [
    MODAL_DRAFT_STORAGE_PREFIX,
    normalizeDraftStoragePart(CURRENT_USER || "anon"),
    normalizeDraftStoragePart(CURRENT_ROLE || "role"),
    normalizeDraftStoragePart(recordId || "")
  ].join(":");
}

function readPersistedModalDraft(recordId) {
  const moduleFn = getModalDraftStateUtil("readPersistedModalDraft");
  if (moduleFn) {
    return moduleFn(recordId, getModalDraftStateContext());
  }
  const key = getModalDraftStorageKey(recordId);
  const raw = readStorageValue(localStorage, key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (String(parsed.recordId || "") !== String(recordId || "")) return null;
    return parsed;
  } catch (_err) {
    removeStorageValue(localStorage, key);
    return null;
  }
}

function clearPersistedModalDraft(recordId) {
  const moduleFn = getModalDraftStateUtil("clearPersistedModalDraft");
  if (moduleFn) {
    return moduleFn(recordId, getModalDraftStateContext());
  }
  removeStorageValue(localStorage, getModalDraftStorageKey(recordId));
  if (modalDraftState && modalDraftState.recordId === recordId) {
    delete modalDraftState.lastDraftSavedAt;
  }
}

function clearModalStatusDraftInputs() {
  const moduleFn = getModalDraftStateUtil("clearModalStatusDraftInputs");
  if (moduleFn) {
    return moduleFn(getModalDraftStateContext());
  }
  if (markStatus) markStatus.value = "";
  if (markReason) markReason.value = "";
}

function persistModalDraftSnapshot(reason) {
  const moduleFn = getModalDraftStateUtil("persistModalDraftSnapshot");
  if (moduleFn) {
    return moduleFn(reason, getModalDraftStateContext());
  }
  if (!modalDraftState || !modalDraftState.recordId) return false;
  const recordId = modalDraftState.recordId;
  if (!hasPendingModalDraft()) {
    clearPersistedModalDraft(recordId);
    return false;
  }

  const payload = {
    recordId: recordId,
    user: CURRENT_USER,
    role: CURRENT_ROLE,
    savedAt: isoNow(),
    reason: String(reason || "autosave"),
    draft: shallowCloneObj(modalDraftState.draft || {}),
    pendingAction: modalDraftState.pendingAction ? deepClone(modalDraftState.pendingAction) : null,
    markStatus: markStatus ? String(markStatus.value || "") : "",
    markReason: markReason ? String(markReason.value || "") : ""
  };

  writeStorageValue(localStorage, getModalDraftStorageKey(recordId), JSON.stringify(payload));
  modalDraftState.lastDraftSavedAt = payload.savedAt;
  return true;
}

function restorePersistedModalDraft(rec) {
  const moduleFn = getModalDraftStateUtil("restorePersistedModalDraft");
  if (moduleFn) {
    return moduleFn(rec, getModalDraftStateContext());
  }
  if (!rec || !modalDraftState) return false;
  const snapshot = readPersistedModalDraft(rec.id);
  if (!snapshot) return false;

  const nextDirty = {};
  MODAL_FIELD_ORDER.forEach(function (field) {
    if (!field.editable) return;
    const type = getModalFieldType(field.key);
    const originalValue = normalizeDraftFieldValue(rec[field.key], type);
    const draftSource = snapshot.draft && Object.prototype.hasOwnProperty.call(snapshot.draft, field.key)
      ? snapshot.draft[field.key]
      : originalValue;
    const draftValue = normalizeDraftFieldValue(draftSource, type);

    modalDraftState.original[field.key] = originalValue;
    modalDraftState.draft[field.key] = draftValue;
    if (hasFieldChanged(originalValue, draftValue, type)) {
      nextDirty[field.key] = true;
    }
  });

  modalDraftState.dirty = nextDirty;
  modalDraftState.pendingAction = snapshot.pendingAction && snapshot.pendingAction.type === "MARK_STATUS"
    ? {
      type: "MARK_STATUS",
      status: normalizeStatus(snapshot.pendingAction.status || snapshot.markStatus || ""),
      reason: String(snapshot.pendingAction.reason || snapshot.markReason || "")
    }
    : null;
  modalDraftState.lastDraftSavedAt = snapshot.savedAt || "";

  if (markStatus) markStatus.value = String(snapshot.markStatus || "");
  if (markReason) markReason.value = String(snapshot.markReason || "");
  return true;
}

function scheduleModalAutosave(reason) {
  const moduleFn = getModalSaveUtil("scheduleModalAutosave");
  if (moduleFn) {
    return moduleFn(reason, getModalSaveContext());
  }
  clearModalAutosaveTimer();
  if (!modal || !modal.classList.contains("show")) return;
  if (!modalDraftState) return;
  if (!hasPendingModalDraft()) {
    clearPersistedModalDraft(modalDraftState.recordId);
    return;
  }

  modalAutosaveTimer = setTimeout(function () {
    persistModalDraftSnapshot(reason || "debounce");
    updateModalDraftUi();
  }, MODAL_AUTOSAVE_DEBOUNCE_MS);
}

function flushModalAutosave(options) {
  const moduleFn = getModalSaveUtil("flushModalAutosave");
  if (moduleFn) {
    return moduleFn(options, getModalSaveContext());
  }
  const opts = options && typeof options === "object" ? options : {};
  clearModalAutosaveTimer();
  if (!modalDraftState) return true;
  if (!hasPendingModalDraft()) {
    clearPersistedModalDraft(modalDraftState.recordId);
    return true;
  }
  return persistModalDraftSnapshot(opts.reason || "flush");
}

function clearModalSaveFeedback() {
  const moduleFn = getModalSaveUtil("clearModalSaveFeedback");
  if (moduleFn) {
    return moduleFn(getModalSaveContext());
  }
  if (modalSaveFeedbackTimer) {
    clearTimeout(modalSaveFeedbackTimer);
    modalSaveFeedbackTimer = null;
  }
  if (!modalSaveFeedback) return;
  const setModalSaveFeedbackStateUtil = getUiRenderUtil("setModalSaveFeedbackState");
  if (setModalSaveFeedbackStateUtil) {
    setModalSaveFeedbackStateUtil(modalSaveFeedback, "", { hidden: true, isError: false });
    return;
  }
  modalSaveFeedback.textContent = "";
  modalSaveFeedback.classList.add("hidden");
  modalSaveFeedback.classList.remove("success", "error");
}

function showModalSaveFeedback(message, isError) {
  const moduleFn = getModalSaveUtil("showModalSaveFeedback");
  if (moduleFn) {
    return moduleFn(message, isError, getModalSaveContext());
  }
  if (!modalSaveFeedback) return;
  clearModalSaveFeedback();
  const setModalSaveFeedbackStateUtil = getUiRenderUtil("setModalSaveFeedbackState");
  if (setModalSaveFeedbackStateUtil) {
    setModalSaveFeedbackStateUtil(modalSaveFeedback, message, { hidden: false, isError: isError });
  } else {
    modalSaveFeedback.textContent = message;
    modalSaveFeedback.classList.remove("hidden");
    modalSaveFeedback.classList.add(isError ? "error" : "success");
  }
  modalSaveFeedbackTimer = setTimeout(function () {
    clearModalSaveFeedback();
  }, 2600);
}

function updateModalDraftUi() {
  const moduleFn = getModalSaveUtil("updateModalDraftUi");
  if (moduleFn) {
    return moduleFn(getModalSaveContext());
  }
  const dirty = isModalDraftDirty();
  const pending = hasPendingModalAction();
  const hasMarkDraft = hasModalMarkDraft();
  const hasDraft = dirty || pending || hasMarkDraft;
  const canSave = canSaveDraftNow();
  const blockReason = getDraftSaveBlockReason();
  const draftSavedAtText = modalDraftState && modalDraftState.lastDraftSavedAt
    ? fmtDateTime(modalDraftState.lastDraftSavedAt)
    : "";
  const updateModalDraftUiUtil = getUiRenderUtil("updateModalDraftUi");
  if (updateModalDraftUiUtil) {
    updateModalDraftUiUtil(kv, kvDraftHint, modalSaveGuard, btnKvSave, modalDraftState, {
      dirty: dirty,
      pending: pending,
      hasMarkDraft: hasMarkDraft,
      canSave: canSave,
      blockReason: blockReason,
      draftSavedAtText: draftSavedAtText
    });
    return;
  }

  if (kvDraftHint) {
    kvDraftHint.classList.toggle("hidden", !hasDraft);
    if (hasDraft) {
      if (pending) {
        kvDraftHint.textContent = "Marcacao pronta: rascunho local salvo automaticamente. Clique em Salvar edicoes para gravar oficialmente.";
      } else if (canSave) {
        kvDraftHint.textContent = "Rascunho local salvo automaticamente. Clique em Salvar edicoes para gravar oficialmente.";
      } else if (hasMarkDraft) {
        kvDraftHint.textContent = "Rascunho local salvo automaticamente. Complete status e motivo para gravar oficialmente.";
      } else {
        kvDraftHint.textContent = "Rascunho local salvo automaticamente. Informe status e motivo para salvar oficialmente.";
      }
      if (draftSavedAtText) {
        kvDraftHint.textContent += " Ultimo rascunho local: " + draftSavedAtText + ".";
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
  const applyModalAccessProfileUtil = getUiRenderUtil("applyModalAccessProfile");
  if (applyModalAccessProfileUtil) {
    applyModalAccessProfileUtil(kv, {
      markStatus: markStatus,
      markReason: markReason,
      btnMarkStatus: btnMarkStatus,
      btnKvSave: btnKvSave
    }, {
      readOnlyMode: readOnlyMode
    });
    return;
  }

  if (markStatus) markStatus.disabled = readOnlyMode;
  if (markReason) markReason.disabled = readOnlyMode;
  if (btnMarkStatus) btnMarkStatus.disabled = readOnlyMode;
  if (btnKvSave) btnKvSave.style.display = readOnlyMode ? "none" : "inline-block";
  if (kv) {
    const inputs = kv.querySelectorAll("[data-kv-field]");
    inputs.forEach(function (el) {
      el.disabled = readOnlyMode;
    });
  }
}

function onModalFieldInput(e) {
  const moduleFn = getModalDraftStateUtil("onModalFieldInput");
  if (moduleFn) {
    return moduleFn(e, getModalDraftStateContext());
  }
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
  scheduleModalAutosave("field");
}

function syncModalReadonlyFieldValues(rec) {
  const moduleFn = getModalSectionsUtil("syncModalReadonlyFieldValues");
  if (moduleFn) {
    return moduleFn(rec, {
      kv: kv
    });
  }
  if (!kv || !rec) return;
  const readonlyFields = kv.querySelectorAll("[data-kv-readonly-field]");
  readonlyFields.forEach(function (el) {
    const key = el.getAttribute("data-kv-readonly-field");
    el.textContent = String(rec[key] == null ? "-" : rec[key]);
  });
}

function refreshModalRecordHeader(rec) {
  const moduleFn = getModalSectionsUtil("refreshModalRecordHeader");
  if (moduleFn) {
    return moduleFn(rec, {
      titleEl: modalTitle,
      subtitleEl: modalSub,
      syncModalRecordHeader: getUiRenderUtil("syncModalRecordHeader")
    });
  }
  if (!rec) return;
  const syncModalRecordHeaderUtil = getUiRenderUtil("syncModalRecordHeader");
  if (syncModalRecordHeaderUtil) {
    syncModalRecordHeaderUtil(modalTitle, modalSub, rec);
    return;
  }
  modalTitle.textContent = "Emenda: " + rec.id;
  modalSub.textContent = rec.identificacao + " | " + rec.municipio + " | " + rec.deputado;
}

function refreshModalSectionsForRecord(rec) {
  const moduleFn = getModalSectionsUtil("refreshModalSections");
  if (moduleFn) {
    return moduleFn(rec, getModalSectionsContext());
  }
  refreshModalRecordHeader(rec);
  syncModalReadonlyFieldValues(rec);

  const users = getActiveUsersWithLastMark(rec);
  const progress = calcProgress(users);
  const delays = whoIsDelaying(users);
  const attentionIssues = getAttentionIssues(users);
  const lastMarks = getLastMarksByUser(rec);

  renderMarksSummary(lastMarks);
  renderRawFields(rec);
  if (REALTIME_USER_PANEL_ENABLED && userProgressBox) {
    renderUserProgressBox(userProgressBox, progress, delays, {
      renderProgressBar: renderProgressBar,
      renderMemberChips: renderMemberChips,
      users: users
    });
  }

  const renderConflictStateUtil = getUiRenderUtil("renderConflictState");
  if (renderConflictStateUtil) {
    renderConflictStateUtil(conflictBox, conflictText, attentionIssues);
  } else if (attentionIssues.length) {
    conflictBox.classList.remove("hidden");
    conflictText.textContent = attentionIssues.join(" | ");
  } else {
    conflictBox.classList.add("hidden");
    conflictText.textContent = "";
  }

  renderHistoryFallback(rec);
  applyModalAccessProfile();
}

function refreshOpenModalAfterSave(rec) {
  const moduleFn = getModalShellUtil("refreshOpenModalAfterSave");
  if (moduleFn) {
    return moduleFn(rec, getModalShellContext());
  }
  if (!rec || !modal || !modal.classList.contains("show") || selectedId !== rec.id) return;
  refreshModalSectionsForRecord(rec);
}

function shouldRefreshOpenModalFromRemote(rec) {
  const moduleFn = getModalShellUtil("shouldRefreshOpenModalFromRemote");
  if (moduleFn) {
    return moduleFn(rec, getModalShellContext());
  }
  if (!rec || !modal || !modal.classList.contains("show") || selectedId !== rec.id) return false;
  if (!canMutateRecords()) return true;
  if (isEmendaLockReadOnly()) return true;
  return !hasPendingModalDraft();
}

function refreshOpenModalAfterRemoteSync() {
  const moduleFn = getModalShellUtil("refreshOpenModalAfterRemoteSync");
  if (moduleFn) {
    return moduleFn(getModalShellContext());
  }
  const rec = getSelected();
  if (!shouldRefreshOpenModalFromRemote(rec)) return;
  refreshOpenModalAfterSave(rec);
}

function rebaseModalDraftAfterSave(rec) {
  const moduleFn = getModalDraftStateUtil("rebaseModalDraftAfterSave");
  if (moduleFn) {
    return moduleFn(rec, getModalDraftStateContext());
  }
  if (!rec || !modalDraftState || modalDraftState.recordId !== rec.id) return;
  const nextDraft = {};
  const nextOriginal = {};
  const nextDirty = {};

  MODAL_FIELD_ORDER.forEach(function (field) {
    if (!field.editable) return;
    const type = getModalFieldType(field.key);
    const savedValue = normalizeDraftFieldValue(rec[field.key], type);
    const currentDraftValue = modalDraftState && modalDraftState.draft
      ? normalizeDraftFieldValue(modalDraftState.draft[field.key], type)
      : savedValue;

    nextOriginal[field.key] = savedValue;
    nextDraft[field.key] = currentDraftValue;
    if (hasFieldChanged(savedValue, currentDraftValue, type)) {
      nextDirty[field.key] = true;
    }
  });

  modalDraftState.original = nextOriginal;
  modalDraftState.draft = nextDraft;
  modalDraftState.dirty = nextDirty;
  modalDraftState.pendingAction = null;
}

// Renderiza editor de campos da emenda no modal.
function renderKvEditor(rec) {
  const renderKvEditorUtil = getUiRenderUtil("renderKvEditor");
  if (renderKvEditorUtil) {
    renderKvEditorUtil(kv, rec, {
      fieldOrder: MODAL_FIELD_ORDER,
      getModalFieldType: getModalFieldType,
      formatDraftInputValue: formatDraftInputValue,
      canMutateRecords: canMutateRecords(),
      onModalFieldInput: onModalFieldInput,
      modalDraftState: modalDraftState
    });
    applyModalAccessProfile();
    updateModalDraftUi();
    return;
  }

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
      if (field.key) v.setAttribute("data-kv-readonly-field", field.key);
      v.textContent = String(rec[field.key] == null ? "-" : rec[field.key]);
    }

    kv.appendChild(k);
    kv.appendChild(v);
  });

  applyModalAccessProfile();
  updateModalDraftUi();
}

// Salva alteracoes de campos feitas no modal e registra eventos.
async function saveModalDraftChanges(keepOpenOrOptions) {
  const moduleFn = getModalSaveUtil("saveModalDraftChanges");
  if (moduleFn) {
    return await moduleFn(keepOpenOrOptions, getModalSaveContext());
  }
  return true;
}
function discardModalDraftChanges(keepOpen) {
  const moduleFn = getModalShellUtil("discardModalDraftChanges");
  if (moduleFn) {
    return moduleFn(keepOpen, getModalShellContext());
  }
  clearModalAutosaveTimer();
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
  const moduleFn = getModalShellUtil("requestCloseModal");
  if (moduleFn) {
    return await moduleFn(getModalShellContext());
  }
  if (modalCloseInProgress) return;
  modalCloseInProgress = true;
  try {
    if (hasPendingModalDraft()) {
      const rec = getSelected();
      flushModalAutosave({ reason: "close-request" });

      if (canSaveDraftNow()) {
        const shouldSave = confirm("Existe rascunho nesta emenda. OK = salvar oficialmente agora. Cancelar = escolher entre descartar ou manter o rascunho local.");
        if (shouldSave) {
          const saved = await saveModalDraftChanges(false);
          if (saved) {
            forceCloseModal();
          }
          return;
        }
      }

      const shouldDiscard = confirm("Deseja descartar o rascunho desta emenda? OK = descartar. Cancelar = manter o rascunho local para continuar depois.");
      if (shouldDiscard) {
        if (rec) clearPersistedModalDraft(rec.id);
        discardModalDraftChanges(false);
        forceCloseModal();
        return;
      }

      flushModalAutosave({ reason: "close-keep-draft" });
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
  const moduleFn = getModalShellUtil("openModal");
  if (moduleFn) {
    return moduleFn(id, keepReasons, getModalShellContext());
  }
  clearModalAutoCloseTimer();
  clearModalAutosaveTimer();
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

  const syncModalRecordHeaderUtil = getUiRenderUtil("syncModalRecordHeader");
  if (syncModalRecordHeaderUtil) {
    syncModalRecordHeaderUtil(modalTitle, modalSub, rec);
  } else {
    modalTitle.textContent = "Emenda: " + rec.id;
    modalSub.textContent = rec.identificacao + " | " + rec.municipio + " | " + rec.deputado;
  }

  if (!keepReasons) {
    if (markStatus) markStatus.value = "";
    markReason.value = "";
  }

  const restoredDraft = initModalDraftForRecord(rec);
  renderKvEditor(rec);
  refreshModalSectionsForRecord(rec);

  setAuxModalVisibility(modal, true);
  renderEmendaLockInfo(rec);
  syncModalEmendaLock(rec).catch(function (_err) {
    renderEmendaLockInfo(rec);
  });
  if (restoredDraft) {
    setTimeout(function () {
      showModalSaveFeedback("Rascunho local restaurado. Clique em Salvar edicoes para gravar oficialmente.", false);
    }, 120);
  }
  setTimeout(function () {
    focusIfPossible(modalClose);
  }, 0);
}

function renderUserProgressBox(progressContainer, progress, delays, options) {
  if (!REALTIME_USER_PANEL_ENABLED) {
    if (progressContainer) clearNodeChildren(progressContainer);
    return;
  }
  const renderUserProgressBoxUtil = getUiRenderUtil("renderUserProgressBox");
  if (renderUserProgressBoxUtil) {
    renderUserProgressBoxUtil(progressContainer, progress, delays, options);
    return;
  }

  if (!progressContainer) return;
  const opts = options || {};
  const progressRenderer = getOptionFunction(opts, "renderProgressBar");
  const chipsRenderer = getOptionFunction(opts, "renderMemberChips");
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
  const uiCtx = getUiRenderContext();
  const renderMarksSummaryUtil = getUiRenderUtil("renderMarksSummary");
  if (renderMarksSummaryUtil) {
    renderMarksSummaryUtil(marksSummary, lastMarks, uiCtx);
    return;
  }

  clearNodeChildren(marksSummary);
  const fallback = document.createElement("p");
  fallback.className = "muted small";
  fallback.textContent = "Renderizador indisponível (resumo de marcacoes).";
  marksSummary.appendChild(fallback);
}

function renderHistoryFallback(rec) {
  const moduleFn = getModalSectionsUtil("renderHistoryFallback");
  if (moduleFn) {
    return moduleFn(rec, {
      historyEl: historyEl,
      renderHistoryToContainer: getUiRenderUtil("renderHistoryToContainer"),
      getEventsSorted: getEventsSorted,
      clearNodeChildren: clearNodeChildren,
      uiCtx: getUiRenderContext()
    });
  }
  if (!historyEl) return;
  const uiCtx = getUiRenderContext();
  const renderHistoryToContainerUtil = getUiRenderUtil("renderHistoryToContainer");
  if (renderHistoryToContainerUtil) {
    renderHistoryToContainerUtil(historyEl, getEventsSorted(rec), uiCtx);
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
  const progressCtx = getProgressContext();
  const getActiveUsersWithLastMarkUtil = getProgressUtil("getActiveUsersWithLastMark");
  if (getActiveUsersWithLastMarkUtil) {
    return getActiveUsersWithLastMarkUtil(rec, progressCtx);
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
  const statusCtx = getStatusContext();
  const statusClassUtil = getStatusUtil("statusClass");
  if (statusClassUtil) {
    return statusClassUtil(status, statusCtx.normalizeLooseText);
  }

  const s = statusCtx.normalizeLooseText(status);
  if (s.indexOf("concl") >= 0) return "st-ok";
  if (s.indexOf("cancel") >= 0) return "st-bad";
  if (s.indexOf("pend") >= 0 || s.indexOf("aguard") >= 0) return "st-warn";
  if (s.indexOf("exec") >= 0 || s.indexOf("anal") >= 0 || s.indexOf("apro") >= 0 || s.indexOf("rece") >= 0) return "st-mid";
  return "st-none";
}

function renderMemberChips(users) {
  const progressCtx = getProgressContext();
  const renderMemberChipsUtil = getProgressUtil("renderMemberChips");
  if (renderMemberChipsUtil) {
    return renderMemberChipsUtil(users, progressCtx);
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
  const moduleFn = getModalShellUtil("forceCloseModal");
  if (moduleFn) {
    return moduleFn(getModalShellContext());
  }
  const activeRec = getSelected();
  if (activeRec) {
    announcePresenceForRecord(activeRec, "leave");
    releaseEmendaLock(activeRec).catch(function () { /* no-op */ });
  }
  clearEmendaLockTimer();
  setEmendaLockState(null);
  clearModalAutoCloseTimer();
  clearModalAutosaveTimer();
  clearModalSaveFeedback();
  if (lastFocusedElement && modal && !modal.contains(lastFocusedElement)) {
    focusIfPossible(lastFocusedElement);
  } else if (typeof document !== "undefined" && document.activeElement && modal && modal.contains(document.activeElement) && typeof document.activeElement.blur === "function") {
    document.activeElement.blur();
  }
  setAuxModalVisibility(modal, false);
  if (modalAccessState) {
    modalAccessState.classList.add("hidden");
    modalAccessState.textContent = "";
  }
  clearModalStatusDraftInputs();
  selectedId = null;
  modalDraftState = null;
  updateModalDraftUi();
  if (!lastFocusedElement || (modal && modal.contains(lastFocusedElement))) {
    focusIfPossible(document.body);
  }
}

function getSelected() {
  return state.records.find(function (r) {
    return r.id === selectedId;
  });
}

// Pipeline de importacao: cria/atualiza registros e gera relatorio consolidado.
function processImportedRows(sourceRows, fileName) {
  const processImportedRowsUtil = getImportProcessorUtil("processImportedRows");
  if (processImportedRowsUtil) {
    return processImportedRowsUtil(sourceRows, fileName, state.records, {
      initialValidation: lastImportValidation || null,
      mapImportRow: mapImportRow,
      hasUsefulData: hasUsefulData,
      createRecordFromImport: createRecordFromImport,
      mergeImportIntoRecord: mergeImportIntoRecord,
      buildImportValidationReport: buildImportValidationReport
    });
  }

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
  const importCtx = getImportPipelineContext();
  const createRecordFromImportUtil = getImportPipelineUtil("createRecordFromImport");
  if (createRecordFromImportUtil) {
    return createRecordFromImportUtil(incoming, ctx, fileName, importCtx);
  }

  const now = importCtx.isoNow();
  const ano = incoming.ano || importCtx.currentYear();
  const id = incoming.id || importCtx.generateInternalIdForYear(ano);

  const base = importCtx.mkRecord({
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
    all_fields: importCtx.shallowCloneObj(incoming.all_fields || {}),
    eventos: [importCtx.mkEvent("IMPORT", { note: importCtx.buildImportNote(fileName, ctx) })]
  });

  base.ref_key = importCtx.buildReferenceKey(base);

  if (incoming.status_oficial) {
    base.eventos.unshift(importCtx.mkEvent("MARK_STATUS", {
      to: importCtx.normalizeStatus(incoming.status_oficial),
      note: "Marcacao inicial vinda da importacao.",
      actor_user: importCtx.systemMigrationUser,
      actor_role: importCtx.systemMigrationRole
    }));
  }

  return base;
}

// Faz merge de uma linha importada em registro existente, preservando historico.
function mergeImportIntoRecord(target, incoming, ctx, fileName) {
  const importCtx = getImportPipelineContext();
  const mergeImportIntoRecordUtil = getImportPipelineUtil("mergeImportIntoRecord");
  if (mergeImportIntoRecordUtil) {
    return mergeImportIntoRecordUtil(target, incoming, ctx, fileName, importCtx);
  }

  const changedEvents = [];
  let changedAny = false;

  const rawMergeChanged = importCtx.mergeRawFields(target, incoming.all_fields || {});
  if (rawMergeChanged) changedAny = true;

  if (incoming.source_sheet && incoming.source_sheet !== target.source_sheet) {
    target.source_sheet = incoming.source_sheet;
    changedAny = true;
  }
  if (ctx.rowNumber != null && Number(ctx.rowNumber) !== Number(target.source_row)) {
    target.source_row = Number(ctx.rowNumber);
    changedAny = true;
  }

  importCtx.trackedFields.forEach(function (def) {
    const nextRaw = incoming[def.key];
    if (!importCtx.hasIncomingValue(nextRaw, def.type)) return;

    const prev = target[def.key];
    if (!importCtx.hasFieldChanged(prev, nextRaw, def.type)) return;

    if (def.type === "money" || def.type === "number") target[def.key] = Number(nextRaw);
    else target[def.key] = String(nextRaw).trim();

    changedEvents.push(importCtx.mkEvent("EDIT_FIELD", {
      field: def.label,
      from: importCtx.stringifyFieldValue(prev, def.type),
      to: importCtx.stringifyFieldValue(target[def.key], def.type),
      note: "Atualizado via importacao."
    }));
    changedAny = true;
  });

  if (incoming.status_oficial) {
    const nextStatus = importCtx.normalizeStatus(incoming.status_oficial);
    const prevMarked = importCtx.latestMarkedStatus(target);
    if (importCtx.normalizeStatus(prevMarked || "") !== nextStatus) {
      changedEvents.push(importCtx.mkEvent("MARK_STATUS", {
        to: nextStatus,
        note: "Marcacao atualizada via importacao.",
        actor_user: importCtx.systemMigrationUser,
        actor_role: importCtx.systemMigrationRole
      }));
      changedAny = true;
    }
  }

  const oldRef = target.ref_key || "";
  importCtx.syncCanonicalToAllFields(target);
  target.ref_key = importCtx.buildReferenceKey(target);
  if (oldRef !== target.ref_key) {
    changedEvents.push(importCtx.mkEvent("EDIT_FIELD", { field: "Chave Referencia", from: oldRef, to: target.ref_key, note: "Recalculada apos importacao." }));
    changedAny = true;
  }

  if (changedAny) {
    target.updated_at = importCtx.isoNow();
    changedEvents.push(importCtx.mkEvent("IMPORT", { note: importCtx.buildImportNote(fileName, ctx) + " (com atualizacoes)" }));
    target.eventos = changedEvents.concat(target.eventos || []);
  }

  return { changedAny: changedAny };
}

function mapImportRow(ctx) {
  const importCtx = getImportPipelineContext();
  const mapImportRowUtil = getImportPipelineUtil("mapImportRow");
  if (mapImportRowUtil) {
    return mapImportRowUtil(ctx, importCtx);
  }

  const rawOriginal = importCtx.shallowCloneObj(ctx.row || {});
  const row = normalizeRowKeys(rawOriginal);

  const ano = importCtx.toInt(importCtx.pickValue(row, importCtx.importAliases.ano));
  const identificacao = importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.identificacao));
  const codSubfonte = importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.cod_subfonte));
  const codAcao = importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.cod_acao));
  const municipio = importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.municipio));
  const deputado = importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.deputado));

  const record = {
    id: importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.id)),
    ano: ano || importCtx.currentYear(),
    identificacao: identificacao,
    cod_subfonte: codSubfonte,
    deputado: deputado,
    cod_uo: importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.cod_uo)),
    sigla_uo: importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.sigla_uo)),
    cod_orgao: importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.cod_orgao)),
    cod_acao: codAcao,
    descricao_acao: importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.descricao_acao)),
    plan_a: importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.plan_a)),
    plan_b: importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.plan_b)),
    municipio: municipio,
    valor_inicial: importCtx.toNumberOrNull(importCtx.pickValue(row, importCtx.importAliases.valor_inicial)),
    valor_atual: importCtx.toNumberOrNull(importCtx.pickValue(row, importCtx.importAliases.valor_atual)),
    processo_sei: importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.processo_sei)),
    status_oficial: "",
    all_fields: rawOriginal,
    source_sheet: ctx.sheetName || "XLSX",
    source_row: ctx.rowNumber != null ? Number(ctx.rowNumber) : null
  };

  const statusRaw = importCtx.asText(importCtx.pickValue(row, importCtx.importAliases.status_oficial));
  if (statusRaw) record.status_oficial = importCtx.normalizeStatus(statusRaw);

  importCtx.syncCanonicalToAllFields(record);
  record.ref_key = importCtx.buildReferenceKey(record);
  return record;
}

function hasUsefulData(record) {
  const hasUsefulDataUtil = getImportPipelineUtil("hasUsefulData");
  if (hasUsefulDataUtil) {
    return hasUsefulDataUtil(record);
  }

  const checks = [record.id, record.identificacao, record.cod_subfonte, record.cod_acao, record.municipio, record.deputado, record.processo_sei, record.ref_key];
  const hasText = checks.some(function (v) {
    return !!String(v || "").trim();
  });
  const hasNumber = record.valor_inicial != null || record.valor_atual != null;
  return hasText || hasNumber;
}

function hasIncomingValue(value, type) {
  const hasIncomingValueUtil = getImportPipelineUtil("hasIncomingValue");
  if (hasIncomingValueUtil) {
    return hasIncomingValueUtil(value, type);
  }

  if (type === "money" || type === "number") return value != null && String(value).trim() !== "" && Number.isFinite(Number(value));
  return value != null && String(value).trim() !== "";
}

function hasFieldChanged(prev, next, type) {
  const hasFieldChangedUtil = getImportPipelineUtil("hasFieldChanged");
  if (hasFieldChangedUtil) {
    return hasFieldChangedUtil(prev, next, type, {
      toNumber: toNumber,
      toInt: toInt,
      normalizeLooseText: normalizeLooseText
    });
  }

  if (type === "money") return toNumber(prev) !== toNumber(next);
  if (type === "number") return toInt(prev) !== toInt(next);
  return normalizeLooseText(prev) !== normalizeLooseText(next);
}

function stringifyFieldValue(value, type) {
  const stringifyFieldValueUtil = getImportPipelineUtil("stringifyFieldValue");
  if (stringifyFieldValueUtil) {
    return stringifyFieldValueUtil(value, type, {
      fmtMoney: fmtMoney,
      toInt: toInt,
      toNumber: toNumber
    });
  }

  if (type === "money") return "R$ " + fmtMoney(value);
  if (type === "number") return String(toInt(value));
  return String(value == null ? "" : value);
}

// Padroniza mensagem de auditoria para eventos de importacao.
function buildImportNote(fileName, ctx) {
  const buildImportNoteUtil = getImportPipelineUtil("buildImportNote");
  if (buildImportNoteUtil) {
    return buildImportNoteUtil(fileName, ctx);
  }

  return "Importado de " + fileName + " | Aba: " + (ctx.sheetName || "XLSX") + " | Linha: " + String(ctx.rowNumber || "-");
}

// Le arquivo XLSX, detecta cabecalho e extrai linhas validas para importacao.
async function parseInputFile(file) {
  const parseInputFileUtil = getImportReaderUtil("parseInputFile");
  if (parseInputFileUtil) {
    const result = await parseInputFileUtil(file, {
      xlsxApi: getXlsxApi(),
      buildKnownHeaderSet: buildKnownHeaderSet,
      detectHeaderRow: detectHeaderRow,
      normalizeHeader: normalizeHeader,
      isRowEmpty: isRowEmpty,
      rowArrayToObject: rowArrayToObject,
      extractPlanilha1AoaFromWorkbook: extractPlanilha1AoaFromWorkbook,
      isoNow: isoNow,
      buildImportValidationReport: buildImportValidationReport,
      text: text,
      normalizeLooseText: normalizeLooseText
    });
    lastImportedPlanilha1Aoa = result && Array.isArray(result.planilha1Aoa) ? result.planilha1Aoa : null;
    lastImportedWorkbookTemplate = result && result.templateSnapshot ? result.templateSnapshot : null;
    lastImportValidation = result ? result.validation || null : null;
    return result && Array.isArray(result.rows) ? result.rows : [];
  }

  const name = String(file.name || "").toLowerCase();

  if (!name.endsWith(".xlsx")) {
    throw new Error("Formato nao suportado. Use apenas XLSX.");
  }

  const xlsxApi = getXlsxApi();
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
  const extractPlanilha1AoaFromWorkbookUtil = getImportReaderUtil("extractPlanilha1AoaFromWorkbook");
  if (extractPlanilha1AoaFromWorkbookUtil) {
    return extractPlanilha1AoaFromWorkbookUtil(workbook, xlsxApi, {
      normalizeHeader: normalizeHeader,
      text: text,
      normalizeLooseText: normalizeLooseText
    });
  }

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
  const validationCtx = getImportValidationContext();
  const buildImportValidationReportUtil = getImportValidationUtil("buildImportValidationReport");
  if (buildImportValidationReportUtil) {
    return buildImportValidationReportUtil(sourceRows, {
      buildKnownHeaderSet: function () {
        return buildKnownHeaderSet();
      },
      countCriticalEmpties: function (rows) {
        return countCriticalEmpties(rows);
      },
      detectImportTypes: function (rows) {
        return detectImportTypes(rows);
      },
      shallowCloneObj: validationCtx.shallowCloneObj,
      normalizeHeader: validationCtx.normalizeHeader
    });
  }

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
      dados: validationCtx.shallowCloneObj((ctx && ctx.row) || {})
    });
  });

  rows.forEach(function (ctx) {
    const row = (ctx && ctx.row) || {};
    Object.keys(row).forEach(function (k) {
      if (!headerSeen.has(k)) {
        headerSeen.add(k);
        headersFound.push(k);
      }
      const nk = validationCtx.normalizeHeader(k);
      headerNormalizedCount[nk] = (headerNormalizedCount[nk] || 0) + 1;
    });
  });

  const recognized = [];
  const unrecognized = [];
  headersFound.forEach(function (h) {
    if (knownSet.has(validationCtx.normalizeHeader(h))) recognized.push(h);
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
  const importCtx = getImportPipelineContext();
  const buildKnownHeaderSetUtil = getImportValidationUtil("buildKnownHeaderSet");
  if (buildKnownHeaderSetUtil) {
    return buildKnownHeaderSetUtil(importCtx.importAliases, importCtx.normalizeHeader);
  }

  const set = new Set();
  Object.keys(importCtx.importAliases).forEach(function (key) {
    (importCtx.importAliases[key] || []).forEach(function (alias) {
      set.add(importCtx.normalizeHeader(alias));
    });
  });
  return set;
}

function countCriticalEmpties(rows) {
  const validationCtx = getImportValidationContext();
  const countCriticalEmptiesUtil = getImportValidationUtil("countCriticalEmpties");
  if (countCriticalEmptiesUtil) {
    return countCriticalEmptiesUtil(rows, validationCtx.mapImportRow, validationCtx.text);
  }

  const counters = { identificacao: 0, deputado: 0, municipio: 0 };
  rows.forEach(function (ctx) {
    const mapped = validationCtx.mapImportRow(ctx);
    if (!validationCtx.text(mapped.identificacao)) counters.identificacao += 1;
    if (!validationCtx.text(mapped.deputado)) counters.deputado += 1;
    if (!validationCtx.text(mapped.municipio)) counters.municipio += 1;
  });
  return counters;
}

function detectImportTypes(rows) {
  const validationCtx = getImportValidationContext();
  const detectImportTypesUtil = getImportValidationUtil("detectImportTypes");
  if (detectImportTypesUtil) {
    return detectImportTypesUtil(rows, validationCtx.mapImportRow, validationCtx.detectType);
  }

  const sample = rows.slice(0, 50).map(function (ctx) { return validationCtx.mapImportRow(ctx); });
  return {
    ano: validationCtx.detectType(sample.map(function (r) { return r.ano; })),
    valor_inicial: validationCtx.detectType(sample.map(function (r) { return r.valor_inicial; })),
    valor_atual: validationCtx.detectType(sample.map(function (r) { return r.valor_atual; })),
    identificacao: validationCtx.detectType(sample.map(function (r) { return r.identificacao; })),
    processo_sei: validationCtx.detectType(sample.map(function (r) { return r.processo_sei; }))
  };
}

function detectType(values) {
  const detectTypeUtil = getImportValidationUtil("detectType");
  if (detectTypeUtil) {
    return detectTypeUtil(values);
  }

  const v = (values || []).filter(function (x) { return x != null && String(x).trim() !== ""; });
  if (!v.length) return "vazio";
  const allNum = v.every(function (x) { return Number.isFinite(Number(x)); });
  if (allNum) return "numero";
  return "texto";
}
function detectHeaderRow(matrix) {
  const validationCtx = getImportValidationContext();
  const detectHeaderRowUtil = getImportValidationUtil("detectHeaderRow");
  if (detectHeaderRowUtil) {
    return detectHeaderRowUtil(matrix, validationCtx.text, validationCtx.normalizeHeader, buildHeadersFromRow);
  }

  if (!Array.isArray(matrix) || !matrix.length) return null;

  const scanLimit = Math.min(matrix.length, 40);
  let bestIndex = -1;
  let bestScore = -1;

  for (let i = 0; i < scanLimit; i += 1) {
    const row = Array.isArray(matrix[i]) ? matrix[i] : [];
    const nonEmpty = row.filter(function (v) {
      return validationCtx.text(v) !== "";
    }).length;
    if (nonEmpty < 3) continue;

    const normalized = row.map(function (v) { return validationCtx.normalizeHeader(v); });
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
  const validationCtx = getImportValidationContext();
  const buildHeadersFromRowUtil = getImportValidationUtil("buildHeadersFromRow");
  if (buildHeadersFromRowUtil) {
    return buildHeadersFromRowUtil(rawHeader, validationCtx.text);
  }

  const out = [];
  const used = {};
  const total = Math.max(rawHeader.length, 1);

  for (let i = 0; i < total; i += 1) {
    let base = validationCtx.text(rawHeader[i]);
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
  const rowArrayToObjectUtil = getImportValidationUtil("rowArrayToObject");
  if (rowArrayToObjectUtil) {
    return rowArrayToObjectUtil(arr, headers);
  }

  const obj = {};
  for (let c = 0; c < headers.length; c += 1) {
    const key = headers[c];
    if (!key) continue;
    obj[key] = arr[c] == null ? "" : String(arr[c]).trim();
  }
  return obj;
}

function isRowEmpty(arr) {
  const validationCtx = getImportValidationContext();
  const isRowEmptyUtil = getImportValidationUtil("isRowEmpty");
  if (isRowEmptyUtil) {
    return isRowEmptyUtil(arr, validationCtx.text);
  }

  if (!Array.isArray(arr)) return true;
  return !arr.some(function (v) {
    return validationCtx.text(v) !== "";
  });
}

function renderStatus(status) {
  const statusCtx = getStatusContext();
  const renderStatusUtil = getStatusUtil("renderStatus");
  if (renderStatusUtil) {
    return renderStatusUtil(status, statusCtx.statusColor, statusCtx.escapeHtml);
  }

  const color = statusCtx.statusColor(status);
  return "<span class=\"badge\"><span class=\"dot\" style=\"background:" + color + "\"></span>" + statusCtx.escapeHtml(status) + "</span>";
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
  const statusCtx = getStatusContext();
  const normalizeStatusUtil = getStatusUtil("normalizeStatus");
  if (normalizeStatusUtil) {
    return normalizeStatusUtil(input, statusCtx.statusValues, statusCtx.normalizeLooseText);
  }
  const cleaned = statusCtx.normalizeLooseText(input);
  if (!cleaned) return "Recebido";
  const found = statusCtx.statusValues.find(function (st) {
    return statusCtx.normalizeLooseText(st) === cleaned;
  });
  return found || "Recebido";
}


function generateRandomMultiUserDemo() {
  const moduleFn = getImportControlsUtil("generateRandomMultiUserDemo");
  if (moduleFn) {
    return moduleFn(getImportControlsContext());
  }
  if (!Array.isArray(state.records) || state.records.length === 0) {
    state = { records: deepClone(DEMO).map(normalizeRecordShape) };
  }

  const sampleSize = Math.min(state.records.length, 20);
  const targets = state.records.slice(0, sampleSize);

  targets.forEach(function (rec, idx) {
    for (let i = 0; i < DEMO_MULTI_USERS.length; i += 1) {
      const u = DEMO_MULTI_USERS[i];
      const st = STATUS[Math.floor(Math.random() * STATUS.length)] || "";
      const note = (DEMO_NOTES[Math.floor(Math.random() * DEMO_NOTES.length)] || "") + " [demo #" + String(idx + 1) + "]";
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

// Configura eventos de login/cadastro do auth-gate interno da pagina principal.
function setupAuthUi() {
  return requireModuleFunction(getAuthUiUtil, "setupAuthUi", "authUiUtils")(getAuthUiContext());
}

// Carrega papeis permitidos no cadastro publico do auth-gate.
function syncRegisterRoles() {
  return requireModuleFunction(getAuthUiUtil, "syncRegisterRoles", "authUiUtils")(getAuthUiContext());
}

// Alterna entre formularios de login e cadastro no auth-gate.
function switchAuthMode(mode) {
  return requireModuleFunction(getAuthUiUtil, "switchAuthMode", "authUiUtils")(mode, getAuthUiContext());
}

function setAuthMessage(msg, isError) {
  return requireModuleFunction(getAuthSessionUtil, "setAuthMessage", "authSessionUtils")(msg, isError, getAuthSessionContext());
}

function showAuthGate(msg) {
  return requireModuleFunction(getAuthSessionUtil, "showAuthGate", "authSessionUtils")(msg, getAuthSessionContext());
}

function hideAuthGate() {
  return requireModuleFunction(getAuthSessionUtil, "hideAuthGate", "authSessionUtils")(getAuthSessionContext());
}

function extractApiError(err, fallback) {
  return requireModuleFunction(getAuthSessionUtil, "extractApiError", "authSessionUtils")(err, fallback, getAuthSessionContext());
}

// Trata sucesso de autenticacao: grava sessao, libera UI e sincroniza API.
function onAuthSuccess(resp) {
  return requireModuleFunction(getAuthFlowUtil, "onAuthSuccess", "authFlowUtils")(resp, getAuthFlowContext());
}

function readStorageValue(store, key) {
  if (store == null) return "";
  const readStorageValueUtil = getStorageUtil("readStorageValue");
  if (readStorageValueUtil) {
    return readStorageValueUtil(store, key);
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
  const writeStorageValueUtil = getStorageUtil("writeStorageValue");
  if (writeStorageValueUtil) {
    writeStorageValueUtil(store, key, raw);
    return;
  }
  try {
    store.setItem(key, raw);
  } catch (_err) {}
}

function removeStorageValue(store, key) {
  if (store == null) return;
  const removeStorageValueUtil = getStorageUtil("removeStorageValue");
  if (removeStorageValueUtil) {
    removeStorageValueUtil(store, key);
    return;
  }
  try {
    store.removeItem(key);
  } catch (_err) {}
}

// Persiste usuario autenticado no contexto local da UI.
function setAuthenticatedUser(usuario) {
  return requireModuleFunction(getAuthSessionUtil, "setAuthenticatedUser", "authSessionUtils")(usuario, getAuthSessionContext());
}

// Redireciona para login/cadastro preservando pagina de retorno.
function redirectToAuth(page, query) {
  return requireModuleFunction(getAuthSessionUtil, "redirectToAuth", "authSessionUtils")(page, query, getAuthSessionContext());
}
// Encerra sessao local e tenta logout remoto na API.
async function logoutCurrentUser() {
  return requireModuleFunction(getAuthFlowUtil, "logoutCurrentUser", "authFlowUtils")(getAuthFlowContext());
}

function isLocalFrontendContext() {
  return requireModuleFunction(getAuthFlowUtil, "isLocalFrontendContext", "authFlowUtils")(getAuthFlowContext());
}

function readStoredSessionToken() {
  return requireModuleFunction(getAuthSessionUtil, "readStoredSessionToken", "authSessionUtils")(getAuthSessionContext());
}

function writeStoredSessionToken(token) {
  return requireModuleFunction(getAuthSessionUtil, "writeStoredSessionToken", "authSessionUtils")(token, getAuthSessionContext());
}

function clearStoredSessionToken() {
  return requireModuleFunction(getAuthSessionUtil, "clearStoredSessionToken", "authSessionUtils")(getAuthSessionContext());
}

// Ponto de entrada da autenticacao ao abrir index.html.
async function initializeAuthFlow() {
  return requireModuleFunction(getAuthFlowUtil, "initializeAuthFlow", "authFlowUtils")(getAuthFlowContext());
}


// Carrega configuracao de usuario local (fallback quando API esta desativada).
function loadUserConfig(forcePrompt) {
  return requireModuleFunction(getAuthFlowUtil, "loadUserConfig", "authFlowUtils")(forcePrompt, getAuthFlowContext());
}

function getRoleAccessContext() {
  return {
    currentRole: CURRENT_ROLE,
    currentUser: CURRENT_USER,
    supportManagerRoles: SUPPORT_MANAGER_ROLES,
    isApiEnabled: isApiEnabled
  };
}

function isSupervisorUser() {
  return requireModuleFunction(getRoleAccessUtil, "isSupervisorUser", "roleAccessUtils")(getRoleAccessContext());
}

function isPowerBiUser() {
  return requireModuleFunction(getRoleAccessUtil, "isPowerBiUser", "roleAccessUtils")(getRoleAccessContext());
}

function isSupportManagerUser() {
  return requireModuleFunction(getRoleAccessUtil, "isSupportManagerUser", "roleAccessUtils")(getRoleAccessContext());
}

function getReadOnlyRoleMeta() {
  return requireModuleFunction(getRoleAccessUtil, "getReadOnlyRoleMeta", "roleAccessUtils")(getRoleAccessContext());
}

function isReadOnlyRoleUser() {
  return requireModuleFunction(getRoleAccessUtil, "isReadOnlyRoleUser", "roleAccessUtils")(getRoleAccessContext());
}

function getReadOnlyRoleMessage() {
  return requireModuleFunction(getRoleAccessUtil, "getReadOnlyRoleMessage", "roleAccessUtils")(getRoleAccessContext());
}

function getReadOnlyRoleLockLabel() {
  return requireModuleFunction(getRoleAccessUtil, "getReadOnlyRoleLockLabel", "roleAccessUtils")(getRoleAccessContext());
}

function isLockedStructuralField(fieldKey) {
  return LOCKED_STRUCTURAL_FIELD_KEYS.has(String(fieldKey || "").trim());
}

function canViewGlobalAuditApi() {
  return requireModuleFunction(getRoleAccessUtil, "canViewGlobalAuditApi", "roleAccessUtils")(getRoleAccessContext());
}

function canUseSupportApi() {
  return requireModuleFunction(getRoleAccessUtil, "canUseSupportApi", "roleAccessUtils")(getRoleAccessContext());
}

function canMutateRecords() {
  return requireModuleFunction(getRoleAccessUtil, "canMutateRecords", "roleAccessUtils")(getRoleAccessContext());
}

function clearEmendaLockTimer() {
  const clearEmendaLockTimerUtil = getConcurrencyUtil("clearEmendaLockTimer");
  if (clearEmendaLockTimerUtil) {
    clearEmendaLockTimerUtil();
    return;
  }
  if (!emendaLockTimer) return;
  clearInterval(emendaLockTimer);
  emendaLockTimer = null;
}

function setEmendaLockState(payload) {
  const setEmendaLockStateUtil = getConcurrencyUtil("setEmendaLockState");
  if (setEmendaLockStateUtil) {
    setEmendaLockStateUtil(payload);
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
  const isEmendaLockReadOnlyUtil = getConcurrencyUtil("isEmendaLockReadOnly");
  if (isEmendaLockReadOnlyUtil) {
    return !!isEmendaLockReadOnlyUtil();
  }
  return !!emendaLockReadOnly;
}

function getEmendaLockState() {
  const getEmendaLockStateUtil = getConcurrencyUtil("getEmendaLockState");
  if (getEmendaLockStateUtil) {
    const next = getEmendaLockStateUtil();
    return next && typeof next === "object" ? next : null;
  }
  return emendaLockState;
}

function setEmendaLockReadOnly(value) {
  const setEmendaLockReadOnlyUtil = getConcurrencyUtil("setEmendaLockReadOnly");
  if (setEmendaLockReadOnlyUtil) {
    setEmendaLockReadOnlyUtil(!!value);
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
  const readOnlyRoleMessage = getReadOnlyRoleMessage();
  const renderModalAccessStateUtil = getUiRenderUtil("renderModalAccessState");
  if (renderModalAccessStateUtil) {
    renderModalAccessStateUtil(modalAccessState, rec, {
      modalShown: !!(modal && modal.classList.contains("show")),
      canMutateRecords: canMutateRecords(),
      apiEnabled: isApiEnabled(),
      isReadOnly: isEmendaLockReadOnly(),
      lockState: getEmendaLockState(),
      readOnlyRoleMessage: readOnlyRoleMessage,
      fmtDateTime: fmtDateTime,
      emendaLockOwnerText: emendaLockOwnerText
    });
    return;
  }

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
      showAccessState("readonly", readOnlyRoleMessage || "MODO LEITURA: perfil monitor apenas.");
      return;
    }
    modalAccessState.classList.add("hidden");
    modalAccessState.classList.remove("access-mode-readonly", "access-mode-edit", "access-mode-warning");
    modalAccessState.textContent = "";
    return;
  }

  if (!canMutateRecords()) {
    showAccessState("readonly", readOnlyRoleMessage || "MODO LEITURA: perfil monitor apenas.");
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
  const readOnlyLockLabel = getReadOnlyRoleLockLabel();
  const renderEmendaLockInfoUtil = getUiRenderUtil("renderEmendaLockInfo");
  if (renderEmendaLockInfoUtil) {
    renderEmendaLockInfoUtil(livePresenceText, rec, {
      apiEnabled: isApiEnabled(),
      isSupervisor: isSupervisorUser(),
      isReadOnlyRole: isReadOnlyRoleUser(),
      readOnlyLockLabel: readOnlyLockLabel,
      isReadOnly: isEmendaLockReadOnly(),
      lockState: getEmendaLockState(),
      fmtDateTime: fmtDateTime,
      emendaLockOwnerText: emendaLockOwnerText
    });
    renderModalAccessState(rec);
    return;
  }

  let message = "";
  if (rec) {
    if (!isApiEnabled()) {
      message = "Modo local: lock de edicao indisponivel.";
    } else if (isReadOnlyRoleUser()) {
      const lockState = getEmendaLockState();
      const owner = emendaLockOwnerText(lockState);
      message = owner
        ? (readOnlyLockLabel + ". Em edicao por: " + owner + ".")
        : (readOnlyLockLabel + ".");
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
  const fetchEmendaLockStatusUtil = getConcurrencyUtil("fetchEmendaLockStatus");
  if (fetchEmendaLockStatusUtil) {
    return await fetchEmendaLockStatusUtil(rec);
  }
  const backendId = await ensureBackendEmenda(rec, { handleAuthFailure: false });
  return await apiRequest("GET", "/emendas/" + String(backendId) + "/lock", undefined, "UI", { handleAuthFailure: false });
}

async function acquireEmendaLock(rec, forceAcquire) {
  const acquireEmendaLockUtil = getConcurrencyUtil("acquireEmendaLock");
  if (acquireEmendaLockUtil) {
    return await acquireEmendaLockUtil(rec, forceAcquire);
  }
  const backendId = await ensureBackendEmenda(rec, { handleAuthFailure: false });
  return await apiRequest("POST", "/emendas/" + String(backendId) + "/lock/acquire", {
    force: !!forceAcquire
  }, "UI", { handleAuthFailure: false });
}

async function renewEmendaLock(rec) {
  const renewEmendaLockUtil = getConcurrencyUtil("renewEmendaLock");
  if (renewEmendaLockUtil) {
    return await renewEmendaLockUtil(rec);
  }
  const backendId = await ensureBackendEmenda(rec, { handleAuthFailure: false });
  return await apiRequest("POST", "/emendas/" + String(backendId) + "/lock/renew", {}, "UI", { handleAuthFailure: false });
}

async function releaseEmendaLock(rec) {
  const releaseEmendaLockUtil = getConcurrencyUtil("releaseEmendaLock");
  if (releaseEmendaLockUtil) {
    return await releaseEmendaLockUtil(rec);
  }
  if (!rec || !isApiEnabled()) return;
  const backendId = getBackendIdForRecord(rec) || await ensureBackendEmenda(rec, { handleAuthFailure: false });
  if (!backendId) return;
  await apiRequest("POST", "/emendas/" + String(backendId) + "/lock/release", {}, "UI", { handleAuthFailure: false });
}

async function tickEmendaLock() {
  const tickEmendaLockUtil = getConcurrencyUtil("tickEmendaLock");
  if (tickEmendaLockUtil) {
    await tickEmendaLockUtil();
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
  const startEmendaLockPollingUtil = getConcurrencyUtil("startEmendaLockPolling");
  if (startEmendaLockPollingUtil) {
    startEmendaLockPollingUtil();
    return;
  }
  clearEmendaLockTimer();
  if (!isApiEnabled()) return;
  emendaLockTimer = setInterval(function () {
    tickEmendaLock().catch(function () { /* no-op */ });
  }, EMENDA_LOCK_POLL_MS);
}

async function syncModalEmendaLock(rec) {
  const syncModalEmendaLockUtil = getConcurrencyUtil("syncModalEmendaLock");
  if (syncModalEmendaLockUtil) {
    await syncModalEmendaLockUtil(rec);
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
  const uiCtx = getUiRenderContext();
  const renderRoleNoticeUtil = getUiRenderUtil("renderRoleNotice");
  if (renderRoleNoticeUtil) {
    renderRoleNoticeUtil(roleNotice, uiCtx);
    return;
  }

  roleNotice.classList.toggle("hidden", !uiCtx.isReadOnlyRole);
  clearNodeChildren(roleNotice);
  if (uiCtx.isReadOnlyRole) {
    const h4 = document.createElement("h4");
    h4.textContent = uiCtx.roleNoticeTitle;
    const p = document.createElement("p");
    p.className = "muted small";
    p.textContent = uiCtx.roleNoticeDescription;
    roleNotice.appendChild(h4);
    roleNotice.appendChild(p);
    return;
  }
}

function clearBetaAuditPolling() {
  const moduleFn = getBetaSyncUtil("clearPollingTimer");
  if (moduleFn) {
    return moduleFn({
      getTimer: function () {
        return betaAuditPollTimer;
      },
      setTimer: function (nextTimer) {
        betaAuditPollTimer = nextTimer;
      }
    });
  }
  if (!betaAuditPollTimer) return;
  clearInterval(betaAuditPollTimer);
  betaAuditPollTimer = null;
}

function clearBetaSupportPolling() {
  const moduleFn = getBetaSyncUtil("clearPollingTimer");
  if (moduleFn) {
    return moduleFn({
      getTimer: function () {
        return betaSupportPollTimer;
      },
      setTimer: function (nextTimer) {
        betaSupportPollTimer = nextTimer;
      }
    });
  }
  if (!betaSupportPollTimer) return;
  clearInterval(betaSupportPollTimer);
  betaSupportPollTimer = null;
}

function clearApiStatePolling() {
  const moduleFn = getApiStateSyncUtil("clearPollingTimer");
  if (moduleFn) {
    return moduleFn({
      getTimer: function () {
        return apiStatePollTimer;
      },
      setTimer: function (nextTimer) {
        apiStatePollTimer = nextTimer;
      }
    });
  }
  if (!apiStatePollTimer) return;
  clearInterval(apiStatePollTimer);
  apiStatePollTimer = null;
}

async function refreshRemoteEmendasFromApi(forceRender) {
  const moduleFn = getApiStateSyncUtil("refreshRemoteEmendasFromApi");
  if (moduleFn) {
    return moduleFn(forceRender, getApiStateSyncContext());
  }
  if (!isApiEnabled()) return false;
  try {
    const remoteList = await apiRequest("GET", "/emendas", undefined, "API", { handleAuthFailure: false });
    mergeRemoteEmendas(Array.isArray(remoteList) ? remoteList : []);
    apiOnline = true;
    apiLastError = "";
    saveState(true);
    syncYearFilter();
    if (forceRender !== false) {
      render();
    }
    refreshOpenModalAfterRemoteSync();
    return true;
  } catch (err) {
    const status = Number(err && err.status ? err.status : 0);
    if (status >= 500 || status === 0) {
      apiOnline = false;
      apiLastError = err && err.message ? String(err.message) : "falha ao atualizar emendas";
      applyAccessProfile();
    }
    return false;
  }
}

function syncApiStatePolling() {
  const moduleFn = getApiStateSyncUtil("syncApiStatePolling");
  if (moduleFn) {
    return moduleFn({
      isApiEnabled: isApiEnabled,
      isApiOnline: function () {
        return apiOnline;
      },
      isWebSocketEnabled: API_WS_ENABLED,
      getTimer: function () {
        return apiStatePollTimer;
      },
      setTimer: function (nextTimer) {
        apiStatePollTimer = nextTimer;
      },
      clearPolling: clearApiStatePolling,
      refreshRemoteEmendas: refreshRemoteEmendasFromApi,
      intervalMs: API_STATE_POLL_MS
    });
  }
  if (!isApiEnabled() || !apiOnline || API_WS_ENABLED) {
    clearApiStatePolling();
    return;
  }
  if (apiStatePollTimer) return;
  apiStatePollTimer = setInterval(function () {
    refreshRemoteEmendasFromApi(true).catch(function () { /* no-op */ });
  }, API_STATE_POLL_MS);
}

function syncBetaAuditPolling() {
  const moduleFn = getBetaSyncUtil("syncPolling");
  if (moduleFn) {
    return moduleFn({
      shouldRun: function () {
        return canViewGlobalAuditApi() && apiOnline;
      },
      getTimer: function () {
        return betaAuditPollTimer;
      },
      setTimer: function (nextTimer) {
        betaAuditPollTimer = nextTimer;
      },
      onClear: clearBetaAuditPolling,
      tick: function () {
        return refreshBetaAuditFromApi(false);
      },
      intervalMs: BETA_AUDIT_POLL_MS
    });
  }
  if (!canViewGlobalAuditApi() || !apiOnline) {
    clearBetaAuditPolling();
    return;
  }
  if (betaAuditPollTimer) return;
  betaAuditPollTimer = setInterval(function () {
    refreshBetaAuditFromApi(false).catch(function () { /* no-op */ });
  }, BETA_AUDIT_POLL_MS);
}

function syncBetaSupportPolling() {
  const moduleFn = getBetaSyncUtil("syncPolling");
  if (moduleFn) {
    return moduleFn({
      shouldRun: function () {
        return canUseSupportApi() && apiOnline && getActiveBetaWorkspaceTab() === "support";
      },
      getTimer: function () {
        return betaSupportPollTimer;
      },
      setTimer: function (nextTimer) {
        betaSupportPollTimer = nextTimer;
      },
      onClear: clearBetaSupportPolling,
      tick: function () {
        return refreshBetaSupportFromApi(false);
      },
      intervalMs: BETA_SUPPORT_POLL_MS
    });
  }
  if (!canUseSupportApi() || !apiOnline || getActiveBetaWorkspaceTab() !== "support") {
    clearBetaSupportPolling();
    return;
  }
  if (betaSupportPollTimer) return;
  betaSupportPollTimer = setInterval(function () {
    refreshBetaSupportFromApi(false).catch(function () { /* no-op */ });
  }, BETA_SUPPORT_POLL_MS);
}

function getPreferredBetaWorkspaceTab() {
  return isPowerBiUser() ? "powerbi" : "history";
}

function getActiveBetaWorkspaceTab() {
  if (!betaWorkspaceTabTouched) {
    betaWorkspaceTab = getPreferredBetaWorkspaceTab();
  }
  if (betaWorkspaceTab !== "powerbi" && betaWorkspaceTab !== "history" && betaWorkspaceTab !== "support") {
    betaWorkspaceTab = getPreferredBetaWorkspaceTab();
  }
  return betaWorkspaceTab;
}

function setBetaWorkspaceTab(nextTab) {
  betaWorkspaceTab = nextTab === "powerbi" || nextTab === "support" ? nextTab : "history";
  betaWorkspaceTabTouched = true;
  syncBetaSupportPolling();
  if (betaWorkspaceTab === "support" && canUseSupportApi() && apiOnline) {
    refreshBetaSupportFromApi(true).catch(function () { /* no-op */ });
  }
  render();
}

function describeApiAuditRow(row) {
  if (!row) return "Evento";
  const type = text(row.tipo_evento || "");
  if (type === "OFFICIAL_STATUS") {
    return "Status oficial: " + text(row.valor_antigo || "-") + " -> " + text(row.valor_novo || "-");
  }
  if (type === "MARK_STATUS") {
    return "Marcacao de status: " + text(row.valor_novo || "-");
  }
  if (type === "EDIT_FIELD") {
    return "Edicao de campo: " + text(row.campo_alterado || "-");
  }
  if (type === "NOTE") {
    return "Nota adicionada";
  }
  if (type === "IMPORT") {
    return "Importacao/atualizacao de registro";
  }
  return type || "Evento";
}

function flattenLocalAuditRows(records) {
  const moduleFn = getBetaDataUtil("flattenLocalAuditRows");
  if (moduleFn) {
    return moduleFn(records, getBetaDataContext());
  }
  const out = [];
  (Array.isArray(records) ? records : []).forEach(function (rec) {
    (Array.isArray(rec && rec.eventos) ? rec.eventos : []).forEach(function (ev, idx) {
      const when = text(ev && ev.at);
      out.push({
        id: text(rec && rec.id) + ":" + String(idx) + ":" + when,
        source: "LOCAL",
        emenda_id: getBackendIdForRecord(rec),
        emenda_ref: text(rec && rec.id) || "-",
        emenda_identificacao: text(rec && rec.identificacao) || "-",
        usuario_nome: text(ev && ev.actor_user) || "sistema",
        setor: text(ev && ev.actor_role) || "-",
        tipo_evento: text(ev && ev.type) || "EVENTO",
        origem_evento: text(ev && ev.origin) || "LOCAL",
        campo_alterado: text(ev && ev.field) || "",
        valor_antigo: ev && Object.prototype.hasOwnProperty.call(ev, "from") ? text(ev.from) : "",
        valor_novo: ev && Object.prototype.hasOwnProperty.call(ev, "to") ? text(ev.to) : "",
        motivo: text(ev && ev.note) || "",
        data_hora: when,
        at_ts: new Date(when).getTime() || 0
      });
    });
  });
  out.sort(function (a, b) {
    return b.at_ts - a.at_ts;
  });
  return out;
}

function getAuditYearValue(row) {
  const when = text(row && row.data_hora);
  const d = new Date(when);
  const ts = d.getTime();
  if (!Number.isFinite(ts)) return "";
  return String(d.getFullYear());
}

function getAuditMonthValue(row) {
  const when = text(row && row.data_hora);
  const d = new Date(when);
  const ts = d.getTime();
  if (!Number.isFinite(ts)) return "";
  return String(d.getMonth() + 1).padStart(2, "0");
}

function buildAuditSearchBlob(row) {
  const meta = getAuditRecordMeta(row);
  return normalizeLooseText([
    text(row && row.usuario_nome),
    text(row && row.setor),
    text(row && row.tipo_evento),
    text(row && row.origem_evento),
    text(row && row.campo_alterado),
    text(row && row.valor_antigo),
    text(row && row.valor_novo),
    text(row && row.motivo),
    text(row && row.emenda_identificacao),
    text(row && row.emenda_municipio),
    text(row && row.emenda_deputado),
    text(meta && meta.code),
    text(meta && meta.detail)
  ].join(" "));
}

function buildAuditMonthOptions(rows, yearValue) {
  const moduleFn = getBetaDataUtil("buildAuditMonthOptions");
  if (moduleFn) {
    return moduleFn(rows, yearValue, getBetaDataContext());
  }
  const source = Array.isArray(rows) ? rows : [];
  const selectedYear = String(yearValue || "");
  const monthMap = {};
  source.forEach(function (row) {
    const year = getAuditYearValue(row);
    const month = getAuditMonthValue(row);
    if (!month) return;
    if (selectedYear && year !== selectedYear) return;
    monthMap[month] = true;
  });
  const labels = {
    "01": "01 - Janeiro",
    "02": "02 - Fevereiro",
    "03": "03 - Marco",
    "04": "04 - Abril",
    "05": "05 - Maio",
    "06": "06 - Junho",
    "07": "07 - Julho",
    "08": "08 - Agosto",
    "09": "09 - Setembro",
    "10": "10 - Outubro",
    "11": "11 - Novembro",
    "12": "12 - Dezembro"
  };
  return Object.keys(monthMap).sort().map(function (month) {
    return {
      label: labels[month] || month,
      value: month
    };
  });
}

function applyBetaAuditFilters(rows) {
  const moduleFn = getBetaDataUtil("applyBetaAuditFilters");
  if (moduleFn) {
    return moduleFn(rows, getBetaDataContext());
  }
  const source = Array.isArray(rows) ? rows : [];
  return source.filter(function (row) {
    if (betaAuditFilters.ano && getAuditYearValue(row) !== String(betaAuditFilters.ano)) return false;
    if (betaAuditFilters.mes && getAuditMonthValue(row) !== String(betaAuditFilters.mes).padStart(2, "0")) return false;
    if (betaAuditFilters.usuario && text(row && row.usuario_nome) !== betaAuditFilters.usuario) return false;
    if (betaAuditFilters.setor && text(row && row.setor) !== betaAuditFilters.setor) return false;
    if (betaAuditFilters.tipo_evento && text(row && row.tipo_evento) !== betaAuditFilters.tipo_evento) return false;
    if (betaAuditFilters.origem_evento && text(row && row.origem_evento) !== betaAuditFilters.origem_evento) return false;
    if (betaAuditFilters.q) {
      const queryText = normalizeLooseText(betaAuditFilters.q);
      if (!buildAuditSearchBlob(row).includes(queryText)) return false;
    }
    return true;
  });
}

function buildBetaAuditFilterOptions(rows) {
  const moduleFn = getBetaHistoryUtil("buildBetaAuditFilterOptions");
  if (moduleFn) {
    return moduleFn(rows, {
      getAuditYearValue: getAuditYearValue,
      buildAuditMonthOptions: buildAuditMonthOptions,
      text: text,
      filters: betaAuditFilters
    });
  }
  const source = Array.isArray(rows) ? rows : [];
  const years = Array.from(new Set(source.map(getAuditYearValue).filter(Boolean))).sort().reverse();
  const users = Array.from(new Set(source.map(function (row) { return text(row && row.usuario_nome); }).filter(Boolean))).sort();
  const roles = Array.from(new Set(source.map(function (row) { return text(row && row.setor); }).filter(Boolean))).sort();
  const eventTypes = Array.from(new Set(source.map(function (row) { return text(row && row.tipo_evento); }).filter(Boolean))).sort();
  const origins = Array.from(new Set(source.map(function (row) { return text(row && row.origem_evento); }).filter(Boolean))).sort();

  return {
    years: years,
    months: buildAuditMonthOptions(source, betaAuditFilters.ano),
    users: users,
    roles: roles,
    eventTypes: eventTypes,
    origins: origins
  };
}

function buildBetaAuditApiQuery() {
  const params = new URLSearchParams();
  params.set("limit", String(BETA_AUDIT_LIMIT));
  if (betaAuditFilters.ano) params.set("ano", String(betaAuditFilters.ano));
  if (betaAuditFilters.mes) params.set("mes", String(toInt(betaAuditFilters.mes)));
  if (betaAuditFilters.usuario) params.set("usuario", String(betaAuditFilters.usuario));
  if (betaAuditFilters.setor) params.set("setor", String(betaAuditFilters.setor));
  if (betaAuditFilters.tipo_evento) params.set("tipo_evento", String(betaAuditFilters.tipo_evento));
  if (betaAuditFilters.origem_evento) params.set("origem_evento", String(betaAuditFilters.origem_evento));
  if (betaAuditFilters.q) params.set("q", String(betaAuditFilters.q));
  return params.toString();
}

function getVisibleAuditRows(filteredRows) {
  const moduleFn = getBetaDataUtil("getVisibleAuditRows");
  if (moduleFn) {
    return moduleFn(filteredRows, getBetaDataContext());
  }
  const rows = Array.isArray(filteredRows) ? filteredRows : [];
  if (canViewGlobalAuditApi() && betaAuditRows.length) {
    return {
      source: "API",
      rows: applyBetaAuditFilters(betaAuditRows)
    };
  }
  return {
    source: "LOCAL",
    rows: applyBetaAuditFilters(flattenLocalAuditRows(rows))
  };
}

function getAuditRecordMeta(row) {
  const moduleFn = getBetaDataUtil("getAuditRecordMeta");
  if (moduleFn) {
    return moduleFn(row, getBetaDataContext());
  }
  if (!row) return { code: "-", detail: "-" };
  if (row.emenda_ref) {
    return {
      code: text(row.emenda_ref) || "-",
      detail: text(row.emenda_identificacao) || "-"
    };
  }
  if (row.emenda_identificacao) {
    const apiLabel = row.emenda_ano ? ("API#" + String(row.emenda_id || "-") + " / " + String(row.emenda_ano)) : ("API#" + String(row.emenda_id || "-"));
    const apiDetail = [
      text(row.emenda_identificacao),
      text(row.emenda_municipio),
      text(row.emenda_deputado)
    ].filter(Boolean).join(" | ");
    return {
      code: apiLabel,
      detail: apiDetail || text(row.emenda_identificacao) || "-"
    };
  }
  const backendId = Number(row.emenda_id || 0);
  const rec = backendId ? state.records.find(function (item) {
    return Number(item && item.backend_id ? item.backend_id : 0) === backendId;
  }) : null;
  if (rec) {
    return {
      code: text(rec.id) || ("API#" + String(backendId)),
      detail: text(rec.identificacao) || "-"
    };
  }
  return {
    code: backendId ? ("API#" + String(backendId)) : "-",
    detail: "-"
  };
}

async function refreshBetaAuditFromApi(forceRender) {
  const moduleFn = getBetaSyncUtil("refreshBetaAuditFromApi");
  if (moduleFn) {
    return moduleFn(forceRender, getBetaAuditSyncContext());
  }
  if (!canViewGlobalAuditApi()) {
    betaAuditRows = [];
    betaAuditError = isApiEnabled() ? "Perfil atual sem acesso ao historico global da API." : "";
    betaAuditLoading = false;
    if (forceRender) renderBetaWorkspace(getFiltered());
    return;
  }
  if (betaAuditLoading) return;

  betaAuditLoading = true;
  if (forceRender) renderBetaWorkspace(getFiltered());

  try {
    const remoteRows = await apiRequest("GET", "/audit?" + buildBetaAuditApiQuery(), undefined, "UI", { handleAuthFailure: false });
    betaAuditRows = (Array.isArray(remoteRows) ? remoteRows : []).map(function (row) {
      const when = text(row && row.data_hora);
      return Object.assign({}, row, {
        source: "API",
        data_hora: when,
        at_ts: new Date(when).getTime() || 0
      });
    }).sort(function (a, b) {
      return (b.at_ts || 0) - (a.at_ts || 0);
    });
    betaAuditError = "";
    betaAuditLastSyncAt = isoNow();
  } catch (err) {
    betaAuditError = extractApiError(err, "Falha ao carregar historico global da API.");
  } finally {
    betaAuditLoading = false;
    if (forceRender) renderBetaWorkspace(getFiltered());
  }
}

function getSupportScopeValue() {
  const moduleFn = getBetaDataUtil("getSupportScopeValue");
  if (moduleFn) {
    return moduleFn(getBetaDataContext());
  }
  if (!isSupportManagerUser()) return "mine";
  return betaSupportFilters.scope === "mine" ? "mine" : "all";
}

function getSupportThreadEmendaLabel(thread) {
  const moduleFn = getBetaDataUtil("getSupportThreadEmendaLabel");
  if (moduleFn) {
    return moduleFn(thread, getBetaDataContext());
  }
  const backendId = Number(thread && thread.emenda_id ? thread.emenda_id : 0);
  if (!backendId) return "";
  const rec = state.records.find(function (item) {
    return Number(item && item.backend_id ? item.backend_id : 0) === backendId;
  });
  if (!rec) return "Emenda #" + String(backendId);
  return String(rec.id || ("API#" + String(backendId))) + " | " + text(rec.identificacao || "-");
}

function buildSupportUserOptions(threads) {
  const betaDataModuleFn = getBetaDataUtil("buildSupportUserOptions");
  if (betaDataModuleFn) {
    return betaDataModuleFn(threads, getBetaDataContext());
  }
  const moduleFn = getBetaSupportUtil("buildSupportUserOptions");
  if (moduleFn) return moduleFn(threads, text);
  return Array.from(new Set((Array.isArray(threads) ? threads : []).map(function (item) {
    return text(item && item.usuario_nome);
  }).filter(Boolean))).sort();
}

function buildSupportApiQuery() {
  const moduleFn = getBetaDataUtil("buildSupportApiQuery");
  if (moduleFn) {
    return moduleFn(getBetaDataContext());
  }
  const params = new URLSearchParams();
  params.set("limit", String(BETA_SUPPORT_LIMIT));
  if (betaSupportFilters.status) params.set("status", String(betaSupportFilters.status));
  if (betaSupportFilters.categoria) params.set("categoria", String(betaSupportFilters.categoria));
  if (betaSupportFilters.usuario) params.set("usuario", String(betaSupportFilters.usuario));
  if (betaSupportFilters.q) params.set("q", String(betaSupportFilters.q));
  if (getSupportScopeValue() !== "all") params.set("mine_only", "true");
  return params.toString();
}

async function refreshBetaSupportMessagesFromApi(forceRender, threadId) {
  const moduleFn = getBetaSyncUtil("refreshBetaSupportMessagesFromApi");
  if (moduleFn) {
    return moduleFn(forceRender, threadId, getBetaSupportSyncContext());
  }
  const id = Number(threadId || betaSupportSelectedThreadId || 0);
  if (!id || !canUseSupportApi()) {
    betaSupportMessages = [];
    betaSupportMessagesError = "";
    betaSupportMessagesLoading = false;
    if (forceRender) renderBetaWorkspace(getFiltered());
    return;
  }
  betaSupportMessagesLoading = true;
  if (forceRender) renderBetaWorkspace(getFiltered());
  try {
    const rows = await apiRequest("GET", "/support/threads/" + String(id) + "/messages", undefined, "UI", { handleAuthFailure: false });
    betaSupportMessages = Array.isArray(rows) ? rows : [];
    betaSupportMessagesError = "";
  } catch (err) {
    betaSupportMessagesError = extractApiError(err, "Falha ao carregar mensagens do suporte.");
  } finally {
    betaSupportMessagesLoading = false;
    if (forceRender) renderBetaWorkspace(getFiltered());
  }
}

async function refreshBetaSupportFromApi(forceRender) {
  const moduleFn = getBetaSyncUtil("refreshBetaSupportFromApi");
  if (moduleFn) {
    return moduleFn(forceRender, getBetaSupportSyncContext());
  }
  if (!canUseSupportApi()) {
    betaSupportThreads = [];
    betaSupportMessages = [];
    betaSupportError = isApiEnabled() ? "Sessao necessaria para usar suporte." : "Suporte exige API ativa.";
    betaSupportLoading = false;
    if (forceRender) renderBetaWorkspace(getFiltered());
    return;
  }
  if (betaSupportLoading) return;

  betaSupportLoading = true;
  if (forceRender) renderBetaWorkspace(getFiltered());
  try {
    const rows = await apiRequest("GET", "/support/threads?" + buildSupportApiQuery(), undefined, "UI", { handleAuthFailure: false });
    betaSupportThreads = Array.isArray(rows) ? rows : [];
    betaSupportError = "";
    betaSupportLastSyncAt = isoNow();
    const stillSelected = betaSupportThreads.some(function (item) {
      return Number(item && item.id ? item.id : 0) === Number(betaSupportSelectedThreadId || 0);
    });
    if (!stillSelected) {
      betaSupportSelectedThreadId = betaSupportThreads.length ? Number(betaSupportThreads[0].id || 0) : 0;
    }
    if (betaSupportSelectedThreadId) {
      await refreshBetaSupportMessagesFromApi(false, betaSupportSelectedThreadId);
    } else {
      betaSupportMessages = [];
      betaSupportMessagesError = "";
    }
  } catch (err) {
    betaSupportError = extractApiError(err, "Falha ao carregar chamados de suporte.");
  } finally {
    betaSupportLoading = false;
    if (forceRender) renderBetaWorkspace(getFiltered());
    syncBetaSupportPolling();
  }
}

function getBetaAuditSyncContext() {
  return {
    canViewGlobalAuditApi: canViewGlobalAuditApi,
    isApiEnabled: isApiEnabled,
    isLoading: function () {
      return betaAuditLoading;
    },
    setLoading: function (nextLoading) {
      betaAuditLoading = !!nextLoading;
    },
    setRows: function (rows) {
      betaAuditRows = Array.isArray(rows) ? rows : [];
    },
    setError: function (message) {
      betaAuditError = String(message || "");
    },
    setLastSyncAt: function (value) {
      betaAuditLastSyncAt = value || "";
    },
    renderWorkspace: function () {
      renderBetaWorkspace(getFiltered());
    },
    apiRequest: apiRequest,
    buildQuery: buildBetaAuditApiQuery,
    extractApiError: extractApiError,
    isoNow: isoNow,
    text: text
  };
}

function getBetaSupportSyncContext() {
  return {
    canUseSupportApi: canUseSupportApi,
    isApiEnabled: isApiEnabled,
    isLoading: function () {
      return betaSupportLoading;
    },
    setLoading: function (nextLoading) {
      betaSupportLoading = !!nextLoading;
    },
    setThreads: function (threads) {
      betaSupportThreads = Array.isArray(threads) ? threads : [];
    },
    setMessages: function (messages) {
      betaSupportMessages = Array.isArray(messages) ? messages : [];
    },
    setError: function (message) {
      betaSupportError = String(message || "");
    },
    setMessagesError: function (message) {
      betaSupportMessagesError = String(message || "");
    },
    isMessagesLoading: function () {
      return betaSupportMessagesLoading;
    },
    setMessagesLoading: function (nextLoading) {
      betaSupportMessagesLoading = !!nextLoading;
    },
    setLastSyncAt: function (value) {
      betaSupportLastSyncAt = value || "";
    },
    getSelectedThreadId: function () {
      return Number(betaSupportSelectedThreadId || 0);
    },
    setSelectedThreadId: function (threadId) {
      betaSupportSelectedThreadId = Number(threadId || 0);
    },
    renderWorkspace: function () {
      renderBetaWorkspace(getFiltered());
    },
    apiRequest: apiRequest,
    buildQuery: buildSupportApiQuery,
    refreshMessages: function (nextForceRender, threadId) {
      return refreshBetaSupportMessagesFromApi(nextForceRender, threadId);
    },
    syncPolling: function () {
      syncBetaSupportPolling();
    },
    extractApiError: extractApiError,
    isoNow: isoNow
  };
}

function getBetaSupportContext() {
  return {
    threads: betaSupportThreads,
    loading: betaSupportLoading,
    filters: betaSupportFilters,
    lastSyncAt: betaSupportLastSyncAt,
    error: betaSupportError,
    selectedThreadId: betaSupportSelectedThreadId,
    messages: betaSupportMessages,
    messagesError: betaSupportMessagesError,
    messagesLoading: betaSupportMessagesLoading,
    clearNodeChildren: clearNodeChildren,
    isSupportManagerUser: isSupportManagerUser,
    canUseSupportApi: canUseSupportApi,
    isApiEnabled: isApiEnabled,
    getSupportScopeValue: getSupportScopeValue,
    refreshSupportFromApi: refreshBetaSupportFromApi,
    refreshSupportMessagesFromApi: refreshBetaSupportMessagesFromApi,
    setSelectOptions: setSelectOptions,
    supportCategories: SUPPORT_CATEGORIES,
    supportThreadStatus: SUPPORT_THREAD_STATUS,
    supportFilterDefaults: BETA_SUPPORT_FILTER_DEFAULTS,
    getBackendIdForRecord: getBackendIdForRecord,
    text: text,
    fmtDateTime: fmtDateTime,
    normalizeLooseText: normalizeLooseText,
    toInt: toInt,
    apiRequest: apiRequest,
    extractApiError: extractApiError,
    getSupportThreadEmendaLabel: getSupportThreadEmendaLabel,
    rerender: function () {
      renderBetaWorkspace(getFiltered());
    },
    setSupportFilters: function (nextFilters) {
      betaSupportFilters = nextFilters;
    },
    setSelectedThreadId: function (threadId) {
      betaSupportSelectedThreadId = Number(threadId || 0);
    },
    setMessagesError: function (message) {
      betaSupportMessagesError = String(message || "");
    }
  };
}

function getBetaDataContext() {
  return {
    filters: betaAuditFilters,
    supportLimit: BETA_SUPPORT_LIMIT,
    text: text,
    normalizeLooseText: normalizeLooseText,
    getBackendIdForRecord: getBackendIdForRecord,
    canViewGlobalAuditApi: canViewGlobalAuditApi,
    getBetaAuditRows: function () {
      return betaAuditRows;
    },
    findRecordByBackendId: function (backendId) {
      return state.records.find(function (item) {
        return Number(item && item.backend_id ? item.backend_id : 0) === Number(backendId || 0);
      });
    },
    isSupportManagerUser: isSupportManagerUser,
    getSupportFilters: function () {
      return betaSupportFilters;
    }
  };
}

function getModalSectionsContext() {
  return {
    titleEl: modalTitle,
    subtitleEl: modalSub,
    kv: kv,
    historyEl: historyEl,
    conflictBox: conflictBox,
    conflictText: conflictText,
    userProgressBox: userProgressBox,
    realTimeUserPanelEnabled: REALTIME_USER_PANEL_ENABLED,
    syncModalRecordHeader: getUiRenderUtil("syncModalRecordHeader"),
    renderHistoryToContainer: getUiRenderUtil("renderHistoryToContainer"),
    getEventsSorted: getEventsSorted,
    clearNodeChildren: clearNodeChildren,
    uiCtx: getUiRenderContext(),
    getActiveUsersWithLastMark: getActiveUsersWithLastMark,
    calcProgress: calcProgress,
    whoIsDelaying: whoIsDelaying,
    getAttentionIssues: getAttentionIssues,
    getLastMarksByUser: getLastMarksByUser,
    renderMarksSummary: renderMarksSummary,
    renderRawFields: renderRawFields,
    renderUserProgressBox: renderUserProgressBox,
    renderConflictState: getUiRenderUtil("renderConflictState"),
    renderHistory: renderHistoryFallback,
    applyModalAccessProfile: applyModalAccessProfile,
    renderProgressBar: renderProgressBar,
    renderMemberChips: renderMemberChips
  };
}

function getModalDraftStateContext() {
  return {
    MODAL_FIELD_ORDER: MODAL_FIELD_ORDER,
    MODAL_DRAFT_STORAGE_PREFIX: MODAL_DRAFT_STORAGE_PREFIX,
    CURRENT_USER: CURRENT_USER,
    CURRENT_ROLE: CURRENT_ROLE,
    markStatus: markStatus,
    markReason: markReason,
    getModalDraftState: function () {
      return modalDraftState;
    },
    setModalDraftState: function (nextState) {
      modalDraftState = nextState;
    },
    getModalFieldType: getModalFieldType,
    normalizeDraftFieldValue: normalizeDraftFieldValue,
    parseDraftFieldValue: parseDraftFieldValue,
    updateModalDraftUi: updateModalDraftUi,
    canMutateRecords: canMutateRecords,
    isEmendaLockReadOnly: isEmendaLockReadOnly,
    getReadOnlyRoleMessage: getReadOnlyRoleMessage,
    hasFieldChanged: hasFieldChanged,
    normalizeStatus: normalizeStatus,
    readStorageValue: readStorageValue,
    writeStorageValue: writeStorageValue,
    removeStorageValue: removeStorageValue,
    shallowCloneObj: shallowCloneObj,
    deepClone: deepClone,
    isoNow: isoNow,
    clearModalSaveFeedback: clearModalSaveFeedback,
    scheduleModalAutosave: scheduleModalAutosave
  };
}

function getModalSaveContext() {
  return {
    MODAL_AUTOSAVE_DEBOUNCE_MS: MODAL_AUTOSAVE_DEBOUNCE_MS,
    modal: modal,
    kv: kv,
    kvDraftHint: kvDraftHint,
    modalSaveGuard: modalSaveGuard,
    btnKvSave: btnKvSave,
    modalSaveFeedback: modalSaveFeedback,
    markStatus: markStatus,
    markReason: markReason,
    setModalSaveFeedbackState: getUiRenderUtil("setModalSaveFeedbackState"),
    updateModalDraftUiRenderer: getUiRenderUtil("updateModalDraftUi"),
    fmtDateTime: fmtDateTime,
    getModalAutosaveTimer: function () {
      return modalAutosaveTimer;
    },
    setModalAutosaveTimer: function (nextTimer) {
      modalAutosaveTimer = nextTimer;
    },
    getModalSaveFeedbackTimer: function () {
      return modalSaveFeedbackTimer;
    },
    setModalSaveFeedbackTimer: function (nextTimer) {
      modalSaveFeedbackTimer = nextTimer;
    },
    getModalDraftSavePromise: function () {
      return modalDraftSavePromise;
    },
    setModalDraftSavePromise: function (nextPromise) {
      modalDraftSavePromise = nextPromise;
    },
    getModalDraftState: function () {
      return modalDraftState;
    },
    setModalDraftState: function (nextState) {
      modalDraftState = nextState;
    },
    getSelected: getSelected,
    canMutateRecords: canMutateRecords,
    isEmendaLockReadOnly: isEmendaLockReadOnly,
    getReadOnlyRoleMessage: getReadOnlyRoleMessage,
    isModalDraftDirty: isModalDraftDirty,
    hasPendingModalAction: hasPendingModalAction,
    hasModalMarkDraft: hasModalMarkDraft,
    hasPendingModalDraft: hasPendingModalDraft,
    canSaveDraftNow: canSaveDraftNow,
    getDraftSaveBlockReason: getDraftSaveBlockReason,
    clearPersistedModalDraft: clearPersistedModalDraft,
    persistModalDraftSnapshot: persistModalDraftSnapshot,
    clearModalAutoCloseTimer: clearModalAutoCloseTimer,
    clearModalStatusDraftInputs: clearModalStatusDraftInputs,
    saveState: saveState,
    notifyStateUpdated: notifyStateUpdated,
    render: render,
    rebaseModalDraftAfterSave: rebaseModalDraftAfterSave,
    refreshOpenModalAfterSave: refreshOpenModalAfterSave,
    openModal: openModal,
    deepClone: deepClone,
    mkEvent: mkEvent,
    isLockedStructuralField: isLockedStructuralField,
    getModalFieldType: getModalFieldType,
    getModalFieldLabel: getModalFieldLabel,
    normalizeDraftFieldValue: normalizeDraftFieldValue,
    hasFieldChanged: hasFieldChanged,
    stringifyFieldValue: stringifyFieldValue,
    syncCanonicalToAllFields: syncCanonicalToAllFields,
    buildReferenceKey: buildReferenceKey,
    normalizeStatus: normalizeStatus,
    syncGenericEventToApi: syncGenericEventToApi,
    rollbackSaveAndReport: rollbackSaveAndReport,
    isoNow: isoNow
  };
}

function getModalShellContext() {
  return {
    state: state,
    modal: modal,
    modalClose: modalClose,
    modalTitle: modalTitle,
    modalSub: modalSub,
    modalAccessState: modalAccessState,
    markStatus: markStatus,
    markReason: markReason,
    syncModalRecordHeader: getUiRenderUtil("syncModalRecordHeader"),
    getSelectedId: function () {
      return selectedId;
    },
    setSelectedId: function (nextId) {
      selectedId = nextId;
    },
    getSelected: getSelected,
    getLastFocusedElement: function () {
      return lastFocusedElement;
    },
    setLastFocusedElement: function (nextEl) {
      lastFocusedElement = nextEl;
    },
    getModalCloseInProgress: function () {
      return modalCloseInProgress;
    },
    setModalCloseInProgress: function (nextValue) {
      modalCloseInProgress = !!nextValue;
    },
    setModalDraftState: function (nextState) {
      modalDraftState = nextState;
    },
    canMutateRecords: canMutateRecords,
    isEmendaLockReadOnly: isEmendaLockReadOnly,
    hasPendingModalDraft: hasPendingModalDraft,
    canSaveDraftNow: canSaveDraftNow,
    saveModalDraftChanges: saveModalDraftChanges,
    clearPersistedModalDraft: clearPersistedModalDraft,
    flushModalAutosave: flushModalAutosave,
    clearModalAutoCloseTimer: clearModalAutoCloseTimer,
    clearModalAutosaveTimer: clearModalAutosaveTimer,
    clearModalSaveFeedback: clearModalSaveFeedback,
    clearModalStatusDraftInputs: clearModalStatusDraftInputs,
    clearEmendaLockTimer: clearEmendaLockTimer,
    setEmendaLockState: setEmendaLockState,
    setEmendaLockReadOnly: setEmendaLockReadOnly,
    initModalDraftForRecord: initModalDraftForRecord,
    renderKvEditor: renderKvEditor,
    refreshModalSectionsForRecord: refreshModalSectionsForRecord,
    renderEmendaLockInfo: renderEmendaLockInfo,
    syncModalEmendaLock: syncModalEmendaLock,
    announcePresenceForRecord: announcePresenceForRecord,
    releaseEmendaLock: releaseEmendaLock,
    setAuxModalVisibility: setAuxModalVisibility,
    showModalSaveFeedback: showModalSaveFeedback,
    focusIfPossible: focusIfPossible,
    updateModalDraftUi: updateModalDraftUi
  };
}

function getAuthUiContext() {
  return {
    authGate: authGate,
    authTabLogin: authTabLogin,
    authTabRegister: authTabRegister,
    authLoginForm: authLoginForm,
    authRegisterForm: authRegisterForm,
    authLoginName: authLoginName,
    authLoginPassword: authLoginPassword,
    authRegisterName: authRegisterName,
    authRegisterRole: authRegisterRole,
    authRegisterPassword: authRegisterPassword,
    authRegisterPassword2: authRegisterPassword2,
    PUBLIC_SELF_REGISTER_ROLE_OPTIONS: PUBLIC_SELF_REGISTER_ROLE_OPTIONS,
    clearNodeChildren: clearNodeChildren,
    setAuthMessage: setAuthMessage,
    apiRequestPublic: apiRequestPublic,
    onAuthSuccess: onAuthSuccess,
    extractApiError: extractApiError,
    normalizeUserRole: normalizeUserRole
  };
}

function resetBetaWorkspaceTabsState() {
  betaWorkspaceTabTouched = false;
  betaWorkspaceTab = getPreferredBetaWorkspaceTab();
}

function resetBetaAuditStateLocal() {
  betaAuditRows = [];
  betaAuditError = "";
  betaAuditLoading = false;
}

function resetBetaSupportStateLocal() {
  betaSupportThreads = [];
  betaSupportMessages = [];
  betaSupportError = "";
  betaSupportMessagesError = "";
  betaSupportLoading = false;
  betaSupportMessagesLoading = false;
}

function readAuthenticatedProfileFromStore() {
  const fn = getAuthStoreUtil("readAuthenticatedProfile");
  return fn ? fn(AUTH_KEYS) : null;
}

function readLegacyAuthenticatedProfileFromStore() {
  const fn = getAuthStoreUtil("readLegacyAuthenticatedProfile");
  return fn ? fn(AUTH_KEYS) : null;
}

function writeAuthenticatedProfileToStore(profile) {
  const fn = getAuthStoreUtil("writeAuthenticatedProfile");
  if (fn) {
    fn(profile, AUTH_KEYS);
  }
}

function clearSessionAndProfileFromStore() {
  const fn = getAuthStoreUtil("clearSessionAndProfile");
  if (fn) {
    fn(AUTH_KEYS);
    return;
  }
  clearStoredSessionToken();
}

function readStoredSessionTokenFromStore() {
  const fn = getAuthStoreUtil("readStoredSessionToken");
  return fn ? fn(AUTH_KEYS) : "";
}

function writeStoredSessionTokenToStore(token) {
  const fn = getAuthStoreUtil("writeStoredSessionToken");
  if (fn) {
    fn(token, AUTH_KEYS);
  }
}

function clearStoredSessionTokenFromStore() {
  const fn = getAuthStoreUtil("clearStoredSessionToken");
  if (fn) {
    fn(AUTH_KEYS);
  }
}

function writeApiBaseUrlToStorage(value) {
  writeStorageValue(localStorage, API_BASE_URL_KEY, value);
}

function detectLocalFrontendRuntimeContext() {
  const moduleFn = getAuthGuardUtil("isLocalFrontendContext");
  if (moduleFn) {
    return moduleFn();
  }
  const host = (typeof window !== "undefined" && window.location && window.location.hostname)
    ? String(window.location.hostname)
    : "";
  return !host || host === "localhost" || host === "127.0.0.1";
}

function rerenderBetaWorkspaceFiltered() {
  renderBetaWorkspace(getFiltered());
}

function getAuthSessionContext() {
  return {
    authGate: authGate,
    authMsg: authMsg,
    authLoginPage: AUTH_LOGIN_PAGE,
    nextPath: "index.html",
    authStoreRedirect: function (page, query, nextPath) {
      const redirectToAuthUtil = getAuthStoreUtil("redirectToAuth");
      if (redirectToAuthUtil) {
        redirectToAuthUtil(page, query, nextPath);
      }
    },
    extractApiErrorFromFormat: function (err, fallback) {
      const extractApiErrorUtil = getFormatUtil("extractApiError");
      return extractApiErrorUtil ? extractApiErrorUtil(err, fallback) : fallback;
    },
    getCurrentUser: function () {
      return CURRENT_USER;
    },
    setCurrentUser: function (value) {
      CURRENT_USER = value;
    },
    getCurrentRole: function () {
      return CURRENT_ROLE;
    },
    setCurrentRole: function (value) {
      CURRENT_ROLE = value;
    },
    normalizeUserRole: normalizeUserRole,
    resetBetaWorkspaceTabs: resetBetaWorkspaceTabsState,
    writeAuthenticatedProfile: writeAuthenticatedProfileToStore,
    authStoreReadStoredSessionToken: readStoredSessionTokenFromStore,
    authStoreWriteStoredSessionToken: writeStoredSessionTokenToStore,
    authStoreClearStoredSessionToken: clearStoredSessionTokenFromStore
  };
}

function getLocalStateContext() {
  return {
    storageKey: STORAGE_KEY,
    legacyStorageKeys: LEGACY_STORAGE_KEYS,
    crossTabPingKey: CROSS_TAB_PING_KEY,
    localTabId: LOCAL_TAB_ID,
    stateChannel: stateChannel,
    demoRecords: DEMO,
    getPrimaryStorage: getPrimaryStorage,
    getSecondaryStorage: getSecondaryStorage,
    readStorageValue: readStorageValue,
    writeStorageValue: writeStorageValue,
    deepClone: deepClone,
    normalizeRecordShape: normalizeRecordShape,
    migrateLegacyStatusRecords: migrateLegacyStatusRecords,
    syncReferenceKeys: syncReferenceKeys,
    syncYearFilter: syncYearFilter,
    render: render,
    getState: function () {
      return state;
    },
    setState: function (nextState) {
      state = nextState;
    },
    getActiveUsersWithLastMark: getActiveUsersWithLastMark
  };
}

function getAuthFlowContext() {
  return {
    authLoginPage: AUTH_LOGIN_PAGE,
    isApiEnabled: isApiEnabled,
    setAuthMessage: setAuthMessage,
    writeStoredSessionToken: writeStoredSessionToken,
    readStoredSessionToken: readStoredSessionToken,
    clearStoredSessionToken: clearStoredSessionToken,
    setAuthenticatedUser: setAuthenticatedUser,
    hideAuthGate: hideAuthGate,
    applyAccessProfile: applyAccessProfile,
    bootstrapApiIntegration: bootstrapApiIntegration,
    connectApiSocket: connectApiSocket,
    closeApiSocket: closeApiSocket,
    apiRequest: apiRequest,
    redirectToAuth: redirectToAuth,
    writeApiBaseUrl: writeApiBaseUrlToStorage,
    detectLocalFrontendContext: detectLocalFrontendRuntimeContext,
    clearSessionAndProfile: clearSessionAndProfileFromStore,
    clearBetaAuditPolling: clearBetaAuditPolling,
    clearBetaSupportPolling: clearBetaSupportPolling,
    resetBetaAuditState: resetBetaAuditStateLocal,
    resetBetaSupportState: resetBetaSupportStateLocal,
    readAuthenticatedProfile: readAuthenticatedProfileFromStore,
    readLegacyAuthenticatedProfile: readLegacyAuthenticatedProfileFromStore,
    writeAuthenticatedProfile: writeAuthenticatedProfileToStore,
    getCurrentUser: function () {
      return CURRENT_USER;
    },
    setCurrentUser: function (value) {
      CURRENT_USER = String(value || CURRENT_USER).trim() || CURRENT_USER;
    },
    getCurrentRole: function () {
      return CURRENT_ROLE;
    },
    setCurrentRole: function (value) {
      CURRENT_ROLE = value;
    },
    normalizeUserRole: normalizeUserRole,
    resetBetaWorkspaceTabs: resetBetaWorkspaceTabsState,
    render: render
  };
}

function getAppLifecycleContext() {
  return {
    stateChannel: stateChannel,
    STORAGE_KEY: STORAGE_KEY,
    CROSS_TAB_PING_KEY: CROSS_TAB_PING_KEY,
    LOCAL_TAB_ID: LOCAL_TAB_ID,
    refreshStateFromStorage: refreshStateFromStorage,
    initSelects: initSelects,
    setupAuthUi: setupAuthUi,
    render: render,
    initializeAuthFlow: initializeAuthFlow
  };
}

function getApiStateSyncContext() {
  return {
    isApiEnabled: isApiEnabled,
    apiRequest: apiRequest,
    mergeRemoteEmendas: mergeRemoteEmendas,
    setApiOnline: function (nextOnline) {
      apiOnline = !!nextOnline;
    },
    setApiLastError: function (message) {
      apiLastError = String(message || "");
    },
    saveState: saveState,
    syncYearFilter: syncYearFilter,
    render: render,
    refreshOpenModalAfterRemoteSync: refreshOpenModalAfterRemoteSync,
    applyAccessProfile: applyAccessProfile
  };
}

function getApiSyncOpsContext() {
  return {
    isApiEnabled: isApiEnabled,
    apiRequest: apiRequest,
    text: text,
    toInt: toInt,
    toNumber: toNumber,
    currentYear: currentYear,
    deriveStatusForBackend: deriveStatusForBackend,
    quickHashString: quickHashString,
    exportScopeAtuais: EXPORT_SCOPE.ATUAIS,
    getApiEmendaIdByInterno: function (idInterno) {
      return apiEmendaIdByInterno[idInterno];
    },
    setApiEmendaIdByInterno: function (idInterno, backendId) {
      apiEmendaIdByInterno[idInterno] = backendId;
    },
    setApiOnline: function (nextOnline) {
      apiOnline = !!nextOnline;
    },
    setApiLastError: function (message) {
      apiLastError = String(message || "");
    },
    applyAccessProfile: applyAccessProfile,
    refreshBetaAuditFromApi: refreshBetaAuditFromApi,
    saveState: saveState,
    render: render,
    getSelectedId: function () {
      return selectedId;
    },
    openModal: openModal,
    isApiConflictError: isApiConflictError,
    refreshRecordConcurrencyFromApi: refreshRecordConcurrencyFromApi,
    conflictMessageFromError: conflictMessageFromError,
    showModalSaveFeedback: showModalSaveFeedback,
    restoreRecordFromSnapshot: restoreRecordFromSnapshot
  };
}

function getRecordModelContext() {
  return {
    currentUser: CURRENT_USER,
    currentRole: CURRENT_ROLE,
    systemMigrationUser: SYSTEM_MIGRATION_USER,
    systemMigrationRole: SYSTEM_MIGRATION_ROLE,
    isoNow: isoNow,
    asText: asText,
    text: text,
    toInt: toInt,
    toNumber: toNumber,
    currentYear: currentYear,
    normalizeStatus: normalizeStatus,
    normalizeLooseText: normalizeLooseText,
    buildReferenceKey: buildReferenceKey,
    syncCanonicalToAllFields: syncCanonicalToAllFields,
    getEventsSorted: getEventsSorted,
    getRecords: function () {
      return Array.isArray(state && state.records) ? state.records : [];
    },
    setRecords: function (nextRecords) {
      state.records = Array.isArray(nextRecords) ? nextRecords : [];
    }
  };
}

function resetApiLinkedState(options) {
  const moduleFn = getApiStateSyncUtil("resetApiLinkedState");
  if (moduleFn) {
    return moduleFn(Object.assign({
      closeApiSocket: closeApiSocket,
      clearBetaAuditPolling: clearBetaAuditPolling,
      clearBetaSupportPolling: clearBetaSupportPolling,
      clearApiStatePolling: clearApiStatePolling,
      resetBetaAuditState: resetBetaAuditStateLocal,
      resetBetaSupportState: resetBetaSupportStateLocal,
      setApiOnline: function (nextOnline) {
        apiOnline = !!nextOnline;
      },
      setApiLastError: function (message) {
        apiLastError = String(message || "");
      }
    }, options || {}));
  }

  const opts = options && typeof options === "object" ? options : {};
  closeApiSocket();
  clearBetaAuditPolling();
  clearBetaSupportPolling();
  clearApiStatePolling();
  resetBetaAuditStateLocal();
  resetBetaSupportStateLocal();
  apiOnline = Object.prototype.hasOwnProperty.call(opts, "apiOnline") ? !!opts.apiOnline : false;
  apiLastError = Object.prototype.hasOwnProperty.call(opts, "apiLastError") ? String(opts.apiLastError || "") : "";
}

function getBetaHistoryContext() {
  return {
    filters: betaAuditFilters,
    auditRows: betaAuditRows,
    loading: betaAuditLoading,
    error: betaAuditError,
    lastSyncAt: betaAuditLastSyncAt,
    auditLimit: BETA_AUDIT_LIMIT,
    auditFilterDefaults: BETA_AUDIT_FILTER_DEFAULTS,
    clearNodeChildren: clearNodeChildren,
    text: text,
    fmtDateTime: fmtDateTime,
    setSelectOptions: setSelectOptions,
    canViewGlobalAuditApi: canViewGlobalAuditApi,
    refreshBetaAuditFromApi: refreshBetaAuditFromApi,
    buildAuditMonthOptions: buildAuditMonthOptions,
    getVisibleAuditRows: getVisibleAuditRows,
    flattenLocalAuditRows: flattenLocalAuditRows,
    getAuditRecordMeta: getAuditRecordMeta,
    describeApiAuditRow: describeApiAuditRow,
    describeEventForPanel: describeEventForPanel,
    getAuditYearValue: getAuditYearValue,
    rerender: rerenderBetaWorkspaceFiltered,
    setAuditFilters: function (nextFilters) {
      betaAuditFilters = nextFilters;
    }
  };
}

function getBetaPowerBiContext() {
  return {
    filters: betaPowerBiFilters,
    filterDefaults: BETA_POWERBI_FILTER_DEFAULTS,
    clearNodeChildren: clearNodeChildren,
    buildPowerBiDashboardData: buildPowerBiDashboardData,
    exportExecutiveDashboardReport: exportExecutiveDashboardReport,
    extractApiError: extractApiError,
    setSelectOptions: setSelectOptions,
    fmtMoney: fmtMoney,
    fmtDateTime: fmtDateTime,
    getDeputadoAvatarLetters: getDeputadoAvatarLetters,
    rerender: rerenderBetaWorkspaceFiltered,
    setPowerBiFilters: function (nextFilters) {
      betaPowerBiFilters = nextFilters;
    }
  };
}

function getPowerBiDataContext() {
  return {
    filters: betaPowerBiFilters,
    currentRole: CURRENT_ROLE,
    betaAuditRows: betaAuditRows,
    text: text,
    normalizeLooseText: normalizeLooseText,
    getRecordCurrentStatus: getRecordCurrentStatus,
    getBackendIdForRecord: getBackendIdForRecord,
    getActiveUsersWithLastMark: getActiveUsersWithLastMark,
    getGlobalProgressState: getGlobalProgressState,
    toNumber: toNumber
  };
}

function getBetaWorkspaceContext() {
  return {
    activeTab: getActiveBetaWorkspaceTab(),
    clearNodeChildren: clearNodeChildren,
    canViewGlobalAuditApi: canViewGlobalAuditApi,
    setTab: setBetaWorkspaceTab,
    renderHistory: renderBetaHistoryPanel,
    renderPowerBi: renderBetaPowerBiPanel,
    renderSupport: renderBetaSupportPanel
  };
}

function getExecutiveExportContext() {
  return {
    fmtDateTime: fmtDateTime,
    isoNow: isoNow,
    currentRole: CURRENT_ROLE,
    currentUser: CURRENT_USER,
    filters: betaPowerBiFilters
  };
}

function getAuxModalContext() {
  return {
    setModalVisibility: function (modalEl, visible) {
      const setModalVisibilityUtil = getUiRenderUtil("setModalVisibility");
      if (setModalVisibilityUtil) {
        setModalVisibilityUtil(modalEl, visible);
        return;
      }
      if (!modalEl) return;
      modalEl.classList.toggle("show", !!visible);
      modalEl.setAttribute("aria-hidden", visible ? "false" : "true");
    },
    syncProfileModalFields: function (fields, state) {
      const syncProfileModalFieldsUtil = getUiRenderUtil("syncProfileModalFields");
      if (syncProfileModalFieldsUtil) {
        syncProfileModalFieldsUtil(fields, state);
        return;
      }
      if (fields.profileName) fields.profileName.value = state.userName || "-";
      if (fields.profileRole) fields.profileRole.value = state.userRole || "-";
      if (fields.profileMode) fields.profileMode.value = state.apiEnabled ? "Nuvem/API" : "Local";
      if (fields.profileApi) fields.profileApi.value = state.apiOnline ? "Conectada" : "Indisponivel";
    },
    fields: {
      profileName: profileName,
      profileRole: profileRole,
      profileMode: profileMode,
      profileApi: profileApi
    },
    state: {
      userName: CURRENT_USER,
      userRole: CURRENT_ROLE,
      apiEnabled: isApiEnabled(),
      apiOnline: apiOnline
    },
    modal: profileModal,
    syncFilters: syncCustomExportFilters,
    refreshSummary: refreshCustomExportSummary,
    exportCustomYear: exportCustomYear,
    exportCustomStatus: exportCustomStatus,
    exportCustomIncludeOld: exportCustomIncludeOld,
    exportCustomDeputado: exportCustomDeputado,
    exportCustomMunicipio: exportCustomMunicipio,
    yearFilter: yearFilter
  };
}

function getAccessProfileContext() {
  return {
    currentRole: CURRENT_ROLE,
    currentUser: CURRENT_USER,
    apiOnline: apiOnline,
    STORAGE_MODE_LOCAL: STORAGE_MODE_LOCAL,
    currentUserInfo: currentUserInfo,
    btnExportAtuais: btnExportAtuais,
    btnExportHistorico: btnExportHistorico,
    btnExportCustom: btnExportCustom,
    btnPendingApprovals: btnPendingApprovals,
    btnCreateProfile: btnCreateProfile,
    importLabel: importLabel,
    btnReset: btnReset,
    btnDemo4Users: btnDemo4Users,
    btnProfile: btnProfile,
    btnLogout: btnLogout,
    getStorageMode: getStorageMode,
    getReadOnlyRoleMeta: getReadOnlyRoleMeta,
    renderRoleNotice: renderRoleNotice,
    renderSupervisorQuickPanel: renderSupervisorQuickPanel,
    applyModalAccessProfile: applyModalAccessProfile,
    syncBetaAuditPolling: syncBetaAuditPolling,
    syncBetaSupportPolling: syncBetaSupportPolling,
    refreshProfileModal: refreshProfileModal
  };
}

function getPendingUsersContext() {
  return {
    isApiEnabled: isApiEnabled,
    isOwnerUser: isOwnerUser,
    setFeedback: setPendingUsersFeedback,
    renderTable: renderPendingUsersTable,
    apiRequest: apiRequest,
    extractApiError: extractApiError,
    getSelectedRole: function (userId) {
      const roleSelect = pendingUsersTableWrap ? pendingUsersTableWrap.querySelector("select[data-pending-role='" + String(userId) + "']") : null;
      return normalizeUserRole(roleSelect ? roleSelect.value : "CONTABIL");
    },
    refresh: function () {
      return refreshPendingUsersModal();
    },
    confirmAction: function (message) {
      return confirm(message);
    },
    modal: pendingUsersModal,
    setModalVisibility: function (modalEl, visible) {
      setAuxModalVisibility(modalEl, visible);
    }
  };
}

function renderBetaSupportPanel(target, filteredRows) {
  const moduleFn = getBetaSupportUtil("renderBetaSupportPanel");
  if (moduleFn) {
    return moduleFn(target, filteredRows, getBetaSupportContext());
  }

  clearNodeChildren(target);
  const empty = document.createElement("p");
  empty.className = "beta-empty";
  empty.textContent = "Painel de suporte indisponivel nesta compilacao.";
  target.appendChild(empty);
}

function renderBetaHistoryPanel(target, filteredRows) {
  const moduleFn = getBetaHistoryUtil("renderBetaHistoryPanel");
  if (moduleFn) {
    return moduleFn(target, filteredRows, getBetaHistoryContext());
  }

  clearNodeChildren(target);
  const empty = document.createElement("p");
  empty.className = "beta-empty";
  empty.textContent = "Painel de historico indisponivel nesta compilacao.";
  target.appendChild(empty);
}

function buildPowerBiFilterOptions(rows) {
  const moduleFn = getPowerBiDataUtil("buildPowerBiFilterOptions");
  if (moduleFn) {
    return moduleFn(rows, getPowerBiDataContext());
  }
  const source = Array.isArray(rows) ? rows : [];
  const deputados = Array.from(new Set(source.map(function (rec) { return text(rec && rec.deputado) || "-"; }).filter(Boolean))).sort();
  const municipios = Array.from(new Set(source.map(function (rec) { return text(rec && rec.municipio) || "-"; }).filter(Boolean))).sort();
  const statuses = Array.from(new Set(source.map(function (rec) { return getRecordCurrentStatus(rec) || "-"; }).filter(Boolean))).sort();
  return {
    deputados: deputados,
    municipios: municipios,
    statuses: statuses
  };
}

function applyPowerBiDashboardFilters(rows) {
  const moduleFn = getPowerBiDataUtil("applyPowerBiDashboardFilters");
  if (moduleFn) {
    return moduleFn(rows, getPowerBiDataContext());
  }
  const source = Array.isArray(rows) ? rows : [];
  return source.filter(function (rec) {
    const deputado = text(rec && rec.deputado) || "-";
    const municipio = text(rec && rec.municipio) || "-";
    const statusAtual = getRecordCurrentStatus(rec) || "-";
    if (betaPowerBiFilters.deputado && deputado !== betaPowerBiFilters.deputado) return false;
    if (betaPowerBiFilters.municipio && municipio !== betaPowerBiFilters.municipio) return false;
    if (betaPowerBiFilters.status && statusAtual !== betaPowerBiFilters.status) return false;
    if (betaPowerBiFilters.q) {
      const blob = normalizeLooseText([
        text(rec && rec.id),
        text(rec && rec.identificacao),
        deputado,
        municipio,
        text(rec && rec.cod_acao),
        text(rec && rec.descricao_acao),
        text(rec && rec.plan_a),
        text(rec && rec.plan_b),
        statusAtual
      ].join(" "));
      if (!blob.includes(normalizeLooseText(betaPowerBiFilters.q))) return false;
    }
    return true;
  });
}

function getDeputadoAvatarLetters(name) {
  const moduleFn = getPowerBiDataUtil("getDeputadoAvatarLetters");
  if (moduleFn) {
    return moduleFn(name, getPowerBiDataContext());
  }
  const src = text(name || "").trim();
  if (!src) return "DP";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getDeputadoPhotoUrl(record) {
  const moduleFn = getPowerBiDataUtil("getDeputadoPhotoUrl");
  if (moduleFn) {
    return moduleFn(record, getPowerBiDataContext());
  }
  if (!record || typeof record !== "object") return "";
  const allFields = record.all_fields && typeof record.all_fields === "object" ? record.all_fields : {};
  const candidates = [
    record.foto_deputado_url,
    record.foto_url,
    allFields.foto_deputado_url,
    allFields.foto_url,
    allFields.foto,
    allFields.imagem,
    allFields.image_url
  ];
  for (let i = 0; i < candidates.length; i += 1) {
    const value = text(candidates[i]);
    if (!value) continue;
    if (/^(https?:)?\/\//i.test(value) || value.startsWith("/")) return value;
  }
  return "";
}

function getScopedAuditRowsForRecords(rows) {
  const moduleFn = getPowerBiDataUtil("getScopedAuditRowsForRecords");
  if (moduleFn) {
    return moduleFn(rows, getPowerBiDataContext());
  }
  if (!Array.isArray(betaAuditRows) || !betaAuditRows.length) return [];
  const ids = {};
  (Array.isArray(rows) ? rows : []).forEach(function (rec) {
    const backendId = getBackendIdForRecord(rec);
    if (backendId) ids[String(backendId)] = true;
  });
  return betaAuditRows.filter(function (row) {
    return !!ids[String(Number(row && row.emenda_id ? row.emenda_id : 0))];
  });
}

function buildPowerBiDashboardData(filteredRows) {
  const moduleFn = getPowerBiDataUtil("buildPowerBiDashboardData");
  if (moduleFn) {
    return moduleFn(filteredRows, getPowerBiDataContext());
  }
  const sourceRows = Array.isArray(filteredRows) ? filteredRows : [];
  const filterOptions = buildPowerBiFilterOptions(sourceRows);
  const rows = applyPowerBiDashboardFilters(sourceRows);
  const scopedAuditRows = getScopedAuditRowsForRecords(rows);
  const isExecutiveRole = ["SUPERVISAO", "POWERBI", "PROGRAMADOR"].indexOf(CURRENT_ROLE) >= 0;

  const summary = {
    total: rows.length,
    valorTotal: 0,
    done: 0,
    attention: 0,
    deputados: new Set(),
    municipios: new Set(),
    latestUpdate: ""
  };
  const byDeputado = {};
  const byMunicipio = {};
  const byStatus = {};
  const byUser = {};
  const recordDeputadoMap = {};

  rows.forEach(function (rec) {
    const users = getActiveUsersWithLastMark(rec);
    const global = getGlobalProgressState(users);
    const deputado = text(rec && rec.deputado) || "-";
    const municipio = text(rec && rec.municipio) || "-";
    const valor = toNumber(rec && rec.valor_atual);
    const statusAtual = getRecordCurrentStatus(rec) || "-";
    const updatedAt = text(rec && rec.updated_at);
    const backendId = getBackendIdForRecord(rec);

    summary.valorTotal += valor;
    summary.deputados.add(deputado);
    summary.municipios.add(municipio);
    if (updatedAt && (!summary.latestUpdate || updatedAt > summary.latestUpdate)) summary.latestUpdate = updatedAt;
    if (global && global.code === "done") summary.done += 1;
    if (global && global.code === "attention") summary.attention += 1;

    if (backendId) recordDeputadoMap[String(backendId)] = deputado;

    if (!byDeputado[deputado]) {
      byDeputado[deputado] = {
        label: deputado,
        total: 0,
        valor: 0,
        done: 0,
        attention: 0,
        statusMap: {},
        municipios: new Set(),
        latestUpdate: "",
        latestStatus: "",
        latestAction: "",
        latestActor: "",
        auditEvents: 0,
        actors: new Set(),
        photoUrl: getDeputadoPhotoUrl(rec)
      };
    }
    byDeputado[deputado].total += 1;
    byDeputado[deputado].valor += valor;
    byDeputado[deputado].municipios.add(municipio);
    byDeputado[deputado].statusMap[statusAtual] = (byDeputado[deputado].statusMap[statusAtual] || 0) + 1;
    if (updatedAt && (!byDeputado[deputado].latestUpdate || updatedAt > byDeputado[deputado].latestUpdate)) {
      byDeputado[deputado].latestUpdate = updatedAt;
      byDeputado[deputado].latestStatus = statusAtual;
    }
    if (global && global.code === "done") byDeputado[deputado].done += 1;
    if (global && global.code === "attention") byDeputado[deputado].attention += 1;

    if (!byMunicipio[municipio]) byMunicipio[municipio] = { label: municipio, total: 0, valor: 0, attention: 0 };
    byMunicipio[municipio].total += 1;
    byMunicipio[municipio].valor += valor;
    if (global && global.code === "attention") byMunicipio[municipio].attention += 1;

    byStatus[statusAtual] = (byStatus[statusAtual] || 0) + 1;
  });

  scopedAuditRows.forEach(function (row) {
    const deputado = recordDeputadoMap[String(Number(row && row.emenda_id ? row.emenda_id : 0))];
    const actorName = text(row && row.usuario_nome) || "sistema";
    const eventType = text(row && row.tipo_evento) || "EVENTO";
    if (actorName) {
      byUser[actorName] = byUser[actorName] || { label: actorName, total: 0, perfil: text(row && row.setor) || "-", lastAt: "", lastEvent: "" };
      byUser[actorName].total += 1;
      if (text(row && row.data_hora) && (!byUser[actorName].lastAt || text(row.data_hora) > byUser[actorName].lastAt)) {
        byUser[actorName].lastAt = text(row.data_hora);
        byUser[actorName].lastEvent = eventType;
      }
    }
    if (!deputado || !byDeputado[deputado]) return;
    byDeputado[deputado].auditEvents += 1;
    byDeputado[deputado].actors.add(actorName);
    if (text(row && row.data_hora) && (!byDeputado[deputado].latestAction || text(row.data_hora) > byDeputado[deputado].latestAction)) {
      byDeputado[deputado].latestAction = text(row.data_hora);
      byDeputado[deputado].latestActor = actorName;
    }
  });

  return {
    sourceRows: sourceRows,
    filterOptions: filterOptions,
    rows: rows,
    scopedAuditRows: scopedAuditRows,
    isExecutiveRole: isExecutiveRole,
    summary: summary,
    byDeputado: byDeputado,
    byMunicipio: byMunicipio,
    byStatus: byStatus,
    byUser: byUser
  };
}

function buildExecutiveSummaryAoa(model) {
  const moduleFn = getExportExecutiveUtil("buildExecutiveSummaryAoa");
  if (moduleFn) return moduleFn(model, getExecutiveExportContext());
  return [["Relatorio executivo indisponivel"]];
}

function buildExecutiveDeputadosAoa(model) {
  const moduleFn = getExportExecutiveUtil("buildExecutiveDeputadosAoa");
  if (moduleFn) return moduleFn(model, getExecutiveExportContext());
  return [["Deputado", "Emendas", "Municipios", "Valor Atual", "Concluidas", "Em atencao", "Eventos", "Status dominante", "Ultima atualizacao", "Ultima acao", "Ultimo ator"]];
}

function buildExecutiveMunicipiosAoa(model) {
  const moduleFn = getExportExecutiveUtil("buildExecutiveMunicipiosAoa");
  if (moduleFn) return moduleFn(model, getExecutiveExportContext());
  return [["Municipio", "Emendas", "Valor Atual", "Em atencao"]];
}

function buildExecutiveUsersAoa(model) {
  const moduleFn = getExportExecutiveUtil("buildExecutiveUsersAoa");
  if (moduleFn) return moduleFn(model, getExecutiveExportContext());
  return [["Usuario", "Perfil", "Eventos", "Ultima acao", "Tipo ultimo evento"]];
}

async function exportExecutiveDashboardReport(filteredRows) {
  const model = buildPowerBiDashboardData(filteredRows);
  if (!model.isExecutiveRole) {
    alert("A exportacao executiva fica liberada apenas para SUPERVISAO, POWERBI e PROGRAMADOR.");
    return false;
  }
  const xlsxApi = getXlsxApi();
  if (!xlsxApi) {
    alert("Biblioteca XLSX nao carregada.");
    return false;
  }

  const filename = "relatorio_executivo_" + dateStamp() + ".xlsx";
  const baseTable = buildExportTableData(model.rows, { useOriginalHeaders: false });
  const baseAoa = [baseTable.headers].concat(baseTable.rows.map(function (rowObj) {
    return baseTable.headers.map(function (header) {
      return rowObj && rowObj[header] != null ? rowObj[header] : "";
    });
  }));

  const wb = xlsxApi.utils.book_new();
  xlsxApi.utils.book_append_sheet(wb, xlsxApi.utils.aoa_to_sheet(buildExecutiveSummaryAoa(model)), "Resumo Executivo");
  xlsxApi.utils.book_append_sheet(wb, xlsxApi.utils.aoa_to_sheet(buildExecutiveDeputadosAoa(model)), "Deputados");
  xlsxApi.utils.book_append_sheet(wb, xlsxApi.utils.aoa_to_sheet(buildExecutiveMunicipiosAoa(model)), "Municipios");
  xlsxApi.utils.book_append_sheet(wb, xlsxApi.utils.aoa_to_sheet(buildExecutiveUsersAoa(model)), "Usuarios");
  xlsxApi.utils.book_append_sheet(wb, xlsxApi.utils.aoa_to_sheet(baseAoa), "Base Filtrada");
  xlsxApi.writeFile(wb, filename);

  latestExportReport = {
    escopo: EXPORT_SCOPE.PERSONALIZADO,
    arquivoNome: filename,
    quantidadeRegistros: model.rows.length,
    filtros: {
      dashboard: "powerbi_executivo",
      deputado: betaPowerBiFilters.deputado || "",
      municipio: betaPowerBiFilters.municipio || "",
      status: betaPowerBiFilters.status || "",
      q: betaPowerBiFilters.q || ""
    },
    geradoEm: isoNow()
  };
  renderImportDashboard();

  await syncExportLogToApi({
    formato: "XLSX",
    arquivoNome: filename,
    quantidadeRegistros: model.rows.length,
    quantidadeEventos: model.scopedAuditRows.length,
    filtros: {
      dashboard: "powerbi_executivo",
      deputado: betaPowerBiFilters.deputado || "",
      municipio: betaPowerBiFilters.municipio || "",
      status: betaPowerBiFilters.status || "",
      q: betaPowerBiFilters.q || ""
    },
    modoHeaders: "executivo_dashboard",
    escopoExportacao: EXPORT_SCOPE.PERSONALIZADO,
    roundTripOk: null,
    roundTripIssues: []
  });
  return true;
}

function renderBetaPowerBiPanel(target, filteredRows) {
  const moduleFn = getBetaPowerBiUtil("renderBetaPowerBiPanel");
  if (moduleFn) {
    return moduleFn(target, filteredRows, getBetaPowerBiContext());
  }

  clearNodeChildren(target);
  const empty = document.createElement("p");
  empty.className = "beta-empty";
  empty.textContent = "Painel Power BI indisponivel nesta compilacao.";
  target.appendChild(empty);
}

function renderBetaWorkspace(filteredRows) {
  if (!betaWorkspace) return;
  const moduleFn = getBetaWorkspaceUtil("renderBetaWorkspace");
  if (moduleFn) {
    return moduleFn(betaWorkspace, filteredRows, getBetaWorkspaceContext());
  }

  clearNodeChildren(betaWorkspace);
  const empty = document.createElement("p");
  empty.className = "beta-empty";
  empty.textContent = "Central beta indisponivel nesta compilacao.";
  betaWorkspace.appendChild(empty);
}

function renderSupervisorQuickPanel(prefilteredRows) {
  if (!supervisorQuickPanel) return;
  const rows = Array.isArray(prefilteredRows) ? prefilteredRows : getFiltered();
  const uiCtx = getUiRenderContext();
  const renderSupervisorQuickPanelUtil = getUiRenderUtil("renderSupervisorQuickPanel");
  if (renderSupervisorQuickPanelUtil) {
    renderSupervisorQuickPanelUtil(supervisorQuickPanel, Object.assign({}, uiCtx, {
      rows: rows
    }));
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
  const moduleFn = getAccessProfileUtil("applyAccessProfile");
  if (moduleFn) {
    return moduleFn(getAccessProfileContext());
  }
  const isOwner = CURRENT_ROLE === "PROGRAMADOR";
  const isSupervisor = isSupervisorUser();
  const readOnlyMeta = getReadOnlyRoleMeta();
  const canManageData = isOwner || CURRENT_ROLE === "APG";
  const canCreateProfiles = isOwner;
  const apiTag = apiOnline ? "API online" : "modo local";
  const storageTag = getStorageMode() === STORAGE_MODE_LOCAL ? "persistencia local" : "sessao";
  const viewTag = isOwner ? " (dono)" : (readOnlyMeta ? readOnlyMeta.viewTag : "");

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
  syncBetaAuditPolling();
  syncBetaSupportPolling();
  refreshProfileModal();
}

function refreshProfileModal() {
  const moduleFn = getAuxModalUtil("refreshProfileModal");
  if (moduleFn) {
    return moduleFn(getAuxModalContext());
  }
  const ctx = getAuxModalContext();
  ctx.syncProfileModalFields(ctx.fields, ctx.state);
}

function setAuxModalVisibility(modalEl, visible) {
  const moduleFn = getAuxModalUtil("setAuxModalVisibility");
  if (moduleFn) {
    return moduleFn(modalEl, visible, getAuxModalContext());
  }
  const ctx = getAuxModalContext();
  ctx.setModalVisibility(modalEl, visible);
}

function openProfileModal() {
  const moduleFn = getAuxModalUtil("openProfileModal");
  if (moduleFn) {
    return moduleFn(getAuxModalContext());
  }
  if (!profileModal) return;
  refreshProfileModal();
  setAuxModalVisibility(profileModal, true);
}

function closeProfileModal() {
  const moduleFn = getAuxModalUtil("closeProfileModal");
  if (moduleFn) {
    return moduleFn(getAuxModalContext());
  }
  if (!profileModal) return;
  setAuxModalVisibility(profileModal, false);
}

function isOwnerUser() {
  return CURRENT_ROLE === "PROGRAMADOR";
}

function setPendingUsersFeedback(msg, isError) {
  if (!pendingUsersFeedback) return;
  const setPendingUsersFeedbackStateUtil = getUiRenderUtil("setPendingUsersFeedbackState");
  if (setPendingUsersFeedbackStateUtil) {
    setPendingUsersFeedbackStateUtil(pendingUsersFeedback, msg, isError);
    return;
  }
  pendingUsersFeedback.textContent = msg || "";
  pendingUsersFeedback.style.color = isError ? "#b4233d" : "";
}

function closePendingUsersModal() {
  const moduleFn = getPendingUsersUtil("closePendingUsersModal");
  if (moduleFn) {
    return moduleFn(getPendingUsersContext());
  }
  if (!pendingUsersModal) return;
  setAuxModalVisibility(pendingUsersModal, false);
}

function renderPendingUsersTable(items) {
  if (!pendingUsersTableWrap) return;
  const uiCtx = getUiRenderContext();
  const renderPendingUsersTableUtil = getUiRenderUtil("renderPendingUsersTable");
  if (renderPendingUsersTableUtil) {
    renderPendingUsersTableUtil(pendingUsersTableWrap, items, uiCtx);
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
  const moduleFn = getPendingUsersUtil("refreshPendingUsersModal");
  if (moduleFn) {
    return moduleFn(getPendingUsersContext());
  }
}

// Aprova usuario pendente com perfil selecionado pelo programador.
async function approvePendingUser(userId) {
  const moduleFn = getPendingUsersUtil("approvePendingUser");
  if (moduleFn) {
    return moduleFn(userId, getPendingUsersContext());
  }
}

async function rejectPendingUser(userId) {
  const moduleFn = getPendingUsersUtil("rejectPendingUser");
  if (moduleFn) {
    return moduleFn(userId, getPendingUsersContext());
  }
}

// Abre modal de aprovacao e dispara refresh inicial.
function openPendingUsersModal() {
  const moduleFn = getPendingUsersUtil("openPendingUsersModal");
  if (moduleFn) {
    return moduleFn(getPendingUsersContext());
  }
  if (!pendingUsersModal) return;
  setAuxModalVisibility(pendingUsersModal, true);
  refreshPendingUsersModal().catch(function (err) {
    setPendingUsersFeedback(extractApiError(err, "Falha ao abrir cadastros pendentes."), true);
  });
}

// Sincroniza estado local com API (health + lista de emendas).
async function bootstrapApiIntegration() {
  const moduleFn = getApiStateSyncUtil("bootstrapApiIntegration");
  if (moduleFn) {
    return moduleFn({
      isApiEnabled: isApiEnabled,
      resetApiState: resetApiLinkedState,
      apiRequest: apiRequest,
      mergeRemoteEmendas: mergeRemoteEmendas,
      setApiOnline: function (nextOnline) {
        apiOnline = !!nextOnline;
      },
      setApiLastError: function (message) {
        apiLastError = String(message || "");
      },
      isApiOnline: function () {
        return apiOnline;
      },
      saveState: saveState,
      syncYearFilter: syncYearFilter,
      applyAccessProfile: applyAccessProfile,
      render: render,
      refreshBetaAudit: refreshBetaAuditFromApi,
      refreshBetaSupport: refreshBetaSupportFromApi,
      syncApiPolling: syncApiStatePolling
    });
  }
  if (!isApiEnabled()) {
    resetApiLinkedState({
      apiOnline: false,
      apiLastError: ""
    });
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
    apiLastError = err && err.message ? String(err.message) : "falha de conexao";
    resetApiLinkedState({
      apiOnline: false,
      apiLastError: apiLastError
    });
    console.warn("API indisponivel, mantendo modo local:", apiLastError);
  }

  saveState();
  syncYearFilter();
  applyAccessProfile();
  render();
  if (apiOnline) {
    refreshBetaAuditFromApi(false).catch(function () { /* no-op */ });
    refreshBetaSupportFromApi(false).catch(function () { /* no-op */ });
  }
  syncApiStatePolling();
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
  const moduleFn = getApiSyncOpsUtil("applySyncResponseToRecord");
  if (moduleFn) {
    return moduleFn(rec, responsePayload, getApiSyncOpsContext());
  }
  if (!rec || !responsePayload || typeof responsePayload !== "object") return;
  const nextRowVersion = toInt(responsePayload.row_version);
  if (nextRowVersion > 0) rec.row_version = nextRowVersion;
  if (responsePayload.updated_at) rec.updated_at = String(responsePayload.updated_at);
}

// Envia alteracao de status oficial da emenda para backend.
async function syncOfficialStatusToApi(rec, nextStatus, motivo) {
  const moduleFn = getApiSyncOpsUtil("syncOfficialStatusToApi");
  if (moduleFn) {
    return await moduleFn(rec, nextStatus, motivo, getApiSyncOpsContext());
  }
}

// Envia evento generico (nota, marcacao, edicao) para backend.
async function syncGenericEventToApi(rec, payload) {
  const moduleFn = getApiSyncOpsUtil("syncGenericEventToApi");
  if (moduleFn) {
    return await moduleFn(rec, payload, getApiSyncOpsContext());
  }
}

// Garante que o registro local tenha ID correspondente no backend.
async function ensureBackendEmenda(rec, options) {
  const moduleFn = getApiSyncOpsUtil("ensureBackendEmenda");
  if (moduleFn) {
    return await moduleFn(rec, options, getApiSyncOpsContext());
  }
  return null;
}


function getApiWebSocketUrl() {
  const getApiWebSocketUrlUtil = getConcurrencyUtil("getApiWebSocketUrl");
  if (getApiWebSocketUrlUtil) {
    return getApiWebSocketUrlUtil();
  }
  const base = getApiBaseUrl();
  if (!base) return "";
  if (base.indexOf("https://") === 0) return "wss://" + base.slice(8) + API_WS_PATH;
  if (base.indexOf("http://") === 0) return "ws://" + base.slice(7) + API_WS_PATH;
  return "";
}

function clearApiSocketReconnectTimer() {
  const clearApiSocketReconnectTimerUtil = getConcurrencyUtil("clearApiSocketReconnectTimer");
  if (clearApiSocketReconnectTimerUtil) {
    clearApiSocketReconnectTimerUtil();
    return;
  }
  if (!apiSocketReconnectTimer) return;
  clearTimeout(apiSocketReconnectTimer);
  apiSocketReconnectTimer = null;
}

function closeApiSocket() {
  const closeApiSocketUtil = getConcurrencyUtil("closeApiSocket");
  if (closeApiSocketUtil) {
    closeApiSocketUtil();
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
  const scheduleApiSocketReconnectUtil = getConcurrencyUtil("scheduleApiSocketReconnect");
  if (scheduleApiSocketReconnectUtil) {
    scheduleApiSocketReconnectUtil();
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
  const queueApiRefreshFromSocketUtil = getConcurrencyUtil("queueApiRefreshFromSocket");
  if (queueApiRefreshFromSocketUtil) {
    queueApiRefreshFromSocketUtil();
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
  const sendSocketJsonUtil = getConcurrencyUtil("sendSocketJson");
  if (sendSocketJsonUtil) {
    sendSocketJsonUtil(payload);
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
  if (!REALTIME_USER_PANEL_ENABLED) return;
  const announcePresenceForRecordUtil = getConcurrencyUtil("announcePresenceForRecord");
  if (announcePresenceForRecordUtil) {
    announcePresenceForRecordUtil(rec, action);
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
  const getPresenceUsersForRecordUtil = getConcurrencyUtil("getPresenceUsersForRecord");
  if (getPresenceUsersForRecordUtil) {
    return getPresenceUsersForRecordUtil(rec) || [];
  }
  const backendId = getBackendIdForRecord(rec);
  if (!backendId) return [];
  return Array.isArray(presenceByBackendId[backendId]) ? presenceByBackendId[backendId] : [];
}

function renderLivePresence(rec) {
  if (!REALTIME_USER_PANEL_ENABLED) {
    if (livePresenceText) livePresenceText.textContent = "";
    return;
  }
  const renderLivePresenceUtil = getUiRenderUtil("renderLivePresence");
  if (renderLivePresenceUtil) {
    renderLivePresenceUtil(livePresenceText, getPresenceUsersForRecord(rec), {
      text: text
    });
    return;
  }

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
  if (!REALTIME_USER_PANEL_ENABLED) return;
  const handlePresencePayloadUtil = getConcurrencyUtil("handlePresencePayload");
  if (handlePresencePayloadUtil) {
    handlePresencePayloadUtil(data);
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
  if (!REALTIME_USER_PANEL_ENABLED) {
    closeApiSocket();
    return;
  }
  const connectApiSocketUtil = getConcurrencyUtil("connectApiSocket");
  if (connectApiSocketUtil) {
    connectApiSocketUtil();
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
  const isApiEnabledUtil = getApiClientUtil("isApiEnabled");
  if (isApiEnabledUtil) {
    return isApiEnabledUtil();
  }
  return true;
}

// Resolve URL base da API (compatibilidade local, quando o cliente modular não estiver disponível).
function getApiBaseUrl() {
  const getApiBaseUrlUtil = getApiClientUtil("getApiBaseUrl");
  if (getApiBaseUrlUtil) {
    return getApiBaseUrlUtil();
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
  const apiRequestUtil = getApiClientUtil("apiRequest");
  if (apiRequestUtil) {
    return await apiRequestUtil(method, path, body, eventOrigin, options);
  }
  throw new Error("Cliente de API indisponivel. Recarregue a pagina.");
}

// Wrapper publico para login/cadastro sem token.
async function apiRequestPublic(method, path, body) {
  const apiRequestPublicUtil = getApiClientUtil("apiRequestPublic");
  if (apiRequestPublicUtil) {
    return await apiRequestPublicUtil(method, path, body);
  }
  throw new Error("Cliente de API indisponivel. Recarregue a pagina.");
}

// Monta headers padrao de auditoria/autenticacao para chamadas privadas.
function buildApiHeaders(eventOrigin) {
  const buildApiHeadersUtil = getApiClientUtil("buildApiHeaders");
  if (buildApiHeadersUtil) {
    return buildApiHeadersUtil(eventOrigin);
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

  const readStorageValueUtil = getStorageUtil("readStorageValue");
  const key = readStorageValueUtil
    ? readStorageValueUtil(sessionStorage, API_SHARED_KEY_SESSION_KEY)
    : readStorageValue(sessionStorage, API_SHARED_KEY_SESSION_KEY);
  if (key) headers["X-API-Key"] = key;

  return headers;
}

function getStorageMode() {
  const getStorageModeUtil = getStorageUtil("getStorageMode");
  if (getStorageModeUtil) {
    const mode = String(getStorageModeUtil(STORAGE_MODE_KEY) || "").toLowerCase();
    if (mode === STORAGE_MODE_LOCAL || mode === STORAGE_MODE_SESSION) return mode;
  }

  const configured = readStorageValue(localStorage, STORAGE_MODE_KEY).toLowerCase();
  if (configured === STORAGE_MODE_LOCAL) return STORAGE_MODE_LOCAL;
  return STORAGE_MODE_SESSION;
}

function getPrimaryStorage() {
  const getPrimaryStorageUtil = getStorageUtil("getPrimaryStorage");
  if (getPrimaryStorageUtil) {
    return getPrimaryStorageUtil(STORAGE_MODE_KEY);
  }
  return getStorageMode() === STORAGE_MODE_LOCAL ? localStorage : sessionStorage;
}

function getSecondaryStorage() {
  const getSecondaryStorageUtil = getStorageUtil("getSecondaryStorage");
  if (getSecondaryStorageUtil) {
    return getSecondaryStorageUtil(STORAGE_MODE_KEY);
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
  const moduleFn = getApiSyncOpsUtil("rollbackSaveAndReport");
  if (moduleFn) {
    return await moduleFn(err, rec, snapshot, actionName, getApiSyncOpsContext());
  }
}

function handleApiSyncError(err, actionName) {
  const moduleFn = getApiSyncOpsUtil("handleApiSyncError");
  if (moduleFn) {
    return moduleFn(err, actionName, getApiSyncOpsContext());
  }
}

function normalizeUserRole(roleInput) {
  const role = String(roleInput || "").trim().toUpperCase();
  return USER_ROLE_OPTIONS.includes(role) ? role : "CONTABIL";
}

function mkEvent(type, payload) {
  const moduleFn = getRecordModelUtil("mkEvent");
  if (moduleFn) {
    return moduleFn(type, payload, getRecordModelContext());
  }
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
  const moduleFn = getRecordModelUtil("mkRecord");
  if (moduleFn) {
    return moduleFn(data, getRecordModelContext());
  }
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
  const moduleFn = getRecordModelUtil("normalizeRecordShape");
  if (moduleFn) {
    return moduleFn(raw, getRecordModelContext());
  }
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
  const moduleFn = getRecordModelUtil("inferDemoSeed");
  if (moduleFn) {
    return moduleFn(rec, getRecordModelContext());
  }
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
  const moduleFn = getRecordModelUtil("purgeDemoBeforeOfficialImport");
  if (moduleFn) {
    return moduleFn(getRecordModelContext());
  }
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
  const moduleFn = getRecordModelUtil("migrateLegacyStatusRecords");
  if (moduleFn) {
    return moduleFn(records, getRecordModelContext());
  }
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
  const moduleFn = getRecordModelUtil("latestMarkedStatus");
  if (moduleFn) {
    return moduleFn(rec, getRecordModelContext());
  }
  const events = getEventsSorted(rec || {});
  for (let i = 0; i < events.length; i += 1) {
    const ev = events[i];
    if (ev && ev.type === "MARK_STATUS" && ev.to) return normalizeStatus(ev.to);
  }
  return "";
}

function deriveStatusForBackend(rec) {
  const moduleFn = getRecordModelUtil("deriveStatusForBackend");
  if (moduleFn) {
    return moduleFn(rec, getRecordModelContext());
  }
  return latestMarkedStatus(rec) || "Recebido";
}

// Sincroniza alteracoes entre abas via BroadcastChannel/storage event.
function setupCrossTabSync() {
  return requireModuleFunction(getAppLifecycleUtil, "setupCrossTabSync", "appLifecycleUtils")(getAppLifecycleContext());
}

// Notifica outras abas que o estado local mudou.
function notifyStateUpdated() {
  return requireModuleFunction(getLocalStateUtil, "notifyStateUpdated", "localStateUtils")(getLocalStateContext());
}

// Recarrega estado salvo e redesenha interface.
function refreshStateFromStorage() {
  return requireModuleFunction(getLocalStateUtil, "refreshStateFromStorage", "localStateUtils")(getLocalStateContext());
}
// Carrega estado persistido (storage atual, fallback e legado).
function loadState() {
  return requireModuleFunction(getLocalStateUtil, "loadState", "localStateUtils")(getLocalStateContext());
}

// Persiste estado e opcionalmente propaga sincronizacao cross-tab.
function saveState(silentSync) {
  return requireModuleFunction(getLocalStateUtil, "saveState", "localStateUtils")(silentSync, getLocalStateContext());
}


function syncActiveUsersCache(records) {
  return requireModuleFunction(getLocalStateUtil, "syncActiveUsersCache", "localStateUtils")(records, getLocalStateContext());
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
  const idCtx = getIdContext();
  const assignMissingIdsUtil = getIdUtil("assignMissingIds");
  if (assignMissingIdsUtil) {
    return assignMissingIdsUtil(records, counters, idCtx.generateInternalId, idCtx.toInt, idCtx.currentYear);
  }

  records.forEach(function (r) {
    if (String(r.id || "").trim()) return;
    r.id = generateInternalId(r.ano, counters);
  });
}

function generateInternalId(ano, counters) {
  const idCtx = getIdContext();
  const generateInternalIdUtil = getIdUtil("generateInternalId");
  if (generateInternalIdUtil) {
    return generateInternalIdUtil(ano, counters, idCtx.toInt, idCtx.currentYear);
  }

  const year = String(idCtx.toInt(ano) || idCtx.currentYear());
  const next = (counters[year] || 0) + 1;
  counters[year] = next;
  return "EPI-" + year + "-" + String(next).padStart(6, "0");
}
function syncReferenceKeys(records) {
  const importNormalizationCtx = getImportNormalizationContext();
  const syncReferenceKeysUtil = getImportNormalizationUtil("syncReferenceKeys");
  if (syncReferenceKeysUtil) {
    return syncReferenceKeysUtil(records, importNormalizationCtx.referenceFields, importNormalizationCtx.buildReferenceKey);
  }
  records.forEach(function (r) {
    r.ref_key = buildReferenceKey(r);
  });
}

function buildReferenceKey(record) {
  const importNormalizationCtx = getImportNormalizationContext();
  const buildReferenceKeyUtil = getImportNormalizationUtil("buildReferenceKey");
  if (buildReferenceKeyUtil) {
    return buildReferenceKeyUtil(record, importNormalizationCtx.referenceFields, importNormalizationCtx.normalizeReferencePart);
  }
  const parts = importNormalizationCtx.referenceFields.map(function (field) {
    return importNormalizationCtx.normalizeReferencePart(record[field]);
  });
  if (parts.every(function (p) { return p === ""; })) return "";
  return parts.join("|");
}

function normalizeReferencePart(value) {
  const normalizeCtx = getNormalizeContext();
  const normalizeReferencePartUtil = getImportNormalizationUtil("normalizeReferencePart");
  if (normalizeReferencePartUtil) {
    return normalizeReferencePartUtil(value, normalizeCtx.normalizeLooseText);
  }
  const normalizeReferencePartFallbackUtil = getNormalizeUtil("normalizeReferencePart");
  if (normalizeReferencePartFallbackUtil) {
    return normalizeReferencePartFallbackUtil(value);
  }
  return normalizeCtx.normalizeLooseText(value).replace(/\s+/g, " ").trim();
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

function getXlsxApi() {
  return typeof window !== "undefined" ? window.XLSX : null;
}

function getImportReportContext() {
  return {
    records: state.records || [],
    lastImportedPlanilha1Aoa: lastImportedPlanilha1Aoa,
    importReportEl: importReport,
    fmtDateTime: fmtDateTime,
    escapeHtml: escapeHtml,
    buildPlanilha1Aoa: buildPlanilha1Aoa,
    normalizeLooseText: normalizeLooseText,
    buildPlanilha1Html: buildPlanilha1Html,
    getRecentChangesForPanel: getRecentChangesForPanel,
    wireImportReportTabs: wireImportReportTabs,
    latestExportReport: latestExportReport,
    buildExportSummaryBadgeHtml: buildExportSummaryBadgeHtml,
    exportScopeLabel: exportScopeLabel,
    getEventsSorted: getEventsSorted,
    toInt: toInt,
    text: text
  };
}

function getExportDataContext() {
  return {
    getActiveUsersWithLastMark: getActiveUsersWithLastMark,
    calcProgress: calcProgress,
    getGlobalProgressState: getGlobalProgressState,
    getEventsSorted: getEventsSorted,
    exportScopeLabel: exportScopeLabel
  };
}

function getExportTemplateContext() {
  return {
    importAliases: IMPORT_ALIASES,
    rawPreferredHeaders: RAW_PREFERRED_HEADERS,
    normalizeHeader: normalizeHeader,
    canonicalKeys: getTemplateCanonicalKeys(),
    toNumber: toNumber,
    normalizeCompareValue: normalizeCompareValue,
    xlsxApi: getXlsxApi(),
    inferDemoSeed: inferDemoSeed
  };
}

function getUiRenderContext() {
  const readOnlyMeta = getReadOnlyRoleMeta();
  return {
    fmtMoney: fmtMoney,
    fmtDateTime: fmtDateTime,
    statusColor: statusColor,
    getActiveUsersWithLastMark: getActiveUsersWithLastMark,
    calcProgress: calcProgress,
    renderProgressBar: renderProgressBar,
    renderMemberChips: renderMemberChips,
    getLastEventDays: function (row) {
      return daysSince(lastEventAt(row));
    },
    onView: function (id) {
      openModal(id);
    },
    isSupervisor: isSupervisorUser(),
    getGlobalProgressState: getGlobalProgressState,
    getStaleDays: function (rec) {
      return daysSince(lastEventAt(rec));
    },
    onOpen: function (recId) {
      if (recId) openModal(recId);
    },
    roles: USER_ROLE_OPTIONS,
    normalizeUserRole: normalizeUserRole,
    isReadOnlyRole: !!readOnlyMeta,
    roleNoticeTitle: readOnlyMeta ? readOnlyMeta.noticeTitle : "",
    roleNoticeDescription: readOnlyMeta ? readOnlyMeta.noticeDescription : "",
    readOnlyRoleMessage: readOnlyMeta ? readOnlyMeta.modalReadOnlyMessage : "",
    readOnlyLockLabel: readOnlyMeta ? readOnlyMeta.lockModeLabel : ""
  };
}

function getFilterContext() {
  return {
    statusFilter: statusFilter,
    markStatus: markStatus,
    yearFilter: yearFilter,
    exportCustomYear: exportCustomYear,
    exportCustomStatus: exportCustomStatus,
    statusFilters: STATUS_FILTERS,
    statusValues: STATUS,
    records: state.records,
    toInt: toInt,
    currentYear: exportCustomYear ? exportCustomYear.value : "",
    currentStatus: exportCustomStatus ? exportCustomStatus.value : ""
  };
}

function getProgressContext() {
  return {
    normalizeStatus: function (value) {
      return normalizeStatus(value);
    },
    localeCompare: function (a, b, locale) {
      return String(a || "").localeCompare(String(b || ""), locale);
    },
    escapeHtml: escapeHtml,
    statusClass: statusClass,
    daysSince: daysSince
  };
}

function getImportPipelineContext() {
  return {
    importAliases: IMPORT_ALIASES,
    trackedFields: TRACKED_FIELDS,
    systemMigrationUser: SYSTEM_MIGRATION_USER,
    systemMigrationRole: SYSTEM_MIGRATION_ROLE,
    currentYear: currentYear,
    generateInternalIdForYear: function (ano) {
      return generateInternalId(ano, idCountersByYear);
    },
    mkRecord: mkRecord,
    mkEvent: mkEvent,
    shallowCloneObj: shallowCloneObj,
    buildImportNote: buildImportNote,
    buildReferenceKey: buildReferenceKey,
    normalizeStatus: normalizeStatus,
    mergeRawFields: mergeRawFields,
    hasIncomingValue: hasIncomingValue,
    hasFieldChanged: hasFieldChanged,
    stringifyFieldValue: stringifyFieldValue,
    syncCanonicalToAllFields: syncCanonicalToAllFields,
    isoNow: isoNow,
    latestMarkedStatus: latestMarkedStatus,
    toInt: toInt,
    asText: asText,
    pickValue: pickValue,
    toNumberOrNull: toNumberOrNull,
    normalizeRowKeys: normalizeRowKeys,
    normalizeHeader: normalizeHeader,
    text: text
  };
}

function getImportValidationContext() {
  return {
    text: text,
    normalizeHeader: normalizeHeader,
    shallowCloneObj: shallowCloneObj,
    mapImportRow: mapImportRow,
    detectType: detectType
  };
}

function getStatusContext() {
  return {
    statusValues: STATUS,
    normalizeLooseText: normalizeLooseText,
    statusColor: statusColor,
    escapeHtml: escapeHtml
  };
}

function getNormalizeContext() {
  return {
    normalizeLooseText: normalizeLooseText
  };
}

function getIdContext() {
  return {
    generateInternalId: generateInternalId,
    toInt: toInt,
    currentYear: currentYear
  };
}

function getImportNormalizationContext() {
  return {
    referenceFields: REFERENCE_FIELDS,
    buildReferenceKey: buildReferenceKey,
    normalizeReferencePart: normalizeReferencePart
  };
}

function getApiClientConfigContext() {
  return {
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
      const readStorageValueUtil = getStorageUtil("readStorageValue");
      if (readStorageValueUtil) {
        return readStorageValueUtil(sessionStorage, API_SHARED_KEY_SESSION_KEY);
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
  };
}

function getConcurrencyConfigContext() {
  return {
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
  };
}

function renderImportDashboard() {
  const ctx = getImportReportContext();
  const renderImportDashboardUtil = getImportReportUtil("renderImportDashboard");
  if (renderImportDashboardUtil) {
    renderImportDashboardUtil(
      ctx.records,
      latestImportReport,
      ctx.lastImportedPlanilha1Aoa,
      ctx.importReportEl,
      ctx.fmtDateTime,
      ctx.escapeHtml,
      ctx.buildPlanilha1Aoa,
      ctx.normalizeLooseText,
      ctx.buildPlanilha1Html,
      ctx.getRecentChangesForPanel,
      ctx.wireImportReportTabs,
      ctx.latestExportReport,
      ctx.buildExportSummaryBadgeHtml,
      ctx.exportScopeLabel,
      HOME_CHANGES_LIMIT
    );
    return;
  }

  if (!ctx.importReportEl) return;
  ctx.importReportEl.classList.remove("hidden");

  const left = latestImportReport ? buildImportSummaryHtml(latestImportReport) : buildImportSummaryPlaceholderHtml();
  const recent = ctx.getRecentChangesForPanel(HOME_CHANGES_LIMIT);
  const exportSummary = ctx.buildExportSummaryBadgeHtml(ctx.latestExportReport);

  clearNodeChildren(ctx.importReportEl);
  appendRenderedMarkup(ctx.importReportEl, exportSummary);
  appendRenderedMarkup(
    ctx.importReportEl,
    "<div class=\"import-dashboard-grid\">"
    + "  <section class=\"import-dashboard-left\">" + left + "</section>"
    + "  <section class=\"import-dashboard-right\">" + buildRecentChangesPanelHtml(recent) + "</section>"
    + "</div>"
  );

  if (latestImportReport) {
    ctx.wireImportReportTabs(ctx.importReportEl, "planilha1");
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
  const ctx = getImportReportContext();
  const buildImportSummaryPlaceholderHtmlUtil = getImportReportUtil("buildImportSummaryPlaceholderHtml");
  if (buildImportSummaryPlaceholderHtmlUtil) {
    return buildImportSummaryPlaceholderHtmlUtil(
      ctx.records,
      ctx.lastImportedPlanilha1Aoa,
      ctx.escapeHtml,
      ctx.fmtDateTime,
      ctx.buildPlanilha1Aoa,
      ctx.normalizeLooseText,
      ctx.buildPlanilha1Html,
      ctx.getRecentChangesForPanel
    );
  }
  const totalRegistros = ctx.records.length;
  const totalEventos = ctx.records.reduce(function (acc, rec) {
    return acc + ((rec && rec.eventos && rec.eventos.length) ? rec.eventos.length : 0);
  }, 0);
  const last = ctx.getRecentChangesForPanel(1)[0] || null;
  const lastAt = last ? ctx.fmtDateTime(last.at) : "-";
  const lastBy = last ? (ctx.escapeHtml(last.actor_user) + " (" + ctx.escapeHtml(last.actor_role) + ")") : "-";
  const planilha1Aoa = (Array.isArray(ctx.lastImportedPlanilha1Aoa) && ctx.lastImportedPlanilha1Aoa.length)
    ? ctx.lastImportedPlanilha1Aoa
    : ctx.buildPlanilha1Aoa(ctx.records);
  const planilha1Html = ctx.buildPlanilha1Html(planilha1Aoa);

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
  const ctx = getImportReportContext();
  const buildImportSummaryHtmlUtil = getImportReportUtil("buildImportSummaryHtml");
  if (buildImportSummaryHtmlUtil) {
    return buildImportSummaryHtmlUtil(
      report,
      ctx.records,
      ctx.lastImportedPlanilha1Aoa,
      ctx.escapeHtml,
      ctx.fmtDateTime,
      ctx.buildPlanilha1Aoa,
      ctx.normalizeLooseText,
      ctx.buildPlanilha1Html
    );
  }
  const sheets = report && report.sheetNames && report.sheetNames.length ? report.sheetNames.join(", ") : "-";
  const fileName = report && report.fileName ? report.fileName : "-";

  const planilha1Aoa = (Array.isArray(ctx.lastImportedPlanilha1Aoa) && ctx.lastImportedPlanilha1Aoa.length)
    ? ctx.lastImportedPlanilha1Aoa
    : ctx.buildPlanilha1Aoa(ctx.records);
  const planilha1Html = ctx.buildPlanilha1Html(planilha1Aoa);

  return ""
    + "<h4>Resumo da importacao</h4>"
    + "<p class=\"muted small\">Arquivo: " + ctx.escapeHtml(fileName) + " | Abas lidas: " + ctx.escapeHtml(sheets) + "</p>"
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
  const ctx = getImportReportContext();
  const buildImportValidationHtmlUtil = getImportReportUtil("buildImportValidationHtml");
  if (buildImportValidationHtmlUtil) {
    return buildImportValidationHtmlUtil(validation, ctx.escapeHtml);
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
    + "  <div class=\"k\">Colunas reconhecidas</div><div class=\"v\">" + ctx.escapeHtml(recognized.join(", ") || "-") + "</div>"
    + "  <div class=\"k\">Colunas nao reconhecidas</div><div class=\"v\">" + ctx.escapeHtml(unrecognized.join(", ") || "-") + "</div>"
    + "  <div class=\"k\">Colunas duplicadas</div><div class=\"v\">" + ctx.escapeHtml(duplicated.join(", ") || "-") + "</div>"
    + "  <div class=\"k\">Tipos detectados</div><div class=\"v\">" + ctx.escapeHtml(JSON.stringify(types)) + "</div>"
    + "</div>";

  if (alerts.length) {
    html += "<div style=\"margin-top:8px\"><b>Alertas</b><ul>" + alerts.map(function (a) { return "<li>" + ctx.escapeHtml(a) + "</li>"; }).join("") + "</ul></div>";
  }

  if (preview.length) {
    html += "<div style=\"margin-top:8px\"><b>Preview (5 linhas)</b>";
    html += "<div class=\"table-wrap\"><table class=\"table\" style=\"min-width:720px\"><thead><tr><th>Aba</th><th>Linha</th><th>Dados</th></tr></thead><tbody>";
    preview.forEach(function (row) {
      html += "<tr><td>" + ctx.escapeHtml(row.aba || "-") + "</td><td>" + ctx.escapeHtml(String(row.linha || "-")) + "</td><td><code>" + ctx.escapeHtml(JSON.stringify(row.dados)) + "</code></td></tr>";
    });
    html += "</tbody></table></div></div>";
  }

  return html;
}
function buildRecentChangesPanelHtml(items) {
  const ctx = getImportReportContext();
  const buildRecentChangesPanelHtmlUtil = getImportReportUtil("buildRecentChangesPanelHtml");
  if (buildRecentChangesPanelHtmlUtil) {
    return buildRecentChangesPanelHtmlUtil(items, ctx.escapeHtml, ctx.fmtDateTime, function (item) { return describeEventForPanel(item); }, ctx.text);
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
      + "    <strong>" + ctx.escapeHtml(item.actor_user) + "</strong>"
      + "    <span class=\"muted small\">" + ctx.escapeHtml(item.actor_role) + " | " + ctx.fmtDateTime(item.at) + "</span>"
      + "  </div>"
      + "  <div class=\"recent-item-action\">" + ctx.escapeHtml(describeEventForPanel(item)) + "</div>"
      + "  <div class=\"recent-item-target\"><code>" + ctx.escapeHtml(item.id) + "</code> | " + ctx.escapeHtml(item.identificacao) + "</div>"
      + (item.note ? ("<div class=\"recent-item-note muted small\">Obs: " + ctx.escapeHtml(item.note) + "</div>") : "")
      + "</article>";
  });

  html += "</div>";
  return html;
}

function getRecentChangesForPanel(limit) {
  const ctx = getImportReportContext();
  const getRecentChangesForPanelUtil = getImportReportUtil("getRecentChangesForPanel");
  if (getRecentChangesForPanelUtil) {
    return getRecentChangesForPanelUtil(ctx.records, ctx.getEventsSorted, ctx.toInt, limit);
  }
  const out = [];

  ctx.records.forEach(function (rec) {
    ctx.getEventsSorted(rec).forEach(function (ev) {
      if (!ev || !ev.at) return;
      const ts = new Date(ev.at).getTime();
      if (!Number.isFinite(ts) || ts <= 0) return;

      out.push({
        at: ev.at,
        atTs: ts,
        actor_user: ctx.text(ev.actor_user) || "sistema",
        actor_role: ctx.text(ev.actor_role) || "-",
        type: ctx.text(ev.type) || "EVENTO",
        note: ctx.text(ev.note),
        id: ctx.text(rec.id) || "-",
        identificacao: ctx.text(rec.identificacao) || "-",
        from: ev.from,
        to: ev.to,
        field: ev.field
      });
    });
  });

  out.sort(function (a, b) {
    return b.atTs - a.atTs;
  });

  const max = Math.max(1, ctx.toInt(limit) || 10);
  return out.slice(0, max);
}

function describeEventForPanel(item) {
  const ctx = getImportReportContext();
  const describeEventForPanelUtil = getImportReportUtil("describeEventForPanel");
  if (describeEventForPanelUtil) {
    return describeEventForPanelUtil(item, ctx.text);
  }
  if (!item) return "Alteracao registrada";

  if (item.type === "OFFICIAL_STATUS") {
    return "Status oficial legado: " + ctx.text(item.from || "-") + " -> " + ctx.text(item.to || "-");
  }
  if (item.type === "MARK_STATUS") {
    return "Marcacao de status: " + ctx.text(item.to || "-");
  }
  if (item.type === "EDIT_FIELD") {
    return "Edicao de campo: " + ctx.text(item.field || "-");
  }
  if (item.type === "NOTE") {
    return "Nota adicionada";
  }
  if (item.type === "IMPORT") {
    return "Importacao/atualizacao de registro";
  }

  return ctx.text(item.type || "Evento");
}

function showImportReport(report) {
  latestImportReport = report || null;
  renderImportDashboard();
}

function wireImportReportTabs(targetOrTab, maybeDefaultTab) {
  const ctx = getImportReportContext();
  const target = targetOrTab && typeof targetOrTab.querySelectorAll === "function" ? targetOrTab : ctx.importReportEl;
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
  const ctx = getImportReportContext();
  const buildPlanilha1HtmlUtil = getImportReportUtil("buildPlanilha1Html");
  if (buildPlanilha1HtmlUtil) {
    return buildPlanilha1HtmlUtil(aoa, {
      escapeHtml: ctx.escapeHtml,
      normalizeLooseText: ctx.normalizeLooseText
    });
  }
  if (!Array.isArray(aoa) || aoa.length === 0) {
    return "<p class=\"muted small\">Sem dados para resumo por deputado.</p>";
  }

  let html = "<div class=\"table-wrap\"><table class=\"table\" style=\"min-width:420px\"><thead><tr><th>" + ctx.escapeHtml(String(aoa[0][0] || "Rotulos de Linha")) + "</th><th>" + ctx.escapeHtml(String(aoa[0][1] || "Contagem")) + "</th></tr></thead><tbody>";

  for (let i = 1; i < aoa.length; i += 1) {
    const row = aoa[i] || [];
    const label = row[0] == null ? "" : String(row[0]);
    const val = row[1] == null ? "" : String(row[1]);
    const isTotal = ctx.normalizeLooseText(label) === "total geral";
    html += "<tr" + (isTotal ? " style=\"font-weight:700\"" : "") + "><td>" + ctx.escapeHtml(label) + "</td><td>" + ctx.escapeHtml(val) + "</td></tr>";
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
  const getCurrentFilterSnapshotUtil = getExportUtil("getCurrentFilterSnapshot");
  if (getCurrentFilterSnapshotUtil) {
    return getCurrentFilterSnapshotUtil({
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
  const countAuditEventsUtil = getExportUtil("countAuditEvents");
  if (countAuditEventsUtil) {
    return countAuditEventsUtil(records);
  }
  return (records || []).reduce(function (acc, rec) {
    return acc + ((rec && Array.isArray(rec.eventos)) ? rec.eventos.length : 0);
  }, 0);
}

function exportScopeLabel(scope) {
  const exportScopeLabelUtil = getExportUtil("exportScopeLabel");
  if (exportScopeLabelUtil) {
    return exportScopeLabelUtil(scope, EXPORT_SCOPE);
  }
  if (scope === EXPORT_SCOPE.HISTORICO) return "HISTORICO";
  if (scope === EXPORT_SCOPE.PERSONALIZADO) return "PERSONALIZADO";
  return "ATUAIS";
}

function buildExportFilename(scope) {
  const buildExportFilenameUtil = getExportUtil("buildExportFilename");
  if (buildExportFilenameUtil) {
    return buildExportFilenameUtil(scope, EXPORT_SCOPE, EXPORT_SCOPE_SUFFIX, dateStamp);
  }
  const suffix = EXPORT_SCOPE_SUFFIX[scope] || EXPORT_SCOPE_SUFFIX.ATUAIS;
  return "emendas_export_" + dateStamp() + "_" + suffix + ".xlsx";
}

function isCurrentRecord(rec) {
  const isCurrentRecordUtil = getExportUtil("isCurrentRecord");
  if (isCurrentRecordUtil) {
    return isCurrentRecordUtil(rec);
  }
  return !(rec && Object.prototype.hasOwnProperty.call(rec, "is_current") && rec.is_current === false);
}

function getRecordCurrentStatus(rec) {
  return latestMarkedStatus(rec) || normalizeStatus(rec && rec.status_oficial ? rec.status_oficial : "") || "";
}

function matchesTextFilter(value, term) {
  const matchesTextFilterUtil = getExportUtil("matchesTextFilter");
  if (matchesTextFilterUtil) {
    return matchesTextFilterUtil(value, term, normalizeLooseText);
  }
  const src = normalizeLooseText(value || "");
  const q = normalizeLooseText(term || "");
  if (!q) return true;
  return src.indexOf(q) >= 0;
}

function filterRecordsForExport(scope, customFilters) {
  const filterRecordsForExportUtil = getExportFlowUtil("filterRecordsForExport");
  if (filterRecordsForExportUtil) {
    return filterRecordsForExportUtil(scope, customFilters, state.records, {
      exportScope: EXPORT_SCOPE,
      isCurrentRecord: isCurrentRecord,
      toInt: toInt,
      getRecordCurrentStatus: getRecordCurrentStatus,
      normalizeStatus: normalizeStatus,
      matchesTextFilter: matchesTextFilter
    });
  }

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
  const buildExportFiltersSnapshotUtil = getExportUtil("buildExportFiltersSnapshot");
  if (buildExportFiltersSnapshotUtil) {
    return buildExportFiltersSnapshotUtil(scope, customFilters, function () {
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
  const moduleFn = getAuxModalUtil("openExportCustomModal");
  if (moduleFn) {
    return moduleFn(Object.assign({}, getAuxModalContext(), {
      modal: exportCustomModal
    }));
  }
  if (!exportCustomModal) return;
  syncCustomExportFilters();
  refreshCustomExportSummary();
  setAuxModalVisibility(exportCustomModal, true);
}

function closeExportCustomModal() {
  const moduleFn = getAuxModalUtil("closeExportCustomModal");
  if (moduleFn) {
    return moduleFn(Object.assign({}, getAuxModalContext(), {
      modal: exportCustomModal
    }));
  }
  if (!exportCustomModal) return;
  setAuxModalVisibility(exportCustomModal, false);
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
  const runExportByScopeUtil = getExportFlowUtil("runExportByScope");
  if (runExportByScopeUtil) {
    return runExportByScopeUtil(scope, options, {
      exportScope: EXPORT_SCOPE,
      confirm: confirm,
      alert: alert,
      exportScopeLabel: exportScopeLabel,
      filterRecordsForExport: function (currentScope, customFilters) {
        return filterRecordsForExport(currentScope, customFilters);
      },
      templateReady: !!(lastImportedWorkbookTemplate && lastImportedWorkbookTemplate.buffer),
      buildExportFilename: buildExportFilename,
      buildExportFiltersSnapshot: buildExportFiltersSnapshot,
      exportRecordsToXlsx: exportRecordsToXlsx,
      onLatestExportReport: function (report) {
        latestExportReport = report;
      },
      isoNow: isoNow,
      renderImportDashboard: renderImportDashboard,
      countAuditEvents: countAuditEvents,
      syncExportLogToApi: syncExportLogToApi
    });
  }

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
  const moduleFn = getApiSyncOpsUtil("syncImportBatchToApi");
  if (moduleFn) {
    return await moduleFn(file, report, getApiSyncOpsContext());
  }
  return null;
}

// Envia linhas detalhadas da importacao em blocos para evitar payload gigante.
async function syncImportLinesToApi(loteId, rowDetails) {
  const moduleFn = getApiSyncOpsUtil("syncImportLinesToApi");
  if (moduleFn) {
    return await moduleFn(loteId, rowDetails, getApiSyncOpsContext());
  }
}

// Grava log de exportacao no backend (auditoria operacional).
async function syncExportLogToApi(meta) {
  const moduleFn = getApiSyncOpsUtil("syncExportLogToApi");
  if (moduleFn) {
    return await moduleFn(meta, getApiSyncOpsContext());
  }
}

// Exportador padrao: gera abas de dados + auditoria + resumo.
function exportRecordsToXlsx(records, filename, options) {
  const exportRecordsToXlsxUtil = getExportWorkbookWriterUtil("exportRecordsToXlsx");
  if (exportRecordsToXlsxUtil) {
    return exportRecordsToXlsxUtil(records, filename, options, {
      xlsxApi: getXlsxApi(),
      exportRecordsToTemplateXlsx: exportRecordsToTemplateXlsx,
      buildExportTableData: buildExportTableData,
      buildAuditLogTableData: buildAuditLogTableData,
      buildSummaryAoa: buildSummaryAoa,
      exportScopeAtuais: EXPORT_SCOPE.ATUAIS,
      buildPlanilha1Aoa: buildPlanilha1Aoa,
      runRoundTripCheck: runRoundTripCheck,
      dateStamp: dateStamp,
      notify: alert
    });
  }

  const xlsxApi = getXlsxApi();
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
  const exportRecordsToTemplateXlsxUtil = getExportTemplateWriterUtil("exportRecordsToTemplateXlsx");
  if (exportRecordsToTemplateXlsxUtil) {
    return exportRecordsToTemplateXlsxUtil(records, filename, options, {
      templateSnapshot: lastImportedWorkbookTemplate,
      xlsxApi: xlsxApi,
      resolveTemplateTargetSheets: resolveTemplateTargetSheets,
      detectHeaderRow: detectHeaderRow,
      buildCanonicalColumnMap: buildCanonicalColumnMap,
      templateCanonicalKeys: getTemplateCanonicalKeys(),
      getRecordValueForTemplate: getRecordValueForTemplate,
      setWorksheetCellValue: setWorksheetCellValue,
      runTemplateRoundTripCheck: runTemplateRoundTripCheck,
      countAuditEvents: countAuditEvents,
      dateStamp: dateStamp,
      notify: alert,
      log: function (message) {
        console.log(message);
      }
    });
  }

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
    const templateCanonicalKeys = getTemplateCanonicalKeys();
    const missingCols = templateCanonicalKeys.filter(function (key) { return columnByCanonical[key] == null; });
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
      templateCanonicalKeys.forEach(function (key) {
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
  const resolveTemplateTargetSheetsUtil = getExportTemplateWriterUtil("resolveTemplateTargetSheets");
  if (resolveTemplateTargetSheetsUtil) {
    return resolveTemplateTargetSheetsUtil(workbook, records);
  }

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

function buildCanonicalColumnMap(headers) {
  const ctx = getExportTemplateContext();
  const buildCanonicalColumnMapUtil = getExportTemplateUtil("buildCanonicalColumnMap");
  if (buildCanonicalColumnMapUtil) {
    return buildCanonicalColumnMapUtil(headers, ctx.importAliases, ctx.rawPreferredHeaders, ctx.normalizeHeader, ctx.canonicalKeys);
  }
  const map = {};
  ctx.canonicalKeys.forEach(function (key) {
    const idx = findHeaderIndexByAliases(headers, key);
    if (idx >= 0) map[key] = idx;
  });
  return map;
}

function findHeaderIndexByAliases(headers, canonicalKey) {
  const ctx = getExportTemplateContext();
  const findHeaderIndexByAliasesUtil = getExportTemplateUtil("findHeaderIndexByAliases");
  if (findHeaderIndexByAliasesUtil) {
    return findHeaderIndexByAliasesUtil(headers, canonicalKey, ctx.importAliases, ctx.rawPreferredHeaders, ctx.normalizeHeader);
  }
  const list = [];
  const aliases = ctx.importAliases[canonicalKey] || [];
  aliases.forEach(function (a) { list.push(a); });
  if (ctx.rawPreferredHeaders[canonicalKey]) list.push(ctx.rawPreferredHeaders[canonicalKey]);

  const wanted = new Set(list.map(function (x) { return ctx.normalizeHeader(x); }));
  for (let i = 0; i < (headers || []).length; i += 1) {
    if (wanted.has(ctx.normalizeHeader(headers[i]))) return i;
  }
  return -1;
}

function getRecordValueForTemplate(rec, canonicalKey) {
  const ctx = getExportTemplateContext();
  const getRecordValueForTemplateUtil = getExportTemplateUtil("getRecordValueForTemplate");
  if (getRecordValueForTemplateUtil) {
    return getRecordValueForTemplateUtil(rec, canonicalKey, ctx.importAliases, ctx.rawPreferredHeaders, ctx.normalizeHeader);
  }
  if (!rec) return "";
  if (canonicalKey === "status_oficial") return rec.status_oficial || "";

  const raw = rec.all_fields && typeof rec.all_fields === "object" ? rec.all_fields : null;
  if (raw) {
    const aliases = ctx.importAliases[canonicalKey] || [];
    const wanted = new Set(aliases.map(function (a) { return ctx.normalizeHeader(a); }));
    const preferred = ctx.rawPreferredHeaders[canonicalKey];
    if (preferred) wanted.add(ctx.normalizeHeader(preferred));

    const keys = Object.keys(raw);
    for (let i = 0; i < keys.length; i += 1) {
      const k = keys[i];
      if (wanted.has(ctx.normalizeHeader(k))) {
        const v = raw[k];
        if (v != null && String(v).trim() !== "") return v;
      }
    }
  }

  return rec[canonicalKey] == null ? "" : rec[canonicalKey];
}

function setWorksheetCellValue(ws, rowNumber, colIndex, value, canonicalKey, xlsxApi) {
  const ctx = getExportTemplateContext();
  const setWorksheetCellValueUtil = getExportTemplateUtil("setWorksheetCellValue");
  if (setWorksheetCellValueUtil) {
    return setWorksheetCellValueUtil(ws, rowNumber, colIndex, value, canonicalKey, xlsxApi, ctx.toNumber, ctx.normalizeCompareValue);
  }
  const addr = xlsxApi.utils.encode_cell({ r: Math.max(0, Number(rowNumber) - 1), c: Math.max(0, Number(colIndex)) });
  const previousCell = ws[addr];
  const prevValue = previousCell && Object.prototype.hasOwnProperty.call(previousCell, "v") ? previousCell.v : "";

  const numericField = canonicalKey === "valor_inicial" || canonicalKey === "valor_atual";
  const normalizedNext = value == null ? "" : value;

  let nextCell;
  if (numericField && String(normalizedNext).trim() !== "" && Number.isFinite(ctx.toNumber(normalizedNext))) {
    nextCell = {
      t: "n",
      v: ctx.toNumber(normalizedNext)
    };
  } else {
    nextCell = {
      t: "s",
      v: String(normalizedNext)
    };
  }

  const changed = ctx.normalizeCompareValue(prevValue) !== ctx.normalizeCompareValue(nextCell.v);
  if (!changed) return false;

  if (previousCell && previousCell.z) nextCell.z = previousCell.z;
  if (previousCell && previousCell.s) nextCell.s = previousCell.s;
  ws[addr] = nextCell;
  return true;
}

function normalizeCompareValue(v) {
  const normalizeCompareValueUtil = getExportTemplateUtil("normalizeCompareValue");
  if (normalizeCompareValueUtil) {
    return normalizeCompareValueUtil(v);
  }
  if (v == null) return "";
  if (typeof v === "number") return Number(v).toString();
  return String(v).trim();
}

function runTemplateRoundTripCheck(workbook, assertions) {
  const ctx = getExportTemplateContext();
  const runTemplateRoundTripCheckUtil = getExportTemplateUtil("runTemplateRoundTripCheck");
  if (runTemplateRoundTripCheckUtil) {
    return runTemplateRoundTripCheckUtil(workbook, assertions, ctx.normalizeCompareValue, ctx.xlsxApi);
  }
  try {
    const xlsxApi = ctx.xlsxApi;
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
      if (ctx.normalizeCompareValue(got) !== ctx.normalizeCompareValue(a.expected)) {
        issues.push("Divergencia em " + a.sheetName + "!" + addr + ": esperado=" + ctx.normalizeCompareValue(a.expected) + " recebido=" + ctx.normalizeCompareValue(got));
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
  const ctx = getExportDataContext();
  const buildExportTableDataUtil = getExportDataUtil("buildExportTableData");
  if (buildExportTableDataUtil) {
    return buildExportTableDataUtil(records, options, ctx);
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
    const users = ctx.getActiveUsersWithLastMark(r);
    const progress = ctx.calcProgress(users);
    const global = ctx.getGlobalProgressState(users);

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
  const ctx = getExportDataContext();
  const buildAuditLogTableDataUtil = getExportDataUtil("buildAuditLogTableData");
  if (buildAuditLogTableDataUtil) {
    return buildAuditLogTableDataUtil(records, ctx);
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
    const orderedEvents = ctx.getEventsSorted(r);
    const users = ctx.getActiveUsersWithLastMark(r);
    const progress = ctx.calcProgress(users);
    const global = ctx.getGlobalProgressState(users);
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
  const ctx = getExportDataContext();
  const buildSummaryAoaUtil = getExportDataUtil("buildSummaryAoa");
  if (buildSummaryAoaUtil) {
    return buildSummaryAoaUtil(records, totalEvents, exportScope, exportFilters, ctx);
  }
  const now = new Date().toISOString();
  const byGlobal = { done: 0, in_progress: 0, attention: 0, no_marks: 0 };
  const scope = ctx.exportScopeLabel(exportScope || EXPORT_SCOPE.ATUAIS);
  const filtersJson = JSON.stringify(exportFilters || {});

  records.forEach(function (r) {
    const global = ctx.getGlobalProgressState(ctx.getActiveUsersWithLastMark(r));
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
  const ctx = getExportTemplateContext();
  const runRoundTripCheckUtil = getExportTemplateUtil("runRoundTripCheck");
  if (runRoundTripCheckUtil) {
    return runRoundTripCheckUtil(workbook, headers, ctx.xlsxApi);
  }
  try {
    const xlsxApi = ctx.xlsxApi;
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
  const ctx = getExportTemplateContext();
  const buildPlanilha1AoaUtil = getExportTemplateUtil("buildPlanilha1Aoa");
  if (buildPlanilha1AoaUtil) {
    return buildPlanilha1AoaUtil(records, ctx.inferDemoSeed);
  }
  const safeRecords = (records || []).filter(function (r) {
    return !ctx.inferDemoSeed(r);
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

function focusIfPossible(target) {
  if (!target || typeof target.focus !== "function") return;
  target.focus();
}

function getOptionFunction(options, key) {
  if (!options) return null;
  const candidate = options[key];
  return typeof candidate === "function" ? candidate : null;
}

function requireModuleFunction(getter, methodName, moduleLabel) {
  const candidate = getter(methodName);
  if (typeof candidate === "function") return candidate;
  throw new Error("Modulo obrigatorio indisponivel: " + moduleLabel + "." + methodName);
}

function clearNodeChildren(node) {
  if (!node) return;
  const clearChildrenUtil = getDomUtil("clearChildren");
  if (clearChildrenUtil) {
    clearChildrenUtil(node);
    return;
  }
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function appendRenderedMarkup(container, rendered) {
  if (!container) return;
  const appendRenderedMarkupUtil = getDomUtil("appendRenderedMarkup");
  if (appendRenderedMarkupUtil) {
    appendRenderedMarkupUtil(container, rendered);
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
  const escapeHtmlUtil = getEscapeUtil("escapeHtml");
  if (escapeHtmlUtil) {
    return escapeHtmlUtil(str);
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
  const configureApiClientUtil = getApiClientUtil("configure");
  if (!configureApiClientUtil) return;
  configureApiClientUtil(getApiClientConfigContext());

  const configureConcurrencyUtil = getConcurrencyUtil("configure");
  if (!configureConcurrencyUtil) return;
  configureConcurrencyUtil(getConcurrencyConfigContext());
}

const initializeAppStartupUtil = getAppStartupUtil("initializeAppStartup");
if (initializeAppStartupUtil) {
  initializeAppStartupUtil({
    configureFrontendModules: configureFrontendModules,
    loadUserConfig: loadUserConfig,
    bootstrapAppUi: getAppLifecycleUtil("bootstrapAppUi"),
    getAppLifecycleContext: getAppLifecycleContext,
    initSelects: initSelects,
    setupAuthUi: setupAuthUi,
    setupCrossTabSync: setupCrossTabSync,
    render: render,
    initializeAuthFlow: initializeAuthFlow,
    bindUiShellEvents: getAppBindingsUtil("bindUiShellEvents"),
    getUiShellBindingsContext: getUiShellBindingsContext,
    bindImportControls: getImportControlsUtil("bindImportControls"),
    getImportControlsContext: getImportControlsContext
  });
} else {
  configureFrontendModules();
  loadUserConfig(false);

  const bootstrapAppUiUtil = getAppLifecycleUtil("bootstrapAppUi");
  if (bootstrapAppUiUtil) {
    bootstrapAppUiUtil(getAppLifecycleContext());
  } else {
    initSelects();
    setupAuthUi();
    setupCrossTabSync();
    render();
    initializeAuthFlow();
  }

  const bindUiShellEventsUtil = getAppBindingsUtil("bindUiShellEvents");
  if (bindUiShellEventsUtil) {
    bindUiShellEventsUtil(getUiShellBindingsContext());
  }

  const bindImportControlsUtil = getImportControlsUtil("bindImportControls");
  if (bindImportControlsUtil) {
    bindImportControlsUtil(getImportControlsContext());
  }
}

