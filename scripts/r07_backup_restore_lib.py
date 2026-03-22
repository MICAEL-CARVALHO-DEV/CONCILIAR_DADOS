from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit, urlunsplit

import psycopg
from psycopg import sql
from dotenv import dotenv_values


APP_TABLES_IN_ORDER = [
    "alembic_version",
    "usuarios",
    "emendas",
    "usuario_sessoes",
    "auth_audit_logs",
    "deputado_count_adjustments",
    "lotes_importacao",
    "import_linhas",
    "import_governanca_logs",
    "export_logs",
    "historico",
    "emenda_locks",
    "support_threads",
    "support_messages",
]

TABLES_WITH_NUMERIC_ID = {
    "usuarios",
    "emendas",
    "usuario_sessoes",
    "auth_audit_logs",
    "deputado_count_adjustments",
    "lotes_importacao",
    "import_linhas",
    "import_governanca_logs",
    "export_logs",
    "historico",
    "support_threads",
    "support_messages",
}


@dataclass(frozen=True)
class ResolvedDbUrl:
    raw: str
    masked: str
    scheme: str
    host: str
    database: str


def utcstamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def load_env_file(env_file: str | Path | None) -> dict[str, str]:
    if not env_file:
        return {}
    env_path = Path(env_file)
    if not env_path.exists():
        return {}
    return {str(k): str(v) for k, v in dotenv_values(env_path).items() if k and v is not None}


def resolve_optional_path_setting(
    *,
    explicit_value: str | None = None,
    preferred_env_key: str | None = None,
    env_file: str | Path | None = None,
) -> str:
    env_file_values = load_env_file(env_file)
    candidates: list[str] = []
    if explicit_value:
        candidates.append(explicit_value)
    if preferred_env_key:
        candidates.append(os.environ.get(preferred_env_key, ""))
        candidates.append(env_file_values.get(preferred_env_key, ""))
    for candidate in candidates:
        value = (candidate or "").strip()
        if value:
            return value
    return ""


def normalize_psycopg_url(raw_url: str) -> str:
    value = (raw_url or "").strip()
    if value.startswith("postgresql+psycopg://"):
        return "postgresql://" + value.split("://", 1)[1]
    return value


def to_sqlalchemy_psycopg_url(raw_url: str) -> str:
    value = (raw_url or "").strip()
    if value.startswith("postgresql+psycopg://"):
        return value
    if value.startswith("postgresql://"):
        return "postgresql+psycopg://" + value.split("://", 1)[1]
    return value


def replace_database_in_url(raw_url: str, database_name: str) -> str:
    parsed = urlsplit(normalize_psycopg_url(raw_url))
    return urlunsplit(
        (
            parsed.scheme,
            parsed.netloc,
            f"/{database_name}",
            parsed.query,
            parsed.fragment,
        )
    )


def mask_database_url(raw_url: str) -> str:
    parsed = urlsplit(raw_url)
    netloc = parsed.netloc or ""
    if "@" in netloc:
        userinfo, hostpart = netloc.rsplit("@", 1)
        if ":" in userinfo:
            user = userinfo.split(":", 1)[0]
            userinfo = f"{user}:***"
        else:
            userinfo = "***"
        netloc = f"{userinfo}@{hostpart}"
    return urlunsplit((parsed.scheme, netloc, parsed.path, parsed.query, parsed.fragment))


def resolve_database_url(
    *,
    explicit_url: str | None = None,
    preferred_env_key: str | None = None,
    env_file: str | Path | None = None,
) -> ResolvedDbUrl:
    env_file_values = load_env_file(env_file)
    candidates: list[str] = []
    if explicit_url:
        candidates.append(explicit_url)
    if preferred_env_key:
        candidates.append(os.environ.get(preferred_env_key, ""))
        candidates.append(env_file_values.get(preferred_env_key, ""))
    candidates.append(os.environ.get("DATABASE_URL", ""))
    candidates.append(env_file_values.get("DATABASE_URL", ""))

    for candidate in candidates:
        normalized = normalize_psycopg_url(candidate)
        if not normalized:
            continue
        parsed = urlsplit(normalized)
        scheme = (parsed.scheme or "").strip().lower()
        if not scheme.startswith("postgresql"):
            raise RuntimeError(
                f"R07 exige PostgreSQL. DATABASE_URL atual usa '{scheme or 'desconhecido'}'."
            )
        return ResolvedDbUrl(
            raw=normalized,
            masked=mask_database_url(normalized),
            scheme=scheme,
            host=(parsed.hostname or "").strip(),
            database=(parsed.path or "").lstrip("/"),
        )

    raise RuntimeError("Nenhuma DATABASE_URL PostgreSQL encontrada para o R07.")


