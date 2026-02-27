import asyncio
from datetime import datetime, timedelta, timezone
import hashlib
import re
import secrets
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from sqlalchemy import func, inspect, or_, text
from sqlalchemy.orm import Session

from .db import Base, SessionLocal, engine, get_db
from .models import Emenda, ExportLog, Historico, ImportLinha, ImportLote, Usuario, UsuarioSessao
from .schemas import (
    AuthLoginIn,
    AuthOut,
    AuthRegisterIn,
    EmendaCreate,
    EmendaOut,
    EmendaStatusUpdate,
    EmendaVersionarIn,
    EventoCreate,
    EVENT_ORIGINS,
    ExportLogCreate,
    ExportLogOut,
    ImportLinhaOut,
    ImportLinhasBulkCreate,
    ImportLoteCreate,
    ImportLoteOut,
    ROLES,
    UserAdminOut,
    UserOut,
    UserStatusUpdate,
)
from .settings import settings

app = FastAPI(title="API Emendas", version="0.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=(settings.CORS_ALLOW_ORIGIN_REGEX or None),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_ROLES = set(ROLES)
MANAGER_ROLES = {"APG", "SUPERVISAO", "PROGRAMADOR"}
OWNER_ROLE = "PROGRAMADOR"
PUBLIC_REGISTER_ROLES = {"APG", "SUPERVISAO", "CONTABIL", "POWERBI"}
SESSION_HOURS = max(int(settings.JWT_EXPIRE_HOURS or 12), 1)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
VERSIONED_ID_RE = re.compile(r"^(?P<base>.+)-v(?P<num>\d+)$", re.IGNORECASE)

STATUS_TRANSITIONS = {
    "Recebido": {"Em analise", "Pendente", "Cancelado"},
    "Em analise": {"Pendente", "Aguardando execucao", "Aprovado", "Cancelado"},
    "Pendente": {"Em analise", "Aguardando execucao", "Cancelado"},
    "Aguardando execucao": {"Em execucao", "Pendente", "Cancelado"},
    "Em execucao": {"Aprovado", "Concluido", "Pendente", "Cancelado"},
    "Aprovado": {"Concluido", "Em execucao", "Cancelado"},
    "Concluido": {"Pendente"},
    "Cancelado": set(),
}


class WsConnectionBroker:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)

    async def broadcast(self, payload: dict) -> None:
        async with self._lock:
            targets = list(self._connections)

        dead: list[WebSocket] = []
        for ws in targets:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)

        if dead:
            async with self._lock:
                for ws in dead:
                    self._connections.discard(ws)


ws_broker = WsConnectionBroker()
def _utcnow() -> datetime:
    return datetime.utcnow()


def _validate_status_transition(current_status: str, next_status: str) -> None:
    current = (current_status or "").strip()
    target = (next_status or "").strip()

    if not current or current == target:
        return

    allowed = STATUS_TRANSITIONS.get(current)
    if allowed is None:
        return

    if target not in allowed:
        allowed_list = ", ".join(sorted(allowed)) if allowed else "nenhuma"
        raise HTTPException(
            status_code=409,
            detail=f"transicao invalida: {current} -> {target}. Permitidos: {allowed_list}",
        )


def _resolve_event_origin(origin_raw: str | None, actor: dict | None = None, fallback: str = "API") -> str:
    candidate = (origin_raw or "").strip().upper()
    if candidate in EVENT_ORIGINS:
        return candidate

    if actor and actor.get("auth_type") == "disabled":
        return "API"

    fb = (fallback or "API").strip().upper()
    return fb if fb in EVENT_ORIGINS else "API"


def _hash_text(value: str) -> str:
    return hashlib.sha256((value or "").encode("utf-8")).hexdigest()


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password_modern(password: str, stored_hash: str) -> bool:
    raw_hash = (stored_hash or "").strip()
    if not raw_hash:
        return False
    try:
        return bool(pwd_context.verify(password, raw_hash))
    except (UnknownHashError, ValueError):
        return False


def _hash_password_legacy(password: str, salt_hex: str) -> str:
    salt = bytes.fromhex(salt_hex)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return digest.hex()


