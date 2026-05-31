from app.database import Base
from sqlalchemy import BigInteger, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column


class Signature(Base):
    __tablename__ = "signature"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
        index=True,
    )
    users_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    conclusion_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("conclusion.id"))
    signed: Mapped[bool] = mapped_column(Boolean, default=False)
