import re

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

        # Aceita origens separadas por virgula, quebra de linha ou espacos.
        parts = re.split(r"[,\r\n\t ]+", raw)
        return [x.strip() for x in parts if x.strip() and x.strip().lower() != "null"]


settings = Settings()
