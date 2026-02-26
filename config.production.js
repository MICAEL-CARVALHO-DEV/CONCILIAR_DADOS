window.SEC_APP_CONFIG = Object.assign({}, window.SEC_APP_CONFIG || {}, {
  // URL publica da API em producao.
  // Se voce trocar o nome do servico no Render, ajuste esta URL.
  API_BASE_URL: "https://sec-emendas-api.onrender.com",
  API_BASE_URL_BY_HOST: Object.assign(
    {},
    (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.API_BASE_URL_BY_HOST) || {},
    {
      // URL do seu Pages em producao.
      "micael-carvalho-dev.github.io": "https://sec-emendas-api.onrender.com"
    }
  )
});
