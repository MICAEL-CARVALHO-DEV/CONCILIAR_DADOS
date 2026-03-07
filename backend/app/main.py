import asyncio
from datetime import datetime
import json
import re
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from .core.dependencies import _actor_from_headers, _actor_optional_from_headers, _require_manager, _require_owner
from .core.security import (
    _actor_from_bearer_token,
    _actor_from_legacy_session,
    _mask_history_pair,
    _try_decode_jwt,
    _validate_runtime_security_settings,
)
from .ai_schemas import AIProviderStatusResponse, AIWorkflowRequest, AIWorkflowResponse
from .db import Base, SessionLocal, engine, get_db
from .models import Emenda, ExportLog, Historico, ImportLinha, ImportLote
from .schemas import (
    AuthGoogleIn,
    AuthAuditLogOut,
    AuthLoginIn,
    AuthOut,
    AuthRecoveryRequestIn,
    AuthRegisterIn,
    EmendaCreate,
    EmendaLockAcquireIn,
    EmendaLockOut,
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
from .services import auth_service, emenda_service
from .services.ai_orchestrator import AIOrchestrator, OrchestrationError
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
ai_orchestrator = AIOrchestrator(settings)

VERSIONED_ID_RE = re.compile(r"^(?P<base>.+)-v(?P<num>\d+)$", re.IGNORECASE)


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


class PresenceBroker:
    def __init__(self) -> None:
        self._by_emenda: dict[int, dict[WebSocket, dict]] = {}
        self._by_socket: dict[WebSocket, set[int]] = {}
        self._lock = asyncio.Lock()

    @staticmethod
    def _normalize_info(actor: dict) -> dict:
        return {
            "usuario_nome": str(actor.get("name") or "-"),
            "setor": str(actor.get("role") or "-"),
            "at": _utcnow().isoformat() + "Z",
        }

    @staticmethod
    def _snapshot_from_bucket(bucket: dict[WebSocket, dict]) -> list[dict]:
        dedup: dict[str, dict] = {}
        for info in bucket.values():
            key = f"{info.get('usuario_nome', '-')}|{info.get('setor', '-')}"
            prev = dedup.get(key)
            if prev is None or str(info.get("at") or "") > str(prev.get("at") or ""):
                dedup[key] = {
                    "usuario_nome": str(info.get("usuario_nome") or "-"),
                    "setor": str(info.get("setor") or "-"),
                    "at": str(info.get("at") or ""),
                }
        return sorted(
            list(dedup.values()),
            key=lambda item: (str(item.get("setor") or ""), str(item.get("usuario_nome") or "")),
        )

    async def join(self, websocket: WebSocket, emenda_id: int, actor: dict) -> list[dict]:
        if emenda_id <= 0:
            return []
        async with self._lock:
            bucket = self._by_emenda.setdefault(emenda_id, {})
            bucket[websocket] = self._normalize_info(actor)
            self._by_socket.setdefault(websocket, set()).add(emenda_id)
            return self._snapshot_from_bucket(bucket)

    async def leave(self, websocket: WebSocket, emenda_id: int) -> list[dict]:
        if emenda_id <= 0:
            return []
        async with self._lock:
            bucket = self._by_emenda.get(emenda_id)
            if not bucket:
                return []

            bucket.pop(websocket, None)
            socket_emendas = self._by_socket.get(websocket)
            if socket_emendas is not None:
                socket_emendas.discard(emenda_id)
                if not socket_emendas:
                    self._by_socket.pop(websocket, None)

            if not bucket:
                self._by_emenda.pop(emenda_id, None)
                return []

            return self._snapshot_from_bucket(bucket)

    async def disconnect(self, websocket: WebSocket) -> dict[int, list[dict]]:
        changes: dict[int, list[dict]] = {}
        async with self._lock:
            emenda_ids = list(self._by_socket.pop(websocket, set()))
            for emenda_id in emenda_ids:
                bucket = self._by_emenda.get(emenda_id)
                if not bucket:
                    continue
                bucket.pop(websocket, None)
                if not bucket:
                    self._by_emenda.pop(emenda_id, None)
                    changes[emenda_id] = []
                else:
                    changes[emenda_id] = self._snapshot_from_bucket(bucket)
        return changes


ws_broker = WsConnectionBroker()
presence_broker = PresenceBroker()
def _utcnow() -> datetime:
    return datetime.utcnow()


def _presence_payload(emenda_id: int, users: list[dict]) -> dict:
    return {
        "type": "presence",
        "entity": "emenda",
        "id": emenda_id,
        "users": users,
        "at": _utcnow().isoformat() + "Z",
    }


def _resolve_event_origin(origin_raw: str | None, actor: dict | None = None, fallback: str = "API") -> str:
    candidate = (origin_raw or "").strip().upper()
    if candidate in EVENT_ORIGINS:
        return candidate

    if actor and actor.get("auth_type") == "disabled":
        return "API"

    fb = (fallback or "API").strip().upper()
    return fb if fb in EVENT_ORIGINS else "API"


def _ensure_legacy_schema() -> None:
    # Compatibilidade com bancos legados (principalmente SQLite local):
    # adiciona colunas/ÃƒÂ­ndices ausentes quando necessÃƒÂ¡rio.
    insp = inspect(engine)
    tables = set(insp.get_table_names())

    if "usuarios" in tables:
        cols = {c["name"] for c in insp.get_columns("usuarios")}
        statements = []
        if "email" not in cols:
            statements.append("ALTER TABLE usuarios ADD COLUMN email VARCHAR(255)")
        if "google_sub" not in cols:
            statements.append("ALTER TABLE usuarios ADD COLUMN google_sub VARCHAR(255)")
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
        if "row_version" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN row_version INTEGER NOT NULL DEFAULT 1")
        if "is_current" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN is_current BOOLEAN NOT NULL DEFAULT TRUE")
        if "plan_a" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN plan_a TEXT NOT NULL DEFAULT ''")
        if "plan_b" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN plan_b TEXT NOT NULL DEFAULT ''")

        with engine.begin() as conn:
            for st in statements:
                conn.execute(text(st))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_parent_id ON emendas(parent_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_status_oficial ON emendas(status_oficial)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_updated_at ON emendas(updated_at)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_is_current ON emendas(is_current)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_row_version ON emendas(row_version)"))

    if "historico" in tables:
        cols = {c["name"] for c in insp.get_columns("historico")}
        statements = []
        if "origem_evento" not in cols:
            statements.append("ALTER TABLE historico ADD COLUMN origem_evento VARCHAR(20) NOT NULL DEFAULT 'API'")

        with engine.begin() as conn:
            for st in statements:
                conn.execute(text(st))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_historico_data_hora ON historico(data_hora)"))

    with engine.begin() as conn:
        conn.execute(
            text(
                "CREATE TABLE IF NOT EXISTS emenda_locks ("
                "emenda_id INTEGER PRIMARY KEY, "
                "usuario_id INTEGER NULL, "
                "usuario_nome VARCHAR(120) NOT NULL DEFAULT '', "
                "setor VARCHAR(40) NOT NULL DEFAULT '', "
                "acquired_at TIMESTAMP NOT NULL, "
                "heartbeat_at TIMESTAMP NOT NULL, "
                "expires_at TIMESTAMP NOT NULL"
                ")"
            )
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emenda_locks_expires_at ON emenda_locks(expires_at)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emenda_locks_usuario_id ON emenda_locks(usuario_id)"))

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
    _validate_runtime_security_settings()
    Base.metadata.create_all(bind=engine)
    _ensure_legacy_schema()


@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "auth_enabled": settings.API_AUTH_ENABLED,
        "auth_mode": "jwt_bearer_with_legacy_fallback",
        "shared_key_enabled": settings.shared_key_auth_enabled,
        "app_env": settings.app_env_normalized,
        "roles": ROLES,
        "ai_orchestrator_enabled": settings.AI_ORCHESTRATOR_ENABLED,
        "ai_configured_providers": ai_orchestrator.configured_count(),
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


@app.get("/ai/providers/status", response_model=AIProviderStatusResponse)
def ai_provider_status(_actor: dict = Depends(_require_owner)) -> AIProviderStatusResponse:
    return AIProviderStatusResponse(
        orchestrator_enabled=settings.AI_ORCHESTRATOR_ENABLED,
        providers=ai_orchestrator.provider_status(),
    )


@app.post("/ai/workflows/review-loop", response_model=AIWorkflowResponse)
def ai_workflow_review_loop(
    payload: AIWorkflowRequest,
    actor: dict = Depends(_require_owner),
) -> AIWorkflowResponse:
    try:
        return ai_orchestrator.run_review_loop(payload=payload, actor=actor)
    except OrchestrationError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@app.post("/auth/google-intake")
def auth_google_intake(payload: AuthGoogleIn, request: Request, db: Session = Depends(get_db)) -> dict:
    return auth_service.auth_google_intake_service(payload=payload, request=request, db=db)

@app.post("/auth/register", response_model=AuthOut)
def auth_register(
    payload: AuthRegisterIn,
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    x_session_token: Annotated[str | None, Header(alias="X-Session-Token")] = None,
    db: Session = Depends(get_db),
):
    actor = _actor_optional_from_headers(authorization, x_session_token, db)
    return auth_service.auth_register_service(payload=payload, actor=actor, db=db)

@app.post("/auth/google", response_model=AuthOut)
def auth_google(payload: AuthGoogleIn, request: Request, db: Session = Depends(get_db)):
    return auth_service.auth_google_service(payload=payload, request=request, db=db)

@app.post("/auth/login", response_model=AuthOut)
def auth_login(payload: AuthLoginIn, request: Request, db: Session = Depends(get_db)):
    return auth_service.auth_login_service(payload=payload, request=request, db=db)

@app.post("/auth/recovery-request")
def auth_recovery_request(payload: AuthRecoveryRequestIn, request: Request, db: Session = Depends(get_db)):
    return auth_service.auth_recovery_request_service(payload=payload, request=request, db=db)

@app.get("/auth/me", response_model=UserOut)
def auth_me(actor: dict = Depends(_actor_from_headers)):
    return auth_service.auth_me_service(actor=actor)

@app.post("/auth/logout")
def auth_logout(actor: dict = Depends(_actor_from_headers), db: Session = Depends(get_db)):
    return auth_service.auth_logout_service(actor=actor, db=db)

@app.get("/auth/audit", response_model=list[AuthAuditLogOut])
def auth_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    _actor: dict = Depends(_require_owner),
    db: Session = Depends(get_db),
):
    return auth_service.list_auth_audit_logs_service(limit=limit, db=db)

@app.get("/users", response_model=list[UserAdminOut])
def listar_usuarios(
    include_inactive: bool = Query(default=True),
    _actor: dict = Depends(_require_owner),
    db: Session = Depends(get_db),
):
    return auth_service.list_users_service(include_inactive=include_inactive, db=db)

@app.patch("/users/{user_id}/status")
def alterar_status_usuario(
    user_id: int,
    payload: UserStatusUpdate,
    actor: dict = Depends(_require_owner),
    db: Session = Depends(get_db),
):
    return auth_service.update_user_status_service(
        user_id=user_id,
        payload=payload,
        actor=actor,
        db=db,
        broadcast_update=_broadcast_update,
    )

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
    return emenda_service.list_emendas_service(
        db=db,
        ano=ano,
        municipio=municipio,
        deputado=deputado,
        q=q,
        include_old=include_old,
    )

@app.get("/emendas/{emenda_id}", response_model=EmendaOut)
def obter_emenda(emenda_id: int, _actor: dict = Depends(_actor_from_headers), db: Session = Depends(get_db)):
    return emenda_service.obter_emenda_service(emenda_id=emenda_id, db=db)

@app.get("/emendas/{emenda_id}/lock", response_model=EmendaLockOut)
def obter_lock_emenda(
    emenda_id: int,
    actor: dict = Depends(_actor_from_headers),
    db: Session = Depends(get_db),
):
    return emenda_service.obter_lock_emenda_service(emenda_id=emenda_id, actor=actor, db=db)

@app.post("/emendas/{emenda_id}/lock/acquire", response_model=EmendaLockOut)
def adquirir_lock_emenda(
    emenda_id: int,
    payload: EmendaLockAcquireIn,
    actor: dict = Depends(_actor_from_headers),
    db: Session = Depends(get_db),
):
    return emenda_service.adquirir_lock_emenda_service(
        emenda_id=emenda_id,
        actor=actor,
        force=bool(payload.force),
        db=db,
    )

@app.post("/emendas/{emenda_id}/lock/renew", response_model=EmendaLockOut)
def renovar_lock_emenda(
    emenda_id: int,
    actor: dict = Depends(_actor_from_headers),
    db: Session = Depends(get_db),
):
    return emenda_service.renovar_lock_emenda_service(emenda_id=emenda_id, actor=actor, db=db)

@app.post("/emendas/{emenda_id}/lock/release", response_model=EmendaLockOut)
def liberar_lock_emenda(
    emenda_id: int,
    actor: dict = Depends(_actor_from_headers),
    db: Session = Depends(get_db),
):
    return emenda_service.liberar_lock_emenda_service(emenda_id=emenda_id, actor=actor, db=db)

@app.post("/emendas", response_model=EmendaOut)
def criar_emenda(
    payload: EmendaCreate,
    actor: dict = Depends(_require_manager),
    x_event_origin: Annotated[str | None, Header(alias="X-Event-Origin")] = None,
    db: Session = Depends(get_db),
):
    origin = _resolve_event_origin(x_event_origin, actor, fallback="API")
    return emenda_service.criar_emenda_service(
        payload=payload,
        actor=actor,
        event_origin=origin,
        db=db,
        broadcast_update=_broadcast_update,
    )

@app.post("/emendas/{emenda_id}/status")
def alterar_status_oficial(
    emenda_id: int,
    payload: EmendaStatusUpdate,
    actor: dict = Depends(_require_manager),
    x_event_origin: Annotated[str | None, Header(alias="X-Event-Origin")] = None,
    db: Session = Depends(get_db),
):
    origin = _resolve_event_origin(x_event_origin, actor, fallback="UI")
    return emenda_service.alterar_status_oficial_service(
        emenda_id=emenda_id,
        payload=payload,
        actor=actor,
        event_origin=origin,
        db=db,
        broadcast_update=_broadcast_update,
    )

@app.post("/emendas/{emenda_id}/eventos")
def adicionar_evento(
    emenda_id: int,
    payload: EventoCreate,
    actor: dict = Depends(_actor_from_headers),
    x_event_origin: Annotated[str | None, Header(alias="X-Event-Origin")] = None,
    db: Session = Depends(get_db),
):
    origin = _resolve_event_origin(payload.origem_evento or x_event_origin, actor, fallback="UI")
    return emenda_service.adicionar_evento_service(
        emenda_id=emenda_id,
        payload=payload,
        actor=actor,
        event_origin=origin,
        db=db,
        broadcast_update=_broadcast_update,
    )

@app.post("/emendas/{emenda_id}/versionar", response_model=EmendaOut)
def versionar_emenda(
    emenda_id: int,
    payload: EmendaVersionarIn,
    actor: dict = Depends(_require_manager),
    x_event_origin: Annotated[str | None, Header(alias="X-Event-Origin")] = None,
    db: Session = Depends(get_db),
):
    origin = _resolve_event_origin(x_event_origin, actor, fallback="API")
    return emenda_service.versionar_emenda_service(
        emenda_id=emenda_id,
        payload=payload,
        actor=actor,
        event_origin=origin,
        db=db,
        next_versioned_id=_versioned_id_interno,
        broadcast_update=_broadcast_update,
    )

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
    response: list[dict] = []
    for r in rows:
        old_value_masked, new_value_masked = _mask_history_pair(r.campo_alterado, r.valor_antigo, r.valor_novo)
        response.append(
            {
                "id": r.id,
                "emenda_id": r.emenda_id,
                "usuario_id": r.usuario_id,
                "usuario_nome": r.usuario_nome,
                "setor": r.setor,
                "tipo_evento": r.tipo_evento,
                "origem_evento": r.origem_evento,
                "campo_alterado": r.campo_alterado,
                "valor_antigo": old_value_masked,
                "valor_novo": new_value_masked,
                "motivo": r.motivo,
                "data_hora": r.data_hora,
            }
        )
    return response
@app.websocket("/ws")
async def websocket_updates(websocket: WebSocket):
    actor = {
        "id": None,
        "name": (websocket.query_params.get("user_name") or "anon").strip() or "anon",
        "role": (websocket.query_params.get("user_role") or "-").strip().upper() or "-",
        "auth_type": "disabled",
    }

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
                continue

            payload = None
            try:
                payload = json.loads(data or "")
            except Exception:
                payload = None

            if not isinstance(payload, dict):
                continue

            msg_type = str(payload.get("type") or "").strip().lower()
            if msg_type != "presence":
                continue

            action = str(payload.get("action") or "").strip().lower()
            emenda_id = int(payload.get("emenda_id") or 0)
            if emenda_id <= 0:
                continue

            if action == "join":
                users = await presence_broker.join(websocket, emenda_id, actor)
            elif action == "leave":
                users = await presence_broker.leave(websocket, emenda_id)
            else:
                continue

            await ws_broker.broadcast(_presence_payload(emenda_id, users))
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await ws_broker.disconnect(websocket)
        changes = await presence_broker.disconnect(websocket)
        for emenda_id, users in changes.items():
            await ws_broker.broadcast(_presence_payload(emenda_id, users))



