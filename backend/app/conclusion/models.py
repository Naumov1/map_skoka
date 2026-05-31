from datetime import datetime
from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Conclusion(Base):
    __tablename__ = "conclusion"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
        nullable=False,
    )
    applications_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("applications.id"),
        nullable=False,
    )
    create_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    file_url: Mapped[str] = mapped_column(String, nullable=True)
