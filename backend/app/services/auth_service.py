from __future__ import annotations

import secrets
from datetime import datetime, timedelta
from typing import Callable

from fastapi import HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..core.dependencies import OWNER_ROLE
from ..core.security import (
    IMMUTABLE_OWNER_NAMES,
    _add_auth_audit,
    _assert_allowed_owner_identity,
    _create_jwt_session,
    _find_user_by_email,
    _find_user_by_login,
    _hash_password,
    _hash_text,
    _normalize_role,
    _normalize_user_name,
    _utcnow,
    _validate_password_complexity,
    _verify_google_identity_token,
    _verify_user_password,
)
from ..models import AuthAuditLog, Usuario, UsuarioSessao
from ..settings import settings

PUBLIC_REGISTER_ROLES = {"APG", "SUPERVISAO", "POWERBI"}
REGISTRATION_STATUS_PENDING = "EM_ANALISE"
REGISTRATION_STATUS_APPROVED = "APROVADO"
REGISTRATION_STATUS_REJECTED = "RECUSADO"


def _owner_exists(db: Session) -> bool:
    return (
        db.query(Usuario.id)
        .filter(Usuario.ativo.is_(True), Usuario.perfil == OWNER_ROLE)
        .first()
        is not None
    )


def _registration_status(user: Usuario | None) -> str:
    if user is None:
        return REGISTRATION_STATUS_APPROVED
    raw = (getattr(user, "status_cadastro", None) or "").strip().upper()
    if raw:
        return raw
    return REGISTRATION_STATUS_APPROVED if bool(getattr(user, "ativo", True)) else REGISTRATION_STATUS_PENDING


def _inactive_account_detail(user: Usuario | None) -> str:
    if _registration_status(user) == REGISTRATION_STATUS_REJECTED:
        return "Seu cadastro foi recusado. Procure o PROGRAMADOR para revisar o acesso."
    return "Sua conta esta em analise. Aguarde aprovacao do PROGRAMADOR."


def auth_google_intake_service(*, payload, request: Request, db: Session) -> dict:
    identity = _verify_google_identity_token(payload.credential)

    user = db.query(Usuario).filter(Usuario.google_sub == identity["sub"]).first()
    if user is not None:
        detail = (
            _inactive_account_detail(user)
            if not user.ativo
            else "Sua conta Google ja esta cadastrada. Use o login."
        )
        _add_auth_audit(
            db,
            request=request,
            event_type="GOOGLE_INTAKE",
            login_identificador=identity["email"],
            detail=detail,
            success=False,
            provider="GOOGLE",
            user=user,
        )
        db.commit()
        raise HTTPException(status_code=(403 if not user.ativo else 409), detail=detail)

    existing_by_email = _find_user_by_email(db, identity["email"])
    if existing_by_email is not None:
        if not existing_by_email.ativo:
            detail = _inactive_account_detail(existing_by_email)
            status_code = 403
        elif existing_by_email.google_sub:
            detail = "Conta Google nao corresponde ao cadastro."
            status_code = 409
        else:
            detail = "Ja existe cadastro com este Gmail. Use o login normal e depois sincronize o Google."
            status_code = 409
        _add_auth_audit(
            db,
            request=request,
            event_type="GOOGLE_INTAKE",
            login_identificador=identity["email"],
            detail=detail,
            success=False,
            provider="GOOGLE",
            user=existing_by_email,
        )
        db.commit()
        raise HTTPException(status_code=status_code, detail=detail)

    _add_auth_audit(
        db,
        request=request,
        event_type="GOOGLE_INTAKE",
        login_identificador=identity["email"],
        detail="identidade google validada para pre-cadastro",
        success=True,
        provider="GOOGLE",
    )
    db.commit()

    return {
        "nome": identity["name"],
        "email": identity["email"],
        "email_verificado": True,
    }


