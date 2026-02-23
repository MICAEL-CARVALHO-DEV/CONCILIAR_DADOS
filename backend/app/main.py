from datetime import datetime, timedelta
import hashlib
import os
import secrets
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, inspect, text
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from .models import Emenda, Historico, Usuario, UsuarioSessao
from .schemas import (
    AuthLoginIn,
    AuthOut,
    AuthRegisterIn,
    EmendaCreate,
    EmendaOut,
    EmendaStatusUpdate,
    EventoCreate,
    ROLES,
    UserOut,
)
from .settings import settings

app = FastAPI(title="API Emendas", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_ROLES = set(ROLES)
MANAGER_ROLES = {"APG", "SUPERVISAO", "PROGRAMADOR"}
SESSION_HOURS = 12


def _hash_text(value: str) -> str:
    return hashlib.sha256((value or "").encode("utf-8")).hexdigest()


def _hash_password(password: str, salt_hex: str | None = None) -> tuple[str, str]:
    salt = bytes.fromhex(salt_hex) if salt_hex else os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return salt.hex(), digest.hex()


def _verify_password(password: str, salt_hex: str, expected_hash: str) -> bool:
    _salt, calc_hash = _hash_password(password, salt_hex)
    return secrets.compare_digest(calc_hash, expected_hash)


def _create_session(db: Session, user: Usuario) -> str:
    token_plain = secrets.token_urlsafe(32)
    token_hash = _hash_text(token_plain)
    now = datetime.utcnow()

    sessao = UsuarioSessao(
        usuario_id=user.id,
        token_hash=token_hash,
        created_at=now,
        expires_at=now + timedelta(hours=SESSION_HOURS),
    )
    db.add(sessao)
    user.ultimo_login = now
    db.commit()
    return token_plain


def _normalize_role(role: str) -> str:
    value = (role or "").strip().upper()
    if value not in ALLOWED_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="setor invalido")
    return value


def _actor_from_headers(
    x_session_token: Annotated[str | None, Header(alias="X-Session-Token")] = None,
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
    x_user_name: Annotated[str | None, Header(alias="X-User-Name")] = None,
    x_user_role: Annotated[str | None, Header(alias="X-User-Role")] = None,
    db: Session = Depends(get_db),
) -> dict:
    if not settings.API_AUTH_ENABLED:
        name = (x_user_name or "sistema").strip() or "sistema"
        role = _normalize_role(x_user_role or "PROGRAMADOR")
        return {"id": None, "name": name, "role": role, "session_token": None}

    token = (x_session_token or "").strip()
    if token:
        token_hash = _hash_text(token)
        sessao = (
            db.query(UsuarioSessao)
            .join(Usuario, Usuario.id == UsuarioSessao.usuario_id)
            .filter(
                UsuarioSessao.token_hash == token_hash,
                UsuarioSessao.revoked_at.is_(None),
                UsuarioSessao.expires_at > datetime.utcnow(),
                Usuario.ativo.is_(True),
            )
            .first()
        )
        if sessao:
            return {
                "id": sessao.usuario.id,
                "name": sessao.usuario.nome,
                "role": sessao.usuario.perfil,
                "session_token": token,
            }

    # Compatibilidade para integracao tecnica via chave compartilhada
    if x_api_key and x_api_key == settings.API_SHARED_KEY:
        name = (x_user_name or "").strip()
        role = (x_user_role or "").strip().upper()
        if name and role in ALLOWED_ROLES:
            return {"id": None, "name": name, "role": role, "session_token": None}

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="nao autenticado")


def _require_manager(actor: dict = Depends(_actor_from_headers)) -> dict:
    if actor["role"] not in MANAGER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="perfil sem permissao")
    return actor


def _ensure_legacy_schema() -> None:
    insp = inspect(engine)
    tables = set(insp.get_table_names())
    if "usuarios" not in tables:
        return

    cols = {c["name"] for c in insp.get_columns("usuarios")}
    statements = []
    if "senha_salt" not in cols:
        statements.append("ALTER TABLE usuarios ADD COLUMN senha_salt VARCHAR(255) NOT NULL DEFAULT ''")
    if "senha_hash" not in cols:
        statements.append("ALTER TABLE usuarios ADD COLUMN senha_hash VARCHAR(255) NOT NULL DEFAULT ''")
    if "ativo" not in cols:
        statements.append("ALTER TABLE usuarios ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT 1")
    if "ultimo_login" not in cols:
        statements.append("ALTER TABLE usuarios ADD COLUMN ultimo_login DATETIME")

    if statements:
        with engine.begin() as conn:
            for st in statements:
                conn.execute(text(st))


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_legacy_schema()


@app.get("/health")
def health() -> dict:
    return {"ok": True, "auth_enabled": settings.API_AUTH_ENABLED, "roles": ROLES}


@app.get("/roles")
def roles() -> dict:
    return {"roles": ROLES}


