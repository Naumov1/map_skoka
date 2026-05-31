from uuid import uuid4
from fastapi import Request, Response
from datetime import datetime, timedelta, timezone
from app.auth.dao import UsersDAO
from app.auth.models import Users
from app.auth.schemas import Token
from app.config import settings
from app.exceptions import (
    InvalidFingerprintException,
    MissingRefreshException,
    RefreshSessionInvalidException,
    RefreshTokenExpiredException,
    UserNotFoundException,
)
from app.refresh.dao import RefreshSessionDAO
from app.refresh.models import RefreshSession
from app.refresh.schemas import RefreshRequest, RefreshResponse
from app.utils.security import create_jwt_token


async def create_tokens(user: Users) -> Token:
    access_token = create_jwt_token(
        id=user.id,
        fio=user.fio,
        role=user.role,
    )
    refresh_token = str(uuid4())

    return Token(access_token=access_token, refresh_token=refresh_token)


async def create_refresh_session(
    user: Users,
    refresh_token: str,
    fingerprint: str,
    ip: str | None,
    ua: str | None,
):
    expires_in = int(
        (
            datetime.now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        ).timestamp()
    )

    sessions = await RefreshSessionDAO.find_all_users(user.id)

    if len(sessions) >= settings.MAX_REFRESH_SESSIONS:
        oldest = sorted(sessions, key=lambda s: s.created_at)[:-4]
        for s in oldest:
            await RefreshSessionDAO.delete(s.id)

    new_session = await RefreshSessionDAO.add(
        user_id=user.id,
        refresh_token=refresh_token,
        fingerprint=fingerprint,
        ip=ip,
        user_agent=ua,
        expires_in=expires_in,
    )
    return new_session


async def refresh_tokens(data: RefreshRequest, refresh_token: str) -> RefreshResponse:
    session: RefreshSession = await RefreshSessionDAO.find_first_session(refresh_token)

    if not session:
        raise RefreshSessionInvalidException

    if session.expires_in < int(datetime.now().timestamp()):
        await RefreshSessionDAO.delete(session.id)
        raise RefreshTokenExpiredException

    if session.fingerprint != data.fingerprint:
        await RefreshSessionDAO.delete(session.id)
        raise InvalidFingerprintException

    user: Users = await UsersDAO.find_by_id(session.user_id)
    if not user:
        raise UserNotFoundException

    await RefreshSessionDAO.delete(session.id)

    tokens = await create_tokens(user)
    await create_refresh_session(
        user, tokens.refresh_token, data.fingerprint, None, None
    )

    return RefreshResponse(
        access_token=tokens.access_token, refresh_token=tokens.refresh_token
    )


async def refresh(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise MissingRefreshException

    try:
        body = await request.json()
        data = RefreshRequest(**body)
    except Exception:
        data = RefreshRequest(fingerprint="unknown")

    tokens: Token = await refresh_tokens(data, refresh_token)

    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        samesite="strict",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=False,
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        samesite="strict",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )
    return tokens
