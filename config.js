window.SEC_APP_CONFIG = Object.assign(
  {
    // Base padrao (pode ficar vazio para usar mapeamento por host)
    API_BASE_URL: "",
    // Mapeamento automatico por hostname
    API_BASE_URL_BY_HOST: {
      "localhost": "http://localhost:8000",
      "127.0.0.1": "http://localhost:8000"
    }
  },
  window.SEC_APP_CONFIG || {}
);
