from __future__ import annotations

from datetime import datetime
from typing import Callable

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import DeputadoCountAdjustment, Emenda, Historico

DASHBOARD_ADJUSTMENT_SCOPE = "GLOBAL"
DASHBOARD_ADJUSTMENT_MANAGER_ROLES = {"PROGRAMADOR"}
DASHBOARD_DEPUTADO_COUNT_SOURCE = "BASE_ATUAL"
DASHBOARD_DEPUTADO_COUNT_NOTE = (
    "Contagem oficial considera emendas atuais da base consolidada "
    "e permite ajuste manual global auditado por PROGRAMADOR."
)


def _normalize_deputado_label(value: str | None) -> str:
    return " ".join(str(value or "").split()).strip()


def _normalize_deputado_key(value: str | None) -> str:
    return _normalize_deputado_label(value).lower()


def _find_adjustment_by_deputado_key(*, db: Session, deputado_key: str) -> DeputadoCountAdjustment | None:
    if not deputado_key:
        return None
    direct = (
        db.query(DeputadoCountAdjustment)
        .filter(func.lower(DeputadoCountAdjustment.deputado) == deputado_key)
        .first()
    )
    if direct:
        return direct
    # Fallback defensivo para dados legados com espacos inconsistentes.
    rows = db.query(DeputadoCountAdjustment).all()
    for row in rows:
        if _normalize_deputado_key(row.deputado) == deputado_key:
            return row
    return None


def _is_deputado_adjustment_manager(actor: dict | None) -> bool:
    return str((actor or {}).get("role") or "").strip().upper() in DASHBOARD_ADJUSTMENT_MANAGER_ROLES


def get_deputado_count_policy() -> dict:
    return {
        "origem_oficial": DASHBOARD_DEPUTADO_COUNT_SOURCE,
        "escopo_ajuste": DASHBOARD_ADJUSTMENT_SCOPE,
        "perfil_ajuste": "PROGRAMADOR",
        "observacao": DASHBOARD_DEPUTADO_COUNT_NOTE,
    }


def list_deputado_count_adjustments_service(
    *,
    db: Session,
) -> list[DeputadoCountAdjustment]:
    return (
        db.query(DeputadoCountAdjustment)
        .filter(DeputadoCountAdjustment.escopo == DASHBOARD_ADJUSTMENT_SCOPE)
        .order_by(DeputadoCountAdjustment.updated_at.desc(), DeputadoCountAdjustment.id.desc())
        .all()
    )


def upsert_deputado_count_adjustment_service(
    *,
    deputado: str,
    total_ajustado: int,
    motivo: str,
    actor: dict,
    db: Session,
    utcnow: Callable[[], datetime],
) -> DeputadoCountAdjustment:
    if not _is_deputado_adjustment_manager(actor):
        raise HTTPException(status_code=403, detail="apenas PROGRAMADOR pode ajustar contagem de deputado")

    deputado_value = _normalize_deputado_label(deputado)
    if not deputado_value:
        raise HTTPException(status_code=400, detail="deputado invalido")
    deputado_key = _normalize_deputado_key(deputado_value)
    motivo_value = str(motivo or "").strip()
    if len(motivo_value) < 3:
        raise HTTPException(status_code=400, detail="motivo invalido")
    total_value = max(int(total_ajustado or 0), 0)

    record = _find_adjustment_by_deputado_key(db=db, deputado_key=deputado_key)
    now = utcnow()
    if not record:
        record = DeputadoCountAdjustment(
            deputado=deputado_value,
            total_ajustado=total_value,
            escopo=DASHBOARD_ADJUSTMENT_SCOPE,
            motivo=motivo_value,
            usuario_id=actor.get("id"),
            usuario_nome=str(actor.get("name") or ""),
            setor=str(actor.get("role") or ""),
            created_at=now,
            updated_at=now,
        )
        db.add(record)
    else:
        record.total_ajustado = total_value
        record.motivo = motivo_value
        record.usuario_id = actor.get("id")
        record.usuario_nome = str(actor.get("name") or "")
        record.setor = str(actor.get("role") or "")
        record.updated_at = now

    db.commit()
    db.refresh(record)
    return record


def delete_deputado_count_adjustment_service(
    *,
    deputado: str,
    actor: dict,
    db: Session,
) -> dict:
    if not _is_deputado_adjustment_manager(actor):
        raise HTTPException(status_code=403, detail="apenas PROGRAMADOR pode remover ajuste de contagem")

    deputado_value = _normalize_deputado_label(deputado)
    if not deputado_value:
        raise HTTPException(status_code=400, detail="deputado invalido")
    deputado_key = _normalize_deputado_key(deputado_value)

    record = _find_adjustment_by_deputado_key(db=db, deputado_key=deputado_key)
    if not record:
        raise HTTPException(status_code=404, detail="ajuste de contagem nao encontrado")

    db.delete(record)
    db.commit()
    return {"ok": True, "deputado": deputado_value}


