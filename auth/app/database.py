from sqlalchemy import String, TypeDecorator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.utils.encryption import encryption
from app.config import settings

engine = create_async_engine(settings.DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class EncryptedString(TypeDecorator):
    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        """Шифрование при сохранении в БД"""
        return encryption.encrypt_value(value) if value else value

    def process_result_value(self, value, dialect):
        """Дешифрование при чтении из БД"""
        return encryption.decrypt_value(value) if value else value
