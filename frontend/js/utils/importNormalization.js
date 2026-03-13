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

  function normalizeReferencePart(value, normalizeLooseTextFn) {
    if (typeof normalizeLooseTextFn === "function") {
      return normalizeLooseTextFn(value).replace(/\s+/g, " ").trim();
    }
    if (typeof normalizeUtils.normalizeReferencePart === "function") {
      return normalizeUtils.normalizeReferencePart(value);
    }
    return String(value == null ? "" : value)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildReferenceKey(record, referenceFields, normalizeReferencePartFn) {
    if (!record || typeof record !== "object") return "";

    var fields = Array.isArray(referenceFields) && referenceFields.length ? referenceFields : [];
    var normalizePart = typeof normalizeReferencePartFn === "function" ? normalizeReferencePartFn : normalizeReferencePart;
    var parts = fields.map(function (field) {
      return normalizePart(record[field]);
    });

    if (!parts.length) return "";
    if (parts.every(function (part) { return part === ""; })) return "";
    return parts.join("|");
  }

  function syncReferenceKeys(records, referenceFields, buildReferenceKeyFn) {
    if (!Array.isArray(records)) return;

    var buildKey = (typeof buildReferenceKeyFn === "function")
      ? buildReferenceKeyFn
      : function (record) { return buildReferenceKey(record, referenceFields, normalizeReferencePart); };

    records.forEach(function (record) {
      if (!record || typeof record !== "object") return;
      record.ref_key = buildKey(record);
    });
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

  function buildRawFieldsPreview(record, draftState, fieldOrder, getModalFieldType, normalizeDraftFieldValue, aliasesByCanonical, preferredHeaders, normalizeHeaderFn) {
    if (!record || typeof record !== "object") return {};

    var clone = typeof normalizeUtils.shallowCloneObj === "function"
      ? normalizeUtils.shallowCloneObj
      : function (obj) {
          var out = {};
          Object.keys(obj || {}).forEach(function (key) {
            out[key] = obj[key];
          });
          return out;
        };
    var preview = clone(record);
    preview.all_fields = clone(record.all_fields && typeof record.all_fields === "object" ? record.all_fields : {});

    var state = draftState && typeof draftState === "object" ? draftState : null;
    var fields = Array.isArray(fieldOrder) ? fieldOrder : [];
    var getType = typeof getModalFieldType === "function" ? getModalFieldType : function () { return "string"; };
    var normalizeDraft = typeof normalizeDraftFieldValue === "function"
      ? normalizeDraftFieldValue
      : function (value) { return value == null ? "" : value; };

    if (state && String(state.recordId || "") === String(record.id || "") && state.draft && typeof state.draft === "object") {
      fields.forEach(function (field) {
        if (!field || !field.editable || !field.key) return;
        preview[field.key] = normalizeDraft(state.draft[field.key], getType(field.key));
      });
    }

    syncCanonicalToAllFields(preview, aliasesByCanonical, preferredHeaders, normalizeHeaderFn);
    return preview.all_fields;
  }

  root.importNormalizationUtils = root.importNormalizationUtils || {};
  root.importNormalizationUtils.upsertRawField = upsertRawField;
  root.importNormalizationUtils.syncCanonicalToAllFields = syncCanonicalToAllFields;
  root.importNormalizationUtils.buildRawFieldsPreview = buildRawFieldsPreview;
  root.importNormalizationUtils.normalizeReferencePart = normalizeReferencePart;
  root.importNormalizationUtils.buildReferenceKey = buildReferenceKey;
  root.importNormalizationUtils.syncReferenceKeys = syncReferenceKeys;
})(window);
