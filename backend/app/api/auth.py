from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query, Request

from ..core.dependencies import _actor_from_headers, _actor_optional_from_headers, _require_owner
from ..db import get_db
from ..schemas import (
    AuthAuditLogOut,
    AuthChangePasswordIn,
    AuthGoogleIn,
    AuthLoginIn,
    AuthOut,
    AuthRecoveryRequestIn,
    AuthRegisterIn,
    UserAdminOut,
    UserOut,
    UserStatusUpdate,
)
from ..services import auth_service


def create_auth_router(broadcast_update) -> APIRouter:
    router = APIRouter()

    @router.post("/auth/google-intake")
    def auth_google_intake(payload: AuthGoogleIn, request: Request, db=Depends(get_db)) -> dict:
        return auth_service.auth_google_intake_service(payload=payload, request=request, db=db)

    @router.post("/auth/register", response_model=AuthOut)
    def auth_register(
        payload: AuthRegisterIn,
        authorization: Annotated[str | None, Header(alias="Authorization")] = None,
        x_session_token: Annotated[str | None, Header(alias="X-Session-Token")] = None,
        db=Depends(get_db),
    ):
        actor = _actor_optional_from_headers(authorization, x_session_token, db)
        return auth_service.auth_register_service(payload=payload, actor=actor, db=db)

    @router.post("/auth/google", response_model=AuthOut)
    def auth_google(payload: AuthGoogleIn, request: Request, db=Depends(get_db)):
        return auth_service.auth_google_service(payload=payload, request=request, db=db)

    @router.post("/auth/login", response_model=AuthOut)
    def auth_login(payload: AuthLoginIn, request: Request, db=Depends(get_db)):
        return auth_service.auth_login_service(payload=payload, request=request, db=db)

    @router.post("/auth/recovery-request")
    def auth_recovery_request(payload: AuthRecoveryRequestIn, request: Request, db=Depends(get_db)):
        return auth_service.auth_recovery_request_service(payload=payload, request=request, db=db)

    @router.post("/auth/change-password")
    def auth_change_password(payload: AuthChangePasswordIn, request: Request, actor: dict = Depends(_actor_from_headers), db=Depends(get_db)):
        return auth_service.auth_change_password_service(payload=payload, actor=actor, request=request, db=db)

    @router.get("/auth/me", response_model=UserOut)
    def auth_me(actor: dict = Depends(_actor_from_headers)):
        return auth_service.auth_me_service(actor=actor)

    @router.post("/auth/logout")
    def auth_logout(actor: dict = Depends(_actor_from_headers), db=Depends(get_db)):
        return auth_service.auth_logout_service(actor=actor, db=db)

    @router.get("/auth/audit", response_model=list[AuthAuditLogOut])
    def auth_audit_logs(
        limit: int = Query(default=50, ge=1, le=200),
        _actor: dict = Depends(_require_owner),
        db=Depends(get_db),
    ):
        return auth_service.list_auth_audit_logs_service(limit=limit, db=db)

    @router.get("/users", response_model=list[UserAdminOut])
    def listar_usuarios(
        include_inactive: bool = Query(default=True),
        _actor: dict = Depends(_require_owner),
        db=Depends(get_db),
    ):
        return auth_service.list_users_service(include_inactive=include_inactive, db=db)

    @router.patch("/users/{user_id}/status")
    def alterar_status_usuario(
        user_id: int,
        payload: UserStatusUpdate,
        actor: dict = Depends(_require_owner),
        db=Depends(get_db),
    ):
        return auth_service.update_user_status_service(
            user_id=user_id,
            payload=payload,
            actor=actor,
            db=db,
            broadcast_update=broadcast_update,
        )

    return router
