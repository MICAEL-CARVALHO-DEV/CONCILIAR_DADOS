param()

$ErrorActionPreference = "Stop"

$script = @'
import pathlib
import sys

from fastapi.testclient import TestClient

ROOT = pathlib.Path.cwd()
sys.path.insert(0, str(ROOT))

from backend.app.main import app
from backend.app.settings import settings

settings.API_AUTH_ENABLED = False

headers = {
    "X-User-Name": "smoke_backend",
    "X-User-Role": "PROGRAMADOR",
}


def assert_keys(payload, keys, label):
    missing = [key for key in keys if key not in payload]
    if missing:
        raise AssertionError(f"{label} sem campos obrigatorios: {', '.join(missing)}")


with TestClient(app) as client:
    stamp = __import__("datetime").datetime.now().strftime("%Y%m%d%H%M%S")

    emenda_resp = client.post(
        "/emendas",
        headers=headers,
        json={
            "id_interno": f"SMOKE-SUMMARY-{stamp}",
            "ano": 2026,
            "identificacao": "Smoke Summary",
            "status_oficial": "Recebido",
        },
    )
    emenda_resp.raise_for_status()
    emenda_id = emenda_resp.json()["id"]

    evento_resp = client.post(
        f"/emendas/{emenda_id}/eventos",
        headers=headers,
        json={
            "usuario_nome": "smoke_backend",
            "setor": "PROGRAMADOR",
            "tipo_evento": "NOTE",
            "motivo": "smoke summary local",
        },
    )
    evento_resp.raise_for_status()

    lote_resp = client.post(
        "/imports/lotes",
        headers=headers,
        json={
            "arquivo_nome": f"smoke-summary-{stamp}.xlsx",
            "arquivo_hash": f"smoke-{stamp}",
            "linhas_lidas": 2,
            "linhas_validas": 1,
            "linhas_ignoradas": 1,
            "registros_criados": 1,
            "registros_atualizados": 0,
            "sem_alteracao": 0,
            "duplicidade_id": 0,
            "duplicidade_ref": 0,
            "duplicidade_arquivo": 0,
            "conflito_id_ref": 0,
            "abas_lidas": ["Planilha1"],
            "observacao": "smoke summary local",
            "origem_evento": "IMPORT",
        },
    )
    lote_resp.raise_for_status()
    lote_id = lote_resp.json()["id"]

    linhas_resp = client.post(
        "/imports/linhas/bulk",
        headers=headers,
        json={
            "lote_id": lote_id,
            "linhas": [
                {
                    "ordem": 1,
                    "sheet_name": "Planilha1",
                    "row_number": 2,
                    "status_linha": "CREATED",
                    "id_interno": f"SMOKE-LINHA-{stamp}",
                    "ref_key": f"smoke|{stamp}",
                    "mensagem": "linha criada no smoke local",
                },
                {
                    "ordem": 2,
                    "sheet_name": "Planilha1",
                    "row_number": 3,
                    "status_linha": "SKIPPED",
                    "id_interno": "",
                    "ref_key": f"ignorado|{stamp}",
                    "mensagem": "linha ignorada no smoke local",
                },
            ],
        },
    )
    linhas_resp.raise_for_status()

    export_resp = client.post(
        "/exports/logs",
        headers=headers,
        json={
            "formato": "XLSX",
            "arquivo_nome": f"smoke-summary-{stamp}.xlsx",
            "quantidade_registros": 2,
            "quantidade_eventos": 1,
            "filtros_json": "{}",
            "modo_headers": "normalizados",
            "escopo_exportacao": "ATUAIS",
            "round_trip_ok": True,
            "round_trip_issues": [],
            "origem_evento": "EXPORT",
        },
    )
    export_resp.raise_for_status()

    support_resp = client.post(
        "/support/threads",
        headers=headers,
        json={
            "subject": f"Smoke resumo {stamp}",
            "categoria": "OUTRO",
            "mensagem": "Validacao automatica local dos endpoints de resumo.",
        },
    )
    support_resp.raise_for_status()
    support_thread_id = support_resp.json()["id"]

    import_owner_headers = {
        "X-User-Name": "operador_apg",
        "X-User-Role": "APG",
    }
    import_owner_lote_resp = client.post(
        "/imports/lotes",
        headers=import_owner_headers,
        json={
            "arquivo_nome": f"smoke-owner-{stamp}.xlsx",
            "arquivo_hash": f"smoke-owner-{stamp}",
            "linhas_lidas": 1,
            "linhas_validas": 1,
            "linhas_ignoradas": 0,
            "registros_criados": 0,
            "registros_atualizados": 1,
            "sem_alteracao": 0,
            "duplicidade_id": 0,
            "duplicidade_ref": 0,
            "duplicidade_arquivo": 0,
            "conflito_id_ref": 0,
            "abas_lidas": ["Planilha1"],
            "observacao": "owner governance smoke",
            "origem_evento": "IMPORT",
        },
    )
    import_owner_lote_resp.raise_for_status()
    import_owner_lote_id = import_owner_lote_resp.json()["id"]

    govern_owner_resp = client.patch(
        f"/imports/lotes/{import_owner_lote_id}/governanca",
        headers=import_owner_headers,
        json={
            "acao": "CORRIGIR",
            "motivo": "correcao pelo proprio usuario",
        },
    )
    govern_owner_resp.raise_for_status()
    govern_owner_json = govern_owner_resp.json()
    if govern_owner_json["status_governanca"] != "CORRIGIDO":
        raise AssertionError("governanca do proprio lote nao aplicou CORRIGIDO")

    support_user_headers = {
        "X-User-Name": "usuario_apg",
        "X-User-Role": "APG",
    }
    support_user_thread_resp = client.post(
        "/support/threads",
        headers=support_user_headers,
        json={
            "subject": f"Ajuda operador {stamp}",
            "categoria": "OPERACAO",
            "mensagem": "Solicitacao de ajuda operacional.",
        },
    )
    support_user_thread_resp.raise_for_status()
    user_thread_id = support_user_thread_resp.json()["id"]

    support_scope_resp = client.get("/support/resumo", headers=support_user_headers)
    support_scope_resp.raise_for_status()
    support_scope_json = support_scope_resp.json()
    if support_scope_json["escopo"] != "request_only":
        raise AssertionError("usuario operacional deveria receber escopo request_only de suporte")

    support_threads_resp = client.get("/support/threads", headers=support_user_headers)
    support_threads_resp.raise_for_status()
    if support_threads_resp.json() != []:
        raise AssertionError("usuario operacional nao deveria listar historico de suporte")

    support_messages_resp = client.get(f"/support/threads/{support_thread_id}/messages", headers=support_user_headers)
    support_messages_resp.raise_for_status()
    if support_messages_resp.json() != []:
        raise AssertionError("usuario operacional nao deveria listar mensagens de suporte")

    support_reply_forbidden = client.post(
        f"/support/threads/{support_thread_id}/messages",
        headers=support_user_headers,
        json={"mensagem": "Tentativa de resposta por usuario operacional."},
    )
    if support_reply_forbidden.status_code != 403:
        raise AssertionError("usuario operacional nao deveria responder chamados")

    support_status_forbidden = client.patch(
        f"/support/threads/{user_thread_id}/status",
        headers=support_user_headers,
        json={"status": "RESPONDIDO"},
    )
    if support_status_forbidden.status_code != 403:
        raise AssertionError("usuario operacional nao deveria alterar status de suporte")

    removable_id_interno = f"SMOKE-KEEP-{stamp}"
    removable_emenda_resp = client.post(
        "/emendas",
        headers=headers,
        json={
            "id_interno": removable_id_interno,
            "ano": 2026,
            "identificacao": "Smoke Keep On Remove",
            "status_oficial": "Recebido",
        },
    )
    removable_emenda_resp.raise_for_status()
    removable_emenda_id = removable_emenda_resp.json()["id"]

    removable_event_resp = client.post(
        f"/emendas/{removable_emenda_id}/eventos",
        headers=headers,
        json={
            "usuario_nome": "smoke_backend",
            "setor": "PROGRAMADOR",
            "tipo_evento": "NOTE",
            "motivo": "historico precisa permanecer apos remocao logica do import",
        },
    )
    removable_event_resp.raise_for_status()

    removable_lote_resp = client.post(
        "/imports/lotes",
        headers=import_owner_headers,
        json={
            "arquivo_nome": f"smoke-remove-{stamp}.xlsx",
            "arquivo_hash": f"smoke-remove-{stamp}",
            "linhas_lidas": 1,
            "linhas_validas": 1,
            "linhas_ignoradas": 0,
            "registros_criados": 1,
            "registros_atualizados": 0,
            "sem_alteracao": 0,
            "duplicidade_id": 0,
            "duplicidade_ref": 0,
            "duplicidade_arquivo": 0,
            "conflito_id_ref": 0,
            "abas_lidas": ["Planilha1"],
            "observacao": "logical remove smoke",
            "origem_evento": "IMPORT",
        },
    )
    removable_lote_resp.raise_for_status()
    removable_lote_id = removable_lote_resp.json()["id"]

    removable_lines_resp = client.post(
        "/imports/linhas/bulk",
        headers=import_owner_headers,
        json={
            "lote_id": removable_lote_id,
            "linhas": [
                {
                    "ordem": 1,
                    "sheet_name": "Planilha1",
                    "row_number": 2,
                    "status_linha": "CREATED",
                    "id_interno": removable_id_interno,
                    "ref_key": f"keep|{stamp}",
                    "mensagem": "registro ligado a remocao logica",
                }
            ],
        },
    )
    removable_lines_resp.raise_for_status()

    removable_govern_resp = client.patch(
        f"/imports/lotes/{removable_lote_id}/governanca",
        headers=import_owner_headers,
        json={
            "acao": "REMOVER",
            "motivo": "remocao logica sem perda de dados",
        },
    )
    removable_govern_resp.raise_for_status()
    removable_govern_json = removable_govern_resp.json()
    if removable_govern_json["status_governanca"] != "REMOVIDO":
        raise AssertionError("lote deveria ficar REMOVIDO em remocao logica")
    if int(removable_govern_json["registros_removidos"]) != 0:
        raise AssertionError("remocao logica nao deveria apagar registros fisicamente")

    emenda_after_remove_resp = client.get("/emendas", headers=headers)
    emenda_after_remove_resp.raise_for_status()
    emendas_after_remove = emenda_after_remove_resp.json()
    if not any(item.get("id_interno") == removable_id_interno for item in emendas_after_remove):
        raise AssertionError("emenda vinculada ao lote removido logicamente deveria continuar na base")

    dashboard = client.get("/dashboard/resumo", headers=headers)
    dashboard.raise_for_status()
    dashboard_json = dashboard.json()
    assert_keys(
        dashboard_json,
        [
            "ano_filtro",
            "total_registros",
            "total_valor_inicial",
            "total_valor_atual",
            "ultima_atualizacao",
            "status_counts",
            "top_deputados",
            "latest_event",
            "contagem_deputado_policy",
        ],
        "dashboard/resumo",
    )
    assert_keys(
        dashboard_json.get("contagem_deputado_policy") or {},
        [
            "origem_oficial",
            "escopo_ajuste",
            "perfil_ajuste",
            "observacao",
        ],
        "dashboard/resumo.contagem_deputado_policy",
    )
    if str((dashboard_json.get("contagem_deputado_policy") or {}).get("origem_oficial") or "").strip().upper() != "BASE_ATUAL":
        raise AssertionError("contagem_deputado_policy.origem_oficial deveria ser BASE_ATUAL")

    dashboard_policy = client.get("/dashboard/deputados/politica", headers=headers)
    dashboard_policy.raise_for_status()
    dashboard_policy_json = dashboard_policy.json()
    assert_keys(
        dashboard_policy_json,
        [
            "origem_oficial",
            "escopo_ajuste",
            "perfil_ajuste",
            "observacao",
        ],
        "dashboard/deputados/politica",
    )
    if str(dashboard_policy_json.get("origem_oficial") or "").strip().upper() != "BASE_ATUAL":
        raise AssertionError("/dashboard/deputados/politica deveria fixar origem_oficial em BASE_ATUAL")

    imports = client.get("/imports/resumo", headers=headers)
    imports.raise_for_status()
    imports_json = imports.json()
    assert_keys(
        imports_json,
        [
            "total_lotes",
            "total_linhas_lidas",
            "total_linhas_ignoradas",
            "total_registros_criados",
            "total_registros_atualizados",
            "total_registros_removidos",
            "governance_status_counts",
            "line_status_counts",
            "latest_lot",
            "latest_governance",
            "latest_export_log",
        ],
        "imports/resumo",
    )

    exports = client.get("/exports/resumo", headers=headers)
    exports.raise_for_status()
    exports_json = exports.json()
    assert_keys(
        exports_json,
        [
            "total_exports",
            "total_registros",
            "total_eventos",
            "formato_counts",
            "escopo_counts",
            "round_trip_counts",
            "latest_export",
        ],
        "exports/resumo",
    )

    audit = client.get("/audit/resumo", headers=headers)
    audit.raise_for_status()
    audit_json = audit.json()
    assert_keys(
        audit_json,
        [
            "ano_filtro",
            "mes_filtro",
            "total_eventos",
            "total_emendas_unicas",
            "tipo_evento_counts",
            "origem_evento_counts",
            "setor_counts",
            "top_usuarios",
            "latest_event",
        ],
        "audit/resumo",
    )

    support = client.get("/support/resumo", headers=headers)
    support.raise_for_status()
    support_json = support.json()
    assert_keys(
        support_json,
        [
            "escopo",
            "total_threads",
            "status_counts",
            "categoria_counts",
            "latest_thread",
        ],
        "support/resumo",
    )

    ajuste_deputado = "DEP-AJUSTE-SMOKE"
    ajuste_put = client.put(
        "/dashboard/deputados/ajustes",
        headers=headers,
        json={
            "deputado": ajuste_deputado,
            "total_ajustado": 77,
            "motivo": "smoke ajuste global de deputado",
        },
    )
    ajuste_put.raise_for_status()
    ajuste_json = ajuste_put.json()
    if not bool(ajuste_json.get("deputado")):
        raise AssertionError("dashboard/deputados/ajustes nao retornou deputado")

    ajustes_list = client.get("/dashboard/deputados/ajustes", headers=headers)
    ajustes_list.raise_for_status()
    ajustes_rows = ajustes_list.json()
    if not any(str(row.get("deputado") or "").strip().upper() == ajuste_deputado for row in ajustes_rows):
        raise AssertionError("ajuste de deputado nao apareceu na listagem")

    dashboard_after_adjust = client.get("/dashboard/resumo", headers=headers)
    dashboard_after_adjust.raise_for_status()
    dashboard_after_adjust_json = dashboard_after_adjust.json()
    top_rows = dashboard_after_adjust_json.get("top_deputados") or []
    matching_adjusted = None
    for row in top_rows:
        if str(row.get("deputado") or "").strip().upper() == ajuste_deputado:
            matching_adjusted = row
            break
    if matching_adjusted and not bool(matching_adjusted.get("ajuste_manual")):
        raise AssertionError("dashboard/resumo deveria sinalizar ajuste_manual quando houver override")

    ajuste_delete = client.delete(
        "/dashboard/deputados/ajustes",
        headers=headers,
        params={"deputado": ajuste_deputado},
    )
    ajuste_delete.raise_for_status()

    objetivo_marker = f"OBJ-EPI-SMOKE-{stamp}"
    emenda_objetivo_resp = client.post(
        "/emendas",
        headers=headers,
        json={
            "id_interno": f"SMOKE-OBJ-{stamp}",
            "ano": 2026,
            "identificacao": "Smoke Objetivo EPI",
            "objetivo_epi": objetivo_marker,
            "status_oficial": "Recebido",
        },
    )
    emenda_objetivo_resp.raise_for_status()
    emenda_objetivo_id = emenda_objetivo_resp.json()["id"]

    evento_objetivo_resp = client.post(
        f"/emendas/{emenda_objetivo_id}/eventos",
        headers=headers,
        json={
            "tipo_evento": "NOTE",
            "motivo": "smoke filtro objetivo epi",
        },
    )
    evento_objetivo_resp.raise_for_status()

    audit_objetivo = client.get(
        "/audit",
        headers=headers,
        params={"limit": 120, "objetivo_epi": objetivo_marker},
    )
    audit_objetivo.raise_for_status()
    audit_objetivo_rows = audit_objetivo.json()
    if not audit_objetivo_rows:
        raise AssertionError("filtro objetivo_epi do audit nao retornou evento esperado")
    if not any(objetivo_marker in str(row.get("emenda_objetivo_epi") or "") for row in audit_objetivo_rows):
        raise AssertionError("filtro objetivo_epi do audit nao refletiu emenda_objetivo_epi")

    audit_perfil = client.get(
        "/audit",
        headers=headers,
        params={"limit": 120, "perfil": "PROGRAMADOR"},
    )
    audit_perfil.raise_for_status()
    audit_perfil_rows = audit_perfil.json()
    if not audit_perfil_rows:
        raise AssertionError("filtro perfil do audit nao retornou dados")
    if not all(str(row.get("setor") or "").strip().upper() == "PROGRAMADOR" for row in audit_perfil_rows):
        raise AssertionError("filtro perfil do audit nao aplicou setor corretamente")

    print("[smoke-summary-local] dashboard total_registros:", dashboard_json["total_registros"])
    print("[smoke-summary-local] imports total_lotes:", imports_json["total_lotes"])
    print("[smoke-summary-local] exports total_exports:", exports_json["total_exports"])
    print("[smoke-summary-local] audit total_eventos:", audit_json["total_eventos"])
    print("[smoke-summary-local] support total_threads:", support_json["total_threads"])
    print("[smoke-summary-local] deputado adjustment:", "OK")
    print("[smoke-summary-local] audit objetivo_epi filter:", "OK")
    print("[smoke-summary-local] audit perfil alias filter:", "OK")
    print("[smoke-summary-local] import owner governance:", govern_owner_json["status_governanca"])
    print("[smoke-summary-local] support scope usuario:", support_scope_json["escopo"])
    print("[smoke-summary-local] import logical remove:", removable_govern_json["status_governanca"])
    print("[smoke-summary-local] OK")
'@

$script | backend\.venv\Scripts\python.exe -
