from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .settings import settings


def _validated_database_url() -> str:
    raw = (settings.DATABASE_URL or "").strip()
    if not raw:
        raise RuntimeError("DATABASE_URL vazia; configure o ambiente antes de iniciar o backend")
    return raw


engine = create_engine(_validated_database_url(), pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Base declarativa compartilhada do SQLAlchemy."""


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
