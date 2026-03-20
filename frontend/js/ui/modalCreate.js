// =============================================================
// modalCreate.js — FORMULARIO DE CRIACAO MANUAL DE EMENDA
// Dono: Antigravity (frontend/js/ui/)
// Responsabilidade: Gerenciar o modal de criacao manual de emendas:
//   construcao do DOM, validacao de campos obrigatorios,
//   integracao com API (POST /emendas) e audit log inicial.
// Regras: Identificacao, Deputado, Municipio e Ano sao obrigatorios (U03).
//   Status inicial: "Sem marcacoes". Evento audit: "CRIACAO_MANUAL".
// Exports: SECFrontend.modalCreateUtils
//   openCreateModal, closeCreateModal
// Integra com o modal shell existente e com as classes visuais do app.
// =============================================================
(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  let modalCreateEl = null;
  let formCreateEl = null;

  function buildCreateModal(ctx) {
    if (modalCreateEl) return;

    modalCreateEl = document.createElement("div");
    modalCreateEl.className = "modal create-modal hidden";
    modalCreateEl.id = "createEmendaModal";

    modalCreateEl.innerHTML = `
      <div class="modal-card create-modal-card" role="dialog" aria-modal="true" aria-labelledby="createEmendaTitle">
        <div class="modal-head create-modal-head">
          <div>
            <span class="create-modal-kicker">U03 | criacao manual governada</span>
            <h3 id="createEmendaTitle">Nova Emenda</h3>
            <p class="muted">Crie a emenda com rastreio imediato, sem quebrar o fluxo oficial da base principal.</p>
          </div>
          <button type="button" class="icon-btn" id="btnCreateEmendaCloseX" aria-label="Fechar modal">x</button>
        </div>
        <div class="modal-body create-modal-body">
          <div class="create-modal-layout">
            <form id="createEmendaForm" class="create-modal-form">
              <div class="grid create-modal-grid">
                <div class="field">
                  <label for="createIdentificacao">Identificacao <span class="required">*</span></label>
                  <input type="text" id="createIdentificacao" name="identificacao" required placeholder="Ex: EPI 2026 / Fanfarra">
                </div>
                <div class="field">
                  <label for="createAno">Ano <span class="required">*</span></label>
                  <input type="number" id="createAno" name="ano" required min="2000" max="2099" value="2026">
                </div>
                <div class="field">
                  <label for="createMunicipio">Municipio <span class="required">*</span></label>
                  <input type="text" id="createMunicipio" name="municipio" required placeholder="Ex: Salvador">
                </div>
                <div class="field">
                  <label for="createDeputado">Deputado <span class="required">*</span></label>
                  <input type="text" id="createDeputado" name="deputado" required placeholder="Ex: DEP-ALFA">
                </div>
                <div class="field">
                  <label for="createValor">Valor Atual Inicial (R$)</label>
                  <input type="number" id="createValor" name="valor_atual" min="0" step="0.01" value="0">
                </div>
                <div class="field">
                  <label for="createProcesso">Processo SEI</label>
                  <input type="text" id="createProcesso" name="processo_sei" placeholder="Ex: 001.0001.2026.0001">
                </div>
              </div>

              <div class="create-modal-hint">
                <strong>Fluxo esperado:</strong>
                <span>preencher campos obrigatorios, criar a emenda e deixar o registro auditavel para a base oficial.</span>
              </div>

              <p id="createEmendaMessage" class="auth-msg"></p>

              <div class="modal-foot create-modal-foot compact-actions">
                <button type="button" class="btn" id="btnCreateEmendaCancel">Cancelar</button>
                <button type="submit" class="btn primary" id="btnCreateEmendaSubmit">Criar Emenda</button>
              </div>
            </form>

            <aside class="create-modal-side">
              <article class="create-modal-side-card">
                <h4>Checklist visual</h4>
                <ul>
                  <li>Identificacao, Ano, Municipio e Deputado sao obrigatorios.</li>
                  <li>O valor inicial entra zerado se nao houver informacao.</li>
                  <li>O status nasce como <strong>Sem marcacoes</strong>.</li>
                </ul>
              </article>
              <article class="create-modal-side-card">
                <h4>Auditoria imediata</h4>
                <p class="muted small">A emenda criada manualmente recebe evento <strong>CRIACAO_MANUAL</strong> para manter a trilha de governanca clara no historico.</p>
              </article>
            </aside>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalCreateEl);
    formCreateEl = document.getElementById("createEmendaForm");

    document.getElementById("btnCreateEmendaCloseX").addEventListener("click", closeCreateModal);
    document.getElementById("btnCreateEmendaCancel").addEventListener("click", closeCreateModal);

    formCreateEl.addEventListener("submit", function (e) {
      e.preventDefault();
      submitCreateModal(ctx);
    });
  }

  function openCreateModal(ctx) {
    if (!ctx || !ctx.canMutateRecords || !ctx.canMutateRecords()) {
      alert("Seu perfil (" + (ctx && ctx.currentRole ? ctx.currentRole : "Leitura") + ") nao tem permissao para criar emendas.");
      return;
    }
    
    if (!modalCreateEl) {
      buildCreateModal(ctx);
    }
    
    // Reset form
    if (formCreateEl) formCreateEl.reset();
    document.getElementById("createAno").value = new Date().getFullYear();
    document.getElementById("createEmendaMessage").textContent = "";
    document.getElementById("createEmendaMessage").className = "auth-msg";

    if (ctx && typeof ctx.setAuxModalVisibility === "function") {
      ctx.setAuxModalVisibility(modalCreateEl, true);
    } else {
      modalCreateEl.classList.remove("hidden");
    }
    document.getElementById("createIdentificacao").focus();
  }

  function closeCreateModal(ctx) {
    if (modalCreateEl) {
      if (ctx && typeof ctx.setAuxModalVisibility === "function") {
        ctx.setAuxModalVisibility(modalCreateEl, false);
      } else {
        modalCreateEl.classList.add("hidden");
      }
    }
  }

  async function submitCreateModal(ctx) {
    const msgEl = document.getElementById("createEmendaMessage");
    const btnSubmit = document.getElementById("btnCreateEmendaSubmit");
    
    try {
      btnSubmit.disabled = true;
      msgEl.textContent = "Criando...";
      msgEl.className = "auth-msg info";

      const ano = parseInt(document.getElementById("createAno").value, 10);
      const identificacao = document.getElementById("createIdentificacao").value.trim();
      const municipio = document.getElementById("createMunicipio").value.trim();
      const deputado = document.getElementById("createDeputado").value.trim();
      const valor = parseFloat(document.getElementById("createValor").value) || 0;
      const processo = document.getElementById("createProcesso").value.trim();

      if (!identificacao || !deputado || !municipio || isNaN(ano)) {
        throw new Error("Preencha os campos obrigatorios (Identificacao, Ano, Municipio, Deputado).");
      }

      const isRemote = ctx.isApiEnabled && ctx.isApiEnabled();

      const newRecord = {
        ano: ano,
        identificacao: identificacao,
        municipio: municipio,
        deputado: deputado,
        valor_atual: valor,
        valor_inicial: valor,
        processo_sei: processo,
        status_oficial: "Sem marcacoes",
        eventos: [{
          data_hora: new Date().toISOString(),
          tipo: "CRIACAO_MANUAL",
          de: null,
          para: "Sem marcacoes",
          nota: "Emenda criada manualmente via interface.",
          ator_papel: ctx.currentRole || "SISTEMA",
          ator_nome: ctx.currentUser || "Admin"
        }]
      };

      if (isRemote) {
        // Enviar pra API
        if (!ctx.apiClient || typeof ctx.apiClient.createEmenda !== "function") {
           // Se o endpoint não existir no client, usar o call genérico JSON
           const res = await fetch((ctx.apiBaseUrl || "http://localhost:8000") + "/emendas", {
             method: "POST",
             headers: {
               "Content-Type": "application/json",
               "Authorization": "Bearer " + (ctx.authStore && ctx.authStore.readStoredSessionToken ? ctx.authStore.readStoredSessionToken().token : "")
             },
             body: JSON.stringify(newRecord)
           });
           
           if (!res.ok) {
              const errTxt = await res.text();
              throw new Error("Falha na API: " + res.status + " - " + errTxt);
           }
           
           // A API normalmente avisa via WebSocket e atualiza o state
        } else {
           await ctx.apiClient.createEmenda(newRecord);
        }
      } else {
        // MODO LOCAL
        const state = ctx.getState();
        // Generates temp ID
        const tempId = "EPI-" + ano + "-M" + Math.floor(Math.random() * 100000);
        newRecord.id = tempId;
        newRecord.interno_id = Date.now();
        const normalized = typeof ctx.normalizeRecordShape === "function" ? ctx.normalizeRecordShape(newRecord) : newRecord;
        
        state.records.unshift(normalized);
        ctx.setState(state);
        
        // Atualizar ids globais
        if (ctx.buildIdCounters && ctx.setIdCountersByYear) {
          ctx.setIdCountersByYear(ctx.buildIdCounters(state.records));
          ctx.assignMissingIds(state.records, ctx.getIdCountersByYear());
        }
        
        ctx.saveState();
      }

      msgEl.textContent = "Emenda inserida com sucesso!";
      msgEl.className = "auth-msg success";
      
      setTimeout(() => {
        closeCreateModal(ctx);
        if (ctx.syncYearFilter) ctx.syncYearFilter();
        if (ctx.render) ctx.render();
      }, 800);

    } catch (e) {
      msgEl.textContent = e.message;
      msgEl.className = "auth-msg error";
    } finally {
      btnSubmit.disabled = false;
    }
  }

  root.modalCreateUtils = {
    openCreateModal: openCreateModal,
    closeCreateModal: closeCreateModal
  };
})(typeof window !== "undefined" ? window : globalThis);
