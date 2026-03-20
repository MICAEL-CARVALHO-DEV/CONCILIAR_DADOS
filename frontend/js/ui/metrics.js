// =============================================================
// metrics.js — METRICAS DE PROGRESSO E CHIPS DE MEMBRO
// Dono: Antigravity (frontend/js/ui/)
// Responsabilidade: Calcular e renderizar progresso de emendas por usuario,
//   chips visuais de membro, barra de progresso e alertas de atencao.
// Exports: SECFrontend.progressUtils
//   getActiveUsersWithLastMark, calcProgress, getAttentionIssues,
//   getGlobalProgressState, renderMemberChips, renderProgressBar,
//   lastEventAt, daysSince, whoIsDelaying
// Nao tocar: app.js, index.html, style.css
// =============================================================
(function (win) {
  const SECFrontend = (win && win.SECFrontend && typeof win.SECFrontend === "object") ? win.SECFrontend : (win.SECFrontend = {});

  function toText(value) {
    return value == null ? "" : String(value);
  }

  function toComparableStatusList(input) {
    return Array.isArray(input) ? input : [];
  }

  function getActiveUsersWithLastMark(rec, options) {
    const opts = options || {};
    const normalizeStatusFn = typeof opts.normalizeStatus === "function" ? opts.normalizeStatus : function (value) {
      return toText(value);
    };
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
        user.lastStatus = normalizeStatusFn(ev.to || "");
        user.lastAt = ev.at || null;
        user.lastNote = ev.note || "";
        user.role = ev.actor_role || user.role || "-";
      }
    });

    const cmp = function (a, b) {
      if (typeof opts.localeCompare === "function") {
        return opts.localeCompare(a.name || "", b.name || "", "pt-BR");
      }
      const aa = toText(a.name);
      const bb = toText(b.name);
      if (aa < bb) return -1;
      if (aa > bb) return 1;
      return 0;
    };

    return Array.from(map.values()).sort(cmp);
  }

  function calcProgress(users) {
    const list = toComparableStatusList(users);
    const total = list.length;
    const doneCount = list.filter(function (u) {
      return u.lastStatus === "Concluido";
    }).length;
    return {
      total: total,
      concl: doneCount,
      percent: total ? Math.round((doneCount / total) * 100) : 0,
      done: total > 0 && doneCount === total
    };
  }

  function getAttentionIssues(users) {
    const list = Array.isArray(users) ? users : [];
    const issues = [];
    if (!list.length) return issues;

    const noStatus = list.filter(function (u) {
      return !u.lastStatus;
    });
    if (noStatus.length) {
      issues.push("Usuarios sem status: " + noStatus.map(function (u) {
        return u.name;
      }).join(", "));
    }

    const hasCancelado = list.some(function (u) {
      return u.lastStatus === "Cancelado";
    });
    const hasConcluido = list.some(function (u) {
      return u.lastStatus === "Concluido";
    });

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
    return String(name || "").trim().split(/\s+/).slice(0, 2).map(function (p) {
      return p.charAt(0);
    }).join("").toUpperCase();
  }

  function renderMemberChips(users, options) {
    const opts = options || {};
    const escapeHtml = typeof opts.escapeHtml === "function" ? opts.escapeHtml : function (value) {
      return toText(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };
    const statusClass = typeof opts.statusClass === "function" ? opts.statusClass : function () {
      return "st-none";
    };
    const daysSince = typeof opts.daysSince === "function" ? opts.daysSince : function () {
      return Infinity;
    };

    const list = Array.isArray(users) ? users : [];
    if (!list.length) return "<span class=\"muted small\">Sem marcacoes</span>";

    return list.map(function (u) {
      const cls = statusClass(u.lastStatus || "");
      const stale = daysSince(u.lastAt);
      const staleTag = stale === Infinity ? "" : "<span class=\"chip-age\">" + String(stale) + "d</span>";
      const title = escapeHtml(toText(u.name) + " / " + (u.role || "-") + " | " + (u.lastStatus || "Sem status") + " | " + (u.lastAt || "-"));
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
    return (Array.isArray(users) ? users : []).filter(function (u) {
      return u.lastStatus !== "Concluido";
    });
  }

  SECFrontend.progressUtils = {
    getActiveUsersWithLastMark: getActiveUsersWithLastMark,
    calcProgress: calcProgress,
    getAttentionIssues: getAttentionIssues,
    getGlobalProgressState: getGlobalProgressState,
    getInitials: getInitials,
    renderMemberChips: renderMemberChips,
    renderProgressBar: renderProgressBar,
    lastEventAt: lastEventAt,
    daysSince: daysSince,
    whoIsDelaying: whoIsDelaying
  };
})(typeof window !== "undefined" ? window : globalThis);
