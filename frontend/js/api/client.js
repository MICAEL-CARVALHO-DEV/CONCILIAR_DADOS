(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  var clientConfig = {
    runtimeConfig: {},
    keys: {
      apiBaseUrl: "SEC_API_BASE_URL",
      apiEnabled: "SEC_API_ENABLED",
      apiSharedKeySession: "SEC_API_SHARED_KEY_SESSION"
    },
    defaultApiBaseUrl: "http://localhost:8000",
    defaultEventOrigin: "UI",
    getCurrentUser: function () { return ""; },
    getCurrentRole: function () { return ""; },
    readStoredSessionToken: function () { return ""; },
    getSharedApiKey: function () { return ""; },
    onNetworkError: function () {},
    onHttpError: function () {},
    onAuthFailure: function () {}
  };

  function text(value) {
    return value == null ? "" : String(value).trim();
  }

  function normalizeHostToken(value) {
    return String(value == null ? "" : value).trim().toLowerCase();
  }

  function hostMatchesSuffix(host, suffix) {
    var h = normalizeHostToken(host);
    var s = normalizeHostToken(suffix);
    if (!h || !s) return false;
    if (s.startsWith(".")) return h.endsWith(s);
    return h === s || h.endsWith("." + s);
  }

  function resolveHostMappedValue(host, byHost, bySuffix) {
    var h = normalizeHostToken(host);
    var exactMap = byHost && typeof byHost === "object" ? byHost : {};
    var suffixMap = bySuffix && typeof bySuffix === "object" ? bySuffix : {};
    var exactValue = text(exactMap[h]);
    if (exactValue) return exactValue;

    var suffixes = Object.keys(suffixMap).sort(function (a, b) {
      return String(b || "").length - String(a || "").length;
    });
    for (var i = 0; i < suffixes.length; i += 1) {
      var suffix = suffixes[i];
      if (!hostMatchesSuffix(h, suffix)) continue;
      var mapped = text(suffixMap[suffix]);
      if (mapped) return mapped;
    }
    return "";
  }

  function configure(nextConfig) {
    if (!nextConfig || typeof nextConfig !== "object") return;
    if (nextConfig.runtimeConfig && typeof nextConfig.runtimeConfig === "object") {
      clientConfig.runtimeConfig = nextConfig.runtimeConfig;
    }
    if (nextConfig.keys && typeof nextConfig.keys === "object") {
      clientConfig.keys = Object.assign({}, clientConfig.keys, nextConfig.keys);
    }

    [
      "defaultApiBaseUrl",
      "defaultEventOrigin",
      "getCurrentUser",
      "getCurrentRole",
      "readStoredSessionToken",
      "getSharedApiKey",
      "onNetworkError",
      "onHttpError",
      "onAuthFailure"
    ].forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(nextConfig, key) && nextConfig[key] != null) {
        clientConfig[key] = nextConfig[key];
      }
    });
  }

  function normalizeLoopbackBase(value) {
    var candidate = text(value);
    if (!candidate) return "";
    try {
      var parsed = new URL(candidate);
      var hostName = String(parsed.hostname || "").toLowerCase();
      var loopbackHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
      if (loopbackHosts.indexOf(hostName) < 0) return "";
      var proto = parsed.protocol === "https:" ? "https:" : "http:";
      var port = parsed.port ? ":" + parsed.port : "";
      return (proto + "//127.0.0.1" + port).replace(/\/+$/, "");
    } catch (_err) {
      if (!/^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?(?:\/|$)/i.test(candidate)) return "";
      return candidate
        .replace(/^https?:\/\/(?:localhost|0\.0\.0\.0|\[::1\])/i, function (prefix) {
          return prefix.toLowerCase().startsWith("https://") ? "https://127.0.0.1" : "http://127.0.0.1";
        })
        .replace(/\/+$/, "");
    }
  }

  function isApiEnabled() {
    var host = (global.location && global.location.hostname) ? String(global.location.hostname) : "";
    var isHostedUi = !!host && host !== "localhost" && host !== "127.0.0.1";
    if (isHostedUi) {
      var saved = global.localStorage.getItem(clientConfig.keys.apiEnabled);
      if (saved != null && String(saved).trim().toLowerCase() === "false") {
        global.localStorage.removeItem(clientConfig.keys.apiEnabled);
      }
      return true;
    }
    var raw = global.localStorage.getItem(clientConfig.keys.apiEnabled);
    if (raw == null || raw === "") return true;
    return String(raw).trim().toLowerCase() !== "false";
  }

  function getApiBaseUrl() {
    var raw = global.localStorage.getItem(clientConfig.keys.apiBaseUrl);
    var runtimeConfig = clientConfig.runtimeConfig && typeof clientConfig.runtimeConfig === "object" ? clientConfig.runtimeConfig : {};
    var runtimeBase = text(runtimeConfig.API_BASE_URL);
    var byHostMap = runtimeConfig.API_BASE_URL_BY_HOST && typeof runtimeConfig.API_BASE_URL_BY_HOST === "object"
      ? runtimeConfig.API_BASE_URL_BY_HOST
      : {};
    var byHostSuffixMap = runtimeConfig.API_BASE_URL_BY_HOST_SUFFIX_MAP && typeof runtimeConfig.API_BASE_URL_BY_HOST_SUFFIX_MAP === "object"
      ? runtimeConfig.API_BASE_URL_BY_HOST_SUFFIX_MAP
      : (runtimeConfig.API_BASE_URL_BY_HOST_SUFFIX && typeof runtimeConfig.API_BASE_URL_BY_HOST_SUFFIX === "object"
        ? runtimeConfig.API_BASE_URL_BY_HOST_SUFFIX
        : {});
    var host = (global.location && global.location.hostname) ? String(global.location.hostname) : "";
    var hostBase = resolveHostMappedValue(host, byHostMap, byHostSuffixMap);
    var isHostedUi = !!host && host !== "localhost" && host !== "127.0.0.1";
    var storedBase = text(raw);
    var normalizedStoredLoopback = normalizeLoopbackBase(storedBase);
    var hasLoopbackOverride = !!normalizedStoredLoopback;
    var hasRemoteOverride = !!storedBase && !hasLoopbackOverride;

    if (isHostedUi && hasLoopbackOverride) {
      global.localStorage.removeItem(clientConfig.keys.apiBaseUrl);
    }

    if (!isHostedUi) {
      if (hasRemoteOverride) {
        global.localStorage.removeItem(clientConfig.keys.apiBaseUrl);
      }
      var localBase = normalizedStoredLoopback
        || normalizeLoopbackBase(hostBase)
        || normalizeLoopbackBase(runtimeBase)
        || normalizeLoopbackBase(clientConfig.defaultApiBaseUrl)
        || "http://127.0.0.1:8000";
      if (localBase && storedBase !== localBase) {
        global.localStorage.setItem(clientConfig.keys.apiBaseUrl, localBase);
      }
      return localBase.replace(/\/+$/, "");
    }

    var safeStoredBase = (isHostedUi && hasLoopbackOverride) || (!isHostedUi && hasRemoteOverride) ? "" : storedBase;
    var base = safeStoredBase || hostBase || runtimeBase || clientConfig.defaultApiBaseUrl;
    return base.replace(/\/+$/, "");
  }

  function buildApiHeaders(eventOrigin) {
    var headers = {
      "X-User-Name": String(clientConfig.getCurrentUser() || ""),
      "X-User-Role": String(clientConfig.getCurrentRole() || "")
    };

    var origin = String(eventOrigin || clientConfig.defaultEventOrigin).trim().toUpperCase();
    if (origin) headers["X-Event-Origin"] = origin;

    var token = String(clientConfig.readStoredSessionToken() || "").trim();
    if (token) {
      headers.Authorization = "Bearer " + token;
      headers["X-Session-Token"] = token;
    }

    var apiKey = String(clientConfig.getSharedApiKey() || "").trim();
    if (apiKey) headers["X-API-Key"] = apiKey;

    return headers;
  }

  async function apiRequest(method, path, body, eventOrigin, options) {
    var requestOpts = options && typeof options === "object" ? options : {};
    var handleAuthFailure = Object.prototype.hasOwnProperty.call(requestOpts, "handleAuthFailure")
      ? !!requestOpts.handleAuthFailure
      : false;
    var url = getApiBaseUrl() + path;
    var fetchOptions = { method: method, headers: buildApiHeaders(eventOrigin) };

    if (body !== undefined) {
      fetchOptions.headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(body);
    }

    var response;
    try {
      response = await global.fetch(url, fetchOptions);
    } catch (err) {
      clientConfig.onNetworkError("sem conexao com API");
      throw err;
    }

    if (!response.ok) {
      var rawBody = await response.text();
      var parsedBody = null;
      try {
        parsedBody = rawBody ? JSON.parse(rawBody) : null;
      } catch (_err) {
        parsedBody = null;
      }

      var detail = parsedBody && Object.prototype.hasOwnProperty.call(parsedBody, "detail")
        ? parsedBody.detail
        : rawBody;
      var detailMessage = typeof detail === "string"
        ? detail
        : (detail && typeof detail === "object" && detail.message ? String(detail.message) : String(rawBody || ""));

      clientConfig.onHttpError(response.status, detailMessage || "");

      if (response.status === 401 && isApiEnabled() && handleAuthFailure) {
        clientConfig.onAuthFailure();
      }

      var error = new Error(detailMessage || ("HTTP " + String(response.status)));
      error.status = response.status;
      error.payload = parsedBody;
      error.detail = detail;
      throw error;
    }

    var contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("application/json")) return await response.json();
    return null;
  }

  async function apiRequestPublic(method, path, body) {
    var url = getApiBaseUrl() + path;
    var fetchOptions = { method: method, headers: {} };
    if (body !== undefined) {
      fetchOptions.headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(body);
    }

    var response;
    try {
      response = await global.fetch(url, fetchOptions);
    } catch (_err) {
      throw new Error("Sem conexao com API.");
    }

    if (!response.ok) {
      var textBody = await response.text();
      throw new Error("HTTP " + response.status + "::" + textBody);
    }

    var contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("application/json")) return await response.json();
    return null;
  }

  root.apiClient = {
    configure: configure,
    isApiEnabled: isApiEnabled,
    getApiBaseUrl: getApiBaseUrl,
    buildApiHeaders: buildApiHeaders,
    apiRequest: apiRequest,
    apiRequestPublic: apiRequestPublic
  };
})(window);
