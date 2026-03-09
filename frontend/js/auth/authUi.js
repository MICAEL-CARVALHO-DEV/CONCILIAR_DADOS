(function (globalScope) {
  "use strict";

  var root = globalScope.SEC_FRONTEND = globalScope.SEC_FRONTEND || {};

  function syncRegisterRoles(ctx) {
    if (!ctx.authRegisterRole) return;
    ctx.clearNodeChildren(ctx.authRegisterRole);
    ctx.PUBLIC_SELF_REGISTER_ROLE_OPTIONS.forEach(function (role) {
      var opt = globalScope.document.createElement("option");
      opt.value = role;
      opt.textContent = role;
      ctx.authRegisterRole.appendChild(opt);
    });
  }

  function switchAuthMode(mode, ctx) {
    if (!ctx.authLoginForm || !ctx.authRegisterForm || !ctx.authTabLogin || !ctx.authTabRegister) return;
    var register = mode === "register";
    ctx.authLoginForm.classList.toggle("hidden", register);
    ctx.authRegisterForm.classList.toggle("hidden", !register);
    ctx.authTabLogin.classList.toggle("active", !register);
    ctx.authTabRegister.classList.toggle("active", register);
    ctx.setAuthMessage("");
  }

  function setupAuthUi(ctx) {
    if (!ctx.authGate) return;

    syncRegisterRoles(ctx);
    switchAuthMode("login", ctx);

    if (ctx.authTabLogin) {
      ctx.authTabLogin.addEventListener("click", function () {
        switchAuthMode("login", ctx);
      });
    }

    if (ctx.authTabRegister) {
      ctx.authTabRegister.addEventListener("click", function () {
        switchAuthMode("register", ctx);
      });
    }

    if (ctx.authLoginForm) {
      ctx.authLoginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        var nome = String(ctx.authLoginName && ctx.authLoginName.value || "").trim();
        var senha = String(ctx.authLoginPassword && ctx.authLoginPassword.value || "").trim();
        if (!nome || !senha) {
          ctx.setAuthMessage("Informe nome e senha.", true);
          return;
        }

        ctx.setAuthMessage("Autenticando...");
        try {
          var resp = await ctx.apiRequestPublic("POST", "/auth/login", { nome: nome, senha: senha });
          ctx.onAuthSuccess(resp);
        } catch (err) {
          ctx.setAuthMessage(ctx.extractApiError(err, "Falha no login."), true);
        }
      });
    }

    if (ctx.authRegisterForm) {
      ctx.authRegisterForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        var nome = String(ctx.authRegisterName && ctx.authRegisterName.value || "").trim();
        var perfil = ctx.normalizeUserRole(ctx.authRegisterRole && ctx.authRegisterRole.value || "");
        var senha1 = String(ctx.authRegisterPassword && ctx.authRegisterPassword.value || "").trim();
        var senha2 = String(ctx.authRegisterPassword2 && ctx.authRegisterPassword2.value || "").trim();

        if (!nome || !senha1 || !senha2) {
          ctx.setAuthMessage("Preencha todos os campos do cadastro.", true);
          return;
        }
        if (senha1 !== senha2) {
          ctx.setAuthMessage("As senhas nao conferem.", true);
          return;
        }

        ctx.setAuthMessage("Cadastrando...");
        try {
          var resp = await ctx.apiRequestPublic("POST", "/auth/register", {
            nome: nome,
            perfil: perfil,
            senha: senha1
          });
          if (resp && resp.pending_approval) {
            ctx.setAuthMessage("Cadastro enviado. Aguarde aprovacao do PROGRAMADOR.");
            switchAuthMode("login", ctx);
            return;
          }
          ctx.onAuthSuccess(resp);
        } catch (err) {
          ctx.setAuthMessage(ctx.extractApiError(err, "Falha no cadastro."), true);
        }
      });
    }
  }

  root.authUiUtils = {
    setupAuthUi: setupAuthUi,
    syncRegisterRoles: syncRegisterRoles,
    switchAuthMode: switchAuthMode
  };
})(typeof window !== "undefined" ? window : globalThis);
