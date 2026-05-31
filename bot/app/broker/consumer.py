from datetime import datetime
from typing import List
from aiogram import Router
from loguru import logger
from pydantic import BaseModel
from app.config import broker, bot, settings


class Applications(BaseModel):
    id: int
    tg_id: int
    fio: str
    phone: str
    email: str
    cadastral_number: str
    address: str
    street: str
    file_url: str
    status: str
    departure_date: datetime | None = None


class ApplicationsMy(BaseModel):
    tg_id: int
    applications: List[Applications]


class TgData(BaseModel):
    tg_id: int
    text: str


router = Router()
vk_client = None


def set_vk_client(client):
    global vk_client
    vk_client = client


async def send_user_message(user_id: int, text: str):
    if settings.BOT_PLATFORM.lower() == "vk":
        if vk_client is None:
            logger.error("VK client is not ready")
            return
        await vk_client.send_message(user_id=user_id, text=text)
        return

    if bot is None:
        logger.error("Telegram bot is not ready")
        return
    await bot.send_message(chat_id=user_id, text=text)


@broker.subscriber("notification")
async def notification_user(data: TgData):
    """Получение уведомления из брокера и отправка его пользователю

    Args:
        data (TgData): данные из брокера
    """
    logger.info("Получение данных брокера из notification")
    await send_user_message(user_id=data.tg_id, text=data.text)


@broker.subscriber("output_agent")
async def output_agent_messages(data: TgData):
    """Получение ответа от агента и отправка его пользователю

    Args:
        data (ApplicationsMy): данные из брокера
    """
    logger.info("Получение данных брокера из output_agent")
    await send_user_message(user_id=data.tg_id, text=data.text)
