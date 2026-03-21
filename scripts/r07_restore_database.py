from __future__ import annotations

import json
from pathlib import Path

from r07_backup_restore_lib import build_common_arg_parser, resolve_database_url, restore_backup


def main() -> int:
    parser = build_common_arg_parser("R07 - restaurar backup logico do banco operacional PostgreSQL.")
    parser.add_argument("--backup-dir", required=True)
    parser.add_argument("--target-database-url", default="")
    parser.add_argument("--target-database-url-env", default="BACKUP_RESTORE_DATABASE_URL")
    parser.add_argument(
        "--i-understand-this-wipes-target",
        action="store_true",
        help="Confirmacao explicita de que o restore vai truncar o banco alvo.",
    )
    args = parser.parse_args()

    resolved = resolve_database_url(
        explicit_url=args.target_database_url,
        preferred_env_key=args.target_database_url_env,
        env_file=args.env_file,
    )
    result = restore_backup(
        backup_dir=Path(args.backup_dir),
        target_database_url=resolved,
        require_explicit_wipe=args.i_understand_this_wipes_target,
    )
    print(json.dumps(result, ensure_ascii=True, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
