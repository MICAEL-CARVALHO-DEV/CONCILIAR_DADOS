from __future__ import annotations

from datetime import datetime, timedelta
import re
import unicodedata
from typing import Callable

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from ..core.dependencies import OWNER_ROLE
from ..core.security import _mask_history_pair, _utcnow
from ..models import Emenda, EmendaLock, Historico

EDITOR_ROLES = {"APG", "SUPERVISAO", "POWERBI", "PROGRAMADOR"}
EDIT_LOCK_TTL_SECONDS = 90
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
EMENDA_EDITABLE_FIELDS = {
    "ano": "ano",
    "identificacao": "identificacao",
    "cod_subfonte": "cod_subfonte",
    "deputado": "deputado",
    "cod_uo": "cod_uo",
    "sigla_uo": "sigla_uo",
    "cod_orgao": "cod_orgao",
    "cod_acao": "cod_acao",
    "descricao_acao": "descricao_acao",
    "objetivo_epi": "objetivo_epi",
    "plan_a": "plan_a",
    "plan_b": "plan_b",
    "municipio": "municipio",
    "valor_inicial": "valor_inicial",
    "valor_atual": "valor_atual",
    "processo_sei": "processo_sei",
}
EMENDA_EDITABLE_FIELD_ALIASES = {
    "ano": "ano",
    "identificacao": "identificacao",
    "identificacao_da_emenda": "identificacao",
    "cod_subfonte": "cod_subfonte",
    "codigo_subfonte": "cod_subfonte",
    "deputado": "deputado",
    "cod_uo": "cod_uo",
    "codigo_uo": "cod_uo",
    "sigla_uo": "sigla_uo",
    "sigla_da_uo": "sigla_uo",
    "cod_orgao": "cod_orgao",
    "codigo_orgao": "cod_orgao",
    "cod_acao": "cod_acao",
    "codacao": "cod_acao",
    "codigo_acao": "cod_acao",
    "codigo_da_acao": "cod_acao",
    "descricao_acao": "descricao_acao",
    "descricao_da_acao": "descricao_acao",
    "descritor_da_acao": "descricao_acao",
    "objetivo_epi": "objetivo_epi",
    "objetivoepi": "objetivo_epi",
    "objetivo": "objetivo_epi",
    "objetivo_de_epi": "objetivo_epi",
    "plan_a": "plan_a",
    "plano_a": "plan_a",
    "planoa": "plan_a",
    "plano_a_acao": "plan_a",
    "plan_b": "plan_b",
    "plano_b": "plan_b",
    "planob": "plan_b",
    "plano_b_acao": "plan_b",
    "municipio": "municipio",
    "valor_inicial": "valor_inicial",
    "valor_inicial_epi": "valor_inicial",
    "valor_atual": "valor_atual",
    "valor_atual_epi": "valor_atual",
    "processo_sei": "processo_sei",
    "processo": "processo_sei",
}


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


def _emenda_row_version(emenda: Emenda) -> int:
    raw = int(emenda.row_version or 1)
    return raw if raw > 0 else 1


def _raise_row_version_conflict(emenda: Emenda, expected: int | None, action: str) -> None:
    raise HTTPException(
        status_code=409,
        detail={
            "code": "row_version_conflict",
            "message": "conflito de atualizacao: registro foi alterado por outro usuario",
            "action": action,
            "expected_row_version": int(expected or 0),
            "current_row_version": _emenda_row_version(emenda),
            "current_updated_at": (emenda.updated_at.isoformat() + "Z") if emenda.updated_at else "",
        },
    )


def _assert_row_version_match(emenda: Emenda, expected: int | None, action: str) -> None:
    if expected is None:
        return
    current = _emenda_row_version(emenda)
    if int(expected) != current:
        _raise_row_version_conflict(emenda, expected, action)


def _bump_row_version(emenda: Emenda) -> None:
    emenda.row_version = _emenda_row_version(emenda) + 1


def _actor_can_edit_records(actor: dict | None) -> bool:
    role = str((actor or {}).get("role") or "").strip().upper()
    return role in EDITOR_ROLES


