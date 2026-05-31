from sqlalchemy import delete, insert, select, update
from app.dao.base import BaseDAO
from app.database import async_session_maker
from app.auth.models import Users


class UsersDAO(BaseDAO):
    model = Users

    @classmethod
    async def find_all(cls, **kwargs):
        async with async_session_maker() as session:
            query = (
                select(
                    cls.model.id,
                    cls.model.login,
                    cls.model.fio,
                    cls.model.email,
                    cls.model.role,
                )
                .filter_by(**kwargs)
                .order_by(cls.model.id.asc())
            )
            result = await session.execute(query)
            return result.mappings().all()

    @classmethod
    async def update_fio(cls, id: int, fio: str):
        async with async_session_maker() as session:
            stmt = (
                update(cls.model)
                .where(cls.model.id == id)
                .values(fio=fio)
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def update_email(cls, id: int, email: str):
        async with async_session_maker() as session:
            stmt = (
                update(cls.model)
                .where(cls.model.id == id)
                .values(email=email)
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def update_password(cls, id: int, new_hash_password: str) -> Users:
        async with async_session_maker() as session:
            stmt = (
                update(cls.model)
                .where(cls.model.id == id)
                .values(hash_password=new_hash_password)
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()
