window.SEC_APP_CONFIG = Object.assign({}, window.SEC_APP_CONFIG || {}, {
  // URL publica da API em producao.
  // Se voce trocar o nome do servico no Render, ajuste esta URL.
  API_BASE_URL: "https://sec-emendas-api.onrender.com",
  // Cole aqui o client id do Google quando ativar a etapa 6.
  GOOGLE_CLIENT_ID: "905274978136-21du34pfsmtec45313ob5kh4tuukap8h.apps.googleusercontent.com",
  API_BASE_URL_BY_HOST: Object.assign(
    {},
    (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.API_BASE_URL_BY_HOST) || {},
    {
      // URL do seu Pages em producao.
      "micael-carvalho-dev.github.io": "https://sec-emendas-api.onrender.com"
    }
  ),
  GOOGLE_CLIENT_ID_BY_HOST: Object.assign(
    {},
    (window.SEC_APP_CONFIG && window.SEC_APP_CONFIG.GOOGLE_CLIENT_ID_BY_HOST) || {},
    {
      "micael-carvalho-dev.github.io": "905274978136-21du34pfsmtec45313ob5kh4tuukap8h.apps.googleusercontent.com"
    }
  )
});