def _lock_expires_at(now: datetime | None = None) -> datetime:
    base = now or _utcnow()
    return base + timedelta(seconds=EDIT_LOCK_TTL_SECONDS)


def _get_valid_emenda_lock(db: Session, emenda_id: int) -> EmendaLock | None:
    lock = db.get(EmendaLock, emenda_id)
    if not lock:
        return None

    now = _utcnow()
    if lock.expires_at and lock.expires_at <= now:
        return None
    return lock


def _lock_payload(
    emenda_id: int,
    lock: EmendaLock | None,
    actor: dict | None,
    message: str = "",
) -> dict:
    actor_id = int((actor or {}).get("id") or 0)
    is_owner = bool(lock and actor_id > 0 and int(lock.usuario_id or 0) == actor_id)
    can_edit_role = _actor_can_edit_records(actor)
    can_edit = can_edit_role and (lock is None or is_owner)

    return {
        "emenda_id": emenda_id,
        "locked": bool(lock),
        "owner_user_id": (int(lock.usuario_id) if lock and lock.usuario_id is not None else None),
        "owner_user_name": str(lock.usuario_nome or "") if lock else "",
        "owner_user_role": str(lock.setor or "") if lock else "",
        "acquired_at": (lock.acquired_at if lock else None),
        "heartbeat_at": (lock.heartbeat_at if lock else None),
        "expires_at": (lock.expires_at if lock else None),
        "is_owner": is_owner,
        "can_edit": can_edit,
        "message": message,
    }


def _upsert_emenda_lock(db: Session, emenda_id: int, actor: dict, now: datetime | None = None) -> EmendaLock:
    at = now or _utcnow()
    lock = db.get(EmendaLock, emenda_id)
    if not lock:
        lock = EmendaLock(
            emenda_id=emenda_id,
            usuario_id=actor.get("id"),
            usuario_nome=str(actor.get("name") or ""),
            setor=str(actor.get("role") or ""),
            acquired_at=at,
            heartbeat_at=at,
            expires_at=_lock_expires_at(at),
        )
        db.add(lock)
        db.flush()
        return lock

    lock.usuario_id = actor.get("id")
    lock.usuario_nome = str(actor.get("name") or "")
    lock.setor = str(actor.get("role") or "")
    lock.acquired_at = at
    lock.heartbeat_at = at
    lock.expires_at = _lock_expires_at(at)
    db.add(lock)
    db.flush()
    return lock


def _acquire_emenda_lock(db: Session, emenda_id: int, actor: dict, force: bool = False) -> dict:
    lock = _get_valid_emenda_lock(db, emenda_id)
    if not _actor_can_edit_records(actor):
        return _lock_payload(
            emenda_id,
            lock,
            actor,
            message="Perfil sem permissao de edicao. Modo leitura.",
        )

    actor_id = int(actor.get("id") or 0)
    now = _utcnow()
    if lock:
        lock_owner_id = int(lock.usuario_id or 0)
        if lock_owner_id == actor_id:
            lock.heartbeat_at = now
            lock.expires_at = _lock_expires_at(now)
            db.add(lock)
            db.flush()
            return _lock_payload(emenda_id, lock, actor, message="Lock renovado.")

        if not force:
            return _lock_payload(
                emenda_id,
                lock,
                actor,
                message="Emenda em edicao por outro usuario. Modo leitura ativo.",
            )

        if str(actor.get("role") or "").strip().upper() != OWNER_ROLE:
            raise HTTPException(status_code=403, detail="somente PROGRAMADOR pode forcar lock")

    new_lock = _upsert_emenda_lock(db, emenda_id, actor, now)
    return _lock_payload(emenda_id, new_lock, actor, message="Lock adquirido.")


def _renew_emenda_lock(db: Session, emenda_id: int, actor: dict) -> dict:
    return _acquire_emenda_lock(db, emenda_id, actor, force=False)


