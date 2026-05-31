from datetime import datetime
from sqlalchemy import and_, delete, distinct, insert, or_, select, update
from app.dao.base import BaseDAO
from app.database import async_session_maker
from app.applications.models import Applications, ApplicationStatus


class ApplicationsDAO(BaseDAO):
    model = Applications

    @classmethod
    async def add(
        cls,
        user_id: int,
        fio: str,
        phone: str,
        email: str,
        cadastral_number: str,
        street: str,
        address: str,
        problem: str,
        file_url: str,
    ) -> Applications:
        async with async_session_maker() as session:
            stmt = (
                insert(cls.model)
                .values(
                    user_id=user_id,
                    fio=fio,
                    phone=phone,
                    email=email,
                    cadastral_number=cadastral_number,
                    street=street,
                    address=address,
                    problem=problem,
                    file_url=file_url,
                )
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def save_commission_analysis(cls, id: int, commission_analysis: str) -> Applications:
        async with async_session_maker() as session:
            stmt = (
                update(cls.model)
                .where(cls.model.id == id)
                .values(commission_analysis=commission_analysis)
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def delete(cls, id: int):
        async with async_session_maker() as session:
            stmt = delete(cls.model).where(cls.model.id == id).returning(cls.model)
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def update(cls, id: int, status: ApplicationStatus) -> Applications:
        async with async_session_maker() as session:
            stmt = (
                update(cls.model)
                .where(cls.model.id == id)
                .values(status=status)
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def departure(cls, ids: list, departure_date: datetime) -> Applications:
        async with async_session_maker() as session:
            stmt = (
                update(cls.model)
                .where(
                    cls.model.id.in_(ids),
                    cls.model.status == ApplicationStatus.ACCEPTED,
                )
                .values(
                    status=ApplicationStatus.VISIT_ASSIGNED,
                    departure_date=departure_date,
                )
                .returning(cls.model.__table__.columns)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.mappings().all()

    @classmethod
    async def all(cls):
        async with async_session_maker() as session:
            query = (
                select(cls.model.__table__.columns)
                .where(
                    cls.model.status != ApplicationStatus.COMMISSION_REVIEW,
                    cls.model.status != ApplicationStatus.COMMISSION_RESULT,
                )
                .order_by(cls.model.id.asc())
            )
            result = await session.execute(query)
            return result.mappings().all()

    @classmethod
    async def my(cls, user_id: int):
        async with async_session_maker() as session:
            query = (
                select(cls.model.__table__.columns)
                .where(cls.model.user_id == user_id)
                .order_by(cls.model.id.desc())
            )
            result = await session.execute(query)
            return result.mappings().all()

    @classmethod
    async def search(cls, search_text: str):
        async with async_session_maker() as session:
            query = (
                select(cls.model.__table__.columns)
                .where(
                    cls.model.status != ApplicationStatus.COMMISSION_REVIEW,
                    cls.model.status != ApplicationStatus.COMMISSION_RESULT,
                    or_(
                        cls.model.cadastral_number.ilike(f"%{search_text}%"),
                        cls.model.fio.ilike(f"%{search_text}%"),
                    ),
                )
                .order_by(cls.model.id.asc())
            )
            result = await session.execute(query)
            return result.mappings().all()

    @classmethod
    async def filter(
        cls,
        street: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
        is_departure: bool | None,
    ):
        async with async_session_maker() as session:
            query = select(cls.model.__table__.columns).where(
                cls.model.status != ApplicationStatus.COMMISSION_REVIEW,
                cls.model.status != ApplicationStatus.COMMISSION_RESULT,
            )
            if street:
                streets_list = [r.strip() for r in street.split(",") if r.strip()]
                query = query.filter(cls.model.street.in_(streets_list))

            if date_from and date_to:
                query = query.where(
                    cls.model.departure_date.between(date_from, date_to)
                )
            elif date_from:
                query = query.where(cls.model.departure_date >= date_from)
            elif date_to:
                query = query.where(cls.model.departure_date <= date_to)

            if is_departure is True:
                query = query.where(
                    cls.model.status == ApplicationStatus.VISIT_ASSIGNED,
                )
            elif is_departure is False:
                query = query.where(cls.model.status == ApplicationStatus.ACCEPTED)
            query = query.order_by(cls.model.id.asc())
            result = await session.execute(query)
            return result.mappings().all()

    @classmethod
    async def get_street(cls, search: str | None):
        async with async_session_maker() as session:
            query = select(distinct(cls.model.street).label("street"))
            if search:
                query = query.where(cls.model.street.ilike(f"%{search}%"))
            result = await session.execute(query)
            return result.mappings().all()