def _verify_password_legacy(password: str, salt_hex: str, expected_hash: str) -> bool:
    if not salt_hex or not expected_hash:
        return False
    try:
        calc_hash = _hash_password_legacy(password, salt_hex)
    except ValueError:
        return False
    return secrets.compare_digest(calc_hash, expected_hash)


def _verify_user_password(user: Usuario, password: str) -> tuple[bool, bool]:
    if _verify_password_modern(password, user.senha_hash):
        return True, False

    if _verify_password_legacy(password, user.senha_salt, user.senha_hash):
        return True, True

    return False, False


def _create_jwt_session(db: Session, user: Usuario) -> str:
    session_id = secrets.token_urlsafe(24)
    session_hash = _hash_text(session_id)
    now = _utcnow()
    exp = now + timedelta(hours=SESSION_HOURS)

    sessao = UsuarioSessao(
        usuario_id=user.id,
        token_hash=session_hash,
        created_at=now,
        expires_at=exp,
    )
    db.add(sessao)
    user.ultimo_login = now
    db.commit()

    payload = {
        "sub": str(user.id),
        "name": user.nome,
        "role": user.perfil,
        "sid": session_id,
        "iat": int(now.replace(tzinfo=timezone.utc).timestamp()),
        "exp": int(exp.replace(tzinfo=timezone.utc).timestamp()),
        "typ": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _try_decode_jwt(token: str) -> dict | None:
    raw = (token or "").strip()
    if not raw:
        return None

    try:
        data = jwt.decode(raw, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None

    if not isinstance(data, dict):
        return None
    return data


def _actor_from_bearer_token(token: str, db: Session) -> dict | None:
    claims = _try_decode_jwt(token)
    if not claims:
        return None

    sid = str(claims.get("sid") or "").strip()
    sub = str(claims.get("sub") or "").strip()
    if not sid or not sub:
        return None

    session_hash = _hash_text(sid)
    sessao = (
        db.query(UsuarioSessao)
        .join(Usuario, Usuario.id == UsuarioSessao.usuario_id)
        .filter(
            UsuarioSessao.token_hash == session_hash,
            UsuarioSessao.revoked_at.is_(None),
            UsuarioSessao.expires_at > _utcnow(),
            Usuario.ativo.is_(True),
        )
        .first()
    )
    if not sessao:
        return None

    if str(sessao.usuario.id) != sub:
        return None

    return {
        "id": sessao.usuario.id,
        "name": sessao.usuario.nome,
        "role": sessao.usuario.perfil,
        "session_token": token,
        "session_sid": sid,
        "auth_type": "bearer",
    }


def _actor_from_legacy_session(token: str, db: Session) -> dict | None:
    raw = (token or "").strip()
    if not raw:
        return None

    token_hash = _hash_text(raw)
    sessao = (
        db.query(UsuarioSessao)
        .join(Usuario, Usuario.id == UsuarioSessao.usuario_id)
        .filter(
            UsuarioSessao.token_hash == token_hash,
            UsuarioSessao.revoked_at.is_(None),
            UsuarioSessao.expires_at > _utcnow(),
            Usuario.ativo.is_(True),
        )
        .first()
    )
    if not sessao:
        return None

    return {
        "id": sessao.usuario.id,
        "name": sessao.usuario.nome,
        "role": sessao.usuario.perfil,
        "session_token": raw,
        "session_sid": None,
        "auth_type": "legacy",
    }


def _normalize_role(role: str) -> str:
    value = (role or "").strip().upper()
    if value not in ALLOWED_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="setor invalido")
    return value


def _actor_from_headers(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    x_session_token: Annotated[str | None, Header(alias="X-Session-Token")] = None,
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
    x_user_name: Annotated[str | None, Header(alias="X-User-Name")] = None,
    x_user_role: Annotated[str | None, Header(alias="X-User-Role")] = None,
    db: Session = Depends(get_db),
) -> dict:
    if not settings.API_AUTH_ENABLED:
        name = (x_user_name or "sistema").strip() or "sistema"
        role = _normalize_role(x_user_role or "PROGRAMADOR")
        return {"id": None, "name": name, "role": role, "session_token": None, "session_sid": None, "auth_type": "disabled"}

    auth_value = (authorization or "").strip()
    if auth_value.lower().startswith("bearer "):
        bearer_token = auth_value[7:].strip()
        actor = _actor_from_bearer_token(bearer_token, db)
        if actor:
            return actor

    session_token = (x_session_token or "").strip()
    if session_token:
        actor = _actor_from_bearer_token(session_token, db)
        if actor:
            return actor

        actor = _actor_from_legacy_session(session_token, db)
        if actor:
            return actor

    if x_api_key and x_api_key == settings.API_SHARED_KEY:
        name = (x_user_name or "").strip()
        role = (x_user_role or "").strip().upper()
        if name and role in ALLOWED_ROLES:
            return {"id": None, "name": name, "role": role, "session_token": None, "session_sid": None, "auth_type": "shared_key"}

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="nao autenticado")


