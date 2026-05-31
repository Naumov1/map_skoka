from sqlalchemy import delete, func, insert, select, update
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
                .values(user_id=user_id, text=text)
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def update(cls, id: int) -> Notification:
        async with async_session_maker() as session:
            stmt = (
                update(cls.model)
                .where(cls.model.id == id)
                .values(is_read=True)
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def read_all(cls, user_id: int):
        async with async_session_maker() as session:
            stmt = (
                update(cls.model)
                .where(cls.model.user_id == user_id, cls.model.is_read == False)
                .values(is_read=True)
            )
            await session.execute(stmt)
            await session.commit()

    @classmethod
    async def my_count(cls, user_id: int):
        async with async_session_maker() as session:
            query = (
                select(func.count(cls.model.user_id))
                .select_from(cls.model)
                .where(cls.model.user_id == user_id, cls.model.is_read == False)
            )
            result = await session.execute(query)
            return result.scalar()

    @classmethod
    async def delete(cls, id: int) -> Notification:
        async with async_session_maker() as session:
            stmt = delete(cls.model).where(cls.model.id == id).returning(cls.model)
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()
