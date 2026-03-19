(() => {
  // OAuth producao/homolog (Cloudflare Pages + GitHub Pages).
  // Mantemos um unico client id para os hosts oficiais do projeto.
  const GOOGLE_CLIENT_ID_PROD = "1090925215709-otj49ouef21e8p0vr0nb97rkjfrt4mjc.apps.googleusercontent.com";

  // OAuth local (localhost/127). Mantido vazio para evitar erro de origem
  // nao autorizada durante homologacao local.
  const GOOGLE_CLIENT_ID_LOCAL = "";


  window.SEC_APP_CONFIG = Object.assign({}, window.SEC_APP_CONFIG || {}, {
    // URL publica da API em producao.
    API_BASE_URL: "https://sec-emendas-api.onrender.com",
    APP_ENV: "production",
    ENABLE_DEMO_MODE: false,
    // LOA operacional liberada.
    LOA_PRE_BETA_LOCKED: false,
    // Fallback global (usado em hosts sem mapeamento especifico).
    GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID_PROD,
    API_BASE_URL_BY_HOST: Object.assign(
      {},
      (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.API_BASE_URL_BY_HOST) || {},
      {
        "micael-carvalho-dev.github.io": "https://sec-emendas-api.onrender.com",
        "localhost": "http://127.0.0.1:8000",
        "127.0.0.1": "http://127.0.0.1:8000"
      }
    ),
    API_BASE_URL_BY_HOST_SUFFIX: Object.assign(
      {},
      (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.API_BASE_URL_BY_HOST_SUFFIX) || {},
      (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.API_BASE_URL_BY_HOST_SUFFIX_MAP) || {},
      {
        ".pages.dev": "https://sec-emendas-api.onrender.com"
      }
    ),
    API_BASE_URL_BY_HOST_SUFFIX_MAP: Object.assign(
      {},
      (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.API_BASE_URL_BY_HOST_SUFFIX_MAP) || {},
      (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.API_BASE_URL_BY_HOST_SUFFIX) || {},
      {
        ".pages.dev": "https://sec-emendas-api.onrender.com"
      }
    ),
    GOOGLE_CLIENT_ID_BY_HOST: Object.assign(
      {},
      (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.GOOGLE_CLIENT_ID_BY_HOST) || {},
      {
        "micael-carvalho-dev.github.io": GOOGLE_CLIENT_ID_PROD,
        "localhost": GOOGLE_CLIENT_ID_LOCAL,
        "127.0.0.1": GOOGLE_CLIENT_ID_LOCAL
      }
    ),
    GOOGLE_CLIENT_ID_BY_HOST_SUFFIX: Object.assign(
      {},
      (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.GOOGLE_CLIENT_ID_BY_HOST_SUFFIX) || {},
      (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.GOOGLE_CLIENT_ID_BY_HOST_SUFFIX_MAP) || {},
      {
        ".pages.dev": GOOGLE_CLIENT_ID_PROD
      }
    ),
    GOOGLE_CLIENT_ID_BY_HOST_SUFFIX_MAP: Object.assign(
      {},
      (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.GOOGLE_CLIENT_ID_BY_HOST_SUFFIX_MAP) || {},
      (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.GOOGLE_CLIENT_ID_BY_HOST_SUFFIX) || {},
      {
        ".pages.dev": GOOGLE_CLIENT_ID_PROD
      }
    )
  });
})();
