from typing import Annotated

from fastapi import Depends, FastAPI, Header, Query, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .api.platform import create_platform_router
from .core.dependencies import _actor_from_headers, _actor_optional_from_headers, _require_manager, _require_monitor, _require_owner
from .core.security import (
    _actor_from_bearer_token,
    _actor_from_legacy_session,
    _mask_history_pair,
    _validate_runtime_security_settings,
)
from .db import Base, SessionLocal, engine, get_db
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
    SupportMessageCreate,
    SupportMessageOut,
    SupportThreadCreate,
    SupportThreadOut,
    SupportThreadStatusUpdate,
    UserAdminOut,
    UserOut,
    UserStatusUpdate,
)
from .services import audit_service, auth_service, emenda_service, import_export_service, platform_service, realtime_service, support_service
from .services.ai_orchestrator import AIOrchestrator
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

ws_broker = realtime_service.WsConnectionBroker()
presence_broker = realtime_service.PresenceBroker(platform_service.utcnow)


def _utcnow():
    return platform_service.utcnow()


def _resolve_event_origin(origin_raw: str | None, actor: dict | None = None, fallback: str = "API") -> str:
    return platform_service.resolve_event_origin(origin_raw, EVENT_ORIGINS, actor, fallback)


def _versioned_id_interno(base_id: str, version_num: int, db: Session) -> str:
    return platform_service.versioned_id_interno(base_id, version_num, db)


def _broadcast_update(entity: str, entity_id: int | None) -> None:
    return platform_service.broadcast_update(entity, entity_id, ws_broker, platform_service.utcnow)

@app.on_event("startup")
def startup() -> None:
    _validate_runtime_security_settings()
    Base.metadata.create_all(bind=engine)
    platform_service.ensure_legacy_schema(engine)


app.include_router(create_platform_router(settings, ai_orchestrator, ROLES))


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
    return import_export_service.create_import_lot_service(
        payload=payload,
        actor=actor,
        db=db,
        resolve_event_origin=_resolve_event_origin,
        utcnow=_utcnow,
        broadcast_update=_broadcast_update,
    )


@app.get("/imports/lotes", response_model=list[ImportLoteOut])
def listar_lotes_importacao(
    limit: int = Query(default=50, ge=1, le=500),
    _actor: dict = Depends(_require_manager),
    db: Session = Depends(get_db),
):
    return import_export_service.list_import_lots_service(limit=limit, db=db)


@app.post("/imports/linhas/bulk")
def criar_linhas_importacao(
    payload: ImportLinhasBulkCreate,
    actor: dict = Depends(_require_manager),
    db: Session = Depends(get_db),
):
    return import_export_service.create_import_lines_service(
        payload=payload,
        db=db,
        utcnow=_utcnow,
        broadcast_update=_broadcast_update,
    )


@app.get("/imports/linhas", response_model=list[ImportLinhaOut])
def listar_linhas_importacao(
    lote_id: int = Query(..., ge=1),
    limit: int = Query(default=500, ge=1, le=5000),
    _actor: dict = Depends(_require_manager),
    db: Session = Depends(get_db),
):
    return import_export_service.list_import_lines_service(lote_id=lote_id, limit=limit, db=db)


@app.post("/exports/logs")
def criar_log_exportacao(
    payload: ExportLogCreate,
    actor: dict = Depends(_actor_from_headers),
    db: Session = Depends(get_db),
):
    return import_export_service.create_export_log_service(
        payload=payload,
        actor=actor,
        db=db,
        resolve_event_origin=_resolve_event_origin,
        utcnow=_utcnow,
        broadcast_update=_broadcast_update,
    )


@app.get("/exports/logs", response_model=list[ExportLogOut])
def listar_logs_exportacao(
    limit: int = Query(default=50, ge=1, le=500),
    _actor: dict = Depends(_require_manager),
    db: Session = Depends(get_db),
):
    return import_export_service.list_export_logs_service(limit=limit, db=db)


@app.get("/audit")
def audit_log(
    limit: int = Query(default=150, ge=1, le=500),
    ano: int | None = Query(default=None, ge=2000, le=2100),
    mes: int | None = Query(default=None, ge=1, le=12),
    usuario: str | None = Query(default=None),
    setor: str | None = Query(default=None),
    tipo_evento: str | None = Query(default=None),
    origem_evento: str | None = Query(default=None),
    q: str | None = Query(default=None),
    _actor: dict = Depends(_require_monitor),
    db: Session = Depends(get_db),
):
    return audit_service.list_audit_log_service(
        limit=limit,
        ano=ano,
        mes=mes,
        usuario=usuario,
        setor=setor,
        tipo_evento=tipo_evento,
        origem_evento=origem_evento,
        q=q,
        db=db,
        mask_history_pair=_mask_history_pair,
    )


@app.get("/support/threads", response_model=list[SupportThreadOut])
def list_support_threads(
    limit: int = Query(default=80, ge=1, le=200),
    status: str | None = Query(default=None),
    categoria: str | None = Query(default=None),
    usuario: str | None = Query(default=None),
    q: str | None = Query(default=None),
    mine_only: bool = Query(default=False),
    actor: dict = Depends(_actor_from_headers),
    db: Session = Depends(get_db),
):
    return support_service.list_support_threads_service(
        limit=limit,
        status=status,
        categoria=categoria,
        usuario=usuario,
        q=q,
        mine_only=mine_only,
        actor=actor,
        db=db,
    )


@app.post("/support/threads", response_model=SupportThreadOut)
def create_support_thread(
    payload: SupportThreadCreate,
    actor: dict = Depends(_actor_from_headers),
    db: Session = Depends(get_db),
):
    return support_service.create_support_thread_service(
        payload=payload,
        actor=actor,
        db=db,
        utcnow=_utcnow,
        broadcast_update=_broadcast_update,
    )


@app.get("/support/threads/{thread_id}/messages", response_model=list[SupportMessageOut])
def list_support_messages(
    thread_id: int,
    actor: dict = Depends(_actor_from_headers),
    db: Session = Depends(get_db),
):
    return support_service.list_support_messages_service(thread_id=thread_id, actor=actor, db=db)


@app.post("/support/threads/{thread_id}/messages", response_model=SupportMessageOut)
def create_support_message(
    thread_id: int,
    payload: SupportMessageCreate,
    actor: dict = Depends(_actor_from_headers),
    db: Session = Depends(get_db),
):
    return support_service.create_support_message_service(
        thread_id=thread_id,
        payload=payload,
        actor=actor,
        db=db,
        utcnow=_utcnow,
        broadcast_update=_broadcast_update,
    )


@app.patch("/support/threads/{thread_id}/status", response_model=SupportThreadOut)
def update_support_thread_status(
    thread_id: int,
    payload: SupportThreadStatusUpdate,
    actor: dict = Depends(_actor_from_headers),
    db: Session = Depends(get_db),
):
    return support_service.update_support_thread_status_service(
        thread_id=thread_id,
        payload=payload,
        actor=actor,
        db=db,
        utcnow=_utcnow,
        broadcast_update=_broadcast_update,
    )


@app.websocket("/ws")
async def websocket_updates(websocket: WebSocket):
    await realtime_service.websocket_updates_service(
        websocket=websocket,
        api_auth_enabled=settings.API_AUTH_ENABLED,
        session_factory=SessionLocal,
        actor_from_bearer_token=_actor_from_bearer_token,
        actor_from_legacy_session=_actor_from_legacy_session,
        utcnow=_utcnow,
        ws_broker=ws_broker,
        presence_broker=presence_broker,
    )



