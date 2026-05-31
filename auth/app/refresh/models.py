from datetime import datetime
from sqlalchemy import BigInteger, String, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class RefreshSession(Base):
    __tablename__ = "refresh_sessions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    refresh_token: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    fingerprint: Mapped[str] = mapped_column(String(200), nullable=False)
    user_agent: Mapped[str] = mapped_column(String(200), nullable=True)
    ip: Mapped[str] = mapped_column(String(45), nullable=True)
    expires_in: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
