from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import json
import re
import secrets
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import urlopen

from fastapi import HTTPException, Request, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import AuthAuditLog, Usuario, UsuarioSessao
from ..schemas import ROLES
from ..settings import settings

ALLOWED_ROLES = set(ROLES)
LEGACY_ROLE_ALIASES = {"CONTABIL": "APG"}
IMMUTABLE_OWNER_NAMES = {"MICAEL_DEV", "VITOR_DEV"}
SESSION_HOURS = max(int(settings.JWT_EXPIRE_HOURS or 12), 1)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}
GOOGLE_USERNAME_SANITIZE_RE = re.compile(r"\s+")
AUTH_AUDIT_UA_MAX_LEN = 255
LEGACY_HEX_RE = re.compile(r"^[0-9a-fA-F]+$")
PLACEHOLDER_SECRET_TOKENS = {
    "",
    "troque-esta-chave",
    "troque-esta-chave-jwt",
    "changeme",
    "change-me",
    "secret",
    "default",
}
SENSITIVE_FIELD_HINTS = {
    "cpf",
    "cnpj",
    "rg",
    "email",
    "e-mail",
    "telefone",
    "celular",
    "endereco",
    "data_nascimento",
    "nascimento",
    "senha",
    "password",
    "token",
    "api_key",
    "chave",
    "matricula",
    "nome",
}
AUDIT_MASK_TEXT = "[REDACTED]"
AUDIT_VALUE_MAX_LEN = 500
RE_EMAIL = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.IGNORECASE)
RE_CPF = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")
RE_CNPJ = re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b")
RE_BEARER_OR_JWT = re.compile(r"(?i)(bearer\s+[a-z0-9\-._~+/]+=*|eyJ[a-zA-Z0-9_\-\.]{20,})")
GOOGLE_TOKENINFO_HOST = "oauth2.googleapis.com"
GOOGLE_TOKENINFO_PATH = "/tokeninfo"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _hash_text(value: str) -> str:
    return hashlib.sha256((value or "").encode("utf-8")).hexdigest()


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _validated_google_tokeninfo_url(raw_url: str) -> str:
    candidate = (raw_url or "").strip()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="login com google indisponivel",
        )

    parsed = urlsplit(candidate)
    scheme = (parsed.scheme or "").strip().lower()
    hostname = (parsed.hostname or "").strip().lower()
    path = (parsed.path or "").strip()

    if scheme != "https" or hostname != GOOGLE_TOKENINFO_HOST or path != GOOGLE_TOKENINFO_PATH:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="configuracao do verificador google invalida",
        )
    return candidate


def _validate_runtime_security_settings() -> None:
    if not settings.API_AUTH_ENABLED:
        return

    jwt_secret = (settings.JWT_SECRET_KEY or "").strip()
    if not jwt_secret:
        raise RuntimeError("JWT_SECRET_KEY obrigatoria quando API_AUTH_ENABLED=true.")

    if not settings.is_dev_environment and jwt_secret.lower() in PLACEHOLDER_SECRET_TOKENS:
        raise RuntimeError("JWT_SECRET_KEY fraca em ambiente nao-dev. Defina segredo forte no ambiente.")

    if not settings.is_dev_environment and settings.ALLOW_SHARED_KEY_AUTH:
        raise RuntimeError("ALLOW_SHARED_KEY_AUTH nao pode ficar habilitado fora de desenvolvimento.")

    if settings.shared_key_auth_enabled and (settings.API_SHARED_KEY or "").strip().lower() in PLACEHOLDER_SECRET_TOKENS:
        raise RuntimeError("API_SHARED_KEY fraca; desabilite shared key ou defina chave forte.")


def _history_field_is_sensitive(field_name: str | None) -> bool:
    raw = (field_name or "").strip().lower()
    if not raw:
        return False
    normalized = raw.replace("-", "_").replace(" ", "_")
    if normalized in SENSITIVE_FIELD_HINTS:
        return True
    return any(hint in normalized for hint in SENSITIVE_FIELD_HINTS)


def _history_value_looks_sensitive(value: str) -> bool:
    raw = (value or "").strip()
    if not raw:
        return False
    if RE_EMAIL.search(raw) or RE_CPF.search(raw) or RE_CNPJ.search(raw):
        return True
    if RE_BEARER_OR_JWT.search(raw):
        return True
    return False


def _mask_history_value(field_name: str | None, value: str | None) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    if raw == AUDIT_MASK_TEXT:
        return raw
    if _history_field_is_sensitive(field_name) or _history_value_looks_sensitive(raw):
        return AUDIT_MASK_TEXT
    if len(raw) > AUDIT_VALUE_MAX_LEN:
        return raw[:AUDIT_VALUE_MAX_LEN] + "..."
    return raw


def _mask_history_pair(field_name: str | None, old_value: str | None, new_value: str | None) -> tuple[str, str]:
    return (
        _mask_history_value(field_name, old_value),
        _mask_history_value(field_name, new_value),
    )