def _actor_optional_from_headers(
    authorization: str | None,
    x_session_token: str | None,
    db: Session,
) -> dict | None:
    auth_value = (authorization or "").strip()
    if auth_value.lower().startswith("bearer "):
        bearer_token = auth_value[7:].strip()
        actor = _actor_from_bearer_token(bearer_token, db)
        if actor:
            return actor

    token = (x_session_token or "").strip()
    if not token:
        return None

    actor = _actor_from_bearer_token(token, db)
    if actor:
        return actor

    return _actor_from_legacy_session(token, db)


def _require_manager(actor: dict = Depends(_actor_from_headers)) -> dict:
    if actor["role"] not in MANAGER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="perfil sem permissao")
    return actor


def _require_owner(actor: dict = Depends(_actor_from_headers)) -> dict:
    if actor["role"] != OWNER_ROLE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="apenas PROGRAMADOR pode aprovar perfis")
    return actor


def _ensure_legacy_schema() -> None:
    insp = inspect(engine)
    tables = set(insp.get_table_names())

    if "usuarios" in tables:
        cols = {c["name"] for c in insp.get_columns("usuarios")}
        statements = []
        if "senha_salt" not in cols:
            statements.append("ALTER TABLE usuarios ADD COLUMN senha_salt VARCHAR(255) NOT NULL DEFAULT ''")
        if "senha_hash" not in cols:
            statements.append("ALTER TABLE usuarios ADD COLUMN senha_hash VARCHAR(255) NOT NULL DEFAULT ''")
        if "ativo" not in cols:
            statements.append("ALTER TABLE usuarios ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE")
        if "ultimo_login" not in cols:
            statements.append("ALTER TABLE usuarios ADD COLUMN ultimo_login TIMESTAMP")

        if statements:
            with engine.begin() as conn:
                for st in statements:
                    conn.execute(text(st))

    if "emendas" in tables:
        cols = {c["name"] for c in insp.get_columns("emendas")}
        statements = []
        if "parent_id" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN parent_id INTEGER")
        if "version" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN version INTEGER NOT NULL DEFAULT 1")
        if "is_current" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN is_current BOOLEAN NOT NULL DEFAULT TRUE")

        with engine.begin() as conn:
            for st in statements:
                conn.execute(text(st))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_parent_id ON emendas(parent_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_status_oficial ON emendas(status_oficial)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_updated_at ON emendas(updated_at)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_is_current ON emendas(is_current)"))

    if "historico" in tables:
        cols = {c["name"] for c in insp.get_columns("historico")}
        statements = []
        if "origem_evento" not in cols:
            statements.append("ALTER TABLE historico ADD COLUMN origem_evento VARCHAR(20) NOT NULL DEFAULT 'API'")

        with engine.begin() as conn:
            for st in statements:
                conn.execute(text(st))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_historico_data_hora ON historico(data_hora)"))

    if "import_linhas" in tables:
        with engine.begin() as conn:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_import_linhas_id_interno ON import_linhas(id_interno)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_import_linhas_ref_key ON import_linhas(ref_key)"))

    if "export_logs" in tables:
        cols = {c["name"] for c in insp.get_columns("export_logs")}
        statements = []
        if "escopo_exportacao" not in cols:
            statements.append("ALTER TABLE export_logs ADD COLUMN escopo_exportacao VARCHAR(20) NOT NULL DEFAULT 'ATUAIS'")

        with engine.begin() as conn:
            for st in statements:
                conn.execute(text(st))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_export_logs_created_at ON export_logs(created_at)"))

def _versioned_id_interno(base_id: str, version_num: int, db: Session) -> str:
    raw_base = (base_id or "").strip() or "EMENDA"
    m = VERSIONED_ID_RE.match(raw_base)
    base = m.group("base") if m else raw_base
    version = max(int(version_num or 1), 1)

    while True:
        candidate = f"{base}-v{version:03d}"
        exists = db.query(Emenda).filter(Emenda.id_interno == candidate).first()
        if not exists:
            return candidate
        version += 1



def _update_payload(entity: str, entity_id: int | None) -> dict:
    return {
        "type": "update",
        "entity": entity,
        "id": entity_id,
        "at": _utcnow().isoformat() + "Z",
    }


async def _broadcast_update_async(entity: str, entity_id: int | None) -> None:
    await ws_broker.broadcast(_update_payload(entity, entity_id))


def _broadcast_update(entity: str, entity_id: int | None) -> None:
    payload_coro = _broadcast_update_async(entity, entity_id)
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        asyncio.run(payload_coro)
        return

    loop.create_task(payload_coro)

@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_legacy_schema()


@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "auth_enabled": settings.API_AUTH_ENABLED,
        "auth_mode": "jwt_bearer_with_legacy_fallback",
        "roles": ROLES,
    }


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {
        "ok": True,
        "service": "sec-emendas-api",
        "health": "/health",
        "docs": "/docs",
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    return Response(status_code=204)


@app.get("/roles")
def roles() -> dict:
    return {"roles": ROLES}


@app.post("/auth/register", response_model=AuthOut)
def auth_register(
    payload: AuthRegisterIn,
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    x_session_token: Annotated[str | None, Header(alias="X-Session-Token")] = None,
    db: Session = Depends(get_db),
):
    nome = payload.nome.strip()
    role = payload.perfil

    exists = db.query(Usuario).filter(func.lower(Usuario.nome) == nome.lower()).first()
    if exists:
        raise HTTPException(status_code=409, detail="usuario ja existe")

    actor = _actor_optional_from_headers(authorization, x_session_token, db)
    owner_exists = (
        db.query(Usuario.id)
        .filter(Usuario.ativo.is_(True), Usuario.perfil == OWNER_ROLE)
        .first()
        is not None
    )

    activate_now = True
    pending_approval = False

    # Sem PROGRAMADOR ativo, permitimos bootstrap do primeiro dono.
    if not owner_exists and actor is None:
        if role != OWNER_ROLE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="primeiro cadastro deve ser PROGRAMADOR",
            )
    elif actor is None:
        if role not in PUBLIC_REGISTER_ROLES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="cadastro publico nao permite este perfil",
            )
        activate_now = False
        pending_approval = True
    else:
        actor_role = actor.get("role")
        if actor_role != OWNER_ROLE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="apenas PROGRAMADOR pode criar/aprovar perfis",
            )

    pwd_hash = _hash_password(payload.senha)
    user = Usuario(
        nome=nome,
        setor=role,
        perfil=role,
        senha_salt="",
        senha_hash=pwd_hash,
        ativo=activate_now,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if pending_approval:
        return {
            "token": None,
            "token_type": "bearer",
            "usuario": {"id": user.id, "nome": user.nome, "perfil": user.perfil},
            "pending_approval": True,
        }

    token = _create_jwt_session(db, user)
    return {
        "token": token,
        "token_type": "bearer",
        "usuario": {"id": user.id, "nome": user.nome, "perfil": user.perfil},
    }


@app.post("/auth/login", response_model=AuthOut)
def auth_login(payload: AuthLoginIn, db: Session = Depends(get_db)):
    nome = payload.nome.strip()
    user = db.query(Usuario).filter(func.lower(Usuario.nome) == nome.lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="credenciais invalidas")
    if not user.ativo:
        raise HTTPException(status_code=403, detail="usuario pendente de aprovacao")

    valid, used_legacy = _verify_user_password(user, payload.senha)
    if not valid:
        raise HTTPException(status_code=401, detail="credenciais invalidas")

    if used_legacy:
        user.senha_hash = _hash_password(payload.senha)
        user.senha_salt = ""
        db.commit()

    token = _create_jwt_session(db, user)
    return {
        "token": token,
        "token_type": "bearer",
        "usuario": {"id": user.id, "nome": user.nome, "perfil": user.perfil},
    }


@app.get("/auth/me", response_model=UserOut)
def auth_me(actor: dict = Depends(_actor_from_headers)):
    if actor["id"] is None:
        return {"id": 0, "nome": actor["name"], "perfil": actor["role"]}
    return {"id": actor["id"], "nome": actor["name"], "perfil": actor["role"]}


@app.post("/auth/logout")
def auth_logout(actor: dict = Depends(_actor_from_headers), db: Session = Depends(get_db)):
    sid = (actor.get("session_sid") or "").strip()
    if sid:
        session_hash = _hash_text(sid)
        sessao = db.query(UsuarioSessao).filter(UsuarioSessao.token_hash == session_hash).first()
        if sessao and not sessao.revoked_at:
            sessao.revoked_at = _utcnow()
            db.commit()
        return {"ok": True}

    token = (actor.get("session_token") or "").strip()
    if token:
        token_hash = _hash_text(token)
        sessao = db.query(UsuarioSessao).filter(UsuarioSessao.token_hash == token_hash).first()
        if sessao and not sessao.revoked_at:
            sessao.revoked_at = _utcnow()
            db.commit()
    return {"ok": True}


@app.get("/users", response_model=list[UserAdminOut])
def listar_usuarios(
    include_inactive: bool = Query(default=True),
    _actor: dict = Depends(_require_owner),
    db: Session = Depends(get_db),
):
    query = db.query(Usuario)
    if not include_inactive:
        query = query.filter(Usuario.ativo.is_(True))
    return query.order_by(Usuario.nome.asc(), Usuario.id.asc()).all()


@app.patch("/users/{user_id}/status")
def alterar_status_usuario(
    user_id: int,
    payload: UserStatusUpdate,
    actor: dict = Depends(_require_owner),
    db: Session = Depends(get_db),
):
    user = db.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="usuario nao encontrado")

    actor_id = actor.get("id")
    if actor_id is not None and int(actor_id) == int(user.id) and payload.ativo is False:
        raise HTTPException(status_code=400, detail="nao e permitido desativar o proprio usuario")

    if payload.perfil is not None:
        user.perfil = payload.perfil
        user.setor = payload.perfil

    user.ativo = bool(payload.ativo)

    if not user.ativo:
        now = _utcnow()
        (
            db.query(UsuarioSessao)
            .filter(
                UsuarioSessao.usuario_id == user.id,
                UsuarioSessao.revoked_at.is_(None),
            )
            .update({UsuarioSessao.revoked_at: now}, synchronize_session=False)
        )

    db.commit()
    _broadcast_update("usuario", user.id)
    return {"ok": True, "id": user.id, "ativo": user.ativo, "perfil": user.perfil}