def _release_emenda_lock(db: Session, emenda_id: int, actor: dict) -> dict:
    lock = _get_valid_emenda_lock(db, emenda_id)
    if not lock:
        return _lock_payload(emenda_id, None, actor, message="Sem lock ativo.")

    actor_id = int(actor.get("id") or 0)
    lock_owner_id = int(lock.usuario_id or 0)
    actor_role = str(actor.get("role") or "").strip().upper()
    can_force = actor_role == OWNER_ROLE

    if actor_id != lock_owner_id and not can_force:
        return _lock_payload(
            emenda_id,
            lock,
            actor,
            message="Lock pertence a outro usuario. Sem permissao para liberar.",
        )

    db.delete(lock)
    db.flush()
    return _lock_payload(emenda_id, None, actor, message="Lock liberado.")


def _assert_edit_lock_or_raise(db: Session, emenda_id: int, actor: dict, action: str) -> None:
    if not _actor_can_edit_records(actor):
        raise HTTPException(status_code=403, detail="perfil sem permissao de edicao")

    lock = _get_valid_emenda_lock(db, emenda_id)
    actor_id = int(actor.get("id") or 0)
    now = _utcnow()

    if lock:
        lock_owner_id = int(lock.usuario_id or 0)
        if lock_owner_id != actor_id:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "edit_lock_conflict",
                    "message": "emenda em edicao por outro usuario (modo leitura)",
                    "action": action,
                    "lock_owner_user_id": int(lock.usuario_id) if lock.usuario_id is not None else None,
                    "lock_owner_name": str(lock.usuario_nome or ""),
                    "lock_owner_role": str(lock.setor or ""),
                    "lock_expires_at": (lock.expires_at.isoformat() + "Z") if lock.expires_at else "",
                },
            )
        lock.heartbeat_at = now
        lock.expires_at = _lock_expires_at(now)
        db.add(lock)
        db.flush()
        return

    _upsert_emenda_lock(db, emenda_id, actor, now)


def _normalize_edit_field_name(raw_field: str | None) -> str:
    raw = (raw_field or "").strip().lower()
    if not raw:
        return ""
    normalized = unicodedata.normalize("NFD", raw)
    normalized = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    normalized = re.sub(r"[^a-z0-9]+", "_", normalized).strip("_")
    return normalized


def _resolve_emenda_edit_field(raw_field: str | None) -> str:
    normalized = _normalize_edit_field_name(raw_field)
    if not normalized:
        return ""
    if normalized in EMENDA_EDITABLE_FIELDS:
        return normalized
    return EMENDA_EDITABLE_FIELD_ALIASES.get(normalized, "")


def _apply_emenda_field_edit(emenda: Emenda, field_name: str, raw_value: str | None) -> None:
    value = (raw_value or "").strip()
    if field_name == "ano":
        try:
            emenda.ano = int(value or 0)
        except ValueError as err:
            raise HTTPException(status_code=400, detail="valor invalido para campo ano") from err
        if emenda.ano <= 0:
            raise HTTPException(status_code=400, detail="valor invalido para campo ano")
        return

    if field_name in {"valor_inicial", "valor_atual"}:
        if not value:
            setattr(emenda, field_name, 0)
            return
        try:
            numeric = float(value.replace(".", "").replace(",", ".")) if value.count(",") == 1 and value.count(".") > 1 else float(value.replace(",", "."))
        except ValueError as err:
            raise HTTPException(status_code=400, detail=f"valor invalido para campo {field_name}") from err
        setattr(emenda, field_name, numeric)
        return

    setattr(emenda, field_name, value)


def list_emendas_service(
    *,
    db: Session,
    ano: int | None = None,
    municipio: str | None = None,
    deputado: str | None = None,
    q: str | None = None,
    include_old: bool = False,
):
    query = db.query(Emenda).options(selectinload(Emenda.historicos))

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
                Emenda.objetivo_epi.ilike(needle),
                Emenda.plan_a.ilike(needle),
                Emenda.plan_b.ilike(needle),
            )
        )

    emendas = query.order_by(Emenda.updated_at.desc(), Emenda.id.desc()).all()
    return [_serialize_emenda_snapshot(item) for item in emendas]


