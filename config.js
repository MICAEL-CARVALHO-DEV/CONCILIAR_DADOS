window.SEC_APP_CONFIG = Object.assign(
  {
    // Base padrao (pode ficar vazio para usar mapeamento por host)
    API_BASE_URL: "",
    // OAuth Google (deixe vazio ate configurar o client id)
    GOOGLE_CLIENT_ID: "",
    // Mapeamento automatico por hostname
    API_BASE_URL_BY_HOST: {
      "localhost": "http://localhost:8000",
      "127.0.0.1": "http://localhost:8000"
    },
    GOOGLE_CLIENT_ID_BY_HOST: {}
  },
  window.SEC_APP_CONFIG || {}
);
