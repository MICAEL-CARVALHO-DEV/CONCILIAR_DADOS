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
        return (self.APP_ENV or "").strip().lower()

    @property
    def is_dev_environment(self) -> bool:
        return self.app_env_normalized in {"dev", "development", "local", "test", "testing"}

    @property
    def is_production(self) -> bool:
        return self.app_env_normalized in {"prod", "production"}

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


settings = Settings()
