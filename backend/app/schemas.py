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

EVENT_TYPES = {
    "IMPORT",
    "OFFICIAL_STATUS",
    "MARK_STATUS",
    "EDIT_FIELD",
    "NOTE",
}


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


class EmendaOut(BaseModel):
    id: int
    id_interno: str
    ano: int
    identificacao: str
    status_oficial: str
    updated_at: datetime

    class Config:
        from_attributes = True
