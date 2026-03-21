from __future__ import annotations

import json
from pathlib import Path

from r07_backup_restore_lib import (
    build_common_arg_parser,
    create_backup,
    ensure_dir,
    resolve_database_url,
)


def main() -> int:
    parser = build_common_arg_parser("R07 - gerar backup logico do banco operacional PostgreSQL.")
    parser.add_argument("--database-url", default="")
    parser.add_argument("--database-url-env", default="BACKUP_DATABASE_URL")
    parser.add_argument("--output-root", default="tmp/r07_backups")
    parser.add_argument("--label", default="sec_emendas_backup")
    args = parser.parse_args()

    resolved = resolve_database_url(
        explicit_url=args.database_url,
        preferred_env_key=args.database_url_env,
        env_file=args.env_file,
    )
    output_root = ensure_dir(Path(args.output_root))
    result = create_backup(database_url=resolved, output_root=output_root, label=args.label)
    print(json.dumps(result, ensure_ascii=True, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
