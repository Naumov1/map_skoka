from loguru import logger
from app.notification.dao import NotificationDAO
from app.notification.models import Notification
from app.notification.schemas import ResponseNotificationList
from app.schemas.base import ResponseDetail
from app.service.base import BaseService


class NotificationService(BaseService):
    dao = NotificationDAO
    model = Notification

    @classmethod
    async def all_notification(cls, user_id: int) -> ResponseNotificationList:
        notification_data: Notification = await NotificationDAO.find_all(
            user_id=user_id
        )
        notification_count: str = await NotificationDAO.my_count(user_id=user_id)
        return {"count": notification_count, "notification": notification_data}

    @classmethod
    async def update(cls, id: int) -> ResponseDetail:
        await NotificationDAO.update(id)
        return {"detail": "Уведомление успешно прочитано"}

    @classmethod
    async def read_all(cls, user_id: int) -> ResponseDetail:
        await NotificationDAO.read_all(user_id=user_id)
        return {"detail": "Все уведомления прочитаны"}

    @classmethod
    async def delete(cls, id: int) -> ResponseDetail:
        await NotificationDAO.delete(id)
        return {"detail": "Уведомление успешно удалено"}