@app.get("/emendas", response_model=list[EmendaOut])
def listar_emendas(
    ano: int | None = Query(default=None),
    municipio: str | None = Query(default=None),
    deputado: str | None = Query(default=None),
    q: str | None = Query(default=None),
    include_old: bool = Query(default=False),
    _actor: dict = Depends(_actor_from_headers),
    db: Session = Depends(get_db),
):
    query = db.query(Emenda)

    if not include_old:
        query = query.filter(Emenda.is_current.is_(True))
    if ano is not None:
        query = query.filter(Emenda.ano == ano)
    if municipio:
        query = query.filter(Emenda.municipio.ilike(f"%{municipio.strip()}%"))
    if deputado:
        query = query.filter(Emenda.deputado.ilike(f"%{deputado.strip()}%"))
    if q:
        needle = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Emenda.id_interno.ilike(needle),
                Emenda.identificacao.ilike(needle),
                Emenda.municipio.ilike(needle),
                Emenda.deputado.ilike(needle),
                Emenda.processo_sei.ilike(needle),
            )
        )

    return query.order_by(Emenda.updated_at.desc(), Emenda.id.desc()).all()


@app.get("/emendas/{emenda_id}", response_model=EmendaOut)
def obter_emenda(emenda_id: int, _actor: dict = Depends(_actor_from_headers), db: Session = Depends(get_db)):
    emenda = db.get(Emenda, emenda_id)
    if not emenda:
        raise HTTPException(status_code=404, detail="Emenda nao encontrada")
    return emenda


