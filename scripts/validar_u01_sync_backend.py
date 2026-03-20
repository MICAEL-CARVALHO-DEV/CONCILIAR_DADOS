import os
import subprocess
import sys
import tempfile
from pathlib import Path


def _ensure_backend_python(repo_root: Path) -> None:
    try:
        import fastapi  # noqa: F401
        return
    except ModuleNotFoundError:
        pass

    venv_python = repo_root / "backend" / ".venv" / "Scripts" / "python.exe"
    if venv_python.exists() and Path(sys.executable).resolve() != venv_python.resolve():
        script_path = str(Path(__file__).resolve())
        completed = subprocess.run([str(venv_python), script_path, *sys.argv[1:]], check=False)
        raise SystemExit(completed.returncode)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    _ensure_backend_python(repo_root)
    backend_root = repo_root / "backend"
    if str(backend_root) not in sys.path:
        sys.path.insert(0, str(backend_root))

    tmp_dir = Path(tempfile.mkdtemp(prefix="sec_u01_sync_"))
    db_path = tmp_dir / "u01_sync.db"

    os.environ["APP_ENV"] = "local"
    os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{db_path.as_posix()}"
    os.environ["API_AUTH_ENABLED"] = "false"
    os.environ["DB_AUTO_BOOTSTRAP"] = "true"
    os.environ["ENABLE_DEMO_MODE"] = "false"

    from fastapi.testclient import TestClient
    from app.main import app

    headers = {
        "X-User-Name": "u01_tester",
        "X-User-Role": "PROGRAMADOR",
        "Content-Type": "application/json",
    }

    with TestClient(app) as client:
        health = client.get("/health")
        assert health.status_code == 200, health.text
        payload = health.json()
        assert payload["ok"] is True

        created = client.post(
            "/emendas",
            headers=headers,
            json={
                "id_interno": "EPI-2026-U01",
                "ano": 2026,
                "identificacao": "Validacao U01",
                "status_oficial": "Recebido",
            },
        )
        assert created.status_code == 200, created.text
        emenda = created.json()
        emenda_id = int(emenda["id"])

        with client.websocket_connect("/ws") as ws:
            ready = ws.receive_json()
            assert ready["type"] == "ready", ready

            ev1 = client.post(
                f"/emendas/{emenda_id}/eventos",
                headers=headers,
                json={
                    "tipo_evento": "EDIT_FIELD",
                    "campo_alterado": "Municipio",
                    "valor_antigo": "",
                    "valor_novo": "Feira de Santana",
                    "motivo": "validacao websocket 1",
                },
            )
            assert ev1.status_code == 200, ev1.text

            ev2 = client.post(
                f"/emendas/{emenda_id}/eventos",
                headers=headers,
                json={
                    "tipo_evento": "EDIT_FIELD",
                    "campo_alterado": "Valor Atual",
                    "valor_antigo": "0",
                    "valor_novo": "150000",
                    "motivo": "validacao websocket 2",
                },
            )
            assert ev2.status_code == 200, ev2.text

            msg1 = ws.receive_json()
            msg2 = ws.receive_json()
            assert msg1["type"] == "update", msg1
            assert msg2["type"] == "update", msg2

        emendas = client.get("/emendas", headers=headers)
        assert emendas.status_code == 200, emendas.text
        rows = emendas.json()
        target = next((row for row in rows if int(row["id"]) == emenda_id), None)
        assert target is not None, rows
        assert target["municipio"] == "Feira de Santana", target
        assert float(target["valor_atual"]) == 150000.0, target
        assert isinstance(target.get("eventos"), list) and len(target["eventos"]) >= 2, target

    print("U01 backend sync validation: OK")
    print(f"db_temp={db_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