def auth_register_service(*, payload, actor: dict | None, db: Session) -> dict:
    nome = payload.nome.strip()
    email = (payload.email or "").strip().lower()
    role = payload.perfil
    google_credential = (payload.google_credential or "").strip()
    using_google = bool(google_credential)
    google_identity = None

    if using_google:
        google_identity = _verify_google_identity_token(google_credential)
        if email and email != google_identity["email"]:
            raise HTTPException(status_code=409, detail="gmail informado nao corresponde ao Google")
        email = google_identity["email"]

    exists = db.query(Usuario).filter(Usuario.nome.ilike(nome)).first()
    if exists:
        if not exists.ativo:
            raise HTTPException(status_code=403, detail=_inactive_account_detail(exists))
        raise HTTPException(status_code=409, detail="usuario ja existe")

    if email:
        existing_email = _find_user_by_email(db, email)
        if existing_email is not None:
            if not existing_email.ativo:
                raise HTTPException(status_code=403, detail=_inactive_account_detail(existing_email))
            raise HTTPException(status_code=409, detail="gmail ja cadastrado")

    if google_identity is not None:
        existing_google = db.query(Usuario).filter(Usuario.google_sub == google_identity["sub"]).first()
        if existing_google is not None:
            detail = (
                _inactive_account_detail(existing_google)
                if not existing_google.ativo
                else "Sua conta Google ja esta cadastrada. Use o login."
            )
            raise HTTPException(status_code=(403 if not existing_google.ativo else 409), detail=detail)

    owner_exists = _owner_exists(db)
    activate_now = True
    pending_approval = False

    if not owner_exists and actor is None:
        if role != OWNER_ROLE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="primeiro cadastro deve ser PROGRAMADOR",
            )
        _assert_allowed_owner_identity(nome)
    elif actor is None:
        if role not in PUBLIC_REGISTER_ROLES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="cadastro publico nao permite este perfil",
            )
        if not email:
            raise HTTPException(status_code=400, detail="informe um gmail valido para solicitar acesso")
        activate_now = False
        pending_approval = True
    else:
        actor_role = actor.get("role")
        if actor_role != OWNER_ROLE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="apenas PROGRAMADOR pode criar/aprovar perfis",
            )
        if role == OWNER_ROLE:
            _assert_allowed_owner_identity(nome)

    if using_google:
        pwd_hash = ""
    else:
        raw_password = (payload.senha or "").strip()
        if not raw_password:
            raise HTTPException(status_code=400, detail="senha obrigatoria no cadastro normal")
        pwd_hash = _hash_password(raw_password)

    user = Usuario(
        nome=nome,
        email=(email or None),
        google_sub=(google_identity["sub"] if google_identity else None),
        setor=role,
        perfil=role,
        senha_salt="",
        senha_hash=pwd_hash,
        ativo=activate_now,
        status_cadastro=(REGISTRATION_STATUS_PENDING if pending_approval else REGISTRATION_STATUS_APPROVED),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        conflict = db.query(Usuario.id).filter(Usuario.nome.ilike(nome)).first()
        if conflict is not None:
            raise HTTPException(status_code=409, detail="usuario ja existe")
        conflict = _find_user_by_email(db, email)
        if email and conflict is not None:
            raise HTTPException(status_code=409, detail="gmail ja cadastrado")
        if google_identity is not None:
            conflict = db.query(Usuario.id).filter(Usuario.google_sub == google_identity["sub"]).first()
            if conflict is not None:
                raise HTTPException(status_code=409, detail="sua conta Google ja esta cadastrada")
        raise
    db.refresh(user)

    if pending_approval:
        return {
            "token": None,
            "token_type": "bearer",
            "usuario": {"id": user.id, "nome": user.nome, "perfil": user.perfil},
            "pending_approval": True,
        }

    token = _create_jwt_session(db, user)
    return {
        "token": token,
        "token_type": "bearer",
        "usuario": {"id": user.id, "nome": user.nome, "perfil": user.perfil},
    }


def auth_google_service(*, payload, request: Request, db: Session) -> dict:
    identity = _verify_google_identity_token(payload.credential)

    if not _owner_exists(db):
        _add_auth_audit(
            db,
            request=request,
            event_type="LOGIN_GOOGLE",
            login_identificador=identity["email"],
            detail="login google bloqueado ate existir PROGRAMADOR local",
            success=False,
            provider="GOOGLE",
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="configure um PROGRAMADOR local antes de habilitar o login google",
        )

    user = db.query(Usuario).filter(Usuario.google_sub == identity["sub"]).first()
    if user is not None:
        if not user.ativo:
            detail = _inactive_account_detail(user)
            _add_auth_audit(
                db,
                request=request,
                event_type="LOGIN_GOOGLE",
                login_identificador=identity["email"],
                detail=detail,
                success=False,
                provider="GOOGLE",
                user=user,
            )
            db.commit()
            raise HTTPException(status_code=403, detail=detail)

        _add_auth_audit(
            db,
            request=request,
            event_type="LOGIN_GOOGLE",
            login_identificador=identity["email"],
            detail="login com google realizado com sucesso",
            success=True,
            provider="GOOGLE",
            user=user,
        )
        token = _create_jwt_session(db, user)
        return {
            "token": token,
            "token_type": "bearer",
            "usuario": {"id": user.id, "nome": user.nome, "perfil": user.perfil},
            "pending_approval": False,
        }

    existing_by_email = _find_user_by_email(db, identity["email"])
    if existing_by_email is not None:
        if existing_by_email.google_sub and existing_by_email.google_sub != identity["sub"]:
            detail = "Conta Google nao corresponde ao cadastro."
            status_code = 409
        elif not existing_by_email.ativo:
            detail = _inactive_account_detail(existing_by_email)
            status_code = 403
        else:
            detail = "Ja existe cadastro com este Gmail. Use o login normal e depois sincronize o Google."
            status_code = 409

        _add_auth_audit(
            db,
            request=request,
            event_type="LOGIN_GOOGLE",
            login_identificador=identity["email"],
            detail=detail,
            success=False,
            provider="GOOGLE",
            user=existing_by_email,
        )
        db.commit()
        raise HTTPException(status_code=status_code, detail=detail)

    detail = "Conta Google ainda nao cadastrada. Use Cadastrar para solicitar acesso."
    _add_auth_audit(
        db,
        request=request,
        event_type="LOGIN_GOOGLE",
        login_identificador=identity["email"],
        detail=detail,
        success=False,
        provider="GOOGLE",
    )
    db.commit()
    raise HTTPException(status_code=404, detail=detail)


def auth_login_service(*, payload, request: Request, db: Session) -> dict:
    nome = payload.nome.strip()
    user = _find_user_by_login(db, nome)
    if not user:
        audit_detail = "usuario nao encontrado"
        public_detail = "Credenciais invalidas."
        _add_auth_audit(
            db,
            request=request,
            event_type="LOGIN_PASSWORD",
            login_identificador=nome,
            detail=audit_detail,
            success=False,
            provider="LOCAL",
        )
        db.commit()
        if settings.is_dev_environment:
            raise HTTPException(status_code=404, detail="Usuario nao encontrado. Use Cadastrar para solicitar acesso.")
        raise HTTPException(status_code=401, detail=public_detail)

    if user.locked_until and user.locked_until > datetime.utcnow():
        diff = user.locked_until - datetime.utcnow()
        mins = int(diff.total_seconds() / 60) + 1
        detail = f"Conta bloqueada temporariamente. Tente novamente em {mins} minutos."
        _add_auth_audit(
            db,
            request=request,
            event_type="LOGIN_PASSWORD",
            login_identificador=nome,
            detail=f"bloqueio temporario (falhas: {user.failed_login_attempts})",
            success=False,
            provider="LOCAL",
            user=user,
        )
        db.commit()
        raise HTTPException(status_code=403, detail=detail)

    if not user.ativo:
        detail = _inactive_account_detail(user)
        _add_auth_audit(
            db,
            request=request,
            event_type="LOGIN_PASSWORD",
            login_identificador=nome,
            detail=detail,
            success=False,
            provider="LOCAL",
            user=user,
        )
        db.commit()
        raise HTTPException(status_code=403, detail=detail)

    valid, used_legacy = _verify_user_password(user, payload.senha)
    if not valid:
        audit_detail = "senha invalida"
        public_detail = "Credenciais invalidas."
        
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
            audit_detail = f"senha invalida - CONTA BLOQUEADA (tentativa {user.failed_login_attempts})"
        else:
            audit_detail = f"senha invalida (tentativa {user.failed_login_attempts})"

        _add_auth_audit(
            db,
            request=request,
            event_type="LOGIN_PASSWORD",
            login_identificador=nome,
            detail=audit_detail,
            success=False,
            provider="LOCAL",
            user=user,
        )
        db.commit()
        raise HTTPException(status_code=401, detail=public_detail)

    user.failed_login_attempts = 0
    user.locked_until = None

    if used_legacy:
        user.senha_hash = _hash_password(payload.senha)
        user.senha_salt = ""

    _add_auth_audit(
        db,
        request=request,
        event_type="LOGIN_PASSWORD",
        login_identificador=nome,
        detail="login com senha realizado com sucesso",
        success=True,
        provider="LOCAL",
        user=user,
    )
    token = _create_jwt_session(db, user)
    return {
        "token": token,
        "token_type": "bearer",
        "usuario": {"id": user.id, "nome": user.nome, "perfil": user.perfil},
    }


def auth_change_password_service(*, payload, actor: dict, request: Request, db: Session) -> dict:
    actor_id = actor.get("id")
    if actor_id is None:
        raise HTTPException(status_code=401, detail="sessao invalida")

    user = db.get(Usuario, int(actor_id))
    if not user:
        raise HTTPException(status_code=404, detail="usuario nao encontrado")

    if not user.ativo:
        detail = _inactive_account_detail(user)
        _add_auth_audit(
            db,
            request=request,
            event_type="CHANGE_PASSWORD",
            login_identificador=user.nome,
            detail=detail,
            success=False,
            provider="LOCAL",
            user=user,
        )
        db.commit()
        raise HTTPException(status_code=403, detail=detail)

    senha_atual = (payload.senha_atual or "").strip()
    nova_senha = (payload.nova_senha or "").strip()
    if not senha_atual or not nova_senha:
        raise HTTPException(status_code=400, detail="informe senha atual e nova senha")
    if senha_atual == nova_senha:
        raise HTTPException(status_code=400, detail="a nova senha deve ser diferente da atual")

    valid, _used_legacy = _verify_user_password(user, senha_atual)
    if not valid:
        _add_auth_audit(
            db,
            request=request,
            event_type="CHANGE_PASSWORD",
            login_identificador=user.nome,
            detail="senha atual invalida",
            success=False,
            provider="LOCAL",
            user=user,
        )
        db.commit()
        raise HTTPException(status_code=401, detail="senha atual incorreta")

    _validate_password_complexity(payload.nova_senha)
    user.senha_hash = _hash_password(payload.nova_senha)
    user.senha_salt = ""
    _add_auth_audit(
        db,
        request=request,
        event_type="CHANGE_PASSWORD",
        login_identificador=user.nome,
        detail="senha alterada com sucesso",
        success=True,
        provider="LOCAL",
        user=user,
    )
    db.commit()

    return {"ok": True, "detail": "Senha atualizada com sucesso."}


def auth_recovery_request_service(*, payload, request: Request, db: Session) -> dict:
    identificador = payload.identificador.strip()
    user = _find_user_by_login(db, identificador)
    if not user:
        detail = "usuario nao encontrado"
        _add_auth_audit(
            db,
            request=request,
            event_type="RECOVERY_REQUEST",
            login_identificador=identificador,
            detail=detail,
            success=False,
            provider="LOCAL",
        )
        db.commit()
        if settings.is_dev_environment:
            raise HTTPException(status_code=404, detail="Usuario nao encontrado. Use Cadastrar para solicitar acesso.")
        return {"ok": True, "detail": "Se o cadastro existir e estiver ativo, a solicitacao foi registrada."}

    if not user.ativo:
        detail = _inactive_account_detail(user)
        _add_auth_audit(
            db,
            request=request,
            event_type="RECOVERY_REQUEST",
            login_identificador=identificador,
            detail=detail,
            success=False,
            provider="LOCAL",
            user=user,
        )
        db.commit()
        if settings.is_dev_environment:
            raise HTTPException(status_code=403, detail=detail)
        return {"ok": True, "detail": "Se o cadastro existir e estiver ativo, a solicitacao foi registrada."}

    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
    
    detail = f"Solicitacao registrada. Use o link de recuperacao. (Token para simulacao: {token})"
    _add_auth_audit(
        db,
        request=request,
        event_type="RECOVERY_REQUEST",
        login_identificador=identificador,
        detail=detail,
        success=True,
        provider="LOCAL",
        user=user,
    )
    db.commit()
    return {"ok": True, "detail": detail}


def auth_reset_password_service(*, payload, request: Request, db: Session) -> dict:
    token = payload.token.strip()
    user = db.query(Usuario).filter(Usuario.password_reset_token == token).first()
    
    if not user or not user.password_reset_expires or user.password_reset_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token de recuperacao invalido ou expirado.")
    
    _validate_password_complexity(payload.nova_senha)
    
    user.senha_hash = _hash_password(payload.nova_senha)
    user.senha_salt = ""
    user.password_reset_token = None
    user.password_reset_expires = None
    user.failed_login_attempts = 0
    user.locked_until = None
    
    _add_auth_audit(
        db,
        request=request,
        event_type="RESET_PASSWORD",
        login_identificador=user.nome,
        detail="senha redefinida via token com sucesso",
        success=True,
        provider="LOCAL",
        user=user,
    )
    db.commit()
    return {"ok": True, "detail": "Senha redefinida com sucesso. Faca login com a nova senha."}


def auth_me_service(*, actor: dict) -> dict:
    if actor["id"] is None:
        return {"id": 0, "nome": actor["name"], "perfil": actor["role"]}
    return {"id": actor["id"], "nome": actor["name"], "perfil": actor["role"]}


def auth_logout_service(*, actor: dict, db: Session) -> dict:
    sid = (actor.get("session_sid") or "").strip()
    if sid:
        session_hash = _hash_text(sid)
        sessao = db.query(UsuarioSessao).filter(UsuarioSessao.token_hash == session_hash).first()
        if sessao and not sessao.revoked_at:
            sessao.revoked_at = _utcnow()
            db.commit()
        return {"ok": True}

    token = (actor.get("session_token") or "").strip()
    if token:
        token_hash = _hash_text(token)
        sessao = db.query(UsuarioSessao).filter(UsuarioSessao.token_hash == token_hash).first()
        if sessao and not sessao.revoked_at:
            sessao.revoked_at = _utcnow()
            db.commit()
    return {"ok": True}


def list_auth_audit_logs_service(*, limit: int, db: Session):
    return (
        db.query(AuthAuditLog)
        .order_by(AuthAuditLog.created_at.desc(), AuthAuditLog.id.desc())
        .limit(limit)
        .all()
    )


def list_users_service(*, include_inactive: bool, db: Session):
    query = db.query(Usuario)
    if not include_inactive:
        query = query.filter(Usuario.ativo.is_(True))
    return query.order_by(Usuario.nome.asc(), Usuario.id.asc()).all()


def update_user_status_service(
    *,
    user_id: int,
    payload,
    actor: dict,
    db: Session,
    broadcast_update: Callable[[str, int | None], None],
) -> dict:
    user = db.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="usuario nao encontrado")

    actor_id = actor.get("id")
    if actor_id is not None and int(actor_id) == int(user.id) and payload.ativo is False:
        raise HTTPException(status_code=400, detail="nao e permitido desativar o proprio usuario")

    normalized_name = _normalize_user_name(user.nome)
    is_immutable_owner = normalized_name in IMMUTABLE_OWNER_NAMES

    if is_immutable_owner and payload.ativo is False:
        raise HTTPException(status_code=403, detail="programador oficial imutavel nao pode ser desativado")

    if payload.perfil is not None:
        normalized_next_role = _normalize_role(payload.perfil)
        if is_immutable_owner and normalized_next_role != OWNER_ROLE:
            raise HTTPException(status_code=403, detail="programador oficial imutavel nao pode mudar de perfil")
        if normalized_next_role == OWNER_ROLE and normalized_name not in IMMUTABLE_OWNER_NAMES:
            raise HTTPException(
                status_code=403,
                detail="somente MICAEL_DEV e VITOR_DEV podem permanecer como PROGRAMADOR",
            )
        user.perfil = normalized_next_role
        user.setor = normalized_next_role

    user.ativo = bool(payload.ativo)
    if payload.status_cadastro is not None:
        user.status_cadastro = payload.status_cadastro
    elif user.ativo:
        user.status_cadastro = REGISTRATION_STATUS_APPROVED

    if not user.ativo:
        now = _utcnow()
        (
            db.query(UsuarioSessao)
            .filter(
                UsuarioSessao.usuario_id == user.id,
                UsuarioSessao.revoked_at.is_(None),
            )
            .update({UsuarioSessao.revoked_at: now}, synchronize_session=False)
        )

    db.commit()
    broadcast_update("usuario", user.id)
    return {
        "ok": True,
        "id": user.id,
        "ativo": user.ativo,
        "perfil": user.perfil,
        "status_cadastro": _registration_status(user),
    }
