(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};
  var normalizeUtils = root.normalizeUtils || {};

  function safeNormalizeHeader(value, normalizeHeaderFn) {
    if (typeof normalizeHeaderFn === "function") return normalizeHeaderFn;
    if (typeof normalizeUtils.normalizeHeader === "function") return normalizeUtils.normalizeHeader;
    return function (v) {
      return String(v == null ? "" : v)
        .toLowerCase()
        .trim();
    };
  }

  function upsertRawField(rawObj, canonicalKey, value, aliasesByCanonical, preferredHeaders, normalizeHeaderFn) {
    if (!rawObj || typeof rawObj !== "object") return;

    var aliases = (aliasesByCanonical && aliasesByCanonical[canonicalKey]) || [];
    var preferred = (preferredHeaders && preferredHeaders[canonicalKey]) || canonicalKey;
    var normalizeHeader = safeNormalizeHeader(normalizeHeaderFn);
    var normalizedAliases = aliases.map(function (alias) {
      return normalizeHeader(alias);
    });

    var keyFound = null;
    Object.keys(rawObj).forEach(function (k) {
      if (keyFound) return;
      if (normalizedAliases.includes(normalizeHeader(k))) {
        keyFound = k;
      }
    });

    var finalKey = keyFound || preferred;
    rawObj[finalKey] = value == null ? "" : value;
  }

  function syncCanonicalToAllFields(record, aliasesByCanonical, preferredHeaders, normalizeHeaderFn) {
    if (!record || typeof record !== "object") return;

    if (!record.all_fields || typeof record.all_fields !== "object") {
      record.all_fields = {};
    }

    upsertRawField(record.all_fields, "id", record.id, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "ano", record.ano, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "identificacao", record.identificacao, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "cod_subfonte", record.cod_subfonte, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "deputado", record.deputado, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "cod_uo", record.cod_uo, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "sigla_uo", record.sigla_uo, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "cod_orgao", record.cod_orgao, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "cod_acao", record.cod_acao, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "descricao_acao", record.descricao_acao, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "plan_a", record.plan_a, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "plan_b", record.plan_b, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "municipio", record.municipio, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "valor_inicial", record.valor_inicial, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "valor_atual", record.valor_atual, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    upsertRawField(record.all_fields, "processo_sei", record.processo_sei, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
  }

  root.importNormalizationUtils = root.importNormalizationUtils || {};
  root.importNormalizationUtils.upsertRawField = upsertRawField;
  root.importNormalizationUtils.syncCanonicalToAllFields = syncCanonicalToAllFields;
})(window);