def _serialize_historico_event(item: Historico) -> dict:
    return {
        "at": item.data_hora.isoformat() + "Z" if item.data_hora else "",
        "actor_user": str(item.usuario_nome or ""),
        "actor_role": str(item.setor or ""),
        "type": str(item.tipo_evento or ""),
        "field": str(item.campo_alterado or ""),
        "from": item.valor_antigo or "",
        "to": item.valor_novo or "",
        "note": item.motivo or "",
    }


def _serialize_emenda_snapshot(emenda: Emenda) -> dict:
    eventos = sorted(list(emenda.historicos or []), key=lambda item: (item.data_hora or datetime.min), reverse=True)
    return {
        "id": emenda.id,
        "id_interno": emenda.id_interno,
        "ano": emenda.ano,
        "identificacao": emenda.identificacao,
        "cod_subfonte": emenda.cod_subfonte or "",
        "deputado": emenda.deputado or "",
        "cod_uo": emenda.cod_uo or "",
        "sigla_uo": emenda.sigla_uo or "",
        "cod_orgao": emenda.cod_orgao or "",
        "cod_acao": emenda.cod_acao or "",
        "descricao_acao": emenda.descricao_acao or "",
        "objetivo_epi": emenda.objetivo_epi or "",
        "plan_a": emenda.plan_a or "",
        "plan_b": emenda.plan_b or "",
        "municipio": emenda.municipio or "",
        "valor_inicial": float(emenda.valor_inicial or 0),
        "valor_atual": float(emenda.valor_atual or 0),
        "processo_sei": emenda.processo_sei or "",
        "status_oficial": emenda.status_oficial or "",
        "parent_id": emenda.parent_id,
        "version": int(emenda.version or 1),
        "row_version": _emenda_row_version(emenda),
        "is_current": bool(emenda.is_current),
        "created_at": emenda.created_at,
        "updated_at": emenda.updated_at,
        "eventos": [_serialize_historico_event(item) for item in eventos],
    }


def obter_emenda_service(*, emenda_id: int, db: Session) -> Emenda:
    emenda = db.get(Emenda, emenda_id)
    if not emenda:
        raise HTTPException(status_code=404, detail="Emenda nao encontrada")
    return emenda


def obter_lock_emenda_service(*, emenda_id: int, actor: dict, db: Session) -> dict:
    obter_emenda_service(emenda_id=emenda_id, db=db)
    lock = _get_valid_emenda_lock(db, emenda_id)
    message = "Sem lock ativo." if not lock else "Lock ativo."
    return _lock_payload(emenda_id, lock, actor, message=message)


def adquirir_lock_emenda_service(*, emenda_id: int, actor: dict, force: bool, db: Session) -> dict:
    obter_emenda_service(emenda_id=emenda_id, db=db)
    data = _acquire_emenda_lock(db, emenda_id, actor, force=bool(force))
    db.commit()
    return data


def renovar_lock_emenda_service(*, emenda_id: int, actor: dict, db: Session) -> dict:
    obter_emenda_service(emenda_id=emenda_id, db=db)
    data = _renew_emenda_lock(db, emenda_id, actor)
    db.commit()
    return data


def liberar_lock_emenda_service(*, emenda_id: int, actor: dict, db: Session) -> dict:
    obter_emenda_service(emenda_id=emenda_id, db=db)
    data = _release_emenda_lock(db, emenda_id, actor)
    db.commit()
    return data


