import re
from urllib.parse import urlsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite+pysqlite:///./test.db"
    DB_AUTO_BOOTSTRAP: bool = True
    ENABLE_DEMO_MODE: bool = True
    CORS_ORIGINS: str = (
        "https://micael-carvalho-dev.github.io,"
        "https://conciliar-dados.pages.dev,"
        "https://homolog-cloudflare.conciliar-dados.pages.dev,"
        "http://127.0.0.1:5500,http://localhost:5500,"
        "http://127.0.0.1:5501,http://localhost:5501"
    )
    # Permite Cloudflare Pages do projeto (prod + previews), GitHub Pages e localhost.
    CORS_ALLOW_ORIGIN_REGEX: str = (
        r"^https://([a-z0-9-]+\.)?conciliar-dados\.pages\.dev$|"
        r"^https://micael-carvalho-dev\.github\.io$|"
        r"^http://(localhost|127\.0\.0\.1)(:\d+)?$"
    )
    API_AUTH_ENABLED: bool = True
    ALLOW_SHARED_KEY_AUTH: bool = False
    API_SHARED_KEY: str = ""
    JWT_SECRET_KEY: str = "dev-local-jwt-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 12
    LOGIN_FAILURE_WINDOW_MINUTES: int = 15
    LOGIN_FAILURE_MAX_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15
    PASSWORD_RESET_TOKEN_MINUTES: int = 30
    PASSWORD_RESET_FRONTEND_URL: str = "http://127.0.0.1:5500/frontend/pages/reset-senha.html"
    PASSWORD_RESET_RETURN_LINK_IN_RESPONSE: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "SEC Emendas"
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False
    GOOGLE_CLIENT_ID: str = ""
    # Lista opcional de audiencias Google aceitas (csv), para transicao entre client IDs.
    # Ex.: GOOGLE_CLIENT_IDS=id-1.apps.googleusercontent.com,id-2.apps.googleusercontent.com
    GOOGLE_CLIENT_IDS: str = (
        "1090925215709-otj49ouef21e8p0vr0nb97rkjfrt4mjc.apps.googleusercontent.com,"
        "1090925215709-mgd525lfv9ams75ncam89jo304dcdq7n.apps.googleusercontent.com,"
        "905274978136-21du34pfsmtec45313ob5kh4tuukap8h.apps.googleusercontent.com"
    )
    GOOGLE_TOKENINFO_URL: str = "https://oauth2.googleapis.com/tokeninfo"
    AI_ORCHESTRATOR_ENABLED: bool = True
    AI_ORCHESTRATOR_TIMEOUT_SECONDS: int = 45
    RENDER_SERVICE_NAME: str = ""
    RENDER_GIT_BRANCH: str = ""
    RENDER_GIT_COMMIT: str = ""
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL_CODEX: str = "gpt-5.1-codex"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_PRO: str = "gemini-2.5-pro"
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL_CLAUDE: str = "claude-3-5-sonnet-latest"
    GROQ_API_KEY: str = ""
    GROQ_MODEL_FREE: str = "llama-3.3-70b-versatile"
    CLOUDFLARE_API_TOKEN: str = ""
    CLOUDFLARE_ACCOUNT_ID: str = ""
    CLOUDFLARE_MODEL_FREE: str = "@cf/meta/llama-3.1-8b-instruct"
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL_FREE: str = "llama3.2:3b"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8-sig",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        raw = (self.CORS_ORIGINS or "").strip()
        if not raw:
            return []

        # Aceita origens separadas por virgula, quebra de linha, ponto-e-virgula ou espacos.
        parts = re.split(r"[,\r\n\t; ]+", raw)
        origins: list[str] = []
        seen: set[str] = set()

        for item in parts:
            candidate = (item or "").strip().strip("'\"").rstrip("/")
            if not candidate or candidate.lower() == "null":
                continue

            # Se vier URL completa (com path), mantem apenas a origin.
            if "://" in candidate:
                parsed = urlsplit(candidate)
                if parsed.scheme and parsed.netloc:
                    candidate = f"{parsed.scheme}://{parsed.netloc}"

            if candidate and candidate not in seen:
                seen.add(candidate)
                origins.append(candidate)

        return origins

    @property
    def app_env_normalized(self) -> str:
        value = (self.APP_ENV or "").strip().lower()
        if value in {"prod", "production"}:
            return "production"
        if value in {"test", "testing"}:
            return "test"
        if value in {"stage", "staging"}:
            return "staging"
        if value in {"dev", "development", "local"}:
            return "local"
        return value or "local"

    @property
    def is_dev_environment(self) -> bool:
        return self.app_env_normalized in {"local", "test"}

    @property
    def is_production(self) -> bool:
        return self.app_env_normalized == "production"

    @property
    def db_auto_bootstrap_enabled(self) -> bool:
        return bool(self.DB_AUTO_BOOTSTRAP)

    @property
    def demo_mode_enabled(self) -> bool:
        return bool(self.ENABLE_DEMO_MODE)

    @property
    def database_backend(self) -> str:
        raw = (self.DATABASE_URL or "").strip().lower()
        if raw.startswith("postgresql"):
            return "postgresql"
        if raw.startswith("sqlite"):
            return "sqlite"
        return raw.split(":", 1)[0].split("+", 1)[0] or "unknown"

    @property
    def google_client_ids_list(self) -> list[str]:
        raw_items = [self.GOOGLE_CLIENT_ID, self.GOOGLE_CLIENT_IDS]
        joined = ",".join([str(item or "") for item in raw_items])
        parts = re.split(r"[,\r\n\t; ]+", joined)
        client_ids: list[str] = []
        seen: set[str] = set()
        for item in parts:
            candidate = (item or "").strip().strip("'\"")
            if not candidate:
                continue
            if candidate in seen:
                continue
            seen.add(candidate)
            client_ids.append(candidate)
        return client_ids

    @property
    def shared_key_auth_enabled(self) -> bool:
        return bool(self.API_AUTH_ENABLED and self.ALLOW_SHARED_KEY_AUTH and (self.API_SHARED_KEY or "").strip())

    @property
    def login_failure_window_minutes(self) -> int:
        return max(int(self.LOGIN_FAILURE_WINDOW_MINUTES or 15), 1)

    @property
    def login_failure_max_attempts(self) -> int:
        return max(int(self.LOGIN_FAILURE_MAX_ATTEMPTS or 5), 1)

    @property
    def login_lockout_minutes(self) -> int:
        return max(int(self.LOGIN_LOCKOUT_MINUTES or 15), 1)

    @property
    def password_reset_token_minutes(self) -> int:
        return max(int(self.PASSWORD_RESET_TOKEN_MINUTES or 30), 1)

    @property
    def legacy_import_sync_enabled(self) -> bool:
        return not self.is_production

    @property
    def uses_default_api_shared_key(self) -> bool:
        return (self.API_SHARED_KEY or "").strip().lower() in {"", "troque-esta-chave", "changeme", "change-me"}

    @property
    def uses_default_jwt_secret(self) -> bool:
        return (self.JWT_SECRET_KEY or "").strip().lower() in {
            "",
            "dev-local-jwt-secret-change-me",
            "troque-esta-chave-jwt",
            "changeme",
            "change-me",
        }

    @property
    def cors_has_localhost(self) -> bool:
        localhost_hosts = {"localhost", "127.0.0.1"}
        for origin in self.cors_origins_list:
            parsed = urlsplit(origin)
            host = (parsed.hostname or "").strip().lower()
            if host in localhost_hosts:
                return True
        return False

    @property
    def cors_has_https_origin(self) -> bool:
        for origin in self.cors_origins_list:
            parsed = urlsplit(origin)
            if (parsed.scheme or "").strip().lower() == "https":
                return True
        return False

    @property
    def password_reset_frontend_uses_https(self) -> bool:
        parsed = urlsplit((self.PASSWORD_RESET_FRONTEND_URL or "").strip())
        return (parsed.scheme or "").strip().lower() == "https"

    @property
    def password_reset_frontend_is_local(self) -> bool:
        parsed = urlsplit((self.PASSWORD_RESET_FRONTEND_URL or "").strip())
        host = (parsed.hostname or "").strip().lower()
        return host in {"localhost", "127.0.0.1"}

    @property
    def production_runtime_warnings(self) -> list[str]:
        warnings: list[str] = []
        if not self.is_production:
            return warnings

        if self.database_backend != "postgresql":
            warnings.append("DATABASE_URL de producao deve usar PostgreSQL.")
        if self.db_auto_bootstrap_enabled:
            warnings.append("DB_AUTO_BOOTSTRAP deve ficar desligado em producao.")
        if self.demo_mode_enabled:
            warnings.append("ENABLE_DEMO_MODE deve ficar desligado em producao.")
        if self.shared_key_auth_enabled and self.uses_default_api_shared_key:
            warnings.append("API_SHARED_KEY ainda usa valor padrao.")
        if self.uses_default_jwt_secret:
            warnings.append("JWT_SECRET_KEY ainda usa valor padrao.")
        if self.cors_has_localhost:
            warnings.append("CORS de producao ainda inclui localhost/127.0.0.1.")
        if not self.cors_has_https_origin:
            warnings.append("CORS de producao nao possui origem HTTPS oficial.")
        if self.password_reset_frontend_is_local:
            warnings.append("PASSWORD_RESET_FRONTEND_URL ainda aponta para ambiente local.")
        if not self.password_reset_frontend_uses_https:
            warnings.append("PASSWORD_RESET_FRONTEND_URL de producao deveria usar HTTPS.")
        return warnings

    @property
    def production_ready(self) -> bool:
        return bool(
            self.is_production
            and self.database_backend == "postgresql"
            and not self.db_auto_bootstrap_enabled
            and not self.demo_mode_enabled
            and not self.production_runtime_warnings
        )

    @property
    def deployment_metadata(self) -> dict:
        service = (self.RENDER_SERVICE_NAME or "").strip()
        branch = (self.RENDER_GIT_BRANCH or "").strip()
        commit = (self.RENDER_GIT_COMMIT or "").strip()
        return {
            "service": service,
            "branch": branch,
            "commit": commit,
        }


settings = Settings()
