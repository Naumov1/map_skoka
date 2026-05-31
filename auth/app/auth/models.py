from datetime import datetime
import enum
from sqlalchemy import Enum, ForeignKey, Integer, String, BigInteger, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, EncryptedString


class Role(str, enum.Enum):
    ADMIN = "Администратор"
    EMPLOYEE = "Сотрудник"
    USERS = "Пользователь"


class Users(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        primary_key=True,
        autoincrement=True,
        index=True,
    )
    login: Mapped[str] = mapped_column(String, nullable=False)
    hash_password: Mapped[str] = mapped_column(String, nullable=False)

    fio: Mapped[str] = mapped_column(EncryptedString(255), nullable=False)
    email: Mapped[str] = mapped_column(EncryptedString(255), nullable=False)

    role: Mapped[Role] = mapped_column(Enum(Role), nullable=False, default=Role.USERS)
