window.SEC_APP_CONFIG = Object.assign(
  {
    // Base padrao (pode ficar vazio para usar mapeamento por host)
    API_BASE_URL: "",
    // LOA operacional liberada.
    LOA_PRE_BETA_LOCKED: false,
    // OAuth Google (deixe vazio ate configurar o client id)
    GOOGLE_CLIENT_ID: "",
    // Mapeamento automatico por hostname
    API_BASE_URL_BY_HOST: {
      "localhost": "http://127.0.0.1:8000",
      "127.0.0.1": "http://127.0.0.1:8000"
    },
    // Mapeamento por sufixo de host (ex.: ".pages.dev").
    API_BASE_URL_BY_HOST_SUFFIX: {},
    API_BASE_URL_BY_HOST_SUFFIX_MAP: {},
    GOOGLE_CLIENT_ID_BY_HOST: {},
    // Mapeamento por sufixo de host para OAuth (ex.: ".pages.dev").
    GOOGLE_CLIENT_ID_BY_HOST_SUFFIX: {},
    GOOGLE_CLIENT_ID_BY_HOST_SUFFIX_MAP: {}
  },
  window.SEC_APP_CONFIG || {}
);
