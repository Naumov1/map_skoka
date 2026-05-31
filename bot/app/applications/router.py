import json

from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

from app.applications.keyboard import applications_keyboard, conclusions_download_keyboard
from app.applications.service import ApplicationsService
from app.broker.producer import detail_applications, detail_conclusion, my_applications
from app.config import redis


router = Router()


@router.message(Command("my"))
async def handle_all(message: Message):
    tg_id = message.from_user.id
    applications = await my_applications(tg_id)
    if not applications:
        await message.answer(
            "Ошибка при получении списка заявлений, попробуйте повторить запрос позже"
        )
        return

    data = applications.get("applications")
    if not data:
        await message.answer(text="У вас нет заявлений.")
        return

    await redis.set(f"my_applications_{tg_id}", json.dumps(applications), ex=600)

    page = 0
    total = len(data)
    app = data[page]
    text = await ApplicationsService.format_application(app, page, total)

    await message.answer(
        text=text,
        reply_markup=applications_keyboard(page, total, app["id"]),
    )


@router.message(Command("end"))
async def handle_end(message: Message):
    parts = message.text.split()
    if len(parts) < 2 or not parts[1].isdigit():
        await message.answer("Укажите ID заявления. Пример: /end 3")
        return

    tg_id = message.from_user.id
    app_id = int(parts[1])
    conclusions = await detail_conclusion(tg_id, app_id)
    if not conclusions:
        await message.answer("Не удалось загрузить заявление")
        return

    conclusion = conclusions.get("conclusions") or {}
    await message.answer(
        f"<b>Заявление №{conclusion.get('applications_id')}</b>\n\n"
        "Статус: результат комиссии готов",
        reply_markup=conclusions_download_keyboard(conclusion.get("file_url")),
    )


@router.message(Command("current"))
async def handle_current(message: Message):
    parts = message.text.split()
    if len(parts) < 2 or not parts[1].isdigit():
        await message.answer("Укажите ID заявления. Пример: /current 3")
        return

    tg_id = message.from_user.id
    app_id = int(parts[1])
    applications = await detail_applications(tg_id, app_id)
    if not applications:
        await message.answer("Не удалось загрузить заявление")
        return

    application = applications.get("applications") or {}
    await message.answer(
        f"<b>Заявление #{app_id}</b>\n\n"
        f"ФИО: {application.get('fio', 'Не найдено')}\n"
        f"Адрес: {application.get('address', 'Не найдено')}\n"
        f"Телефон: {application.get('phone', 'Не найдено')}\n"
        f"Email: {application.get('email', 'Не найдено')}\n\n"
        f"Статус: {application.get('status', 'Не найдено')}\n"
    )
