from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import Callable

from fastapi import WebSocket, WebSocketDisconnect


class WsConnectionBroker:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)

    async def broadcast(self, payload: dict) -> None:
        async with self._lock:
            targets = list(self._connections)

        dead: list[WebSocket] = []
        for ws in targets:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)

        if dead:
            async with self._lock:
                for ws in dead:
                    self._connections.discard(ws)


class PresenceBroker:
    def __init__(self, utcnow: Callable[[], datetime]) -> None:
        self._utcnow = utcnow
        self._by_emenda: dict[int, dict[WebSocket, dict]] = {}
        self._by_socket: dict[WebSocket, set[int]] = {}
        self._lock = asyncio.Lock()

    def _normalize_info(self, actor: dict) -> dict:
        return {
            "usuario_nome": str(actor.get("name") or "-"),
            "setor": str(actor.get("role") or "-"),
            "at": self._utcnow().isoformat() + "Z",
        }

    @staticmethod
    def _snapshot_from_bucket(bucket: dict[WebSocket, dict]) -> list[dict]:
        dedup: dict[str, dict] = {}
        for info in bucket.values():
            key = f"{info.get('usuario_nome', '-')}|{info.get('setor', '-')}"
            prev = dedup.get(key)
            if prev is None or str(info.get("at") or "") > str(prev.get("at") or ""):
                dedup[key] = {
                    "usuario_nome": str(info.get("usuario_nome") or "-"),
                    "setor": str(info.get("setor") or "-"),
                    "at": str(info.get("at") or ""),
                }
        return sorted(
            list(dedup.values()),
            key=lambda item: (str(item.get("setor") or ""), str(item.get("usuario_nome") or "")),
        )

    async def join(self, websocket: WebSocket, emenda_id: int, actor: dict) -> list[dict]:
        if emenda_id <= 0:
            return []
        async with self._lock:
            bucket = self._by_emenda.setdefault(emenda_id, {})
            bucket[websocket] = self._normalize_info(actor)
            self._by_socket.setdefault(websocket, set()).add(emenda_id)
            return self._snapshot_from_bucket(bucket)

    async def leave(self, websocket: WebSocket, emenda_id: int) -> list[dict]:
        if emenda_id <= 0:
            return []
        async with self._lock:
            bucket = self._by_emenda.get(emenda_id)
            if not bucket:
                return []

            bucket.pop(websocket, None)
            socket_emendas = self._by_socket.get(websocket)
            if socket_emendas is not None:
                socket_emendas.discard(emenda_id)
                if not socket_emendas:
                    self._by_socket.pop(websocket, None)

            if not bucket:
                self._by_emenda.pop(emenda_id, None)
                return []

            return self._snapshot_from_bucket(bucket)

    async def disconnect(self, websocket: WebSocket) -> dict[int, list[dict]]:
        changes: dict[int, list[dict]] = {}
        async with self._lock:
            emenda_ids = list(self._by_socket.pop(websocket, set()))
            for emenda_id in emenda_ids:
                bucket = self._by_emenda.get(emenda_id)
                if not bucket:
                    continue
                bucket.pop(websocket, None)
                if not bucket:
                    self._by_emenda.pop(emenda_id, None)
                    changes[emenda_id] = []
                else:
                    changes[emenda_id] = self._snapshot_from_bucket(bucket)
        return changes


def build_update_payload(entity: str, entity_id: int | None, utcnow: Callable[[], datetime]) -> dict:
    return {
        "type": "update",
        "entity": entity,
        "id": entity_id,
        "at": utcnow().isoformat() + "Z",
    }


def build_presence_payload(emenda_id: int, users: list[dict], utcnow: Callable[[], datetime]) -> dict:
    return {
        "type": "presence",
        "entity": "emenda",
        "id": emenda_id,
        "users": users,
        "at": utcnow().isoformat() + "Z",
    }


async def websocket_updates_service(
    *,
    websocket: WebSocket,
    api_auth_enabled: bool,
    session_factory,
    actor_from_bearer_token: Callable,
    actor_from_legacy_session: Callable,
    utcnow: Callable[[], datetime],
    ws_broker: WsConnectionBroker,
    presence_broker: PresenceBroker,
) -> None:
    actor = {
        "id": None,
        "name": (websocket.query_params.get("user_name") or "anon").strip() or "anon",
        "role": (websocket.query_params.get("user_role") or "-").strip().upper() or "-",
        "auth_type": "disabled",
    }

    if api_auth_enabled:
        token = (websocket.query_params.get("token") or "").strip()
        if not token:
            await websocket.close(code=1008)
            return

        db = session_factory()
        try:
            actor = actor_from_bearer_token(token, db) or actor_from_legacy_session(token, db)
        finally:
            db.close()

        if not actor:
            await websocket.close(code=1008)
            return

    await ws_broker.connect(websocket)
    await websocket.send_json({
        "type": "ready",
        "entity": "ws",
        "id": None,
        "at": utcnow().isoformat() + "Z",
    })

    try:
        while True:
            data = await websocket.receive_text()
            if data and data.strip().lower() == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "entity": "ws",
                    "id": None,
                    "at": utcnow().isoformat() + "Z",
                })
                continue

            try:
                payload = json.loads(data or "")
            except Exception:
                payload = None

            if not isinstance(payload, dict):
                continue

            msg_type = str(payload.get("type") or "").strip().lower()
            if msg_type != "presence":
                continue

            action = str(payload.get("action") or "").strip().lower()
            emenda_id = int(payload.get("emenda_id") or 0)
            if emenda_id <= 0:
                continue

            if action == "join":
                users = await presence_broker.join(websocket, emenda_id, actor)
            elif action == "leave":
                users = await presence_broker.leave(websocket, emenda_id)
            else:
                continue

            await ws_broker.broadcast(build_presence_payload(emenda_id, users, utcnow))
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await ws_broker.disconnect(websocket)
        changes = await presence_broker.disconnect(websocket)
        for emenda_id, users in changes.items():
            await ws_broker.broadcast(build_presence_payload(emenda_id, users, utcnow))
