from __future__ import annotations

from datetime import datetime
from typing import Callable

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..models import SupportMessage, SupportThread
from ..schemas import SUPPORT_CATEGORIES, SUPPORT_THREAD_STATUS

SUPPORT_MANAGER_ROLES = {"APG", "SUPERVISAO", "POWERBI", "PROGRAMADOR"}


def is_support_manager(actor: dict | None) -> bool:
    return str((actor or {}).get("role") or "").strip().upper() in SUPPORT_MANAGER_ROLES


def _support_actor_matches_thread(thread: SupportThread, actor: dict | None) -> bool:
    if not thread or not actor:
        return False
    actor_id = actor.get("id")
    if actor_id is not None and thread.usuario_id is not None:
        try:
            return int(actor_id) == int(thread.usuario_id)
        except Exception:
            pass
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

    return (
        query.order_by(SupportThread.last_message_at.desc(), SupportThread.id.desc())
        .limit(limit)
        .all()
    )


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
