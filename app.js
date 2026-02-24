/***********************
 * Prototipo SEC Emendas - v3
 * - Status oficial controlado por APG/SUPERVISAO
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

const CROSS_TAB_CHANNEL_NAME = "sec_emendas";
const CROSS_TAB_PING_KEY = "SEC_STATE_PING";
const LOCAL_TAB_ID = "tab_" + Math.random().toString(36).slice(2) + "_" + Date.now();
const SYSTEM_MIGRATION_USER = "sistema";
const SYSTEM_MIGRATION_ROLE = "PROGRAMADOR";
const USER_ROLE_OPTIONS = ["APG", "SUPERVISAO", "CONTABIL", "POWERBI", "PROGRAMADOR"];
const USER_NAME_KEY = "SEC_USER_NAME";
const USER_ROLE_KEY = "SEC_USER_ROLE";
const API_BASE_URL_KEY = "SEC_API_BASE_URL";
const API_ENABLED_KEY = "SEC_API_ENABLED";
const API_SHARED_KEY_SESSION_KEY = "SEC_API_SHARED_KEY_SESSION";
const SESSION_TOKEN_KEY = "SEC_SESSION_TOKEN";
const AUTH_LOGIN_PAGE = "login.html";
const AUTH_REGISTER_PAGE = "cadastro.html";
const STORAGE_MODE_KEY = "SEC_STORAGE_MODE";
const STORAGE_MODE_LOCAL = "local";
const STORAGE_MODE_SESSION = "session";
const DEFAULT_API_BASE_URL = "http://localhost:8000";
const RUNTIME_CONFIG = (typeof window !== "undefined" && window.SEC_APP_CONFIG && typeof window.SEC_APP_CONFIG === "object") ? window.SEC_APP_CONFIG : {};
const API_WS_PATH = "/ws";
const WS_RECONNECT_BASE_MS = 1500;
const WS_RECONNECT_MAX_MS = 15000;
const WS_REFRESH_DEBOUNCE_MS = 400;
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
  { key: "municipio", label: "Municipio", type: "string" },
  { key: "valor_inicial", label: "Valor Inicial", type: "money" },
  { key: "valor_atual", label: "Valor Atual", type: "money" },
  { key: "processo_sei", label: "Processo SEI", type: "string" }
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

loadUserConfig(false);

const DEMO = [
  mkRecord({
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
let latestImportReport = null;
let lastImportValidation = null;
let lastImportedWorkbookTemplate = null;
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
const modalClose = document.getElementById("modalClose");
const modalClose2 = document.getElementById("modalClose2");

const kv = document.getElementById("kv");
const historyEl = document.getElementById("history");
const userProgressBox = document.getElementById("userProgressBox");

const markStatus = document.getElementById("markStatus");
const markReason = document.getElementById("markReason");
const btnMarkStatus = document.getElementById("btnMarkStatus");
const btnAddNote = document.getElementById("btnAddNote");

const conflictBox = document.getElementById("conflictBox");
const conflictText = document.getElementById("conflictText");
const marksSummary = document.getElementById("marksSummary");
const rawFields = document.getElementById("rawFields");

const btnExport = document.getElementById("btnExport");
const btnExportXlsx = document.getElementById("btnExportXlsx");
const btnExportOne = document.getElementById("btnExportOne");
const btnReset = document.getElementById("btnReset");
const fileCsv = document.getElementById("fileCsv");
const importReport = document.getElementById("importReport");
const importLabel = document.querySelector("label[for='fileCsv']");
const currentUserInfo = document.getElementById("currentUserInfo");
const btnSwitchUser = document.getElementById("btnSwitchUser");
const btnDemo4Users = document.getElementById("btnDemo4Users");

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

function initSelects() {
  setSelectOptions(statusFilter, STATUS_FILTERS);

  setSelectOptions(markStatus, STATUS.map(function (s) {
    return { label: s, value: s };
  }));

  syncYearFilter();
}

function syncYearFilter() {
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

function setSelectOptions(select, options, preferredValue) {
  const prev = preferredValue !== undefined ? preferredValue : select.value;
  select.innerHTML = "";
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

function render() {
  const rows = getFiltered();
  tbody.innerHTML = "";

  rows.forEach(function (r) {
    const users = getActiveUsersWithLastMark(r);
    const progress = calcProgress(users);
    const staleDays = daysSince(lastEventAt(r));

    const tr = document.createElement("tr");
    tr.innerHTML = ""
      + "<td><code>" + escapeHtml(r.id) + "</code></td>"
      + "<td>" + escapeHtml(r.identificacao) + "</td>"
      + "<td>" + escapeHtml(r.municipio) + "</td>"
      + "<td>" + escapeHtml(r.deputado) + "</td>"
      + "<td>" + renderProgressBar(progress) + "</td>"
      + "<td>" + renderMemberChips(users) + "</td>"
      + "<td class=\"muted small\">" + (staleDays === Infinity ? "-" : (String(staleDays) + " dias")) + "</td>"
      + "<td>R$ " + fmtMoney(r.valor_atual) + "</td>"
      + "<td class=\"muted\">" + fmtDateTime(r.updated_at) + "</td>"
      + "<td><button class=\"btn\" data-action=\"view\" data-id=\"" + escapeHtml(r.id) + "\">Ver</button></td>";
    tbody.appendChild(tr);
  });

  Array.prototype.forEach.call(tbody.querySelectorAll("button[data-action='view']"), function (btn) {
    btn.addEventListener("click", function () {
      openModal(btn.dataset.id);
    });
  });

  renderImportDashboard();
}

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
btnSwitchUser.addEventListener("click", async function () {
  if (isApiEnabled()) {
    await logoutCurrentUser();
    redirectToAuth(AUTH_LOGIN_PAGE, "logout=1");
    return;
  }

  loadUserConfig(true);
  applyAccessProfile();
  render();
});
if (btnDemo4Users) {
  btnDemo4Users.addEventListener("click", function () {
    generateRandomMultiUserDemo();
  });
}

modalClose.addEventListener("click", closeModal);
modalClose2.addEventListener("click", closeModal);
modal.addEventListener("click", function (e) {
  if (e.target === modal) closeModal();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && modal.classList.contains("show")) {
    closeModal();
  }
});

btnMarkStatus.addEventListener("click", async function () {
  const rec = getSelected();
  if (!rec) return;

  const next = normalizeStatus(markStatus.value);
  const why = (markReason.value || "").trim();
  if (!why) {
    alert("Motivo/observacao e obrigatorio para registrar marcacao.");
    return;
  }

  rec.updated_at = isoNow();
  rec.eventos.unshift(mkEvent("MARK_STATUS", { to: next, note: why }));

  try {
    await syncGenericEventToApi(rec, {
      tipo_evento: "MARK_STATUS",
      valor_novo: next,
      motivo: why
    });
  } catch (err) {
    handleApiSyncError(err, "marcacao");
  }

  saveState();
  render();
  openModal(rec.id, true);
});

btnAddNote.addEventListener("click", async function () {
  const rec = getSelected();
  if (!rec) return;

  const why = (markReason.value || "").trim();
  if (!why) {
    alert("Escreva uma observacao para registrar no historico.");
    return;
  }

  rec.updated_at = isoNow();
  rec.eventos.unshift(mkEvent("NOTE", { note: why }));

  try {
    await syncGenericEventToApi(rec, {
      tipo_evento: "NOTE",
      motivo: why
    });
  } catch (err) {
    handleApiSyncError(err, "nota");
  }

  saveState();
  render();
  openModal(rec.id, true);
});

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
    templateMode: templateMode
  });

  await syncExportLogToApi({
    formato: "XLSX",
    arquivoNome: filename,
    quantidadeRegistros: 1,
    quantidadeEventos: countAuditEvents([rec]),
    filtros: { single_id: rec.id },
    modoHeaders: templateMode ? "template_original" : "originais",
    roundTripOk: exportMeta && exportMeta.roundTrip ? exportMeta.roundTrip.ok : null,
    roundTripIssues: exportMeta && exportMeta.roundTrip ? (exportMeta.roundTrip.issues || []) : []
  });
});
if (btnExport) {
  btnExport.style.display = "none";
}

btnExportXlsx.addEventListener("click", async function () {
  const templateReady = !!(lastImportedWorkbookTemplate && lastImportedWorkbookTemplate.buffer);
  const templateMode = templateReady
    ? confirm("Exportar em modo TEMPLATE (mesma estrutura do XLSX original, alterando apenas dados)?")
    : false;

  const modeOriginal = templateMode ? true : confirm("Exportar com headers originais? OK = Originais, Cancelar = Normalizados.");
  const roundTripCheck = confirm("Executar round-trip check apos exportar? (pode ser mais lento)");
  const filename = "emendas_export_" + dateStamp() + ".xlsx";
  const exportMeta = exportRecordsToXlsx(state.records, filename, {
    useOriginalHeaders: modeOriginal,
    roundTripCheck: roundTripCheck,
    templateMode: templateMode
  });

  await syncExportLogToApi({
    formato: "XLSX",
    arquivoNome: filename,
    quantidadeRegistros: state.records.length,
    quantidadeEventos: countAuditEvents(state.records),
    filtros: getCurrentFilterSnapshot(),
    modoHeaders: templateMode ? "template_original" : (modeOriginal ? "originais" : "normalizados"),
    roundTripOk: exportMeta && exportMeta.roundTrip ? exportMeta.roundTrip.ok : null,
    roundTripIssues: exportMeta && exportMeta.roundTrip ? (exportMeta.roundTrip.issues || []) : []
  });
});

btnReset.addEventListener("click", function () {
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
});

fileCsv.addEventListener("change", async function () {
  const file = fileCsv.files && fileCsv.files[0];
  if (!file) return;

  try {
    const sourceRows = await parseInputFile(file);
    if (!sourceRows.length) {
      alert("Nenhuma linha valida encontrada no arquivo.");
      hideImportReport();
      return;
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

    alert("Importacao concluida. Criados: " + report.created + " | Atualizados: " + report.updated + " | Sem alteracao: " + report.unchanged + " | Linhas lidas: " + report.totalRows);
  } catch (err) {
    console.error(err);
    const detail = err && err.message ? String(err.message) : "erro desconhecido";
    const hint = detail.includes("Biblioteca XLSX nao carregada") ? " Dica: abra por http://127.0.0.1:5500 e confirme internet para carregar a biblioteca XLSX." : "";
    alert("Falha ao importar arquivo. Detalhe: " + detail + hint);
  } finally {
    fileCsv.value = "";
  }
});

function openModal(id, keepReasons) {
  lastFocusedElement = document.activeElement;
  selectedId = id;
  const rec = getSelected();
  if (!rec) return;

  modalTitle.textContent = "Emenda: " + rec.id;
  modalSub.textContent = rec.identificacao + " | " + rec.municipio + " | " + rec.deputado;

  if (!keepReasons) {
    markReason.value = "";
  }

  kv.innerHTML = "";
  const pairs = [
    ["Ano", rec.ano],
    ["Identificacao", rec.identificacao],
    ["Cod Subfonte", rec.cod_subfonte || "-"],
    ["Cod Acao", rec.cod_acao || "-"],
    ["Descricao Acao", rec.descricao_acao || "-"],
    ["Municipio", rec.municipio],
    ["Deputado", rec.deputado],
    ["Cod UO", rec.cod_uo || "-"],
    ["Sigla UO", rec.sigla_uo || "-"],
    ["Cod Orgao", rec.cod_orgao || "-"],
    ["Valor Inicial", "R$ " + fmtMoney(rec.valor_inicial)],
    ["Valor Atual", "R$ " + fmtMoney(rec.valor_atual)],
    ["Processo SEI", rec.processo_sei || "-"],
    ["Ref Key", rec.ref_key || "-"]
  ];
  pairs.forEach(function (pair) {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = "<div class=\"k\">" + escapeHtml(pair[0]) + "</div><div class=\"v\">" + escapeHtml(String(pair[1])) + "</div>";
    kv.appendChild(item);
  });

  const users = getActiveUsersWithLastMark(rec);
  const progress = calcProgress(users);
  const delays = whoIsDelaying(users);
  const attentionIssues = getAttentionIssues(users);

  const lastMarks = getLastMarksByUser(rec);
  renderMarksSummary(lastMarks);
  renderRawFields(rec);

  if (userProgressBox) {
    userProgressBox.innerHTML = ""
      + renderProgressBar(progress)
      + "<div class=\"member-chip-wrap\" style=\"margin-top:8px\">" + renderMemberChips(users) + "</div>"
      + (delays.length
        ? ("<p class=\"muted small\" style=\"margin-top:8px\"><b>Quem esta atrasando:</b> " + delays.map(function (u) { return escapeHtml(u.name); }).join(", ") + "</p>")
        : "<p class=\"muted small\" style=\"margin-top:8px\"><b>Todos concluiram.</b></p>");
  }

  if (attentionIssues.length) {
    conflictBox.classList.remove("hidden");
    conflictText.textContent = attentionIssues.join(" | ");
  } else {
    conflictBox.classList.add("hidden");
    conflictText.textContent = "";
  }

  historyEl.innerHTML = "";
  getEventsSorted(rec).forEach(function (ev) {
    const div = document.createElement("div");
    div.className = "event";

    const who = (ev.actor_role || "-") + " | " + (ev.actor_user || "-");
    let right = "";
    if (ev.type === "OFFICIAL_STATUS") {
      right = "<b>LEGADO</b> " + "<b>" + escapeHtml(ev.from || "") + "</b> -> <b>" + escapeHtml(ev.to || "") + "</b>";
    } else if (ev.type === "MARK_STATUS") {
      right = "<b>" + escapeHtml(ev.to || "") + "</b>";
    } else if (ev.type === "EDIT_FIELD") {
      right = "<b>" + escapeHtml(ev.field || "") + "</b>: " + escapeHtml(String(ev.from || "")) + " -> " + escapeHtml(String(ev.to || ""));
    }

    div.innerHTML = ""
      + "<div class=\"top\">"
      + "<div class=\"meta\"><b>" + escapeHtml(who) + "</b> | " + fmtDateTime(ev.at) + " | <span class=\"muted\">" + escapeHtml(ev.type) + "</span></div>"
      + "<div class=\"meta\">" + right + "</div>"
      + "</div>"
      + "<div class=\"desc\">" + escapeHtml(ev.note || "") + "</div>";
    historyEl.appendChild(div);
  });

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(function () {
    if (modalClose && typeof modalClose.focus === "function") modalClose.focus();
  }, 0);
}

function renderRawFields(rec) {
  if (!rawFields) return;
  const obj = rec && rec.all_fields && typeof rec.all_fields === "object" ? rec.all_fields : {};
  const keys = Object.keys(obj);

  if (!keys.length) {
    rawFields.innerHTML = "<p class=\"muted small\">Sem campos brutos importados.</p>";
    return;
  }

  let html = "<table class=\"table\" style=\"min-width:760px\"><thead><tr><th>Campo</th><th>Valor</th></tr></thead><tbody>";
  keys.forEach(function (k) {
    html += "<tr><td><code>" + escapeHtml(k) + "</code></td><td>" + escapeHtml(String(obj[k] == null ? "" : obj[k])) + "</td></tr>";
  });
  html += "</tbody></table>";
  rawFields.innerHTML = html;
}

function getEventsSorted(rec) {
  return (rec.eventos || []).slice().sort(function (a, b) {
    const ta = new Date(a.at).getTime() || 0;
    const tb = new Date(b.at).getTime() || 0;
    return tb - ta;
  });
}

function renderMarksSummary(lastMarks) {
  const entries = Object.entries(lastMarks).sort(function (a, b) {
    if (a[0] === b[0]) return 0;
    return a[0] > b[0] ? 1 : -1;
  });

  let html = ""
    + "<table class=\"table\" style=\"min-width:700px\">"
    + "<thead><tr>"
    + "<th>Usuario</th><th>Setor</th><th>Ultima marcacao</th><th>Data/Hora</th><th>Observacao</th>"
    + "</tr></thead><tbody>";

  entries.forEach(function (entry) {
    const user = entry[0];
    const info = entry[1];
    html += "<tr>"
      + "<td><code>" + escapeHtml(user) + "</code></td>"
      + "<td>" + escapeHtml(info.role || "-") + "</td>"
      + "<td>" + renderStatus(info.status || "-") + "</td>"
      + "<td class=\"muted\">" + fmtDateTime(info.at) + "</td>"
      + "<td>" + escapeHtml(info.note || "") + "</td>"
      + "</tr>";
  });

  if (!entries.length) {
    html += "<tr><td colspan=\"5\" class=\"muted\">Nenhuma marcacao registrada ainda.</td></tr>";
  }

  html += "</tbody></table>";
  marksSummary.innerHTML = html;
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

function calcProgress(users) {
  const total = Array.isArray(users) ? users.length : 0;
  const concl = (users || []).filter(function (u) { return u.lastStatus === "Concluido"; }).length;
  return {
    total: total,
    concl: concl,
    percent: total ? Math.round((concl / total) * 100) : 0,
    done: total > 0 && concl === total
  };
}

function getAttentionIssues(users) {
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

function getGlobalProgressState(users) {
  const list = Array.isArray(users) ? users : [];
  if (!list.length) return { code: "no_marks", label: "Sem marcacoes" };
  const progress = calcProgress(list);
  const issues = getAttentionIssues(list);
  if (issues.length) return { code: "attention", label: "Atencao" };
  if (progress.done) return { code: "done", label: "Concluido global" };
  return { code: "in_progress", label: "Em andamento" };
}

function getInitials(name) {
  return String(name || "").trim().split(/\s+/).slice(0, 2).map(function (p) { return p.charAt(0); }).join("").toUpperCase();
}

function statusClass(status) {
  const s = normalizeLooseText(status);
  if (s.indexOf("concl") >= 0) return "st-ok";
  if (s.indexOf("cancel") >= 0) return "st-bad";
  if (s.indexOf("pend") >= 0 || s.indexOf("aguard") >= 0) return "st-warn";
  if (s.indexOf("exec") >= 0 || s.indexOf("anal") >= 0 || s.indexOf("apro") >= 0 || s.indexOf("rece") >= 0) return "st-mid";
  return "st-none";
}

function renderMemberChips(users) {
  const list = Array.isArray(users) ? users : [];
  if (!list.length) return "<span class=\"muted small\">Sem marcacoes</span>";

  return list.map(function (u) {
    const cls = statusClass(u.lastStatus || "");
    const stale = daysSince(u.lastAt);
    const staleTag = stale === Infinity ? "" : "<span class=\"chip-age\">" + String(stale) + "d</span>";
    const title = escapeHtml(u.name + " / " + (u.role || "-") + " | " + (u.lastStatus || "Sem status") + " | " + (u.lastAt || "-"));
    return "<span class=\"member-chip " + cls + "\" title=\"" + title + "\"><span class=\"mav\">" + escapeHtml(getInitials(u.name)) + "</span><span class=\"mtxt\">" + escapeHtml(u.lastStatus || "Sem status") + "</span>" + staleTag + "</span>";
  }).join("");
}

function renderProgressBar(progress) {
  const safe = progress || { concl: 0, total: 0, percent: 0, done: false };
  const cls = safe.done ? "ok" : (safe.percent >= 50 ? "warn" : "bad");
  return ""
    + "<div class=\"prog\">"
    + "  <div class=\"prog-top\"><span class=\"light " + cls + "\"></span><span class=\"muted small\">" + String(safe.concl) + "/" + String(safe.total) + " concluiram (" + String(safe.percent) + "%)</span></div>"
    + "  <div class=\"prog-bar\"><div class=\"prog-fill " + cls + "\" style=\"width:" + String(safe.percent) + "%\"></div></div>"
    + "</div>";
}

function lastEventAt(rec) {
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

function daysSince(iso) {
  if (!iso) return Infinity;
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts) || ts <= 0) return Infinity;
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}

function whoIsDelaying(users) {
  return (users || []).filter(function (u) {
    return u.lastStatus !== "Concluido";
  });
}

function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  selectedId = null;
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function getSelected() {
  return state.records.find(function (r) {
    return r.id === selectedId;
  });
}

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

function buildImportNote(fileName, ctx) {
  return "Importado de " + fileName + " | Aba: " + (ctx.sheetName || "XLSX") + " | Linha: " + String(ctx.rowNumber || "-");
}

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
  const color = statusColor(status);
  return "<span class=\"badge\"><span class=\"dot\" style=\"background:" + color + "\"></span>" + escapeHtml(status) + "</span>";
}

function statusColor(status) {
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
        onAuthSuccess(resp);
      } catch (err) {
        setAuthMessage(extractApiError(err, "Falha no cadastro."), true);
      }
    });
  }
}

function syncRegisterRoles() {
  if (!authRegisterRole) return;
  authRegisterRole.innerHTML = "";
  USER_ROLE_OPTIONS.forEach(function (role) {
    const opt = document.createElement("option");
    opt.value = role;
    opt.textContent = role;
    authRegisterRole.appendChild(opt);
  });
}

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
  const msg = err && err.message ? String(err.message) : "";
  if (!msg) return fallback;
  const mark = "::";
  if (msg.indexOf(mark) >= 0) return msg.split(mark)[1] || fallback;
  return msg;
}

function onAuthSuccess(resp) {
  const token = resp && resp.token ? String(resp.token) : "";
  const usuario = resp && resp.usuario ? resp.usuario : null;
  if (!token || !usuario) {
    setAuthMessage("Resposta de autenticacao invalida.", true);
    return;
  }

  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  setAuthenticatedUser(usuario);
  hideAuthGate();
  applyAccessProfile();
  bootstrapApiIntegration().finally(function () {
    connectApiSocket();
  });
  render();
}


function setAuthenticatedUser(usuario) {
  CURRENT_USER = String(usuario.nome || CURRENT_USER).trim() || CURRENT_USER;
  CURRENT_ROLE = normalizeUserRole(usuario.perfil || CURRENT_ROLE);
  localStorage.setItem(USER_NAME_KEY, CURRENT_USER);
  localStorage.setItem(USER_ROLE_KEY, CURRENT_ROLE);
}

function redirectToAuth(page, query) {
  const target = page || AUTH_LOGIN_PAGE;
  const suffix = query ? (String(query).startsWith("?") ? String(query) : "?" + String(query)) : "";
  const next = encodeURIComponent("index.html");
  const hasQ = suffix.indexOf("?") >= 0;
  const finalUrl = target + suffix + (hasQ ? "&" : "?") + "next=" + next;
  if (!window.location.pathname.toLowerCase().endsWith("/" + target.toLowerCase())) {
    window.location.href = finalUrl;
  }
}
async function logoutCurrentUser() {
  const token = String(sessionStorage.getItem(SESSION_TOKEN_KEY) || "").trim();
  if (token && isApiEnabled()) {
    try {
      await apiRequest("POST", "/auth/logout", {});
    } catch (_err) {
      // ignora erro de logout remoto
    }
  }
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  closeApiSocket();
}

async function initializeAuthFlow() {
  if (!isApiEnabled()) {
    closeApiSocket();
    loadUserConfig(false);
    applyAccessProfile();
    bootstrapApiIntegration();
    return;
  }

  const token = String(sessionStorage.getItem(SESSION_TOKEN_KEY) || "").trim();
  if (!token) {
    closeApiSocket();
    redirectToAuth(AUTH_LOGIN_PAGE, "msg=" + encodeURIComponent("Entre para continuar."));
    return;
  }

  try {
    const me = await apiRequest("GET", "/auth/me");
    setAuthenticatedUser(me);
    hideAuthGate();
    applyAccessProfile();
    await bootstrapApiIntegration();
    connectApiSocket();
  } catch (_err) {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    closeApiSocket();
    redirectToAuth(AUTH_LOGIN_PAGE, "msg=" + encodeURIComponent("Sessao expirada. Faca login novamente."));
  }
}


function loadUserConfig(forcePrompt) {
  const legacyUser = localStorage.getItem("SEC_USER_ID");
  const savedUser = localStorage.getItem(USER_NAME_KEY) || legacyUser;
  const savedRole = localStorage.getItem(USER_ROLE_KEY);

  if (savedUser) CURRENT_USER = String(savedUser).trim() || CURRENT_USER;
  if (savedRole) CURRENT_ROLE = normalizeUserRole(savedRole);

  if (isApiEnabled()) return;

  if (forcePrompt || !savedUser || !savedRole) {
    const nameInput = prompt("Informe seu nome (ex.: Miguel):", savedUser || CURRENT_USER) || CURRENT_USER;
    const roleInput = prompt("Informe seu setor (APG | SUPERVISAO | CONTABIL | POWERBI | PROGRAMADOR):", savedRole || CURRENT_ROLE) || CURRENT_ROLE;

    CURRENT_USER = String(nameInput).trim() || CURRENT_USER;
    CURRENT_ROLE = normalizeUserRole(roleInput);

    localStorage.setItem(USER_NAME_KEY, CURRENT_USER);
    localStorage.setItem(USER_ROLE_KEY, CURRENT_ROLE);
  }
}

function applyAccessProfile() {
  const isSupervisor = CURRENT_ROLE === "SUPERVISAO" || CURRENT_ROLE === "PROGRAMADOR";
  const canManageData = isSupervisor || CURRENT_ROLE === "APG";
  const apiTag = apiOnline ? "API online" : "modo local";
  const storageTag = getStorageMode() === STORAGE_MODE_LOCAL ? "persistencia local" : "sessao";

  if (currentUserInfo) {
    currentUserInfo.textContent = "Usuario: " + CURRENT_USER + " / " + CURRENT_ROLE + (isSupervisor ? " (visao geral)" : "") + " | " + apiTag + " | " + storageTag;
  }

  if (btnExport) btnExport.style.display = canManageData ? "inline-block" : "none";
  if (btnExportXlsx) btnExportXlsx.style.display = canManageData ? "inline-block" : "none";
  if (importLabel) importLabel.style.display = canManageData ? "inline-block" : "none";
  if (btnReset) btnReset.style.display = canManageData ? "inline-block" : "none";
  if (btnDemo4Users) btnDemo4Users.style.display = canManageData ? "inline-block" : "none";
}

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

  remoteList.forEach(function (re) {
    const idInterno = text(re.id_interno);
    if (!idInterno) return;

    apiEmendaIdByInterno[idInterno] = Number(re.id);

    const local = localByInternal[idInterno];
    if (local) {
      local.backend_id = Number(re.id);
      if (re.updated_at) local.updated_at = String(re.updated_at);

      const remoteStatus = normalizeStatus(re.status_oficial || "");
      if (remoteStatus && !latestMarkedStatus(local)) {
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

async function syncOfficialStatusToApi(rec, nextStatus, motivo) {
  if (!isApiEnabled()) return;
  const backendId = await ensureBackendEmenda(rec);
  await apiRequest("POST", "/emendas/" + String(backendId) + "/status", {
    novo_status: nextStatus,
    motivo: motivo
  }, "UI");
  apiOnline = true;
  apiLastError = "";
  applyAccessProfile();
}

async function syncGenericEventToApi(rec, payload) {
  if (!isApiEnabled()) return;
  const backendId = await ensureBackendEmenda(rec);
  await apiRequest("POST", "/emendas/" + String(backendId) + "/eventos", payload, payload && payload.origem_evento ? payload.origem_evento : "UI");
  apiOnline = true;
  apiLastError = "";
  applyAccessProfile();
}

async function ensureBackendEmenda(rec) {
  if (rec.backend_id) return rec.backend_id;

  const known = apiEmendaIdByInterno[rec.id];
  if (known) {
    rec.backend_id = Number(known);
    return rec.backend_id;
  }

  const remoteList = await apiRequest("GET", "/emendas", undefined, "API");
  const found = (Array.isArray(remoteList) ? remoteList : []).find(function (x) {
    return text(x.id_interno) === rec.id;
  });

  if (found) {
    rec.backend_id = Number(found.id);
    apiEmendaIdByInterno[rec.id] = rec.backend_id;
    return rec.backend_id;
  }

  const created = await apiRequest("POST", "/emendas", {
    id_interno: rec.id,
    ano: toInt(rec.ano) || currentYear(),
    identificacao: rec.identificacao || "-",
    status_oficial: deriveStatusForBackend(rec)
  }, "IMPORT");

  rec.backend_id = created && created.id != null ? Number(created.id) : null;
  if (rec.backend_id) apiEmendaIdByInterno[rec.id] = rec.backend_id;
  return rec.backend_id;
}


function getApiWebSocketUrl() {
  const base = getApiBaseUrl();
  if (!base) return "";
  if (base.indexOf("https://") === 0) return "wss://" + base.slice(8) + API_WS_PATH;
  if (base.indexOf("http://") === 0) return "ws://" + base.slice(7) + API_WS_PATH;
  return "";
}

function clearApiSocketReconnectTimer() {
  if (!apiSocketReconnectTimer) return;
  clearTimeout(apiSocketReconnectTimer);
  apiSocketReconnectTimer = null;
}

function closeApiSocket() {
  clearApiSocketReconnectTimer();
  if (apiSocket) {
    try { apiSocket.onopen = null; apiSocket.onmessage = null; apiSocket.onerror = null; apiSocket.onclose = null; } catch (_err) {}
    try { apiSocket.close(); } catch (_err) {}
    apiSocket = null;
  }
}

function scheduleApiSocketReconnect() {
  clearApiSocketReconnectTimer();
  const token = String(sessionStorage.getItem(SESSION_TOKEN_KEY) || "").trim();
  if (!isApiEnabled() || !token) return;

  const waitMs = Math.max(WS_RECONNECT_BASE_MS, Math.min(apiSocketBackoffMs, WS_RECONNECT_MAX_MS));
  apiSocketReconnectTimer = setTimeout(function () {
    connectApiSocket();
  }, waitMs);
  apiSocketBackoffMs = Math.min(WS_RECONNECT_MAX_MS, Math.floor(waitMs * 1.8));
}

function queueApiRefreshFromSocket() {
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


function connectApiSocket() {
  closeApiSocket();

  if (typeof WebSocket === "undefined") return;
  if (!isApiEnabled()) return;

  const token = String(sessionStorage.getItem(SESSION_TOKEN_KEY) || "").trim();
  if (!token) return;

  const wsBase = getApiWebSocketUrl();
  if (!wsBase) return;

  const wsUrl = wsBase + "?token=" + encodeURIComponent(token);
  try {
    apiSocket = new WebSocket(wsUrl);
  } catch (_err) {
    scheduleApiSocketReconnect();
    return;
  }

  apiSocket.onopen = function () {
    apiSocketBackoffMs = WS_RECONNECT_BASE_MS;
  };

  apiSocket.onmessage = function (evt) {
    const raw = evt && evt.data ? String(evt.data) : "";
    if (!raw) return;

    let data = null;
    try { data = JSON.parse(raw); } catch (_err) { return; }
    if (!data || data.type !== "update") return;

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
function isApiEnabled() {
  const raw = localStorage.getItem(API_ENABLED_KEY);
  if (raw == null || raw === "") return true;
  return String(raw).trim().toLowerCase() !== "false";
}

function getApiBaseUrl() {
  const raw = localStorage.getItem(API_BASE_URL_KEY);
  const runtimeBase = text(RUNTIME_CONFIG.API_BASE_URL);
  const byHostMap = (RUNTIME_CONFIG && RUNTIME_CONFIG.API_BASE_URL_BY_HOST && typeof RUNTIME_CONFIG.API_BASE_URL_BY_HOST === "object") ? RUNTIME_CONFIG.API_BASE_URL_BY_HOST : {};
  const host = (typeof window !== "undefined" && window.location && window.location.hostname) ? String(window.location.hostname) : "";
  const hostBase = text(byHostMap[host]);
  const base = text(raw) || hostBase || runtimeBase || DEFAULT_API_BASE_URL;
  return base.replace(/\/+$/, "");
}

async function apiRequest(method, path, body, eventOrigin) {
  const url = getApiBaseUrl() + path;
  const opts = { method: method, headers: buildApiHeaders(eventOrigin) };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  let resp;
  try {
    resp = await fetch(url, opts);
  } catch (err) {
    apiOnline = false;
    apiLastError = "sem conexao com API";
    applyAccessProfile();
    throw err;
  }

  if (!resp.ok) {
    const t = await resp.text();
    apiOnline = false;
    apiLastError = "HTTP " + resp.status + " " + t;
    applyAccessProfile();
    if (resp.status === 401 && isApiEnabled()) {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
  closeApiSocket();
      showAuthGate("Sessao expirada. Faca login novamente.");
    }
    throw new Error(apiLastError + "::" + t);
  }

  const ct = (resp.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) return await resp.json();
  return null;
}

async function apiRequestPublic(method, path, body) {
  const url = getApiBaseUrl() + path;
  const opts = { method: method, headers: {} };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  let resp;
  try {
    resp = await fetch(url, opts);
  } catch (err) {
    throw new Error("Sem conexao com API.");
  }

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error("HTTP " + resp.status + "::" + t);
  }

  const ct = (resp.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) return await resp.json();
  return null;
}

function buildApiHeaders(eventOrigin) {
  const headers = {
    "X-User-Name": CURRENT_USER,
    "X-User-Role": CURRENT_ROLE
  };

  const origin = String(eventOrigin || API_DEFAULT_EVENT_ORIGIN).trim().toUpperCase();
  if (origin) headers["X-Event-Origin"] = origin;

  const token = String(sessionStorage.getItem(SESSION_TOKEN_KEY) || "").trim();
  if (token) {
    headers["Authorization"] = "Bearer " + token;
    // Compatibilidade com backend antigo.
    headers["X-Session-Token"] = token;
  }

  const key = String(sessionStorage.getItem(API_SHARED_KEY_SESSION_KEY) || "").trim();
  if (key) headers["X-API-Key"] = key;

  return headers;
}

function getStorageMode() {
  const configured = String(localStorage.getItem(STORAGE_MODE_KEY) || "").trim().toLowerCase();
  if (configured === STORAGE_MODE_LOCAL) return STORAGE_MODE_LOCAL;
  return STORAGE_MODE_SESSION;
}

function getPrimaryStorage() {
  return getStorageMode() === STORAGE_MODE_LOCAL ? localStorage : sessionStorage;
}

function getSecondaryStorage() {
  return getStorageMode() === STORAGE_MODE_LOCAL ? sessionStorage : localStorage;
}
function handleApiSyncError(err, actionName) {
  const msg = err && err.message ? String(err.message) : "falha desconhecida";
  apiOnline = false;
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
    field: p.field || null,
    from: p.from || null,
    to: p.to || null,
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
    municipio: asText(data.municipio) || "-",
    valor_inicial: toNumber(data.valor_inicial != null ? data.valor_inicial : 0),
    valor_atual: toNumber(data.valor_atual != null ? data.valor_atual : (data.valor_inicial != null ? data.valor_inicial : 0)),
    processo_sei: asText(data.processo_sei),
    status_oficial: normalizeStatus(data.status_oficial || "Recebido"),
    backend_id: data.backend_id != null ? Number(data.backend_id) : null,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    eventos: Array.isArray(data.eventos) && data.eventos.length ? data.eventos : [mkEvent("IMPORT", { note: "Registro criado." })],
    ref_key: "",
    source_sheet: asText(data.source_sheet || "Controle de EPI"),
    source_row: data.source_row != null ? Number(data.source_row) : null,
    all_fields: data.all_fields && typeof data.all_fields === "object" ? shallowCloneObj(data.all_fields) : {}
  };
  syncCanonicalToAllFields(rec);
  rec.ref_key = buildReferenceKey(rec);
  return rec;
}

function normalizeRecordShape(raw) {
  const rec = mkRecord(raw || {});
  rec.id = asText(raw && raw.id ? raw.id : rec.id);
  rec.backend_id = raw && raw.backend_id != null ? Number(raw.backend_id) : rec.backend_id;
  rec.created_at = (raw && raw.created_at) || rec.created_at;
  rec.updated_at = (raw && raw.updated_at) || rec.updated_at;
  rec.eventos = Array.isArray(raw && raw.eventos) && raw.eventos.length ? raw.eventos : rec.eventos;
  if (!rec.valor_inicial && rec.valor_atual) rec.valor_inicial = rec.valor_atual;
  rec.source_sheet = asText((raw && raw.source_sheet) || rec.source_sheet || "Controle de EPI");
  rec.source_row = raw && raw.source_row != null ? Number(raw.source_row) : rec.source_row;
  rec.all_fields = rec.all_fields && typeof rec.all_fields === "object" ? rec.all_fields : {};
  syncCanonicalToAllFields(rec);
  rec.ref_key = buildReferenceKey(rec);
  return rec;
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

function notifyStateUpdated() {
  if (stateChannel) {
    stateChannel.postMessage({ type: "state_updated", at: Date.now(), tabId: LOCAL_TAB_ID });
  }
  localStorage.setItem(CROSS_TAB_PING_KEY, String(Date.now()));
}

function refreshStateFromStorage() {
  const loaded = loadState();
  state = { records: (loaded.records || []).map(normalizeRecordShape) };
  migrateLegacyStatusRecords(state.records);
  syncReferenceKeys(state.records);
  syncYearFilter();
  render();
}
function loadState() {
  try {
    const primary = getPrimaryStorage();
    const secondary = getSecondaryStorage();
    const raw = primary.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.records)) return parsed;
    }

    const rawSecondary = secondary.getItem(STORAGE_KEY);
    if (rawSecondary) {
      const parsedSecondary = JSON.parse(rawSecondary);
      if (parsedSecondary && Array.isArray(parsedSecondary.records)) return parsedSecondary;
    }

    for (let i = 0; i < LEGACY_STORAGE_KEYS.length; i += 1) {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEYS[i]);
      if (!legacyRaw) continue;
      const parsedLegacy = JSON.parse(legacyRaw);
      if (parsedLegacy && Array.isArray(parsedLegacy.records)) return { records: parsedLegacy.records };
    }

    return { records: deepClone(DEMO) };
  } catch (_err) {
    return { records: deepClone(DEMO) };
  }
}

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
  records.forEach(function (r) {
    if (String(r.id || "").trim()) return;
    r.id = generateInternalId(r.ano, counters);
  });
}

function generateInternalId(ano, counters) {
  const year = String(toInt(ano) || currentYear());
  const next = (counters[year] || 0) + 1;
  counters[year] = next;
  return "EPI-" + year + "-" + String(next).padStart(6, "0");
}

function syncReferenceKeys(records) {
  records.forEach(function (r) {
    r.ref_key = buildReferenceKey(r);
  });
}

function buildReferenceKey(record) {
  const parts = REFERENCE_FIELDS.map(function (field) {
    return normalizeReferencePart(record[field]);
  });
  if (parts.every(function (p) { return p === ""; })) return "";
  return parts.join("|");
}

function normalizeReferencePart(value) {
  return normalizeLooseText(value).replace(/\s+/g, " ").trim();
}

function normalizeLooseText(value) {
  return String(value == null ? "" : value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeRowKeys(row) {
  const out = {};
  Object.keys(row || {}).forEach(function (k) {
    const nk = normalizeHeader(k);
    if (!nk) return;
    if (out[nk] == null || String(out[nk]).trim() === "") out[nk] = row[k];
  });
  return out;
}

function normalizeHeader(key) {
  return normalizeLooseText(key).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function pickValue(normalizedRow, aliases) {
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
  upsertRawField(record.all_fields, "municipio", record.municipio);
  upsertRawField(record.all_fields, "valor_inicial", record.valor_inicial);
  upsertRawField(record.all_fields, "valor_atual", record.valor_atual);
  upsertRawField(record.all_fields, "processo_sei", record.processo_sei);
}

function upsertRawField(rawObj, canonicalKey, value) {
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

function renderImportDashboard() {
  if (!importReport) return;
  importReport.classList.remove("hidden");

  const left = latestImportReport ? buildImportSummaryHtml(latestImportReport) : buildImportSummaryPlaceholderHtml();
  const recent = getRecentChangesForPanel(HOME_CHANGES_LIMIT);

  importReport.innerHTML = ""
    + "<div class=\"import-dashboard-grid\">"
    + "  <section class=\"import-dashboard-left\">" + left + "</section>"
    + "  <section class=\"import-dashboard-right\">" + buildRecentChangesPanelHtml(recent) + "</section>"
    + "</div>";

  if (latestImportReport) {
    wireImportReportTabs("planilha1");
  }
}

function buildImportSummaryPlaceholderHtml() {
  const totalRegistros = (state.records || []).length;
  const totalEventos = (state.records || []).reduce(function (acc, rec) {
    return acc + ((rec && rec.eventos && rec.eventos.length) ? rec.eventos.length : 0);
  }, 0);
  const last = getRecentChangesForPanel(1)[0] || null;
  const lastAt = last ? fmtDateTime(last.at) : "-";
  const lastBy = last ? (escapeHtml(last.actor_user) + " (" + escapeHtml(last.actor_role) + ")") : "-";

  return ""
    + "<h4>Resumo da base atual</h4>"
    + "<p class=\"muted small\">Sem importacao nova nesta sessao. Os dados atuais continuam ativos.</p>"
    + "<div class=\"kv\" style=\"margin-top:8px\">"
    + "  <div class=\"k\">Registros carregados</div><div class=\"v\">" + String(totalRegistros) + "</div>"
    + "  <div class=\"k\">Eventos no historico</div><div class=\"v\">" + String(totalEventos) + "</div>"
    + "  <div class=\"k\">Ultima alteracao</div><div class=\"v\">" + lastAt + "</div>"
    + "  <div class=\"k\">Responsavel da ultima alteracao</div><div class=\"v\">" + lastBy + "</div>"
    + "</div>";
}

function buildImportSummaryHtml(report) {
  const sheets = report && report.sheetNames && report.sheetNames.length ? report.sheetNames.join(", ") : "-";
  const fileName = report && report.fileName ? report.fileName : "-";

  const planilha1Aoa = buildPlanilha1Aoa(state.records || []);
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

function wireImportReportTabs(defaultTab) {
  if (!importReport) return;
  const tabButtons = Array.from(importReport.querySelectorAll("[data-import-tab]"));
  const tabPanels = Array.from(importReport.querySelectorAll("[data-import-panel]"));
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
  let hash = 2166136261;
  const str = String(input || "");
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function getCurrentFilterSnapshot() {
  return {
    status: statusFilter ? statusFilter.value : "",
    ano: yearFilter ? yearFilter.value : "",
    busca: searchInput ? (searchInput.value || "").trim() : ""
  };
}

function countAuditEvents(records) {
  return (records || []).reduce(function (acc, rec) {
    return acc + ((rec && Array.isArray(rec.eventos)) ? rec.eventos.length : 0);
  }, 0);
}

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

async function syncExportLogToApi(meta) {
  if (!isApiEnabled()) return;
  const payload = {
    formato: String(meta && meta.formato ? meta.formato : "XLSX").toUpperCase(),
    arquivo_nome: meta && meta.arquivoNome ? meta.arquivoNome : "exportacao",
    quantidade_registros: meta && Number.isFinite(Number(meta.quantidadeRegistros)) ? Number(meta.quantidadeRegistros) : 0,
    quantidade_eventos: meta && Number.isFinite(Number(meta.quantidadeEventos)) ? Number(meta.quantidadeEventos) : 0,
    filtros_json: JSON.stringify(meta && meta.filtros ? meta.filtros : {}),
    modo_headers: meta && meta.modoHeaders ? meta.modoHeaders : "normalizados",
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
  const summaryAoa = buildSummaryAoa(records, auditTable.rows.length);
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

const TEMPLATE_CANONICAL_KEYS = [
  "identificacao",
  "cod_subfonte",
  "deputado",
  "cod_uo",
  "sigla_uo",
  "cod_orgao",
  "cod_acao",
  "descricao_acao",
  "municipio",
  "valor_inicial",
  "valor_atual",
  "processo_sei",
  "status_oficial"
];

function buildCanonicalColumnMap(headers) {
  const map = {};
  TEMPLATE_CANONICAL_KEYS.forEach(function (key) {
    const idx = findHeaderIndexByAliases(headers, key);
    if (idx >= 0) map[key] = idx;
  });
  return map;
}

function findHeaderIndexByAliases(headers, canonicalKey) {
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
  if (v == null) return "";
  if (typeof v === "number") return Number(v).toString();
  return String(v).trim();
}

function runTemplateRoundTripCheck(workbook, assertions) {
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

function buildExportTableData(records, options) {
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

  const normalizedHeaders = ["id", "ano", "identificacao", "cod_subfonte", "deputado", "cod_uo", "sigla_uo", "cod_orgao", "cod_acao", "descricao_acao", "municipio", "valor_inicial", "valor_atual", "processo_sei"];
  const systemHeaders = ["id_interno_sistema", "backend_id", "usuarios_ativos", "progresso", "global_state", "ref_key", "created_at", "updated_at", "source_sheet", "source_row"];
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

function buildAuditLogTableData(records) {
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

function buildSummaryAoa(records, totalEvents) {
  const now = new Date().toISOString();
  const byGlobal = { done: 0, in_progress: 0, attention: 0, no_marks: 0 };

  records.forEach(function (r) {
    const global = getGlobalProgressState(getActiveUsersWithLastMark(r));
    byGlobal[global.code] = (byGlobal[global.code] || 0) + 1;
  });

  const out = [
    ["Resumo da exportacao"],
    ["Gerado em", now],
    ["Total de emendas", records.length],
    ["Total de eventos (audit log)", totalEvents],
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
  const byDeputado = {};
  records.forEach(function (r) {
    const nome = (r.deputado || "").trim() || "(Sem deputado)";
    byDeputado[nome] = (byDeputado[nome] || 0) + 1;
  });

  const ordered = Object.keys(byDeputado).sort(function (a, b) {
    return a.localeCompare(b, "pt-BR");
  });

  const out = [
    ["Rotulos de Linha", "Contagem de Deputado"],
    ["Indicar escola", records.length]
  ];

  ordered.forEach(function (nome) {
    out.push([nome, byDeputado[nome]]);
  });

  out.push(["Total Geral", records.length]);
  return out;
}

function fmtMoney(n) {
  const x = toNumber(n);
  return x.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR");
  } catch (_err) {
    return String(iso || "");
  }
}

function isoNow() {
  return new Date().toISOString();
}

function dateStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return yyyy + mm + dd + "_" + hh + mi;
}

function currentYear() {
  return new Date().getFullYear();
}

function toInt(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

function toNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v == null ? "" : v).trim().replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(/,/g, ".").replace(/[^\d.-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function toNumberOrNull(v) {
  if (v == null) return null;
  const txt = String(v).trim();
  if (txt === "") return null;
  const n = toNumber(txt);
  if (!Number.isFinite(n)) return null;
  return n;
}

function asText(v) {
  if (v == null) return "";
  return String(v).trim();
}

function text(v) {
  return asText(v);
}

function escapeHtml(str) {
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&#039;");
}

function debounce(fn, ms) {
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
  return JSON.parse(JSON.stringify(obj));
}
