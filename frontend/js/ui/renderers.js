(function (win) {
  var SECFrontend = (win && win.SECFrontend && typeof win.SECFrontend === "object") ? win.SECFrontend : (win.SECFrontend = {});

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
      tdProgress.innerHTML = String(renderProgressBar(progress));
    } else {
      tdProgress.textContent = "";
    }
    tr.appendChild(tdProgress);

    var tdChips = document.createElement("td");
    if (renderMemberChips) {
      tdChips.innerHTML = String(renderMemberChips(users));
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

  SECFrontend.uiRender = {
    renderHistoryToContainer,
    renderRawFields,
    renderMarksSummary,
    renderMainRow
  };
})(typeof window !== "undefined" ? window : globalThis);
