from __future__ import annotations

from datetime import datetime
from typing import Callable

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..models import SupportMessage, SupportThread
from ..schemas import SUPPORT_CATEGORIES, SUPPORT_THREAD_STATUS

SUPPORT_MANAGER_ROLES = {"PROGRAMADOR"}


def is_support_manager(actor: dict | None) -> bool:
    return str((actor or {}).get("role") or "").strip().upper() in SUPPORT_MANAGER_ROLES


def _support_actor_matches_thread(thread: SupportThread, actor: dict | None) -> bool:
    if not thread or not actor:
        return False
    actor_id = actor.get("id")
    if actor_id is not None and thread.usuario_id is not None:
        try:
            return int(actor_id) == int(thread.usuario_id)
        except (TypeError, ValueError):
            actor_id = None
    actor_name = str(actor.get("name") or "").strip().lower()
    actor_role = str(actor.get("role") or "").strip().upper()
    return actor_name == str(thread.usuario_nome or "").strip().lower() and actor_role == str(thread.setor or "").strip().upper()


def ensure_support_thread_access(thread: SupportThread, actor: dict) -> None:
    if is_support_manager(actor):
        return
    if _support_actor_matches_thread(thread, actor):
        return
    raise HTTPException(status_code=403, detail="sem acesso a este chamado")


def _support_origin(actor: dict) -> str:
    return "SUPORTE" if is_support_manager(actor) else "USUARIO"


def _support_preview(message: str, limit: int = 220) -> str:
    clean = " ".join(str(message or "").split())
    if len(clean) <= limit:
        return clean
    return clean[: max(0, limit - 3)] + "..."


def _touch_support_thread(
    *,
    thread: SupportThread,
    actor: dict,
    message: str,
    utcnow: Callable[[], datetime],
    explicit_status: str | None = None,
) -> None:
    now = utcnow()
    thread.updated_at = now
    thread.last_message_at = now
    thread.last_actor_nome = str(actor.get("name") or "")
    thread.last_actor_role = str(actor.get("role") or "")
    thread.last_message_preview = _support_preview(message)
    if explicit_status:
        thread.status = explicit_status
        return
    if is_support_manager(actor):
        if thread.status != "FECHADO":
            thread.status = "RESPONDIDO"
    else:
        thread.status = "ABERTO"


def list_support_threads_service(
    *,
    limit: int,
    status: str | None,
    categoria: str | None,
    usuario: str | None,
    q: str | None,
    mine_only: bool,
    actor: dict,
    db: Session,
) -> list[SupportThread]:
    if not is_support_manager(actor):
        return []
    query = _build_support_threads_query(
        status=status,
        categoria=categoria,
        usuario=usuario,
        q=q,
        mine_only=mine_only,
        actor=actor,
        db=db,
    )
    return (
        query.order_by(SupportThread.last_message_at.desc(), SupportThread.id.desc())
        .limit(limit)
        .all()
    )


def _build_support_threads_query(
    *,
    status: str | None,
    categoria: str | None,
    usuario: str | None,
    q: str | None,
    mine_only: bool,
    actor: dict,
    db: Session,
):
    query = db.query(SupportThread)

    if not is_support_manager(actor) or mine_only:
        actor_id = actor.get("id")
        if actor_id is not None:
            query = query.filter(SupportThread.usuario_id == actor_id)
        else:
            query = query.filter(
                SupportThread.usuario_nome == str(actor.get("name") or ""),
                SupportThread.setor == str(actor.get("role") or ""),
            )

    if status:
        value = str(status).strip().upper()
        if value not in SUPPORT_THREAD_STATUS:
            raise HTTPException(status_code=400, detail="status invalido")
        query = query.filter(SupportThread.status == value)
    if categoria:
        value = str(categoria).strip().upper()
        if value not in SUPPORT_CATEGORIES:
            raise HTTPException(status_code=400, detail="categoria invalida")
        query = query.filter(SupportThread.categoria == value)
    if usuario:
        query = query.filter(SupportThread.usuario_nome.ilike(f"%{str(usuario).strip()}%"))
    if q:
        pattern = f"%{str(q).strip()}%"
        query = query.filter(
            or_(
                SupportThread.subject.ilike(pattern),
                SupportThread.last_message_preview.ilike(pattern),
                SupportThread.usuario_nome.ilike(pattern),
                SupportThread.setor.ilike(pattern),
            )
        )

    return query


