from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import Emenda, Historico


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

    top_deputados_rows = (
        base_query.with_entities(Emenda.deputado, func.count(Emenda.id))
        .filter(Emenda.deputado.isnot(None))
        .filter(Emenda.deputado != "")
        .group_by(Emenda.deputado)
        .order_by(func.count(Emenda.id).desc(), Emenda.deputado.asc())
        .limit(limite_deputados)
        .all()
    )
    top_deputados = [
        {
            "deputado": str(deputado or "-"),
            "total": int(total or 0),
        }
        for deputado, total in top_deputados_rows
    ]

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
    }
