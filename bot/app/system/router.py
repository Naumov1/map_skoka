from loguru import logger
from aiogram import Router
from aiogram.filters import CommandStart, Command
from aiogram.types import Message

router = Router()


@router.message(CommandStart())
async def handle_start(message: Message):
    logger.info(f"Пользователь {message.chat.id} написал команду /start")
    await message.answer(
        "Добро пожаловать в <b>AI-агента ЖКХ</b>!\n\n"
        "Я помогу вам подготовить заявление о пригодности жилья.\n\n"
        "Для списка команд введите /help"
    )


@router.message(Command("help"))
async def handle_help(message: Message):
    logger.info(f"Пользователь {message.chat.id} написал команду /help")
    await message.answer(
        "<b>Доступные команды</b>:\n\n"
        "/start – начать работу\n"
        "/help – список команд\n"
        "/info – информация о боте\n"
        "/support – контакты поддержки\n"
        "/my – список всех поданных заявлений\n"
        "/end – список завершённых заявлений\n"
        "/current id – информация по заявлению\n"
        "/delete id – удаление заявления (если статус 'новое')"
    )


@router.message(Command("info"))
async def handle_info(message: Message):
    logger.info(f"Пользователь {message.chat.id} написал команду /info")
    await message.answer(
        f"<i>Ваш id: {message.from_user.id}</i>\n"
        "<b>Общая информация</b>\n\n"
        "Данный бот помогает жителям подготовить заявления "
        "на оценку пригодности жилых помещений.\n\n"
        "Как это работает:\n"
        "1. Вы вводите данные (ФИО, адрес, контакты и т. д.).\n"
        "2. AI-агент формирует заявление по шаблону.\n"
        "3. Вы получаете уведомление о статусе вашего заявления."
    )


@router.message(Command("support"))
async def handle_support(message: Message):
    await message.answer(
        "<b>Контакты поддержки</b>\n\n"
        "Email: support@example.com\n"
        "Телефон: +7 (999) 123-45-67"
    )