def _verify_password_modern(password: str, stored_hash: str) -> bool:
    raw_hash = (stored_hash or "").strip()
    if not raw_hash:
        return False
    try:
        return bool(pwd_context.verify(password, raw_hash))
    except (UnknownHashError, ValueError):
        return False


def _hash_password_legacy(password: str, salt_hex: str) -> str:
    normalized_salt = (salt_hex or "").strip()
    if len(normalized_salt) < 2 or len(normalized_salt) % 2 != 0 or not LEGACY_HEX_RE.fullmatch(normalized_salt):
        raise ValueError("legacy salt hex invalido")
    salt = bytes.fromhex(normalized_salt)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return digest.hex()


def _verify_password_legacy(password: str, salt_hex: str, expected_hash: str) -> bool:
    normalized_hash = (expected_hash or "").strip().lower()
    if not salt_hex or not normalized_hash:
        return False
    try:
        calc_hash = _hash_password_legacy(password, salt_hex)
    except ValueError:
        return False
    return secrets.compare_digest(calc_hash, normalized_hash)


def _verify_user_password(user: Usuario, password: str) -> tuple[bool, bool]:
    if _verify_password_modern(password, user.senha_hash):
        return True, False

    if _verify_password_legacy(password, user.senha_salt, user.senha_hash):
        return True, True

    return False, False


def _build_unique_public_username(db: Session, preferred: str) -> str:
    base = GOOGLE_USERNAME_SANITIZE_RE.sub(" ", (preferred or "").strip())
    if not base:
        base = "Google User"
    if len(base) < 2:
        base = (base + " xx")[:2].strip()

    candidate = base[:120]
    suffix_num = 2
    while db.query(Usuario.id).filter(func.lower(Usuario.nome) == candidate.lower()).first():
        suffix = f" - {suffix_num}"
        safe_len = max(2, 120 - len(suffix))
        candidate = (base[:safe_len].rstrip() + suffix).strip()
        suffix_num += 1

    return candidate


def _verify_google_identity_token(id_token: str) -> dict:
    raw_token = (id_token or "").strip()
    client_ids = settings.google_client_ids_list

    if not client_ids:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="login com google indisponivel",
        )
    if not raw_token:
        raise HTTPException(status_code=400, detail="credential google ausente")

    query = urlencode({"id_token": raw_token})
    verify_base_url = _validated_google_tokeninfo_url(settings.GOOGLE_TOKENINFO_URL)
    verify_url = f"{verify_base_url}?{query}"

    try:
        with urlopen(verify_url, timeout=8) as response:  # nosec B310 - URL validada com host/path fixos do Google
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError:
        raise HTTPException(status_code=401, detail="token google invalido")
    except (URLError, TimeoutError, json.JSONDecodeError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="falha ao validar token google",
        )

    aud = str(payload.get("aud") or "").strip()
    azp = str(payload.get("azp") or "").strip()
    if aud not in client_ids and azp not in client_ids:
        raise HTTPException(status_code=401, detail="token google com audience invalida")

    issuer = str(payload.get("iss") or "").strip()
    if issuer not in GOOGLE_ISSUERS:
        raise HTTPException(status_code=401, detail="issuer google invalido")

    if str(payload.get("email_verified") or "").strip().lower() != "true":
        raise HTTPException(status_code=403, detail="conta google nao verificada")

    email = str(payload.get("email") or "").strip().lower()
    sub = str(payload.get("sub") or "").strip()
    if not email or not sub:
        raise HTTPException(status_code=401, detail="token google sem identidade valida")

    display_name = str(payload.get("name") or "").strip()
    if not display_name:
        display_name = email.split("@", 1)[0]

    return {
        "email": email,
        "sub": sub,
        "name": display_name,
    }


