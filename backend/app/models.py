from __future__ import annotations

from datetime import datetime
from typing import Optional

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
    ultimo_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    sessoes: Mapped[list["UsuarioSessao"]] = relationship(back_populates="usuario", cascade="all, delete-orphan")


class UsuarioSessao(Base):
    __tablename__ = "usuario_sessoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

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

    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("emendas.id"), index=True, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    parent: Mapped[Optional["Emenda"]] = relationship("Emenda", remote_side="Emenda.id", back_populates="children")
    children: Mapped[list["Emenda"]] = relationship("Emenda", back_populates="parent")
    historicos: Mapped[list["Historico"]] = relationship(back_populates="emenda", cascade="all, delete-orphan")


class ImportLote(Base):
    __tablename__ = "lotes_importacao"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    arquivo_nome: Mapped[str] = mapped_column(String(255), nullable=False)
    arquivo_hash: Mapped[str] = mapped_column(String(128), default="", nullable=False)
    linhas_lidas: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    linhas_validas: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    linhas_ignoradas: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    registros_criados: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    registros_atualizados: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sem_alteracao: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duplicidade_id: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duplicidade_ref: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duplicidade_arquivo: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    conflito_id_ref: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    abas_lidas: Mapped[str] = mapped_column(Text, default="", nullable=False)
    observacao: Mapped[str] = mapped_column(Text, default="", nullable=False)
    origem_evento: Mapped[str] = mapped_column(String(20), default="IMPORT", nullable=False)
    usuario_id: Mapped[Optional[int]] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    usuario_nome: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    setor: Mapped[str] = mapped_column(String(40), default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ImportLinha(Base):
    __tablename__ = "import_linhas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lote_id: Mapped[int] = mapped_column(ForeignKey("lotes_importacao.id"), index=True, nullable=False)
    ordem: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sheet_name: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    row_number: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status_linha: Mapped[str] = mapped_column(String(30), default="UNCHANGED", nullable=False)
    id_interno: Mapped[str] = mapped_column(String(60), default="", nullable=False)
    ref_key: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    mensagem: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ExportLog(Base):
    __tablename__ = "export_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    formato: Mapped[str] = mapped_column(String(10), nullable=False)
    arquivo_nome: Mapped[str] = mapped_column(String(255), nullable=False)
    quantidade_registros: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    quantidade_eventos: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    filtros_json: Mapped[str] = mapped_column(Text, default="", nullable=False)
    modo_headers: Mapped[str] = mapped_column(String(30), default="normalizados", nullable=False)
    escopo_exportacao: Mapped[str] = mapped_column(String(20), default="ATUAIS", nullable=False)
    round_trip_ok: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    round_trip_issues: Mapped[str] = mapped_column(Text, default="", nullable=False)
    origem_evento: Mapped[str] = mapped_column(String(20), default="EXPORT", nullable=False)
    usuario_id: Mapped[Optional[int]] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    usuario_nome: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    setor: Mapped[str] = mapped_column(String(40), default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Historico(Base):
    __tablename__ = "historico"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    emenda_id: Mapped[int] = mapped_column(ForeignKey("emendas.id"), index=True, nullable=False)
    usuario_id: Mapped[Optional[int]] = mapped_column(ForeignKey("usuarios.id"), nullable=True)

    usuario_nome: Mapped[str] = mapped_column(String(120), default="")
    setor: Mapped[str] = mapped_column(String(40), default="")
    tipo_evento: Mapped[str] = mapped_column(String(40), nullable=False)
    origem_evento: Mapped[str] = mapped_column(String(20), default="API", nullable=False)
    campo_alterado: Mapped[str] = mapped_column(String(120), default="")
    valor_antigo: Mapped[str] = mapped_column(Text, default="")
    valor_novo: Mapped[str] = mapped_column(Text, default="")
    motivo: Mapped[str] = mapped_column(Text, default="")
    data_hora: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    emenda: Mapped["Emenda"] = relationship(back_populates="historicos")

