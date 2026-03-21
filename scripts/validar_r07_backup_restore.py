from __future__ import annotations

import argparse
import json
import os
import socket
import subprocess
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import psycopg
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from r07_backup_restore_lib import (
    ResolvedDbUrl,
    compare_manifest_counts,
    create_backup,
    ensure_dir,
    render_counts_markdown,
    remove_dir_if_exists,
    restore_backup,
)


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def run(cmd: list[str], *, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=check, text=True, capture_output=True)


def docker_url(port: int, dbname: str) -> str:
    return f"postgresql://postgres:postgres@127.0.0.1:{port}/{dbname}"


def docker_sqla_url(port: int, dbname: str) -> str:
    return f"postgresql+psycopg://postgres:postgres@127.0.0.1:{port}/{dbname}"


def wait_for_postgres(admin_url: str, timeout_seconds: int = 90) -> None:
    deadline = time.time() + timeout_seconds
    last_error = ""
    while time.time() < deadline:
        try:
            with psycopg.connect(admin_url) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
                    cur.fetchone()
            return
        except Exception as exc:  # noqa: BLE001
            last_error = str(exc)
            time.sleep(2)
    raise RuntimeError(f"PostgreSQL temporario nao ficou pronto: {last_error}")


def create_database(admin_url: str, db_name: str) -> None:
    with psycopg.connect(admin_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (db_name,),
            )
            if cur.fetchone():
                cur.execute(f'DROP DATABASE "{db_name}" WITH (FORCE)')
            cur.execute(f'CREATE DATABASE "{db_name}"')


def prepare_schema(source_sqla_url: str, restore_sqla_url: str) -> None:
    os.environ["DATABASE_URL"] = source_sqla_url
    from backend.app.db import Base  # noqa: WPS433
    from backend.app import models  # noqa: F401, WPS433

    source_engine = create_engine(source_sqla_url, future=True)
    restore_engine = create_engine(restore_sqla_url, future=True)
    Base.metadata.create_all(source_engine)
    Base.metadata.create_all(restore_engine)
    source_engine.dispose()
    restore_engine.dispose()


