from fastapi import APIRouter, WebSocket

from ..services import realtime_service


def create_realtime_router(
    *,
    api_auth_enabled: bool,
    session_factory,
    actor_from_bearer_token,
    actor_from_legacy_session,
    utcnow,
    ws_broker,
    presence_broker,
) -> APIRouter:
    router = APIRouter()

    @router.websocket("/ws")
    async def websocket_updates(websocket: WebSocket):
        await realtime_service.websocket_updates_service(
            websocket=websocket,
            api_auth_enabled=api_auth_enabled,
            session_factory=session_factory,
            actor_from_bearer_token=actor_from_bearer_token,
            actor_from_legacy_session=actor_from_legacy_session,
            utcnow=utcnow,
            ws_broker=ws_broker,
            presence_broker=presence_broker,
        )

    return router
