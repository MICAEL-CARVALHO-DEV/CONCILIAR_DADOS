from __future__ import annotations

from datetime import datetime
from typing import Callable

from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..models import Emenda, Historico


def list_audit_log_service(
    *,
    limit: int,
    ano: int | None,
    mes: int | None,
    usuario: str | None,
    setor: str | None,
    tipo_evento: str | None,
    origem_evento: str | None,
    q: str | None,
    db: Session,
    mask_history_pair: Callable[[str, str, str], tuple[str, str]],
) -> list[dict]:
    query = db.query(Historico, Emenda).join(Emenda, Historico.emenda_id == Emenda.id)

    if ano is not None:
        start = datetime(ano, mes or 1, 1)
        if mes is not None:
            end = datetime(ano + 1, 1, 1) if mes == 12 else datetime(ano, mes + 1, 1)
        else:
            end = datetime(ano + 1, 1, 1)
        query = query.filter(Historico.data_hora >= start, Historico.data_hora < end)

    if usuario:
        query = query.filter(Historico.usuario_nome.ilike(f"%{usuario.strip()}%"))
    if setor:
        query = query.filter(Historico.setor.ilike(f"%{setor.strip()}%"))
    if tipo_evento:
        query = query.filter(Historico.tipo_evento.ilike(f"%{tipo_evento.strip()}%"))
    if origem_evento:
        query = query.filter(Historico.origem_evento.ilike(f"%{origem_evento.strip()}%"))
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
            )
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