def seed_source_database(source_sqla_url: str) -> None:
    from backend.app.models import (  # noqa: WPS433
        AuthAuditLog,
        DeputadoCountAdjustment,
        Emenda,
        EmendaLock,
        ExportLog,
        Historico,
        ImportGovernancaLog,
        ImportLinha,
        ImportLote,
        SupportMessage,
        SupportThread,
        Usuario,
        UsuarioSessao,
    )

    engine = create_engine(source_sqla_url, future=True)
    SessionLocal = sessionmaker(bind=engine, future=True)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    with SessionLocal() as db:
        programador = Usuario(
            nome="MICAEL_DEV",
            email="micael@example.com",
            setor="PROGRAMADOR",
            perfil="PROGRAMADOR",
            senha_salt="",
            senha_hash="hash-1",
            ativo=True,
            status_cadastro="APROVADO",
            failed_login_attempts=0,
            created_at=now,
        )
        apg = Usuario(
            nome="SEC_APG_TESTE",
            email="apg@example.com",
            setor="APG",
            perfil="APG",
            senha_salt="",
            senha_hash="hash-2",
            ativo=True,
            status_cadastro="APROVADO",
            failed_login_attempts=1,
            created_at=now,
        )
        db.add_all([programador, apg])
        db.flush()

        db.add(
            UsuarioSessao(
                usuario_id=programador.id,
                token_hash="sessao-hash-1",
                created_at=now,
                expires_at=now + timedelta(hours=12),
            )
        )
        db.add(
            AuthAuditLog(
                user_id=programador.id,
                user_nome=programador.nome,
                login_identificador=programador.nome,
                event_type="LOGIN_PASSWORD",
                provider="LOCAL",
                success=True,
                detail="login com senha realizado com sucesso",
                ip_origem="127.0.0.1",
                user_agent="pytest-r07",
                created_at=now,
            )
        )

        emenda = Emenda(
            id_interno="EPI-R07-001",
            ano=2026,
            identificacao="EMENDA R07",
            cod_subfonte="SUB01",
            deputado="DEP TESTE",
            cod_uo="UO01",
            sigla_uo="SESAB",
            cod_orgao="ORG01",
            cod_acao="ACAO01",
            descricao_acao="Acao de teste R07",
            objetivo_epi="Objetivo R07",
            plan_a="Plano A",
            plan_b="Plano B",
            municipio="Salvador",
            valor_inicial=1000,
            valor_atual=1500,
            processo_sei="SEI-123",
            status_oficial="Recebido",
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
                usuario_id=programador.id,
                usuario_nome=programador.nome,
                setor=programador.setor,
                tipo_evento="IMPORT",
                origem_evento="IMPORT",
                campo_alterado="valor_atual",
                valor_antigo="1000",
                valor_novo="1500",
                motivo="seed r07",
                data_hora=now,
            )
        )
        db.add(
            EmendaLock(
                emenda_id=emenda.id,
                usuario_id=apg.id,
                usuario_nome=apg.nome,
                setor=apg.setor,
                acquired_at=now,
                heartbeat_at=now,
                expires_at=now + timedelta(minutes=5),
            )
        )

        lote = ImportLote(
            arquivo_nome="planilha_oficial_r07.xlsx",
            arquivo_hash="hash-r07",
            linhas_lidas=10,
            linhas_validas=8,
            linhas_ignoradas=2,
            registros_criados=1,
            registros_atualizados=0,
            sem_alteracao=7,
            duplicidade_id=0,
            duplicidade_ref=0,
            duplicidade_arquivo=0,
            conflito_id_ref=0,
            abas_lidas="Controle de EPI;Planilha1",
            observacao="seed r07",
            origem_evento="IMPORT",
            usuario_id=programador.id,
            usuario_nome=programador.nome,
            setor=programador.setor,
            status_governanca="APLICADO",
            governanca_motivo="baseline",
            governado_por_id=programador.id,
            governado_por_nome=programador.nome,
            governado_por_setor=programador.setor,
            governado_em=now,
            registros_removidos=0,
            created_at=now,
        )
        db.add(lote)
        db.flush()

        db.add(
            ImportLinha(
                lote_id=lote.id,
                ordem=1,
                sheet_name="Controle de EPI",
                row_number=2,
                status_linha="CREATED",
                id_interno=emenda.id_interno,
                ref_key="ref-r07",
                mensagem="linha criada",
                created_at=now,
            )
        )
        db.add(
            ImportGovernancaLog(
                lote_id=lote.id,
                acao="CORRIGIR",
                motivo="seed r07",
                usuario_id=programador.id,
                usuario_nome=programador.nome,
                setor=programador.setor,
                detalhes_json=json.dumps({"status_governanca": "APLICADO"}),
                created_at=now,
            )
        )
        db.add(
            ExportLog(
                formato="xlsx",
                arquivo_nome="export_r07.xlsx",
                quantidade_registros=1,
                quantidade_eventos=1,
                filtros_json=json.dumps({"ano": 2026}),
                modo_headers="template",
                escopo_exportacao="ATUAIS",
                round_trip_ok=True,
                round_trip_issues="",
                origem_evento="EXPORT",
                usuario_id=programador.id,
                usuario_nome=programador.nome,
                setor=programador.setor,
                created_at=now,
            )
        )
        db.add(
            DeputadoCountAdjustment(
                deputado="DEP TESTE",
                total_ajustado=1,
                escopo="GLOBAL",
                motivo="seed r07",
                usuario_id=programador.id,
                usuario_nome=programador.nome,
                setor=programador.setor,
                created_at=now,
                updated_at=now,
            )
        )
        thread = SupportThread(
            subject="Chamado seed R07",
            categoria="ACESSO",
            status="ABERTO",
            emenda_id=emenda.id,
            usuario_id=apg.id,
            usuario_nome=apg.nome,
            setor=apg.setor,
            last_actor_nome=apg.nome,
            last_actor_role=apg.setor,
            last_message_preview="Preciso de suporte",
            created_at=now,
            updated_at=now,
            last_message_at=now,
        )
        db.add(thread)
        db.flush()
        db.add(
            SupportMessage(
                thread_id=thread.id,
                usuario_id=apg.id,
                usuario_nome=apg.nome,
                setor=apg.setor,
                origem="USUARIO",
                mensagem="Preciso de suporte no seed R07",
                created_at=now,
            )
        )
        db.commit()
    engine.dispose()


