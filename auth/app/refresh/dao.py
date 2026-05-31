from sqlalchemy import delete, insert, select
from app.dao.base import BaseDAO
from app.database import async_session_maker
from app.refresh.models import RefreshSession


class RefreshSessionDAO(BaseDAO):
    model = RefreshSession

    @classmethod
    async def find_first_session(cls, refresh_token: str):
        async with async_session_maker() as session:
            query = select(cls.model).where(cls.model.refresh_token == refresh_token)
            result = await session.execute(query)
            return result.scalars().first()

    @classmethod
    async def find_all_users(cls, user_id: int):
        async with async_session_maker() as session:
            query = select(cls.model).where(cls.model.user_id == user_id)
            result = await session.execute(query)
            return result.scalars().all()

    @classmethod
    async def add(
        cls,
        user_id: int,
        refresh_token: str,
        fingerprint: str,
        user_agent: str,
        ip: str,
        expires_in: int,
    ) -> RefreshSession:
        async with async_session_maker() as session:
            stmt = (
                insert(cls.model)
                .values(
                    user_id=user_id,
                    refresh_token=refresh_token,
                    fingerprint=fingerprint,
                    ip=ip,
                    user_agent=user_agent,
                    expires_in=expires_in,
                )
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def delete(cls, id: int) -> RefreshSession:
        async with async_session_maker() as session:
            stmt = delete(cls.model).where(cls.model.id == id).returning(cls.model)
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()
