(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function safeText(value) {
    return value == null ? "" : String(value).trim();
  }

  function buildExecutiveSummaryAoa(model, options) {
    var opts = options || {};
    var summary = model && model.summary ? model.summary : {};
    var byStatus = model && model.byStatus ? model.byStatus : {};
    var fmtDateTime = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : safeText;
    var isoNow = typeof opts.isoNow === "function" ? opts.isoNow : function () { return ""; };
    var currentRole = safeText(opts.currentRole || "-");
    var currentUser = safeText(opts.currentUser || "-");
    var filters = opts.filters && typeof opts.filters === "object" ? opts.filters : {};
    var statusRows = Object.keys(byStatus).map(function (key) {
      return [key, byStatus[key] || 0];
    }).sort(function (a, b) { return b[1] - a[1]; });

    return [
      ["Relatorio executivo - Visao Power BI"],
      ["Gerado em", isoNow()],
      ["Perfil gerador", currentRole],
      ["Usuario gerador", currentUser],
      ["Filtro deputado", filters.deputado || "Todos"],
      ["Filtro municipio", filters.municipio || "Todos"],
      ["Filtro status", filters.status || "Todos"],
      ["Filtro Objetivo EPI", filters.objetivo_epi || "Todos"],
      ["Busca", filters.q || "-"],
      [],
      ["Indicador", "Valor"],
      ["Emendas no dashboard", Number(summary.total || 0)],
      ["Valor atual total", Number(summary.valorTotal || 0)],
      ["Deputados monitorados", summary.deputados ? summary.deputados.size : 0],
      ["Municipios cobertos", summary.municipios ? summary.municipios.size : 0],
      ["Objetivos ativos", summary.objetivos ? summary.objetivos.size : 0],
      ["Concluidas", Number(summary.done || 0)],
      ["Em atencao", Number(summary.attention || 0)],
      ["Ultima atualizacao", summary.latestUpdate ? fmtDateTime(summary.latestUpdate) : "-"],
      [],
      ["Status atual", "Quantidade"]
    ].concat(statusRows);
  }

  function buildExecutiveDeputadosAoa(model, options) {
    var opts = options || {};
    var byDeputado = model && model.byDeputado ? model.byDeputado : {};
    var fmtDateTime = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : safeText;
    var deputados = Object.keys(byDeputado).map(function (key) {
      return byDeputado[key];
    }).sort(function (a, b) {
      if (b.total !== a.total) return b.total - a.total;
      return b.valor - a.valor;
    });
    var rows = deputados.map(function (item) {
      var dominantStatus = Object.keys(item.statusMap || {}).sort(function (a, b) {
        return (item.statusMap[b] || 0) - (item.statusMap[a] || 0);
      })[0] || "-";
      return [
        item.label,
        item.total,
        item.municipios ? item.municipios.size : 0,
        Number(item.valor || 0),
        item.done || 0,
        item.attention || 0,
        item.auditEvents || 0,
        dominantStatus,
        item.latestUpdate ? fmtDateTime(item.latestUpdate) : "-",
        item.latestAction ? fmtDateTime(item.latestAction) : "-",
        item.latestActor || "-"
      ];
    });
    return [["Deputado", "Emendas", "Municipios", "Valor Atual", "Concluidas", "Em atencao", "Eventos", "Status dominante", "Ultima atualizacao", "Ultima acao", "Ultimo ator"]].concat(rows);
  }

  function buildExecutiveMunicipiosAoa(model) {
    var byMunicipio = model && model.byMunicipio ? model.byMunicipio : {};
    var municipios = Object.keys(byMunicipio).map(function (key) {
      return byMunicipio[key];
    }).sort(function (a, b) {
      if (b.total !== a.total) return b.total - a.total;
      return b.valor - a.valor;
    });
    return [["Municipio", "Emendas", "Valor Atual", "Em atencao"]].concat(municipios.map(function (item) {
      return [item.label, item.total || 0, Number(item.valor || 0), item.attention || 0];
    }));
  }

  function buildExecutiveObjetivosAoa(model) {
    var byObjetivo = model && model.byObjetivo ? model.byObjetivo : {};
    var objetivos = Object.keys(byObjetivo).map(function (key) {
      return byObjetivo[key];
    }).sort(function (a, b) {
      if (b.total !== a.total) return b.total - a.total;
      return b.valor - a.valor;
    });
    return [["Objetivo EPI", "Emendas", "Valor Atual", "Em atencao"]].concat(objetivos.map(function (item) {
      return [item.label, item.total || 0, Number(item.valor || 0), item.attention || 0];
    }));
  }

  function buildExecutiveUsersAoa(model, options) {
    var opts = options || {};
    var byUser = model && model.byUser ? model.byUser : {};
    var fmtDateTime = typeof opts.fmtDateTime === "function" ? opts.fmtDateTime : safeText;
    var users = Object.keys(byUser).map(function (key) {
      return byUser[key];
    }).sort(function (a, b) {
      if (b.total !== a.total) return b.total - a.total;
      return String(b.lastAt || "").localeCompare(String(a.lastAt || ""));
    });
    return [["Usuario", "Perfil", "Eventos", "Ultima acao", "Tipo ultimo evento"]].concat(users.map(function (item) {
      return [item.label, item.perfil || "-", item.total || 0, item.lastAt ? fmtDateTime(item.lastAt) : "-", item.lastEvent || "-"];
    }));
  }

  root.exportExecutiveUtils = {
    buildExecutiveSummaryAoa: buildExecutiveSummaryAoa,
    buildExecutiveDeputadosAoa: buildExecutiveDeputadosAoa,
    buildExecutiveMunicipiosAoa: buildExecutiveMunicipiosAoa,
    buildExecutiveObjetivosAoa: buildExecutiveObjetivosAoa,
    buildExecutiveUsersAoa: buildExecutiveUsersAoa
  };
})(window);
