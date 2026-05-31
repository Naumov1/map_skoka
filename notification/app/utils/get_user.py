import jwt

from loguru import logger
from fastapi import Depends, Request

from app.config import settings
from app.exceptions import (
    AccessTokenMissingException,
    InvalidOrExpiredTokenException,
    InvalidTokenException,
    PermissionDeniedException,
)
from app.schemas.base import Role, Users


async def get_current_user(request: Request) -> Users:
    """Универсальное получение пользователя:
    1. По умолчанию — access_token из cookies.
    2. Если есть Authorization: Bearer <token> — берётся оттуда.

    Args:
        request (Request): Запрос пользователя

    Raises:
        AccessTokenMissingException: Отсутствует токен доступа в cookies
        InvalidTokenException: Неверный токен
        InvalidOrExpiredTokenException: Неверный или не действительный токен
        InvalidTokenException: Неверный токен
        UserNotFoundException: Пользователь не найден
        UsersTimeOutException: Ваша учетная запись заблокирована по истечению времени.

    Returns:
        Users: Данные пользователя
    """
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ")[1].strip()
            logger.debug(f"Получен токен из заголовка Authorization: {token}")
            if not token:
                logger.error(f"Пустой токен в заголовке Authorization")
                raise InvalidTokenException
        logger.error(f"Отсутствует токен доступа в cookies")
        raise AccessTokenMissingException

    try:
        payload = jwt.decode(
            token,
            settings.PUBLIC_KEY,
            algorithms=[settings.ALGORITHM],
            issuer="auth-service",
            audience="main-service",
        )
        user_id: str = payload.get("sub")
        fio: str = payload.get("fio")
        role: str = payload.get("role")
        if user_id is None:
            raise InvalidTokenException
    except Exception as e:
        logger.exception(f"Неверный токен: {e}")
        raise InvalidOrExpiredTokenException

    try:
        user_id = int(user_id)
        role = role
    except Exception as e:
        logger.exception(f"Неверный токен: {e}")
        raise InvalidTokenException

    user = Users(id=user_id, fio=fio, role=role)
    logger.debug(f"Найден пользователь ({user.id})")
    return user


async def get_employee_user(current_user: Users = Depends(get_current_user)) -> Users:
    if not (current_user.role == Role.EMPLOYEE or current_user.role == Role.ADMIN):
        raise PermissionDeniedException
    return current_user


async def get_admin_user(current_user: Users = Depends(get_current_user)) -> Users:
    if not current_user.role == Role.ADMIN:
        raise PermissionDeniedException
    return current_user
