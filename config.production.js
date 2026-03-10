(() => {
  // OAuth producao (GitHub Pages).
  const GOOGLE_CLIENT_ID_PROD = "905274978136-21du34pfsmtec45313ob5kh4tuukap8h.apps.googleusercontent.com";

  // OAuth local (localhost/127). Mantido vazio para evitar erro de origem
  // nao autorizada durante homologacao local.
  const GOOGLE_CLIENT_ID_LOCAL = "";


  window.SEC_APP_CONFIG = Object.assign({}, window.SEC_APP_CONFIG || {}, {
    // URL publica da API em producao.
    API_BASE_URL: "https://sec-emendas-api.onrender.com",
    // Mantem a LOA vazia/local ate o inicio oficial da beta.
    LOA_PRE_BETA_LOCKED: true,
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
    GOOGLE_CLIENT_ID_BY_HOST: Object.assign(
      {},
      (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.GOOGLE_CLIENT_ID_BY_HOST) || {},
      {
        "micael-carvalho-dev.github.io": GOOGLE_CLIENT_ID_PROD,
        "localhost": GOOGLE_CLIENT_ID_LOCAL,
        "127.0.0.1": GOOGLE_CLIENT_ID_LOCAL
      }
    )
  });
})();
