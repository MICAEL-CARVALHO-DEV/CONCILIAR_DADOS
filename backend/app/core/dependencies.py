from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..settings import settings
from .security import (
    ALLOWED_ROLES,
    _actor_from_bearer_token,
    _actor_from_legacy_session,
    _normalize_role,
)

MANAGER_ROLES = {"APG", "SUPERVISAO", "PROGRAMADOR"}
OWNER_ROLE = "PROGRAMADOR"


def _actor_from_headers(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    x_session_token: Annotated[str | None, Header(alias="X-Session-Token")] = None,
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
    x_user_name: Annotated[str | None, Header(alias="X-User-Name")] = None,
    x_user_role: Annotated[str | None, Header(alias="X-User-Role")] = None,
    db: Session = Depends(get_db),
) -> dict:
    if not settings.API_AUTH_ENABLED:
        name = (x_user_name or "sistema").strip() or "sistema"
        role = _normalize_role(x_user_role or "PROGRAMADOR")
        return {"id": None, "name": name, "role": role, "session_token": None, "session_sid": None, "auth_type": "disabled"}

    auth_value = (authorization or "").strip()
    if auth_value.lower().startswith("bearer "):
        bearer_token = auth_value[7:].strip()
        actor = _actor_from_bearer_token(bearer_token, db)
        if actor:
            return actor

    session_token = (x_session_token or "").strip()
    if session_token:
        actor = _actor_from_bearer_token(session_token, db)
        if actor:
            return actor

        actor = _actor_from_legacy_session(session_token, db)
        if actor:
            return actor

    if settings.shared_key_auth_enabled and x_api_key and x_api_key == settings.API_SHARED_KEY:
        name = (x_user_name or "").strip()
        role = (x_user_role or "").strip().upper()
        if name and role in ALLOWED_ROLES:
            return {"id": None, "name": name, "role": role, "session_token": None, "session_sid": None, "auth_type": "shared_key"}

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="nao autenticado")


def _actor_optional_from_headers(
    authorization: str | None,
    x_session_token: str | None,
    db: Session,
) -> dict | None:
    auth_value = (authorization or "").strip()
    if auth_value.lower().startswith("bearer "):
        bearer_token = auth_value[7:].strip()
        actor = _actor_from_bearer_token(bearer_token, db)
        if actor:
            return actor

    token = (x_session_token or "").strip()
    if not token:
        return None

    actor = _actor_from_bearer_token(token, db)
    if actor:
        return actor

    return _actor_from_legacy_session(token, db)


def _require_manager(actor: dict = Depends(_actor_from_headers)) -> dict:
    if actor["role"] not in MANAGER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="perfil sem permissao")
    return actor


def _require_owner(actor: dict = Depends(_actor_from_headers)) -> dict:
    if actor["role"] != OWNER_ROLE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="apenas PROGRAMADOR pode aprovar perfis")
    return actor