def _create_jwt_session(db: Session, user: Usuario) -> str:
    session_id = secrets.token_urlsafe(24)
    session_hash = _hash_text(session_id)
    now = _utcnow()
    exp = now + timedelta(hours=SESSION_HOURS)

    sessao = UsuarioSessao(
        usuario_id=user.id,
        token_hash=session_hash,
        created_at=now,
        expires_at=exp,
    )
    db.add(sessao)
    user.ultimo_login = now
    db.commit()

    payload = {
        "sub": str(user.id),
        "name": user.nome,
        "role": user.perfil,
        "sid": session_id,
        "iat": int(now.replace(tzinfo=timezone.utc).timestamp()),
        "exp": int(exp.replace(tzinfo=timezone.utc).timestamp()),
        "typ": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _request_ip(request: Request) -> str:
    forwarded = (request.headers.get("x-forwarded-for") or "").strip()
    if forwarded:
        return forwarded.split(",", 1)[0].strip()[:64]
    if request.client and request.client.host:
        return str(request.client.host).strip()[:64]
    return ""


def _request_user_agent(request: Request) -> str:
    return (request.headers.get("user-agent") or "").strip()[:AUTH_AUDIT_UA_MAX_LEN]


def _add_auth_audit(
    db: Session,
    *,
    request: Request,
    event_type: str,
    login_identificador: str,
    detail: str,
    success: bool,
    provider: str,
    user: Usuario | None = None,
) -> None:
    db.add(
        AuthAuditLog(
            user_id=(user.id if user else None),
            user_nome=(user.nome if user else ""),
            login_identificador=(login_identificador or "").strip()[:255],
            event_type=event_type,
            provider=provider,
            success=bool(success),
            detail=(detail or "").strip(),
            ip_origem=_request_ip(request),
            user_agent=_request_user_agent(request),
        )
    )


def _find_user_by_login(db: Session, identificador: str) -> Usuario | None:
    normalized_login = (identificador or "").strip().lower()
    if not normalized_login:
        return None

    user = db.query(Usuario).filter(func.lower(Usuario.nome) == normalized_login).first()
    if user is not None:
        return user

    if "@" in normalized_login:
        return (
            db.query(Usuario)
            .filter(Usuario.email.is_not(None), func.lower(Usuario.email) == normalized_login)
            .first()
        )

    return None


def _find_user_by_email(db: Session, email: str) -> Usuario | None:
    normalized_email = (email or "").strip().lower()
    if not normalized_email:
        return None

    return (
        db.query(Usuario)
        .filter(Usuario.email.is_not(None), func.lower(Usuario.email) == normalized_email)
        .first()
    )


def _try_decode_jwt(token: str) -> dict | None:
    raw = (token or "").strip()
    if not raw:
        return None

    try:
        data = jwt.decode(raw, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None

    if not isinstance(data, dict):
        return None
    return data


def _actor_from_bearer_token(token: str, db: Session) -> dict | None:
    claims = _try_decode_jwt(token)
    if not claims:
        return None

    sid = str(claims.get("sid") or "").strip()
    sub = str(claims.get("sub") or "").strip()
    if not sid or not sub:
        return None

    session_hash = _hash_text(sid)
    sessao = (
        db.query(UsuarioSessao)
        .join(Usuario, Usuario.id == UsuarioSessao.usuario_id)
        .filter(
            UsuarioSessao.token_hash == session_hash,
            UsuarioSessao.revoked_at.is_(None),
            UsuarioSessao.expires_at > _utcnow(),
            Usuario.ativo.is_(True),
        )
        .first()
    )
    if not sessao:
        return None

    if str(sessao.usuario.id) != sub:
        return None

    actor_role = LEGACY_ROLE_ALIASES.get(
        str(getattr(sessao.usuario, "perfil", "") or "").strip().upper(),
        str(getattr(sessao.usuario, "perfil", "") or "").strip().upper(),
    )
    if actor_role not in ALLOWED_ROLES:
        return None

    return {
        "id": sessao.usuario.id,
        "name": sessao.usuario.nome,
        "role": actor_role,
        "session_token": token,
        "session_sid": sid,
        "auth_type": "bearer",
    }


def _actor_from_legacy_session(token: str, db: Session) -> dict | None:
    raw = (token or "").strip()
    if not raw:
        return None

    token_hash = _hash_text(raw)
    sessao = (
        db.query(UsuarioSessao)
        .join(Usuario, Usuario.id == UsuarioSessao.usuario_id)
        .filter(
            UsuarioSessao.token_hash == token_hash,
            UsuarioSessao.revoked_at.is_(None),
            UsuarioSessao.expires_at > _utcnow(),
            Usuario.ativo.is_(True),
        )
        .first()
    )
    if not sessao:
        return None

    actor_role = LEGACY_ROLE_ALIASES.get(
        str(getattr(sessao.usuario, "perfil", "") or "").strip().upper(),
        str(getattr(sessao.usuario, "perfil", "") or "").strip().upper(),
    )
    if actor_role not in ALLOWED_ROLES:
        return None

    return {
        "id": sessao.usuario.id,
        "name": sessao.usuario.nome,
        "role": actor_role,
        "session_token": raw,
        "session_sid": None,
        "auth_type": "legacy",
    }


def _normalize_role(role: str) -> str:
    value = LEGACY_ROLE_ALIASES.get((role or "").strip().upper(), (role or "").strip().upper())
    if value not in ALLOWED_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="setor invalido")
    return value


def _normalize_user_name(name: str) -> str:
    return (name or "").strip().upper()


def _is_immutable_owner_name(name: str) -> bool:
    return _normalize_user_name(name) in IMMUTABLE_OWNER_NAMES


def _assert_allowed_owner_identity(name: str) -> None:
    if not _is_immutable_owner_name(name):
        allowed = ", ".join(sorted(IMMUTABLE_OWNER_NAMES))
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"apenas usuarios oficiais podem ser PROGRAMADOR: {allowed}",
        )
