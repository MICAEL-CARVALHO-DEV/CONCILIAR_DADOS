import argparse
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def _normalize_base_url(raw: str) -> str:
    value = (raw or "").strip().rstrip("/")
    return value or "http://127.0.0.1:8000"


def _fetch_health(base_url: str, timeout_seconds: int) -> dict:
    url = f"{base_url}/health"
    request = Request(url, headers={"Accept": "application/json"})
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            payload = response.read().decode("utf-8")
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Falha HTTP em {url}: {exc.code} {body}") from exc
    except URLError as exc:
        raise SystemExit(f"Nao foi possivel conectar em {url}: {exc.reason}") from exc

    try:
        return json.loads(payload)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"/health retornou JSON invalido: {payload}") from exc


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Valida o endpoint /health e a prontidao operacional do ambiente."
    )
    parser.add_argument(
        "--base-url",
        default=os.environ.get("SEC_API_BASE_URL", "http://127.0.0.1:8000"),
        help="Base URL da API a ser validada.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="Timeout em segundos para a chamada HTTP.",
    )
    parser.add_argument(
        "--expect-production",
        action="store_true",
        help="Exige APP_ENV=production no retorno do /health.",
    )
    parser.add_argument(
        "--require-ready",
        action="store_true",
        help="Falha se production_ready for false.",
    )
    parser.add_argument(
        "--require-no-warnings",
        action="store_true",
        help="Falha se runtime_warnings vier preenchido.",
    )
    parser.add_argument(
        "--expect-branch",
        default="",
        help="Exige deployment.branch igual ao valor informado.",
    )
    args = parser.parse_args()

    base_url = _normalize_base_url(args.base_url)
    data = _fetch_health(base_url, args.timeout)

    required_keys = {
        "ok",
        "app_env",
        "database_backend",
        "legacy_import_sync_enabled",
        "production_ready",
        "runtime_warnings",
        "auth_hardening",
    }
    missing = sorted(required_keys - set(data))
    if missing:
        raise SystemExit(f"/health nao trouxe as chaves obrigatorias: {missing}")

    auth_required = {
        "password_min_length",
        "login_failure_window_minutes",
        "login_failure_max_attempts",
        "login_lockout_minutes",
    }
    auth_data = data.get("auth_hardening") or {}
    missing_auth = sorted(auth_required - set(auth_data))
    if missing_auth:
        raise SystemExit(f"/health.auth_hardening nao trouxe as chaves obrigatorias: {missing_auth}")

    if not data.get("ok"):
        raise SystemExit("/health retornou ok=false")

    if args.expect_production and data.get("app_env") != "production":
        raise SystemExit(f"Esperava app_env=production, mas veio {data.get('app_env')!r}")

    if args.require_ready and not data.get("production_ready"):
        raise SystemExit(
            "production_ready=false. Ajuste o ambiente antes do go-live. "
            f"warnings={data.get('runtime_warnings')}"
        )

    warnings = data.get("runtime_warnings") or []
    if args.require_no_warnings and warnings:
        raise SystemExit(f"runtime_warnings nao esta vazio: {warnings}")

    deployment = data.get("deployment") or {}
    if args.expect_branch:
        branch = str(deployment.get("branch") or "").strip()
        if branch != args.expect_branch:
            raise SystemExit(
                f"Esperava deployment.branch={args.expect_branch!r}, mas veio {branch!r}"
            )

    print("U09 health readiness validation: OK")
    print(f"base_url={base_url}")
    print(f"app_env={data.get('app_env')}")
    print(f"database_backend={data.get('database_backend')}")
    print(f"production_ready={data.get('production_ready')}")
    print(f"legacy_import_sync_enabled={data.get('legacy_import_sync_enabled')}")
    print(f"runtime_warnings={warnings}")
    print(f"deployment_service={deployment.get('service')}")
    print(f"deployment_branch={deployment.get('branch')}")
    print(f"deployment_commit={deployment.get('commit')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
