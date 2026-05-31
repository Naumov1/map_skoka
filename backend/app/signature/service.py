from loguru import logger
from datetime import datetime
from app.applications.dao import ApplicationsDAO
from app.applications.models import ApplicationStatus, Applications
from app.conclusion.dao import ConclusionDAO
from app.conclusion.models import Conclusion
from app.exceptions import CommissionStatementNotFound, DocumentAlreadySigned
from app.notification.service import NotificationService
from app.service.base import ServiceBase
from app.signature.dao import SignatureDAO
from app.signature.models import Signature


class SignatureService(ServiceBase):
    @classmethod
    async def all(cls):
        signature_data = await SignatureDAO.all()
        return {"count": len(signature_data), "signatures": signature_data}

    @classmethod
    async def update_signature(cls, users_id: int, conclusion_id: int):
        signature_data: Signature = await SignatureDAO.find_one_or_none(
            users_id=users_id, conclusion_id=conclusion_id
        )
        if not signature_data:
            logger.warning(f"Документ №{conclusion_id} не найден")
            raise CommissionStatementNotFound

        if signature_data.signed:
            logger.warning(f"Документ №{conclusion_id} уже подписан")
            raise DocumentAlreadySigned

        signature_data: Signature = await SignatureDAO.update(signature_data.id)

        conclusion_data: Conclusion = await ConclusionDAO.find_one_or_none(
            id=conclusion_id
        )

        if not conclusion_data:
            logger.warning(f"Документ №{conclusion_id} уже подписан")
            raise CommissionStatementNotFound

        applications_data: Applications = await ApplicationsDAO.find_one_or_none(
            id=conclusion_data.applications_id
        )

        # Проверка что все подписали заявление
        conclusion_data_list = await SignatureDAO.find_all(conclusion_id=conclusion_id)
        signed_all = True
        for conclusion_user in conclusion_data_list:
            if conclusion_user.get("signed", False) == False:
                signed_all = False
                break

        if signed_all:
            # Уведомление для пользователя
            for conclusion_user in conclusion_data_list:
                await NotificationService.send_notification(
                    user_id=int(conclusion_user.get("users_id")),
                    text=f"Все члены комисси подписали заявление №{conclusion_id}",
                )
            await NotificationService.send_notification(
                user_id=applications_data.user_id,
                text=f"Работы по вашему заявлению №{applications_data.id} завершены",
            )
            await ApplicationsDAO.update(applications_data.id, ApplicationStatus.COMMISSION_RESULT)
        return {"detail": "Заявление успешно подписано"}

    @classmethod
    async def search_signature(cls, text: str):
        signatures_data = await SignatureDAO.search(text)
        return {"count": len(signatures_data), "signatures": signatures_data}

    @classmethod
    async def filter_signature(
        cls,
        street: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
    ):
        signatures_data = await SignatureDAO.filter(street, date_from, date_to)
        return {"count": len(signatures_data), "signatures": signatures_data}
