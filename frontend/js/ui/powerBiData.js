(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function buildPowerBiFilterOptions(rows, ctx) {
    var source = Array.isArray(rows) ? rows : [];
    var anoAtivo = ctx.filters && ctx.filters.ano ? String(ctx.filters.ano) : "";

    // Calcula opcoes disponíveis aplicando os filtros atuais,
    // exceto o filtro da propria categoria (logica de cascata cruzada)

    var filterForDeputados = source.filter(function(rec) {
        if (anoAtivo && String(ctx.text(rec && rec.ano) || "") !== anoAtivo) return false;
        if (ctx.filters.municipio && (ctx.text(rec && rec.municipio) || "-") !== ctx.filters.municipio) return false;
        if (ctx.filters.status && (ctx.getRecordCurrentStatus(rec) || "-") !== ctx.filters.status) return false;
        return true;
    });

    var filterForMunicipios = source.filter(function(rec) {
        if (anoAtivo && String(ctx.text(rec && rec.ano) || "") !== anoAtivo) return false;
        if (ctx.filters.deputado && (ctx.text(rec && rec.deputado) || "-") !== ctx.filters.deputado) return false;
        if (ctx.filters.status && (ctx.getRecordCurrentStatus(rec) || "-") !== ctx.filters.status) return false;
        return true;
    });

    var filterForStatuses = source.filter(function(rec) {
        if (anoAtivo && String(ctx.text(rec && rec.ano) || "") !== anoAtivo) return false;
        if (ctx.filters.deputado && (ctx.text(rec && rec.deputado) || "-") !== ctx.filters.deputado) return false;
        if (ctx.filters.municipio && (ctx.text(rec && rec.municipio) || "-") !== ctx.filters.municipio) return false;
        return true;
    });

    // Anos: calculados a partir de todo o source sem filtro de ano para mostrar todos os anos disponíveis
    var anos = Array.from(new Set(source.map(function(rec) {
        return String(ctx.text(rec && rec.ano) || "");
    }).filter(Boolean))).sort().reverse();

    var deputados = Array.from(new Set(filterForDeputados.map(function (rec) { return ctx.text(rec && rec.deputado) || "-"; }).filter(Boolean))).sort();
    var municipios = Array.from(new Set(filterForMunicipios.map(function (rec) { return ctx.text(rec && rec.municipio) || "-"; }).filter(Boolean))).sort();
    var statuses = Array.from(new Set(filterForStatuses.map(function (rec) { return ctx.getRecordCurrentStatus(rec) || "-"; }).filter(Boolean))).sort();
    return {
      anos: anos,
      deputados: deputados,
      municipios: municipios,
      statuses: statuses
    };
  }

  function applyPowerBiDashboardFilters(rows, ctx) {
    var source = Array.isArray(rows) ? rows : [];
    var anoAtivo = ctx.filters && ctx.filters.ano ? String(ctx.filters.ano) : "";
    return source.filter(function (rec) {
      var deputado = ctx.text(rec && rec.deputado) || "-";
      var municipio = ctx.text(rec && rec.municipio) || "-";
      var objetivoEpi = ctx.text(rec && rec.objetivo_epi) || "-";
      var statusAtual = ctx.getRecordCurrentStatus(rec) || "-";
      var recAno = String(ctx.text(rec && rec.ano) || "");
      if (anoAtivo && recAno !== anoAtivo) return false;
      if (ctx.filters.deputado && deputado !== ctx.filters.deputado) return false;
      if (ctx.filters.municipio && municipio !== ctx.filters.municipio) return false;
      if (ctx.filters.status && statusAtual !== ctx.filters.status) return false;
      if (ctx.filters.objetivo_epi && !ctx.normalizeLooseText(objetivoEpi).includes(ctx.normalizeLooseText(ctx.filters.objetivo_epi))) return false;
      if (ctx.filters.q) {
        var blob = ctx.normalizeLooseText([
          ctx.text(rec && rec.id),
          ctx.text(rec && rec.identificacao),
          deputado,
          municipio,
          objetivoEpi,
          ctx.text(rec && rec.cod_acao),
          ctx.text(rec && rec.descricao_acao),
          ctx.text(rec && rec.plan_a),
          ctx.text(rec && rec.plan_b),
          statusAtual
        ].join(" "));
        if (!blob.includes(ctx.normalizeLooseText(ctx.filters.q))) return false;
      }
      return true;
    });
  }

  function getDeputadoAvatarLetters(name, ctx) {
    var src = ctx.text(name || "").trim();
    if (!src) return "DP";
    var parts = src.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getDeputadoPhotoUrl(record, ctx) {
    if (!record || typeof record !== "object") return "";
    var allFields = record.all_fields && typeof record.all_fields === "object" ? record.all_fields : {};
    var candidates = [
      record.foto_deputado_url,
      record.foto_url,
      allFields.foto_deputado_url,
      allFields.foto_url,
      allFields.foto,
      allFields.imagem,
      allFields.image_url
    ];
    for (var i = 0; i < candidates.length; i += 1) {
      var value = ctx.text(candidates[i]);
      if (!value) continue;
      if (/^(https?:)?\/\//i.test(value) || value.startsWith("/")) return value;
    }
    return "";
  }

  function getScopedAuditRowsForRecords(rows, ctx) {
    if (!Array.isArray(ctx.betaAuditRows) || !ctx.betaAuditRows.length) return [];
    var ids = {};
    (Array.isArray(rows) ? rows : []).forEach(function (rec) {
      var backendId = ctx.getBackendIdForRecord(rec);
      if (backendId) ids[String(backendId)] = true;
    });
    return ctx.betaAuditRows.filter(function (row) {
      return !!ids[String(Number(row && row.emenda_id ? row.emenda_id : 0))];
    });
  }

  function normalizeMunicipioKey(value, ctx) {
    var raw = ctx.text(value || "");
    if (!raw) return "";
    if (typeof ctx.normalizeLooseText === "function") return ctx.normalizeLooseText(raw);
    return String(raw).toLowerCase().trim();
  }

  function parseCoordinateNumber(value) {
    if (value == null) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    var normalized = String(value)
      .trim()
      .replace(/\s/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(/,/g, ".")
      .replace(/[^\d.-]/g, "");
    if (!normalized) return null;
    var parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function parseLatitude(value) {
    var latitude = parseCoordinateNumber(value);
    if (!Number.isFinite(latitude)) return null;
    if (latitude < -35 || latitude > 8) return null;
    return latitude;
  }

  function parseLongitude(value) {
    var longitude = parseCoordinateNumber(value);
    if (!Number.isFinite(longitude)) return null;
    if (longitude < -75 || longitude > -25) return null;
    return longitude;
  }

  function readMunicipioGeo(record) {
    if (!record || typeof record !== "object") return null;
    var allFields = record.all_fields && typeof record.all_fields === "object" ? record.all_fields : {};

    var latCandidates = [
      record.latitude,
      record.lat,
      record.coord_lat,
      allFields.latitude,
      allFields.lat,
      allFields.coord_lat,
      allFields.coordenada_lat,
      allFields.y
    ];
    var lonCandidates = [
      record.longitude,
      record.lng,
      record.lon,
      record.coord_lon,
      allFields.longitude,
      allFields.lng,
      allFields.lon,
      allFields.coord_lon,
      allFields.coordenada_lon,
      allFields.x
    ];

    var latitude = null;
    var longitude = null;
    var i;
    for (i = 0; i < latCandidates.length; i += 1) {
      latitude = parseLatitude(latCandidates[i]);
      if (latitude != null) break;
    }
    for (i = 0; i < lonCandidates.length; i += 1) {
      longitude = parseLongitude(lonCandidates[i]);
      if (longitude != null) break;
    }

    if (latitude == null || longitude == null) return null;
    return { lat: latitude, lon: longitude };
  }

  function buildPseudoGeoFromKey(key) {
    var source = String(key || "sec-map");
    var hashA = 7;
    var hashB = 13;
    for (var i = 0; i < source.length; i += 1) {
      var code = source.charCodeAt(i);
      hashA = (hashA * 31 + code) % 100003;
      hashB = (hashB * 37 + code) % 100019;
    }
    var lat = -18.2 + ((hashA % 10000) / 10000) * 10.2;
    var lon = -46.2 + ((hashB % 10000) / 10000) * 9.8;
    return { lat: lat, lon: lon };
  }

  function buildMunicipioMapModel(mapBuckets) {
    var points = Object.keys(mapBuckets || {}).map(function (key) {
      return mapBuckets[key];
    }).filter(Boolean);

    var realGeoCount = points.reduce(function (acc, point) {
      return acc + (point.hasRealGeo ? 1 : 0);
    }, 0);

    points.forEach(function (point) {
      if (point.hasRealGeo && Number.isFinite(point.lat) && Number.isFinite(point.lon)) return;
      var pseudo = buildPseudoGeoFromKey(point.key || point.label);
      point.lat = pseudo.lat;
      point.lon = pseudo.lon;
    });

    var latValues = points.map(function (point) { return point.lat; }).filter(Number.isFinite);
    var lonValues = points.map(function (point) { return point.lon; }).filter(Number.isFinite);
    var latMin = latValues.length ? Math.min.apply(null, latValues) : -19;
    var latMax = latValues.length ? Math.max.apply(null, latValues) : -7;
    var lonMin = lonValues.length ? Math.min.apply(null, lonValues) : -47;
    var lonMax = lonValues.length ? Math.max.apply(null, lonValues) : -36;
    if (latMax <= latMin) latMax = latMin + 1;
    if (lonMax <= lonMin) lonMax = lonMin + 1;

    return {
      usingRealCoordinates: realGeoCount >= 3,
      points: points,
      bounds: {
        latMin: latMin - 0.4,
        latMax: latMax + 0.4,
        lonMin: lonMin - 0.4,
        lonMax: lonMax + 0.4
      }
    };
  }

  // CONTRATO: `filteredRows` deve ser pre-filtrado pelo ANO e STATUS
  // selecionados na tabela principal ANTES de chamar esta funcao.
  // Dessa forma os dropdowns cascata (Deputado, Municipio) nao exibiram
  // opcoes de anos diferentes do filtro ativo.
  // Responsabilidade do chamador em app.js: passar apenas os records do ano corrente.
  function buildPowerBiDashboardData(filteredRows, ctx) {
    var sourceRows = Array.isArray(filteredRows) ? filteredRows : [];
    // filterOptions usa sourceRows intencionalmente para calcular opcoes cruzadas:
    // ex: ao filtrar deputado, recalcula municipios disponiveis E vice-versa.
    // Mas sourceRows ja deve chegar pre-filtrado por Ano pelo chamador.
    var filterOptions = buildPowerBiFilterOptions(sourceRows, ctx);
    var rows = applyPowerBiDashboardFilters(sourceRows, ctx);
    var scopedAuditRows = getScopedAuditRowsForRecords(rows, ctx);
    var isExecutiveRole = ["APG", "SUPERVISAO", "POWERBI", "PROGRAMADOR"].indexOf(ctx.currentRole) >= 0;

    var summary = {
      total: rows.length,
      valorTotal: 0,
      done: 0,
      attention: 0,
      deputados: new Set(),
      municipios: new Set(),
      objetivos: new Set(),
      latestUpdate: ""
    };
    var byDeputado = {};
    var byMunicipio = {};
    var byObjetivo = {};
    var byStatus = {};
    var byUser = {};
    var mapByMunicipio = {};
    var recordDeputadoMap = {};

    rows.forEach(function (rec) {
      var users = ctx.getActiveUsersWithLastMark(rec);
      var global = ctx.getGlobalProgressState(users);
      var deputado = ctx.text(rec && rec.deputado) || "-";
      var municipio = ctx.text(rec && rec.municipio) || "-";
      var municipioKey = normalizeMunicipioKey(municipio, ctx) || ("municipio-" + String(Object.keys(mapByMunicipio).length));
      var objetivoEpi = ctx.text(rec && rec.objetivo_epi) || "-";
      var valor = ctx.toNumber(rec && rec.valor_atual);
      var statusAtual = ctx.getRecordCurrentStatus(rec) || "-";
      var updatedAt = ctx.text(rec && rec.updated_at);
      var backendId = ctx.getBackendIdForRecord(rec);

      summary.valorTotal += valor;
      summary.deputados.add(deputado);
      summary.municipios.add(municipio);
      summary.objetivos.add(objetivoEpi);
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
          photoUrl: getDeputadoPhotoUrl(rec, ctx)
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

      if (!mapByMunicipio[municipioKey]) {
        mapByMunicipio[municipioKey] = {
          key: municipioKey,
          label: municipio,
          total: 0,
          valor: 0,
          attention: 0,
          lat: null,
          lon: null,
          hasRealGeo: false
        };
      }
      mapByMunicipio[municipioKey].total += 1;
      mapByMunicipio[municipioKey].valor += valor;
      if (global && global.code === "attention") mapByMunicipio[municipioKey].attention += 1;
      var geo = readMunicipioGeo(rec);
      if (geo && !mapByMunicipio[municipioKey].hasRealGeo) {
        mapByMunicipio[municipioKey].lat = geo.lat;
        mapByMunicipio[municipioKey].lon = geo.lon;
        mapByMunicipio[municipioKey].hasRealGeo = true;
      }

      if (!byObjetivo[objetivoEpi]) byObjetivo[objetivoEpi] = { label: objetivoEpi, total: 0, valor: 0, attention: 0 };
      byObjetivo[objetivoEpi].total += 1;
      byObjetivo[objetivoEpi].valor += valor;
      if (global && global.code === "attention") byObjetivo[objetivoEpi].attention += 1;

      byStatus[statusAtual] = (byStatus[statusAtual] || 0) + 1;
    });

    scopedAuditRows.forEach(function (row) {
      var deputado = recordDeputadoMap[String(Number(row && row.emenda_id ? row.emenda_id : 0))];
      var actorName = ctx.text(row && row.usuario_nome) || "sistema";
      var eventType = ctx.text(row && row.tipo_evento) || "EVENTO";
      if (actorName) {
        byUser[actorName] = byUser[actorName] || { label: actorName, total: 0, perfil: ctx.text(row && row.setor) || "-", lastAt: "", lastEvent: "" };
        byUser[actorName].total += 1;
        if (ctx.text(row && row.data_hora) && (!byUser[actorName].lastAt || ctx.text(row.data_hora) > byUser[actorName].lastAt)) {
          byUser[actorName].lastAt = ctx.text(row.data_hora);
          byUser[actorName].lastEvent = eventType;
        }
      }
      if (!deputado || !byDeputado[deputado]) return;
      byDeputado[deputado].auditEvents += 1;
      byDeputado[deputado].actors.add(actorName);
      if (ctx.text(row && row.data_hora) && (!byDeputado[deputado].latestAction || ctx.text(row.data_hora) > byDeputado[deputado].latestAction)) {
        byDeputado[deputado].latestAction = ctx.text(row.data_hora);
        byDeputado[deputado].latestActor = actorName;
      }
    });

    return {
      sourceRows: sourceRows,
      filterOptions: filterOptions,
      rows: rows,
      scopedAuditRows: scopedAuditRows,
      isExecutiveRole: isExecutiveRole,
      mapModel: buildMunicipioMapModel(mapByMunicipio),
      deputadoCountPolicy: ctx.deputadoCountPolicy || {
        origem_oficial: "BASE_ATUAL",
        escopo_ajuste: "GLOBAL",
        perfil_ajuste: "PROGRAMADOR",
        observacao: "Contagem oficial usa emendas atuais da base consolidada; todos os usuarios autenticados podem visualizar e apenas PROGRAMADOR pode ajustar globalmente com auditoria."
      },
      summary: summary,
      byDeputado: byDeputado,
      byMunicipio: byMunicipio,
      byObjetivo: byObjetivo,
      byStatus: byStatus,
      byUser: byUser
    };
  }

  root.powerBiDataUtils = {
    buildPowerBiFilterOptions: buildPowerBiFilterOptions,
    applyPowerBiDashboardFilters: applyPowerBiDashboardFilters,
    getDeputadoAvatarLetters: getDeputadoAvatarLetters,
    getDeputadoPhotoUrl: getDeputadoPhotoUrl,
    getScopedAuditRowsForRecords: getScopedAuditRowsForRecords,
    buildPowerBiDashboardData: buildPowerBiDashboardData
  };
})(typeof window !== "undefined" ? window : globalThis);