@app.post("/emendas", response_model=EmendaOut)
def criar_emenda(
    payload: EmendaCreate,
    actor: dict = Depends(_require_manager),
    x_event_origin: Annotated[str | None, Header(alias="X-Event-Origin")] = None,
    db: Session = Depends(get_db),
):
    exists = db.query(Emenda).filter(Emenda.id_interno == payload.id_interno).first()
    if exists:
        raise HTTPException(status_code=409, detail="id_interno ja existe")

    origin = _resolve_event_origin(x_event_origin, actor, fallback="API")

    now = _utcnow()
    emenda = Emenda(
        id_interno=payload.id_interno,
        ano=payload.ano,
        identificacao=payload.identificacao,
        status_oficial=payload.status_oficial,
        parent_id=None,
        version=1,
        is_current=True,
        created_at=now,
        updated_at=now,
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
            origem_evento=origin,
            motivo="Criacao inicial",
        )
    )
    db.commit()
    db.refresh(emenda)
    _broadcast_update("emenda", emenda.id)
    return emenda


@app.post("/emendas/{emenda_id}/status")
def alterar_status_oficial(
    emenda_id: int,
    payload: EmendaStatusUpdate,
    actor: dict = Depends(_require_manager),
    x_event_origin: Annotated[str | None, Header(alias="X-Event-Origin")] = None,
    db: Session = Depends(get_db),
):
    emenda = db.get(Emenda, emenda_id)
    if not emenda:
        raise HTTPException(status_code=404, detail="Emenda nao encontrada")

    origin = _resolve_event_origin(x_event_origin, actor, fallback="UI")

    anterior = emenda.status_oficial
    if anterior == payload.novo_status:
        return {"ok": True, "changed": False}

    _validate_status_transition(anterior, payload.novo_status)

    emenda.status_oficial = payload.novo_status
    emenda.updated_at = _utcnow()

    db.add(
        Historico(
            emenda_id=emenda.id,
            usuario_id=actor["id"],
            usuario_nome=actor["name"],
            setor=actor["role"],
            tipo_evento="OFFICIAL_STATUS",
            origem_evento=origin,
            valor_antigo=anterior,
            valor_novo=payload.novo_status,
            motivo=payload.motivo,
        )
    )
    db.commit()
    _broadcast_update("emenda", emenda.id)
    return {"ok": True}