def connect_db(database_url: str):
    conn = psycopg.connect(database_url)
    conn.autocommit = False
    return conn


def table_exists(conn, table_name: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.tables
              WHERE table_schema = 'public' AND table_name = %s
            )
            """,
            (table_name,),
        )
        row = cur.fetchone()
    return bool(row[0]) if row else False


def existing_app_tables(conn) -> list[str]:
    return [table for table in APP_TABLES_IN_ORDER if table_exists(conn, table)]


def get_table_columns(conn, table_name: str) -> list[str]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
            """,
            (table_name,),
        )
        rows = cur.fetchall()
    return [str(row[0]) for row in rows]


def get_table_count(conn, table_name: str) -> int:
    with conn.cursor() as cur:
        cur.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(sql.Identifier(table_name)))
        row = cur.fetchone()
    return int(row[0]) if row else 0


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def dump_table_to_csv(conn, table_name: str, columns: list[str], output_path: Path) -> dict[str, Any]:
    if not columns:
        raise RuntimeError(f"Tabela '{table_name}' sem colunas visiveis.")
    ensure_dir(output_path.parent)
    order_by = ""
    if "id" in columns:
        order_by = " ORDER BY id"
    elif "created_at" in columns:
        order_by = " ORDER BY created_at"

    copy_sql = sql.SQL("COPY (SELECT {} FROM {}{}) TO STDOUT WITH CSV HEADER").format(
        sql.SQL(", ").join(sql.Identifier(col) for col in columns),
        sql.Identifier(table_name),
        sql.SQL(order_by),
    )

    with conn.cursor() as cur, output_path.open("w", encoding="utf-8", newline="") as handle:
        with cur.copy(copy_sql) as copy:
            for chunk in copy:
                if isinstance(chunk, memoryview):
                    handle.write(chunk.tobytes().decode("utf-8"))
                elif isinstance(chunk, bytes):
                    handle.write(chunk.decode("utf-8"))
                else:
                    handle.write(chunk)

    return {
        "table": table_name,
        "columns": columns,
        "row_count": get_table_count(conn, table_name),
        "file": output_path.name,
        "sha256": sha256_file(output_path),
    }


def write_manifest(path: Path, manifest: dict[str, Any]) -> Path:
    ensure_dir(path.parent)
    path.write_text(json.dumps(manifest, ensure_ascii=True, indent=2), encoding="utf-8")
    return path


def read_manifest(backup_dir: Path) -> dict[str, Any]:
    manifest_path = backup_dir / "manifest.json"
    if not manifest_path.exists():
        raise RuntimeError(f"manifest.json nao encontrado em {backup_dir}")
    return json.loads(manifest_path.read_text(encoding="utf-8"))


def truncate_tables(conn, table_names: list[str]) -> None:
    if not table_names:
        return
    stmt = sql.SQL("TRUNCATE {} RESTART IDENTITY CASCADE").format(
        sql.SQL(", ").join(sql.Identifier(name) for name in table_names)
    )
    with conn.cursor() as cur:
        cur.execute(stmt)


def restore_table_from_csv(conn, table_name: str, columns: list[str], input_path: Path) -> int:
    if not input_path.exists():
        raise RuntimeError(f"Arquivo de restore ausente: {input_path}")
    copy_sql = sql.SQL("COPY {} ({}) FROM STDIN WITH CSV HEADER").format(
        sql.Identifier(table_name),
        sql.SQL(", ").join(sql.Identifier(col) for col in columns),
    )
    with conn.cursor() as cur, input_path.open("r", encoding="utf-8", newline="") as handle:
        with cur.copy(copy_sql) as copy:
            for chunk in iter(lambda: handle.read(1024 * 1024), ""):
                if not chunk:
                    break
                copy.write(chunk)
    return get_table_count(conn, table_name)


def reset_serial_sequence(conn, table_name: str) -> None:
    if table_name not in TABLES_WITH_NUMERIC_ID:
        return
    if "id" not in get_table_columns(conn, table_name):
        return
    with conn.cursor() as cur:
        cur.execute("SELECT pg_get_serial_sequence(%s, 'id')", (table_name,))
        row = cur.fetchone()
        sequence_name = row[0] if row else None
        if not sequence_name:
            return
        cur.execute(
            sql.SQL(
                """
                SELECT setval(
                    %s,
                    COALESCE((SELECT MAX(id) FROM {}), 1),
                    EXISTS(SELECT 1 FROM {})
                )
                """
            ).format(sql.Identifier(table_name), sql.Identifier(table_name)),
            (sequence_name,),
        )


