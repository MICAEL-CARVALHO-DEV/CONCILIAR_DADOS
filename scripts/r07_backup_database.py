from __future__ import annotations

import json
from pathlib import Path

from r07_backup_restore_lib import (
    build_common_arg_parser,
    create_backup,
    ensure_dir,
    resolve_database_url,
    resolve_optional_path_setting,
    resolve_required_path_setting,
)


def main() -> int:
    parser = build_common_arg_parser("R07 - gerar backup logico do banco operacional PostgreSQL.")
    parser.add_argument("--database-url", default="")
    parser.add_argument("--database-url-env", default="BACKUP_DATABASE_URL")
    parser.add_argument("--output-root", default="")
    parser.add_argument("--output-root-env", default="BACKUP_OUTPUT_ROOT")
    parser.add_argument("--mirror-output-root", default="")
    parser.add_argument("--mirror-output-root-env", default="BACKUP_MIRROR_OUTPUT_ROOT")
    parser.add_argument("--label", default="sec_emendas_backup")
    args = parser.parse_args()

    resolved = resolve_database_url(
        explicit_url=args.database_url,
        preferred_env_key=args.database_url_env,
        env_file=args.env_file,
    )
    output_root_value = resolve_required_path_setting(
        explicit_value=args.output_root,
        preferred_env_key=args.output_root_env,
        env_file=args.env_file,
        fallback_value="tmp/r07_backups",
    )
    output_root = ensure_dir(Path(output_root_value))
    mirror_output_root = resolve_optional_path_setting(
        explicit_value=args.mirror_output_root,
        preferred_env_key=args.mirror_output_root_env,
        env_file=args.env_file,
    )
    result = create_backup(
        database_url=resolved,
        output_root=output_root,
        label=args.label,
        mirror_output_root=Path(mirror_output_root) if mirror_output_root else None,
    )
    print(json.dumps(result, ensure_ascii=True, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
