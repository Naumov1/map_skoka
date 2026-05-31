from datetime import datetime
from sqlalchemy import func, insert, or_, select, update
from app.applications.models import Applications
from app.conclusion.models import Conclusion
from app.dao.base import BaseDAO
from app.database import async_session_maker
from app.signature.models import Signature


class SignatureDAO(BaseDAO):
    model = Signature

    @classmethod
    async def add(cls, user_id: int, conclusion_id: int) -> Signature:
        async with async_session_maker() as session:
            stmt = (
                insert(cls.model)
                .values(users_id=user_id, conclusion_id=conclusion_id)
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def update(cls, id: int) -> Signature:
        async with async_session_maker() as session:
            stmt = (
                update(cls.model)
                .where(cls.model.id == id)
                .values(signed=True)
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def all(cls):
        async with async_session_maker() as session:
            # Считаем количество пользователей, которые подписали каждое заявление
            subq = (
                select(
                    cls.model.conclusion_id,
                    func.count().filter(cls.model.signed == True).label("signed_count"),
                    func.count(cls.model.users_id).label("total_count"),
                )
                .group_by(cls.model.conclusion_id)
                .subquery()
            )

            query = (
                select(
                    Conclusion.id.label("conclusion_id"),
                    Applications.id.label("application_id"),
                    Applications.fio,
                    Applications.cadastral_number,
                    Applications.address,
                    Applications.departure_date,
                )
                .select_from(subq)
                .join(Conclusion, subq.c.conclusion_id == Conclusion.id)
                .join(Applications, Conclusion.applications_id == Applications.id)
                .where(subq.c.signed_count == subq.c.total_count)
            )

            result = await session.execute(query)
            return result.mappings().all()

    @classmethod
    async def search(cls, search_text: str | int):
        async with async_session_maker() as session:
            subq = (
                select(
                    cls.model.conclusion_id,
                    func.count().filter(cls.model.signed == True).label("signed_count"),
                    func.count(cls.model.users_id).label("total_count"),
                )
                .group_by(cls.model.conclusion_id)
                .subquery()
            )

            query = (
                select(
                    Conclusion.id.label("conclusion_id"),
                    Applications.id.label("application_id"),
                    Applications.fio,
                    Applications.cadastral_number,
                    Applications.address,
                    Applications.departure_date,
                )
                .select_from(subq)
                .join(Conclusion, subq.c.conclusion_id == Conclusion.id)
                .join(Applications, Conclusion.applications_id == Applications.id)
                .where(
                    subq.c.signed_count == subq.c.total_count,
                    or_(
                        Applications.cadastral_number.ilike(f"%{search_text}%"),
                        Applications.fio.ilike(f"%{search_text}%"),
                    ),
                )
            )
            result = await session.execute(query)
            return result.mappings().all()

    @classmethod
    async def filter(
        cls,
        street: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
    ):
        async with async_session_maker() as session:
            subq = (
                select(
                    cls.model.conclusion_id,
                    func.count().filter(cls.model.signed == True).label("signed_count"),
                    func.count(cls.model.users_id).label("total_count"),
                )
                .group_by(cls.model.conclusion_id)
                .subquery()
            )

            query = (
                select(
                    Conclusion.id.label("conclusion_id"),
                    Applications.id.label("application_id"),
                    Applications.fio,
                    Applications.cadastral_number,
                    Applications.address,
                    Applications.departure_date,
                )
                .select_from(subq)
                .join(Conclusion, subq.c.conclusion_id == Conclusion.id)
                .join(Applications, Conclusion.applications_id == Applications.id)
                .where(subq.c.signed_count == subq.c.total_count)
            )
            if street:
                streets_list = [r.strip() for r in street.split(",") if r.strip()]
                query = query.filter(Applications.street.in_(streets_list))

            if date_from and date_to:
                query = query.where(Conclusion.create_date.between(date_from, date_to))
            elif date_from:
                query = query.where(Conclusion.create_date >= date_from)
            elif date_to:
                query = query.where(Conclusion.create_date <= date_to)

            result = await session.execute(query)
            return result.mappings().all()