@app.post("/auth/register", response_model=AuthOut)
def auth_register(payload: AuthRegisterIn, db: Session = Depends(get_db)):
    nome = payload.nome.strip()
    exists = db.query(Usuario).filter(func.lower(Usuario.nome) == nome.lower()).first()
    if exists:
        raise HTTPException(status_code=409, detail="usuario ja existe")

    salt, pwd_hash = _hash_password(payload.senha)
    user = Usuario(
        nome=nome,
        setor=payload.perfil,
        perfil=payload.perfil,
        senha_salt=salt,
        senha_hash=pwd_hash,
        ativo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = _create_session(db, user)
    return {
        "token": token,
        "usuario": {"id": user.id, "nome": user.nome, "perfil": user.perfil},
    }


@app.post("/auth/login", response_model=AuthOut)
def auth_login(payload: AuthLoginIn, db: Session = Depends(get_db)):
    nome = payload.nome.strip()
    user = db.query(Usuario).filter(func.lower(Usuario.nome) == nome.lower()).first()
    if not user or not user.ativo:
        raise HTTPException(status_code=401, detail="credenciais invalidas")

    if not user.senha_salt or not user.senha_hash:
        raise HTTPException(status_code=401, detail="credenciais invalidas")

    if not _verify_password(payload.senha, user.senha_salt, user.senha_hash):
        raise HTTPException(status_code=401, detail="credenciais invalidas")

    token = _create_session(db, user)
    return {
        "token": token,
        "usuario": {"id": user.id, "nome": user.nome, "perfil": user.perfil},
    }


@app.get("/auth/me", response_model=UserOut)
def auth_me(actor: dict = Depends(_actor_from_headers)):
    if actor["id"] is None:
        return {"id": 0, "nome": actor["name"], "perfil": actor["role"]}
    return {"id": actor["id"], "nome": actor["name"], "perfil": actor["role"]}


@app.post("/auth/logout")
def auth_logout(actor: dict = Depends(_actor_from_headers), db: Session = Depends(get_db)):
    token = actor.get("session_token")
    if not token:
        return {"ok": True}

    token_hash = _hash_text(token)
    sessao = db.query(UsuarioSessao).filter(UsuarioSessao.token_hash == token_hash).first()
    if sessao and not sessao.revoked_at:
        sessao.revoked_at = datetime.utcnow()
        db.commit()
    return {"ok": True}


@app.get("/emendas", response_model=list[EmendaOut])
def listar_emendas(_actor: dict = Depends(_actor_from_headers), db: Session = Depends(get_db)):
    return db.query(Emenda).order_by(Emenda.id.desc()).all()


@app.post("/emendas", response_model=EmendaOut)
def criar_emenda(payload: EmendaCreate, actor: dict = Depends(_require_manager), db: Session = Depends(get_db)):
    exists = db.query(Emenda).filter(Emenda.id_interno == payload.id_interno).first()
    if exists:
        raise HTTPException(status_code=409, detail="id_interno ja existe")

    emenda = Emenda(
        id_interno=payload.id_interno,
        ano=payload.ano,
        identificacao=payload.identificacao,
        status_oficial=payload.status_oficial,
    )
    db.add(emenda)
    db.flush()

    db.add(
        Historico(
            emenda_id=emenda.id,
            usuario_id=actor["id"],
            usuario_nome=actor["name"],
            setor=actor["role"],
            tipo_evento="IMPORT",
            motivo="Criacao inicial",
        )
    )
    db.commit()
    db.refresh(emenda)
    return emenda


@app.post("/emendas/{emenda_id}/status")
def alterar_status_oficial(
    emenda_id: int,
    payload: EmendaStatusUpdate,
    actor: dict = Depends(_require_manager),
    db: Session = Depends(get_db),
):
    emenda = db.get(Emenda, emenda_id)
    if not emenda:
        raise HTTPException(status_code=404, detail="Emenda nao encontrada")

    anterior = emenda.status_oficial
    emenda.status_oficial = payload.novo_status
    emenda.updated_at = datetime.utcnow()

    db.add(
        Historico(
            emenda_id=emenda.id,
            usuario_id=actor["id"],
            usuario_nome=actor["name"],
            setor=actor["role"],
            tipo_evento="OFFICIAL_STATUS",
            valor_antigo=anterior,
            valor_novo=payload.novo_status,
            motivo=payload.motivo,
        )
    )
    db.commit()
    return {"ok": True}


@app.post("/emendas/{emenda_id}/eventos")
def adicionar_evento(
    emenda_id: int,
    payload: EventoCreate,
    actor: dict = Depends(_actor_from_headers),
    db: Session = Depends(get_db),
):
    emenda = db.get(Emenda, emenda_id)
    if not emenda:
        raise HTTPException(status_code=404, detail="Emenda nao encontrada")

    if payload.tipo_evento == "OFFICIAL_STATUS":
        raise HTTPException(status_code=400, detail="Use /status para status oficial")

    db.add(
        Historico(
            emenda_id=emenda.id,
            usuario_id=actor["id"],
            usuario_nome=actor["name"],
            setor=actor["role"],
            tipo_evento=payload.tipo_evento,
            campo_alterado=payload.campo_alterado,
            valor_antigo=payload.valor_antigo,
            valor_novo=payload.valor_novo,
            motivo=payload.motivo,
        )
    )
    emenda.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@app.get("/audit")
def audit_log(_actor: dict = Depends(_require_manager), db: Session = Depends(get_db)):
    rows = db.query(Historico).order_by(Historico.data_hora.desc()).all()
    return [
        {
            "id": r.id,
            "emenda_id": r.emenda_id,
            "usuario_id": r.usuario_id,
            "usuario_nome": r.usuario_nome,
            "setor": r.setor,
            "tipo_evento": r.tipo_evento,
            "campo_alterado": r.campo_alterado,
            "valor_antigo": r.valor_antigo,
            "valor_novo": r.valor_novo,
            "motivo": r.motivo,
            "data_hora": r.data_hora,
        }
        for r in rows
    ]