def compare_manifest_counts(conn, manifest: dict[str, Any]) -> list[str]:
    mismatches: list[str] = []
    for table_meta in manifest.get("tables", []):
        table_name = str(table_meta["table"])
        expected = int(table_meta["row_count"])
        actual = get_table_count(conn, table_name)
        if actual != expected:
            mismatches.append(f"{table_name}: esperado={expected} atual={actual}")
    return mismatches


def render_counts_markdown(title: str, manifest: dict[str, Any]) -> str:
    lines = [f"## {title}", "", "| Tabela | Linhas | Arquivo |", "| --- | ---: | --- |"]
    for table_meta in manifest.get("tables", []):
        lines.append(
            f"| {table_meta['table']} | {int(table_meta['row_count'])} | `{table_meta['file']}` |"
        )
    lines.append("")
    return "\n".join(lines)


def create_backup(
    *,
    database_url: ResolvedDbUrl,
    output_root: Path,
    label: str,
    mirror_output_root: Path | None = None,
) -> dict[str, Any]:
    backup_dir = ensure_dir(output_root / f"{label}_{utcstamp()}")
    manifest: dict[str, Any] = {
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "label": label,
        "source": {
            "database_url_masked": database_url.masked,
            "host": database_url.host,
            "database": database_url.database,
        },
        "tables": [],
    }

    with connect_db(database_url.raw) as conn:
        table_names = existing_app_tables(conn)
        manifest["tables_present"] = table_names
        with conn.cursor() as cur:
            cur.execute("SELECT current_database(), current_user, version()")
            row = cur.fetchone()
            manifest["source"]["current_database"] = row[0]
            manifest["source"]["current_user"] = row[1]
            manifest["source"]["server_version"] = row[2]

        for table_name in table_names:
            columns = get_table_columns(conn, table_name)
            table_output = backup_dir / f"{table_name}.csv"
            manifest["tables"].append(dump_table_to_csv(conn, table_name, columns, table_output))

    write_manifest(backup_dir / "manifest.json", manifest)
    result: dict[str, Any] = {"backup_dir": str(backup_dir), "manifest": manifest}
    if mirror_output_root:
        mirror_root = ensure_dir(mirror_output_root)
        if backup_dir.parent.resolve() == mirror_root.resolve():
            raise RuntimeError("Destino espelho do R07 nao pode ser o mesmo diretorio do backup local.")
        mirror_backup_dir = mirror_root / backup_dir.name
        if mirror_backup_dir.exists():
            raise RuntimeError(f"Destino espelho ja existe: {mirror_backup_dir}")
        shutil.copytree(backup_dir, mirror_backup_dir)
        result["mirror_backup_dir"] = str(mirror_backup_dir)
    return result


def restore_backup(
    *,
    backup_dir: Path,
    target_database_url: ResolvedDbUrl,
    require_explicit_wipe: bool,
) -> dict[str, Any]:
    if not require_explicit_wipe:
        raise RuntimeError("Restore exige confirmacao explicita de wipe do banco alvo.")

    manifest = read_manifest(backup_dir)
    table_names = [str(item["table"]) for item in manifest.get("tables", [])]
    with connect_db(target_database_url.raw) as conn:
        missing = [table for table in table_names if not table_exists(conn, table)]
        if missing:
            raise RuntimeError(
                "Schema do banco alvo incompleto. Rode migracoes antes do restore. Tabelas ausentes: "
                + ", ".join(missing)
            )

        truncate_tables(conn, list(reversed(table_names)))
        for table_meta in manifest.get("tables", []):
            table_name = str(table_meta["table"])
            columns = [str(col) for col in table_meta["columns"]]
            restore_table_from_csv(conn, table_name, columns, backup_dir / str(table_meta["file"]))
            reset_serial_sequence(conn, table_name)
        conn.commit()
        mismatches = compare_manifest_counts(conn, manifest)
        if mismatches:
            raise RuntimeError("Restore concluido com divergencia de contagem: " + "; ".join(mismatches))

    return {
        "backup_dir": str(backup_dir),
        "target_database_url_masked": target_database_url.masked,
        "tables_restored": table_names,
    }


def remove_dir_if_exists(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path, ignore_errors=True)


def csv_row_count(path: Path) -> int:
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.reader(handle)
        next(reader, None)
        return sum(1 for _ in reader)


def build_common_arg_parser(description: str) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--env-file", default="backend/.env")
    return parser
