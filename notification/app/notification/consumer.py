from loguru import logger
from app.config import broker_router
from app.notification.dao import NotificationDAO
from app.notification.schemas import ConsumerSendNotification


@broker_router.subscriber("send_notification")
async def send_notification(message: ConsumerSendNotification):
    logger.debug(f"Получения сообщения для пользователя")
    try:
        user_id = message.user_id
        text = message.text
        await NotificationDAO.add(user_id, text)
    except Exception as e:
        logger.error(f"Ошибка при получении сообщения для пользователя: {e}")
        return False
    logger.debug(f"Сообщение для пользователя успешно получено")
    return True