@app.post("/emendas/{emenda_id}/eventos")
def adicionar_evento(
    emenda_id: int,
    payload: EventoCreate,
    actor: dict = Depends(_actor_from_headers),
    x_event_origin: Annotated[str | None, Header(alias="X-Event-Origin")] = None,
    db: Session = Depends(get_db),
):
    emenda = db.get(Emenda, emenda_id)
    if not emenda:
        raise HTTPException(status_code=404, detail="Emenda nao encontrada")

    if payload.tipo_evento == "OFFICIAL_STATUS":
        raise HTTPException(status_code=400, detail="Use /status para status oficial")

    origin = _resolve_event_origin(payload.origem_evento or x_event_origin, actor, fallback="UI")

    db.add(
        Historico(
            emenda_id=emenda.id,
            usuario_id=actor["id"],
            usuario_nome=actor["name"],
            setor=actor["role"],
            tipo_evento=payload.tipo_evento,
            origem_evento=origin,
            campo_alterado=payload.campo_alterado,
            valor_antigo=payload.valor_antigo,
            valor_novo=payload.valor_novo,
            motivo=payload.motivo,
        )
    )
    emenda.updated_at = _utcnow()
    db.commit()
    _broadcast_update("emenda", emenda.id)
    return {"ok": True}


@app.post("/emendas/{emenda_id}/versionar", response_model=EmendaOut)
def versionar_emenda(
    emenda_id: int,
    payload: EmendaVersionarIn,
    actor: dict = Depends(_require_manager),
    x_event_origin: Annotated[str | None, Header(alias="X-Event-Origin")] = None,
    db: Session = Depends(get_db),
):
    origem = db.get(Emenda, emenda_id)
    if not origem:
        raise HTTPException(status_code=404, detail="Emenda nao encontrada")

    origin = _resolve_event_origin(x_event_origin, actor, fallback="API")

    now = _utcnow()
    next_version = int(origem.version or 1) + 1

    origem.is_current = False
    origem.updated_at = now

    novo_id_interno = _versioned_id_interno(origem.id_interno, next_version, db)

    nova = Emenda(
        id_interno=novo_id_interno,
        ano=payload.ano if payload.ano is not None else origem.ano,
        identificacao=payload.identificacao if payload.identificacao is not None else origem.identificacao,
        cod_subfonte=origem.cod_subfonte,
        deputado=payload.deputado if payload.deputado is not None else origem.deputado,
        cod_uo=origem.cod_uo,
        sigla_uo=origem.sigla_uo,
        cod_orgao=origem.cod_orgao,
        cod_acao=origem.cod_acao,
        descricao_acao=origem.descricao_acao,
        municipio=payload.municipio if payload.municipio is not None else origem.municipio,
        valor_inicial=payload.valor_inicial if payload.valor_inicial is not None else origem.valor_inicial,
        valor_atual=payload.valor_atual if payload.valor_atual is not None else origem.valor_atual,
        processo_sei=payload.processo_sei if payload.processo_sei is not None else origem.processo_sei,
        status_oficial=origem.status_oficial,
        parent_id=origem.id,
        version=next_version,
        is_current=True,
        created_at=now,
        updated_at=now,
    )
    db.add(nova)
    db.flush()

    reason = (payload.motivo or "").strip() or "Nova versao"
    db.add(
        Historico(
            emenda_id=nova.id,
            usuario_id=actor["id"],
            usuario_nome=actor["name"],
            setor=actor["role"],
            tipo_evento="VERSIONAR",
            origem_evento=origin,
            campo_alterado="version",
            valor_antigo=str(origem.version),
            valor_novo=str(nova.version),
            motivo=reason,
        )
    )

    db.commit()
    db.refresh(nova)
    _broadcast_update("emenda", nova.id)
    return nova