def build_dashboard_summary_service(
    *,
    ano: int | None,
    limite_deputados: int,
    db: Session,
) -> dict:
    base_query = db.query(Emenda).filter(Emenda.is_current.is_(True))
    if ano is not None:
        base_query = base_query.filter(Emenda.ano == ano)

    total_registros = int(base_query.count())

    soma_valores = base_query.with_entities(
        func.coalesce(func.sum(Emenda.valor_inicial), 0),
        func.coalesce(func.sum(Emenda.valor_atual), 0),
        func.max(Emenda.updated_at),
    ).one()
    total_valor_inicial = float(soma_valores[0] or 0)
    total_valor_atual = float(soma_valores[1] or 0)
    ultima_atualizacao = soma_valores[2]

    status_rows = (
        base_query.with_entities(Emenda.status_oficial, func.count(Emenda.id))
        .group_by(Emenda.status_oficial)
        .order_by(Emenda.status_oficial.asc())
        .all()
    )
    status_counts = [
        {
            "status": str(status or ""),
            "total": int(total or 0),
        }
        for status, total in status_rows
    ]

    all_deputados_rows = (
        base_query.with_entities(Emenda.deputado, func.count(Emenda.id))
        .filter(Emenda.deputado.isnot(None))
        .filter(Emenda.deputado != "")
        .group_by(Emenda.deputado)
        .all()
    )
    base_counts: dict[str, int] = {}
    base_labels: dict[str, str] = {}
    for deputado, total in all_deputados_rows:
        label = _normalize_deputado_label(deputado)
        key = _normalize_deputado_key(label)
        if not key:
            continue
        base_counts[key] = base_counts.get(key, 0) + int(total or 0)
        if key not in base_labels:
            base_labels[key] = label

    adjustment_rows = (
        db.query(DeputadoCountAdjustment)
        .filter(DeputadoCountAdjustment.escopo == DASHBOARD_ADJUSTMENT_SCOPE)
        .all()
    )
    adjustment_map: dict[str, DeputadoCountAdjustment] = {}
    adjustment_labels: dict[str, str] = {}
    for row in adjustment_rows:
        label = _normalize_deputado_label(row.deputado)
        key = _normalize_deputado_key(label)
        if not key:
            continue
        adjustment_map[key] = row
        adjustment_labels[key] = label

    deputados_rank = []
    deputado_keys = set(base_counts.keys()) | set(adjustment_map.keys())
    for deputado_key in deputado_keys:
        deputado_name = adjustment_labels.get(deputado_key) or base_labels.get(deputado_key) or deputado_key
        base_total = int(base_counts.get(deputado_key, 0))
        adjustment = adjustment_map.get(deputado_key)
        if adjustment:
            final_total = max(int(adjustment.total_ajustado or 0), 0)
            if base_total <= 0 and final_total <= 0:
                continue
            deputados_rank.append(
                {
                    "deputado": deputado_name,
                    "total": final_total,
                    "base_total": base_total,
                    "ajuste_manual": True,
                    "ajuste_motivo": str(adjustment.motivo or ""),
                    "ajustado_por": str(adjustment.usuario_nome or ""),
                    "ajustado_em": adjustment.updated_at,
                }
            )
            continue
        if base_total <= 0:
            continue
        deputados_rank.append(
            {
                "deputado": deputado_name,
                "total": base_total,
                "base_total": base_total,
                "ajuste_manual": False,
                "ajuste_motivo": None,
                "ajustado_por": None,
                "ajustado_em": None,
            }
        )

    deputados_rank.sort(key=lambda item: (-int(item["total"]), str(item["deputado"]).lower()))
    top_deputados = deputados_rank[:limite_deputados]

    latest_event = None
    latest_event_row = (
        db.query(Historico, Emenda.identificacao)
        .join(Emenda, Historico.emenda_id == Emenda.id)
        .filter(Emenda.is_current.is_(True))
        .filter(Emenda.ano == ano if ano is not None else True)
        .order_by(Historico.data_hora.desc(), Historico.id.desc())
        .first()
    )
    if latest_event_row:
        historico, identificacao = latest_event_row
        latest_event = {
            "tipo_evento": str(historico.tipo_evento or ""),
            "usuario_nome": str(historico.usuario_nome or ""),
            "setor": str(historico.setor or ""),
            "emenda_identificacao": str(identificacao or ""),
            "data_hora": historico.data_hora,
        }

    return {
        "ano_filtro": ano,
        "total_registros": total_registros,
        "total_valor_inicial": total_valor_inicial,
        "total_valor_atual": total_valor_atual,
        "ultima_atualizacao": ultima_atualizacao,
        "status_counts": status_counts,
        "top_deputados": top_deputados,
        "latest_event": latest_event,
        "contagem_deputado_policy": get_deputado_count_policy(),
    }
