window.SEC_APP_CONFIG = Object.assign({}, window.SEC_APP_CONFIG || {}, {
  // URL publica da API no Render
  // Exemplo: "https://sec-emendas-api.onrender.com"
  API_BASE_URL: "",
  API_BASE_URL_BY_HOST: Object.assign(
    {},
    (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.API_BASE_URL_BY_HOST) || {},
    {
      // URL do seu Pages em producao
      "micael-carvalho-dev.github.io": ""
    }
  )
});
