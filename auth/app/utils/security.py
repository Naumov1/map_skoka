import jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from app.auth.models import Role
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля на совпадение с хешем пользователя

    Args:
        plain_password (str): Пароль от пользователя
        hashed_password (str): Хеш пароля

    Returns:
        bool: True если пароли совпадают, иначе False
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Получение хеша пароля

    Args:
        password (str): Пароль от пользователя

    Returns:
        str: Хеш пароля.
    """
    return pwd_context.hash(password)


def create_jwt_token(id: int, fio: str, role: Role):
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(id),
        "iss": "auth-service",
        "aud": ["auth-service", "main-service", "applications-service"],
        "iat": now,
        "exp": exp,
        "fio": fio,
        "role": role,
    }

    algorithm = settings.ALGORITHM
    key = settings.PRIVATE_KEY if algorithm.startswith("RS") else settings.PUBLIC_KEY

    token = jwt.encode(
        payload,
        key,
        algorithm=algorithm,
        headers={"kid": "main-key-2026-01"},
    )
    return token
