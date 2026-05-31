from datetime import datetime
from sqlalchemy import delete, insert, or_, select, update, case, exists, select
from app.applications.models import ApplicationStatus, Applications
from app.dao.base import BaseDAO
from app.database import async_session_maker
from app.conclusion.models import Conclusion
from app.signature.models import Signature


class ConclusionDAO(BaseDAO):
    model = Conclusion

    @classmethod
    async def add(
        cls, applications_id: int, create_date: datetime, file_url: str
    ) -> Conclusion:
        async with async_session_maker() as session:
            stmt = (
                insert(cls.model)
                .values(
                    applications_id=applications_id,
                    create_date=create_date,
                    file_url=file_url,
                )
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def my(cls, users_id: int):
        async with async_session_maker() as session:
            query = (
                select(cls.model.__table__.columns)
                .join(Applications, Applications.id == cls.model.applications_id)
                .where(Applications.user_id == users_id)
            )
            result = await session.execute(query)
            return result.mappings().all()

    @classmethod
    async def update(cls, id: int) -> Conclusion:
        async with async_session_maker() as session:
            stmt = (
                update(cls.model)
                .where(cls.model.id == id)
                .values()
                .returning(cls.model)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar()

    @classmethod
    async def all(cls, user_id: int):
        async with async_session_maker() as session:
            signed_case = case(
                (
                    exists().where(
                        (Signature.conclusion_id == cls.model.id)
                        & (Signature.users_id == user_id)
                        & (Signature.signed == True)
                    ),
                    True,
                ),
                else_=False,
            ).label("signed")

            query = (
                select(
                    cls.model.id.label("conclusion_id"),
                    Applications.id.label("application_id"),
                    Applications.fio,
                    Applications.cadastral_number,
                    Applications.phone,
                    Applications.address,
                    cls.model.create_date,
                    signed_case,
                )
                .join(Applications, cls.model.applications_id == Applications.id)
                .where(Applications.status == ApplicationStatus.COMMISSION_REVIEW)
                .order_by(signed_case.asc(), cls.model.id.asc())
            )

            result = await session.execute(query)
            return result.mappings().all()

    @classmethod
    async def search(cls, search_text: str, user_id: int):
        async with async_session_maker() as session:
            signed_case = case(
                (
                    exists().where(
                        (Signature.conclusion_id == cls.model.id)
                        & (Signature.users_id == user_id)
                        & (Signature.signed == True)
                    ),
                    True,
                ),
                else_=False,
            ).label("signed")

            query = (
                select(
                    cls.model.id.label("conclusion_id"),
                    Applications.id.label("application_id"),
                    Applications.fio,
                    Applications.cadastral_number,
                    Applications.phone,
                    Applications.address,
                    cls.model.create_date,
                    signed_case,
                )
                .join(Applications, cls.model.applications_id == Applications.id)
                .where(
                    or_(
                        Applications.cadastral_number.ilike(f"%{search_text}%"),
                        Applications.fio.ilike(f"%{search_text}%"),
                    )
                )
                .order_by(signed_case.asc(), cls.model.id.asc())
            )

            result = await session.execute(query)
            return result.mappings().all()

    @classmethod
    async def filter(
        cls,
        street: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
        signed: bool | None,
        user_id: int,
    ):
        async with async_session_maker() as session:
            signed_case = case(
                (
                    exists().where(
                        (Signature.conclusion_id == cls.model.id)
                        & (Signature.users_id == user_id)
                        & (Signature.signed == True)
                    ),
                    True,
                ),
                else_=False,
            ).label("signed")

            query = select(
                cls.model.id.label("conclusion_id"),
                Applications.id.label("application_id"),
                Applications.fio,
                Applications.cadastral_number,
                Applications.phone,
                Applications.address,
                cls.model.create_date,
                signed_case,
            ).join(Applications, cls.model.applications_id == Applications.id)

            if street:
                streets_list = [r.strip() for r in street.split(",") if r.strip()]
                query = query.filter(Applications.street.in_(streets_list))
            if date_from and date_to:
                query = query.where(cls.model.create_date.between(date_from, date_to))
            elif date_from:
                query = query.where(cls.model.create_date >= date_from)
            elif date_to:
                query = query.where(cls.model.create_date <= date_to)

            if signed:
                query = query.where(signed_case == True)
            else:
                query = query.where(signed_case == False)

            query = query.order_by(signed_case.asc(), cls.model.id.asc())

            result = await session.execute(query)
            return result.mappings().all()
