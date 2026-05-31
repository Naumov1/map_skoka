from datetime import datetime, timezone

from loguru import logger
from fastapi import Request, Response
from app.auth.dao import UsersDAO
from app.auth.models import Role, Users
from app.exceptions import (
    ServerErrorException,
    UserAlreadyExistsException,
    InvalidCredentialsException,
    UserNotFoundException,
)
from app.refresh.dao import RefreshSessionDAO
from app.refresh.models import RefreshSession
from app.refresh.service import create_refresh_session, create_tokens
from app.schemas.base import ResponseDetail
from app.service.base import BaseService
from app.utils.security import get_password_hash, verify_password
from app.config import settings


class UsersService(BaseService):
    model = Users
    dao = UsersDAO

    @classmethod
    async def authenticate_user(cls, login: str, password: str):
        user: Users = await UsersDAO.find_one_or_none(login=login)
        if not user or not verify_password(password, user.hash_password):
            return None
        return user

    @classmethod
    async def me(cls, current_user: Users):
        return {
            "users": {
                "id": current_user.id,
                "login": current_user.login,
                "role": current_user.role,
                "fio": current_user.fio,
                "email": current_user.email,
            }
        }

    @classmethod
    async def employee(cls):
        return {"users": await UsersDAO.find_all(role=Role.EMPLOYEE)}

    @classmethod
    async def all(cls):
        users: Users = await UsersDAO.find_all()
        return {"users": users}

    @classmethod
    async def detail(cls, id: int):
        users: Users = await UsersDAO.find_by_id(id=id)
        return {"users": users}

    @classmethod
    async def register(
        cls,
        login: str,
        password: str,
        fio: str,
        email: str,
    ):
        if await UsersDAO.find_one_or_none(login=login):
            raise UserAlreadyExistsException

        hash_password = get_password_hash(password)

        user: Users = await UsersDAO.add(
            login=login,
            fio=fio,
            email=email,
            hash_password=hash_password,
        )

        del user.hash_password
        return {"detail": "Пользователь успешно создан", "users": user}

    @classmethod
    async def add(
        cls,
        login,
        password,
        role,
        fio,
        email,
    ):
        if await UsersDAO.find_one_or_none(login=login):
            logger.warning(f"Логин: {login} - уже существует")
            raise UserAlreadyExistsException
        hash_password = get_password_hash(password)
        await UsersDAO.add(
            login=login,
            hash_password=hash_password,
            role=role,
            fio=fio,
            email=email,
        )
        return {"detail": "Пользователь успешно добавлен"}

    @classmethod
    async def login(
        cls,
        login: str,
        password: str,
        request: Request,
        response: Response,
    ):
        user: Users = await cls.authenticate_user(login, password)
        if not user:
            logger.warning(f"Пользователь: {login} - не найден")
            raise InvalidCredentialsException

        tokens = await create_tokens(user)

        fingerprint = request.headers.get("X-Device-Fingerprint", "unknown")
        ip = getattr(request.client, "host", "127.0.0.1")
        ua = request.headers.get("User-Agent")

        await create_refresh_session(user, tokens.refresh_token, fingerprint, ip, ua)

        response.set_cookie(
            key="refresh_token",
            value=tokens.refresh_token,
            httponly=True,
            samesite="lax",
            secure=False,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            path="/",
        )
        response.set_cookie(
            key="access_token",
            value=tokens.access_token,
            httponly=True,
            samesite="lax",
            secure=False,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
        )
        logger.info("Пользователь успешно авторизовался")
        return tokens

    @classmethod
    async def logout(cls, request: Request, response: Response):
        refresh_token = request.cookies.get("refresh_token")

        if refresh_token:
            session: RefreshSession = await RefreshSessionDAO.find_one_or_none(
                refresh_token=refresh_token
            )
            if session:
                await RefreshSessionDAO.delete(session.id)

        for cookie_name in ("access_token", "refresh_token"):
            response.delete_cookie(key=cookie_name, path="/")
            response.delete_cookie(
                key=cookie_name,
                path="/",
                secure=True,
                httponly=True,
                samesite="none",
            )
        logger.info("Пользователь успешно вышел из системы")
        return {"detail": "Вы успешно вышли"}

    @classmethod
    async def update_fio(cls, id: int, fio: str) -> ResponseDetail:
        await UsersDAO.update_fio(id, fio)
        return {"detail": "ФИО успешно изменено"}

    @classmethod
    async def update_email(cls, id: int, email: str) -> ResponseDetail:
        await UsersDAO.update_email(id, email)
        return {"detail": "Почта успешно изменена"}

    @classmethod
    async def update_password(
        cls,
        id: int,
        last_password: str,
        new_password: str,
    ) -> ResponseDetail:
        """Изменение пароля пользователя

        Args:
            id (int): id пользователя
            last_password (str): старый пароль
            new_password (str): новый пароль

        Raises:
            InvalidCredentialsException: неверный пароль

        Returns:
            ResponseDetail: результат изменения пароля пользователя
        """
        user: Users = await UsersDAO.find_by_id(id)
        if not user:
            logger.warning(f"Пользователь {id} не найден")
            raise UserNotFoundException
        if not verify_password(last_password, user.hash_password):
            logger.warning(
                f"Неверный пароль пользователя {id} при попытке смены пароля"
            )
            raise InvalidCredentialsException
        hash_password = get_password_hash(new_password)
        await UsersDAO.update(id=id, hash_password=hash_password)
        logger.info(f"Пароль пользователя {id} успешно изменен")
        return {"detail": "Пароль успешно изменен"}
