from __future__ import annotations

from datetime import datetime
from typing import Callable

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import ExportLog, ImportLinha, ImportLote


def create_import_lot_service(
    *,
    payload,
    actor: dict,
    db: Session,
    resolve_event_origin: Callable[[str | None, dict | None, str], str],
    utcnow: Callable[[], datetime],
    broadcast_update: Callable[[str, int | None], None],
) -> dict:
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
        origem_evento=resolve_event_origin(payload.origem_evento, actor, "IMPORT"),
        usuario_id=actor.get("id"),
        usuario_nome=actor.get("name") or "",
        setor=actor.get("role") or "",
        created_at=utcnow(),
    )
    db.add(lote)
    db.commit()
    db.refresh(lote)
    broadcast_update("import_lote", lote.id)
    return {"ok": True, "id": lote.id}


def list_import_lots_service(*, limit: int, db: Session) -> list[ImportLote]:
    return db.query(ImportLote).order_by(ImportLote.created_at.desc(), ImportLote.id.desc()).limit(limit).all()


def create_import_lines_service(
    *,
    payload,
    db: Session,
    utcnow: Callable[[], datetime],
    broadcast_update: Callable[[str, int | None], None],
) -> dict:
    lote = db.get(ImportLote, payload.lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="lote de importacao nao encontrado")

    linhas = payload.linhas or []
    if not linhas:
        return {"ok": True, "inserted": 0}

    inserted = 0
    now = utcnow()
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
    broadcast_update("import_linha", lote.id)
    return {"ok": True, "inserted": inserted}


def list_import_lines_service(*, lote_id: int, limit: int, db: Session) -> list[ImportLinha]:
    return (
        db.query(ImportLinha)
        .filter(ImportLinha.lote_id == lote_id)
        .order_by(ImportLinha.ordem.asc(), ImportLinha.id.asc())
        .limit(limit)
        .all()
    )


def create_export_log_service(
    *,
    payload,
    actor: dict,
    db: Session,
    resolve_event_origin: Callable[[str | None, dict | None, str], str],
    utcnow: Callable[[], datetime],
    broadcast_update: Callable[[str, int | None], None],
) -> dict:
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
        origem_evento=resolve_event_origin(payload.origem_evento, actor, "EXPORT"),
        usuario_id=actor.get("id"),
        usuario_nome=actor.get("name") or "",
        setor=actor.get("role") or "",
        created_at=utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    broadcast_update("export_log", log.id)
    return {"ok": True, "id": log.id}


def list_export_logs_service(*, limit: int, db: Session) -> list[ExportLog]:
    return db.query(ExportLog).order_by(ExportLog.created_at.desc(), ExportLog.id.desc()).limit(limit).all()
