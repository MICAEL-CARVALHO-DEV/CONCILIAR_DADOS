from __future__ import annotations

from datetime import datetime
from typing import Callable

from sqlalchemy import distinct, func, or_
from sqlalchemy.orm import Session

from ..models import Emenda, Historico


def _normalize_loose_text(value: str | None) -> str:
    return str(value or "").strip().lower()


def _apply_audit_filters(
    query,
    *,
    ano: int | None,
    mes: int | None,
    objetivo_epi: str | None,
    usuario: str | None,
    setor: str | None,
    tipo_evento: str | None,
    origem_evento: str | None,
    q: str | None,
):
    if ano is not None:
        start = datetime(ano, mes or 1, 1)
        if mes is not None:
            end = datetime(ano + 1, 1, 1) if mes == 12 else datetime(ano, mes + 1, 1)
        else:
            end = datetime(ano + 1, 1, 1)
        query = query.filter(Historico.data_hora >= start, Historico.data_hora < end)

    if objetivo_epi:
        query = query.filter(Emenda.objetivo_epi.ilike(f"%{objetivo_epi.strip()}%"))
    if usuario:
        query = query.filter(func.lower(func.trim(Historico.usuario_nome)) == _normalize_loose_text(usuario))
    if setor:
        query = query.filter(func.upper(func.trim(Historico.setor)) == str(setor).strip().upper())
    if tipo_evento:
        query = query.filter(func.upper(func.trim(Historico.tipo_evento)) == str(tipo_evento).strip().upper())
    if origem_evento:
        query = query.filter(func.upper(func.trim(Historico.origem_evento)) == str(origem_evento).strip().upper())
    if q:
        pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Historico.usuario_nome.ilike(pattern),
                Historico.setor.ilike(pattern),
                Historico.tipo_evento.ilike(pattern),
                Historico.origem_evento.ilike(pattern),
                Historico.campo_alterado.ilike(pattern),
                Historico.valor_antigo.ilike(pattern),
                Historico.valor_novo.ilike(pattern),
                Historico.motivo.ilike(pattern),
                Emenda.identificacao.ilike(pattern),
                Emenda.deputado.ilike(pattern),
                Emenda.municipio.ilike(pattern),
                Emenda.cod_acao.ilike(pattern),
                Emenda.descricao_acao.ilike(pattern),
                Emenda.objetivo_epi.ilike(pattern),
            )
        )

    return query


def list_audit_log_service(
    *,
    limit: int,
    ano: int | None,
    mes: int | None,
    objetivo_epi: str | None,
    usuario: str | None,
    setor: str | None,
    tipo_evento: str | None,
    origem_evento: str | None,
    q: str | None,
    db: Session,
    mask_history_pair: Callable[[str, str, str], tuple[str, str]],
) -> list[dict]:
    query = db.query(Historico, Emenda).join(Emenda, Historico.emenda_id == Emenda.id)
    query = _apply_audit_filters(
        query,
        ano=ano,
        mes=mes,
        objetivo_epi=objetivo_epi,
        usuario=usuario,
        setor=setor,
        tipo_evento=tipo_evento,
        origem_evento=origem_evento,
        q=q,
    )

    rows = query.order_by(Historico.data_hora.desc(), Historico.id.desc()).limit(limit).all()
    response: list[dict] = []
    for hist, emenda in rows:
        old_value_masked, new_value_masked = mask_history_pair(hist.campo_alterado, hist.valor_antigo, hist.valor_novo)
        response.append(
            {
                "id": hist.id,
                "emenda_id": hist.emenda_id,
                "emenda_identificacao": emenda.identificacao,
                "emenda_ano": emenda.ano,
                "emenda_municipio": emenda.municipio,
                "emenda_deputado": emenda.deputado,
                "emenda_objetivo_epi": emenda.objetivo_epi,
                "usuario_id": hist.usuario_id,
                "usuario_nome": hist.usuario_nome,
                "setor": hist.setor,
                "tipo_evento": hist.tipo_evento,
                "origem_evento": hist.origem_evento,
                "campo_alterado": hist.campo_alterado,
                "valor_antigo": old_value_masked,
                "valor_novo": new_value_masked,
                "motivo": hist.motivo,
                "data_hora": hist.data_hora,
            }
        )
    return response


