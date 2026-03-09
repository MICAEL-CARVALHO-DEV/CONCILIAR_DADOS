(function (win) {
  var SECFrontend = (win && win.SECFrontend && typeof win.SECFrontend === "object") ? win.SECFrontend : (win.SECFrontend = {});
  var domUtils = SECFrontend.domUtils || null;

  function fallbackDateTime(value) {
    return String(value || "");
  }

  function fallbackStatusColor(status) {
    var normalized = String(status == null ? "" : status);
    if (normalized === "Concluido") return "#2ecc71";
    if (normalized === "Cancelado") return "#ff4f6d";
    if (normalized === "Pendente") return "#f1c40f";
    if (normalized === "Aguardando execucao") return "#f39c12";
    if (normalized === "Em execucao") return "#3498db";
    if (normalized === "Em analise") return "#4f8cff";
    if (normalized === "Aprovado") return "#9b59b6";
    return "#95a5a6";
  }

  function renderStatusBadge(status, statusColorFn) {
    var safeStatus = String(status == null ? "" : status);
    var color = typeof statusColorFn === "function" ? statusColorFn(status) : fallbackStatusColor(status);

    var badge = document.createElement("span");
    badge.className = "badge";

    var dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = color;
    badge.appendChild(dot);

    badge.appendChild(document.createTextNode(safeStatus));
    return badge;
  }

  var appendRenderedMarkup = (domUtils && typeof domUtils.appendRenderedMarkup === "function")
    ? domUtils.appendRenderedMarkup
    : function (container, rendered) {
        if (!container || rendered == null) return;

        if (typeof Node !== "undefined" && rendered instanceof Node || typeof DocumentFragment !== "undefined" && rendered instanceof DocumentFragment) {
          container.appendChild(rendered);
          return;
        }

        var html = String(rendered);
        if (!html) return;
        var fragment = null;
        if (typeof document.createRange === "function") {
          fragment = document.createRange().createContextualFragment(html);
        } else {
          if (typeof DOMParser === "function") {
            try {
              var parser = new DOMParser();
              var doc = parser.parseFromString("<body>" + html + "</body>", "text/html");
              var body = doc && doc.body;
              if (body && body.childNodes) {
                fragment = document.createDocumentFragment();
                while (body.firstChild) {
                  fragment.appendChild(body.firstChild);
                }
              } else {
                fragment = null;
              }
            } catch (_err) {
              fragment = null;
            }
          }
          if (!fragment) {
            fragment = document.createDocumentFragment();
            fragment.appendChild(document.createTextNode(html));
          }
        }
        container.appendChild(fragment);
      };

  function renderHistoryToContainer(container, events, options) {
    if (!container) return;
    var opts = options || {};
    var fmtDateTime = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : fallbackDateTime;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    (Array.isArray(events) ? events : []).forEach(function (ev) {
      var div = document.createElement("div");
      div.className = "event";

      var who = (ev.actor_role || "-") + " | " + (ev.actor_user || "-");
      var rightParts = [];

      if (ev.type === "OFFICIAL_STATUS") {
        rightParts = [
          { type: "bold", value: "LEGADO" },
          { type: "text", value: " " },
          { type: "bold", value: String(ev.from || "") },
          { type: "text", value: " -> " },
          { type: "bold", value: String(ev.to || "") }
        ];
      } else if (ev.type === "MARK_STATUS") {
        rightParts = [{ type: "bold", value: String(ev.to || "") }];
      } else if (ev.type === "EDIT_FIELD") {
        rightParts = [
          { type: "bold", value: String(ev.field || "") },
          { type: "text", value: ": " + String(ev.from == null ? "" : ev.from) + " -> " + String(ev.to == null ? "" : ev.to) }
        ];
      }

      var topRow = document.createElement("div");
      topRow.className = "top";

      var meta1 = document.createElement("div");
      meta1.className = "meta";

      var whoEl = document.createElement("b");
      whoEl.textContent = who;
      meta1.appendChild(whoEl);

      var separator = document.createTextNode(" | " + fmtDateTime(ev.at) + " | ");
      meta1.appendChild(separator);

      var typeSpan = document.createElement("span");
      typeSpan.className = "muted";
      typeSpan.textContent = String(ev.type || "");
      meta1.appendChild(typeSpan);

      var meta2 = document.createElement("div");
      meta2.className = "meta";
      rightParts.forEach(function (part) {
        if (part.type === "bold") {
          var b = document.createElement("b");
          b.textContent = part.value;
          meta2.appendChild(b);
          return;
        }
        meta2.appendChild(document.createTextNode(String(part.value || "")));
      });

      topRow.appendChild(meta1);
      topRow.appendChild(meta2);
      div.appendChild(topRow);

      var desc = document.createElement("div");
      desc.className = "desc";
      desc.textContent = String(ev.note || "");
      div.appendChild(desc);

      container.appendChild(div);
    });
  }

  function renderMainRow(container, rec, options) {
    if (!container) return;
    var opts = options || {};
    var fmtMoney = typeof opts.fmtMoney === "function" ? opts.fmtMoney : function (value) { return String(value == null ? "" : value); };
    var fmtDateTime = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : function (value) { return String(value || ""); };
    var getActiveUsersWithLastMark = typeof opts.getActiveUsersWithLastMark === "function" ? opts.getActiveUsersWithLastMark : null;
    var calcProgress = typeof opts.calcProgress === "function" ? opts.calcProgress : null;
    var renderProgressBar = typeof opts.renderProgressBar === "function" ? opts.renderProgressBar : null;
    var renderMemberChips = typeof opts.renderMemberChips === "function" ? opts.renderMemberChips : null;
    var onView = typeof opts.onView === "function" ? opts.onView : null;
    var getLastEventDays = typeof opts.getLastEventDays === "function" ? opts.getLastEventDays : function () { return Number.POSITIVE_INFINITY; };

    var record = rec || {};
    var users = [];
    if (getActiveUsersWithLastMark) {
      users = getActiveUsersWithLastMark(record) || [];
    }
    var progress = calcProgress ? calcProgress(users) : null;
    var staleDays = getLastEventDays(record);
    var staleDaysText = staleDays === Number.POSITIVE_INFINITY ? "-" : String(staleDays) + " dias";

    var tr = document.createElement("tr");

    var tdId = document.createElement("td");
    var code = document.createElement("code");
    code.textContent = String(record.id || "");
    tdId.appendChild(code);
    tr.appendChild(tdId);

    var tdIdent = document.createElement("td");
    tdIdent.textContent = String(record.identificacao || "");
    tr.appendChild(tdIdent);

    var tdMunicipio = document.createElement("td");
    tdMunicipio.textContent = String(record.municipio || "");
    tr.appendChild(tdMunicipio);

    var tdDeputado = document.createElement("td");
    tdDeputado.textContent = String(record.deputado || "");
    tr.appendChild(tdDeputado);

    var tdProgress = document.createElement("td");
    if (renderProgressBar) {
      appendRenderedMarkup(tdProgress, renderProgressBar(progress));
    } else {
      tdProgress.textContent = "";
    }
    tr.appendChild(tdProgress);

    var tdChips = document.createElement("td");
    if (renderMemberChips) {
      appendRenderedMarkup(tdChips, renderMemberChips(users));
    } else {
      tdChips.textContent = "";
    }
    tr.appendChild(tdChips);

    var tdStale = document.createElement("td");
    tdStale.className = "muted small";
    tdStale.textContent = staleDaysText;
    tr.appendChild(tdStale);

    var tdValor = document.createElement("td");
    tdValor.textContent = "R$ " + fmtMoney(record.valor_atual);
    tr.appendChild(tdValor);

    var tdDate = document.createElement("td");
    tdDate.className = "muted";
    tdDate.textContent = fmtDateTime(record.updated_at);
    tr.appendChild(tdDate);

    var tdAction = document.createElement("td");
    var btn = document.createElement("button");
    btn.className = "btn";
    btn.type = "button";
    btn.textContent = "Ver";
    btn.addEventListener("click", function () {
      if (onView) onView(record.id);
    });
    tdAction.appendChild(btn);
    tr.appendChild(tdAction);

    container.appendChild(tr);
  }

  function renderRawFields(container, rawFieldsObj) {
    if (!container) return;
    if (!rawFieldsObj) rawFieldsObj = {};
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const obj = rawFieldsObj && typeof rawFieldsObj === "object" && !Array.isArray(rawFieldsObj) ? rawFieldsObj : {};
    const keys = Object.keys(obj);

    if (!keys.length) {
      const empty = document.createElement("p");
      empty.className = "muted small";
      empty.textContent = "Sem campos brutos importados.";
      container.appendChild(empty);
      return;
    }

    const table = document.createElement("table");
    table.className = "table";
    table.style.minWidth = "760px";

    const thead = document.createElement("thead");
    const headTr = document.createElement("tr");
    const thCampo = document.createElement("th");
    thCampo.textContent = "Campo";
    const thValor = document.createElement("th");
    thValor.textContent = "Valor";
    headTr.appendChild(thCampo);
    headTr.appendChild(thValor);
    thead.appendChild(headTr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    keys.forEach(function (k) {
      const tr = document.createElement("tr");
      const tdKey = document.createElement("td");
      const code = document.createElement("code");
      code.textContent = String(k);
      tdKey.appendChild(code);

      const tdValue = document.createElement("td");
      tdValue.textContent = String(obj[k] == null ? "" : obj[k]);

      tr.appendChild(tdKey);
      tr.appendChild(tdValue);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  }

  function renderMarksSummary(container, lastMarks, options) {
    if (!container) return;
    var opts = options || {};
    var fmtDateTime = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : fallbackDateTime;
    var statusColorFn = typeof opts.statusColor === "function" ? opts.statusColor : null;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const entries = Object.entries(lastMarks || {}).sort(function (a, b) {
      if (a[0] === b[0]) return 0;
      return a[0] > b[0] ? 1 : -1;
    });

    const table = document.createElement("table");
    table.className = "table";
    table.style.minWidth = "700px";

    const head = document.createElement("thead");
    const trH = document.createElement("tr");
    ["Usuario", "Setor", "Ultima marcacao", "Data/Hora", "Observacao"].forEach(function (label) {
      const th = document.createElement("th");
      th.textContent = label;
      trH.appendChild(th);
    });
    head.appendChild(trH);
    table.appendChild(head);

    const tbody = document.createElement("tbody");
    if (entries.length) {
      entries.forEach(function (entry) {
        const user = entry[0];
        const info = entry[1] || {};
        const tr = document.createElement("tr");

        const tdUser = document.createElement("td");
        const code = document.createElement("code");
        code.textContent = String(user);
        tdUser.appendChild(code);

        const tdRole = document.createElement("td");
        tdRole.textContent = String(info.role || "-");

        var tdStatus = document.createElement("td");
        tdStatus.appendChild(renderStatusBadge(info.status || "-", statusColorFn));

        const tdAt = document.createElement("td");
        tdAt.className = "muted";
        tdAt.textContent = String(fmtDateTime(info.at));

        const tdNote = document.createElement("td");
        tdNote.textContent = String(info.note || "");

        tr.appendChild(tdUser);
        tr.appendChild(tdRole);
        tr.appendChild(tdStatus);
        tr.appendChild(tdAt);
        tr.appendChild(tdNote);
        tbody.appendChild(tr);
      });
    } else {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.className = "muted";
      td.textContent = "Nenhuma marcacao registrada ainda.";
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    container.appendChild(table);
  }

  function renderRoleNotice(container, options) {
    if (!container) return;
    var opts = options || {};
    var isReadOnlyRole = !!opts.isReadOnlyRole;
    var noticeTitle = String(opts.roleNoticeTitle || "Modo supervisao: somente monitoramento");
    var noticeDescription = String(opts.roleNoticeDescription || "Este perfil acompanha andamento e auditoria em tempo real, sem alterar dados.");

    if (isReadOnlyRole) {
      container.classList.remove("hidden");
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      var h4 = document.createElement("h4");
      h4.textContent = noticeTitle;
      var p = document.createElement("p");
      p.className = "muted small";
      p.textContent = noticeDescription;
      container.appendChild(h4);
      container.appendChild(p);
      return;
    }

    container.classList.add("hidden");
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  function renderSupervisorQuickPanel(container, options) {
    if (!container) return;
    var opts = options || {};
    var isSupervisor = !!opts.isSupervisor;
    var prefilteredRows = Array.isArray(opts.rows) ? opts.rows : [];
    var getState = typeof opts.getGlobalProgressState === "function" ? opts.getGlobalProgressState : null;
    var getUsers = typeof opts.getActiveUsersWithLastMark === "function" ? opts.getActiveUsersWithLastMark : null;
    var getStaleDays = typeof opts.getStaleDays === "function" ? opts.getStaleDays : function () { return Number.NaN; };
    var onOpen = typeof opts.onOpen === "function" ? opts.onOpen : null;

    if (!isSupervisor) {
      container.classList.add("hidden");
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      return;
    }

    var rows = prefilteredRows.map(function (r) {
      return {
        record: r,
        state: getState ? getState(r) : {},
        staleDays: getStaleDays(r)
      };
    });

    var attentionCount = rows.filter(function (x) { return x.state && x.state.code === "attention"; }).length;
    var noMarkCount = rows.filter(function (x) { return x.state && x.state.code === "no_marks"; }).length;
    var staleCount = rows.filter(function (x) { return Number.isFinite(x.staleDays) && x.staleDays >= 7; }).length;
    var inProgressCount = rows.filter(function (x) { return x.state && x.state.code === "in_progress"; }).length;

    var topDelayed = rows.filter(function (x) { return Number.isFinite(x.staleDays); }).sort(function (a, b) {
      return b.staleDays - a.staleDays;
    }).slice(0, 6);

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.classList.remove("hidden");

    var title = document.createElement("h3");
    title.textContent = "Painel rapido da supervisao";
    container.appendChild(title);

    var kpiGrid = document.createElement("div");
    kpiGrid.className = "supervisor-kpi-grid";

    function addKpi(label, value) {
      var card = document.createElement("div");
      card.className = "supervisor-kpi";
      var lp = document.createElement("p");
      lp.className = "supervisor-kpi-label";
      lp.textContent = label;
      var vp = document.createElement("p");
      vp.className = "supervisor-kpi-value";
      vp.textContent = String(value);
      card.appendChild(lp);
      card.appendChild(vp);
      kpiGrid.appendChild(card);
    }

    addKpi("Emendas no filtro", rows.length);
    addKpi("Em atencao", attentionCount);
    addKpi("Sem marcacao", noMarkCount);
    addKpi("Paradas >= 7 dias", staleCount);
    container.appendChild(kpiGrid);

    var progressP = document.createElement("p");
    progressP.className = "muted small";
    progressP.style.marginTop = "10px";
    var progressPrefix = document.createTextNode("Em andamento: ");
    var progressValue = document.createElement("b");
    progressValue.textContent = String(inProgressCount);
    var progressSuffix = document.createTextNode(" | filtro atual aplicado.");
    progressP.appendChild(progressPrefix);
    progressP.appendChild(progressValue);
    progressP.appendChild(progressSuffix);
    container.appendChild(progressP);

    var listWrap = document.createElement("div");
    listWrap.className = "supervisor-list";
    var h4 = document.createElement("h4");
    h4.textContent = "Prioridade de acompanhamento (maior atraso)";
    listWrap.appendChild(h4);

    if (!topDelayed.length) {
      var empty = document.createElement("p");
      empty.className = "muted small";
      empty.textContent = "Sem pendencias com atraso no filtro atual.";
      listWrap.appendChild(empty);
    } else {
      topDelayed.forEach(function (x) {
        var row = document.createElement("div");
        row.className = "supervisor-list-row";

        var col = document.createElement("div");
        var topLine = document.createElement("div");
        var b = document.createElement("b");
        b.textContent = String(x.record && x.record.id ? x.record.id : "-");
        topLine.appendChild(b);
        topLine.appendChild(document.createTextNode(" - " + String(x.record && x.record.identificacao ? x.record.identificacao : "-")));
        var bottomLine = document.createElement("div");
        bottomLine.className = "muted small";
        var recMunicipio = String(x.record && x.record.municipio ? x.record.municipio : "-");
        var recDeputado = String(x.record && x.record.deputado ? x.record.deputado : "-");
        bottomLine.textContent = recMunicipio + " | " + recDeputado + " | atraso: " + String(x.staleDays) + " dias";

        col.appendChild(topLine);
        col.appendChild(bottomLine);
        row.appendChild(col);

        var btn = document.createElement("button");
        btn.className = "btn";
        btn.setAttribute("data-supervisor-open", String(x.record && x.record.id ? x.record.id : ""));
        btn.textContent = "Abrir";
        btn.addEventListener("click", function () {
          if (!onOpen) return;
          onOpen(String(x.record && x.record.id ? x.record.id : ""));
        });
        row.appendChild(btn);

        listWrap.appendChild(row);
      });
    }
    container.appendChild(listWrap);
  }

  function renderPendingUsersTable(container, items, options) {
    if (!container) return;
    var opts = options || {};
    var roles = Array.isArray(opts.roles) ? opts.roles : [];
    var normalizeUserRole = typeof opts.normalizeUserRole === "function" ? opts.normalizeUserRole : function (role) { return role; };
    var dateFmt = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : function (value) { return String(value || "-"); };
    var statusLabel = function (value) {
      var raw = String(value || "EM_ANALISE").trim().toUpperCase();
      if (raw === "APROVADO") return "Aprovado";
      if (raw === "RECUSADO") return "Recusado";
      return "Em analise";
    };

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (!Array.isArray(items) || !items.length) {
      var empty = document.createElement("p");
      empty.className = "muted small";
      empty.textContent = "Nao ha cadastros em analise no momento.";
      container.appendChild(empty);
      return;
    }

    var table = document.createElement("table");
    table.className = "table";
    var thead = document.createElement("thead");
    var trH = document.createElement("tr");
    ["Usuario", "Perfil solicitado", "Criado em", "Status", "Acao"].forEach(function (label) {
      var th = document.createElement("th");
      th.textContent = label;
      trH.appendChild(th);
    });
    thead.appendChild(trH);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    items.forEach(function (u) {
      var row = document.createElement("tr");
      row.setAttribute("data-pending-user-id", String(Number(u.id || 0)));

      var tdUser = document.createElement("td");
      var bUser = document.createElement("b");
      bUser.textContent = String(u && u.nome != null ? u.nome : "");
      tdUser.appendChild(bUser);
      row.appendChild(tdUser);

      var tdPerfil = document.createElement("td");
      var select = document.createElement("select");
      select.setAttribute("data-pending-role", String(Number(u.id || 0)));
      roles.forEach(function (role) {
        var option = document.createElement("option");
        option.value = role;
        option.textContent = role;
        option.selected = role === normalizeUserRole(String(u && u.perfil || "CONTABIL"));
        select.appendChild(option);
      });
      tdPerfil.appendChild(select);
      row.appendChild(tdPerfil);

      var tdDate = document.createElement("td");
      tdDate.className = "muted small";
      tdDate.textContent = dateFmt(u && u.created_at);
      row.appendChild(tdDate);

      var tdStatus = document.createElement("td");
      var badge = document.createElement("span");
      badge.className = "badge pending";
      badge.textContent = statusLabel(u && u.status_cadastro);
      tdStatus.appendChild(badge);
      row.appendChild(tdStatus);

      var tdAction = document.createElement("td");
      var actions = document.createElement("div");
      actions.className = "pending-actions";

      var btnApprove = document.createElement("button");
      btnApprove.className = "btn primary";
      btnApprove.setAttribute("data-pending-action", "approve");
      btnApprove.setAttribute("data-user-id", String(Number(u.id || 0)));
      btnApprove.textContent = "Aprovar";
      actions.appendChild(btnApprove);

      var btnReject = document.createElement("button");
      btnReject.className = "btn danger";
      btnReject.setAttribute("data-pending-action", "reject");
      btnReject.setAttribute("data-user-id", String(Number(u.id || 0)));
      btnReject.textContent = "Recusar";
      actions.appendChild(btnReject);

      tdAction.appendChild(actions);
      row.appendChild(tdAction);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  }

  function renderKvEditor(container, record, options) {
    if (!container) return;
    var rec = record || {};
    var opts = options || {};
    var fieldOrder = Array.isArray(opts.fieldOrder) ? opts.fieldOrder : [];
    var getModalFieldType = typeof opts.getModalFieldType === "function" ? opts.getModalFieldType : function () { return "string"; };
    var formatDraftInputValue = typeof opts.formatDraftInputValue === "function" ? opts.formatDraftInputValue : function (value) {
      return String(value == null ? "" : value);
    };
    var canMutateRecords = !!opts.canMutateRecords;
    var onModalFieldInput = typeof opts.onModalFieldInput === "function" ? opts.onModalFieldInput : function () {};
    var modalDraft = opts.modalDraftState && opts.modalDraftState.draft ? opts.modalDraftState.draft : null;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    fieldOrder.forEach(function (field) {
      var k = document.createElement("div");
      k.className = "k";
      k.textContent = String(field && field.label ? field.label : "");

      var v = document.createElement("div");
      v.className = "v";

      if (field && field.editable) {
        var type = getModalFieldType(field.key);
        var isLongText = field.key === "descricao_acao";
        var input = document.createElement(isLongText ? "textarea" : "input");
        input.className = isLongText ? "kv-textarea" : "kv-input";
        if (!isLongText) input.type = "text";
        input.setAttribute("data-kv-field", field.key);
        input.setAttribute("data-kv-type", type);
        input.value = formatDraftInputValue(modalDraft ? modalDraft[field.key] : rec[field.key], type);
        if (!canMutateRecords) input.disabled = true;
        input.addEventListener("input", onModalFieldInput);
        v.appendChild(input);
      } else {
        if (field && field.key) v.setAttribute("data-kv-readonly-field", field.key);
        v.textContent = String(rec && rec[field.key] == null ? "-" : rec[field.key]);
      }

      container.appendChild(k);
      container.appendChild(v);
    });
  }

  function renderUserProgressBox(container, progress, delays, options) {
    if (!container) return;
    var opts = options || {};
    var renderProgressBar = typeof opts.renderProgressBar === "function" ? opts.renderProgressBar : null;
    var renderMemberChips = typeof opts.renderMemberChips === "function" ? opts.renderMemberChips : null;
    var users = Array.isArray(opts.users) ? opts.users : [];
    var waitingUsers = Array.isArray(delays) ? delays : [];

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (renderProgressBar) {
      var progressWrap = document.createElement("div");
      appendRenderedMarkup(progressWrap, renderProgressBar(progress));
      container.appendChild(progressWrap);
    }

    if (renderMemberChips) {
      var chipWrap = document.createElement("div");
      chipWrap.className = "member-chip-wrap";
      chipWrap.style.marginTop = "8px";
      appendRenderedMarkup(chipWrap, renderMemberChips(users));
      container.appendChild(chipWrap);
    }

    var footer = document.createElement("p");
    footer.className = "muted small";
    footer.style.marginTop = "8px";
    var label = document.createElement("b");
    if (waitingUsers.length) {
      label.textContent = "Quem esta atrasando:";
      footer.appendChild(label);
      footer.appendChild(document.createTextNode(" " + waitingUsers.map(function (user) {
        return String(user && user.name ? user.name : "");
      }).join(", ")));
    } else {
      label.textContent = "Todos concluiram.";
      footer.appendChild(label);
    }
    container.appendChild(footer);
  }

  function updateModalDraftUi(container, draftHintEl, saveGuardEl, saveButtonEl, draftState, options) {
    var opts = options || {};
    var dirty = !!opts.dirty;
    var pending = !!opts.pending;
    var hasMarkDraft = !!opts.hasMarkDraft;
    var hasDraft = dirty || pending || hasMarkDraft;
    var canSave = !!opts.canSave;
    var blockReason = String(opts.blockReason || "");
    var draftSavedAtText = String(opts.draftSavedAtText || "");

    if (draftHintEl) {
      draftHintEl.classList.toggle("hidden", !hasDraft);
      if (hasDraft) {
        if (pending) {
          draftHintEl.textContent = "Marcacao pronta: rascunho local salvo automaticamente. Clique em Salvar edicoes para gravar oficialmente.";
        } else if (canSave) {
          draftHintEl.textContent = "Rascunho local salvo automaticamente. Clique em Salvar edicoes para gravar oficialmente.";
        } else if (hasMarkDraft) {
          draftHintEl.textContent = "Rascunho local salvo automaticamente. Complete status e motivo para gravar oficialmente.";
        } else {
          draftHintEl.textContent = "Rascunho local salvo automaticamente. Informe status e motivo para salvar oficialmente.";
        }
        if (draftSavedAtText) {
          draftHintEl.textContent += " Ultimo rascunho local: " + draftSavedAtText + ".";
        }
      }
    }

    if (saveGuardEl) {
      saveGuardEl.classList.toggle("hidden", !hasDraft || !blockReason);
      saveGuardEl.textContent = blockReason;
    }

    if (saveButtonEl) saveButtonEl.disabled = !canSave;

    if (!container) return;
    var inputs = container.querySelectorAll("[data-kv-field]");
    inputs.forEach(function (el) {
      var key = el.getAttribute("data-kv-field");
      var isDirty = !!(draftState && draftState.dirty && draftState.dirty[key]);
      el.classList.toggle("kv-dirty", isDirty);
    });
  }

  function applyModalAccessProfile(container, controls, options) {
    var opts = options || {};
    var readOnlyMode = !!opts.readOnlyMode;
    var fieldContainer = container || null;
    var refs = controls && typeof controls === "object" ? controls : {};

    if (refs.markStatus) refs.markStatus.disabled = readOnlyMode;
    if (refs.markReason) refs.markReason.disabled = readOnlyMode;
    if (refs.btnMarkStatus) refs.btnMarkStatus.disabled = readOnlyMode;
    if (refs.btnKvSave) refs.btnKvSave.style.display = readOnlyMode ? "none" : "inline-block";

    if (!fieldContainer) return;
    var inputs = fieldContainer.querySelectorAll("[data-kv-field]");
    inputs.forEach(function (el) {
      el.disabled = readOnlyMode;
    });
  }

  function resetAccessState(container) {
    if (!container) return;
    container.classList.add("hidden");
    container.classList.remove("access-mode-readonly", "access-mode-edit", "access-mode-warning");
    container.textContent = "";
  }

  function setModalVisibility(modalEl, visible) {
    if (!modalEl) return;
    var isVisible = !!visible;
    var active = typeof document !== "undefined" ? document.activeElement : null;
    if (!isVisible && active && modalEl.contains(active) && typeof active.blur === "function") {
      active.blur();
    }
    if ("inert" in modalEl) {
      modalEl.inert = !isVisible;
    }
    modalEl.classList.toggle("show", isVisible);
    modalEl.setAttribute("aria-hidden", isVisible ? "false" : "true");
  }

  function syncProfileModalFields(fields, state) {
    var refs = fields && typeof fields === "object" ? fields : {};
    var nextState = state && typeof state === "object" ? state : {};
    if (refs.profileName) refs.profileName.value = String(nextState.userName || "-");
    if (refs.profileRole) refs.profileRole.value = String(nextState.userRole || "-");
    if (refs.profileMode) refs.profileMode.value = nextState.apiEnabled ? "Nuvem/API" : "Local";
    if (refs.profileApi) refs.profileApi.value = nextState.apiOnline ? "Conectada" : "Indisponivel";
  }

  function setPendingUsersFeedbackState(container, message, isError) {
    if (!container) return;
    container.textContent = String(message || "");
    container.style.color = isError ? "#b4233d" : "";
  }

  function setModalSaveFeedbackState(container, message, options) {
    if (!container) return;
    var opts = options || {};
    var text = String(message || "");
    var hidden = !!opts.hidden || !text;
    var isError = !!opts.isError;

    container.textContent = text;
    container.classList.toggle("hidden", hidden);
    container.classList.toggle("success", !hidden && !isError);
    container.classList.toggle("error", !hidden && isError);
  }

  function syncModalRecordHeader(titleEl, subtitleEl, record) {
    if (titleEl) titleEl.textContent = record ? ("Emenda: " + String(record.id || "")) : "";
    if (subtitleEl) {
      if (!record) {
        subtitleEl.textContent = "";
      } else {
        subtitleEl.textContent = [
          String(record.identificacao || ""),
          String(record.municipio || ""),
          String(record.deputado || "")
        ].join(" | ");
      }
    }
  }

  function renderConflictState(boxEl, textEl, issues) {
    if (!boxEl || !textEl) return;
    var list = Array.isArray(issues) ? issues.filter(Boolean) : [];
    var hasIssues = list.length > 0;
    boxEl.classList.toggle("hidden", !hasIssues);
    textEl.textContent = hasIssues ? list.join(" | ") : "";
  }

  function renderModalAccessState(container, record, options) {
    if (!container) return;
    var opts = options || {};
    var modalShown = !!opts.modalShown;
    var canMutate = !!opts.canMutateRecords;
    var apiEnabled = !!opts.apiEnabled;
    var isReadOnly = !!opts.isReadOnly;
    var lockState = opts.lockState || null;
    var readOnlyRoleMessage = String(opts.readOnlyRoleMessage || "MODO LEITURA: perfil SUPERVISAO monitora, sem alterar dados.");
    var fmtDateTime = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : fallbackDateTime;
    var ownerText = typeof opts.emendaLockOwnerText === "function" ? opts.emendaLockOwnerText : function () { return ""; };

    if (!modalShown || !record) {
      resetAccessState(container);
      return;
    }

    function showAccessState(mode, message) {
      container.textContent = String(message || "");
      container.classList.remove("access-mode-readonly", "access-mode-edit", "access-mode-warning");
      if (mode === "readonly") container.classList.add("access-mode-readonly");
      else if (mode === "edit") container.classList.add("access-mode-edit");
      else if (mode === "warning") container.classList.add("access-mode-warning");
      container.classList.remove("hidden");
    }

    if (!apiEnabled) {
      if (!canMutate) {
        showAccessState("readonly", readOnlyRoleMessage);
        return;
      }
      resetAccessState(container);
      return;
    }

    if (!canMutate) {
      showAccessState("readonly", readOnlyRoleMessage);
      return;
    }

    if (!isReadOnly) {
      resetAccessState(container);
      return;
    }

    if (!lockState) {
      showAccessState("warning", "MODO LEITURA: verificando disponibilidade de edicao...");
      return;
    }

    var owner = ownerText(lockState);
    var expiresAt = lockState && lockState.expires_at ? fmtDateTime(lockState.expires_at) : "";
    var ownerMsg = owner ? (" por " + owner) : " por outro usuario";
    var when = expiresAt ? (" Ate: " + expiresAt + ".") : "";
    showAccessState("readonly", "MODO LEITURA: esta emenda esta em edicao" + ownerMsg + "." + when);
  }

  function renderEmendaLockInfo(container, record, options) {
    if (!container) return;
    var opts = options || {};
    var apiEnabled = !!opts.apiEnabled;
    var isSupervisor = !!opts.isSupervisor;
    var isReadOnlyRole = !!opts.isReadOnlyRole;
    var readOnlyLockLabel = String(opts.readOnlyLockLabel || (isSupervisor ? "Modo supervisao (leitura)" : "Modo leitura"));
    var isReadOnly = !!opts.isReadOnly;
    var lockState = opts.lockState || null;
    var fmtDateTime = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : fallbackDateTime;
    var ownerText = typeof opts.emendaLockOwnerText === "function" ? opts.emendaLockOwnerText : function () { return ""; };
    var message = "";

    if (record) {
      if (!apiEnabled) {
        message = "Modo local: lock de edicao indisponivel.";
      } else if (isSupervisor || isReadOnlyRole) {
        var supervisorOwner = ownerText(lockState);
        message = supervisorOwner
          ? (readOnlyLockLabel + ". Em edicao por: " + supervisorOwner + ".")
          : (readOnlyLockLabel + ".");
      } else {
        var expiresAt = lockState && lockState.expires_at ? fmtDateTime(lockState.expires_at) : "";
        if (isReadOnly) {
          var owner = ownerText(lockState);
          var ownerMsg = owner ? ("por " + owner) : "por outro usuario";
          var when = expiresAt ? (" Ate: " + expiresAt + ".") : "";
          message = "Modo leitura ativo: emenda em edicao " + ownerMsg + "." + when;
        } else if (lockState && lockState.locked && lockState.is_owner) {
          var ownerWhen = expiresAt ? (" Ate: " + expiresAt + ".") : "";
          message = "Voce esta com edicao exclusiva desta emenda." + ownerWhen;
        } else {
          message = "Edicao disponivel nesta emenda.";
        }
      }
    }

    container.textContent = message;
  }

  function renderLivePresence(container, users, options) {
    if (!container) return;
    var opts = options || {};
    var text = typeof opts.text === "function" ? opts.text : function (value) { return String(value == null ? "" : value); };
    var list = Array.isArray(users) ? users : [];

    if (!list.length) {
      container.textContent = "Sem outro usuario ativo nesta emenda no momento.";
      return;
    }

    var labels = list.map(function (user) {
      var nome = text(user && user.usuario_nome ? user.usuario_nome : "-");
      var setor = text(user && user.setor ? user.setor : "-");
      return nome + " (" + setor + ")";
    });
    container.textContent = "Usuarios ativos nesta emenda agora: " + labels.join(" | ");
  }

  SECFrontend.uiRender = {
    renderHistoryToContainer,
    renderRawFields,
    renderMarksSummary,
    renderMainRow,
    renderRoleNotice,
    renderSupervisorQuickPanel,
    renderPendingUsersTable,
    renderKvEditor,
    renderUserProgressBox,
    updateModalDraftUi,
    applyModalAccessProfile,
    setModalVisibility,
    syncProfileModalFields,
    setPendingUsersFeedbackState,
    setModalSaveFeedbackState,
    syncModalRecordHeader,
    renderConflictState,
    renderModalAccessState,
    renderEmendaLockInfo,
    renderLivePresence
  };
})(typeof window !== "undefined" ? window : globalThis);
