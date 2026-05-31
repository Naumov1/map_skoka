from loguru import logger
from app.config import broker


async def send_input_agent(tg_id: int, text: str) -> bool:
    """Отправка данных в брокер

    Args:
        tg_id (int): id в тг
        text (str): Текст вопроса для агента

    Returns:
        bool: True если все успешно отправлено, False если произошла ошибка
    """
    try:
        await broker.publish(
            {"tg_id": tg_id, "text": text},
            queue="input_agent",
            content_type="application/json",
        )
    except Exception as e:
        logger.error(f"Ошибка отправки данных в брокер input_agent: {e}")
        return False
    logger.info("Отправка данных в брокер input_agent")
    return True


async def create_application(user_id: int, data: dict) -> bool:
    try:
        await broker.publish(
            {"user_id": user_id, "data": data},
            queue="applications",
            content_type="application/json",
        )
    except Exception as e:
        logger.error(f"Ошибка отправки заявления в брокер applications: {e}")
        return False
    logger.info(f"Заявление отправлено в брокер applications для пользователя {user_id}")
    return True


async def my_applications(tg_id: int):
    logger.info(f"Отправка данных в брокер my_applications: {tg_id}")
    try:
        response = await broker.request(
            {"tg_id": tg_id, "user_id": tg_id},
            queue="my_applications",
            content_type="application/json",
        )
        logger.info(f"Получены данные")
    except Exception as e:
        logger.error(f"Ошибка отправки данных в брокер my_applications: {e}")
        return None
    return await response.decode()


async def detail_applications(tg_id: int, applications_id: int):
    logger.info(f"Отправка данных в брокер detail_applications: {tg_id}")
    try:
        response = await broker.request(
            {
                "tg_id": tg_id,
                "user_id": tg_id,
                "applications_id": applications_id,
            },
            queue="detail_applications",
            content_type="application/json",
        )
    except Exception as e:
        logger.error(f"Ошибка отправки данных в брокер detail_applications: {e}")
        return None
    return await response.decode()


async def detail_conclusion(tg_id: int, conclusion_id: int):
    logger.info(f"Отправка данных в брокер detail_conclusion: {tg_id}")
    try:
        response = await broker.request(
            {
                "tg_id": tg_id,
                "user_id": tg_id,
                "conclusion_id": conclusion_id,
            },
            queue="detail_conclusion",
            content_type="application/json",
        )
    except Exception as e:
        logger.error(f"Ошибка отправки данных в брокер detail_conclusion: {e}")
        return None
    return await response.decode()
