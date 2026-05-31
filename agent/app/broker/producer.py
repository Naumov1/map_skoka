from loguru import logger
from pydantic import BaseModel
from app.config import router_rabbitmq


class TgData(BaseModel):
    tg_id: int
    text: str


async def send_application(tg_id: int, data: dict) -> bool:
    """Создание заявки от гражданина в основной сервис

    Args:
        tg_id (int): id в тг
        data (dict): данные заявки

    Returns:
        bool: True если все успешно отправлено, False если произошла ошибка
    """
    try:
        await router_rabbitmq.broker.publish(
            {"tg_id": tg_id, "user_id": tg_id, "data": data},
            queue="applications",
            content_type="application/json",
        )
        logger.debug("applications ->")
    except Exception as e:
        logger.error(f"Ошибка отправки application: {e}")
        return False
    return True


async def send_output_agent(agent_data: TgData) -> bool:
    """Отправка ответа от агента в брокер для пользователя тг

    Args:
        agent_data (TgData): данные ответа

    Returns:
        bool: True если все прошло успешно, False если где-то произошла ошибка
    """
    try:
        await router_rabbitmq.broker.publish(
            agent_data.model_dump(),
            queue="output_agent",
            content_type="application/json",
        )
        logger.debug("output_agent ->")
    except Exception as e:
        logger.error(f"Ошибка отправки output_agent: {e}")
        return False
    return True
