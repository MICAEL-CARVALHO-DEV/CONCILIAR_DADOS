import re
from urllib.parse import urlsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite+pysqlite:///./test.db"
    CORS_ORIGINS: str = (
        "https://micael-carvalho-dev.github.io,"
        "http://127.0.0.1:5500,http://localhost:5500,"
        "http://127.0.0.1:5501,http://localhost:5501"
    )
    CORS_ALLOW_ORIGIN_REGEX: str = r"^http://(localhost|127\.0\.0\.1)(:\d+)?$"
    API_AUTH_ENABLED: bool = True
    ALLOW_SHARED_KEY_AUTH: bool = False
    API_SHARED_KEY: str = ""
    JWT_SECRET_KEY: str = "dev-local-jwt-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 12
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_TOKENINFO_URL: str = "https://oauth2.googleapis.com/tokeninfo"

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
    def shared_key_auth_enabled(self) -> bool:
        return bool(self.API_AUTH_ENABLED and self.ALLOW_SHARED_KEY_AUTH and (self.API_SHARED_KEY or "").strip())


settings = Settings()
