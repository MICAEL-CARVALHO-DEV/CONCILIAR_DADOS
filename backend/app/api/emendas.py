from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query

from ..core.dependencies import _actor_from_headers, _require_manager
from ..db import get_db
from ..schemas import (
    EmendaCreate,
    EmendaLockAcquireIn,
    EmendaLockOut,
    EmendaOut,
    EmendaStatusUpdate,
    EmendaVersionarIn,
    EventoCreate,
)
from ..services import emenda_service


def create_emendas_router(resolve_event_origin, next_versioned_id, broadcast_update) -> APIRouter:
    router = APIRouter()

    @router.get("/emendas", response_model=list[EmendaOut])
    def listar_emendas(
        ano: int | None = Query(default=None),
        municipio: str | None = Query(default=None),
        deputado: str | None = Query(default=None),
        q: str | None = Query(default=None),
        include_old: bool = Query(default=False),
        _actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return emenda_service.list_emendas_service(
            db=db,
            ano=ano,
            municipio=municipio,
            deputado=deputado,
            q=q,
            include_old=include_old,
        )

    @router.get("/emendas/{emenda_id}", response_model=EmendaOut)
    def obter_emenda(emenda_id: int, _actor: dict = Depends(_actor_from_headers), db=Depends(get_db)):
        return emenda_service.obter_emenda_service(emenda_id=emenda_id, db=db)

    @router.get("/emendas/{emenda_id}/lock", response_model=EmendaLockOut)
    def obter_lock_emenda(
        emenda_id: int,
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return emenda_service.obter_lock_emenda_service(emenda_id=emenda_id, actor=actor, db=db)

    @router.post("/emendas/{emenda_id}/lock/acquire", response_model=EmendaLockOut)
    def adquirir_lock_emenda(
        emenda_id: int,
        payload: EmendaLockAcquireIn,
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return emenda_service.adquirir_lock_emenda_service(
            emenda_id=emenda_id,
            actor=actor,
            force=bool(payload.force),
            db=db,
        )

    @router.post("/emendas/{emenda_id}/lock/renew", response_model=EmendaLockOut)
    def renovar_lock_emenda(
        emenda_id: int,
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return emenda_service.renovar_lock_emenda_service(emenda_id=emenda_id, actor=actor, db=db)

    @router.post("/emendas/{emenda_id}/lock/release", response_model=EmendaLockOut)
    def liberar_lock_emenda(
        emenda_id: int,
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return emenda_service.liberar_lock_emenda_service(emenda_id=emenda_id, actor=actor, db=db)

    @router.post("/emendas", response_model=EmendaOut)
    def criar_emenda(
        payload: EmendaCreate,
        actor: dict = Depends(_require_manager),
        x_event_origin: Annotated[str | None, Header(alias="X-Event-Origin")] = None,
        db=Depends(get_db),
    ):
        origin = resolve_event_origin(x_event_origin, actor, fallback="API")
        return emenda_service.criar_emenda_service(
            payload=payload,
            actor=actor,
            event_origin=origin,
            db=db,
            broadcast_update=broadcast_update,
        )

    @router.post("/emendas/{emenda_id}/status")
    def alterar_status_oficial(
        emenda_id: int,
        payload: EmendaStatusUpdate,
        actor: dict = Depends(_require_manager),
        x_event_origin: Annotated[str | None, Header(alias="X-Event-Origin")] = None,
        db=Depends(get_db),
    ):
        origin = resolve_event_origin(x_event_origin, actor, fallback="UI")
        return emenda_service.alterar_status_oficial_service(
            emenda_id=emenda_id,
            payload=payload,
            actor=actor,
            event_origin=origin,
            db=db,
            broadcast_update=broadcast_update,
        )

    @router.post("/emendas/{emenda_id}/eventos")
    def adicionar_evento(
        emenda_id: int,
        payload: EventoCreate,
        actor: dict = Depends(_actor_from_headers),
        x_event_origin: Annotated[str | None, Header(alias="X-Event-Origin")] = None,
        db=Depends(get_db),
    ):
        origin = resolve_event_origin(payload.origem_evento or x_event_origin, actor, fallback="UI")
        return emenda_service.adicionar_evento_service(
            emenda_id=emenda_id,
            payload=payload,
            actor=actor,
            event_origin=origin,
            db=db,
            broadcast_update=broadcast_update,
        )

    @router.post("/emendas/{emenda_id}/versionar", response_model=EmendaOut)
    def versionar_emenda(
        emenda_id: int,
        payload: EmendaVersionarIn,
        actor: dict = Depends(_require_manager),
        x_event_origin: Annotated[str | None, Header(alias="X-Event-Origin")] = None,
        db=Depends(get_db),
    ):
        origin = resolve_event_origin(x_event_origin, actor, fallback="API")
        return emenda_service.versionar_emenda_service(
            emenda_id=emenda_id,
            payload=payload,
            actor=actor,
            event_origin=origin,
            db=db,
            next_versioned_id=next_versioned_id,
            broadcast_update=broadcast_update,
        )

    return router