def collect_target_assertions(target_url: str) -> dict[str, str]:
    with psycopg.connect(target_url) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT nome FROM usuarios ORDER BY id ASC")
            usuarios = [row[0] for row in cur.fetchall()]
            cur.execute("SELECT id_interno FROM emendas ORDER BY id ASC")
            emendas = [row[0] for row in cur.fetchall()]
            cur.execute("SELECT subject FROM support_threads ORDER BY id ASC")
            chamados = [row[0] for row in cur.fetchall()]
    return {
        "usuarios": ", ".join(usuarios),
        "emendas": ", ".join(emendas),
        "chamados": ", ".join(chamados),
    }


def current_git_commit() -> str:
    result = run(["git", "rev-parse", "--short", "HEAD"], check=True)
    return result.stdout.strip()


def write_report(path: Path, manifest: dict, source_url: str, restore_url: str, assertions: dict[str, str]) -> Path:
    lines = [
        "# Evidencia R07 - Backup e Restore",
        "",
        f"- Data: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"- Commit validado: `{current_git_commit()}`",
        f"- Source: `{source_url}`",
        f"- Restore target: `{restore_url}`",
        "- Resultado: `PASSOU`",
        "",
        "## Assertivas",
        "",
        f"- Usuarios restaurados: `{assertions['usuarios']}`",
        f"- Emendas restauradas: `{assertions['emendas']}`",
        f"- Chamados restaurados: `{assertions['chamados']}`",
        "",
        render_counts_markdown("Contagem do backup", manifest),
    ]
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description="R07 - validar backup e restore em PostgreSQL temporario.")
    parser.add_argument("--output-root", default="tmp/r07_backups_validation")
    parser.add_argument("--report-path", default="docs/r07_backup_restore_evidencia.md")
    parser.add_argument("--docker-image", default="postgres:16-alpine")
    args = parser.parse_args()

    output_root = ensure_dir(Path(args.output_root))
    remove_dir_if_exists(output_root)
    ensure_dir(output_root)
    report_path = Path(args.report_path)

    container_name = f"conciliar-r07-{uuid4().hex[:8]}"
    port = find_free_port()
    admin_url = docker_url(port, "postgres")
    source_db = "r07_source"
    restore_db = "r07_restore"
    source_url = docker_url(port, source_db)
    restore_url = docker_url(port, restore_db)
    source_sqla_url = docker_sqla_url(port, source_db)
    restore_sqla_url = docker_sqla_url(port, restore_db)

    try:
        run(
            [
                "docker",
                "run",
                "-d",
                "--rm",
                "--name",
                container_name,
                "-e",
                "POSTGRES_PASSWORD=postgres",
                "-e",
                "POSTGRES_USER=postgres",
                "-e",
                "POSTGRES_DB=postgres",
                "-p",
                f"{port}:5432",
                args.docker_image,
            ]
        )
        wait_for_postgres(admin_url)
        create_database(admin_url, source_db)
        create_database(admin_url, restore_db)
        prepare_schema(source_sqla_url, restore_sqla_url)
        seed_source_database(source_sqla_url)

        backup_result = create_backup(
            database_url=ResolvedDbUrl(
                raw=source_url,
                masked="postgresql://postgres:***@127.0.0.1:%d/%s" % (port, source_db),
                scheme="postgresql",
                host="127.0.0.1",
                database=source_db,
            ),
            output_root=output_root,
            label="r07_validation_backup",
        )
        backup_dir = Path(str(backup_result["backup_dir"]))
        restore_backup(
            backup_dir=backup_dir,
            target_database_url=ResolvedDbUrl(
                raw=restore_url,
                masked="postgresql://postgres:***@127.0.0.1:%d/%s" % (port, restore_db),
                scheme="postgresql",
                host="127.0.0.1",
                database=restore_db,
            ),
            require_explicit_wipe=True,
        )

        with psycopg.connect(restore_url) as conn:
            mismatches = compare_manifest_counts(conn, backup_result["manifest"])
            if mismatches:
                raise RuntimeError("Divergencia final no restore: " + "; ".join(mismatches))

        assertions = collect_target_assertions(restore_url)
        write_report(
            report_path,
            backup_result["manifest"],
            "postgresql://postgres:***@127.0.0.1:%d/%s" % (port, source_db),
            "postgresql://postgres:***@127.0.0.1:%d/%s" % (port, restore_db),
            assertions,
        )
        print(json.dumps({"ok": True, "backup_dir": str(backup_dir), "report_path": str(report_path)}, ensure_ascii=True))
        return 0
    finally:
        run(["docker", "rm", "-f", container_name], check=False)


if __name__ == "__main__":
    raise SystemExit(main())
