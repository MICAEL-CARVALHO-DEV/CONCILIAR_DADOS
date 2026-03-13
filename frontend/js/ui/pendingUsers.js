(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function noop() {}

  function safeText(value) {
    return value == null ? "" : String(value).trim();
  }

  function isPendingRegistration(user) {
    var registrationStatus = String(user && user.status_cadastro ? user.status_cadastro : "").trim().toUpperCase();
    if (registrationStatus) return registrationStatus === "EM_ANALISE";
    if (user && user.ativo) return false;
    var lastLogin = user && user.ultimo_login ? String(user.ultimo_login).trim() : "";
    return lastLogin === "";
  }

  async function refreshPendingUsersModal(options) {
    var opts = options || {};
    var isApiEnabled = typeof opts.isApiEnabled === "function" ? opts.isApiEnabled : function () { return false; };
    var isOwnerUser = typeof opts.isOwnerUser === "function" ? opts.isOwnerUser : function () { return false; };
    var setFeedback = typeof opts.setFeedback === "function" ? opts.setFeedback : noop;
    var renderTable = typeof opts.renderTable === "function" ? opts.renderTable : noop;
    var apiRequest = typeof opts.apiRequest === "function" ? opts.apiRequest : function () { return Promise.reject(new Error("apiRequest indisponivel")); };
    var extractApiError = typeof opts.extractApiError === "function" ? opts.extractApiError : function (_err, fallback) { return String(fallback || "Falha ao carregar cadastros pendentes."); };

    if (!isApiEnabled()) {
      setFeedback("Aprovacao de cadastro exige API ativa.", true);
      renderTable([]);
      return;
    }
    if (!isOwnerUser()) {
      setFeedback("Apenas PROGRAMADOR pode aprovar cadastros.", true);
      renderTable([]);
      return;
    }

    setFeedback("Carregando cadastros em analise...");
    try {
      var users = await apiRequest("GET", "/users?include_inactive=true", undefined, "UI");
      var pending = (Array.isArray(users) ? users : []).filter(isPendingRegistration);
      renderTable(pending);
      setFeedback("Pendentes: " + String(pending.length));
    } catch (err) {
      renderTable([]);
      setFeedback(extractApiError(err, "Falha ao carregar cadastros pendentes."), true);
    }
  }

  async function approvePendingUser(userId, options) {
    var opts = options || {};
    if (!userId) return;
    var isOwnerUser = typeof opts.isOwnerUser === "function" ? opts.isOwnerUser : function () { return false; };
    var setFeedback = typeof opts.setFeedback === "function" ? opts.setFeedback : noop;
    var getSelectedRole = typeof opts.getSelectedRole === "function" ? opts.getSelectedRole : function () { return "APG"; };
    var apiRequest = typeof opts.apiRequest === "function" ? opts.apiRequest : function () { return Promise.reject(new Error("apiRequest indisponivel")); };
    var refresh = typeof opts.refresh === "function" ? opts.refresh : function () { return Promise.resolve(); };

    if (!isOwnerUser()) {
      setFeedback("Apenas PROGRAMADOR pode aprovar cadastros.", true);
      return;
    }

    var selectedRole = getSelectedRole(userId);
    setFeedback("Aprovando usuario #" + String(userId) + "...");
    await apiRequest("PATCH", "/users/" + String(userId) + "/status", {
      ativo: true,
      perfil: selectedRole,
      status_cadastro: "APROVADO"
    }, "UI");
    setFeedback("Usuario aprovado com sucesso.");
    await refresh();
  }

  async function rejectPendingUser(userId, options) {
    var opts = options || {};
    if (!userId) return;
    var isOwnerUser = typeof opts.isOwnerUser === "function" ? opts.isOwnerUser : function () { return false; };
    var setFeedback = typeof opts.setFeedback === "function" ? opts.setFeedback : noop;
    var getSelectedRole = typeof opts.getSelectedRole === "function" ? opts.getSelectedRole : function () { return "APG"; };
    var confirmAction = typeof opts.confirmAction === "function" ? opts.confirmAction : function () { return true; };
    var apiRequest = typeof opts.apiRequest === "function" ? opts.apiRequest : function () { return Promise.reject(new Error("apiRequest indisponivel")); };
    var refresh = typeof opts.refresh === "function" ? opts.refresh : function () { return Promise.resolve(); };

    if (!isOwnerUser()) {
      setFeedback("Apenas PROGRAMADOR pode recusar cadastros.", true);
      return;
    }
    if (!confirmAction("Deseja realmente recusar o cadastro #" + String(userId) + "?")) return;

    var selectedRole = getSelectedRole(userId);
    setFeedback("Recusando usuario #" + String(userId) + "...");
    await apiRequest("PATCH", "/users/" + String(userId) + "/status", {
      ativo: false,
      perfil: selectedRole,
      status_cadastro: "RECUSADO"
    }, "UI");
    setFeedback("Usuario recusado com sucesso.");
    await refresh();
  }

  function closePendingUsersModal(options) {
    var opts = options || {};
    var setModalVisibility = typeof opts.setModalVisibility === "function" ? opts.setModalVisibility : noop;
    setModalVisibility(opts.modal, false);
  }

  function openPendingUsersModal(options) {
    var opts = options || {};
    var setModalVisibility = typeof opts.setModalVisibility === "function" ? opts.setModalVisibility : noop;
    var refresh = typeof opts.refresh === "function" ? opts.refresh : function () { return Promise.resolve(); };
    var setFeedback = typeof opts.setFeedback === "function" ? opts.setFeedback : noop;
    var extractApiError = typeof opts.extractApiError === "function" ? opts.extractApiError : function (_err, fallback) { return String(fallback || "Falha ao abrir cadastros pendentes."); };

    setModalVisibility(opts.modal, true);
    refresh().catch(function (err) {
      setFeedback(extractApiError(err, "Falha ao abrir cadastros pendentes."), true);
    });
  }

  root.pendingUsersUtils = {
    refreshPendingUsersModal: refreshPendingUsersModal,
    approvePendingUser: approvePendingUser,
    rejectPendingUser: rejectPendingUser,
    openPendingUsersModal: openPendingUsersModal,
    closePendingUsersModal: closePendingUsersModal,
    isPendingRegistration: isPendingRegistration
  };
})(window);
