from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .api.auth import create_auth_router
from .api.emendas import create_emendas_router
from .api.operations import create_operations_router
from .api.platform import create_platform_router
from .core.security import (
    _actor_from_bearer_token,
    _actor_from_legacy_session,
    _mask_history_pair,
    _validate_runtime_security_settings,
)
from .db import Base, SessionLocal, engine
from .schemas import EVENT_ORIGINS, ROLES
from .services import platform_service, realtime_service
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
app.include_router(create_auth_router(_broadcast_update))
app.include_router(create_emendas_router(_resolve_event_origin, _versioned_id_interno, _broadcast_update))
app.include_router(create_operations_router(_resolve_event_origin, _utcnow, _broadcast_update, _mask_history_pair))


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



