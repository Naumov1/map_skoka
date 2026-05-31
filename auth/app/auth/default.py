from loguru import logger
from app.auth.dao import UsersDAO
from app.auth.models import Role
from app.auth.service import UsersService
from app.config import settings


async def default_create_users():
    if len(await UsersDAO.find_all()) == 0:
        await UsersService.add(
            login=settings.DEFAULT_LOGIN,
            password=settings.DEFAULT_PASSWORD,
            role=Role.ADMIN,
            fio="default",
            email="default@default.com",
        )
        logger.success("Пользователь по умолчанию создан")