def criar_emenda_service(
    *,
    payload: EmendaCreate,
    actor: dict,
    event_origin: str,
    db: Session,
    broadcast_update: Callable[[str, int | None], None],
) -> Emenda:
    id_interno = (payload.id_interno or "").strip()
    if not id_interno:
        # Gera ID automatico: EPI-ANO-MAN-COUNT
        count = db.query(Emenda).filter(Emenda.ano == payload.ano).count()
        id_interno = f"EPI-{payload.ano}-MAN-{count + 1:04d}"
        
    exists = db.query(Emenda).filter(Emenda.id_interno == id_interno).first()
    if exists:
        # Se o sequencial falhar (concorrencia), usa timestamp
        if not payload.id_interno:
            id_interno = f"EPI-{payload.ano}-MAN-{int(datetime.now().timestamp())}"
        else:
            raise HTTPException(status_code=409, detail="id_interno ja existe")

    now = _utcnow()
    emenda = Emenda(
        id_interno=id_interno,
        ano=payload.ano,
        identificacao=payload.identificacao,
        cod_subfonte=payload.cod_subfonte,
        deputado=payload.deputado,
        cod_uo=payload.cod_uo,
        sigla_uo=payload.sigla_uo,
        cod_orgao=payload.cod_orgao,
        cod_acao=payload.cod_acao,
        descricao_acao=payload.descricao_acao,
        objetivo_epi=payload.objetivo_epi,
        plan_a=payload.plan_a,
        plan_b=payload.plan_b,
        municipio=payload.municipio,
        valor_inicial=payload.valor_inicial,
        valor_atual=payload.valor_atual,
        processo_sei=payload.processo_sei,
        status_oficial=payload.status_oficial or "Sem marcacoes",
        parent_id=None,
        version=1,
        row_version=1,
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
            tipo_evento="CRIACAO_MANUAL",
            origem_evento=event_origin,
            motivo="Criacao manual via interface.",
        )
    )
    db.commit()
    db.refresh(emenda)
    broadcast_update("emenda", emenda.id)
    return emenda


def alterar_status_oficial_service(
    *,
    emenda_id: int,
    payload,
    actor: dict,
    event_origin: str,
    db: Session,
    broadcast_update: Callable[[str, int | None], None],
) -> dict:
    emenda = obter_emenda_service(emenda_id=emenda_id, db=db)
    _assert_edit_lock_or_raise(db, emenda_id, actor, "status_oficial")
    _assert_row_version_match(emenda, payload.expected_row_version, "status_oficial")

    anterior = emenda.status_oficial
    if anterior == payload.novo_status:
        db.commit()
        return {
            "ok": True,
            "changed": False,
            "row_version": _emenda_row_version(emenda),
            "updated_at": (emenda.updated_at.isoformat() + "Z") if emenda.updated_at else "",
        }

    _validate_status_transition(anterior, payload.novo_status)

    emenda.status_oficial = payload.novo_status
    _bump_row_version(emenda)
    emenda.updated_at = _utcnow()
    old_value_masked, new_value_masked = _mask_history_pair("status_oficial", anterior, payload.novo_status)

    db.add(
        Historico(
            emenda_id=emenda.id,
            usuario_id=actor["id"],
            usuario_nome=actor["name"],
            setor=actor["role"],
            tipo_evento="OFFICIAL_STATUS",
            origem_evento=event_origin,
            campo_alterado="status_oficial",
            valor_antigo=old_value_masked,
            valor_novo=new_value_masked,
            motivo=payload.motivo,
        )
    )
    db.commit()
    db.refresh(emenda)
    broadcast_update("emenda", emenda.id)
    return {
        "ok": True,
        "row_version": _emenda_row_version(emenda),
        "updated_at": (emenda.updated_at.isoformat() + "Z") if emenda.updated_at else "",
    }


def adicionar_evento_service(
    *,
    emenda_id: int,
    payload,
    actor: dict,
    event_origin: str,
    db: Session,
    broadcast_update: Callable[[str, int | None], None],
) -> dict:
    emenda = obter_emenda_service(emenda_id=emenda_id, db=db)

    _assert_edit_lock_or_raise(db, emenda_id, actor, "evento")
    _assert_row_version_match(emenda, payload.expected_row_version, "evento")
    if payload.tipo_evento == "OFFICIAL_STATUS":
        raise HTTPException(status_code=400, detail="Use /status para status oficial")

    editable_field = ""
    if payload.tipo_evento == "EDIT_FIELD":
        editable_field = _resolve_emenda_edit_field(payload.campo_alterado)
        if editable_field == "status_oficial":
            raise HTTPException(status_code=400, detail="Use /status para status oficial")
        if editable_field:
            _apply_emenda_field_edit(emenda, editable_field, payload.valor_novo)

    history_field = editable_field or payload.campo_alterado
    old_value_masked, new_value_masked = _mask_history_pair(history_field, payload.valor_antigo, payload.valor_novo)

    db.add(
        Historico(
            emenda_id=emenda.id,
            usuario_id=actor["id"],
            usuario_nome=actor["name"],
            setor=actor["role"],
            tipo_evento=payload.tipo_evento,
            origem_evento=event_origin,
            campo_alterado=history_field,
            valor_antigo=old_value_masked,
            valor_novo=new_value_masked,
            motivo=payload.motivo,
        )
    )
    _bump_row_version(emenda)
    emenda.updated_at = _utcnow()
    db.commit()
    db.refresh(emenda)
    broadcast_update("emenda", emenda.id)
    return {
        "ok": True,
        "row_version": _emenda_row_version(emenda),
        "updated_at": (emenda.updated_at.isoformat() + "Z") if emenda.updated_at else "",
    }


