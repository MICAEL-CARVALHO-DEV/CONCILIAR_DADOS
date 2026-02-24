from datetime import datetime

from pydantic import BaseModel, Field, field_validator


ROLES = ["APG", "SUPERVISAO", "CONTABIL", "POWERBI", "PROGRAMADOR"]
ROLE_SET = set(ROLES)

STATUS = {
    "Recebido",
    "Em analise",
    "Pendente",
    "Aguardando execucao",
    "Em execucao",
    "Aprovado",
    "Concluido",
    "Cancelado",
}

EVENT_ORIGINS = {"UI", "API", "IMPORT", "EXPORT"}

IMPORT_LINE_STATUS = {"CREATED", "UPDATED", "UNCHANGED", "SKIPPED", "CONFLICT"}

EVENT_TYPES = {
    "IMPORT",
    "OFFICIAL_STATUS",
    "MARK_STATUS",
    "EDIT_FIELD",
    "NOTE",
    "VERSIONAR",
}

EXPORT_SCOPES = {"ATUAIS", "HISTORICO", "PERSONALIZADO"}


class UserOut(BaseModel):
    id: int
    nome: str
    perfil: str


class AuthRegisterIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    perfil: str
    senha: str = Field(min_length=4, max_length=120)

    @field_validator("perfil")
    @classmethod
    def validate_role(cls, value: str) -> str:
        v = (value or "").strip().upper()
        if v not in ROLE_SET:
            raise ValueError("perfil invalido")
        return v


class AuthLoginIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    senha: str = Field(min_length=4, max_length=120)


class AuthOut(BaseModel):
    token: str
    token_type: str = "bearer"
    usuario: UserOut


class EmendaCreate(BaseModel):
    id_interno: str
    ano: int
    identificacao: str
    status_oficial: str = "Recebido"

    @field_validator("status_oficial")
    @classmethod
    def validate_status(cls, value: str) -> str:
        v = (value or "").strip()
        if v not in STATUS:
            raise ValueError("status_oficial invalido")
        return v


class EmendaStatusUpdate(BaseModel):
    novo_status: str
    motivo: str

    @field_validator("novo_status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        v = (value or "").strip()
        if v not in STATUS:
            raise ValueError("novo_status invalido")
        return v

    @field_validator("motivo")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        v = (value or "").strip()
        if not v:
            raise ValueError("motivo obrigatorio")
        return v


class EventoCreate(BaseModel):
    tipo_evento: str
    origem_evento: str = ""
    campo_alterado: str = ""
    valor_antigo: str = ""
    valor_novo: str = ""
    motivo: str = ""

    @field_validator("tipo_evento")
    @classmethod
    def validate_event_type(cls, value: str) -> str:
        v = (value or "").strip().upper()
        if v not in EVENT_TYPES:
            raise ValueError("tipo_evento invalido")
        return v

    @field_validator("origem_evento")
    @classmethod
    def validate_event_origin(cls, value: str) -> str:
        v = (value or "").strip().upper()
        if not v:
            return ""
        if v not in EVENT_ORIGINS:
            raise ValueError("origem_evento invalida")
        return v


class EmendaVersionarIn(BaseModel):
    motivo: str = "Nova versao"
    ano: int | None = None
    identificacao: str | None = None
    municipio: str | None = None
    deputado: str | None = None
    valor_inicial: float | None = None
    valor_atual: float | None = None
    processo_sei: str | None = None


class EmendaOut(BaseModel):
    id: int
    id_interno: str
    ano: int
    identificacao: str
    status_oficial: str
    parent_id: int | None = None
    version: int = 1
    is_current: bool = True
    updated_at: datetime

    class Config:
        from_attributes = True

class ImportLoteCreate(BaseModel):
    arquivo_nome: str = Field(min_length=1, max_length=255)
    arquivo_hash: str = Field(default="", max_length=128)
    linhas_lidas: int = 0
    linhas_validas: int = 0
    linhas_ignoradas: int = 0
    registros_criados: int = 0
    registros_atualizados: int = 0
    sem_alteracao: int = 0
    duplicidade_id: int = 0
    duplicidade_ref: int = 0
    duplicidade_arquivo: int = 0
    conflito_id_ref: int = 0
    abas_lidas: list[str] = Field(default_factory=list)
    observacao: str = ""
    origem_evento: str = "IMPORT"

    @field_validator("origem_evento")
    @classmethod
    def validate_import_origin(cls, value: str) -> str:
        v = (value or "IMPORT").strip().upper()
        if v not in EVENT_ORIGINS:
            raise ValueError("origem_evento invalida")
        return v


class ExportLogCreate(BaseModel):
    formato: str = Field(min_length=3, max_length=10)
    arquivo_nome: str = Field(min_length=1, max_length=255)
    quantidade_registros: int = 0
    quantidade_eventos: int = 0
    filtros_json: str = ""
    modo_headers: str = "normalizados"
    escopo_exportacao: str = "ATUAIS"
    round_trip_ok: bool | None = None
    round_trip_issues: list[str] = Field(default_factory=list)
    origem_evento: str = "EXPORT"

    @field_validator("formato")
    @classmethod
    def validate_formato(cls, value: str) -> str:
        v = (value or "").strip().upper()
        if v not in {"CSV", "XLSX"}:
            raise ValueError("formato invalido")
        return v

    @field_validator("origem_evento")
    @classmethod
    def validate_export_origin(cls, value: str) -> str:
        v = (value or "EXPORT").strip().upper()
        if v not in EVENT_ORIGINS:
            raise ValueError("origem_evento invalida")
        return v

    @field_validator("escopo_exportacao")
    @classmethod
    def validate_export_scope(cls, value: str) -> str:
        v = (value or "ATUAIS").strip().upper()
        if v not in EXPORT_SCOPES:
            raise ValueError("escopo_exportacao invalido")
        return v


class ImportLoteOut(BaseModel):
    id: int
    arquivo_nome: str
    linhas_lidas: int
    linhas_validas: int
    linhas_ignoradas: int
    created_at: datetime
    usuario_nome: str
    setor: str

    class Config:
        from_attributes = True


class ExportLogOut(BaseModel):
    id: int
    formato: str
    arquivo_nome: str
    quantidade_registros: int
    quantidade_eventos: int
    escopo_exportacao: str
    created_at: datetime
    usuario_nome: str
    setor: str

    class Config:
        from_attributes = True


class ImportLinhaIn(BaseModel):
    ordem: int = 0
    sheet_name: str = ""
    row_number: int = 0
    status_linha: str = "UNCHANGED"
    id_interno: str = ""
    ref_key: str = ""
    mensagem: str = ""

    @field_validator("status_linha")
    @classmethod
    def validate_line_status(cls, value: str) -> str:
        v = (value or "UNCHANGED").strip().upper()
        if v not in IMPORT_LINE_STATUS:
            raise ValueError("status_linha invalido")
        return v


class ImportLinhasBulkCreate(BaseModel):
    lote_id: int
    linhas: list[ImportLinhaIn] = Field(default_factory=list)


class ImportLinhaOut(BaseModel):
    id: int
    lote_id: int
    ordem: int
    sheet_name: str
    row_number: int
    status_linha: str
    id_interno: str
    ref_key: str
    mensagem: str
    created_at: datetime

    class Config:
        from_attributes = True