def build_audit_summary_service(
    *,
    ano: int | None,
    mes: int | None,
    objetivo_epi: str | None,
    usuario: str | None,
    setor: str | None,
    tipo_evento: str | None,
    origem_evento: str | None,
    q: str | None,
    limite_usuarios: int,
    db: Session,
) -> dict:
    base_query = db.query(Historico, Emenda).join(Emenda, Historico.emenda_id == Emenda.id)
    base_query = _apply_audit_filters(
        base_query,
        ano=ano,
        mes=mes,
        objetivo_epi=objetivo_epi,
        usuario=usuario,
        setor=setor,
        tipo_evento=tipo_evento,
        origem_evento=origem_evento,
        q=q,
    )

    total_eventos, total_emendas_unicas = (
        base_query.with_entities(
            func.count(Historico.id),
            func.count(distinct(Historico.emenda_id)),
        ).one()
    )

    tipo_rows = (
        base_query.with_entities(Historico.tipo_evento, func.count(Historico.id))
        .group_by(Historico.tipo_evento)
        .order_by(func.count(Historico.id).desc(), Historico.tipo_evento.asc())
        .all()
    )
    tipo_evento_counts = [
        {
            "label": str(label or ""),
            "total": int(total or 0),
        }
        for label, total in tipo_rows
    ]

    origem_rows = (
        base_query.with_entities(Historico.origem_evento, func.count(Historico.id))
        .group_by(Historico.origem_evento)
        .order_by(func.count(Historico.id).desc(), Historico.origem_evento.asc())
        .all()
    )
    origem_evento_counts = [
        {
            "label": str(label or ""),
            "total": int(total or 0),
        }
        for label, total in origem_rows
    ]

    setor_rows = (
        base_query.with_entities(Historico.setor, func.count(Historico.id))
        .group_by(Historico.setor)
        .order_by(func.count(Historico.id).desc(), Historico.setor.asc())
        .all()
    )
    setor_counts = [
        {
            "label": str(label or ""),
            "total": int(total or 0),
        }
        for label, total in setor_rows
    ]

    top_usuario_rows = (
        base_query.with_entities(Historico.usuario_nome, Historico.setor, func.count(Historico.id))
        .group_by(Historico.usuario_nome, Historico.setor)
        .order_by(func.count(Historico.id).desc(), Historico.usuario_nome.asc())
        .limit(limite_usuarios)
        .all()
    )
    top_usuarios = [
        {
            "usuario_nome": str(usuario_nome or ""),
            "setor": str(setor_nome or ""),
            "total": int(total or 0),
        }
        for usuario_nome, setor_nome, total in top_usuario_rows
    ]

    latest_event = None
    latest_row = (
        base_query.with_entities(Historico, Emenda.identificacao)
        .order_by(Historico.data_hora.desc(), Historico.id.desc())
        .first()
    )
    if latest_row:
        historico, identificacao = latest_row
        latest_event = {
            "tipo_evento": str(historico.tipo_evento or ""),
            "origem_evento": str(historico.origem_evento or ""),
            "usuario_nome": str(historico.usuario_nome or ""),
            "setor": str(historico.setor or ""),
            "emenda_identificacao": str(identificacao or ""),
            "motivo": str(historico.motivo or ""),
            "data_hora": historico.data_hora,
        }

    return {
        "ano_filtro": ano,
        "mes_filtro": mes,
        "total_eventos": int(total_eventos or 0),
        "total_emendas_unicas": int(total_emendas_unicas or 0),
        "tipo_evento_counts": tipo_evento_counts,
        "origem_evento_counts": origem_evento_counts,
        "setor_counts": setor_counts,
        "top_usuarios": top_usuarios,
        "latest_event": latest_event,
    }
