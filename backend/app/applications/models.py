import enum
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, String, Text
from app.database import Base

from sqlalchemy.orm import Mapped, mapped_column


class ApplicationStatus(enum.Enum):
    ACCEPTED = "Заявление принято"
    VISIT_ASSIGNED = "Назначен выезд"
    COMMISSION_REVIEW = "Заключение на рассмотрении"
    COMMISSION_RESULT = "Результат комиссии"


class Applications(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
        index=True,
    )

    # Кто подал заявление
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # Данные заявителя
    fio: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)

    # Данные объекта
    cadastral_number: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str] = mapped_column(String, nullable=False)
    street: Mapped[str] = mapped_column(String, nullable=False)
    problem: Mapped[str | None] = mapped_column(Text, nullable=True)
    commission_analysis: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Путь шаблона
    file_url: Mapped[str] = mapped_column(String, nullable=True)

    # Статус
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus),
        default=ApplicationStatus.ACCEPTED,
        nullable=False,
    )
    departure_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
