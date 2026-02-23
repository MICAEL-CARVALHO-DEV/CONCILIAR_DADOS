from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    setor: Mapped[str] = mapped_column(String(40), nullable=False)
    perfil: Mapped[str] = mapped_column(String(40), nullable=False)
    senha_salt: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ultimo_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    sessoes: Mapped[list["UsuarioSessao"]] = relationship(back_populates="usuario", cascade="all, delete-orphan")


class UsuarioSessao(Base):
    __tablename__ = "usuario_sessoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    usuario: Mapped["Usuario"] = relationship(back_populates="sessoes")


class Emenda(Base):
    __tablename__ = "emendas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_interno: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    ano: Mapped[int] = mapped_column(Integer, nullable=False)
    identificacao: Mapped[str] = mapped_column(String(255), nullable=False)
    cod_subfonte: Mapped[str] = mapped_column(String(40), default="")
    deputado: Mapped[str] = mapped_column(String(120), default="")
    cod_uo: Mapped[str] = mapped_column(String(40), default="")
    sigla_uo: Mapped[str] = mapped_column(String(40), default="")
    cod_orgao: Mapped[str] = mapped_column(String(40), default="")
    cod_acao: Mapped[str] = mapped_column(String(40), default="")
    descricao_acao: Mapped[str] = mapped_column(Text, default="")
    municipio: Mapped[str] = mapped_column(String(120), default="")
    valor_inicial: Mapped[float] = mapped_column(Numeric(16, 2), default=0)
    valor_atual: Mapped[float] = mapped_column(Numeric(16, 2), default=0)
    processo_sei: Mapped[str] = mapped_column(String(120), default="")
    status_oficial: Mapped[str] = mapped_column(String(60), default="Recebido", nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    historicos: Mapped[list["Historico"]] = relationship(back_populates="emenda", cascade="all, delete-orphan")


class Historico(Base):
    __tablename__ = "historico"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    emenda_id: Mapped[int] = mapped_column(ForeignKey("emendas.id"), index=True, nullable=False)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)

    usuario_nome: Mapped[str] = mapped_column(String(120), default="")
    setor: Mapped[str] = mapped_column(String(40), default="")
    tipo_evento: Mapped[str] = mapped_column(String(40), nullable=False)
    campo_alterado: Mapped[str] = mapped_column(String(120), default="")
    valor_antigo: Mapped[str] = mapped_column(Text, default="")
    valor_novo: Mapped[str] = mapped_column(Text, default="")
    motivo: Mapped[str] = mapped_column(Text, default="")
    data_hora: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    emenda: Mapped["Emenda"] = relationship(back_populates="historicos")
