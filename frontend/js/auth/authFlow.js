(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function isLocalFrontendContext(ctx) {
    if (ctx.detectLocalFrontendContext) {
      return !!ctx.detectLocalFrontendContext();
    }
    var host = (typeof globalScope !== "undefined" && globalScope.location && globalScope.location.hostname)
      ? String(globalScope.location.hostname)
      : "";
    return !host || host === "localhost" || host === "127.0.0.1";
  }

  function loadUserConfig(forcePrompt, ctx) {
    var savedAuthUser = ctx.readAuthenticatedProfile ? ctx.readAuthenticatedProfile() : null;
    var legacyAuthUser = ctx.readLegacyAuthenticatedProfile ? ctx.readLegacyAuthenticatedProfile() : null;
    var savedUser = (savedAuthUser && savedAuthUser.name) || (legacyAuthUser && legacyAuthUser.name);
    var savedRole = savedAuthUser && savedAuthUser.role;

    if (savedUser) ctx.setCurrentUser(savedUser);
    if (savedRole) {
      ctx.setCurrentRole(ctx.normalizeUserRole(savedRole));
      ctx.resetBetaWorkspaceTabs();
    }

    if (ctx.isApiEnabled()) return;

    if (forcePrompt || !savedUser || !savedRole) {
      var currentUser = ctx.getCurrentUser();
      var currentRole = ctx.getCurrentRole();
      var nameInput = globalScope.prompt("Informe seu nome (ex.: Miguel):", savedUser || currentUser) || currentUser;
      var roleInput = globalScope.prompt("Informe seu setor (APG | SUPERVISAO | POWERBI | PROGRAMADOR):", savedRole || currentRole) || currentRole;

      ctx.setCurrentUser(String(nameInput).trim() || currentUser);
      ctx.setCurrentRole(ctx.normalizeUserRole(roleInput));
      ctx.resetBetaWorkspaceTabs();
      ctx.writeAuthenticatedProfile({
        name: ctx.getCurrentUser(),
        role: ctx.getCurrentRole()
      });
    }
  }

  function onAuthSuccess(resp, ctx) {
    var token = resp && resp.token ? String(resp.token) : "";
    var usuario = resp && resp.usuario ? resp.usuario : null;
    if (!token || !usuario) {
      ctx.setAuthMessage("Resposta de autenticacao invalida.", true);
      return;
    }

    ctx.writeStoredSessionToken(token);
    ctx.setAuthenticatedUser(usuario);
    ctx.hideAuthGate();
    ctx.applyAccessProfile();
    ctx.bootstrapApiIntegration().finally(function () {
      ctx.connectApiSocket();
    });
    ctx.render();
  }

  async function logoutCurrentUser(ctx) {
    var token = ctx.readStoredSessionToken();
    if (token && ctx.isApiEnabled()) {
      try {
        await ctx.apiRequest("POST", "/auth/logout", {});
      } catch (_err) {
        // ignora erro de logout remoto
      }
    }

    if (ctx.clearSessionAndProfile) {
      ctx.clearSessionAndProfile();
    } else {
      ctx.clearStoredSessionToken();
    }

    ctx.closeApiSocket();
    ctx.clearBetaAuditPolling();
    ctx.clearBetaSupportPolling();
    ctx.resetBetaAuditState();
    ctx.resetBetaSupportState();
  }

  async function initializeAuthFlow(ctx) {
    if (!ctx.isApiEnabled()) {
      ctx.closeApiSocket();
      loadUserConfig(false, ctx);
      ctx.applyAccessProfile();
      ctx.bootstrapApiIntegration();
      return;
    }

    var token = ctx.readStoredSessionToken();
    if (!token) {
      ctx.closeApiSocket();
      ctx.redirectToAuth(ctx.authLoginPage, "msg=" + encodeURIComponent("Entre para continuar."));
      return;
    }

    var me = null;
    try {
      me = await ctx.apiRequest("GET", "/auth/me");
    } catch (authErr) {
      if (authErr && (authErr.status === 403 || authErr.message.indexOf("403") >= 0)) {
        ctx.clearStoredSessionToken();
        ctx.closeApiSocket();
        ctx.redirectToAuth(ctx.authLoginPage, "msg=" + encodeURIComponent("Acesso restrito (403). Seu perfil nao tem permissao para acessar."));
        return;
      }

      if (isLocalFrontendContext(ctx)) {
        try {
          ctx.writeApiBaseUrl("http://127.0.0.1:8000");
          ctx.writeStoredSessionToken(token);
          me = await ctx.apiRequest("GET", "/auth/me", undefined, "INIT", { handleAuthFailure: false });
        } catch (_fallbackErr) {
          // segue fluxo padrao
        }
      }

      if (!me) {
        ctx.clearStoredSessionToken();
        ctx.closeApiSocket();
        ctx.redirectToAuth(ctx.authLoginPage, "msg=" + encodeURIComponent("Sessao expirada. Faca login novamente."));
        return;
      }

      globalScope.console.warn("auth/me falhou na API principal, seguindo com fallback local.", authErr);
    }

    try {
      ctx.setAuthenticatedUser(me);
      ctx.hideAuthGate();
      ctx.applyAccessProfile();
      await ctx.bootstrapApiIntegration();
      ctx.connectApiSocket();
    } catch (uiErr) {
      globalScope.console.error("Falha ao inicializar UI apos autenticacao:", uiErr);
    }
  }

  root.authFlowUtils = {
    isLocalFrontendContext: isLocalFrontendContext,
    loadUserConfig: loadUserConfig,
    onAuthSuccess: onAuthSuccess,
    logoutCurrentUser: logoutCurrentUser,
    initializeAuthFlow: initializeAuthFlow
  };
})(typeof window !== "undefined" ? window : globalThis);