def build_support_summary_service(
    *,
    status: str | None,
    categoria: str | None,
    usuario: str | None,
    q: str | None,
    mine_only: bool,
    actor: dict,
    db: Session,
) -> dict:
    if not is_support_manager(actor):
        return {
            "escopo": "request_only",
            "total_threads": 0,
            "status_counts": [],
            "categoria_counts": [],
            "latest_thread": None,
        }
    query = _build_support_threads_query(
        status=status,
        categoria=categoria,
        usuario=usuario,
        q=q,
        mine_only=mine_only,
        actor=actor,
        db=db,
    )

    total_threads = int(query.count())
    status_rows = (
        query.with_entities(SupportThread.status, func.count(SupportThread.id))
        .group_by(SupportThread.status)
        .order_by(func.count(SupportThread.id).desc(), SupportThread.status.asc())
        .all()
    )
    status_counts = [
        {
            "label": str(label or ""),
            "total": int(total or 0),
        }
        for label, total in status_rows
    ]

    categoria_rows = (
        query.with_entities(SupportThread.categoria, func.count(SupportThread.id))
        .group_by(SupportThread.categoria)
        .order_by(func.count(SupportThread.id).desc(), SupportThread.categoria.asc())
        .all()
    )
    categoria_counts = [
        {
            "label": str(label or ""),
            "total": int(total or 0),
        }
        for label, total in categoria_rows
    ]

    latest_thread = None
    latest_thread_row = (
        query.order_by(SupportThread.last_message_at.desc(), SupportThread.id.desc()).first()
    )
    if latest_thread_row:
        latest_thread = {
            "id": int(latest_thread_row.id),
            "subject": str(latest_thread_row.subject or ""),
            "categoria": str(latest_thread_row.categoria or ""),
            "status": str(latest_thread_row.status or ""),
            "usuario_nome": str(latest_thread_row.usuario_nome or ""),
            "setor": str(latest_thread_row.setor or ""),
            "last_actor_nome": str(latest_thread_row.last_actor_nome or ""),
            "last_actor_role": str(latest_thread_row.last_actor_role or ""),
            "updated_at": latest_thread_row.updated_at,
            "last_message_at": latest_thread_row.last_message_at,
        }

    effective_scope = "mine" if (not is_support_manager(actor) or mine_only) else "all"
    return {
        "escopo": effective_scope,
        "total_threads": total_threads,
        "status_counts": status_counts,
        "categoria_counts": categoria_counts,
        "latest_thread": latest_thread,
    }


def create_support_thread_service(
    *,
    payload,
    actor: dict,
    db: Session,
    utcnow: Callable[[], datetime],
    broadcast_update: Callable[[str, int | None], None],
) -> SupportThread:
    now = utcnow()
    thread = SupportThread(
        subject=str(payload.subject or "").strip(),
        categoria=str(payload.categoria or "OUTRO").strip().upper(),
        status="ABERTO",
        emenda_id=payload.emenda_id,
        usuario_id=actor.get("id"),
        usuario_nome=str(actor.get("name") or ""),
        setor=str(actor.get("role") or ""),
        last_actor_nome=str(actor.get("name") or ""),
        last_actor_role=str(actor.get("role") or ""),
        last_message_preview=_support_preview(payload.mensagem),
        created_at=now,
        updated_at=now,
        last_message_at=now,
    )
    db.add(thread)
    db.flush()

    message = SupportMessage(
        thread_id=thread.id,
        usuario_id=actor.get("id"),
        usuario_nome=str(actor.get("name") or ""),
        setor=str(actor.get("role") or ""),
        origem=_support_origin(actor),
        mensagem=str(payload.mensagem or "").strip(),
        created_at=now,
    )
    db.add(message)
    db.commit()
    db.refresh(thread)
    broadcast_update("support_thread", thread.id)
    return thread


def list_support_messages_service(*, thread_id: int, actor: dict, db: Session) -> list[SupportMessage]:
    if not is_support_manager(actor):
        return []
    thread = db.get(SupportThread, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="chamado nao encontrado")
    ensure_support_thread_access(thread, actor)
    return (
        db.query(SupportMessage)
        .filter(SupportMessage.thread_id == thread_id)
        .order_by(SupportMessage.created_at.asc(), SupportMessage.id.asc())
        .all()
    )


def create_support_message_service(
    *,
    thread_id: int,
    payload,
    actor: dict,
    db: Session,
    utcnow: Callable[[], datetime],
    broadcast_update: Callable[[str, int | None], None],
) -> SupportMessage:
    if not is_support_manager(actor):
        raise HTTPException(status_code=403, detail="apenas PROGRAMADOR pode responder chamados")
    thread = db.get(SupportThread, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="chamado nao encontrado")
    ensure_support_thread_access(thread, actor)

    now = utcnow()
    message = SupportMessage(
        thread_id=thread.id,
        usuario_id=actor.get("id"),
        usuario_nome=str(actor.get("name") or ""),
        setor=str(actor.get("role") or ""),
        origem=_support_origin(actor),
        mensagem=str(payload.mensagem or "").strip(),
        created_at=now,
    )
    db.add(message)
    _touch_support_thread(thread=thread, actor=actor, message=message.mensagem, utcnow=utcnow)
    db.commit()
    db.refresh(message)
    broadcast_update("support_thread", thread.id)
    return message


def update_support_thread_status_service(
    *,
    thread_id: int,
    payload,
    actor: dict,
    db: Session,
    utcnow: Callable[[], datetime],
    broadcast_update: Callable[[str, int | None], None],
) -> SupportThread:
    if not is_support_manager(actor):
        raise HTTPException(status_code=403, detail="apenas suporte pode alterar status do chamado")
    thread = db.get(SupportThread, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="chamado nao encontrado")

    _touch_support_thread(
        thread=thread,
        actor=actor,
        message=f"Status do chamado definido para {payload.status}.",
        utcnow=utcnow,
        explicit_status=payload.status,
    )
    db.commit()
    db.refresh(thread)
    broadcast_update("support_thread", thread.id)
    return thread
