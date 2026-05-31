from loguru import logger

from app.config import broker_router
from app.notification.dao import NotificationDAO
from app.notification.schemas import ProducerSendNotification


class NotificationService:
    @classmethod
    async def send_notification(cls, user_id: int, text: str):
        try:
            await NotificationDAO.add(user_id=user_id, text=text)
        except Exception as e:
            logger.warning(f"Failed save notification ({user_id}): {e}")

        try:
            response = await broker_router.broker.publish(
                ProducerSendNotification(user_id=user_id, text=text).model_dump_json(),
                queue="send_notification",
                content_type="application/json",
            )
        except Exception as e:
            logger.warning(f"Failed publish notification ({user_id}): {e}")
            return False
        if not response:
            logger.warning(f"Failed publish notification ({user_id}): empty broker response")
            return False
        return True
