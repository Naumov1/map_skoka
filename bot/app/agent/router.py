from loguru import logger
from aiogram import F, Router
from aiogram.types import Message

from app.broker.producer import send_input_agent


router = Router()


@router.message(F.text & ~F.text.startswith("/"))
async def send_agent(message: Message):
    tg_id = message.chat.id
    text = message.text
    logger.info(f"Получено сообщение от пользователя: {text} ({tg_id})")

    status = await send_input_agent(tg_id=tg_id, text=text)
    if not status:
        logger.error("Ошибка отправки данных в брокер")
        await message.answer(
            "Произошла ошибка при отправке сообщения, повторите отправку сообщения позже"
        )
        return False
    logger.debug("Данные успешно отправлены")
    await message.answer("Ваши данные отправлены AI-агенту, ожидайте ответ...")
    return True
