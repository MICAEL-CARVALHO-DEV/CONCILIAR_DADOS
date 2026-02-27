import re
from urllib.parse import urlsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://emendas:emendas123@localhost:5432/emendas_db"
    CORS_ORIGINS: str = "http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5501,http://localhost:5501"
    API_AUTH_ENABLED: bool = True
    API_SHARED_KEY: str = "troque-esta-chave"
    JWT_SECRET_KEY: str = "troque-esta-chave-jwt"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 12

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


settings = Settings()