def versionar_emenda_service(
    *,
    emenda_id: int,
    payload,
    actor: dict,
    event_origin: str,
    db: Session,
    next_versioned_id: Callable[[str, int, Session], str],
    broadcast_update: Callable[[str, int | None], None],
) -> Emenda:
    origem = obter_emenda_service(emenda_id=emenda_id, db=db)

    _assert_edit_lock_or_raise(db, emenda_id, actor, "versionar")
    _assert_row_version_match(origem, payload.expected_row_version, "versionar")

    now = _utcnow()
    next_version = int(origem.version or 1) + 1

    origem.is_current = False
    _bump_row_version(origem)
    origem.updated_at = now

    novo_id_interno = next_versioned_id(origem.id_interno, next_version, db)

    nova = Emenda(
        id_interno=novo_id_interno,
        ano=payload.ano if payload.ano is not None else origem.ano,
        identificacao=payload.identificacao if payload.identificacao is not None else origem.identificacao,
        cod_subfonte=payload.cod_subfonte if payload.cod_subfonte is not None else origem.cod_subfonte,
        deputado=payload.deputado if payload.deputado is not None else origem.deputado,
        cod_uo=payload.cod_uo if payload.cod_uo is not None else origem.cod_uo,
        sigla_uo=payload.sigla_uo if payload.sigla_uo is not None else origem.sigla_uo,
        cod_orgao=payload.cod_orgao if payload.cod_orgao is not None else origem.cod_orgao,
        cod_acao=payload.cod_acao if payload.cod_acao is not None else origem.cod_acao,
        descricao_acao=payload.descricao_acao if payload.descricao_acao is not None else origem.descricao_acao,
        objetivo_epi=payload.objetivo_epi if payload.objetivo_epi is not None else origem.objetivo_epi,
        plan_a=payload.plan_a if payload.plan_a is not None else origem.plan_a,
        plan_b=payload.plan_b if payload.plan_b is not None else origem.plan_b,
        municipio=payload.municipio if payload.municipio is not None else origem.municipio,
        valor_inicial=payload.valor_inicial if payload.valor_inicial is not None else origem.valor_inicial,
        valor_atual=payload.valor_atual if payload.valor_atual is not None else origem.valor_atual,
        processo_sei=payload.processo_sei if payload.processo_sei is not None else origem.processo_sei,
        status_oficial=origem.status_oficial,
        parent_id=origem.id,
        version=next_version,
        row_version=1,
        is_current=True,
        created_at=now,
        updated_at=now,
    )
    db.add(nova)
    db.flush()

    reason = (payload.motivo or "").strip() or "Nova versao"
    old_value_masked, new_value_masked = _mask_history_pair("version", str(origem.version), str(nova.version))

    db.add(
        Historico(
            emenda_id=nova.id,
            usuario_id=actor["id"],
            usuario_nome=actor["name"],
            setor=actor["role"],
            tipo_evento="VERSIONAR",
            origem_evento=event_origin,
            campo_alterado="version",
            valor_antigo=old_value_masked,
            valor_novo=new_value_masked,
            motivo=reason,
        )
    )

    db.commit()
    db.refresh(nova)
    broadcast_update("emenda", nova.id)
    return nova