@app.post("/imports/lotes")
def criar_lote_importacao(
    payload: ImportLoteCreate,
    actor: dict = Depends(_require_manager),
    db: Session = Depends(get_db),
):
    lote = ImportLote(
        arquivo_nome=payload.arquivo_nome,
        arquivo_hash=payload.arquivo_hash or "",
        linhas_lidas=max(0, int(payload.linhas_lidas or 0)),
        linhas_validas=max(0, int(payload.linhas_validas or 0)),
        linhas_ignoradas=max(0, int(payload.linhas_ignoradas or 0)),
        registros_criados=max(0, int(payload.registros_criados or 0)),
        registros_atualizados=max(0, int(payload.registros_atualizados or 0)),
        sem_alteracao=max(0, int(payload.sem_alteracao or 0)),
        duplicidade_id=max(0, int(payload.duplicidade_id or 0)),
        duplicidade_ref=max(0, int(payload.duplicidade_ref or 0)),
        duplicidade_arquivo=max(0, int(payload.duplicidade_arquivo or 0)),
        conflito_id_ref=max(0, int(payload.conflito_id_ref or 0)),
        abas_lidas=" | ".join([x for x in (payload.abas_lidas or []) if str(x).strip()]),
        observacao=payload.observacao or "",
        origem_evento=_resolve_event_origin(payload.origem_evento, actor, fallback="IMPORT"),
        usuario_id=actor.get("id"),
        usuario_nome=actor.get("name") or "",
        setor=actor.get("role") or "",
        created_at=_utcnow(),
    )
    db.add(lote)
    db.commit()
    db.refresh(lote)
    _broadcast_update("import_lote", lote.id)
    return {"ok": True, "id": lote.id}


@app.get("/imports/lotes", response_model=list[ImportLoteOut])
def listar_lotes_importacao(
    limit: int = Query(default=50, ge=1, le=500),
    _actor: dict = Depends(_require_manager),
    db: Session = Depends(get_db),
):
    return db.query(ImportLote).order_by(ImportLote.created_at.desc(), ImportLote.id.desc()).limit(limit).all()


