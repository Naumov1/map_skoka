from sqlalchemy import insert, select

from app.dao.base import BaseDAO
from app.database import async_session_maker
from app.notification.models import Notification


class NotificationDAO(BaseDAO):
    model = Notification

    @classmethod
    async def add(cls, user_id: int, text: str) -> Notification:
        async with async_session_maker() as session:
            stmt = (
                insert(cls.model)
                .values(user_id=user_id, text=text, read=False)
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def last_for_user(cls, user_id: int, limit: int = 10):
        async with async_session_maker() as session:
            query = (
                select(cls.model.__table__.columns)
                .where(cls.model.user_id == user_id)
                .order_by(cls.model.id.desc())
                .limit(limit)
            )
            result = await session.execute(query)
            return result.mappings().all()
