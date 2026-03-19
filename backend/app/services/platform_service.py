import asyncio
import re
from datetime import datetime

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from ..models import Emenda


VERSIONED_ID_RE = re.compile(r"^(?P<base>.+)-v(?P<num>\d+)$", re.IGNORECASE)


def utcnow() -> datetime:
    return datetime.utcnow()


def resolve_event_origin(origin_raw: str | None, event_origins: set[str], actor: dict | None = None, fallback: str = "API") -> str:
    candidate = (origin_raw or "").strip().upper()
    if candidate in event_origins:
        return candidate

    if actor and actor.get("auth_type") == "disabled":
        return "API"

    fb = (fallback or "API").strip().upper()
    return fb if fb in event_origins else "API"


def ensure_legacy_schema(engine) -> None:
    # Compatibilidade com bancos legados (principalmente SQLite local):
    # adiciona colunas/indices ausentes quando necessario.
    insp = inspect(engine)
    tables = set(insp.get_table_names())

    if "usuarios" in tables:
        cols = {c["name"] for c in insp.get_columns("usuarios")}
        statements = []
        if "email" not in cols:
            statements.append("ALTER TABLE usuarios ADD COLUMN email VARCHAR(255)")
        if "google_sub" not in cols:
            statements.append("ALTER TABLE usuarios ADD COLUMN google_sub VARCHAR(255)")
        if "senha_salt" not in cols:
            statements.append("ALTER TABLE usuarios ADD COLUMN senha_salt VARCHAR(255) NOT NULL DEFAULT ''")
        if "senha_hash" not in cols:
            statements.append("ALTER TABLE usuarios ADD COLUMN senha_hash VARCHAR(255) NOT NULL DEFAULT ''")
        if "ativo" not in cols:
            statements.append("ALTER TABLE usuarios ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE")
        if "status_cadastro" not in cols:
            statements.append("ALTER TABLE usuarios ADD COLUMN status_cadastro VARCHAR(20) NOT NULL DEFAULT 'APROVADO'")
        if "ultimo_login" not in cols:
            statements.append("ALTER TABLE usuarios ADD COLUMN ultimo_login TIMESTAMP")

        if statements:
            with engine.begin() as conn:
                for st in statements:
                    conn.execute(text(st))
                conn.execute(
                    text(
                        "UPDATE usuarios "
                        "SET status_cadastro = CASE "
                        "WHEN ativo = TRUE THEN 'APROVADO' "
                        "ELSE 'EM_ANALISE' END "
                        "WHERE status_cadastro IS NULL OR TRIM(status_cadastro) = ''"
                    )
                )

    if "emendas" in tables:
        cols = {c["name"] for c in insp.get_columns("emendas")}
        statements = []
        if "parent_id" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN parent_id INTEGER")
        if "version" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN version INTEGER NOT NULL DEFAULT 1")
        if "row_version" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN row_version INTEGER NOT NULL DEFAULT 1")
        if "is_current" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN is_current BOOLEAN NOT NULL DEFAULT TRUE")
        if "objetivo_epi" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN objetivo_epi TEXT NOT NULL DEFAULT ''")
        if "plan_a" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN plan_a TEXT NOT NULL DEFAULT ''")
        if "plan_b" not in cols:
            statements.append("ALTER TABLE emendas ADD COLUMN plan_b TEXT NOT NULL DEFAULT ''")

        with engine.begin() as conn:
            for st in statements:
                conn.execute(text(st))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_parent_id ON emendas(parent_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_status_oficial ON emendas(status_oficial)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_updated_at ON emendas(updated_at)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_is_current ON emendas(is_current)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emendas_row_version ON emendas(row_version)"))

    if "historico" in tables:
        cols = {c["name"] for c in insp.get_columns("historico")}
        statements = []
        if "origem_evento" not in cols:
            statements.append("ALTER TABLE historico ADD COLUMN origem_evento VARCHAR(20) NOT NULL DEFAULT 'API'")

        with engine.begin() as conn:
            for st in statements:
                conn.execute(text(st))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_historico_data_hora ON historico(data_hora)"))

    with engine.begin() as conn:
        conn.execute(
            text(
                "CREATE TABLE IF NOT EXISTS emenda_locks ("
                "emenda_id INTEGER PRIMARY KEY, "
                "usuario_id INTEGER NULL, "
                "usuario_nome VARCHAR(120) NOT NULL DEFAULT '', "
                "setor VARCHAR(40) NOT NULL DEFAULT '', "
                "acquired_at TIMESTAMP NOT NULL, "
                "heartbeat_at TIMESTAMP NOT NULL, "
                "expires_at TIMESTAMP NOT NULL"
                ")"
            )
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emenda_locks_expires_at ON emenda_locks(expires_at)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_emenda_locks_usuario_id ON emenda_locks(usuario_id)"))

    if "import_linhas" in tables:
        with engine.begin() as conn:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_import_linhas_id_interno ON import_linhas(id_interno)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_import_linhas_ref_key ON import_linhas(ref_key)"))

    if "lotes_importacao" in tables:
        cols = {c["name"] for c in insp.get_columns("lotes_importacao")}
        statements = []
        if "status_governanca" not in cols:
            statements.append("ALTER TABLE lotes_importacao ADD COLUMN status_governanca VARCHAR(20) NOT NULL DEFAULT 'APLICADO'")
        if "governanca_motivo" not in cols:
            statements.append("ALTER TABLE lotes_importacao ADD COLUMN governanca_motivo TEXT NOT NULL DEFAULT ''")
        if "governado_por_id" not in cols:
            statements.append("ALTER TABLE lotes_importacao ADD COLUMN governado_por_id INTEGER")
        if "governado_por_nome" not in cols:
            statements.append("ALTER TABLE lotes_importacao ADD COLUMN governado_por_nome VARCHAR(120) NOT NULL DEFAULT ''")
        if "governado_por_setor" not in cols:
            statements.append("ALTER TABLE lotes_importacao ADD COLUMN governado_por_setor VARCHAR(40) NOT NULL DEFAULT ''")
        if "governado_em" not in cols:
            statements.append("ALTER TABLE lotes_importacao ADD COLUMN governado_em TIMESTAMP")
        if "registros_removidos" not in cols:
            statements.append("ALTER TABLE lotes_importacao ADD COLUMN registros_removidos INTEGER NOT NULL DEFAULT 0")

        with engine.begin() as conn:
            for st in statements:
                conn.execute(text(st))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lotes_importacao_created_at ON lotes_importacao(created_at)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lotes_importacao_usuario_id ON lotes_importacao(usuario_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lotes_importacao_status_governanca ON lotes_importacao(status_governanca)"))

    with engine.begin() as conn:
        conn.execute(
            text(
                "CREATE TABLE IF NOT EXISTS import_governanca_logs ("
                "id INTEGER PRIMARY KEY, "
                "lote_id INTEGER NOT NULL, "
                "acao VARCHAR(20) NOT NULL, "
                "motivo TEXT NOT NULL DEFAULT '', "
                "usuario_id INTEGER NULL, "
                "usuario_nome VARCHAR(120) NOT NULL DEFAULT '', "
                "setor VARCHAR(40) NOT NULL DEFAULT '', "
                "detalhes_json TEXT NOT NULL DEFAULT '', "
                "created_at TIMESTAMP NOT NULL"
                ")"
            )
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_import_governanca_logs_lote_id ON import_governanca_logs(lote_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_import_governanca_logs_created_at ON import_governanca_logs(created_at)"))

    if "export_logs" in tables:
        cols = {c["name"] for c in insp.get_columns("export_logs")}
        statements = []
        if "escopo_exportacao" not in cols:
            statements.append("ALTER TABLE export_logs ADD COLUMN escopo_exportacao VARCHAR(20) NOT NULL DEFAULT 'ATUAIS'")

        with engine.begin() as conn:
            for st in statements:
                conn.execute(text(st))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_export_logs_created_at ON export_logs(created_at)"))

    with engine.begin() as conn:
        conn.execute(
            text(
                "CREATE TABLE IF NOT EXISTS support_threads ("
                "id INTEGER PRIMARY KEY, "
                "subject VARCHAR(160) NOT NULL, "
                "categoria VARCHAR(40) NOT NULL DEFAULT 'OUTRO', "
                "status VARCHAR(20) NOT NULL DEFAULT 'ABERTO', "
                "emenda_id INTEGER NULL, "
                "usuario_id INTEGER NULL, "
                "usuario_nome VARCHAR(120) NOT NULL DEFAULT '', "
                "setor VARCHAR(40) NOT NULL DEFAULT '', "
                "last_actor_nome VARCHAR(120) NOT NULL DEFAULT '', "
                "last_actor_role VARCHAR(40) NOT NULL DEFAULT '', "
                "last_message_preview TEXT NOT NULL DEFAULT '', "
                "created_at TIMESTAMP NOT NULL, "
                "updated_at TIMESTAMP NOT NULL, "
                "last_message_at TIMESTAMP NOT NULL"
                ")"
            )
        )
        conn.execute(
            text(
                "CREATE TABLE IF NOT EXISTS support_messages ("
                "id INTEGER PRIMARY KEY, "
                "thread_id INTEGER NOT NULL, "
                "usuario_id INTEGER NULL, "
                "usuario_nome VARCHAR(120) NOT NULL DEFAULT '', "
                "setor VARCHAR(40) NOT NULL DEFAULT '', "
                "origem VARCHAR(20) NOT NULL DEFAULT 'USUARIO', "
                "mensagem TEXT NOT NULL DEFAULT '', "
                "created_at TIMESTAMP NOT NULL"
                ")"
            )
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_support_threads_status ON support_threads(status)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_support_threads_usuario_id ON support_threads(usuario_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_support_threads_last_message_at ON support_threads(last_message_at)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_support_messages_thread_id ON support_messages(thread_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_support_messages_created_at ON support_messages(created_at)"))

    with engine.begin() as conn:
        conn.execute(
            text(
                "CREATE TABLE IF NOT EXISTS deputado_count_adjustments ("
                "id INTEGER PRIMARY KEY, "
                "deputado VARCHAR(120) NOT NULL, "
                "total_ajustado INTEGER NOT NULL DEFAULT 0, "
                "escopo VARCHAR(20) NOT NULL DEFAULT 'GLOBAL', "
                "motivo TEXT NOT NULL DEFAULT '', "
                "usuario_id INTEGER NULL, "
                "usuario_nome VARCHAR(120) NOT NULL DEFAULT '', "
                "setor VARCHAR(40) NOT NULL DEFAULT '', "
                "created_at TIMESTAMP NOT NULL, "
                "updated_at TIMESTAMP NOT NULL"
                ")"
            )
        )
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ux_deputado_count_adjustments_deputado ON deputado_count_adjustments(deputado)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_deputado_count_adjustments_escopo ON deputado_count_adjustments(escopo)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_deputado_count_adjustments_updated_at ON deputado_count_adjustments(updated_at)"))


def versioned_id_interno(base_id: str, version_num: int, db: Session) -> str:
    raw_base = (base_id or "").strip() or "EMENDA"
    match = VERSIONED_ID_RE.match(raw_base)
    base = match.group("base") if match else raw_base
    version = max(int(version_num or 1), 1)

    while True:
        candidate = f"{base}-v{version:03d}"
        exists = db.query(Emenda).filter(Emenda.id_interno == candidate).first()
        if not exists:
            return candidate
        version += 1


async def broadcast_update_async(entity: str, entity_id: int | None, ws_broker, utcnow_fn) -> None:
    from . import realtime_service

    await ws_broker.broadcast(realtime_service.build_update_payload(entity, entity_id, utcnow_fn))


def broadcast_update(entity: str, entity_id: int | None, ws_broker, utcnow_fn) -> None:
    payload_coro = broadcast_update_async(entity, entity_id, ws_broker, utcnow_fn)
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        asyncio.run(payload_coro)
        return

    loop.create_task(payload_coro)


def build_health_payload(settings, roles: list[str], ai_orchestrator) -> dict:
    return {
        "ok": True,
        "auth_enabled": settings.API_AUTH_ENABLED,
        "auth_mode": "jwt_bearer_with_legacy_fallback",
        "shared_key_enabled": settings.shared_key_auth_enabled,
        "app_env": settings.app_env_normalized,
        "database_backend": settings.database_backend,
        "db_auto_bootstrap": settings.db_auto_bootstrap_enabled,
        "demo_mode": settings.demo_mode_enabled,
        "roles": roles,
        "ai_orchestrator_enabled": settings.AI_ORCHESTRATOR_ENABLED,
        "ai_configured_providers": ai_orchestrator.configured_count(),
    }


def build_root_payload() -> dict:
    return {
        "ok": True,
        "service": "sec-emendas-api",
        "health": "/health",
        "docs": "/docs",
    }


def build_roles_payload(roles: list[str]) -> dict:
    return {"roles": roles}