@app.post("/imports/linhas/bulk")
def criar_linhas_importacao(
    payload: ImportLinhasBulkCreate,
    actor: dict = Depends(_require_manager),
    db: Session = Depends(get_db),
):
    lote = db.get(ImportLote, payload.lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="lote de importacao nao encontrado")

    linhas = payload.linhas or []
    if not linhas:
        return {"ok": True, "inserted": 0}

    inserted = 0
    now = _utcnow()
    for ln in linhas:
        db.add(
            ImportLinha(
                lote_id=lote.id,
                ordem=max(0, int(ln.ordem or 0)),
                sheet_name=(ln.sheet_name or "")[:120],
                row_number=max(0, int(ln.row_number or 0)),
                status_linha=(ln.status_linha or "UNCHANGED").upper(),
                id_interno=(ln.id_interno or "")[:60],
                ref_key=(ln.ref_key or "")[:255],
                mensagem=ln.mensagem or "",
                created_at=now,
            )
        )
        inserted += 1

    db.commit()
    _broadcast_update("import_linha", lote.id)
    return {"ok": True, "inserted": inserted}


@app.get("/imports/linhas", response_model=list[ImportLinhaOut])
def listar_linhas_importacao(
    lote_id: int = Query(..., ge=1),
    limit: int = Query(default=500, ge=1, le=5000),
    _actor: dict = Depends(_require_manager),
    db: Session = Depends(get_db),
):
    return (
        db.query(ImportLinha)
        .filter(ImportLinha.lote_id == lote_id)
        .order_by(ImportLinha.ordem.asc(), ImportLinha.id.asc())
        .limit(limit)
        .all()
    )


@app.post("/exports/logs")
def criar_log_exportacao(
    payload: ExportLogCreate,
    actor: dict = Depends(_actor_from_headers),
    db: Session = Depends(get_db),
):
    log = ExportLog(
        formato=payload.formato,
        arquivo_nome=payload.arquivo_nome,
        quantidade_registros=max(0, int(payload.quantidade_registros or 0)),
        quantidade_eventos=max(0, int(payload.quantidade_eventos or 0)),
        filtros_json=payload.filtros_json or "",
        modo_headers=(payload.modo_headers or "normalizados")[:30],
        escopo_exportacao=(payload.escopo_exportacao or "ATUAIS")[:20],
        round_trip_ok=payload.round_trip_ok,
        round_trip_issues=" | ".join([x for x in (payload.round_trip_issues or []) if str(x).strip()]),
        origem_evento=_resolve_event_origin(payload.origem_evento, actor, fallback="EXPORT"),
        usuario_id=actor.get("id"),
        usuario_nome=actor.get("name") or "",
        setor=actor.get("role") or "",
        created_at=_utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    _broadcast_update("export_log", log.id)
    return {"ok": True, "id": log.id}


@app.get("/exports/logs", response_model=list[ExportLogOut])
def listar_logs_exportacao(
    limit: int = Query(default=50, ge=1, le=500),
    _actor: dict = Depends(_require_manager),
    db: Session = Depends(get_db),
):
    return db.query(ExportLog).order_by(ExportLog.created_at.desc(), ExportLog.id.desc()).limit(limit).all()


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
            "origem_evento": r.origem_evento,
            "campo_alterado": r.campo_alterado,
            "valor_antigo": r.valor_antigo,
            "valor_novo": r.valor_novo,
            "motivo": r.motivo,
            "data_hora": r.data_hora,
        }
        for r in rows
    ]
@app.websocket("/ws")
async def websocket_updates(websocket: WebSocket):
    if settings.API_AUTH_ENABLED:
        token = (websocket.query_params.get("token") or "").strip()
        if not token:
            await websocket.close(code=1008)
            return

        db = SessionLocal()
        try:
            actor = _actor_from_bearer_token(token, db) or _actor_from_legacy_session(token, db)
        finally:
            db.close()

        if not actor:
            await websocket.close(code=1008)
            return

    await ws_broker.connect(websocket)
    await websocket.send_json({
        "type": "ready",
        "entity": "ws",
        "id": None,
        "at": _utcnow().isoformat() + "Z",
    })

    try:
        while True:
            data = await websocket.receive_text()
            if data and data.strip().lower() == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "entity": "ws",
                    "id": None,
                    "at": _utcnow().isoformat() + "Z",
                })
    except WebSocketDisconnect:
        await ws_broker.disconnect(websocket)
    except Exception:
        await ws_broker.disconnect(websocket)


