from fastapi import APIRouter, Depends, File, Query, UploadFile

from ..core.dependencies import _actor_from_headers, _require_manager, _require_monitor
from ..db import get_db
from ..schemas import (
    ExportLogCreate,
    ExportLogOut,
    ImportGovernanceActionIn,
    ImportGovernanceLogOut,
    ImportLinhaOut,
    ImportLinhasBulkCreate,
    ImportLoteCreate,
    ImportLoteOut,
    ImportPreviewOut,
    SupportMessageCreate,
    SupportMessageOut,
    SupportThreadCreate,
    SupportThreadOut,
    SupportThreadStatusUpdate,
)
from ..services import audit_service, import_export_service, support_service


def create_operations_router(resolve_event_origin, utcnow, broadcast_update, mask_history_pair) -> APIRouter:
    router = APIRouter()

    @router.post("/imports/preview-xlsx", response_model=ImportPreviewOut)
    async def prever_importacao_xlsx(
        file: UploadFile = File(...),
        _actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        file_bytes = await file.read()
        return import_export_service.preview_import_xlsx_service(
            file_name=file.filename or "import.xlsx",
            file_bytes=file_bytes,
            db=db,
        )

    @router.post("/imports/lotes")
    def criar_lote_importacao(
        payload: ImportLoteCreate,
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return import_export_service.create_import_lot_service(
            payload=payload,
            actor=actor,
            db=db,
            resolve_event_origin=resolve_event_origin,
            utcnow=utcnow,
            broadcast_update=broadcast_update,
        )

    @router.get("/imports/lotes", response_model=list[ImportLoteOut])
    def listar_lotes_importacao(
        limit: int = Query(default=50, ge=1, le=500),
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return import_export_service.list_import_lots_service(limit=limit, actor=actor, db=db)

    @router.post("/imports/linhas/bulk")
    def criar_linhas_importacao(
        payload: ImportLinhasBulkCreate,
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return import_export_service.create_import_lines_service(
            payload=payload,
            actor=actor,
            db=db,
            utcnow=utcnow,
            broadcast_update=broadcast_update,
        )

    @router.get("/imports/linhas", response_model=list[ImportLinhaOut])
    def listar_linhas_importacao(
        lote_id: int = Query(..., ge=1),
        limit: int = Query(default=500, ge=1, le=5000),
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return import_export_service.list_import_lines_service(lote_id=lote_id, limit=limit, actor=actor, db=db)

    @router.patch("/imports/lotes/{lote_id}/governanca", response_model=ImportLoteOut)
    def governar_lote_importacao(
        lote_id: int,
        payload: ImportGovernanceActionIn,
        actor: dict = Depends(_require_manager),
        db=Depends(get_db),
    ):
        return import_export_service.govern_import_lot_service(
            lote_id=lote_id,
            payload=payload,
            actor=actor,
            db=db,
            utcnow=utcnow,
            broadcast_update=broadcast_update,
        )

    @router.get("/imports/lotes/{lote_id}/governanca/logs", response_model=list[ImportGovernanceLogOut])
    def listar_logs_governanca_importacao(
        lote_id: int,
        limit: int = Query(default=50, ge=1, le=500),
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return import_export_service.list_import_governance_logs_service(
            lote_id=lote_id,
            limit=limit,
            actor=actor,
            db=db,
        )

    @router.post("/exports/logs")
    def criar_log_exportacao(
        payload: ExportLogCreate,
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return import_export_service.create_export_log_service(
            payload=payload,
            actor=actor,
            db=db,
            resolve_event_origin=resolve_event_origin,
            utcnow=utcnow,
            broadcast_update=broadcast_update,
        )

    @router.get("/exports/logs", response_model=list[ExportLogOut])
    def listar_logs_exportacao(
        limit: int = Query(default=50, ge=1, le=500),
        _actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return import_export_service.list_export_logs_service(limit=limit, db=db)

    @router.get("/audit")
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
        db=Depends(get_db),
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
            mask_history_pair=mask_history_pair,
        )

    @router.get("/support/threads", response_model=list[SupportThreadOut])
    def list_support_threads(
        limit: int = Query(default=80, ge=1, le=200),
        status: str | None = Query(default=None),
        categoria: str | None = Query(default=None),
        usuario: str | None = Query(default=None),
        q: str | None = Query(default=None),
        mine_only: bool = Query(default=False),
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
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

    @router.post("/support/threads", response_model=SupportThreadOut)
    def create_support_thread(
        payload: SupportThreadCreate,
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return support_service.create_support_thread_service(
            payload=payload,
            actor=actor,
            db=db,
            utcnow=utcnow,
            broadcast_update=broadcast_update,
        )

    @router.get("/support/threads/{thread_id}/messages", response_model=list[SupportMessageOut])
    def list_support_messages(
        thread_id: int,
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return support_service.list_support_messages_service(thread_id=thread_id, actor=actor, db=db)

    @router.post("/support/threads/{thread_id}/messages", response_model=SupportMessageOut)
    def create_support_message(
        thread_id: int,
        payload: SupportMessageCreate,
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return support_service.create_support_message_service(
            thread_id=thread_id,
            payload=payload,
            actor=actor,
            db=db,
            utcnow=utcnow,
            broadcast_update=broadcast_update,
        )

    @router.patch("/support/threads/{thread_id}/status", response_model=SupportThreadOut)
    def update_support_thread_status(
        thread_id: int,
        payload: SupportThreadStatusUpdate,
        actor: dict = Depends(_actor_from_headers),
        db=Depends(get_db),
    ):
        return support_service.update_support_thread_status_service(
            thread_id=thread_id,
            payload=payload,
            actor=actor,
            db=db,
            utcnow=utcnow,
            broadcast_update=broadcast_update,
        )

    return router
